"use client";

// 학부모용 사용법 팝업: 전시 3개가 무엇인지 + 어떤 단추를 누르면 되는지
const ITEMS = [
  {
    emoji: "🤸", color: "#ff6b6b", title: "체험 전시",
    what: "화면 속 사람이 보여 주는 동작을 온 가족이 따라 하는 영상이에요. 마지막엔 옆 사람을 꼭 안아 줘요.",
    how: ["「▶ 크게 보며 따라 하기」를 누르면 전체 화면으로 재생돼요", "TV에 연결하면 더 좋아요"],
  },
  {
    emoji: "🎨", color: "#4d96ff", title: "그림 전시",
    what: "얼굴 밑그림 위에 오늘 내 기분을 그려요. 얼굴이 아니어도 괜찮아요, 아무거나 자유롭게 그려도 돼요! 다 그리면 전시장에 둥둥 떠다니고, 다른 친구들도 볼 수 있어요.",
    how: ["「🖍️ 내 기분 그리기」 → 색·굵기 고르고 손가락으로 그리기", "「✅ 다 그렸어요!」 → 「🎉 네, 전시해요!」 (다시 그릴 수도 있어요)"],
  },
  {
    emoji: "🎵", color: "#6bcb77", title: "음악 전시",
    what: "피아노·실로폰·오르골 건반을 눌러 30초 노래를 만들어요. 전시장에 악기 모양으로 떠다니고, 누르면 들려요.",
    how: ["「🎹 내 노래 만들기」 → 악기 고르기 → 「● 녹음 시작」 → 건반 치기", "「■ 녹음 끝」 → 「▶ 들어 보기」 → 「🎉 네, 전시해요!」"],
  },
];

export default function Guide({ org, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal guide" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="닫기">✕</button>
        <div className="guide-head">
          <span className="org">{org}</span>
          <h2>우리 어린이집 온라인 전시회에 오신 것을 환영합니다! 🎪</h2>
          <p className="sub">아이들과 함께 체험·그림·음악 전시를 즐겨보세요!</p>
          <p className="sub">아래 세 가지 전시 중 원하는 전시를 선택해 놀이하고, 전시 공간에 펼쳐진 친구들의 작품도 함께 감상해 보세요!</p>
        </div>
        <ol className="guide-list">
          {ITEMS.map((it) => (
            <li key={it.title} style={{ "--c": it.color }}>
              <div className="g-ic">{it.emoji}</div>
              <div>
                <b>{it.title}</b>
                <p>{it.what}</p>
                <ul>{it.how.map((h) => <li key={h}>{h}</li>)}</ul>
              </div>
            </li>
          ))}
        </ol>
        <div className="guide-tips">
          <span>👆 화면을 좌우로 밀면 전시장을 둘러볼 수 있어요</span>
          <span>❓ 이 설명은 오른쪽 위 「사용법」 단추로 다시 볼 수 있어요</span>
        </div>
        <button className="btn big" onClick={onClose}>시작할게요!</button>
      </div>
    </div>
  );
}
