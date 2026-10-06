"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadItems } from "../../lib/supabase";
import { INSTRUMENTS, playSong, NAME_OF } from "../../lib/synth";
import Pano from "./Pano";
import TopBar from "./TopBar";
import Piano from "./Piano";

export const NOTE_GLYPHS = ["♪", "♫", "♩", "♬"];
export const CARD_COLORS = ["#ff6b6b", "#ff9f43", "#ffd93d", "#6bcb77", "#4d96ff", "#845ec2", "#ff6fb5"];
export const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const instOf = (id) => INSTRUMENTS.find((i) => i.id === id) || INSTRUMENTS[0];

export function renderSong(it) {
  const h = hash(it.id);
  return (
    <span className="song" style={{ "--c": CARD_COLORS[h % CARD_COLORS.length] }}>
      <i className="song-note">{NOTE_GLYPHS[(h >> 4) % NOTE_GLYPHS.length]}</i>
      <b>{it.name || "이름 없는 친구"}</b>
      <small>{instOf(it.inst).emoji} {instOf(it.inst).name} · {Math.round((it.dur || 0) / 1000)}초</small>
    </span>
  );
}

export default function MusicGallery({ space }) {
  const { code, name } = space;
  const [items, setItems] = useState([]);
  const [piano, setPiano] = useState(false);
  const [picked, setPicked] = useState(null);
  const [mine, setMine] = useState(null);
  const [toast, setToast] = useState("");
  const [small, setSmall] = useState(false);
  const since = useRef(null);
  const pano = useRef(null);

  useEffect(() => {
    const on = () => setSmall(window.innerWidth < 700);
    on(); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on);
  }, []);
  const merge = useCallback((rows) => {
    if (!rows.length) return;
    for (const r of rows) if (!since.current || r.at > since.current) since.current = r.at;
    setItems((prev) => { const by = new Map(prev.map((r) => [r.id, r])); for (const r of rows) by.set(r.id, r); return [...by.values()]; });
  }, []);
  useEffect(() => {
    let stop = false;
    const tick = async () => { try { const rows = await loadItems("m", code, since.current); if (!stop) merge(rows); } catch {} };
    tick(); const id = setInterval(tick, 8000);
    return () => { stop = true; clearInterval(id); };
  }, [code, merge]);

  const visible = useMemo(() => items.filter((i) => !i.hidden && Array.isArray(i.notes) && i.notes.length).sort((a, b) => (a.id < b.id ? -1 : 1)), [items]);
  const n = visible.length;
  const size = small ? (n > 30 ? 92 : 112) : n > 40 ? 116 : 150;

  const onSaved = (item) => {
    setPiano(false); merge([item]); setMine(item.id); setTimeout(() => pano.current?.goTo(item.id), 80);
    setToast("내 노래가 전시장에 떠올랐어요! 🎉"); setTimeout(() => setToast(""), 3500);
  };

  return (
    <main className="gallery music-g">
      <TopBar code={code} org={name} title="음악 전시" color="#6bcb77" />
      <Pano
        ref={pano}
        startImg={2}
        paused={!!(piano || picked)}
        items={visible}
        size={size}
        mineId={mine}
        onPick={setPicked}
        render={renderSong}
      />
      <div className="g-title">
        <h1>내가 만든 노래 전시</h1>
        <p>{n > 0 ? `노래 ${n}곡이 떠다녀요 · 눌러서 들어 보세요` : "아직 노래가 없어요. 첫 번째 노래를 만들어 주세요!"}</p>
      </div>
      <div className="cta"><button onClick={() => setPiano(true)}>🎹 내 노래 만들기</button></div>
      {toast && <div className="toast">{toast}</div>}
      {piano && <Piano code={code} onClose={() => setPiano(false)} onSaved={onSaved} />}
      {picked && <SongPlayer item={picked} onClose={() => setPicked(null)} />}
    </main>
  );
}

export function SongPlayer({ item, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(null);
  const stopRef = useRef(null);
  const inst = instOf(item.inst);
  const dur = item.dur || (item.notes.at(-1)?.t || 0) + 800;
  const play = () => {
    if (playing) { stopRef.current?.(); setPlaying(false); setCur(null); return; }
    setPlaying(true);
    stopRef.current = playSong(item.notes, item.inst, (nt) => setCur(nt.n));
    setTimeout(() => { setPlaying(false); setCur(null); }, dur + 600);
  };
  useEffect(() => () => stopRef.current?.(), []);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal player" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose}>✕</button>
        <div className="pl-inst">{inst.emoji}</div>
        <h2>{item.name || "이름 없는 친구"}의 노래</h2>
        <p className="sub">{inst.name} · {item.notes.length}음 · {Math.round(dur / 1000)}초 · {new Date(item.at).toLocaleDateString("ko-KR")}</p>
        <div className="pl-notes">
          {item.notes.slice(0, 40).map((nt, i) => (
            <span key={i} className={cur === nt.n && playing ? "on" : ""}>{NAME_OF[nt.n] || "♯"}</span>
          ))}
          {item.notes.length > 40 && <span>…</span>}
        </div>
        <button className={`pl-play${playing ? " on" : ""}`} onClick={play}>{playing ? "■" : "▶"}</button>
        <p className="note">{playing ? "재생 중이에요" : "눌러서 들어 보세요"}</p>
      </div>
    </div>
  );
}
