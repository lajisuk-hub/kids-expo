"use client";

import { useEffect, useRef, useState } from "react";
import { addItem, uploadImage } from "../../lib/supabase";
import { MOODS } from "./DrawGallery";

const COLORS = ["#2b2b2b", "#ff6b6b", "#ff9f43", "#ffd93d", "#6bcb77", "#4d96ff", "#845ec2", "#ff6fb5", "#8d6e63", "#9bd3ff"];
const SIZES = [{ w: 5, label: "가늘게" }, { w: 11, label: "보통" }, { w: 20, label: "굵게" }];

export default function DrawPad({ code, onClose, onSaved }) {
  const cvs = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(null);
  const undo = useRef([]);
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState(1);
  const [eraser, setEraser] = useState(false);
  const [name, setName] = useState("");
  const [mood, setMood] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [S, setS] = useState(360);

  // 캔버스 크기: 화면 폭에 맞춰 정사각형
  useEffect(() => {
    setS(Math.min(window.innerWidth - 44, 420, Math.floor(window.innerHeight * 0.48)));
  }, []);

  // 얼굴 밑그림 (처음과 「다 지우기」 때 그린다)
  const drawGuide = () => {
    const c = cvs.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = S * dpr; c.height = S * dpr;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctxRef.current = ctx;
    ctx.fillStyle = "#fffdf7"; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#cfc3b8"; ctx.lineWidth = 3;
    const cx = S / 2, cy = S * 0.52, rx = S * 0.3, ry = S * 0.34;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();                       // 머리
    ctx.beginPath(); ctx.ellipse(cx - rx - S * 0.03, cy + S * 0.02, S * 0.045, S * 0.07, 0, 0, Math.PI * 2); ctx.stroke(); // 귀
    ctx.beginPath(); ctx.ellipse(cx + rx + S * 0.03, cy + S * 0.02, S * 0.045, S * 0.07, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - S * 0.07, cy + ry - 2); ctx.lineTo(cx - S * 0.07, S * 0.93);        // 목
    ctx.moveTo(cx + S * 0.07, cy + ry - 2); ctx.lineTo(cx + S * 0.07, S * 0.93); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(S * 0.12, S); ctx.quadraticCurveTo(cx, S * 0.86, S * 0.88, S); ctx.stroke(); // 어깨
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.9, cy - ry * 0.45); ctx.quadraticCurveTo(cx, cy - ry * 1.25, cx + rx * 0.9, cy - ry * 0.45); ctx.stroke(); // 머리카락
    ctx.setLineDash([3, 6]); ctx.strokeStyle = "#e3d9cf";                                                // 눈 자리 점선
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.55, cy - ry * 0.15); ctx.lineTo(cx + rx * 0.55, cy - ry * 0.15); ctx.stroke();
    ctx.setLineDash([]);
    undo.current = []; setCanUndo(false);
  };
  useEffect(() => { drawGuide(); }, [S]); // eslint-disable-line react-hooks/exhaustive-deps

  const pt = (e) => {
    const r = cvs.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * S, y: ((e.clientY - r.top) / r.height) * S };
  };
  const down = (e) => {
    e.preventDefault();
    const ctx = ctxRef.current; if (!ctx) return;
    try { undo.current.push(ctx.getImageData(0, 0, cvs.current.width, cvs.current.height)); if (undo.current.length > 25) undo.current.shift(); setCanUndo(true); } catch {}
    const p = pt(e);
    drawing.current = p;
    ctx.strokeStyle = eraser ? "#fffdf7" : color;
    ctx.lineWidth = eraser ? SIZES[size].w * 2.2 : SIZES[size].w;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.01, p.y + 0.01); ctx.stroke();
    cvs.current.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ctxRef.current; const p = pt(e);
    ctx.beginPath(); ctx.moveTo(drawing.current.x, drawing.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    drawing.current = p;
  };
  const up = () => { drawing.current = null; };
  const doUndo = () => {
    const ctx = ctxRef.current; const im = undo.current.pop();
    if (!im) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.putImageData(im, 0, 0); ctx.restore();
    setCanUndo(undo.current.length > 0);
  };
  const clearAll = () => {
    if (!confirm("그림을 모두 지울까요?")) return;
    drawGuide();
  };

  const save = async () => {
    setErr("");
    if (undo.current.length === 0) return setErr("아직 아무것도 안 그렸어요. 얼굴에 오늘 기분을 그려 주세요!");
    setBusy(true);
    try {
      const blob = await new Promise((res) => cvs.current.toBlob(res, "image/png"));
      const img = await uploadImage(code, blob);
      const item = await addItem("d", code, { name: name.trim().slice(0, 20), mood, img });
      onSaved(item);
    } catch (e) {
      setErr("전시하지 못했어요. 잠시 뒤 다시 시도해 주세요. (" + (e.message || e) + ")");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal pad">
        <button className="x" onClick={onClose}>✕</button>
        <h2>오늘 나의 기분을 그림으로 표현해 줘요</h2>
        <p className="sub">얼굴 밑그림 위에 눈·입·볼을 그려서 오늘 기분을 보여 주세요.</p>
        <div className="moods">
          {MOODS.map((m) => (
            <button key={m.id} className={`mood${mood === m.id ? " on" : ""}`} onClick={() => setMood(mood === m.id ? "" : m.id)}>
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        <div className="pad-wrap" style={{ width: S, height: S }}>
          <canvas ref={cvs} style={{ width: S, height: S }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
        </div>
        <div className="tools">
          <div className="colors">
            {COLORS.map((c) => (
              <button key={c} className={`col${!eraser && color === c ? " on" : ""}`} style={{ "--c": c }} onClick={() => { setColor(c); setEraser(false); }} aria-label={c} />
            ))}
            <button className={`col eraser${eraser ? " on" : ""}`} onClick={() => setEraser(true)} aria-label="지우개">⌫</button>
          </div>
          <div className="sizes">
            {SIZES.map((s, i) => (
              <button key={s.w} className={`sz${size === i ? " on" : ""}`} onClick={() => setSize(i)}><i style={{ width: s.w, height: s.w }} />{s.label}</button>
            ))}
            <button className="sz" onClick={doUndo} disabled={!canUndo}>↶ 되돌리기</button>
            <button className="sz" onClick={clearAll}>🗑 다 지우기</button>
          </div>
        </div>
        <label className="f">이름 (안 적어도 돼요)</label>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 하늘" maxLength={20} />
        {err && <div className="err">{err}</div>}
        <div style={{ height: 12 }} />
        <button className="btn big" onClick={save} disabled={busy}>{busy ? "전시하는 중…" : "🎉 전시하기!"}</button>
      </div>
    </div>
  );
}
