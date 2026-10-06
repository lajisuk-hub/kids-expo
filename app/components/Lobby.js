"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Pano from "./Pano";
import { loadItems } from "../../lib/supabase";
import { renderPic, DrawViewer } from "./DrawGallery";
import { renderSong, SongPlayer } from "./MusicGallery";

// 전시 3개: 아래 탭 단추 (작품이 많아져도 묻히지 않게 파노라마 위에는 띄우지 않는다)
export const CHAPTERS = [
  { id: "play", title: "체험 전시", en: "PLAY", emoji: "🤸", color: "#ff6b6b", desc: "화면 속 사람을 따라 몸을 움직여요" },
  { id: "draw", title: "그림 전시", en: "DRAW", emoji: "🎨", color: "#4d96ff", desc: "오늘 내 기분을 얼굴로 그려요" },
  { id: "music", title: "음악 전시", en: "MUSIC", emoji: "🎵", color: "#6bcb77", desc: "나만의 노래를 30초 녹음해요" },
];

export default function Lobby({ space }) {
  const { code, name } = space;
  const pano = useRef(null);
  const [draws, setDraws] = useState([]);
  const [songs, setSongs] = useState([]);
  const [picked, setPicked] = useState(null); // {kind, item}
  const [small, setSmall] = useState(false);
  const sinceD = useRef(null), sinceM = useRef(null);

  useEffect(() => {
    const on = () => setSmall(window.innerWidth < 700);
    on(); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on);
  }, []);

  // 그림 전시·음악 전시에 올라온 작품을 로비에도 띄운다 (처음 전부, 그 뒤 새 것만 8초마다)
  const merge = useCallback((setter, sinceRef) => (rows) => {
    if (!rows.length) return;
    for (const r of rows) if (!sinceRef.current || r.at > sinceRef.current) sinceRef.current = r.at;
    setter((prev) => { const by = new Map(prev.map((r) => [r.id, r])); for (const r of rows) by.set(r.id, r); return [...by.values()]; });
  }, []);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const [d, m] = await Promise.all([loadItems("d", code, sinceD.current), loadItems("m", code, sinceM.current)]);
        if (stop) return;
        merge(setDraws, sinceD)(d); merge(setSongs, sinceM)(m);
      } catch {}
    };
    tick(); const id = setInterval(tick, 8000);
    return () => { stop = true; clearInterval(id); };
  }, [code, merge]);

  const items = useMemo(() => [
    ...draws.filter((i) => !i.hidden && i.img).map((i) => ({ ...i, kind: "d" })),
    ...songs.filter((i) => !i.hidden && Array.isArray(i.notes) && i.notes.length).map((i) => ({ ...i, kind: "m" })),
  ], [draws, songs]);
  const works = items.length;
  const size = small ? (works > 30 ? 72 : 88) : works > 40 ? 96 : 120;

  const onPick = (p) => setPicked({ kind: p.kind, item: p });
  const go = (c) => { window.location.href = `/e/${code}/${c.id}`; };

  return (
    <main className="lobby-pano">
      <Pano
        ref={pano}
        startImg={1}
        items={items}
        size={size}
        speed={30}
        paused={!!picked}
        onPick={onPick}
        render={(p) => (p.kind === "d" ? renderPic(p) : renderSong(p))}
      />
      <header className="top">
        <span className="org">{name}</span>
        <h1>온라인 전시회</h1>
        <p>아래 단추로 전시에 들어가고, 떠다니는 친구들 작품은 눌러서 보세요</p>
      </header>
      {works > 0 && <div className="count">작품 {works}개가 떠 있어요</div>}
      <nav className="chtabs">
        {CHAPTERS.map((c) => (
          <button key={c.id} style={{ "--c": c.color }} onClick={() => go(c)}>
            <span className="tab-emoji">{c.emoji}</span>
            <b>{c.title}</b>
            <small>{c.desc}</small>
          </button>
        ))}
      </nav>
      <a className="adminlink" href={`/e/${code}/admin`}>기관 관리</a>
      {picked?.kind === "d" && <DrawViewer item={picked.item} onClose={() => setPicked(null)} />}
      {picked?.kind === "m" && <SongPlayer item={picked.item} onClose={() => setPicked(null)} />}
    </main>
  );
}
