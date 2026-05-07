// Konular sayfası — KPSS müfredat konuları (todo/active/done) + her ders için YouTube playlist takibi
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Label,
  Icon,
  ConfirmModal,
} from "../components/ui";
import { KPSS_SUBJECTS } from "../utils/subjects";
import { useViewport } from "../hooks/useViewport";
import { usePersistentState } from "../hooks/usePersistentState";
import kpssStore from "../store/store";

function TopicsPage() {
  const SUBJ = KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);

  const [state, setState] = useState(kpssStore.get());
  useEffect(() => kpssStore.subscribe(setState), []);
  const { isMobile, isTablet } = useViewport();

  // Site-genel kural: kullanıcı en son hangi dersteyse, geri döndüğünde aynı yerden açılsın.
  const [activeSubj, setActiveSubjRaw] = usePersistentState("topics.activeSubj", subjectKeys[0]);
  const setActiveSubj = (sk) => {
    if (subjectKeys.includes(sk)) setActiveSubjRaw(sk);
    else setActiveSubjRaw(subjectKeys[0]);
  };
  const [csvOpen, setCsvOpen] = useState(false);
  const [pendingPlDelete, setPendingPlDelete] = useState(null);
  const [expandedPl, setExpandedPl] = useState(null);

  // Geçersiz/silinmiş ders anahtarı varsa ilk dersliğe düş.
  useEffect(() => {
    if (!subjectKeys.includes(activeSubj)) setActiveSubjRaw(subjectKeys[0]);
  }, [activeSubj]);

  const subj = SUBJ[activeSubj];
  const status = state.topicStatus[activeSubj] || {};
  const subjPlaylists = state.playlists.filter((p) => p.subject === activeSubj);

  const overallStats = useMemo(() => {
    let total = 0, done = 0, active = 0;
    for (const sk of subjectKeys) {
      const topics = SUBJ[sk].topics;
      const ss = state.topicStatus[sk] || {};
      total += topics.length;
      for (const t of topics) {
        if (ss[t] === "done") done++;
        else if (ss[t] === "active") active++;
      }
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, active, pct };
  }, [state.topicStatus]);

  const subjStats = useMemo(() => {
    const topics = subj.topics;
    let done = 0, active = 0;
    for (const t of topics) {
      if (status[t] === "done") done++;
      else if (status[t] === "active") active++;
    }
    const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
    return { total: topics.length, done, active, pct };
  }, [activeSubj, state.topicStatus]);

  const cycleStatus = (topic) => {
    const cur = status[topic];
    const next = cur === "done" ? "todo" : (cur === "active" ? "done" : "active");
    kpssStore.setTopicStatus(activeSubj, topic, next);
  };

  const confirmPlDelete = () => {
    if (pendingPlDelete) kpssStore.deletePlaylist(pendingPlDelete);
    setPendingPlDelete(null);
  };

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px 16px" : "28px 32px 64px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
          Konular
        </h1>
        <p style={{ fontSize: 13.5, color: "#71717a", margin: "4px 0 0 0" }}>
          Hangi konuya başlamadın, çalışıyorsun, bitirdin — takip et. YouTube oynatma listelerini de buraya yükle.
        </p>
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <TStat label="Toplam Konu" value={overallStats.total} accent="#a1a1aa" />
        <TStat label="Bitirilen" value={overallStats.done} accent="#10b981" />
        <TStat label="Aktif" value={overallStats.active} accent="#f59e0b" />
        <TStat label="Genel İlerleme" value={`%${overallStats.pct}`} accent="#06b6d4" />
      </div>

      {/* Subject selector */}
      <Card style={{ padding: isMobile ? 12 : 14, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {subjectKeys.map((sk) => {
            const s = SUBJ[sk];
            const ss = state.topicStatus[sk] || {};
            const ssDone = s.topics.filter((t) => ss[t] === "done").length;
            const pct = s.topics.length ? Math.round((ssDone / s.topics.length) * 100) : 0;
            const isActive = sk === activeSubj;
            return (
              <button
                key={sk}
                onClick={() => setActiveSubj(sk)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 12px",
                  border: "1px solid " + (isActive ? s.color : "#27272a"),
                  background: isActive ? s.color + "22" : "transparent",
                  color: isActive ? s.color : "#a1a1aa",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                {s.name}
                <span style={{ fontSize: 11, color: isActive ? s.color : "#52525b", fontVariantNumeric: "tabular-nums" }}>
                  · %{pct}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Topics card */}
      <Card style={{ padding: isMobile ? 16 : 22, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: subj.color }} />
            <h2 style={{ fontSize: 14.5, fontWeight: 600, color: "#fafafa", margin: 0 }}>
              {subj.name} — Konular
            </h2>
            <span style={{ fontSize: 11, color: "#52525b" }}>({subjStats.total})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#a1a1aa" }}>
            <span style={{ color: subj.color, fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
              {subjStats.done} / {subjStats.total}
            </span>
            <span style={{ color: "#27272a" }}>·</span>
            <span style={{ color: "#a1a1aa", fontVariantNumeric: "tabular-nums" }}>%{subjStats.pct}</span>
          </div>
        </div>

        <div style={{ height: 6, background: "#18181c", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
          <div
            style={{
              height: "100%",
              width: subjStats.pct + "%",
              background: `linear-gradient(90deg, ${subj.color}, ${subj.color}88)`,
              borderRadius: 3,
              transition: "width 0.4s",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, fontSize: 11, color: "#71717a" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, border: "1.5px solid #3f3f46", borderRadius: "50%", display: "inline-block" }} />
            Başlamadın
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, background: "#f59e0b", borderRadius: "50%", display: "inline-block" }} />
            Aktif
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
            Bitti
          </span>
          <span style={{ color: "#52525b", marginLeft: "auto" }}>
            Sırayla geçiş için satıra tıkla
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr", gap: 8 }}>
          {subj.topics.map((t) => {
            const st = status[t] || "todo";
            const meta = st === "done"
              ? { color: "#10b981", bg: "#06120e", border: "#0e3b2c", label: "Bitti", strike: true }
              : st === "active"
              ? { color: "#f59e0b", bg: "#1a1207", border: "#3b2a0e", label: "Aktif", strike: false }
              : { color: "#71717a", bg: "#0a0a0c", border: "#1f1f23", label: null, strike: false };
            return (
              <button
                key={t}
                onClick={() => cycleStatus(t)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px",
                  background: meta.bg,
                  border: "1px solid " + meta.border,
                  borderRadius: 8,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 20, height: 20,
                    borderRadius: "50%",
                    background: st === "todo" ? "transparent" : meta.color,
                    border: "1.5px solid " + (st === "todo" ? "#3f3f46" : meta.color),
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {st === "done" && <Icon name="check" size={11} color="#04140e" strokeWidth={3} />}
                </span>
                <span style={{
                  flex: 1, minWidth: 0,
                  fontSize: 13,
                  color: st === "todo" ? "#d4d4d8" : meta.color,
                  fontWeight: 500,
                  textDecoration: meta.strike ? "line-through" : "none",
                  opacity: meta.strike ? 0.85 : 1,
                  whiteSpace: "normal",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {t}
                </span>
                {meta.label && (
                  <span style={{
                    fontSize: 9.5, color: meta.color, padding: "2px 7px", borderRadius: 4,
                    background: meta.color + "22", letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase",
                    flexShrink: 0,
                  }}>
                    {meta.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Playlists card */}
      <Card style={{ padding: isMobile ? 16 : 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="music" size={16} color={subj.color} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
                {subj.name} — Çalışma Listeleri
              </h2>
              <span style={{ fontSize: 11, color: "#52525b" }}>({subjPlaylists.length})</span>
            </div>
            <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0 24px" }}>
              YouTube oynatma listenden CSV indir, buraya yükle, izledikçe işaretle.
            </p>
          </div>
          <Button onClick={() => setCsvOpen(true)}>
            <Icon name="plus" size={14} color="#04140e" /> CSV Yükle
          </Button>
        </div>

        <div style={{ padding: "10px 14px", background: "#0a0a0c", border: "1px dashed #27272a", borderRadius: 8, fontSize: 12, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 14 }}>
          <strong style={{ color: "#d4d4d8" }}>📝 CSV nasıl oluşturulur?</strong>
          <div style={{ marginTop: 4 }}>
            <a
              href="https://sanishtech.com/tools/youtube-playlist-link-extractor/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: subj.color, textDecoration: "underline", wordBreak: "break-all" }}
            >
              sanishtech.com/tools/youtube-playlist-link-extractor
            </a>{" "}
            adresine git → YouTube playlist linkini yapıştır → "Download CSV" butonuyla indir → buradaki <em>CSV Yükle</em> ile yükle.
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#71717a" }}>
            Videolar burada gömülü oynatılmaz; başlıklar liste olarak görünür, link ile YouTube'a gidersin.
          </div>
        </div>

        {subjPlaylists.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#52525b" }}>
            <Icon name="music" size={28} color="#3f3f46" />
            <div style={{ marginTop: 10, fontSize: 13 }}>
              Henüz {subj.name} için yüklü oynatma listesi yok
            </div>
            <Button style={{ marginTop: 12 }} onClick={() => setCsvOpen(true)}>
              <Icon name="plus" size={14} color="#04140e" /> İlk Listeyi Yükle
            </Button>
          </div>
        ) : (
          <>
            {/* Bilgi: Ana sayfa ilerlemesinde sadece seçili listeler sayılır */}
            <div style={{ padding: "8px 12px", background: "#0a0a0c", border: "1px solid #18181c", borderRadius: 8, fontSize: 11.5, color: "#a1a1aa", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Icon name="target" size={12} color="#10b981" />
              <span>
                Ana sayfadaki <strong style={{ color: "#d4d4d8" }}>Çalışma İlerlemesi</strong> hesabına sadece <strong style={{ color: subj.color }}>seçili</strong> oynatma listeleri katılır. Birden fazla seçersen toplamı alınır.
              </span>
              <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums", color: "#71717a" }}>
                {subjPlaylists.filter((p) => p.selected).length} / {subjPlaylists.length} seçili
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subjPlaylists.map((pl) => (
                <PlaylistRow
                  key={pl.id}
                  playlist={pl}
                  color={subj.color}
                  expanded={expandedPl === pl.id}
                  onToggle={() => setExpandedPl(expandedPl === pl.id ? null : pl.id)}
                  onDelete={() => setPendingPlDelete(pl.id)}
                  onToggleVideo={(idx) => kpssStore.togglePlaylistVideo(pl.id, idx)}
                  onMarkAll={(watched) => kpssStore.setPlaylistAllWatched(pl.id, watched)}
                  onRename={(newName) => kpssStore.renamePlaylist(pl.id, newName)}
                  onToggleSelected={() => kpssStore.setPlaylistSelected(pl.id, !pl.selected)}
                />
              ))}
            </div>
          </>
        )}
      </Card>

      {csvOpen && <CsvUploadModal defaultSubject={activeSubj} onClose={() => setCsvOpen(false)} />}
      {pendingPlDelete && (
        <ConfirmModal
          title="Oynatma listesi silinsin mi?"
          message="Liste ve içindeki tüm video işaretleri kalıcı olarak silinecek. Geri alınamaz."
          confirmLabel="Sil"
          danger
          onConfirm={confirmPlDelete}
          onCancel={() => setPendingPlDelete(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Mini stat tile (locally namespaced — `MiniStat` ismi exams.jsx'te kullanılıyor)
// ---------------------------------------------------------------------
function TStat({ label, value, accent }) {
  return (
    <div
      style={{
        background: "#111114",
        border: "1px solid #1f1f23",
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `radial-gradient(circle, ${accent}22, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", marginTop: 6 }}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Playlist row
// ---------------------------------------------------------------------
function PlaylistRow({ playlist, color, expanded, onToggle, onDelete, onToggleVideo, onMarkAll, onRename, onToggleSelected }) {
  const { isMobile } = useViewport();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);

  useEffect(() => { setName(playlist.name); }, [playlist.name]);

  const total = playlist.videos.length;
  const done = playlist.videos.filter((v) => v.watched).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const selected = playlist.selected !== false;

  const submitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== playlist.name) onRename(trimmed);
    else setName(playlist.name);
    setEditing(false);
  };

  return (
    <div style={{
      background: selected ? "#0a0a0c" : "#08080a",
      border: "1px solid " + (selected ? "#18181c" : "#141417"),
      borderRadius: 10,
      opacity: selected ? 1 : 0.62,
      transition: "opacity 0.15s, background 0.15s, border 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, flexWrap: "wrap" }}>
        <button
          onClick={onToggleSelected}
          title={selected ? "Bu listeyi ana sayfa ilerlemesinden çıkar" : "Bu listeyi ana sayfa ilerlemesine dahil et"}
          aria-pressed={selected}
          aria-label={selected ? "Seçimi kaldır" : "Seç"}
          style={{
            flexShrink: 0,
            width: 22, height: 22, borderRadius: 6,
            background: selected ? color : "transparent",
            border: "1.5px solid " + (selected ? color : "#3f3f46"),
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontFamily: "inherit", padding: 0,
          }}
        >
          {selected && <Icon name="check" size={13} color="#04140e" strokeWidth={3} />}
        </button>
        <button
          onClick={onToggle}
          style={tplIconBtn}
          title={expanded ? "Daralt" : "Genişlet"}
          aria-expanded={expanded}
        >
          <span style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", fontSize: 14, lineHeight: 1, color: "#a1a1aa" }}>›</span>
        </button>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitName();
                if (e.key === "Escape") { setName(playlist.name); setEditing(false); }
              }}
              autoFocus
              style={{ width: "100%", background: "#0c0c0e", border: "1px solid #27272a", borderRadius: 6, color: "#e4e4e7", padding: "6px 8px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              style={{ fontSize: 13.5, fontWeight: 600, color: "#fafafa", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title="Adı düzenlemek için tıkla"
            >
              {playlist.name}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
            {done} / {total} video · %{pct}
          </div>
        </div>
        <div style={{ width: isMobile ? "100%" : 110, height: 5, background: "#18181c", borderRadius: 3, overflow: "hidden", flexShrink: 0, order: isMobile ? 4 : 0 }}>
          <div style={{ height: "100%", width: pct + "%", background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: "width 0.4s" }} />
        </div>
        <button onClick={onDelete} title="Listeyi sil" style={tplIconBtn}>
          <Icon name="trash" size={13} color="#71717a" />
        </button>
      </div>
      {expanded && (
        <div style={{ padding: "0 12px 12px 12px", borderTop: "1px solid #18181c" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 0", flexWrap: "wrap" }}>
            <button onClick={() => onMarkAll(true)} style={tplMiniBtn} title="Tüm videoları izlendi olarak işaretle">
              <Icon name="check" size={11} color="#a1a1aa" /> Hepsini işaretle
            </button>
            <button onClick={() => onMarkAll(false)} style={tplMiniBtn} title="Tüm işaretleri kaldır">
              <Icon name="x" size={11} color="#a1a1aa" /> Hepsini sıfırla
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 420, overflowY: "auto" }}>
            {playlist.videos.map((v, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px",
                  background: v.watched ? "#06120e" : "#0c0c0e",
                  border: "1px solid " + (v.watched ? "#0e3b2c" : "#18181c"),
                  borderRadius: 6,
                }}
              >
                <button
                  onClick={() => onToggleVideo(i)}
                  style={{
                    flexShrink: 0,
                    width: 18, height: 18, borderRadius: 4,
                    background: v.watched ? color : "transparent",
                    border: "1.5px solid " + (v.watched ? color : "#3f3f46"),
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontFamily: "inherit", padding: 0,
                  }}
                  title={v.watched ? "İzlendi olarak işaretli — kaldır" : "İzlendi olarak işaretle"}
                  aria-label={v.watched ? "İşareti kaldır" : "İzlendi olarak işaretle"}
                >
                  {v.watched && <Icon name="check" size={11} color="#04140e" strokeWidth={3} />}
                </button>
                <span style={{
                  flex: 1, minWidth: 0,
                  fontSize: 12.5, color: v.watched ? "#71d4af" : "#d4d4d8",
                  textDecoration: v.watched ? "line-through" : "none",
                  opacity: v.watched ? 0.85 : 1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }} title={v.title}>
                  {v.title}
                </span>
                {v.videoUrl && (
                  <a
                    href={v.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="YouTube'da aç"
                    style={{
                      color: "#a1a1aa",
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 5,
                      border: "1px solid #1f1f23",
                      background: "#0a0a0c",
                      textDecoration: "none",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    YouTube ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const tplIconBtn = {
  background: "transparent", border: "1px solid #1f1f23", borderRadius: 6,
  width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", flexShrink: 0,
};
const tplMiniBtn = {
  background: "transparent", border: "1px solid #27272a", borderRadius: 6,
  padding: "5px 10px", color: "#a1a1aa", cursor: "pointer", fontSize: 11.5,
  fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5,
};

// ---------------------------------------------------------------------
// CSV Upload Modal
// ---------------------------------------------------------------------
function CsvUploadModal({ defaultSubject, onClose }) {
  const SUBJ = KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);
  const { isMobile } = useViewport();

  const [subject, setSubject] = useState(defaultSubject || subjectKeys[0]);
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState(null); // { videos, fileName }
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const onFile = async (e) => {
    setError("");
    setParsed(null);
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const rows = parseCsvText(text);
      if (rows.length < 2) throw new Error("CSV en az 1 başlık + 1 satır içermeli.");
      const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
      const idxTitle = header.indexOf("title");
      const idxUrl = header.indexOf("videourl");
      const idxId = header.indexOf("videoid");
      const idxPos = header.indexOf("position");
      const idxPub = header.indexOf("publishedat");
      if (idxTitle === -1 || idxUrl === -1) {
        throw new Error("CSV'de 'title' ve 'videoUrl' sütunları bulunmalı.");
      }
      const videos = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;
        const title = (r[idxTitle] || "").trim();
        const url = (r[idxUrl] || "").trim();
        if (!title || !url) continue;
        videos.push({
          title,
          videoUrl: url,
          videoId: idxId !== -1 ? (r[idxId] || "").trim() : "",
          position: idxPos !== -1 && Number.isFinite(Number(r[idxPos])) ? Number(r[idxPos]) : videos.length,
          publishedAt: idxPub !== -1 ? (r[idxPub] || "").trim() : "",
          watched: false,
        });
      }
      if (!videos.length) throw new Error("CSV'den hiç video çıkartılamadı (title/videoUrl boş?).");
      videos.sort((a, b) => a.position - b.position);
      setParsed({ videos, fileName: f.name });
      if (!name.trim()) {
        const baseName = f.name.replace(/\.csv$/i, "").replace(/[_-]+/g, " ").trim();
        setName(baseName);
      }
    } catch (err) {
      setError(err.message || "CSV ayrıştırılamadı.");
    }
  };

  const onSave = () => {
    setError("");
    if (!parsed) { setError("Önce bir CSV dosyası yükleyin."); return; }
    if (!subject) { setError("Ders seçin."); return; }
    const trimmed = name.trim() || "Adsız Liste";
    kpssStore.addPlaylist({
      subject,
      name: trimmed,
      videos: parsed.videos,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
        padding: isMobile ? 0 : 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0c0e", border: "1px solid #1f1f23",
          borderRadius: isMobile ? "16px 16px 0 0" : 14,
          width: "100%", maxWidth: 560,
          maxHeight: isMobile ? "92vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ position: "sticky", top: 0, background: "#0c0c0e", borderBottom: "1px solid #1f1f23", padding: isMobile ? "16px 18px" : "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fafafa" }}>YouTube Oynatma Listesi Yükle</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#71717a" }}>CSV dosyasını seç, ders ve isim ayarla, kaydet.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 8, width: 32, height: 32, color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Kapat">
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: isMobile ? 18 : 24 }}>
          <div style={{ padding: "10px 14px", background: "#0a0a0c", border: "1px dashed #27272a", borderRadius: 8, fontSize: 12, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 14 }}>
            <strong style={{ color: "#d4d4d8" }}>📝 CSV nasıl üretilir?</strong>
            <div style={{ marginTop: 4 }}>
              <a href="https://sanishtech.com/tools/youtube-playlist-link-extractor/" target="_blank" rel="noopener noreferrer" style={{ color: "#10b981", textDecoration: "underline", wordBreak: "break-all" }}>
                sanishtech.com/tools/youtube-playlist-link-extractor
              </a>{" "}
              adresine git → YouTube playlist linkini yapıştır → CSV olarak indir → buraya yükle.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <Label>Ders</Label>
              <Select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                options={subjectKeys.map((k) => ({ value: k, label: SUBJ[k].name }))}
                placeholder="Ders seç"
              />
            </div>
            <div>
              <Label>Liste Adı</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ramazan Yetgin Tarih 2026"
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Label hint="(.csv)">CSV Dosyası</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              style={{
                width: "100%",
                background: "#0c0c0e",
                border: "1px dashed #27272a",
                borderRadius: 8,
                color: "#a1a1aa",
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            />
          </div>

          {parsed && (
            <div style={{ padding: "10px 14px", background: "#06120e", border: "1px solid #0e3b2c", borderRadius: 8, fontSize: 12, color: "#71d4af", marginBottom: 12 }}>
              <div>
                ✓ <strong style={{ color: "#10b981" }}>{parsed.videos.length}</strong> video bulundu — <span style={{ color: "#a1a1aa" }}>{parsed.fileName}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: "#52525b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                İlk: {parsed.videos[0].title}
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "#1a0c0e", border: "1px solid #3b1d1e", borderRadius: 8, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert" size={14} color="#ef4444" /> {error}
            </div>
          )}
        </div>

        <div style={{ position: "sticky", bottom: 0, background: "#0c0c0e", borderTop: "1px solid #1f1f23", padding: isMobile ? "14px 18px" : "16px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button onClick={onSave} disabled={!parsed}>
            <Icon name="check" size={14} color="#04140e" /> Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// CSV parser — RFC4180-lite. Quoted fields (with "" escapes) supported;
// unquoted fields are split by commas. Sanishtech çıktısında alanlar
// quote'suzdur ama başlıkta virgül olabilir; quote desteği güvende kalmak için.
// ---------------------------------------------------------------------
function parseCsvText(text) {
  const rows = [];
  let cur = [];
  let cell = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuote = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"' && cell === "") {
        inQuote = true;
      } else if (ch === ",") {
        cur.push(cell);
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        cur.push(cell);
        if (cur.length > 1 || cur[0] !== "") rows.push(cur);
        cur = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }
  if (cell !== "" || cur.length > 0) {
    cur.push(cell);
    if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  }
  return rows;
}

export default TopicsPage;
