"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { loadSpace, saveSpace, loadItems, setItemHidden, sha256, DEFAULT_VIDEO } from "../../lib/supabase";
import { INSTRUMENTS, playSong } from "../../lib/synth";
import { moodOf } from "./DrawGallery";

export default function Admin({ code }) {
  const [space, setSpace] = useState(undefined);
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [draws, setDraws] = useState([]);
  const [songs, setSongs] = useState([]);
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    loadSpace(code).then((s) => {
      setSpace(s);
      if (s) {
        setName(s.name); setVideoUrl(s.videoUrl || "");
        try { if (sessionStorage.getItem(`ex-admin-${code}`) === s.pinHash) setOk(true); } catch {}
      }
    }).catch(() => setSpace(null));
  }, [code]);
  useEffect(() => {
    if (!ok) return;
    QRCode.toDataURL(`${origin}/e/${code}`, { width: 400, margin: 1, color: { dark: "#3a2d2a" } }).then(setQr).catch(() => {});
    refresh();
  }, [ok, origin, code]);

  const refresh = async () => {
    try {
      const [d, m] = await Promise.all([loadItems("d", code), loadItems("m", code)]);
      setDraws(d.sort((a, b) => (a.id < b.id ? 1 : -1)));
      setSongs(m.sort((a, b) => (a.id < b.id ? 1 : -1)));
    } catch (e) { setMsg("목록을 못 불러왔어요: " + (e.message || e)); }
  };
  const login = async () => {
    setErr("");
    const h = await sha256(pin);
    if (h !== space.pinHash) return setErr("비밀번호가 달라요.");
    try { sessionStorage.setItem(`ex-admin-${code}`, h); } catch {}
    setOk(true);
  };
  const saveInfo = async () => {
    if (!name.trim()) return setMsg("어린이집 이름을 확인해 주세요.");
    setBusy(true);
    try {
      const data = { ...space, name: name.trim().slice(0, 40), videoUrl: videoUrl.trim() };
      delete data.code;
      await saveSpace(code, data);
      setSpace({ code, ...data });
      setMsg("저장했어요. 전시회를 새로고침하면 반영돼요.");
    } catch (e) { setMsg("저장 실패: " + (e.message || e)); } finally { setBusy(false); }
  };
  const toggle = async (kind, it) => {
    try {
      await setItemHidden(it, !it.hidden);
      const upd = (list) => list.map((x) => (x.id === it.id ? { ...x, hidden: !it.hidden } : x));
      if (kind === "d") setDraws(upd); else setSongs(upd);
    } catch (e) { setMsg("바꾸지 못했어요: " + (e.message || e)); }
  };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); setMsg("주소를 복사했어요."); } catch { prompt("복사하세요", t); } };

  if (space === undefined) return <main className="page"><div className="card">여는 중…</div></main>;
  if (!space) return <main className="page"><div className="card"><h2>전시회를 찾지 못했어요</h2><a className="btn ghost" href="/">첫 화면으로</a></div></main>;
  if (!ok)
    return (
      <main className="page">
        <div className="card">
          <h2>🔐 {space.name} 전시회 관리</h2>
          <p className="sub">전시회를 만들 때 정한 관리 비밀번호를 넣어 주세요.</p>
          <input className="inp" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="비밀번호" />
          {err && <div className="err">{err}</div>}
          <div style={{ height: 12 }} />
          <button className="btn" onClick={login}>들어가기</button>
        </div>
      </main>
    );

  const links = [
    ["학부모 링크 (전시회 로비)", `${origin}/e/${code}`],
    ["체험 전시 바로가기", `${origin}/e/${code}/play`],
    ["그림 전시 바로가기", `${origin}/e/${code}/draw`],
    ["음악 전시 바로가기", `${origin}/e/${code}/music`],
    ["기관 수정 링크 (이 화면)", `${origin}/e/${code}/admin`],
  ];
  return (
    <main className="page">
      <div className="hero"><h1>{space.name} 전시회 관리</h1><p>전시회 코드 <b>{code}</b></p></div>
      {msg && <div className="toast" onClick={() => setMsg("")}>{msg}</div>}

      <div className="card">
        <h2>1. 주소와 QR</h2>
        {qr && <img className="qrbig" src={qr} alt="학부모 입장 QR" />}
        <p className="sub" style={{ textAlign: "center" }}>QR을 길게 눌러(또는 오른쪽 클릭) 저장해 안내문에 넣으세요.</p>
        {links.map(([label, url]) => (
          <div className="linkbox" key={url}>
            <b>{label}</b><code>{url}</code>
            <div className="row">
              <button className="btn sm" onClick={() => copy(url)}>주소 복사</button>
              <a className="btn sm ghost" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>열어 보기</a>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>2. 어린이집 이름 · 체험 영상</h2>
        <label className="f">어린이집 이름</label>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <label className="f">체험 전시 영상 주소 (비워 두면 기본 「따라 해 보세요」 영상)</label>
        <input className="inp" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={DEFAULT_VIDEO} />
        <p className="sub" style={{ marginTop: 6 }}>mp4 파일 주소를 넣으면 우리 원만의 체험 영상으로 바뀌어요.</p>
        <button className="btn" onClick={saveInfo} disabled={busy}>{busy ? "저장 중…" : "저장"}</button>
      </div>

      <div className="card">
        <h2>3. 그림 전시 ({draws.filter((d) => !d.hidden).length}장 표시 중 / 전체 {draws.length}장)</h2>
        <p className="sub">잘못 올라온 그림은 「숨기기」로 전시장에서 빼요. 언제든 되살릴 수 있어요.</p>
        <div className="row" style={{ marginBottom: 8 }}><button className="btn sm ghost" onClick={refresh}>새로고침</button></div>
        <div className="thumbs">
          {draws.map((d) => (
            <div key={d.id} className={`thumb${d.hidden ? " hidden-row" : ""}`}>
              <img src={d.img} alt="" loading="lazy" />
              <div className="thumb-cap"><b>{d.name || "이름 없음"}</b> {d.mood && <span>{moodOf(d.mood)?.emoji}</span>}<small>{new Date(d.at).toLocaleDateString("ko-KR")}</small></div>
              <button className="btn sm ghost" onClick={() => toggle("d", d)}>{d.hidden ? "되살리기" : "숨기기"}</button>
            </div>
          ))}
          {!draws.length && <p className="sub">아직 그림이 없어요.</p>}
        </div>
      </div>

      <div className="card">
        <h2>4. 음악 전시 ({songs.filter((s) => !s.hidden).length}곡 표시 중 / 전체 {songs.length}곡)</h2>
        <table className="list">
          <thead><tr><th>이름</th><th>악기</th><th>길이</th><th></th><th></th></tr></thead>
          <tbody>
            {songs.map((s) => {
              const inst = INSTRUMENTS.find((i) => i.id === s.inst) || INSTRUMENTS[0];
              return (
                <tr key={s.id} className={s.hidden ? "hidden-row" : ""}>
                  <td><b>{s.name || "이름 없음"}</b></td>
                  <td>{inst.emoji} {inst.name}</td>
                  <td>{Math.round((s.dur || 0) / 1000)}초</td>
                  <td><button className="btn sm ghost" onClick={() => playSong(s.notes || [], s.inst)}>▶ 듣기</button></td>
                  <td><button className="btn sm ghost" onClick={() => toggle("m", s)}>{s.hidden ? "되살리기" : "숨기기"}</button></td>
                </tr>
              );
            })}
            {!songs.length && <tr><td colSpan={5} className="sub">아직 노래가 없어요.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
