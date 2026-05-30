
from fastapi import APIRouter
from openai import OpenAI
from database import db
from datetime import datetime
import os, json, re
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── MongoDB collections ───────────────────────────────────────────────────────
sessions_col      = db["sessions"]
notifications_col = db["notifications"]

# ── Filler words ──────────────────────────────────────────────────────────────
FILLERS_EN = ["um","uh","like","you know","basically","actually","so","i mean",
              "right","okay","well","just","literally"]
FILLERS_UR = ["یعنی","مطلب","بس","اور","پھر","تو","کیا","نا","ہاں","واقعی",
              "اصل میں","سمجھے","ٹھیک ہے","آپ جانتے ہیں"]

def detect_fillers(text: str, language: str = "English"):
    fillers = FILLERS_UR if language == "Urdu" else FILLERS_EN
    lower   = text.lower()
    breakdown, total = {}, 0
    for w in fillers:
        n = len(re.findall(rf"\b{re.escape(w)}\b", lower))
        if n: breakdown[w] = n; total += n
    return breakdown, total

def clamp(val, lo=0, hi=10):
    try: return max(lo, min(hi, int(float(val))))
    except: return 5

def camera_adjustments(camera_metrics: dict) -> dict:
    if not camera_metrics: return {}
    deltas = {}
    eye  = float(camera_metrics.get("avg_eye_contact", 50) or 50)
    eng  = float(camera_metrics.get("avg_engagement",  50) or 50)
    pose = float(camera_metrics.get("avg_posture",     50) or 50)
    emo  = str(camera_metrics.get("dominant_emotion", "neutral") or "neutral").lower()
    if eye  > 70: deltas["confidence"]  = 1
    elif eye < 35: deltas["confidence"] = -1
    if eng  > 70: deltas["engagement"]  = 1
    elif eng < 30: deltas["engagement"] = -1
    if pose > 70: deltas["confidence"]  = deltas.get("confidence", 0) + 1
    elif pose < 35: deltas["confidence"]= deltas.get("confidence", 0) - 1
    if emo in ("happy","surprised"): deltas["engagement"] = deltas.get("engagement",0)+1
    elif emo in ("fear","sad","angry"): deltas["engagement"] = deltas.get("engagement",0)-1
    return deltas


# ── Save notification helper ──────────────────────────────────────────────────
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


