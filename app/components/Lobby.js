"use client";

export const CHAPTERS = [
  { id: "play", title: "체험 전시", en: "PLAY", emoji: "🤸", img: "/ch-play.jpg", color: "#ff6b6b",
    desc: "화면 속 사람을 따라 몸을 움직여요. 가족이 함께하면 더 재미있어요!" },
  { id: "draw", title: "그림 전시", en: "DRAW", emoji: "🎨", img: "/ch-draw.jpg", color: "#4d96ff",
    desc: "오늘 내 기분을 얼굴 그림으로 그려요. 다 그리면 전시장에 둥둥 떠다녀요." },
  { id: "music", title: "음악 전시", en: "MUSIC", emoji: "🎵", img: "/ch-music.jpg", color: "#6bcb77",
    desc: "피아노·실로폰·오르골로 나만의 노래를 30초 녹음해 전시해요." },
];

export default function Lobby({ space }) {
  const { code, name } = space;
  return (
    <main className="lobby">
      <header className="lobby-head">
        <span className="org">{name}</span>
        <h1>온라인 전시회</h1>
        <p>보고 싶은 전시를 눌러 들어가 보세요</p>
      </header>
      <section className="chapters">
        {CHAPTERS.map((c, i) => (
          <a key={c.id} className="chapter" href={`/e/${code}/${c.id}`} style={{ "--c": c.color, animationDelay: `${i * 0.12}s` }}>
            <div className="ch-img has-img" style={{ "--img": `url(${c.img})` }}>
              <span className="ch-emoji">{c.emoji}</span>
              <span className="ch-num">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="ch-body">
              <div className="ch-en">{c.en}</div>
              <h2>{c.title}</h2>
              <p>{c.desc}</p>
              <span className="ch-go">입장하기 →</span>
            </div>
          </a>
        ))}
      </section>
      <footer className="lobby-foot">
        <a href={`/e/${code}/admin`}>기관 관리</a>
      </footer>
    </main>
  );
}
