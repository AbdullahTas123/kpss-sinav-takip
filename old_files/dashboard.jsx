// Dashboard page — stat cards, hedefli net trend, hedef net kartı, en çok hata/iyileşme, çalışma ilerlemesi
const { useMemo: useMemoDash } = React;

function StatCard({ label, value, suffix, icon, accent = "#10b981" }) {
  const { Icon } = window.KPSS_UI;
  const { isMobile } = window.useViewport();
  return (
    <div
      style={{
        background: "#111114",
        border: "1px solid #1f1f23",
        borderRadius: 12,
        padding: isMobile ? "14px 16px" : "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 10 : 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}18, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <span style={{ fontSize: 12, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: accent + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={16} color={accent} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, position: "relative" }}>
        <span style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "#fafafa", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
        {suffix && <span style={{ fontSize: isMobile ? 12 : 13, color: "#71717a" }}>{suffix}</span>}
      </div>
    </div>
  );
}

// Net trend grafiği — hedef net çizgisini de gösterir
function LineChart({ data, targetNet }) {
  const W = 720;
  const H = 260;
  const padL = 44;
  const padR = 18;
  const padT = 20;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (data.length === 0) {
    return (
      <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#52525b", fontSize: 13 }}>
        Henüz deneme verisi yok
      </div>
    );
  }

  const maxNet = 120;
  const minNet = 0;
  const range = maxNet - minNet;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padL + (data.length === 1 ? innerW / 2 : i * stepX),
    y: padT + innerH - ((d.net - minNet) / range) * innerH,
    ...d,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaD = `${pathD} L${points[points.length - 1].x},${padT + innerH} L${points[0].x},${padT + innerH} Z`;

  const yTicks = [0, 30, 60, 90, 120];

  // Hedef çizgisi konumu
  const targetVisible = Number.isFinite(targetNet) && targetNet > 0 && targetNet <= maxNet;
  const targetY = targetVisible ? padT + innerH - ((targetNet - minNet) / range) * innerH : 0;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="netLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {yTicks.map((t) => {
        const y = padT + innerH - ((t - minNet) / range) * innerH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1a1a1d" strokeDasharray="3 3" />
            <text x={padL - 10} y={y + 4} fontSize="10" fill="#52525b" textAnchor="end">
              {t}
            </text>
          </g>
        );
      })}

      <path d={areaD} fill="url(#netGradient)" />
      <path d={pathD} stroke="url(#netLine)" strokeWidth="2.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0a0a0c" stroke="#10b981" strokeWidth="2" />
          {(i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(points.length / 5)) === 0) && (
            <text x={p.x} y={H - 12} fontSize="10" fill="#71717a" textAnchor="middle">
              {window.KPSS_UI.fmtDateShort(p.date)}
            </text>
          )}
          <title>{`${window.KPSS_UI.fmtDate(p.date)}: ${window.KPSS_UI.round2(p.net)} net`}</title>
        </g>
      ))}

      {targetVisible && (
        <g>
          <line
            x1={padL}
            y1={targetY}
            x2={W - padR}
            y2={targetY}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <rect
            x={W - padR - 70}
            y={targetY - 14}
            width={68}
            height={16}
            rx={4}
            fill="#1a0e02"
            stroke="#3b2a0e"
          />
          <text
            x={W - padR - 6}
            y={targetY - 2}
            fontSize="10"
            fill="#f59e0b"
            textAnchor="end"
            fontWeight="600"
          >
            Hedef {targetNet}
          </text>
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------
// Konu agregasyonu — hem en çok hata hem en çok iyileşme aynı kaynaktan beslenir
// ---------------------------------------------------------------------
function buildTopicGroups(state, weakSource, weakFilter) {
  const accept = (sk) => weakFilter === "all" || weakFilter === sk;
  const fromExams = weakSource === "denemeler" || weakSource === "tum";
  const fromQ = weakSource === "cozum" || weakSource === "tum";

  const list = [];
  if (fromQ) {
    for (const q of state.questions) {
      if (!accept(q.subject)) continue;
      if (q.type === "konu" && q.topic) {
        list.push({ date: q.date, subject: q.subject, topic: q.topic, wrong: Number(q.wrong) || 0, blank: Number(q.blank) || 0 });
      }
      for (const w of q.weakTopics || []) {
        if (!w || !w.topic) continue;
        list.push({ date: q.date, subject: q.subject, topic: w.topic, wrong: Number(w.wrong) || 0, blank: Number(w.blank) || 0 });
      }
    }
  }
  if (fromExams) {
    for (const e of state.exams) {
      if (e.type === "genel") {
        for (const sk of Object.keys(e.subjects || {})) {
          if (!accept(sk)) continue;
          for (const w of e.subjects[sk].weakTopics || []) {
            if (!w || !w.topic) continue;
            list.push({ date: e.date, subject: sk, topic: w.topic, wrong: Number(w.wrong) || 0, blank: Number(w.blank) || 0 });
          }
        }
      } else {
        if (!accept(e.subject)) continue;
        for (const w of e.weakTopics || []) {
          if (!w || !w.topic) continue;
          list.push({ date: e.date, subject: e.subject, topic: w.topic, wrong: Number(w.wrong) || 0, blank: Number(w.blank) || 0 });
        }
      }
    }
  }

  const map = new Map();
  for (const ev of list) {
    const k = `${ev.subject}::${ev.topic}`;
    if (!map.has(k)) map.set(k, { subject: ev.subject, topic: ev.topic, events: [] });
    map.get(k).events.push(ev);
  }

  return Array.from(map.values()).map((g) => {
    g.events.sort((a, b) => new Date(a.date) - new Date(b.date));
    g.totalWrong = g.events.reduce((s, e) => s + e.wrong, 0);
    g.totalBlank = g.events.reduce((s, e) => s + e.blank, 0);
    g.score = g.totalWrong + g.totalBlank * 0.5;
    if (g.events.length >= 2) {
      const mid = Math.ceil(g.events.length / 2);
      const fh = g.events.slice(0, mid);
      const sh = g.events.slice(mid);
      const fhAvg = fh.length ? fh.reduce((s, e) => s + e.wrong + e.blank * 0.5, 0) / fh.length : 0;
      const shAvg = sh.length ? sh.reduce((s, e) => s + e.wrong + e.blank * 0.5, 0) / sh.length : 0;
      g.trend = shAvg - fhAvg; // + : kötüleşiyor, - : iyileşiyor
      g.trendPct = fhAvg > 0 ? ((shAvg - fhAvg) / fhAvg) * 100 : (shAvg > 0 ? 100 : 0);
    } else {
      g.trend = 0;
      g.trendPct = 0;
    }
    return g;
  });
}

// Üç kart aynı tasarımı paylaşır — sadece "kind" ile veri yorumu değişir.
// kind = "wrong" | "worsened" | "improved"
function TopicListCard({ kind, items, isMobile, emptyMsg, title, subtitle, icon, accent }) {
  const { Card, Icon } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;

  const valueOf = (g) => kind === "wrong" ? g.score : Math.abs(g.trend);
  const max = items.length > 0 ? valueOf(items[0]) : 1;

  return (
    <Card style={{ padding: isMobile ? 16 : 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon name={icon} size={16} color={accent} />
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
          {title}
        </h2>
      </div>
      <p style={{ fontSize: 11.5, color: "#71717a", margin: "0 0 14px 24px" }}>
        {subtitle}
      </p>

      {items.length === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center", color: "#52525b", fontSize: 13 }}>
          <Icon name="check" size={28} color="#3f3f46" />
          <div style={{ marginTop: 8 }}>{emptyMsg}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((g, i) => {
            const subj = SUBJ[g.subject];
            if (!subj) return null;
            const pct = max > 0 ? (valueOf(g) / max) * 100 : 0;
            let rightLbl, rightColor, rightWeight;
            if (kind === "wrong") {
              rightLbl = `${g.score.toFixed(1)} puan`;
              rightColor = "#71717a";
              rightWeight = 400;
            } else if (kind === "improved") {
              rightLbl = `▼ %${Math.round(Math.abs(g.trendPct))}`;
              rightColor = "#10b981";
              rightWeight = 600;
            } else {
              rightLbl = `▲ %${Math.round(Math.abs(g.trendPct))}`;
              rightColor = "#ef4444";
              rightWeight = 600;
            }
            return (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: subj.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11, color: subj.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {subj.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: rightColor, fontWeight: rightWeight, fontVariantNumeric: "tabular-nums" }}>
                    {rightLbl}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "#e4e4e7", marginBottom: 6, lineHeight: 1.4 }}>
                  {g.topic}
                </div>
                <div style={{ height: 4, background: "#18181c", borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: pct + "%",
                      background: `linear-gradient(90deg, ${subj.color}, ${subj.color}88)`,
                      borderRadius: 2,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------
// Hedef Net Kartı — toplam hedef + ders bazlı dağılım + Düzenle
// ---------------------------------------------------------------------
function TargetCard({ goals, onEdit, isMobile }) {
  const { Card, Icon } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);
  const targetNet = goals.targetNet || 0;
  const totalFixed = subjectKeys.reduce((s, k) => s + SUBJ[k].fixedCount, 0); // 120

  // perSubject boş kalan dersler için fixedCount oranıyla otomatik dağıt
  const perSubjDisplay = subjectKeys.map((sk) => {
    const fixed = SUBJ[sk].fixedCount;
    const explicit = goals.perSubject && goals.perSubject[sk];
    const value = (explicit !== undefined && explicit !== null && Number.isFinite(Number(explicit)))
      ? Number(explicit)
      : (totalFixed > 0 ? (targetNet * fixed) / totalFixed : 0);
    const isAuto = !(explicit !== undefined && explicit !== null && Number.isFinite(Number(explicit)));
    return { sk, name: SUBJ[sk].name, color: SUBJ[sk].color, fixed, value, isAuto };
  });

  return (
    <Card style={{ padding: isMobile ? 16 : 24, position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle, #f59e0b18, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12, position: "relative" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="target" size={16} color="#f59e0b" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
              Hedef Net
            </h2>
          </div>
          <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0 24px" }}>
            Sınava giderken hedeflediğin net dağılımı
          </p>
        </div>
        <button
          onClick={onEdit}
          style={{
            background: "transparent",
            border: "1px solid #27272a",
            borderRadius: 7,
            padding: "5px 10px",
            color: "#a1a1aa",
            fontSize: 11.5,
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="pen" size={11} /> Düzenle
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, position: "relative" }}>
        <span style={{ fontSize: isMobile ? 32 : 44, fontWeight: 700, color: "#f59e0b", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {targetNet}
        </span>
        <span style={{ fontSize: 13, color: "#71717a" }}>/ 120 net</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 11.5, color: "#71717a", position: "relative" }}>
        <Icon name="clock" size={11} color="#06b6d4" />
        <span>Hedef genel deneme süresi:</span>
        <span style={{ color: goals.targetDurationMin ? "#06b6d4" : "#52525b", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {goals.targetDurationMin ? `${goals.targetDurationMin} dk` : "—"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {perSubjDisplay.map((s) => (
          <div
            key={s.sk}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 10px",
              background: "#0a0a0c",
              border: "1px solid #18181c",
              borderRadius: 7,
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "#e4e4e7", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.name}
              </span>
              <span style={{ fontSize: 10, color: "#52525b", fontVariantNumeric: "tabular-nums" }}>/ {s.fixed}</span>
            </div>
            <span style={{ fontSize: 13, color: s.color, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
              {Math.round(s.value * 10) / 10}
              {s.isAuto && <span style={{ fontSize: 9, color: "#52525b", fontWeight: 400, marginLeft: 4 }}>otomatik</span>}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Hedef düzenleme modal'ı
// ---------------------------------------------------------------------
function TargetModal({ goals, onClose }) {
  const { Button, Input, Label, Icon } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);
  const totalFixed = subjectKeys.reduce((s, k) => s + SUBJ[k].fixedCount, 0);
  const { isMobile } = window.useViewport();

  const [target, setTarget] = React.useState(String(goals.targetNet ?? 90));
  const [duration, setDuration] = React.useState(
    goals.targetDurationMin !== undefined && goals.targetDurationMin !== null
      ? String(goals.targetDurationMin)
      : ""
  );
  const [perSubj, setPerSubj] = React.useState(() => {
    const o = {};
    for (const sk of subjectKeys) {
      const v = goals.perSubject ? goals.perSubject[sk] : undefined;
      o[sk] = (v !== undefined && v !== null && Number.isFinite(Number(v))) ? String(v) : "";
    }
    return o;
  });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const targetN = Math.max(0, Math.min(120, parseFloat(target) || 0));
  const perSubjN = subjectKeys.map((sk) => {
    const v = parseFloat(perSubj[sk]);
    return Number.isFinite(v) ? v : null;
  });
  const subjectSum = perSubjN.reduce((a, b) => a + (b || 0), 0);

  const distribute = () => {
    const next = {};
    for (const sk of subjectKeys) {
      const v = totalFixed > 0 ? Math.round((targetN * SUBJ[sk].fixedCount / totalFixed) * 10) / 10 : 0;
      next[sk] = String(v);
    }
    setPerSubj(next);
  };

  const clearPerSubj = () => {
    const next = {};
    for (const sk of subjectKeys) next[sk] = "";
    setPerSubj(next);
  };

  const save = () => {
    setError("");
    if (!Number.isFinite(targetN) || targetN < 0 || targetN > 120) {
      setError("Toplam hedef net 0 ile 120 arasında olmalı.");
      return;
    }
    for (let i = 0; i < subjectKeys.length; i++) {
      const sk = subjectKeys[i];
      const v = perSubjN[i];
      if (v === null) continue;
      if (v < 0 || v > SUBJ[sk].fixedCount) {
        setError(`${SUBJ[sk].name} hedefi 0 ile ${SUBJ[sk].fixedCount} arasında olmalı.`);
        return;
      }
    }
    let durationVal = null;
    const durTrim = (duration || "").trim();
    if (durTrim !== "") {
      const d = parseFloat(durTrim);
      if (!Number.isFinite(d) || d <= 0 || d > 600) {
        setError("Hedef süre 1 ile 600 dakika arasında olmalı (boş bırakılabilir).");
        return;
      }
      durationVal = d;
    }
    const out = {};
    for (let i = 0; i < subjectKeys.length; i++) {
      const sk = subjectKeys[i];
      const raw = perSubj[sk];
      if (raw === "" || raw === null || raw === undefined) continue;
      const v = parseFloat(raw);
      if (Number.isFinite(v) && v >= 0) out[sk] = v;
    }
    window.kpssStore.setGoals({ targetNet: targetN, perSubject: out, targetDurationMin: durationVal });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 220,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
        padding: isMobile ? 0 : 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0c0e",
          border: "1px solid #1f1f23",
          borderRadius: isMobile ? "16px 16px 0 0" : 14,
          width: "100%",
          maxWidth: 520,
          maxHeight: isMobile ? "92vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ position: "sticky", top: 0, background: "#0c0c0e", borderBottom: "1px solid #1f1f23", padding: isMobile ? "16px 18px" : "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fafafa" }}>Hedef Net</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#71717a" }}>Genel hedefi ve istersen ders bazında dağılımı belirle.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 8, width: 32, height: 32, color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: isMobile ? 18 : 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <Label hint="(0 - 120)">Toplam Hedef Net</Label>
              <Input
                type="number"
                min="0"
                max="120"
                step="0.5"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Örn: 90"
              />
            </div>
            <div>
              <Label hint="(dk · genel deneme)">Hedef Süre</Label>
              <Input
                type="number"
                min="1"
                max="600"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Örn: 130"
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Label style={{ marginBottom: 0 }}>Ders Bazında Hedefler <span style={{ color: "#52525b" }}>(opsiyonel)</span></Label>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={distribute}
                style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 6, padding: "4px 9px", color: "#a1a1aa", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
                type="button"
              >
                Otomatik dağıt
              </button>
              <button
                onClick={clearPerSubj}
                style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 6, padding: "4px 9px", color: "#a1a1aa", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
                type="button"
              >
                Temizle
              </button>
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: "#52525b", margin: "0 0 12px 0", lineHeight: 1.4 }}>
            Boş bıraktıklarında soru sayısı oranıyla otomatik dağıtılır.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subjectKeys.map((sk) => {
              const s = SUBJ[sk];
              return (
                <div
                  key={sk}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#0a0a0c",
                    border: "1px solid #18181c",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#fafafa", fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: "#52525b", fontVariantNumeric: "tabular-nums" }}>Toplam {s.fixedCount} soru</div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={s.fixedCount}
                    step="0.5"
                    value={perSubj[sk]}
                    onChange={(e) => setPerSubj({ ...perSubj, [sk]: e.target.value })}
                    placeholder="—"
                    style={{
                      width: 80,
                      background: "#0c0c0e",
                      border: "1px solid #27272a",
                      borderRadius: 6,
                      color: "#e4e4e7",
                      padding: "6px 8px",
                      fontSize: 13,
                      fontFamily: "inherit",
                      outline: "none",
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "#06120e",
            border: "1px solid #0e3b2c",
            borderRadius: 8,
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            color: "#71d4af",
          }}>
            <span>Ders hedefleri toplamı (girilenler)</span>
            <span style={{ color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(subjectSum * 10) / 10}
            </span>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#1a0c0e", border: "1px solid #3b1d1e", borderRadius: 8, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert" size={14} color="#ef4444" /> {error}
            </div>
          )}
        </div>

        <div style={{ position: "sticky", bottom: 0, background: "#0c0c0e", borderTop: "1px solid #1f1f23", padding: isMobile ? "14px 18px" : "16px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button onClick={save}>
            <Icon name="check" size={14} color="#04140e" /> Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Dashboard — ana sayfa
// ---------------------------------------------------------------------
function Dashboard() {
  const { Card, Icon, Chip, Tabs, calcNet, round2 } = window.KPSS_UI;
  const [state, setState] = React.useState(window.kpssStore.get());
  React.useEffect(() => window.kpssStore.subscribe(setState), []);
  const { isMobile, isTablet } = window.useViewport();
  const [weakFilter, setWeakFilter] = window.usePersistentState("dashboard.weakFilter", "all");
  const [weakSource, setWeakSource] = window.usePersistentState("dashboard.weakSource", "tum");
  const [targetModalOpen, setTargetModalOpen] = React.useState(false);

  const goals = state.goals || { targetNet: 90, perSubject: {} };

  const stats = useMemoDash(() => {
    const totalQuestions =
      state.questions.reduce((s, q) => s + q.total, 0) +
      state.exams.reduce((s, e) => {
        if (e.type === "genel") {
          let t = 0;
          for (const sk of Object.keys(e.subjects)) {
            t += window.KPSS_SUBJECTS[sk].fixedCount;
          }
          return s + t;
        }
        return s + (e.total || 0);
      }, 0);

    const totalExams = state.exams.length;

    const generalExams = state.exams.filter((e) => e.type === "genel");
    let avgNet = 0;
    if (generalExams.length > 0) {
      const totalNet = generalExams.reduce((s, e) => {
        let n = 0;
        for (const sk of Object.keys(e.subjects)) {
          n += calcNet(e.subjects[sk].correct, e.subjects[sk].wrong);
        }
        return s + n;
      }, 0);
      avgNet = totalNet / generalExams.length;
    }

    return { totalQuestions, totalExams, avgNet };
  }, [state]);

  const chartData = useMemoDash(() => {
    return state.exams
      .filter((e) => e.type === "genel")
      .slice(-10)
      .map((e) => {
        let net = 0;
        for (const sk of Object.keys(e.subjects)) {
          net += calcNet(e.subjects[sk].correct, e.subjects[sk].wrong);
        }
        return { date: e.date, net: round2(net) };
      });
  }, [state]);

  const groups = useMemoDash(
    () => buildTopicGroups(state, weakSource, weakFilter),
    [state, weakSource, weakFilter]
  );

  const wrongTopics = useMemoDash(
    () => groups.filter((g) => g.score > 0).sort((a, b) => b.score - a.score).slice(0, 5),
    [groups]
  );

  const improvedTopics = useMemoDash(
    () => groups.filter((g) => g.events.length >= 2 && g.trend < 0).sort((a, b) => a.trend - b.trend).slice(0, 5),
    [groups]
  );

  const worsenedTopics = useMemoDash(
    () => groups.filter((g) => g.events.length >= 2 && g.trend > 0).sort((a, b) => b.trend - a.trend).slice(0, 5),
    [groups]
  );

  const lastExamDelta = useMemoDash(() => {
    if (chartData.length < 2) return 0;
    return chartData[chartData.length - 1].net - chartData[chartData.length - 2].net;
  }, [chartData]);

  const srcLbl = weakSource === "denemeler" ? "Denemelerde" : weakSource === "cozum" ? "Soru çözümünde" : "Bu kapsamda";
  const dersLbl = weakFilter === "all" ? "" : ` ${window.KPSS_SUBJECTS[weakFilter].name} için`;

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px 16px" : "28px 32px 64px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: isMobile ? 18 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
          Ana Sayfa
        </h1>
        <p style={{ fontSize: isMobile ? 12.5 : 13.5, color: "#71717a", margin: "4px 0 0 0" }}>
          Genel performansına bir bakışta gör. Aşağıdan eksiklerini takip edebilirsin.
        </p>
      </div>

      {/* Row 1 — 3 Stat */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 10 : 16,
          marginBottom: isMobile ? 14 : 20,
        }}
      >
        <StatCard
          label="Toplam Çözülen Soru"
          value={stats.totalQuestions.toLocaleString("tr-TR")}
          icon="pen"
          accent="#10b981"
        />
        <StatCard
          label="Toplam Çözülen Deneme"
          value={stats.totalExams}
          suffix="deneme"
          icon="book"
          accent="#06b6d4"
        />
        <StatCard
          label="Genel Ortalama Net"
          value={round2(stats.avgNet)}
          suffix="/ 120"
          icon="target"
          accent="#a78bfa"
        />
      </div>

      {/* Row 2 — Net Trend (hedef çizgili) + Hedef Net Kartı */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 14 : 20 }}>
        <Card style={{ padding: isMobile ? 16 : 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: isMobile ? 14 : 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="trend" size={16} color="#10b981" />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
                  Son 10 Deneme · Toplam Net Trendi
                </h2>
              </div>
              <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0 24px" }}>
                Genel deneme bazında 120 üzerinden net değişimin · turuncu çizgi: hedef
              </p>
            </div>
            {chartData.length >= 2 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: lastExamDelta >= 0 ? "#06120e" : "#1a0c0e",
                  border: "1px solid " + (lastExamDelta >= 0 ? "#0e3b2c" : "#3b1d1e"),
                  fontSize: 11,
                  fontWeight: 600,
                  color: lastExamDelta >= 0 ? "#10b981" : "#ef4444",
                }}
              >
                {lastExamDelta >= 0 ? "▲" : "▼"} {round2(Math.abs(lastExamDelta))} net
              </div>
            )}
          </div>
          <LineChart data={chartData} targetNet={goals.targetNet} />
        </Card>

        <TargetCard goals={goals} onEdit={() => setTargetModalOpen(true)} isMobile={isMobile} />
      </div>

      {/* Filtre çubuğu — En Çok Hata + En Çok İyileşme kartlarına ortak */}
      <Card style={{ padding: isMobile ? 14 : 16, marginBottom: isMobile ? 12 : 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 4 }}>Kaynak</span>
            <Tabs
              value={weakSource}
              onChange={setWeakSource}
              tabs={[
                { value: "tum", label: "Tümü" },
                { value: "denemeler", label: "Denemelerden" },
                { value: "cozum", label: "Soru Çözümünden" },
              ]}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 4 }}>Ders</span>
            <Chip active={weakFilter === "all"} onClick={() => setWeakFilter("all")} color="#10b981">
              Genel
            </Chip>
            {Object.keys(window.KPSS_SUBJECTS).map((sk) => {
              const s = window.KPSS_SUBJECTS[sk];
              return (
                <Chip
                  key={sk}
                  active={weakFilter === sk}
                  onClick={() => setWeakFilter(sk)}
                  color={s.color}
                >
                  {s.name}
                </Chip>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Row 3 — En Çok Hata + En Çok Kötüleşen + En Çok İyileşen yan yana */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: isMobile ? 12 : 16,
          marginBottom: isMobile ? 14 : 20,
        }}
      >
        <TopicListCard
          kind="wrong"
          items={wrongTopics}
          isMobile={isMobile}
          title="En Çok Hata Yapılan 5 Konu"
          subtitle="Yanlış × 1 + Boş × 0.5 toplam puan"
          icon="alert"
          accent="#f59e0b"
          emptyMsg={`${srcLbl}${dersLbl} hata yapılan konu yok`}
        />
        <TopicListCard
          kind="worsened"
          items={worsenedTopics}
          isMobile={isMobile}
          title="En Çok Kötüleşen 5 Konu"
          subtitle="İlk yarı ile son yarı arasındaki artış yüzdesi"
          icon="alert"
          accent="#ef4444"
          emptyMsg={`${srcLbl}${dersLbl} kötüleşen konu henüz yok`}
        />
        <TopicListCard
          kind="improved"
          items={improvedTopics}
          isMobile={isMobile}
          title="En Çok İyileşen 5 Konu"
          subtitle="İlk yarı ile son yarı arasındaki düşüş yüzdesi"
          icon="trend"
          accent="#10b981"
          emptyMsg={`${srcLbl}${dersLbl} iyileşen konu henüz yok`}
        />
      </div>

      <ProgressCard state={state} isMobile={isMobile} isTablet={isTablet} />

      {targetModalOpen && (
        <TargetModal
          goals={goals}
          onClose={() => setTargetModalOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Çalışma İlerlemesi — her ders için müfredat konuları + playlist videoları
// ---------------------------------------------------------------------
function ProgressCard({ state, isMobile, isTablet }) {
  const { Card, Icon } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);

  const rows = subjectKeys.map((sk) => {
    const s = SUBJ[sk];
    const ss = state.topicStatus[sk] || {};
    const tDone = s.topics.filter((t) => ss[t] === "done").length;
    const tTotal = s.topics.length;
    const tPct = tTotal ? Math.round((tDone / tTotal) * 100) : 0;
    const allPlaylists = state.playlists.filter((p) => p.subject === sk);
    // Sadece seçili listeler ana sayfa ilerlemesine katılır (Konular sayfasından toggle).
    const selectedPlaylists = allPlaylists.filter((p) => p.selected !== false);
    const vTotal = selectedPlaylists.reduce((a, p) => a + p.videos.length, 0);
    const vDone = selectedPlaylists.reduce((a, p) => a + p.videos.filter((v) => v.watched).length, 0);
    const vPct = vTotal ? Math.round((vDone / vTotal) * 100) : 0;
    return {
      sk, s, tDone, tTotal, tPct, vTotal, vDone, vPct,
      playlistCount: allPlaylists.length,
      selectedCount: selectedPlaylists.length,
    };
  });

  const goTopics = () => { window.location.hash = "topics"; };

  return (
    <Card style={{ padding: isMobile ? 16 : 22, marginTop: isMobile ? 12 : 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="target" size={16} color="#10b981" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
              Çalışma İlerlemesi
            </h2>
          </div>
          <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0 24px" }}>
            Her ders için bitirdiğin konular ve playlist videoları
          </p>
        </div>
        <button
          onClick={goTopics}
          style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 7, padding: "6px 12px", color: "#a1a1aa", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
        >
          Konular sayfasına git →
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(({ sk, s, tDone, tTotal, tPct, vTotal, vDone, vPct, playlistCount, selectedCount }) => {
          const cols = isMobile ? "1fr" : isTablet ? "140px 1fr" : "150px 1fr 1fr";
          const playlistStyle = (isTablet && !isMobile) ? { gridColumn: "1 / -1" } : {};
          let mutedExtra;
          if (playlistCount === 0) mutedExtra = "yüklü liste yok";
          else if (selectedCount === 0) mutedExtra = `${playlistCount} liste · seçili değil`;
          else mutedExtra = `${selectedCount} / ${playlistCount} seçili liste`;
          return (
            <div
              key={sk}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                gap: isMobile ? 8 : 14,
                alignItems: "center",
                padding: "10px 14px",
                background: "#0a0a0c",
                border: "1px solid #18181c",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#fafafa", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
              </div>
              <ProgressLine label="Konular" done={tDone} total={tTotal} pct={tPct} color={s.color} />
              <ProgressLine
                label={selectedCount > 1 ? `Playlist (${selectedCount} liste)` : "Playlist"}
                done={vDone}
                total={vTotal}
                pct={vPct}
                color={s.color}
                muted={vTotal === 0}
                mutedExtra={mutedExtra}
                style={playlistStyle}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProgressLine({ label, done, total, pct, color, muted, mutedExtra, style = {} }) {
  return (
    <div style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, fontSize: 10.5 }}>
        <span style={{ color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
        <span style={{ color: muted ? "#52525b" : "#d4d4d8", fontVariantNumeric: "tabular-nums", fontSize: 11 }}>
          {muted ? mutedExtra : `${done} / ${total} · %${pct}`}
        </span>
      </div>
      <div style={{ height: 4, background: "#18181c", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: (muted ? 0 : pct) + "%",
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: 2,
            transition: "width 0.4s",
          }}
        />
      </div>
    </div>
  );
}

window.KPSS_DASHBOARD = Dashboard;
