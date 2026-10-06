"use client";

import { useRef, useState } from "react";
import Pano from "./Pano";

// 전시 3개: 파노라마 그림 1·2·3 위에 하나씩 떠 있다
export const CHAPTERS = [
  { id: "play", title: "체험 전시", en: "PLAY", emoji: "🤸", color: "#ff6b6b", desc: "화면 속 사람을 따라 몸을 움직여요", anchor: { img: 0, fx: 0.5, fy: 0.5 } },
  { id: "draw", title: "그림 전시", en: "DRAW", emoji: "🎨", color: "#4d96ff", desc: "오늘 내 기분을 얼굴로 그려요", anchor: { img: 1, fx: 0.5, fy: 0.5 } },
  { id: "music", title: "음악 전시", en: "MUSIC", emoji: "🎵", color: "#6bcb77", desc: "나만의 노래를 30초 녹음해요", anchor: { img: 2, fx: 0.5, fy: 0.5 } },
];

export default function Lobby({ space }) {
  const { code, name } = space;
  const pano = useRef(null);
  const [focus, setFocus] = useState(null);

  const go = (c) => { window.location.href = `/e/${code}/${c.id}`; };
  const nav = (i) => { pano.current?.goImg(i); setFocus(CHAPTERS[i].id); setTimeout(() => setFocus(null), 2600); };

  return (
    <main className="lobby-pano">
      <Pano
        ref={pano}
        items={CHAPTERS}
        speed={30}
        onPick={go}
        render={(c) => (
          <span className={`door${focus === c.id ? " focus" : ""}`} style={{ "--c": c.color }}>
            <i className="door-emoji">{c.emoji}</i>
            <span className="door-en">{c.en}</span>
            <b>{c.title}</b>
            <small>{c.desc}</small>
            <span className="door-go">입장하기 →</span>
          </span>
        )}
      />
      <header className="top">
        <span className="org">{name}</span>
        <h1>온라인 전시회</h1>
        <p>화면을 좌우로 밀어 둘러보고, 떠 있는 전시를 눌러 들어가세요</p>
      </header>
      <nav className="chnav">
        {CHAPTERS.map((c, i) => (
          <button key={c.id} style={{ "--c": c.color }} onClick={() => nav(i)}>{c.emoji} {c.title}</button>
        ))}
      </nav>
      <a className="adminlink" href={`/e/${code}/admin`}>기관 관리</a>
    </main>
  );
}
