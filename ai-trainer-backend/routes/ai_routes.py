
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
import tempfile
from database import db
from datetime import datetime

load_dotenv()

router = APIRouter()

sessions_col      = db["sessions"]
notifications_col = db["notifications"]

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise ValueError("❌ OPENAI_API_KEY missing in .env")

client = OpenAI(api_key=API_KEY)


# ══════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════
class QuestionRequest(BaseModel):
    field: str
    experienceLevel: str
    interviewType: str
    previousQuestions: list[str] = []
    userContext: str = ""

class AnswerRequest(BaseModel):
    field: str
    experienceLevel: str
    interviewType: str
    answer: str
    language: str = "English"

class AdaptiveRequest(BaseModel):
    field: str
    experienceLevel: str
    interviewType: str
    answer: str = ""
    previousQuestions: list[str] = []
    userContext: str = ""
    mode: str = ""
    language: str = "English"
    camera_metrics: dict = {}
    username: str = "anonymous"
    question: str = ""

class ResumeRequest(BaseModel):
    skills: str
    field: str = ""
    experienceLevel: str = ""
    language: str = "English"


# ══════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════
def safe_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        return None

def lang_instruction(language: str) -> str:
    if language == "Urdu":
        return ("IMPORTANT: You MUST respond entirely in Urdu (اردو). "
                "All feedback, questions, and text must be written in Urdu script. "
                "Do NOT use English anywhere in your response.")
    return "Respond in English."

def fallback_question(language: str) -> str:
    return ("آپ اپنے سب سے مشکل پروجیکٹ کے بارے میں بتائیں۔"
            if language == "Urdu"
            else "Tell me about your most challenging project.")

def fallback_feedback(language: str) -> dict:
    if language == "Urdu":
        return {
            "clarity": "جواب واضح نہیں تھا۔",
            "confidence": "مزید اعتماد کی ضرورت ہے۔",
            "technical_depth": "تکنیکی گہرائی کم تھی۔",
            "overall_feedback": "جواب بہتر کیا جا سکتا ہے۔",
            "ideal_answer": "مخصوص مثالیں ہونی چاہیے۔",
            "improvement_tips": "مخصوص مثالیں دیں۔",
            "score": 5
        }
    return {
        "clarity": "Answer could be clearer.",
        "confidence": "Show more confidence.",
        "technical_depth": "Add more technical depth.",
        "overall_feedback": "Good effort, room to improve.",
        "ideal_answer": "An ideal answer includes specific examples.",
        "improvement_tips": "Use the STAR method for structure.",
        "score": 5
    }

def feedback_to_score(feedback: dict) -> int:
    raw = feedback.get("score")
    if raw is not None:
        try:
            return max(0, min(100, int(float(str(raw))) * 10))
        except Exception:
            pass
    text = str(feedback.get("overall_feedback", "")).lower()
    pos  = sum(1 for w in ["excellent", "great", "strong", "good", "solid", "well", "perfect", "impressive"] if w in text)
    neg  = sum(1 for w in ["poor", "weak", "unclear", "needs", "lacking", "missing", "improve", "vague"] if w in text)
    return max(10, min(95, 60 + pos * 8 - neg * 8))

def get_interview_type_instruction(interview_type: str) -> str:
    mapping = {
        "Technical":     "technical and code/system/concept-focused — ask about implementation, debugging, algorithms, or tools",
        "Behavioral":    "behavioral — ask a STAR-method scenario question about past experiences, teamwork, or conflict resolution",
        "System Design": "system design and architecture-focused — ask the candidate to design or scale a real-world system",
        "HR":            "HR/culture-fit focused — ask about motivation, career goals, or workplace values",
    }
    return mapping.get(interview_type, f"{interview_type}-focused")

