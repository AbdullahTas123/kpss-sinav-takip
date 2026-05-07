// Eksik Konular sayfası — soru çözümü ve denemelerden konu bazlı yanlış/boş
// agregasyonu, mini sparkline ile zamansal değişim, ilk yarı/son yarı trendi.
function WeakTopicsPage() {
  const { Card, Icon, Chip, Tabs } = window.KPSS_UI;
  const [state, setState] = React.useState(window.kpssStore.get());
  React.useEffect(() => window.kpssStore.subscribe(setState), []);
  const { isMobile, isTablet } = window.useViewport();

  const [subjFilter, setSubjFilter] = window.usePersistentState("weak.subjFilter", "all");
  const [source, setSource] = window.usePersistentState("weak.source", "tum");
  const [range, setRange] = window.usePersistentState("weak.range", "all");
  const [sortBy, setSortBy] = window.usePersistentState("weak.sortBy", "score");

  const SUBJ = window.KPSS_SUBJECTS;

  const events = React.useMemo(() => {
    const list = [];
    const accept = (sk) => subjFilter === "all" || subjFilter === sk;
    const fromExams = source === "denemeler" || source === "tum";
    const fromQ = source === "cozum" || source === "tum";

    if (fromQ) {
      for (const q of state.questions) {
        if (!accept(q.subject)) continue;
        if (q.type === "konu" && q.topic) {
          list.push({
            date: q.date, subject: q.subject, topic: q.topic,
            wrong: Number(q.wrong) || 0, blank: Number(q.blank) || 0,
            origin: "cozum",
          });
        }
        for (const w of q.weakTopics || []) {
          if (!w || !w.topic) continue;
          list.push({
            date: q.date, subject: q.subject, topic: w.topic,
            wrong: Number(w.wrong) || 0, blank: Number(w.blank) || 0,
            origin: "cozum",
          });
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
              list.push({
                date: e.date, subject: sk, topic: w.topic,
                wrong: Number(w.wrong) || 0, blank: Number(w.blank) || 0,
                origin: "deneme",
              });
            }
          }
        } else {
          if (!accept(e.subject)) continue;
          for (const w of e.weakTopics || []) {
            if (!w || !w.topic) continue;
            list.push({
              date: e.date, subject: e.subject, topic: w.topic,
              wrong: Number(w.wrong) || 0, blank: Number(w.blank) || 0,
              origin: "deneme",
            });
          }
        }
      }
    }

    if (range !== "all") {
      const days = range === "30g" ? 30 : range === "90g" ? 90 : 9999;
      const cutoff = Date.now() - days * 86400000;
      return list.filter((x) => new Date(x.date).getTime() >= cutoff);
    }
    return list;
  }, [state, subjFilter, source, range]);

  const groups = React.useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const k = `${ev.subject}::${ev.topic}`;
      if (!map.has(k)) map.set(k, { subject: ev.subject, topic: ev.topic, events: [] });
      map.get(k).events.push(ev);
    }
    const arr = Array.from(map.values()).map((g) => {
      g.events.sort((a, b) => new Date(a.date) - new Date(b.date));
      g.totalWrong = g.events.reduce((s, e) => s + e.wrong, 0);
      g.totalBlank = g.events.reduce((s, e) => s + e.blank, 0);
      g.score = g.totalWrong + g.totalBlank * 0.5;
      g.count = g.events.length;
      g.lastDate = g.events[g.events.length - 1].date;

      // Trend: ilk yarı vs son yarı (per-event ortalama puan)
      if (g.events.length >= 2) {
        const mid = Math.ceil(g.events.length / 2);
        const fh = g.events.slice(0, mid);
        const sh = g.events.slice(mid);
        if (sh.length === 0) {
          g.trend = 0;
          g.trendPct = 0;
        } else {
          const fhAvg = fh.reduce((s, e) => s + e.wrong + e.blank * 0.5, 0) / fh.length;
          const shAvg = sh.reduce((s, e) => s + e.wrong + e.blank * 0.5, 0) / sh.length;
          g.trend = shAvg - fhAvg; // + : daha kötü, - : iyileşiyor
          g.trendPct = fhAvg > 0 ? ((shAvg - fhAvg) / fhAvg) * 100 : (shAvg > 0 ? 100 : 0);
        }
      } else {
        g.trend = 0;
        g.trendPct = 0;
      }
      return g;
    });

    if (sortBy === "trend") {
      // En çok kötüleşen üstte
      arr.sort((a, b) => (b.trend - a.trend) || (b.score - a.score));
    } else if (sortBy === "recent") {
      arr.sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    } else {
      arr.sort((a, b) => b.score - a.score);
    }
    return arr;
  }, [events, sortBy]);

  const topImproved = React.useMemo(() => {
    return [...groups].filter((g) => g.events.length >= 2 && g.trend < 0).sort((a, b) => a.trend - b.trend).slice(0, 3);
  }, [groups]);

  const topWorsened = React.useMemo(() => {
    return [...groups].filter((g) => g.events.length >= 2 && g.trend > 0).sort((a, b) => b.trend - a.trend).slice(0, 3);
  }, [groups]);

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px 16px" : "28px 32px 64px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: isMobile ? 18 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
          Eksik Konular
        </h1>
        <p style={{ fontSize: isMobile ? 12.5 : 13.5, color: "#71717a", margin: "4px 0 0 0" }}>
          Konu bazında yanlış/boş sayısının zamanla nasıl değiştiğini gör. Artış kötüleşme, azalış iyileşmedir.
        </p>
      </div>

      {/* Filtreler */}
      <Card style={{ padding: isMobile ? 14 : 18, marginBottom: isMobile ? 12 : 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Kaynak</span>
            <Tabs
              value={source}
              onChange={setSource}
              tabs={[
                { value: "tum", label: "Tümü" },
                { value: "denemeler", label: "Denemelerden" },
                { value: "cozum", label: "Soru Çözümünden" },
              ]}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Zaman</span>
            <Tabs
              value={range}
              onChange={setRange}
              tabs={[
                { value: "30g", label: "Son 30 Gün" },
                { value: "90g", label: "Son 90 Gün" },
                { value: "all", label: "Tümü" },
              ]}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Sırala</span>
            <Tabs
              value={sortBy}
              onChange={setSortBy}
              tabs={[
                { value: "score", label: "Puan (Yüksek)" },
                { value: "trend", label: "Kötüleşenler" },
                { value: "recent", label: "Son Tarih" },
              ]}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 4 }}>Ders</span>
            <Chip active={subjFilter === "all"} onClick={() => setSubjFilter("all")} color="#10b981">
              Genel
            </Chip>
            {Object.keys(SUBJ).map((sk) => (
              <Chip
                key={sk}
                active={subjFilter === sk}
                onClick={() => setSubjFilter(sk)}
                color={SUBJ[sk].color}
              >
                {SUBJ[sk].name}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      {/* Trend özet kartları */}
      {(topImproved.length > 0 || topWorsened.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr",
            gap: isMobile ? 10 : 14,
            marginBottom: isMobile ? 12 : 16,
          }}
        >
          <SummaryCard
            kind="worsened"
            items={topWorsened}
            title="Kötüleşenler"
            subtitle="Son denemelerde yanlış/boş artıyor"
            icon="alert"
            color="#ef4444"
          />
          <SummaryCard
            kind="improved"
            items={topImproved}
            title="İyileşenler"
            subtitle="Son denemelerde yanlış/boş azalıyor"
            icon="trend"
            color="#10b981"
          />
        </div>
      )}

      {/* Liste */}
      {groups.length === 0 ? (
        <Card style={{ padding: isMobile ? 28 : 48, textAlign: "center" }}>
          <Icon name="check" size={32} color="#3f3f46" />
          <div style={{ marginTop: 10, fontSize: 14, color: "#71717a" }}>
            {(() => {
              const srcLbl = source === "denemeler" ? "Denemelerde" : source === "cozum" ? "Soru çözümünde" : "Bu kapsamda";
              const dersLbl = subjFilter === "all" ? "" : ` ${SUBJ[subjFilter].name} için`;
              const rangeLbl = range === "30g" ? " son 30 günde" : range === "90g" ? " son 90 günde" : "";
              return `${srcLbl}${dersLbl}${rangeLbl} eksik konu yok`;
            })()}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#52525b" }}>
            Soru çözümü veya deneme eklerken zayıf konuları işaretle, burada görünecek.
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 14 }}>
          {groups.map((g) => (
            <WeakTopicCard key={`${g.subject}::${g.topic}`} group={g} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Summary card — top improved / worsened
// ---------------------------------------------------------------------
function SummaryCard({ kind, items, title, subtitle, icon, color }) {
  const { Card, Icon } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon name={icon} size={16} color={color} />
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>{title}</h3>
      </div>
      <p style={{ fontSize: 12, color: "#71717a", margin: "0 0 12px 24px" }}>{subtitle}</p>

      {items.length === 0 ? (
        <div style={{ padding: "14px 4px", fontSize: 12, color: "#52525b" }}>
          Henüz {kind === "improved" ? "iyileşen" : "kötüleşen"} konu yok.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((g, i) => {
            const subj = SUBJ[g.subject];
            const pct = Math.round(Math.abs(g.trendPct));
            const arrow = g.trend > 0 ? "▲" : "▼";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 12px",
                  background: "#0c0c0e",
                  border: "1px solid #18181c",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: subj.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: subj.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {subj.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.topic}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    color,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {arrow} %{pct}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------
// Weak topic detail card — sparkline + trend
// ---------------------------------------------------------------------
function WeakTopicCard({ group, isMobile }) {
  const { Card } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;
  const subj = SUBJ[group.subject];
  if (!subj) return null;

  const trendArrow = group.trend > 0 ? "▲" : group.trend < 0 ? "▼" : "·";
  const trendColor = group.trend > 0 ? "#ef4444" : group.trend < 0 ? "#10b981" : "#71717a";
  const trendBg = group.trend > 0 ? "#1a0c0e" : group.trend < 0 ? "#06120e" : "#111114";
  const trendBorder = group.trend > 0 ? "#3b1d1e" : group.trend < 0 ? "#0e3b2c" : "#1f1f23";
  const trendLabel = group.trend > 0 ? "Kötüleşiyor" : group.trend < 0 ? "İyileşiyor" : "Sabit";

  return (
    <Card style={{ padding: isMobile ? 14 : 18, position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -40, right: -40,
          width: 120, height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${subj.color}10, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12, position: "relative" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: subj.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: subj.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {subj.name}
            </span>
          </div>
          <div style={{ fontSize: 14, color: "#fafafa", fontWeight: 600, lineHeight: 1.35 }}>
            {group.topic}
          </div>
        </div>

        {group.events.length >= 2 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 999,
              background: trendBg,
              border: "1px solid " + trendBorder,
              fontSize: 11,
              fontWeight: 600,
              color: trendColor,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {trendArrow} %{Math.round(Math.abs(group.trendPct))}
          </div>
        )}
      </div>

      <Sparkline events={group.events} color={subj.color} isMobile={isMobile} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          marginTop: 12,
        }}
      >
        <Stat label="Yanlış" value={group.totalWrong} accent="#ef4444" />
        <Stat label="Boş" value={group.totalBlank} accent="#f59e0b" />
        <Stat label="Puan" value={group.score.toFixed(1)} accent="#a78bfa" hint="Y + B/2" />
        <Stat label="Kayıt" value={group.count} accent="#71717a" />
      </div>

      {group.events.length >= 2 && (
        <div style={{ marginTop: 10, fontSize: 11, color: "#71717a", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: trendColor, fontWeight: 600 }}>{trendLabel}</span>
          <span>·</span>
          <span>
            İlk yarı ortalaması ile son yarı ortalaması arasında %{Math.round(Math.abs(group.trendPct))} fark
          </span>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, accent, hint }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: "#0c0c0e",
        border: "1px solid #18181c",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, color: accent, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 9, color: "#3f3f46", marginTop: 1 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Sparkline — basit line + nokta + tooltip (title)
// ---------------------------------------------------------------------
function Sparkline({ events, color, isMobile }) {
  const { fmtDate, fmtDateShort } = window.KPSS_UI;
  const W = 600;
  const H = isMobile ? 90 : 110;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (events.length === 0) return null;

  const points = events.map((e) => ({
    date: e.date,
    score: e.wrong + e.blank * 0.5,
    wrong: e.wrong,
    blank: e.blank,
  }));

  const maxScore = Math.max(1, ...points.map((p) => p.score));
  const minDate = new Date(points[0].date).getTime();
  const maxDate = new Date(points[points.length - 1].date).getTime();
  const dateRange = Math.max(1, maxDate - minDate);

  const xy = points.map((p, i) => {
    const tx = points.length === 1
      ? padL + innerW / 2
      : padL + ((new Date(p.date).getTime() - minDate) / dateRange) * innerW;
    const ty = padT + innerH - (p.score / maxScore) * innerH;
    return { ...p, x: tx, y: ty };
  });

  const pathD = xy.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaD = xy.length === 1
    ? null
    : `${pathD} L${xy[xy.length - 1].x},${padT + innerH} L${xy[0].x},${padT + innerH} Z`;

  const yTicks = [0, Math.ceil(maxScore / 2), Math.ceil(maxScore)];

  const gradId = "spark_" + color.replace("#", "");

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", maxHeight: H }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => {
          const y = padT + innerH - (t / maxScore) * innerH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1a1a1d" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 3} fontSize="9" fill="#52525b" textAnchor="end">{t}</text>
            </g>
          );
        })}

        {areaD && <path d={areaD} fill={`url(#${gradId})`} />}
        <path d={pathD} stroke={color} strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {xy.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#0a0a0c" stroke={color} strokeWidth="1.5" />
            <title>{`${fmtDate(p.date)} · Y:${p.wrong} B:${p.blank} → ${p.score.toFixed(1)} puan`}</title>
          </g>
        ))}

        {/* X axis labels: ilk ve son */}
        {xy.length >= 1 && (
          <text x={padL} y={H - 6} fontSize="9" fill="#71717a" textAnchor="start">
            {fmtDateShort(xy[0].date)}
          </text>
        )}
        {xy.length >= 2 && (
          <text x={W - padR} y={H - 6} fontSize="9" fill="#71717a" textAnchor="end">
            {fmtDateShort(xy[xy.length - 1].date)}
          </text>
        )}
      </svg>
    </div>
  );
}

window.KPSS_WEAK_TOPICS = WeakTopicsPage;
