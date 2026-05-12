// Deneme Sınavları page — chart on top + Deneme Ekle button + modal form + full data list
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Label,
  Chip,
  Tabs,
  Icon,
  ConfirmModal,
  fmtDate,
  calcNet,
  round2,
  trDateKey,
  trToday,
  trMakeIso,
} from "../components/ui";
import { KPSS_SUBJECTS } from "../utils/subjects";
import { useViewport } from "../hooks/useViewport";
import { usePersistentState } from "../hooks/usePersistentState";
import kpssStore from "../store/store";
import ExamChart from "../components/ExamChart";

function ExamsPage() {
  const [state, setState] = useState(kpssStore.get());
  useEffect(() => kpssStore.subscribe(setState), []);
  const { isMobile, isTablet } = useViewport();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [filterType, setFilterType] = usePersistentState("exams.filterType", "all"); // all | genel | brans
  const [chartKind, setChartKind] = usePersistentState("exams.chartKind", "genel"); // genel | brans

  const openAdd = () => { setEditingId(null); setModalOpen(true); };
  const openEdit = (id) => { setEditingId(id); setModalOpen(true); };
  const requestDelete = (id) => setPendingDeleteId(id);
  const confirmDelete = () => {
    if (pendingDeleteId) kpssStore.deleteExam(pendingDeleteId);
    setPendingDeleteId(null);
  };
  const cancelDelete = () => setPendingDeleteId(null);

  const generalCount = state.exams.filter((e) => e.type === "genel").length;
  const bransCount = state.exams.filter((e) => e.type === "brans").length;
  const avgGeneralNet = useMemo(() => {
    const ge = state.exams.filter((e) => e.type === "genel");
    if (!ge.length) return 0;
    let t = 0;
    for (const e of ge) for (const sk of Object.keys(e.subjects)) t += calcNet(e.subjects[sk].correct, e.subjects[sk].wrong);
    return t / ge.length;
  }, [state.exams]);

  const filteredExams = useMemo(() => {
    const list = filterType === "all" ? state.exams : state.exams.filter((e) => e.type === filterType);
    return [...list].sort((a, b) => {
      const da = trDateKey(a.date), db = trDateKey(b.date);
      if (da !== db) return da < db ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    });
  }, [state.exams, filterType]);

  const editingExam = editingId ? state.exams.find((e) => e.id === editingId) : null;

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px 16px" : "28px 32px 64px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
            Deneme Sınavları
          </h1>
          <p style={{ fontSize: 13.5, color: "#71717a", margin: "4px 0 0 0" }}>
            Genel ve branş denemelerini takip et, eksiklerini gör.
          </p>
        </div>
      </div>

      {/* Summary mini-stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <MiniStat label="Genel Deneme" value={generalCount} accent="#10b981" />
        <MiniStat label="Branş Denemesi" value={bransCount} accent="#06b6d4" />
        <MiniStat label="Ortalama Net" value={round2(avgGeneralNet)} suffix="/ 120" accent="#a78bfa" />
      </div>

      {/* Chart card */}
      <Card style={{ padding: isMobile ? 16 : 24, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="trend" size={16} color={chartKind === "brans" ? "#06b6d4" : "#10b981"} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
                {chartKind === "brans" ? "Branş Deneme Performansı" : "Genel Deneme Performansı"}
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "#71717a", margin: "2px 0 0 24px" }}>
              {chartKind === "brans"
                ? "Branş denemelerini ders bazında ve süre olarak incele."
                : "Aralık seç, ders bazına geç ve her noktayı incele."}
            </p>
          </div>
          <Tabs
            value={chartKind}
            onChange={setChartKind}
            tabs={[
              { value: "genel", label: "Genel" },
              { value: "brans", label: "Branş" },
            ]}
          />
        </div>
        <ExamChart exams={state.exams} isMobile={isMobile} kind={chartKind} goals={state.goals} />
      </Card>

      {/* Data list */}
      <Card style={{ padding: isMobile ? 16 : 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="list" size={16} color="#71717a" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>Deneme Kayıtları</h2>
            <span style={{ fontSize: 11, color: "#52525b" }}>({filteredExams.length})</span>
          </div>

          <Tabs
            value={filterType}
            onChange={setFilterType}
            tabs={[
              { value: "all", label: "Tümü" },
              { value: "genel", label: "Genel" },
              { value: "brans", label: "Branş" },
            ]}
          />

          {/* Inline add button — kayıtların başında, tekrar yukarı çıkmak gerekmesin diye */}
          <div style={{ display: "flex", justifyContent: "center", borderBottom: "1px dashed #1f1f23" }}>
            <Button onClick={openAdd}>
              <Icon name="plus" size={14} color="#04140e" /> Deneme Ekle
            </Button>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "#52525b" }}>
            <Icon name="book" size={32} color="#3f3f46" />
            <div style={{ marginTop: 12, fontSize: 13 }}>Henüz deneme kaydı yok</div>
            <Button style={{ marginTop: 16 }} onClick={openAdd}>
              <Icon name="plus" size={14} color="#04140e" /> İlk Denemeni Ekle
            </Button>
          </div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredExams.map((e) => <ExamCardMobile key={e.id} exam={e} onEdit={openEdit} onDelete={requestDelete} />)}
          </div>
        ) : (
          <ExamTable exams={filteredExams} onEdit={openEdit} onDelete={requestDelete} />
        )}
      </Card>

      {modalOpen && (
        <ExamModal
          existing={editingExam}
          onClose={() => { setModalOpen(false); setEditingId(null); }}
        />
      )}
      {pendingDeleteId && (
        <ConfirmModal
          title="Deneme silinsin mi?"
          message="Bu deneme kalıcı olarak silinecek. Geri alınamaz."
          confirmLabel="Sil"
          danger
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, suffix, accent }) {
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
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</span>
        {suffix && <span style={{ fontSize: 11, color: "#71717a" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ExamTable({ exams, onEdit, onDelete }) {
  const SUBJ = KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);

  const th = { textAlign: "left", padding: "10px 8px", fontSize: 10.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, borderBottom: "1px solid #1a1a1d", whiteSpace: "nowrap" };
  const td = { padding: "12px 8px", borderBottom: "1px solid #131316", fontSize: 13, color: "#e4e4e7", verticalAlign: "middle" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Tarih</th>
            <th style={th}>Deneme</th>
            <th style={{ ...th, textAlign: "center" }}>Türk.</th>
            <th style={{ ...th, textAlign: "center" }}>Mat.</th>
            <th style={{ ...th, textAlign: "center" }}>Tar.</th>
            <th style={{ ...th, textAlign: "center" }}>Coğ.</th>
            <th style={{ ...th, textAlign: "center" }}>Vat.</th>
            <th style={{ ...th, textAlign: "right" }}>Toplam Net</th>
            <th style={{ ...th, textAlign: "right" }}>Süre</th>
            <th style={{ ...th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {exams.map((e) => {
            let total = 0;
            const cells = subjectKeys.map((sk) => {
              if (e.type === "genel") {
                const s = e.subjects[sk];
                if (!s) return { net: null };
                const n = calcNet(s.correct, s.wrong);
                total += n;
                return { net: n, color: SUBJ[sk].color };
              }
              if (e.subject === sk) {
                const n = calcNet(e.correct, e.wrong);
                total = n;
                return { net: n, color: SUBJ[sk].color };
              }
              return { net: null };
            });
            const weakCount = e.type === "genel"
              ? Object.values(e.subjects).reduce((s, x) => s + (x.weakTopics?.length || 0), 0)
              : (e.weakTopics?.length || 0);
            return (
              <tr key={e.id} style={{ transition: "background 0.15s" }}
                onMouseEnter={(ev) => ev.currentTarget.style.background = "#0c0c0e"}
                onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
              >
                <td style={{ ...td, color: "#a1a1aa", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(e.date)}</td>
                <td style={td}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#fafafa", fontWeight: 500 }}>{e.name || (e.type === "genel" ? "Genel Deneme" : SUBJ[e.subject].name + " Branş")}</span>
                    <span style={{ fontSize: 11, color: "#52525b", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ padding: "1px 6px", borderRadius: 4, background: e.type === "genel" ? "#0e3b2c" : "#0e2a3b", color: e.type === "genel" ? "#10b981" : "#06b6d4", fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {e.type === "genel" ? "Genel" : "Branş"}
                      </span>
                      {weakCount > 0 && <span style={{ color: "#f59e0b" }}>· {weakCount} eksik konu</span>}
                    </span>
                  </div>
                </td>
                {cells.map((c, i) => (
                  <td key={i} style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                    {c.net === null ? <span style={{ color: "#3f3f46" }}>—</span> : <span style={{ color: c.color, fontWeight: 600 }}>{round2(c.net)}</span>}
                  </td>
                ))}
                <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>{round2(total)}</span>
                </td>
                <td style={{ ...td, textAlign: "right", color: "#a1a1aa", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                  {e.durationMin ? e.durationMin + " dk" : <span style={{ color: "#3f3f46" }}>—</span>}
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button onClick={() => onEdit(e.id)} style={iconBtn} title="Düzenle">
                      <Icon name="pen" size={13} />
                    </button>
                    <button onClick={() => onDelete(e.id)} style={iconBtn} title="Sil">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const iconBtn = {
  background: "transparent", border: "1px solid #1f1f23", borderRadius: 6,
  width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "#71717a", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
};

function ExamCardMobile({ exam, onEdit, onDelete }) {
  const SUBJ = KPSS_SUBJECTS;
  let total = 0;
  if (exam.type === "genel") for (const sk of Object.keys(exam.subjects)) total += calcNet(exam.subjects[sk].correct, exam.subjects[sk].wrong);
  else total = calcNet(exam.correct, exam.wrong);
  const weakCount = exam.type === "genel"
    ? Object.values(exam.subjects).reduce((s, x) => s + (x.weakTopics?.length || 0), 0)
    : (exam.weakTopics?.length || 0);

  return (
    <div style={{ padding: 14, background: "#0c0c0e", border: "1px solid #18181c", borderRadius: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: "#fafafa", fontWeight: 600 }}>{exam.name || (exam.type === "genel" ? "Genel Deneme" : SUBJ[exam.subject].name + " Branş")}</div>
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ padding: "1px 6px", borderRadius: 4, background: exam.type === "genel" ? "#0e3b2c" : "#0e2a3b", color: exam.type === "genel" ? "#10b981" : "#06b6d4", fontSize: 9.5, fontWeight: 600, textTransform: "uppercase" }}>
              {exam.type === "genel" ? "Genel" : "Branş"}
            </span>
            <span>{fmtDate(exam.date)}</span>
            {exam.durationMin && <span>· {exam.durationMin} dk</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Net</div>
          <div style={{ fontSize: 18, color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{round2(total)}</div>
        </div>
      </div>

      {exam.type === "genel" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 8 }}>
          {Object.keys(SUBJ).map((sk) => {
            const s = exam.subjects[sk];
            const subj = SUBJ[sk];
            const n = s ? calcNet(s.correct, s.wrong) : 0;
            return (
              <div key={sk} style={{ padding: "5px 4px", background: "#0a0a0c", border: "1px solid #18181c", borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{subj.name.slice(0, 4)}</div>
                <div style={{ fontSize: 12, color: subj.color, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{round2(n)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #18181c" }}>
        <span style={{ fontSize: 11, color: weakCount > 0 ? "#f59e0b" : "#52525b" }}>
          {weakCount > 0 ? `${weakCount} eksik konu` : "Eksik konu yok"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(exam.id)} style={iconBtn} title="Düzenle"><Icon name="pen" size={12} /></button>
          <button onClick={() => onDelete(exam.id)} style={iconBtn} title="Sil"><Icon name="trash" size={12} /></button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Modal Form
// =====================================================================
function ExamModal({ existing, onClose }) {
  const SUBJ = KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);
  const { isMobile } = useViewport();

  const [tab, setTab] = useState(existing?.type || "genel");
  const [name, setName] = useState(existing?.name || "");
  const [date, setDate] = useState(existing ? trDateKey(existing.date) : trToday());
  const [duration, setDuration] = useState(existing?.durationMin ? String(existing.durationMin) : "");

  // Genel
  const initialGenel = () => {
    const o = {};
    for (const sk of subjectKeys) {
      const s = existing?.subjects?.[sk];
      o[sk] = { correct: s ? String(s.correct) : "", wrong: s ? String(s.wrong) : "", weakTopics: s?.weakTopics || [] };
    }
    return o;
  };
  const [genel, setGenel] = useState(initialGenel);

  // Branş — toplam soru ders sabiti (fixedCount), kullanıcı girmez
  const [bSubject, setBSubject] = useState(existing?.subject || "");
  const [bCorrect, setBCorrect] = useState(existing?.correct ? String(existing.correct) : "");
  const [bWrong, setBWrong] = useState(existing?.wrong ? String(existing.wrong) : "");
  const [bWeak, setBWeak] = useState(existing?.weakTopics || []);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Genel validation
  useEffect(() => {
    const errs = {};
    for (const sk of subjectKeys) {
      const s = SUBJ[sk];
      const c = parseInt(genel[sk].correct) || 0;
      const w = parseInt(genel[sk].wrong) || 0;
      if (c + w > s.fixedCount) errs[sk] = `${s.name} toplamı ${s.fixedCount} soruyu geçemez!`;
      if (c < 0 || w < 0) errs[sk] = "Negatif değer girilemez.";
    }
    setErrors(errs);
  }, [genel]);

  const totals = useMemo(() => {
    let net = 0, c = 0, w = 0, b = 0;
    const per = {};
    for (const sk of subjectKeys) {
      const s = SUBJ[sk];
      const cc = parseInt(genel[sk].correct) || 0;
      const ww = parseInt(genel[sk].wrong) || 0;
      const bb = Math.max(0, s.fixedCount - cc - ww);
      const nn = calcNet(cc, ww);
      per[sk] = { c: cc, w: ww, b: bb, n: nn };
      net += nn; c += cc; w += ww; b += bb;
    }
    return { net, totalCorrect: c, totalWrong: w, totalBlank: b, per };
  }, [genel]);

  const updateGenel = (sk, field, val) => setGenel({ ...genel, [sk]: { ...genel[sk], [field]: val } });
  const toggleGenelWeak = (sk, t) => {
    const cur = genel[sk].weakTopics;
    const has = cur.some((w) => w.topic === t);
    setGenel({
      ...genel,
      [sk]: {
        ...genel[sk],
        weakTopics: has ? cur.filter((w) => w.topic !== t) : [...cur, { topic: t, wrong: 1, blank: 0 }],
      },
    });
  };
  const setGenelWeakField = (sk, t, field, val) => {
    const v = Math.max(0, parseInt(val) || 0);
    setGenel({
      ...genel,
      [sk]: {
        ...genel[sk],
        weakTopics: genel[sk].weakTopics.map((w) => (w.topic === t ? { ...w, [field]: v } : w)),
      },
    });
  };
  const toggleBWeak = (t) => {
    const has = bWeak.some((w) => w.topic === t);
    setBWeak(has ? bWeak.filter((w) => w.topic !== t) : [...bWeak, { topic: t, wrong: 1, blank: 0 }]);
  };
  const setBWeakField = (t, field, val) => {
    const v = Math.max(0, parseInt(val) || 0);
    setBWeak(bWeak.map((w) => (w.topic === t ? { ...w, [field]: v } : w)));
  };

  const numStyle = { width: 52, background: "#0a0a0c", border: "1px solid #27272a", borderRadius: 6, color: "#e4e4e7", padding: "4px 6px", fontSize: 12, fontFamily: "inherit", outline: "none", textAlign: "center", fontVariantNumeric: "tabular-nums" };
  const errNumStyle = { ...numStyle, border: "1px solid #7f1d1d" };
  const renderWeakInputs = (items, onWrong, onBlank, maxWrong, maxBlank) => {
    if (!items || items.length === 0) return null;
    const sumWrong = items.reduce((s, w) => s + (Number(w.wrong) || 0), 0);
    const sumBlank = items.reduce((s, w) => s + (Number(w.blank) || 0), 0);
    const wrongOver = sumWrong > maxWrong;
    const blankOver = sumBlank > maxBlank;
    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #1f1f23" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#71717a", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Seçtiğin konularda kaç yanlış / boş?
          </span>
          <span style={{ display: "inline-flex", gap: 10, fontSize: 10.5, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: wrongOver ? "#ef4444" : "#71717a", fontWeight: wrongOver ? 600 : 500 }}>
              Yanlış: <span style={{ color: wrongOver ? "#fca5a5" : "#d4d4d8", fontWeight: 700 }}>{sumWrong}</span> / {maxWrong}
            </span>
            <span style={{ color: blankOver ? "#ef4444" : "#71717a", fontWeight: blankOver ? 600 : 500 }}>
              Boş: <span style={{ color: blankOver ? "#fca5a5" : "#d4d4d8", fontWeight: 700 }}>{sumBlank}</span> / {maxBlank}
            </span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((w) => (
            <div
              key={w.topic}
              style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "6px 10px", background: "#0c0c0e", border: "1px solid #18181c", borderRadius: 8 }}
            >
              <span style={{ flex: "1 1 140px", fontSize: 12.5, color: "#d4d4d8", minWidth: 0 }}>{w.topic}</span>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#71717a" }}>
                Y
                <input type="number" min={0} value={w.wrong} onChange={(e) => onWrong(w.topic, e.target.value)} onFocus={(e) => e.target.select()} style={wrongOver ? errNumStyle : numStyle} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#71717a" }}>
                B
                <input type="number" min={0} value={w.blank} onChange={(e) => onBlank(w.topic, e.target.value)} onFocus={(e) => e.target.select()} style={blankOver ? errNumStyle : numStyle} />
              </label>
            </div>
          ))}
        </div>
        {(wrongOver || blankOver) && (
          <div style={{ marginTop: 8, padding: "6px 10px", background: "#1a0c0e", border: "1px solid #3b1d1e", borderRadius: 6, color: "#fca5a5", fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="alert" size={12} color="#ef4444" />
            Konu bazlı toplam, dersteki yanlış/boş sayısını geçiyor. Lütfen düzelt.
          </div>
        )}
      </div>
    );
  };

  // Branş derived
  const bSubj = bSubject ? SUBJ[bSubject] : null;
  const bTotalN = bSubj ? bSubj.fixedCount : 0;
  const bCorrectN = parseInt(bCorrect) || 0;
  const bWrongN = parseInt(bWrong) || 0;
  const bBlank = Math.max(0, bTotalN - bCorrectN - bWrongN);
  const bOverflow = bCorrectN + bWrongN > bTotalN && bTotalN > 0;
  const bNet = calcNet(bCorrectN, bWrongN);

  useEffect(() => { setBWeak(existing && existing.subject === bSubject ? existing.weakTopics || [] : []); }, [bSubject]);

  const onSave = () => {
    setGlobalError("");
    // Düzenleme: aynı gün kalıyorsa orijinal timestamp korunur (sıralama bozulmasın); aksi halde Türkiye öğlenine sabitle.
    const newIso = trToday() === date ? new Date().toISOString() : trMakeIso(date);
    const baseDate = existing && trDateKey(existing.date) === date ? existing.date : newIso;
    const dur = duration ? parseInt(duration) : null;

    if (tab === "genel") {
      if (Object.keys(errors).length > 0) {
        setGlobalError("Lütfen kırmızı uyarıları düzelt.");
        return;
      }
      let any = false;
      for (const sk of subjectKeys) if ((parseInt(genel[sk].correct) || 0) > 0 || (parseInt(genel[sk].wrong) || 0) > 0) { any = true; break; }
      if (!any) { setGlobalError("En az bir derse skor girmelisin."); return; }

      // Konu bazlı toplam, dersin yanlış/boş'unu geçemez — yanlışlıkla 1 yerine 10 yazımı engellesin
      for (const sk of subjectKeys) {
        const t = totals.per[sk];
        const ws = (genel[sk].weakTopics || []).reduce((s, w) => s + (Number(w.wrong) || 0), 0);
        const bs = (genel[sk].weakTopics || []).reduce((s, w) => s + (Number(w.blank) || 0), 0);
        if (ws > t.w) { setGlobalError(`${SUBJ[sk].name}: konu bazlı yanlış toplamı (${ws}), dersteki yanlış sayısını (${t.w}) geçiyor.`); return; }
        if (bs > t.b) { setGlobalError(`${SUBJ[sk].name}: konu bazlı boş toplamı (${bs}), dersteki boş sayısını (${t.b}) geçiyor.`); return; }
      }

      const subjects = {};
      for (const sk of subjectKeys) {
        subjects[sk] = {
          correct: parseInt(genel[sk].correct) || 0,
          wrong: parseInt(genel[sk].wrong) || 0,
          weakTopics: genel[sk].weakTopics,
        };
      }
      const payload = {
        type: "genel",
        date: baseDate,
        name: name.trim() || "Genel Deneme",
        durationMin: dur,
        subjects,
      };
      if (existing) kpssStore.updateExam(existing.id, payload);
      else kpssStore.addExam(payload);
    } else {
      if (!bSubject) { setGlobalError("Ders seçiniz."); return; }
      if (bTotalN <= 0) { setGlobalError("Toplam soru sayısı girilmelidir."); return; }
      if (bOverflow) { setGlobalError(`Doğru + Yanlış (${bCorrectN + bWrongN}), Toplam (${bTotalN}) sayısını geçemez!`); return; }
      const bws = (bWeak || []).reduce((s, w) => s + (Number(w.wrong) || 0), 0);
      const bbs = (bWeak || []).reduce((s, w) => s + (Number(w.blank) || 0), 0);
      if (bws > bWrongN) { setGlobalError(`Konu bazlı yanlış toplamı (${bws}), dersteki yanlış sayısını (${bWrongN}) geçiyor.`); return; }
      if (bbs > bBlank) { setGlobalError(`Konu bazlı boş toplamı (${bbs}), dersteki boş sayısını (${bBlank}) geçiyor.`); return; }
      const payload = {
        type: "brans",
        date: baseDate,
        name: name.trim() || (SUBJ[bSubject].name + " Branş Denemesi"),
        durationMin: dur,
        subject: bSubject,
        total: bTotalN,
        correct: bCorrectN,
        wrong: bWrongN,
        blank: bBlank,
        weakTopics: bWeak,
      };
      if (existing) kpssStore.updateExam(existing.id, payload);
      else kpssStore.addExam(payload);
    }
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
          width: "100%", maxWidth: 880,
          maxHeight: isMobile ? "92vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: "#0c0c0e", borderBottom: "1px solid #1f1f23", padding: isMobile ? "16px 18px" : "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fafafa" }}>
              {existing ? "Denemeyi Düzenle" : "Yeni Deneme Ekle"}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#71717a" }}>Tüm alanlar doğrulanır, net otomatik hesaplanır.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 8, width: 32, height: 32, color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: isMobile ? 18 : 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "genel", label: "Genel · 120 Soru" },
                { value: "brans", label: "Branş Denemesi" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr 0.8fr", gap: 12, marginBottom: 18 }}>
            <div>
              <Label>Deneme Adı <span style={{ color: "#52525b" }}>(opsiyonel)</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: 3D Yayınları TG-1" />
            </div>
            <div>
              <Label>Tarih</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Süre <span style={{ color: "#52525b" }}>(dk)</span></Label>
              <Input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Örn: 130" />
            </div>
          </div>

          {tab === "genel" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {subjectKeys.map((sk) => {
                  const s = SUBJ[sk];
                  const t = totals.per[sk];
                  const err = errors[sk];
                  const showWeak = (t.w > 0 || t.b > 0) && (parseInt(genel[sk].correct) > 0 || parseInt(genel[sk].wrong) > 0);
                  return (
                    <div key={sk} style={{ padding: "14px 16px", background: "#0a0a0c", border: "1px solid " + (err ? "#3b1d1e" : "#18181c"), borderRadius: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "150px 1fr 1fr 1fr 80px", gap: 10, alignItems: isMobile ? "stretch" : "center" }}>
                        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                          <div>
                            <div style={{ fontSize: 13.5, color: "#fafafa", fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: "#52525b", fontVariantNumeric: "tabular-nums" }}>{s.fixedCount} soru sabit</div>
                          </div>
                          {isMobile && (
                            <div style={{ marginLeft: "auto", textAlign: "right" }}>
                              <div style={{ fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net</div>
                              <div style={{ fontSize: 16, color: s.color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{round2(t.n)}</div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={cellLbl}>Doğru</div>
                          <Input type="number" min="0" max={s.fixedCount} value={genel[sk].correct} onChange={(e) => updateGenel(sk, "correct", e.target.value)} error={err} placeholder="0" />
                        </div>
                        <div>
                          <div style={cellLbl}>Yanlış</div>
                          <Input type="number" min="0" max={s.fixedCount} value={genel[sk].wrong} onChange={(e) => updateGenel(sk, "wrong", e.target.value)} error={err} placeholder="0" />
                        </div>
                        <div>
                          <div style={cellLbl}>Boş</div>
                          <div style={blankBox}>{t.b}</div>
                        </div>
                        {!isMobile && (
                          <div style={{ textAlign: "right" }}>
                            <div style={cellLbl}>Net</div>
                            <div style={{ fontSize: 18, color: s.color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{round2(t.n)}</div>
                          </div>
                        )}
                      </div>
                      {err && (
                        <div style={errBox}><Icon name="alert" size={12} color="#ef4444" /> {err}</div>
                      )}
                      {showWeak && !err && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #27272a" }}>
                          <div style={{ fontSize: 11, color: "#a1a1aa", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon name="target" size={11} color={s.color} />
                            {s.name} — eksik kaldığın konular
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {s.topics.map((tt) => (
                              <Chip key={tt} active={genel[sk].weakTopics.some((w) => w.topic === tt)} color={s.color} onClick={() => toggleGenelWeak(sk, tt)}>
                                {tt}
                              </Chip>
                            ))}
                          </div>
                          {renderWeakInputs(
                            genel[sk].weakTopics,
                            (t, v) => setGenelWeakField(sk, t, "wrong", v),
                            (t, v) => setGenelWeakField(sk, t, "blank", v),
                            t.w,
                            t.b
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "14px 16px", background: "#06120e", border: "1px solid #0e3b2c", borderRadius: 10, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#71d4af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Anlık Toplam</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    {round2(totals.net)} <span style={{ fontSize: 13, color: "#71717a", fontWeight: 500 }}>/ 120 net</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <div><div style={{ color: "#52525b" }}>Doğru</div><div style={{ color: "#10b981", fontWeight: 600 }}>{totals.totalCorrect}</div></div>
                  <div><div style={{ color: "#52525b" }}>Yanlış</div><div style={{ color: "#ef4444", fontWeight: 600 }}>{totals.totalWrong}</div></div>
                  <div><div style={{ color: "#52525b" }}>Boş</div><div style={{ color: "#a1a1aa", fontWeight: 600 }}>{totals.totalBlank}</div></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <Label>Ders</Label>
                  <Select value={bSubject} onChange={(e) => setBSubject(e.target.value)} options={subjectKeys.map((k) => ({ value: k, label: SUBJ[k].name }))} placeholder="Ders seçiniz..." />
                </div>
                <div>
                  <Label hint="(KPSS sabit)">Toplam Soru</Label>
                  <div
                    style={{
                      width: "100%",
                      background: "#0c0c0e",
                      border: "1px solid #1f1f23",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14,
                      color: bSubj ? "#e4e4e7" : "#52525b",
                      fontVariantNumeric: "tabular-nums",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{bSubj ? bSubj.fixedCount : "—"}</span>
                    {bSubj && <span style={{ fontSize: 11, color: bSubj.color }}>{bSubj.name}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={cellLbl}>Doğru</div>
                  <Input type="number" min="0" value={bCorrect} onChange={(e) => setBCorrect(e.target.value)} placeholder="0" error={bOverflow} />
                </div>
                <div>
                  <div style={cellLbl}>Yanlış</div>
                  <Input type="number" min="0" value={bWrong} onChange={(e) => setBWrong(e.target.value)} placeholder="0" error={bOverflow} />
                </div>
                <div>
                  <div style={cellLbl}>Boş</div>
                  <div style={blankBox}>{bTotalN > 0 ? bBlank : "—"}</div>
                </div>
              </div>
              <div style={{ padding: "10px 14px", background: "#06120e", border: "1px solid #0e3b2c", borderRadius: 8, fontSize: 12, color: "#71d4af", display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span>Net</span>
                <span style={{ color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{round2(bNet)}</span>
              </div>
              {bSubj && (parseInt(bWrong) > 0 || (bTotalN > 0 && (parseInt(bCorrect) || 0) + (parseInt(bWrong) || 0) < bTotalN)) && (
                <div style={{ padding: 14, borderRadius: 10, background: "#0a0a0c", border: "1px dashed #27272a" }}>
                  <div style={{ fontSize: 12, color: "#d4d4d8", fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="target" size={12} color={bSubj.color} />
                    {bSubj.name} — eksik kaldığın konular
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {bSubj.topics.map((t) => (
                      <Chip key={t} active={bWeak.some((w) => w.topic === t)} color={bSubj.color} onClick={() => toggleBWeak(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                  {renderWeakInputs(
                    bWeak,
                    (t, v) => setBWeakField(t, "wrong", v),
                    (t, v) => setBWeakField(t, "blank", v),
                    bWrongN,
                    bBlank
                  )}
                </div>
              )}
            </>
          )}

          {globalError && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#1a0c0e", border: "1px solid #3b1d1e", borderRadius: 8, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert" size={14} color="#ef4444" /> {globalError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: "sticky", bottom: 0, background: "#0c0c0e", borderTop: "1px solid #1f1f23", padding: isMobile ? "14px 18px" : "16px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button onClick={onSave}>
            <Icon name="check" size={14} color="#04140e" /> {existing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const cellLbl = { fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 600 };
const blankBox = { background: "#0a0a0c", border: "1px dashed #27272a", borderRadius: 8, color: "#71717a", padding: "10px 12px", fontSize: 14, fontVariantNumeric: "tabular-nums" };
const errBox = { marginTop: 10, padding: "8px 10px", background: "#1a0c0e", border: "1px solid #3b1d1e", borderRadius: 6, color: "#fca5a5", fontSize: 12, display: "flex", alignItems: "center", gap: 6 };

export default ExamsPage;