def is_duplicate(new_q: str, previous: list[str], threshold: float = 0.6) -> bool:
    """Check if new question is too similar to any previous question."""
    new_q_lower = new_q.lower().strip()
    new_words   = set(new_q_lower.split())

    for old_q in previous:
        old_lower = old_q.lower().strip()
        old_words = set(old_lower.split())

        # Exact match
        if new_q_lower == old_lower:
            return True

        # Word overlap ratio (Jaccard similarity)
        if not new_words or not old_words:
            continue
        intersection = new_words & old_words
        union        = new_words | old_words
        similarity   = len(intersection) / len(union)

        if similarity >= threshold:
            return True

    return False

def save_notification(username: str, notif_type: str, icon: str,
                      title: str, message: str):
    try:
        notifications_col.insert_one({
            "username": username,
            "type":     notif_type,
            "icon":     icon,
            "title":    title,
            "message":  message,
            "read":     False,
            "date":     datetime.utcnow().isoformat(),
        })
    except Exception as e:
        print(f"Notification save error: {e}")

def save_interview_session(username, feedback, field,
                           experience_level, interview_type, language, answer):
    try:
        overall_score = feedback_to_score(feedback)
        sessions_col.insert_one({
            "username":         username,
            "type":             "Interview",
            "date":             datetime.utcnow().isoformat(),
            "overall_score":    overall_score,
            "field":            field,
            "experience_level": experience_level,
            "interview_type":   interview_type,
            "language":         language,
            "word_count":       len(answer.split()),
            "feedback_summary": feedback.get("overall_feedback", ""),
        })

        tips = feedback.get("improvement_tips", "")
        if isinstance(tips, list) and tips:
            tip_text = tips[0]
        elif isinstance(tips, str) and tips:
            tip_text = tips.split(".")[0].strip() + "."
        else:
            tip_text = "Review your feedback for detailed improvement tips."

        save_notification(
            username   = username,
            notif_type = "feedback",
            icon       = "📊",
            title      = f"Interview Feedback — {field} ({experience_level})",
            message    = (
                f"Score: {overall_score}% · {interview_type} interview completed. "
                f"Tip: {tip_text}"
            ),
        )

        total = sessions_col.count_documents({"username": username, "type": "Interview"})
        if total in (5, 10, 20, 50):
            save_notification(
                username   = username,
                notif_type = "streak",
                icon       = "🏆",
                title      = f"Achievement: {total} Interview Sessions!",
                message    = (
                    f"You have completed {total} interview practice sessions. "
                    "Your dedication is paying off — keep pushing!"
                ),
            )

    except Exception as e:
        print(f"Interview session save error: {e}")


# ══════════════════════════════════════════
# QUESTION GENERATOR (with retry)
# ══════════════════════════════════════════
def _call_gpt_for_question(prompt: str, system: str, temperature: float = 0.8) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt},
        ],
        temperature=temperature,
    )
    text = response.choices[0].message.content.strip()
    for prefix in ["Question:", "سوال:", "Q:", "Q."]:
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    return text

def generate_unique_question(
    field: str, experience_level: str, interview_type: str,
    language: str, user_context: str,
    previous_questions: list[str],
    type_instruction: str,
    lang_note: str,
    max_retries: int = 4,
) -> str:
    """Call GPT up to max_retries times until a non-duplicate question is returned."""

    previous_str = "\n".join(f"- {q}" for q in previous_questions) if previous_questions else "None"

    system_msg = f"You are a FAANG {field} interviewer. {lang_note} Never repeat or rephrase any previously asked question."

    for attempt in range(max_retries):
        # Increase temperature slightly on each retry to force more variety
        temperature = min(0.8 + attempt * 0.07, 1.1)

        prompt = f"""
{lang_note}
You are a strict FAANG-level {field} interviewer.
The candidate is applying for a {experience_level}-level {field} role.
Interview type: {interview_type}

Ask exactly ONE interview question (max 15 words) that is:
- {type_instruction}
- Specifically and directly relevant to {field}
- Appropriately challenging for a {experience_level}-level candidate
{"- Additional context: " + user_context if user_context else ""}

STRICTLY DO NOT repeat or rephrase any of these already-asked questions:
{previous_str}

{"This is retry attempt " + str(attempt + 1) + " — generate a completely DIFFERENT question topic." if attempt > 0 else ""}

Return ONLY the question — no label, no preamble, no explanation.
"""
        new_q = _call_gpt_for_question(prompt, system_msg, temperature)

        if not is_duplicate(new_q, previous_questions):
            print(f"✅ Unique question on attempt {attempt + 1}: {new_q}")
            return new_q
        else:
            print(f"⚠️  Duplicate detected (attempt {attempt + 1}), retrying... | Q: {new_q}")

    # All retries gave duplicates — return last generated anyway (rare edge case)
    print("⚠️  All retries gave similar questions, returning last one.")
    return new_q


