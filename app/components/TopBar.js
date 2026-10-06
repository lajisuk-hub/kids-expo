"use client";

// 각 전시 화면 위쪽: 어린이집 이름 · 전시 이름 · 로비로 돌아가기
export default function TopBar({ code, org, title, color = "#ff6b6b", right = null }) {
  return (
    <div className="topbar" style={{ "--c": color }}>
      <a className="tb-back" href={`/e/${code}`} aria-label="전시회 로비로">← 로비</a>
      <div className="tb-mid">
        <span className="tb-org">{org}</span>
        <b className="tb-title">{title}</b>
      </div>
      <div className="tb-right">{right}</div>
    </div>
  );
}
