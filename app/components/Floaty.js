"use client";

import { useEffect, useRef } from "react";

// 작품들이 전시장 화면을 둥둥 떠다니게 한다. rAF 루프 하나가 transform을 직접 움직인다(React 재렌더 없음).
// items: [{id, ...}], render(item) → 안에 그릴 내용, size: 작품 한 변(px), launchIds: 새로 떠오른 것(튀어오름 효과)
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function Floaty({ items, render, size = 130, onPick, mineId, className = "" }) {
  const els = useRef(new Map());
  const state = useRef({ items: [], size });
  state.current = { items, size };

  useEffect(() => {
    let raf = 0;
    const pos = new Map(); // id → {x, y, v, ph, sp}
    const loop = (now) => {
      const { items, size } = state.current;
      const W = window.innerWidth, H = window.innerHeight;
      const top = 90, bottom = H - 120; // 위 제목·아래 단추 피하기
      const lanes = Math.max(2, Math.floor((bottom - top) / (size * 0.95)));
      const t = now / 1000;
      items.forEach((it, i) => {
        const el = els.current.get(it.id);
        if (!el) return;
        let p = pos.get(it.id);
        if (!p) {
          const h = hash(it.id);
          const lane = i % lanes;
          const laneY = top + (lane + 0.5) * ((bottom - top) / lanes);
          // 같은 줄에 있는 것끼리 가로로 고르게 나눠 시작
          const inLane = Math.floor(i / lanes);
          const perLane = Math.ceil(items.length / lanes);
          const span = Math.max(W + size * 2, perLane * size * 1.25);
          p = {
            x: (inLane + 0.5) * (span / Math.max(1, perLane)) - size + ((h % 100) / 100 - 0.5) * size * 0.6,
            y: laneY + (((h >> 7) % 100) / 100 - 0.5) * size * 0.25,
            v: 9 + ((h >> 3) % 10) * 1.3,            // 초당 px, 천천히
            ph: (h % 628) / 100,
            sp: 0.4 + ((h >> 5) % 40) / 100,
            span,
          };
          pos.set(it.id, p);
        }
        p.x += p.v / 60;
        if (p.x > W + size) p.x -= p.span;
        const dx = Math.sin(t * p.sp + p.ph) * 8;
        const dy = Math.cos(t * p.sp * 0.8 + p.ph) * 10;
        const rot = Math.sin(t * p.sp * 0.5 + p.ph) * 4;
        el.style.transform = `translate3d(${p.x + dx}px,${p.y + dy}px,0) translate(-50%,-50%) rotate(${rot}deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`floaty ${className}`}>
      {items.map((it) => (
        <button
          key={it.id}
          ref={(el) => (el ? els.current.set(it.id, el) : els.current.delete(it.id))}
          className={`fl-item${it.id === mineId ? " mine launch" : ""}`}
          style={{ width: size, height: size }}
          onClick={() => onPick && onPick(it)}
        >
          {render(it)}
        </button>
      ))}
    </div>
  );
}