# ══════════════════════════════════════════
# 🧠 ADAPTIVE + SMART ROUTE
# ══════════════════════════════════════════
@router.post("/generate-question")
def generate_question(data: AdaptiveRequest):
    try:
        previous         = data.previousQuestions[-20:]   # keep last 20
        lang_note        = lang_instruction(data.language)
        type_instruction = get_interview_type_instruction(data.interviewType)

        # ── ADAPTIVE MODE: evaluate answer + generate follow-up ──────────
        if data.mode == "adaptive":
            cam_note = ""
            if data.camera_metrics:
                m = data.camera_metrics
                cam_note = (
                    f"\nCamera Analysis:\n"
                    f"- Engagement : {m.get('avg_engagement', 'N/A')}%\n"
                    f"- Eye Contact: {m.get('avg_eye_contact', 'N/A')}%\n"
                    f"- Posture    : {m.get('avg_posture', 'N/A')}%\n"
                    f"- Emotion    : {m.get('dominant_emotion', 'N/A')}\n"
                )

            previous_str = "\n".join(f"- {q}" for q in previous) if previous else "None"

            prompt = f"""
{lang_note}
You are a strict FAANG-level {data.field} interviewer conducting a {data.interviewType} interview.
Candidate level: {data.experienceLevel}
{cam_note}

QUESTION THAT WAS ASKED:
"{data.question or 'General interview question'}"

CANDIDATE'S ANSWER:
"{data.answer}"

Already asked questions — DO NOT repeat or rephrase any of these:
{previous_str}

TASK:
1. Evaluate the candidate's answer to the EXACT question above.
   CRITICAL RULES for feedback fields:
   - "ideal_answer": Write a concise model answer to the question "{data.question or 'the question asked'}" in 2-3 sentences max.
     Cover the key points a top candidate would mention — no long paragraphs, no bullet lists, straight to the point.
   - "clarity": How clearly did the candidate communicate their answer?
   - "confidence": How confident did the candidate sound based on their response?
   - "technical_depth": How deep was the technical/domain knowledge shown?
   - "overall_feedback": Holistic evaluation of the candidate's response to this specific question.
   - "improvement_tips": Concrete tips to improve their answer to THIS type of question.
   - "score": Numeric score 0-10 based on how well they answered the question asked.

2. Generate ONE follow-up {data.interviewType} question (max 15 words).
   - Must be {type_instruction}
   - Must be specific to {data.field} and {data.experienceLevel} level
   - Must be COMPLETELY DIFFERENT in topic from all previously asked questions above

Return ONLY valid JSON — no preamble, no markdown:
{{
  "feedback": {{
    "clarity": "...",
    "confidence": "...",
    "technical_depth": "...",
    "overall_feedback": "...",
    "ideal_answer": "...",
    "improvement_tips": "...",
    "score": <0-10>
  }},
  "next_question": "..."
}}"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": (
                        f"You are a strict FAANG {data.field} interviewer. {lang_note} "
                        "ideal_answer must be a 2-3 sentence model answer to the exact question asked. "
                        "next_question must be on a completely different topic from all previously asked questions."
                    )},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
            )

            raw    = response.choices[0].message.content.strip()
            parsed = safe_json(raw)

            if not parsed:
                parsed = {
                    "feedback":      fallback_feedback(data.language),
                    "next_question": fallback_question(data.language),
                }
            else:
                if "feedback" not in parsed:
                    parsed["feedback"] = fallback_feedback(data.language)

                # Dedup check on next_question from adaptive mode too
                next_q = parsed.get("next_question", "")
                if not next_q or is_duplicate(next_q, previous):
                    print("⚠️  Adaptive next_question duplicate — regenerating...")
                    next_q = generate_unique_question(
                        field=data.field, experience_level=data.experienceLevel,
                        interview_type=data.interviewType, language=data.language,
                        user_context=data.userContext, previous_questions=previous,
                        type_instruction=type_instruction, lang_note=lang_note,
                    )
                parsed["next_question"] = next_q

            save_interview_session(
                username         = data.username,
                feedback         = parsed["feedback"],
                field            = data.field,
                experience_level = data.experienceLevel,
                interview_type   = data.interviewType,
                language         = data.language,
                answer           = data.answer,
            )

            return parsed

        # ── QUESTION GENERATION ONLY ──────────────────────────────────────
        unique_q = generate_unique_question(
            field            = data.field,
            experience_level = data.experienceLevel,
            interview_type   = data.interviewType,
            language         = data.language,
            user_context     = data.userContext,
            previous_questions = previous,
            type_instruction = type_instruction,
            lang_note        = lang_note,
        )
        return {"question": unique_q}

    except Exception as e:
        print("❌ ERROR in generate_question:", e)
        return {
            "question": fallback_question(data.language),
            "feedback": fallback_feedback(data.language),
        }


# ══════════════════════════════════════════
# ANSWER EVALUATION
# ══════════════════════════════════════════
@router.post("/evaluate-answer")
def evaluate_answer(data: AnswerRequest):
    try:
        lang_note = lang_instruction(data.language)
        prompt = f"""
{lang_note}
You are a strict FAANG-level {data.field} interviewer evaluating a {data.interviewType} interview answer.
Candidate level: {data.experienceLevel}

