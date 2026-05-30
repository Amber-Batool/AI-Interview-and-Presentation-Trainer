
import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const FACEAPI_CDN = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODEL_URL   = "https://justadudewhohacks.github.io/face-api.js/models";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed: ${src}`));
    document.head.appendChild(s);
  });
}

const FILLERS = ["um","uh","like","you know","basically","actually","so","i mean","right","okay","well","just","literally"];

function countFillers(text) {
  const lower = text.toLowerCase();
  let total = 0; const breakdown = {};
  for (const w of FILLERS) {
    const n = (lower.match(new RegExp(`\\b${w}\\b`, "g")) || []).length;
    if (n) { breakdown[w] = n; total += n; }
  }
  return { total, breakdown };
}

function liveFluency(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return 0;
  const { total } = countFillers(text);
  const ratio = total / words.length;
  let score = 8;
  if (ratio > 0.15) score -= 3;
  else if (ratio > 0.08) score -= 2;
  else if (ratio > 0.03) score -= 1;
  if (words.length < 10) score = Math.min(score, 4);
  return Math.max(0, Math.min(10, score));
}

function liveConfidence(text) {
  if (text.length < 10) return 0;
  const lower = text.toLowerCase();
  const hedges    = (lower.match(/\b(maybe|perhaps|i think|i guess|kind of|sort of|not sure|probably)\b/g)||[]).length;
  const assertive = (lower.match(/\b(definitely|clearly|certainly|absolutely|i believe|we should|important)\b/g)||[]).length;
  let score = 5;
  score -= Math.min(3, hedges);
  score += Math.min(3, assertive);
  if (text.trim().split(/\s+/).length < 8) score = Math.min(score, 3);
  return Math.max(0, Math.min(10, score));
}

function estimatePosture(pts) {
  if (!pts || pts.length < 68) return { upright: false, score: 50 };
  const noseTip = pts[30]; const chin = pts[8];
  const leftJaw = pts[0];  const rightJaw = pts[16];
  const tilt     = Math.abs(leftJaw.y - rightJaw.y);
  const faceH    = Math.abs(noseTip.y - chin.y) * 2 || 1;
  const tiltNorm = tilt / faceH;
  const jawMidY  = (leftJaw.y + rightJaw.y) / 2;
  const headLean = (jawMidY - noseTip.y) / faceH;
  let score = 65;
  score -= Math.round(tiltNorm * 60);
  if (headLean < 0.3) score -= 15;
  score = Math.max(0, Math.min(100, score));
  return { upright: score > 50, score };
}

const eColor = (v) => v >= 70 ? "#27ae60" : v >= 40 ? "#c9a84c" : "#e74c3c";
const sColor = (v) => v >= 7  ? "#27ae60" : v >= 4  ? "#c9a84c" : "#e74c3c";

export default function CameraPractice({ setFeedback, setTranscript, language = "English" }) {
  const videoRef   = useRef(null);
  const overlayRef = useRef(null);
  const streamRef  = useRef(null);
  const recRef     = useRef(null);
  const finalRef   = useRef("");
  const faRef      = useRef(null);
  const busyRef    = useRef(false);
  const metricsRef = useRef({ engagement:0, eyeScore:50, postureScore:50, emotion:"neutral" });

  const [aiStatus,  setAiStatus]  = useState("Loading AI...");
  const [aiReady,   setAiReady]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [localTx,   setLocalTx]   = useState("");
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  const [liveMetrics, setLiveMetrics] = useState({
    engagement:0, eyeScore:0, eyeContact:false,
    postureScore:0, posture:false,
    emotion:"—", faceDetected:false,
    message:"Position yourself in front of camera",
  });
  const [liveSpeech, setLiveSpeech] = useState({ fluency:0, confidence:0, wordCount:0, fillers:0 });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Camera ──────────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"user", width:{ ideal:640 }, height:{ ideal:480 } },
        audio: false,
      });
      streamRef.current = stream;
      const vid = videoRef.current;
      vid.srcObject = stream;
      await new Promise(r => { vid.onloadedmetadata = () => vid.play().then(r).catch(r); });
    } catch(e) { setAiStatus("Camera error: " + e.message); }
  }

  // ── face-api ────────────────────────────────────────────────────────────
  async function loadFaceApi() {
    setAiStatus("Loading models...");
    try {
      await loadScript(FACEAPI_CDN);
      const fa = window.faceapi;
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        fa.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      faRef.current = fa;
      setAiReady(true);
      setAiStatus("✓ AI Ready");
    } catch(e) { setAiStatus("AI failed: " + e.message); }
  }

  // ── Draw landmarks ───────────────────────────────────────────────────────
  function drawLandmarks(ctx, pts) {
    ctx.fillStyle = "rgba(255,210,60,0.85)";
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI*2);
      ctx.fill();
    });

    function line(indices, close=false) {
      if (indices.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[indices[0]].x, pts[indices[0]].y);
      for (let i=1; i<indices.length; i++) ctx.lineTo(pts[indices[i]].x, pts[indices[i]].y);
      if (close) ctx.closePath();
      ctx.stroke();
    }

    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "rgba(255,210,60,0.45)";
    line([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
    ctx.strokeStyle = "rgba(255,210,60,0.6)";
    line([17,18,19,20,21]);
    line([22,23,24,25,26]);
    ctx.strokeStyle = "rgba(255,210,60,0.45)";
    line([27,28,29,30]);
    line([30,31,32,33,34,35,30]);
    ctx.strokeStyle = "rgba(255,210,60,0.7)";
    line([36,37,38,39,40,41], true);
    line([42,43,44,45,46,47], true);
    ctx.strokeStyle = "rgba(255,210,60,0.55)";
    line([48,49,50,51,52,53,54,55,56,57,58,59], true);
    line([60,61,62,63,64,65,66,67], true);
  }

  // ── Detection loop ───────────────────────────────────────────────────────
  async function runDetection() {
    const fa=faRef.current, video=videoRef.current, canvas=overlayRef.current;
    if (!fa||!video||!canvas||video.readyState<2||busyRef.current) return;
    busyRef.current = true;
    try {
      const opts   = new fa.TinyFaceDetectorOptions({ inputSize:320, scoreThreshold:0.4 });
      const result = await fa.detectSingleFace(video,opts).withFaceLandmarks().withFaceExpressions();

      const vW=video.videoWidth||640, vH=video.videoHeight||480;
      canvas.width=vW; canvas.height=vH;
      const ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,vW,vH);

      if (!result) {
        const m={engagement:0,eyeScore:0,eyeContact:false,postureScore:0,posture:false,emotion:"—",faceDetected:false,message:"No face detected ❌ — look at camera"};
        setLiveMetrics(m); metricsRef.current=m;
        setHistory(h=>[m,...h.slice(0,19)]);
        return;
      }

      const dims={width:vW,height:vH};
      const resized=fa.resizeResults(result,dims);
      const pts=resized.landmarks.positions;

      const box=resized.detection.box;
      ctx.strokeStyle="rgba(255,210,60,0.8)";
      ctx.lineWidth=2;
      ctx.strokeRect(box.x,box.y,box.width,box.height);
      drawLandmarks(ctx, pts);

      const lEye=pts.slice(36,42), rEye=pts.slice(42,48);
      const eyeMidX=(lEye.reduce((s,p)=>s+p.x,0)/lEye.length+rEye.reduce((s,p)=>s+p.x,0)/rEye.length)/2;
      const eyeMidY=(lEye.reduce((s,p)=>s+p.y,0)/lEye.length+rEye.reduce((s,p)=>s+p.y,0)/rEye.length)/2;
      const allX=pts.map(p=>p.x);
      const faceCx=(Math.min(...allX)+Math.max(...allX))/2;
      const faceW=Math.max(...allX)-Math.min(...allX);
      const eyeScore=Math.max(0,Math.min(100,Math.round(100-Math.abs(eyeMidX-faceCx)/(faceW/2+1)*80)));

      ctx.beginPath();
      ctx.strokeStyle=eyeScore>55?"rgba(255,210,60,0.4)":"rgba(231,76,60,0.4)";
      ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.moveTo(eyeMidX,eyeMidY); ctx.lineTo(vW/2,0);
      ctx.stroke(); ctx.setLineDash([]);

      const postureRes=estimatePosture(result.landmarks.positions);
      const emotion=Object.entries(result.expressions).sort((a,b)=>b[1]-a[1])[0]?.[0]||"neutral";

      const rawBox=result.detection.box;
      const centered=Math.abs((rawBox.x+rawBox.width/2)-vW/2)<vW*0.3&&Math.abs((rawBox.y+rawBox.height/2)-vH/2)<vH*0.4;
      const sizeOk=(rawBox.width*rawBox.height)/(vW*vH)>0.025;

      let eng=18;
      if(centered)                               eng+=25;
      if(sizeOk)                                 eng+=15;
      if(eyeScore>60)                            eng+=22;
      if(postureRes.upright)                     eng+=10;
      if(["happy","surprised"].includes(emotion)) eng+=10;
      eng=Math.max(0,Math.min(100,eng));

      const parts=[];
      if(eng>75)        parts.push("Excellent presence 🔥");
      else if(eng>50)   parts.push("Good — keep it up 👍");
      else              parts.push("Try to engage more 👀");
      if(!centered)          parts.push("Center yourself 🎯");
      if(!sizeOk)            parts.push("Move closer 📏");
      if(eyeScore<45)        parts.push("Look at camera 👁️");
      if(!postureRes.upright) parts.push("Sit upright 🧍");
      if(emotion&&emotion!=="neutral") parts.push(`${emotion} 😊`);

      const updated={engagement:eng,eyeScore,eyeContact:eyeScore>55,postureScore:postureRes.score,posture:postureRes.upright,emotion,faceDetected:true,message:parts.join(" · ")};
      setLiveMetrics(updated); metricsRef.current=updated;
      setHistory(h=>[updated,...h.slice(0,19)]);

    } catch(e){ console.error("Detection:",e); }
    finally { busyRef.current=false; }
  }

  // ── Speech ───────────────────────────────────────────────────────────────
  const recordingRef2 = useRef(false);

  function setupSpeech() {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return false;
    const rec=new SR();
    rec.continuous=true; rec.interimResults=true;
    rec.lang = language === "Urdu" ? "ur-PK" : "en-US";

    rec.onresult=(e)=>{
      let interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal) finalRef.current+=t+" "; else interim+=t;
      }
      const full=finalRef.current+interim;
      setLocalTx(full);
      if(setTranscript) setTranscript(full);
      const words=full.trim().split(/\s+/).filter(Boolean);
      const {total:fillers}=countFillers(full);
      setLiveSpeech({ fluency:liveFluency(full), confidence:liveConfidence(full), wordCount:words.length, fillers });
    };

    rec.onend=()=>{
      if(recordingRef2.current){
        try{ rec.start(); } catch(_){}
      }
    };

    rec.onerror=(e)=>{
      if(e.error==="not-allowed"){
        alert(language==="Urdu" ? "مائیکروفون کی اجازت نہیں ملی۔" : "Microphone permission denied.");
        recordingRef2.current=false;
        setRecording(false);
      }
    };

    recRef.current=rec;
    return true;
  }

  // ── Toggle recording ─────────────────────────────────────────────────────
  const toggleRecording=()=>{
    if(sending) return;
    if(!recording){
      finalRef.current="";
      setLocalTx("");
      setLiveSpeech({fluency:0,confidence:0,wordCount:0,fillers:0});
      if(setFeedback) setFeedback(null);
      if(!recRef.current){ const ok=setupSpeech(); if(!ok){alert("Speech not supported.");return;} }
      recordingRef2.current=true;
      setRecording(true);
      try{ recRef.current.start(); }
      catch(e){ if(e.name==="InvalidStateError"){ recRef.current.stop(); setTimeout(()=>{ try{recRef.current.start();}catch(_){} },400); } }
    } else {
      recordingRef2.current=false;
      setRecording(false);
      try{ recRef.current?.stop(); } catch(_){}
    }
  };

  const clearTranscript=()=>{
    finalRef.current="";
    setLocalTx("");
    setLiveSpeech({fluency:0,confidence:0,wordCount:0,fillers:0});
  };

  const handleSendFeedback=()=>{
    const text=finalRef.current.trim();
    if(!text){ alert("No speech to analyze. Please speak first."); return; }
    sendFeedback(text);
  };

  async function sendFeedback(text){
    setSending(true);
    try{
      const m=metricsRef.current;

      // ── Get username from localStorage ──────────────────────────────
      const userRaw  = localStorage.getItem("user");
      const username = userRaw ? JSON.parse(userRaw).name || "anonymous" : "anonymous";

      const res=await axios.post("http://127.0.0.1:8000/api/presentation-feedback",{
        transcript:text,
        duration:5,
        language,
        username,           // ← sends username so session is saved per user
        camera_metrics:{
          avg_engagement:  m.engagement||0,
          avg_eye_contact: m.eyeScore||50,
          avg_posture:     m.postureScore||50,
          dominant_emotion:m.emotion||"neutral",
        },
      });
      if(setFeedback) setFeedback(res.data);
      finalRef.current="";
      setLocalTx("");
      setLiveSpeech({fluency:0,confidence:0,wordCount:0,fillers:0});
    } catch(e){
      console.error("Feedback:",e);
      alert("Backend unreachable. Make sure server is on port 8000.");
    } finally{ setSending(false); }
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    let interval;
    (async()=>{ await startCamera(); await loadFaceApi(); interval=setInterval(runDetection,800); })();
    setupSpeech();
    return ()=>{ clearInterval(interval); streamRef.current?.getTracks().forEach(t=>t.stop()); try{recRef.current?.stop();}catch(_){} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const ec=eColor(liveMetrics.engagement);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
        gap:16,
      }}>

        {/* ══ CAMERA BOX ══ */}
        <div style={{
          background:"#0a0a12", borderRadius:16, overflow:"hidden",
          position:"relative",
          border:"1px solid rgba(255,255,255,0.06)",
          boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
          minHeight: isMobile ? 260 : 420,
        }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block",minHeight:"inherit"}}
          />
          <canvas ref={overlayRef}
            style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}
          />

          {/* LIVE / REC badge */}
          <div style={{position:"absolute",top:10,left:10,display:"flex",alignItems:"center",gap:7,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",padding:"5px 12px",borderRadius:50,border:"1px solid rgba(255,255,255,0.1)"}}>
            <span style={{width:7,height:7,borderRadius:"50%",display:"inline-block",background:recording?"#e74c3c":"#888",boxShadow:recording?"0 0 8px #e74c3c":"none",animation:recording?"camPulse 1.4s ease-in-out infinite":"none"}}/>
            <span style={{color:"#fff",fontSize:"0.72rem",fontWeight:600}}>{recording?"REC · LIVE":"LIVE"}</span>
          </div>

          {/* AI status */}
          <div style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",padding:"4px 11px",borderRadius:50,fontSize:"0.68rem",fontWeight:600,color:aiReady?"#2ecc71":"#c9a84c",border:"1px solid rgba(255,255,255,0.08)"}}>
            {aiStatus}
          </div>

          {/* Live speech bar */}
          {recording && (
            <div style={{position:"absolute",top:44,left:10,right:10,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",padding:"8px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",display:"flex",gap:10}}>
              {[
                {label:"Fluency",    val:liveSpeech.fluency,    max:10},
                {label:"Confidence", val:liveSpeech.confidence, max:10},
                {label:"Words",      val:liveSpeech.wordCount,  max:null},
                {label:"Fillers",    val:liveSpeech.fillers,    max:null,warn:true},
              ].map((m,i)=>(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:"0.95rem",fontWeight:700,lineHeight:1,color:m.max?sColor(m.val):(m.warn&&m.val>3?"#e74c3c":"#fff")}}>
                    {m.val}{m.max?`/${m.max}`:""}
                  </div>
                  <div style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.5)",marginTop:2}}>{m.label}</div>
                  {m.max&&<div style={{height:2,background:"rgba(255,255,255,0.15)",borderRadius:2,marginTop:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:sColor(m.val),width:`${(m.val/m.max)*100}%`,transition:"width 0.4s ease"}}/></div>}
                </div>
              ))}
            </div>
          )}

          {/* Bottom controls */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.85))",padding:"40px 14px 14px",display:"flex",flexDirection:"column",gap:8}}>

            <button onClick={toggleRecording} disabled={sending} style={{
              background:sending?"rgba(120,120,120,0.8)":recording?"linear-gradient(135deg,#c0392b,#e74c3c)":"linear-gradient(135deg,#27ae60,#2ecc71)",
              color:"#fff",border:"none",padding:isMobile?"12px":"11px 26px",borderRadius:50,
              fontWeight:700,fontSize:isMobile?"0.95rem":"0.88rem",
              cursor:sending?"not-allowed":"pointer",
              boxShadow:recording?"0 0 20px rgba(231,76,60,0.55)":"0 4px 14px rgba(39,174,96,0.4)",
              transition:"all 0.3s",width:isMobile?"100%":"auto",
            }}>
              {sending?"⏳ Getting feedback...":recording?"🛑 Stop Speaking":"🎤 Start Speaking"}
            </button>

            {!recording && localTx && !sending && (
              <button onClick={handleSendFeedback} style={{
                background:"linear-gradient(135deg,#c9a84c,#e6c76b)",
                color:"#1a1a2e",border:"none",
                padding:isMobile?"12px":"10px 24px",borderRadius:50,
                fontWeight:700,fontSize:isMobile?"0.9rem":"0.85rem",
                cursor:"pointer",width:isMobile?"100%":"auto",
                boxShadow:"0 4px 14px rgba(201,168,76,0.4)",
                transition:"all 0.3s",
              }}>
                📤 Get AI Feedback
              </button>
            )}

            {!isMobile && (
              <div>
                <div style={{color:"#fff",fontSize:"0.8rem",fontWeight:600}}>📷 Camera + Voice Mode</div>
                <div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.67rem",marginTop:2}}>face-api.js · 68 landmarks · AI expression analysis</div>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT PANEL (desktop) ══ */}
        {!isMobile && (
          <div style={{background:"#fff",padding:18,borderRadius:16,border:"1px solid rgba(0,0,0,0.07)",boxShadow:"0 4px 20px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:11,overflowY:"auto"}}>
            <div style={{fontWeight:700,color:"#1a1a2e",fontFamily:"'Playfair Display',serif",fontSize:"0.95rem"}}>📊 Live Analysis</div>

            <div style={{background:"#f9f7f2",padding:14,borderRadius:11,textAlign:"center",border:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:"2rem",fontWeight:700,color:ec,fontFamily:"'Playfair Display',serif",lineHeight:1,transition:"color 0.4s"}}>{liveMetrics.engagement}%</div>
              <div style={{fontSize:"0.68rem",color:"#9999a8",marginTop:3}}>Engagement</div>
              <div style={{height:4,background:"#eee",borderRadius:4,marginTop:7,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,background:ec,width:`${liveMetrics.engagement}%`,transition:"width 0.7s ease"}}/>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {[
                {label:"Eye Contact", icon:"👁️", val:liveMetrics.faceDetected?`${liveMetrics.eyeScore}%`:"—",  ok:liveMetrics.eyeContact},
                {label:"Posture",     icon:"🧍", val:liveMetrics.faceDetected?`${liveMetrics.postureScore}%`:"—", ok:liveMetrics.posture},
                {label:"Emotion",     icon:"😊", val:liveMetrics.faceDetected?(liveMetrics.emotion||"neutral"):"—", ok:true},
                {label:"Face",        icon:"🎯", val:liveMetrics.faceDetected?"Detected ✓":"Not found ✗", ok:liveMetrics.faceDetected},
              ].map((m,i)=>(
                <div key={i} style={{background:"#f9f7f2",padding:"8px 10px",borderRadius:9,border:`1px solid ${m.ok?"rgba(39,174,96,0.2)":"rgba(231,76,60,0.18)"}`}}>
                  <div style={{fontSize:"0.9rem",marginBottom:2}}>{m.icon}</div>
                  <div style={{fontWeight:600,color:"#1a1a2e",fontSize:"0.8rem"}}>{m.val}</div>
                  <div style={{color:"#9999a8",fontSize:"0.65rem",marginTop:1}}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{background:"#f9f7f2",padding:"8px 12px",borderRadius:9,fontSize:"0.78rem",color:"#6b6b7b",border:"1px solid rgba(0,0,0,0.06)",lineHeight:1.5}}>
              💡 {liveMetrics.message}
            </div>

            {localTx && (
              <div style={{background:"#f9f7f2",borderRadius:9,border:"1px solid rgba(0,0,0,0.06)",overflow:"hidden"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 11px 4px"}}>
                  <span style={{fontWeight:600,color:"#1a1a2e",fontSize:"0.75rem"}}>🗣 Speech</span>
                  <button onClick={clearTranscript} style={{background:"#fff0f0",color:"#e74c3c",border:"1px solid rgba(231,76,60,0.2)",borderRadius:6,padding:"2px 8px",fontSize:"0.68rem",fontWeight:600,cursor:"pointer"}}>✕ Clear</button>
                </div>
                <div style={{padding:"0 11px 9px",fontSize:"0.73rem",color:"#6b6b7b",lineHeight:1.5,maxHeight:65,overflowY:"auto"}}>{localTx}</div>
              </div>
            )}

            <div style={{fontSize:"0.68rem",fontWeight:600,color:"#9999a8",letterSpacing:"0.05em"}}>📈 HISTORY</div>
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:5,maxHeight:180}}>
              {history.length===0?(
                <div style={{fontSize:"0.72rem",color:"#c0c0cc",textAlign:"center",padding:"14px 0"}}>Waiting for data...</div>
              ):history.map((h,i)=>(
                <div key={i} style={{background:"#f9f7f2",padding:"6px 9px",borderRadius:7,fontSize:"0.7rem",color:"#6b6b7b",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid rgba(0,0,0,0.05)",opacity:Math.max(0.3,1-i*0.04)}}>
                  <span style={{flex:1,marginRight:7,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{h.message}</span>
                  <span style={{fontWeight:700,flexShrink:0,color:eColor(h.engagement)}}>{h.engagement}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ MOBILE: metrics + transcript BELOW camera ══ */}
      {isMobile && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#fff",padding:14,borderRadius:14,border:"1px solid rgba(0,0,0,0.07)",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",textAlign:"center"}}>
            <div style={{fontSize:"1.8rem",fontWeight:700,color:ec,fontFamily:"'Playfair Display',serif",lineHeight:1,transition:"color 0.4s"}}>{liveMetrics.engagement}%</div>
            <div style={{fontSize:"0.68rem",color:"#9999a8",marginTop:3}}>Engagement</div>
            <div style={{height:4,background:"#eee",borderRadius:4,marginTop:7,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:4,background:ec,width:`${liveMetrics.engagement}%`,transition:"width 0.7s ease"}}/>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"Eye Contact", icon:"👁️", val:liveMetrics.faceDetected?`${liveMetrics.eyeScore}%`:"—",  ok:liveMetrics.eyeContact},
              {label:"Posture",     icon:"🧍", val:liveMetrics.faceDetected?`${liveMetrics.postureScore}%`:"—", ok:liveMetrics.posture},
              {label:"Emotion",     icon:"😊", val:liveMetrics.faceDetected?(liveMetrics.emotion||"neutral"):"—", ok:true},
              {label:"Face",        icon:"🎯", val:liveMetrics.faceDetected?"Detected ✓":"Not found ✗", ok:liveMetrics.faceDetected},
            ].map((m,i)=>(
              <div key={i} style={{background:"#fff",padding:"11px 12px",borderRadius:11,border:`1px solid ${m.ok?"rgba(39,174,96,0.2)":"rgba(231,76,60,0.18)"}`,boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:"1.1rem",marginBottom:3}}>{m.icon}</div>
                <div style={{fontWeight:600,color:"#1a1a2e",fontSize:"0.85rem"}}>{m.val}</div>
                <div style={{color:"#9999a8",fontSize:"0.7rem",marginTop:2}}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{background:"#fff",padding:"10px 14px",borderRadius:11,fontSize:"0.82rem",color:"#6b6b7b",border:"1px solid rgba(0,0,0,0.07)",lineHeight:1.5,boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
            💡 {liveMetrics.message}
          </div>

          {localTx && (
            <div style={{background:"#fff",borderRadius:11,border:"1px solid rgba(0,0,0,0.07)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px 5px"}}>
                <span style={{fontWeight:600,color:"#1a1a2e",fontSize:"0.8rem"}}>🗣 Speech</span>
                <button onClick={clearTranscript} style={{background:"#fff0f0",color:"#e74c3c",border:"1px solid rgba(231,76,60,0.2)",borderRadius:6,padding:"3px 10px",fontSize:"0.72rem",fontWeight:600,cursor:"pointer"}}>✕ Clear</button>
              </div>
              <div style={{padding:"0 12px 10px",fontSize:"0.78rem",color:"#6b6b7b",lineHeight:1.55,maxHeight:80,overflowY:"auto"}}>{localTx}</div>
            </div>
          )}

          <div style={{background:"#fff",padding:14,borderRadius:14,border:"1px solid rgba(0,0,0,0.07)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:"0.7rem",fontWeight:600,color:"#9999a8",letterSpacing:"0.05em",marginBottom:8}}>📈 HISTORY</div>
            <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:160,overflowY:"auto"}}>
              {history.length===0?(
                <div style={{fontSize:"0.75rem",color:"#c0c0cc",textAlign:"center",padding:"12px 0"}}>Waiting for data...</div>
              ):history.map((h,i)=>(
                <div key={i} style={{background:"#f9f7f2",padding:"7px 10px",borderRadius:8,fontSize:"0.73rem",color:"#6b6b7b",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid rgba(0,0,0,0.05)",opacity:Math.max(0.3,1-i*0.04)}}>
                  <span style={{flex:1,marginRight:7,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{h.message}</span>
                  <span style={{fontWeight:700,flexShrink:0,color:eColor(h.engagement)}}>{h.engagement}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes camPulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}