@router.post("/presentation-feedback")
def presentation_feedback(data: dict):
    try:
        transcript     = data.get("transcript", "").strip()
        duration       = data.get("duration",   5)
        language       = data.get("language",   "English")
        camera_metrics = data.get("camera_metrics", None)
        username       = data.get("username", "anonymous")

        word_count               = len(transcript.split())
        filler_map, filler_total = detect_fillers(transcript, language)

        cam_ctx = ""
        if camera_metrics:
            cam_ctx = f"""
CAMERA ANALYSIS DATA:
- Engagement:  {camera_metrics.get('avg_engagement','—')}%
- Eye Contact: {camera_metrics.get('avg_eye_contact','—')}%
- Posture:     {camera_metrics.get('avg_posture','—')}%
- Emotion:     {camera_metrics.get('dominant_emotion','—')}
Adjust confidence/engagement scores accordingly.
"""
        if language == "Urdu":
            lang_instruction = """
The transcript is in URDU. Please:
1. Evaluate the speech in Urdu context
2. Write ALL tips, summary in URDU
3. Consider Urdu speech patterns
4. Be culturally appropriate for Pakistani/South Asian presentations
"""
        else:
            lang_instruction = "The transcript is in English. Evaluate accordingly."

        prompt = f"""You are a strict, expert presentation coach.

TRANSCRIPT ({word_count} words, Language: {language}):
"{transcript}"

FILLER WORDS: {filler_total} total — {json.dumps(filler_map, ensure_ascii=False)}
DURATION SETTING: {duration} minutes
{cam_ctx}
{lang_instruction}

SCORING RULES — each metric INDEPENDENT (integer 0-10):
CONFIDENCE: assertive→7-9, hedging→3-5, <20 words→max 3
CLARITY: clear structure→7-9, rambling→2-5
FLUENCY: start 8, subtract for fillers; <15 words→max 3
ENGAGEMENT: vivid/energy→7-9, dry→3-5

CRITICAL: SCORES MUST VARY. Be honest.

Return ONLY valid JSON (no markdown):
{{
  "scores": {{"confidence":<0-10>,"clarity":<0-10>,"fluency":<0-10>,"engagement":<0-10>}},
  "tips": ["tip1","tip2","tip3"],
  "summary": "2 honest sentences"
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role":"system","content":f"Strict presentation coach. Return ONLY valid JSON. Tips in {language}."},
                {"role":"user","content":prompt},
            ],
            temperature=0.7,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```[a-z]*\n?","",raw).rstrip("```").strip()

        try:
            result = json.loads(raw)
        except Exception:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            result = json.loads(match.group()) if match else {
                "scores":{"confidence":5,"clarity":6,"fluency":7,"engagement":4},
                "tips":["Please try again" if language=="English" else "دوبارہ کوشش کریں"],
                "summary":"Could not parse response.",
            }

        scores = result.get("scores", {})
        for k in ["confidence","clarity","fluency","engagement"]:
            scores[k] = clamp(scores.get(k,5))

        if word_count < 15:
            for k in scores: scores[k] = min(scores[k],2)
        elif word_count < 30:
            for k in scores: scores[k] = min(scores[k],4)
        elif word_count < 50:
            for k in scores: scores[k] = min(scores[k],6)

        pen = min(4, filler_total // 2)
        scores["fluency"] = max(0, scores["fluency"] - pen)

        deltas = camera_adjustments(camera_metrics)
        for k, d in deltas.items():
            if k in scores: scores[k] = max(0, min(10, scores[k]+d))

        if camera_metrics:
            eye  = float(camera_metrics.get("avg_eye_contact",50) or 50)
            pose = float(camera_metrics.get("avg_posture",50) or 50)
            emo  = str(camera_metrics.get("dominant_emotion","neutral") or "neutral").lower()
            cam_tips = []
            if eye  < 45: cam_tips.append("Maintain more eye contact with the camera." if language=="English" else "کیمرے سے آنکھ ملا کر بات کریں۔")
            if pose < 40: cam_tips.append("Sit upright and face the camera directly." if language=="English" else "سیدھے بیٹھیں۔")
            if emo in ("fear","sad","angry"):
                cam_tips.append(f"Your expression looked {emo} — try to project more confidence." if language=="English"
                               else f"آپ کا چہرہ {emo} لگ رہا تھا — اعتماد سے بات کریں۔")
            result["tips"] = list(result.get("tips",[])) + cam_tips
            result["camera_metrics"] = camera_metrics

        result["scores"]       = scores
        result["filler_words"] = {"total_count":filler_total,"breakdown":filler_map}
        result["language"]     = language

        # ── Save session ──────────────────────────────────────────────────
        try:
            overall_score = round(
                (scores.get("confidence",0)+scores.get("clarity",0)+
                 scores.get("fluency",0)+scores.get("engagement",0))/4*10
            )
            sessions_col.insert_one({
                "username":      username,
                "type":          "Presentation",
                "date":          datetime.utcnow().isoformat(),
                "overall_score": overall_score,
                "scores":        scores,
                "language":      language,
                "word_count":    word_count,
            })

            # ── Save notification ─────────────────────────────────────────
            fluency_score = scores.get("fluency", 0)
            conf_score    = scores.get("confidence", 0)
            tips_list     = result.get("tips", [])
            tip_text      = tips_list[0] if tips_list else "Keep practicing for better results."

            save_notification(
                username  = username,
                notif_type= "session",
                icon      = "🎤",
                title     = "Presentation Session Complete",
                message   = (
                    f"Score: {overall_score}% · "
                    f"Fluency {fluency_score}/10 · Confidence {conf_score}/10. "
                    f"Tip: {tip_text}"
                ),
            )

            # Streak notification — check if 3+ sessions in last 3 days
            from datetime import timedelta
            three_days_ago = (datetime.utcnow() - timedelta(days=3)).isoformat()
            recent_count = sessions_col.count_documents({
                "username": username,
                "date": {"$gte": three_days_ago}
            })
            if recent_count in (3, 5, 10, 25, 50):
                save_notification(
                    username  = username,
                    notif_type= "streak",
                    icon      = "🔥",
                    title     = f"{recent_count}-Session Milestone!",
                    message   = (
                        f"You have completed {recent_count} sessions in the last 3 days. "
                        "Consistency is the key to improvement. Keep it up!"
                    ),
                )

        except Exception as save_err:
            print(f"Session/notification save error: {save_err}")

        return result

    except Exception as e:
        return {
            "scores":      {"confidence":4,"clarity":6,"fluency":7,"engagement":3},
            "tips":        [f"Error: {str(e)}"],
            "summary":     "Server error." if data.get("language")!="Urdu" else "سرور میں خرابی آئی۔",
            "filler_words":{"total_count":0,"breakdown":{}},
        }