Candidate's answer:
"{data.answer}"

Evaluate and return ONLY valid JSON — no markdown, no preamble:
{{
  "clarity": "...",
  "confidence": "...",
  "technical_depth": "...",
  "overall_feedback": "...",
  "ideal_answer": "A concise 2-3 sentence model answer for this {data.field} {data.interviewType} question — key points only, no long paragraphs",
  "improvement_tips": "...",
  "score": <0-10>
}}
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"Strict FAANG {data.field} interviewer. {lang_note}"},
                {"role": "user",   "content": prompt},
            ],
        )
        raw    = response.choices[0].message.content.strip()
        parsed = safe_json(raw)
        return {"feedback": parsed or fallback_feedback(data.language)}

    except Exception as e:
        print("❌ ERROR evaluate_answer:", e)
        return {"feedback": fallback_feedback(data.language)}


# ══════════════════════════════════════════
# RESUME GENERATION
# ══════════════════════════════════════════
@router.post("/generate-resume")
def generate_resume(data: ResumeRequest):
    try:
        lang_note = lang_instruction(data.language)
        prompt = f"""
{lang_note}
You are a professional CV writer.
Write a concise resume summary (3-4 sentences, under 80 words).
Role: {data.field or "General"}, Level: {data.experienceLevel or "General"}
Skills: {data.skills}
Rules: first person, specific skills, no title, no extra text.
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"Professional resume writer. {lang_note}"},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.7,
        )
        return {"resume": response.choices[0].message.content.strip()}

    except Exception as e:
        print("❌ ERROR generate_resume:", e)
        return {
            "resume": "Error generating resume. Please try again."
                      if data.language != "Urdu"
                      else "ریزومے بنانے میں خرابی آئی۔"
        }


# ══════════════════════════════════════════
# AUDIO TRANSCRIPTION
# ══════════════════════════════════════════
@router.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        with open(tmp_path, "rb") as af:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=af)
        return {"text": transcript.text}
    except Exception as e:
        print("❌ Transcription error:", e)
        return {"text": ""}