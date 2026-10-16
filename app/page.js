"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { createSpace } from "../lib/supabase";

export default function Home() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [made, setMade] = useState(null);
  const [goCode, setGoCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");
  const [video, setVideo] = useState(false); // 사용법 영상 팝업

  useEffect(() => setOrigin(window.location.origin), []);
  // 사용법 영상: 이 브라우저에서 처음 열 때 자동으로 한 번 (단추로 언제든 다시)
  useEffect(() => {
    try { if (!sessionStorage.getItem("ex-home-video")) { setVideo(true); sessionStorage.setItem("ex-home-video", "1"); } } catch { setVideo(true); }
  }, []);
  useEffect(() => {
    if (!made) return;
    QRCode.toDataURL(`${origin}/e/${made.code}`, { width: 400, margin: 1, color: { dark: "#3a2d2a" } }).then(setQr).catch(() => {});
  }, [made, origin]);

  const create = async () => {
    setErr("");
    if (!name.trim()) return setErr("어린이집 이름을 적어 주세요.");
    if (!/^\d{4,8}$/.test(pin)) return setErr("관리 비밀번호는 숫자 4~8자리로 정해 주세요.");
    setBusy(true);
    try {
      const code = await createSpace({ name: name.trim().slice(0, 40), pin });
      setMade({ code });
    } catch (e) {
      setErr("전시회를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요. (" + (e.message || e) + ")");
    } finally {
      setBusy(false);
    }
  };
  const copy = async (label, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); }
    catch { prompt("아래 주소를 길게 눌러 복사하세요", text); }
  };
  const summary = made
    ? [
        `🎪 ${name.trim() || "우리 어린이집"} 온라인 전시회`,
        ``,
        `① 학부모 공유용 링크 (카톡·QR로 공유)`,
        `${origin}/e/${made.code}`,
        ``,
        `② 기관 관리용 링크 (비밀번호 필요 · 학부모님께 공유하지 마세요)`,
        `${origin}/e/${made.code}/admin`,
        ``,
        `전시회 코드: ${made.code}`,
        `관리 비밀번호: (만들 때 정한 숫자)`,
      ].join(String.fromCharCode(10))
    : "";
  const go = () => {
    const c = goCode.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (c.length < 6) return;
    window.location.href = `/e/${c}`;
  };

  return (
    <main className="page">
      <div className="hero">
        <div className="hero-ic">🎪</div>
        <h1>우리 어린이집 온라인 전시회</h1>
        <div className="notice">
          2026년 「AI 보육을 디자인하다」 성과보고회 참석자를 위해 제작한 온라인 전시회입니다.
          <div className="notice-claude">
            <b>✨ Claude와 함께 만드는 온라인 전시회</b>
            <span>본 온라인 전시회는 AI 도구 Claude로 코딩하여 제작하였습니다.</span>
          </div>
        </div>
        <p>체험·그림·음악 놀이를 아이들과 함께 즐기고, 우리 어린이집만의 전시회를 만들어 학부모님과 공유해 보세요!</p>
        <div className="video-sec">
          <b>📺 사용방법 안내 영상 보기</b>
          <p>처음 이용하시는 분은 안내 영상(1분 38초)을 시청해 주세요. 영상을 보며 쉽게 따라 하실 수 있습니다.</p>
          <button className="btn video-btn" onClick={() => setVideo(true)}>📺 사용방법 영상 보기</button>
        </div>
      </div>

      {made ? (
        <div className="card">
          <h2>🎉 우리 어린이집 전시회가 열렸어요!</h2>
          <p className="sub">아래 두 가지 주소를 꼭 저장해 주세요.</p>
          <p className="sub">⚠️ 특히 <b>기관 관리 주소</b>는 이 화면을 닫으면 다시 볼 수 없어요!<br />화면을 닫기 전에 반드시 복사하여 안전하게 보관해 주세요.</p>
          {qr && <img className="qrbig" src={qr} alt="학부모 입장 QR" />}
          <LinkBox label="① 학부모 공유용 링크 (카톡·QR로 공유)" url={`${origin}/e/${made.code}`} copy={copy} copied={copied} />
          <LinkBox label="② 기관 관리용 링크 (비밀번호 필요 · 전시회 이름 변경·콘텐츠 공개 관리)" note="※ 학부모님께 공유하지 마세요!" url={`${origin}/e/${made.code}/admin`} copy={copy} copied={copied} />
          <div className="allcopy">
            <b>📋 전시회 정보 모아 저장하기</b>
            <p>전시회 주소 2개와 전시회 코드, 관리 비밀번호를 한 번에 복사할 수 있습니다.</p>
            <p>[전체 복사하기] 버튼을 누른 후, <u>카카오톡 ‘나에게 보내기’</u>에 붙여넣어 안전하게 보관해 주세요.</p>
            <p>※ 학부모님께는 <b>학부모 공유용 링크</b>만 전달해 주세요.</p>
            <pre>{summary}</pre>
            <button className="btn big" onClick={() => copy("all", summary)}>{copied === "all" ? "복사됐어요 ✓  이제 카톡에 붙여 넣으세요" : "📋 전체 복사하기"}</button>
          </div>
          <div style={{ height: 12 }} />
          <a className="btn" href={`/e/${made.code}`} style={{ textDecoration: "none" }}>전시회 열어보기 →</a>
        </div>
      ) : (
        <div className="card">
          <h2>🎪 우리 어린이집 전시회 만들기 (기관용)</h2>
          <p className="sub">어린이집 이름과 관리 비밀번호를 입력해 주세요.<br />어린이집별로 하나의 전시회를 만들 수 있으며, 학부모님께 공유할 전시회 주소(링크)가 생성됩니다.</p>
          <label className="f">어린이집 이름</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 해오라기어린이집" maxLength={40} />
          <label className="f">관리 비밀번호 (숫자 4~8자리)</label>
          <input className="inp" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="예) 1234" inputMode="numeric" maxLength={8} />
          {err && <div className="err">{err}</div>}
          <div style={{ height: 14 }} />
          <button className="btn" onClick={create} disabled={busy}>{busy ? "만드는 중…" : "전시회 만들기"}</button>
        </div>
      )}

      <div className="card">
        <h2>🔑 우리 어린이집 전시회 다시 열기</h2>
        <p className="sub">이전에 만든 전시회의 코드(영문·숫자 6자리)를 입력해 주세요.</p>
        <div className="row">
          <input className="inp" value={goCode} onChange={(e) => setGoCode(e.target.value)} placeholder="예: bpyp6c" maxLength={6} onKeyDown={(e) => e.key === "Enter" && go()} />
          <button className="btn" style={{ width: 110 }} onClick={go} disabled={goCode.trim().length < 6}>열기</button>
        </div>
      </div>

      {video && (
        <div className="modal-bg" onClick={() => setVideo(false)}>
          <div className="modal vmodal" onClick={(e) => e.stopPropagation()}>
            <button className="x" onClick={() => setVideo(false)} aria-label="닫기">✕</button>
            <h2>📺 사용법 영상(1분38초)</h2>
            <video className="vmodal-video" src="https://pgywpdodatjfpivxmymn.supabase.co/storage/v1/object/public/suseong-hub/expo/guide-v2.mp4" controls autoPlay playsInline />
            <button className="btn" onClick={() => setVideo(false)} style={{ marginTop: 12 }}>영상 시청 완료! 전시회 만들기</button>
          </div>
        </div>
      )}

      <div className="card soft">
        <h2>🌈 온라인 전시회에서 만나는 특별한 놀이</h2>
        <ul className="feat">
          <li><span>🎉</span><div><b>체험 전시</b><br />화면 속 움직임을 따라 하며 몸으로 즐기는 놀이</div></li>
          <li><span>🎨</span><div><b>그림 전시</b><br />오늘의 기분을 그림으로 표현하고 전시하는 놀이</div></li>
          <li><span>🎵</span><div><b>음악 전시</b><br />피아노·실로폰·오르골로 나만의 30초 음악을 만드는 놀이</div></li>
        </ul>
      </div>
      <footer className="home-foot">
        <img src="/logo-childcare.png" alt="수성구육아종합지원센터" />
        <span>본 자료는 수성구육아종합지원센터가 제작하여 배포하였습니다.</span>
      </footer>
    </main>
  );
}

function LinkBox({ label, note, url, copy, copied }) {
  return (
    <div className="linkbox">
      <b>{label}</b>
      {note && <div className="linknote">{note}</div>}
      <code>{url}</code>
      <div className="row">
        <button className="btn sm" onClick={() => copy(label, url)}>{copied === label ? "복사됐어요 ✓" : "주소 복사"}</button>
        <a className="btn sm ghost" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>열어보기</a>
      </div>
    </div>
  );
}
