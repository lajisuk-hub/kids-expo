"use client";

import { useRef } from "react";
import { DEFAULT_VIDEO } from "../../lib/supabase";
import TopBar from "./TopBar";

export default function Play({ space }) {
  const { code, name, videoUrl } = space;
  const ref = useRef(null);
  const src = videoUrl || DEFAULT_VIDEO;
  const full = () => {
    const v = ref.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };
  return (
    <main className="play">
      <TopBar code={code} org={name} title="체험 전시" color="#ff6b6b" />
      <div className="play-wrap">
        <div className="play-card">
          <h2>따라 해 보세요 <small>FOLLOW THE MOTION</small></h2>
          <p>화면 속 사람처럼 몸을 움직여 보세요. 손 흔들기부터 마지막 안아주기까지 11가지 동작, 1분 39초예요.</p>
          <video ref={ref} className="play-video" src={src} controls playsInline preload="metadata" poster="/ch-play.jpg" />
          <div className="play-btns">
            <button className="btn" onClick={() => { ref.current?.play(); full(); }}>▶ 크게 보며 따라 하기</button>
          </div>
          <ul className="play-tips">
            <li>📺 TV나 큰 화면에 연결하면 온 가족이 함께할 수 있어요.</li>
            <li>🔊 소리를 켜면 박자가 들려요. 박자에 맞춰 움직여 보세요.</li>
            <li>🤗 마지막엔 옆에 있는 사람을 꼭 안아 주세요.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
