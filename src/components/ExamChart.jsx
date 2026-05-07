// Advanced exam chart for the Deneme Sınavları page
// - Range filter: 7d / 30d / 90d / last10
// - Subject toggles + total mode toggle
// - Y axis switches between net (max=120 total or fixedCount per subject) and duration (minutes)
// - Hover tooltip shows full breakdown for the hovered exam
import { useState, useEffect, useMemo, useRef } from "react";
import { Icon, calcNet, round2, fmtDate, fmtDateShort } from "./ui";
import { KPSS_SUBJECTS } from "../utils/subjects";
import { usePersistentState } from "../hooks/usePersistentState";

function ExamChart({ exams, isMobile, kind = "genel", goals }) {
  const SUBJ = KPSS_SUBJECTS;
  const subjectKeys = Object.keys(SUBJ);
  const isBrans = kind === "brans";

  const [range, setRange] = usePersistentState("examchart.range", "last10");
  const [mode, setMode] = usePersistentState("examchart.mode", kind === "brans" ? "subjects" : "total"); // 'total' | 'subjects'
  const [metric, setMetric] = usePersistentState("examchart.metric", "net"); // 'net' | 'duration'
  const [enabled, setEnabled] = useState(() => {
    const o = {};
    for (const k of subjectKeys) o[k] = true;
    return o;
  });
  const [hoverIdx, setHoverIdx] = useState(null);
  const wrapRef = useRef(null);
  const [wrapWidth, setWrapWidth] = useState(800);

  // Kind değişince mode/range/hover sıfırlansın (Branş'ta total yok)
  useEffect(() => {
    setHoverIdx(null);
    if (isBrans && mode === "total") setMode("subjects");
  }, [kind]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWrapWidth(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const sourceExams = useMemo(
    () => exams.filter((e) => e.type === kind).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [exams, kind]
  );

  const filtered = useMemo(() => {
    if (range === "last10") return sourceExams.slice(-10);
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    return sourceExams.filter((e) => new Date(e.date).getTime() >= cutoff);
  }, [sourceExams, range]);

  // dimensions
  const W = Math.max(360, wrapWidth);
  const H = isMobile ? 240 : 280;
  const padL = 44;
  const padR = 18;
  const padT = 18;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // compute series
  const series = useMemo(() => {
    if (filtered.length === 0) return [];

    if (metric === "duration") {
      if (isBrans) {
        return subjectKeys
          .filter((sk) => enabled[sk])
          .map((sk) => {
            const subj = SUBJ[sk];
            return {
              key: sk,
              color: subj.color,
              label: subj.name,
              points: filtered.map((e) => {
                if (e.subject !== sk) return { date: e.date, value: null, exam: e };
                return { date: e.date, value: e.durationMin || 0, exam: e };
              }),
            };
          });
      }
      return [{
        key: "duration",
        color: "#06b6d4",
        label: "Süre (dk)",
        points: filtered.map((e) => ({ date: e.date, value: e.durationMin || 0, exam: e })),
      }];
    }

    if (!isBrans && mode === "total") {
      return [{
        key: "total",
        color: "#10b981",
        label: "Toplam Net",
        points: filtered.map((e) => {
          let n = 0;
          for (const sk of subjectKeys) {
            const s = e.subjects[sk];
            if (s) n += calcNet(s.correct, s.wrong);
          }
          return { date: e.date, value: n, exam: e };
        }),
      }];
    }

    // Ders bazında — Genel: her dersin her denemedeki neti; Branş: yalnızca o derse ait branş denemelerinin neti, diğerlerinde value=null (gap)
    return subjectKeys
      .filter((sk) => enabled[sk])
      .map((sk) => {
        const subj = SUBJ[sk];
        return {
          key: sk,
          color: subj.color,
          label: subj.name,
          points: filtered.map((e) => {
            if (isBrans) {
              if (e.subject !== sk) return { date: e.date, value: null, exam: e };
              return { date: e.date, value: calcNet(e.correct, e.wrong), exam: e };
            }
            const s = e.subjects[sk];
            const n = s ? calcNet(s.correct, s.wrong) : 0;
            return { date: e.date, value: n, exam: e };
          }),
        };
      });
  }, [filtered, mode, metric, enabled, isBrans]);

  const yMax = useMemo(() => {
    if (metric === "duration") {
      const relevant = isBrans ? filtered.filter((e) => enabled[e.subject]) : filtered;
      // Hedef süre yalnızca Genel deneme grafiğinde geçerli — yMax onu da kapsasın ki
      // tüm denemeler hedef sürenin altındayken bile çizgi görünsün.
      const td = !isBrans ? (Number(goals && goals.targetDurationMin) || 0) : 0;
      const m = Math.max(60, td, ...relevant.map((e) => e.durationMin || 0));
      return Math.ceil(m / 30) * 30;
    }
    if (!isBrans && mode === "total") return 120;
    // subjects: max fixed count among enabled (Branş'ta da aynı: en yüksek fixedCount = 30)
    let m = 0;
    for (const sk of subjectKeys) if (enabled[sk]) m = Math.max(m, SUBJ[sk].fixedCount);
    return m || 30;
  }, [mode, metric, enabled, filtered, isBrans, goals]);

  const toX = (i, len) => padL + (len <= 1 ? innerW / 2 : (i * innerW) / (len - 1));
  const toY = (v) => padT + innerH - (v / yMax) * innerH;

  // ticks
  const yTicks = metric === "duration"
    ? [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax].map((v) => Math.round(v))
    : (mode === "total" ? [0, 30, 60, 90, 120] : [0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((3 * yMax) / 4), yMax]);

  const xLabelEvery = filtered.length <= 6 ? 1 : Math.ceil(filtered.length / 6);

  const onSvgMove = (ev) => {
    if (filtered.length === 0) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * W;
    const rel = Math.max(0, Math.min(innerW, x - padL));
    const idx = filtered.length === 1 ? 0 : Math.round((rel / innerW) * (filtered.length - 1));
    setHoverIdx(idx);
  };
  const onSvgLeave = () => setHoverIdx(null);

  const hoveredExam = hoverIdx !== null ? filtered[hoverIdx] : null;

  // tooltip content
  const tooltipContent = hoveredExam
    ? (() => {
        if (isBrans) {
          const subj = SUBJ[hoveredExam.subject];
          const net = calcNet(hoveredExam.correct, hoveredExam.wrong);
          return {
            isBrans: true,
            exam: hoveredExam,
            subj,
            correct: hoveredExam.correct,
            wrong: hoveredExam.wrong,
            blank: hoveredExam.blank,
            net,
            total: hoveredExam.total || (subj ? subj.fixedCount : 0),
          };
        }
        const items = subjectKeys.map((sk) => {
          const s = hoveredExam.subjects[sk];
          const subj = SUBJ[sk];
          const n = s ? calcNet(s.correct, s.wrong) : 0;
          return { sk, subj, c: s ? s.correct : 0, w: s ? s.wrong : 0, n };
        });
        let totalNet = 0;
        items.forEach((it) => (totalNet += it.n));
        return { items, totalNet, exam: hoveredExam };
      })()
    : null;

  // toggle helpers
  const toggleAll = (on) => {
    const o = {};
    for (const k of subjectKeys) o[k] = on;
    setEnabled(o);
  };

  const rangeBtn = (val, label) => (
    <button
      key={val}
      onClick={() => setRange(val)}
      style={{
        background: range === val ? "#1f1f23" : "transparent",
        color: range === val ? "#fafafa" : "#71717a",
        border: "none",
        borderRadius: 7,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: range === val ? 600 : 500,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      {/* Controls bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "inline-flex", background: "#0c0c0e", border: "1px solid #1f1f23", borderRadius: 10, padding: 4, gap: 2 }}>
          {rangeBtn("7d", "7 Gün")}
          {rangeBtn("30d", "1 Ay")}
          {rangeBtn("90d", "3 Ay")}
          {rangeBtn("last10", "Son 10")}
        </div>

        <div style={{ display: "inline-flex", background: "#0c0c0e", border: "1px solid #1f1f23", borderRadius: 10, padding: 4, gap: 2 }}>
          {!isBrans && (
            <button
              onClick={() => { setMetric("net"); setMode("total"); }}
              style={chipBtn(metric === "net" && mode === "total")}
            >
              Toplam Net
            </button>
          )}
          <button
            onClick={() => { setMetric("net"); setMode("subjects"); }}
            style={chipBtn(metric === "net" && mode === "subjects")}
          >
            {isBrans ? "Net" : "Ders Bazında Net"}
          </button>
          <button
            onClick={() => { setMetric("duration"); }}
            style={chipBtn(metric === "duration")}
          >
            Süre
          </button>
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {/* Subject toggles (only when ders bazında) */}
      {((metric === "net" && mode === "subjects") || (isBrans && metric === "duration")) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            padding: "10px 12px",
            background: "#0c0c0e",
            border: "1px solid #18181c",
            borderRadius: 10,
          }}
        >
          <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: 4 }}>
            Dersler
          </span>
          {subjectKeys.map((sk) => {
            const subj = SUBJ[sk];
            const on = enabled[sk];
            return (
              <button
                key={sk}
                onClick={() => setEnabled({ ...enabled, [sk]: !on })}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: on ? subj.color + "1f" : "transparent",
                  border: "1px solid " + (on ? subj.color + "55" : "#27272a"),
                  color: on ? subj.color : "#71717a",
                  borderRadius: 999,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: on ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  textDecoration: on ? "none" : "line-through",
                  textDecorationThickness: "1px",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: subj.color, opacity: on ? 1 : 0.4 }} />
                {subj.name}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          <button onClick={() => toggleAll(true)} style={subActionBtn}>Tümünü Aç</button>
          <button onClick={() => toggleAll(false)} style={subActionBtn}>Tümünü Kapa</button>
        </div>
      )}

      {/* Chart */}
      <div style={{ position: "relative" }}>
        {filtered.length === 0 ? (
          <div style={{ height: H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#52525b", fontSize: 13, gap: 8 }}>
            <Icon name="trend" size={28} color="#3f3f46" />
            Bu aralıkta deneme bulunamadı
          </div>
        ) : (
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: "block", overflow: "visible" }}
            onMouseMove={onSvgMove}
            onMouseLeave={onSvgLeave}
            onTouchMove={(ev) => {
              const t = ev.touches[0];
              if (!t) return;
              const rect = ev.currentTarget.getBoundingClientRect();
              const x = ((t.clientX - rect.left) / rect.width) * W;
              const rel = Math.max(0, Math.min(innerW, x - padL));
              const idx = filtered.length === 1 ? 0 : Math.round((rel / innerW) * (filtered.length - 1));
              setHoverIdx(idx);
            }}
            onTouchEnd={onSvgLeave}
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>

            {yTicks.map((t, i) => {
              const y = toY(t);
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1a1a1d" strokeDasharray="3 3" />
                  <text x={padL - 8} y={y + 4} fontSize="10" fill="#52525b" textAnchor="end">
                    {t}
                  </text>
                </g>
              );
            })}

            {/* Hedef çizgileri — net modunda Toplam/Ders bazında hedef net, süre modunda (Genel) hedef süre */}
            {(() => {
              if (!goals) return null;

              // SÜRE MODU — yalnızca Genel deneme grafiğinde (branş'ta uygulanmaz)
              if (metric === "duration") {
                if (isBrans) return null;
                const td = Number(goals.targetDurationMin) || 0;
                if (td <= 0 || td > yMax) return null;
                const y = toY(td);
                return (
                  <g>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
                    <rect x={W - padR - 88} y={y - 14} width={86} height={16} rx={4} fill="#1a0e02" stroke="#3b2a0e" />
                    <text x={W - padR - 6} y={y - 2} fontSize="10" fill="#f59e0b" textAnchor="end" fontWeight="600">
                      Hedef {td} dk
                    </text>
                  </g>
                );
              }

              // NET MODU
              const targetNet = Number(goals.targetNet) || 0;
              if (targetNet <= 0) return null;
              const totalFixed = subjectKeys.reduce((s, k) => s + SUBJ[k].fixedCount, 0);
              const ps = goals.perSubject || {};

              // Toplam Net (yalnızca Genel + total)
              if (!isBrans && mode === "total") {
                if (targetNet > yMax) return null;
                const y = toY(targetNet);
                return (
                  <g>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
                    <rect x={W - padR - 70} y={y - 14} width={68} height={16} rx={4} fill="#1a0e02" stroke="#3b2a0e" />
                    <text x={W - padR - 6} y={y - 2} fontSize="10" fill="#f59e0b" textAnchor="end" fontWeight="600">
                      Hedef {targetNet}
                    </text>
                  </g>
                );
              }

              // Ders Bazında — her açık ders için ince kesik çizgi (kendi rengi)
              return subjectKeys.map((sk) => {
                if (!enabled[sk]) return null;
                const explicit = ps[sk];
                const t = (explicit !== undefined && explicit !== null && Number.isFinite(Number(explicit)))
                  ? Number(explicit)
                  : (totalFixed > 0 ? (targetNet * SUBJ[sk].fixedCount) / totalFixed : 0);
                if (t <= 0 || t > yMax) return null;
                const y = toY(t);
                const color = SUBJ[sk].color;
                return (
                  <g key={"tgt-" + sk}>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.55" />
                    <text x={W - padR - 4} y={y - 2} fontSize="9" fill={color} textAnchor="end" fontWeight="600" opacity="0.85">
                      {SUBJ[sk].name.slice(0, 4)} {Math.round(t * 10) / 10}
                    </text>
                  </g>
                );
              });
            })()}

            {/* hover vertical line */}
            {hoverIdx !== null && (
              <line
                x1={toX(hoverIdx, filtered.length)}
                y1={padT}
                x2={toX(hoverIdx, filtered.length)}
                y2={padT + innerH}
                stroke="#27272a"
                strokeDasharray="3 3"
              />
            )}

            {/* areas (only for single-line modes — branş'ta gap'li serilerde area çizmiyoruz) */}
            {!isBrans && (mode === "total" || metric === "duration") && series.map((s) => {
              if (s.points.length < 2) return null;
              const path = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i, s.points.length)},${toY(p.value)}`).join(" ");
              const area = `${path} L${toX(s.points.length - 1, s.points.length)},${padT + innerH} L${toX(0, s.points.length)},${padT + innerH} Z`;
              return <path key={s.key + "-area"} d={area} fill={`url(#grad-${s.key})`} />;
            })}

            {/* lines (null değerli noktalarda çizgi kırılır) */}
            {series.map((s) => {
              if (s.points.length === 0) return null;
              let path = "";
              let pen = false;
              s.points.forEach((p, i) => {
                if (p.value === null || p.value === undefined) { pen = false; return; }
                const x = toX(i, s.points.length);
                const y = toY(p.value);
                path += `${pen ? "L" : "M"}${x},${y} `;
                pen = true;
              });
              return (
                <g key={s.key}>
                  {path && (
                    <path d={path.trim()} stroke={s.color} strokeWidth="2.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {s.points.map((p, i) => {
                    if (p.value === null || p.value === undefined) return null;
                    return (
                      <circle
                        key={i}
                        cx={toX(i, s.points.length)}
                        cy={toY(p.value)}
                        r={hoverIdx === i ? 5 : 3.5}
                        fill="#0a0a0c"
                        stroke={s.color}
                        strokeWidth={hoverIdx === i ? 2.5 : 2}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* x labels */}
            {filtered.map((e, i) => {
              if (i % xLabelEvery !== 0 && i !== filtered.length - 1) return null;
              return (
                <text
                  key={i}
                  x={toX(i, filtered.length)}
                  y={H - 14}
                  fontSize="10"
                  fill="#71717a"
                  textAnchor="middle"
                >
                  {fmtDateShort(e.date)}
                </text>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {hoveredExam && tooltipContent && (() => {
          const x = toX(hoverIdx, filtered.length);
          const xPct = (x / W) * 100;
          const onRight = xPct > 60;
          return (
            <div
              style={{
                position: "absolute",
                top: padT,
                left: onRight ? "auto" : `calc(${xPct}% + 18px)`,
                right: onRight ? `calc(${100 - xPct}% + 18px)` : "auto",
                background: "#0c0c0e",
                border: "1px solid #1f1f23",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
                pointerEvents: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                zIndex: 5,
                fontSize: 12,
              }}
            >
              <div style={{ fontSize: 11, color: "#71717a", marginBottom: 2 }}>{fmtDate(tooltipContent.exam.date)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fafafa", marginBottom: 8 }}>
                {tooltipContent.exam.name || (isBrans && tooltipContent.subj ? tooltipContent.subj.name + " Branş" : "Genel Deneme")}
              </div>
              {tooltipContent.isBrans ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: tooltipContent.subj.color }} />
                    <span style={{ fontSize: 11, color: tooltipContent.subj.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {tooltipContent.subj.name}
                    </span>
                    {metric !== "duration" && (
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#52525b" }}>{tooltipContent.total} soru</span>
                    )}
                  </div>
                  {metric === "duration" ? (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                      <span style={{ color: "#06b6d4" }}>Süre</span>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "#e4e4e7", fontWeight: 600 }}>
                        {tooltipContent.exam.durationMin || 0} dk
                      </span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#71717a" }}>Doğru</span>
                          <span style={{ color: "#10b981", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{tooltipContent.correct}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#71717a" }}>Yanlış</span>
                          <span style={{ color: "#ef4444", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{tooltipContent.wrong}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#71717a" }}>Boş</span>
                          <span style={{ color: "#a1a1aa", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{tooltipContent.blank}</span>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid #1f1f23", margin: "8px 0", paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Net</span>
                        <span style={{ color: tooltipContent.subj.color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {round2(tooltipContent.net)}
                        </span>
                      </div>
                      {tooltipContent.exam.durationMin && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#71717a" }}>
                          <span>Süre</span>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{tooltipContent.exam.durationMin} dk</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : metric === "duration" ? (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ color: "#06b6d4" }}>Süre</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "#e4e4e7", fontWeight: 600 }}>
                    {tooltipContent.exam.durationMin || 0} dk
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {tooltipContent.items.map((it) => (
                      <div key={it.sk} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: it.subj.color }} />
                          <span style={{ color: "#a1a1aa" }}>{it.subj.name}</span>
                        </span>
                        <span style={{ fontVariantNumeric: "tabular-nums", color: "#e4e4e7", fontWeight: 600 }}>
                          {round2(it.n)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid #1f1f23", margin: "8px 0", paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Toplam Net</span>
                    <span style={{ color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {round2(tooltipContent.totalNet)}
                    </span>
                  </div>
                  {tooltipContent.exam.durationMin && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#71717a" }}>
                      <span>Süre</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{tooltipContent.exam.durationMin} dk</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );

  function chipBtn(active) {
    return {
      background: active ? "#1f1f23" : "transparent",
      color: active ? "#fafafa" : "#71717a",
      border: "none",
      borderRadius: 7,
      padding: "6px 12px",
      fontSize: 12,
      fontWeight: active ? 600 : 500,
      fontFamily: "inherit",
      cursor: "pointer",
      transition: "all 0.15s",
    };
  }
}
const subActionBtn = {
  background: "transparent",
  color: "#a1a1aa",
  border: "1px solid #27272a",
  borderRadius: 7,
  padding: "5px 10px",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

export default ExamChart;
