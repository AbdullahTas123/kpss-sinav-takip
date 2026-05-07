// Soru Çözümü sayfası — sadece Konu Testi (karma kaldırıldı). Çözülen soru hacmi grafiği +
// son test analizi kartı + tüm kayıt listesi. Karma test desteği projeden çıkarıldı; eski
// karma kayıtlar geriye dönük olarak listede görünmeye devam eder fakat yeni kayıtlar daima
// "konu" tipindedir (state.questions.type === "konu" + tek topic alanı zorunlu).

function QuestionsPage() {
  const { Card, Button, Icon, ConfirmModal, calcNet, round2 } = window.KPSS_UI;
  const [state, setState] = React.useState(window.kpssStore.get());
  React.useEffect(() => window.kpssStore.subscribe(setState), []);
  const { isMobile, isTablet } = window.useViewport();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState(null);
  const [chartRange, setChartRange] = window.usePersistentState("questions.chartRange", "14g");

  const editingQuestion = editingId ? state.questions.find((q) => q.id === editingId) : null;
  const openAdd = () => { setEditingId(null); setModalOpen(true); };
  const openEdit = (id) => { setEditingId(id); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };
  const requestDelete = (id) => setPendingDeleteId(id);
  const confirmDelete = () => {
    if (pendingDeleteId) window.kpssStore.deleteQuestion(pendingDeleteId);
    setPendingDeleteId(null);
  };
  const cancelDelete = () => setPendingDeleteId(null);

  const totalSolved = React.useMemo(
    () => state.questions.reduce((s, q) => s + (q.total || 0), 0),
    [state.questions]
  );
  const recordCount = state.questions.length;
  const avgNet = React.useMemo(() => {
    if (!state.questions.length) return 0;
    const sum = state.questions.reduce((s, q) => s + calcNet(q.correct, q.wrong), 0);
    return sum / state.questions.length;
  }, [state.questions]);

  const sortedQuestions = React.useMemo(
    () => [...state.questions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [state.questions]
  );

  const rangeLabel = chartRange === "14g" ? "Son 14 Gün" : chartRange === "1ay" ? "Son 1 Ay" : chartRange === "3ay" ? "Son 3 Ay" : "Tüm Zamanlar";

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px 16px" : "28px 32px 64px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
            Soru Çözümü
          </h1>
          <p style={{ fontSize: 13.5, color: "#71717a", margin: "4px 0 0 0" }}>
            Çözdüğün her konu testini buraya kaydet — anında ders/konu bazlı analiz görürsün.
          </p>
        </div>
        {/* <Button onClick={openAdd}>
          <Icon name="plus" size={14} color="#04140e" /> Soru Çözümü Ekle
        </Button> */}
      </div>

      {/* Mini-stats: 3 kart */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <QStatTile label="Toplam Çözülen Soru" value={totalSolved.toLocaleString("tr-TR")} accent="#10b981" />
        <QStatTile label="Toplam Test Kaydı" value={recordCount} accent="#06b6d4" />
        <QStatTile label="Ortalama Net" value={round2(avgNet)} accent="#a78bfa" />
      </div>

      {/* Chart + Son Test Analizi yan yana */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1.5fr 1fr", gap: isMobile ? 12 : 16, marginBottom: 16 }}>
        <Card style={{ padding: isMobile ? 16 : 22 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="trend" size={16} color="#10b981" />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
                  Çözülen Soru — {rangeLabel}
                </h2>
              </div>
              <p style={{ fontSize: 12, color: "#71717a", margin: "2px 0 0 24px" }}>
                Hangi günlerde çalıştığını ve hacmi tek bakışta gör.
              </p>
            </div>
            <RangeTabs value={chartRange} onChange={setChartRange} />
          </div>
          <QuestionChart questions={state.questions} isMobile={isMobile} range={chartRange} />
        </Card>

        <LastTestAnalysisCard questions={state.questions} isMobile={isMobile} />
      </div>

      {/* Data list */}
      <Card style={{ padding: isMobile ? 16 : 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="list" size={16} color="#71717a" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>Soru Çözüm Kayıtları</h2>
            <span style={{ fontSize: 11, color: "#52525b" }}>({sortedQuestions.length})</span>
          </div>
          <Button onClick={openAdd}>
            <Icon name="plus" size={14} color="#04140e" /> Soru Çözümü Ekle
          </Button>
        </div>

        {sortedQuestions.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "#52525b" }}>
            <Icon name="pen" size={32} color="#3f3f46" />
            <div style={{ marginTop: 12, fontSize: 13 }}>Henüz soru çözüm kaydı yok</div>
            <Button style={{ marginTop: 16 }} onClick={openAdd}>
              <Icon name="plus" size={14} color="#04140e" /> İlk Kaydı Ekle
            </Button>
          </div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedQuestions.map((q) => <QuestionCardMobile key={q.id} q={q} onEdit={openEdit} onDelete={requestDelete} />)}
          </div>
        ) : (
          <QuestionTable questions={sortedQuestions} onEdit={openEdit} onDelete={requestDelete} />
        )}
      </Card>

      {modalOpen && <QuestionModal existing={editingQuestion} onClose={closeModal} />}
      {pendingDeleteId && (
        <ConfirmModal
          title="Soru çözüm kaydı silinsin mi?"
          message="Bu kayıt kalıcı olarak silinecek. Geri alınamaz."
          confirmLabel="Sil"
          danger
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Range tabs (14g · 1ay · 3ay · Tüm)
// ---------------------------------------------------------------------
function RangeTabs({ value, onChange }) {
  const items = [
    { val: "14g", lbl: "14 Gün" },
    { val: "1ay", lbl: "1 Ay" },
    { val: "3ay", lbl: "3 Ay" },
    { val: "tum", lbl: "Tümü" },
  ];
  return (
    <div style={{ display: "inline-flex", background: "#0c0c0e", border: "1px solid #1f1f23", borderRadius: 10, padding: 4, gap: 2 }}>
      {items.map((it) => (
        <button
          key={it.val}
          onClick={() => onChange(it.val)}
          style={{
            background: value === it.val ? "#1f1f23" : "transparent",
            color: value === it.val ? "#fafafa" : "#71717a",
            border: "none",
            borderRadius: 7,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: value === it.val ? 600 : 500,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {it.lbl}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Chart — bin'leri range'e göre üretir
//   14g/1ay → günlük (14 / 30 bar)
//   3ay     → haftalık (12 bar, 7'şer günlük pencereler bugüne dayalı)
//   tum     → aylık (en eski kayıt ayından bugüne)
// ---------------------------------------------------------------------
function buildBins(questions, range) {
  const { trToday, trAddDays, trDateKey, trMakeIso, calcNet } = window.KPSS_UI;
  const todayKey = trToday();
  let mode, bins = [];

  if (range === "14g" || range === "1ay") {
    mode = "day";
    const n = range === "14g" ? 14 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const key = trAddDays(todayKey, -i);
      bins.push({ key, date: new Date(trMakeIso(key)), total: 0, net: 0 });
    }
  } else if (range === "3ay") {
    mode = "week";
    for (let i = 11; i >= 0; i--) {
      const endKey = trAddDays(todayKey, -i * 7);
      const startKey = trAddDays(endKey, -6);
      bins.push({ startKey, endKey, date: new Date(trMakeIso(endKey)), total: 0, net: 0 });
    }
  } else {
    mode = "month";
    let firstKey = todayKey;
    if (questions.length > 0) {
      const allKeys = questions.map((q) => trDateKey(q.date)).sort();
      firstKey = allKeys[0];
    }
    const [fy, fm] = firstKey.split("-").map(Number);
    const [ty, tm] = todayKey.split("-").map(Number);
    let y = fy, mo = fm;
    while (y < ty || (y === ty && mo <= tm)) {
      const midIso = `${y}-${String(mo).padStart(2, "0")}-15T12:00:00+03:00`;
      bins.push({ y, m: mo, date: new Date(midIso), total: 0, net: 0 });
      mo++; if (mo > 12) { mo = 1; y++; }
    }
    if (bins.length === 0) {
      const midIso = `${ty}-${String(tm).padStart(2, "0")}-15T12:00:00+03:00`;
      bins.push({ y: ty, m: tm, date: new Date(midIso), total: 0, net: 0 });
    }
  }

  for (const q of questions) {
    const k = trDateKey(q.date);
    let slot;
    if (mode === "day") {
      slot = bins.find((b) => b.key === k);
    } else if (mode === "week") {
      slot = bins.find((b) => k >= b.startKey && k <= b.endKey);
    } else {
      const [qy, qm] = k.split("-").map(Number);
      slot = bins.find((b) => b.y === qy && b.m === qm);
    }
    if (slot) {
      slot.total += q.total || 0;
      slot.net += calcNet(q.correct, q.wrong);
    }
  }

  return { bins, mode };
}

function binAxisLabel(b, mode) {
  const TR = window.KPSS_UI.TR_TZ;
  if (mode === "day") {
    return b.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: TR });
  }
  if (mode === "week") {
    const sd = new Date(b.startKey + "T12:00:00+03:00");
    return sd.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: TR });
  }
  return b.date.toLocaleDateString("tr-TR", { month: "short", timeZone: TR });
}

function binTooltipLabel(b, mode) {
  const TR = window.KPSS_UI.TR_TZ;
  if (mode === "day") {
    return b.date.toLocaleDateString("tr-TR", { weekday: "short", day: "2-digit", month: "long", timeZone: TR });
  }
  if (mode === "week") {
    const sd = new Date(b.startKey + "T12:00:00+03:00");
    const ed = new Date(b.endKey + "T12:00:00+03:00");
    const sStr = sd.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: TR });
    const eStr = ed.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: TR });
    return `${sStr} – ${eStr}`;
  }
  return b.date.toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: TR });
}

function QuestionChart({ questions, isMobile, range }) {
  const { round2 } = window.KPSS_UI;
  const wrapRef = React.useRef(null);
  const [width, setWidth] = React.useState(720);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const { bins, mode } = React.useMemo(() => buildBins(questions, range), [questions, range]);

  const H = isMobile ? 160 : 200;
  const padL = 32, padR = 12, padT = 12, padB = 30;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = H - padT - padB;
  const max = Math.max(10, ...bins.map((b) => b.total));
  const stepX = bins.length > 0 ? innerW / bins.length : innerW;
  const barW = Math.max(6, stepX * 0.62);

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((max * i) / yTicks));

  // X ekseni etiket sıklığı: bin sayısı arttıkça atla
  const xLabelEvery = bins.length <= 14 ? 2 : bins.length <= 20 ? 3 : Math.ceil(bins.length / 8);

  const [hoverIdx, setHoverIdx] = React.useState(null);

  return (
    <div ref={wrapRef} style={{ width: "100%", position: "relative" }}>
      <svg width={width} height={H} style={{ display: "block" }}>
        {tickVals.map((v, i) => {
          const y = padT + innerH - (v / max) * innerH;
          return (
            <g key={i}>
              <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="#1a1a1d" strokeDasharray="2 4" />
              <text x={padL - 6} y={y + 3.5} fontSize="9.5" fill="#52525b" textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>
                {v}
              </text>
            </g>
          );
        })}
        {bins.map((b, i) => {
          const x = padL + i * stepX + (stepX - barW) / 2;
          const h = b.total > 0 ? (b.total / max) * innerH : 0;
          const y = padT + innerH - h;
          const isHover = hoverIdx === i;
          const fill = b.total > 0 ? (isHover ? "#10b981" : "#0e3b2c") : "transparent";
          const stroke = b.total > 0 ? "#10b981" : "transparent";
          const showLabel = i === 0 || i === bins.length - 1 || i % xLabelEvery === 0;
          return (
            <g key={i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={padL + i * stepX} y={padT} width={stepX} height={innerH} fill="transparent" />
              <rect x={x} y={y} width={barW} height={h} fill={fill} stroke={stroke} strokeWidth={1} rx={3} />
              {showLabel && (
                <text x={padL + i * stepX + stepX / 2} y={H - 10} fontSize="9.5" fill="#52525b" textAnchor="middle">
                  {binAxisLabel(b, mode)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverIdx !== null && bins[hoverIdx] && bins[hoverIdx].total > 0 && (() => {
        const b = bins[hoverIdx];
        const x = padL + hoverIdx * stepX + stepX / 2;
        const left = Math.max(8, Math.min(width - 200, x - 90));
        return (
          <div
            style={{
              position: "absolute",
              left,
              top: 0,
              background: "#0a0a0c",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 11.5,
              color: "#e4e4e7",
              minWidth: 180,
              pointerEvents: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ color: "#a1a1aa", marginBottom: 4 }}>{binTooltipLabel(b, mode)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
              <span style={{ color: "#71717a" }}>Çözülen</span>
              <span style={{ color: "#10b981", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{b.total} soru</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginTop: 2 }}>
              <span style={{ color: "#71717a" }}>Toplam Net</span>
              <span style={{ color: "#fafafa", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {round2(b.net)}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------
// Son Test Analizi — en son kayıt + bu konuda trend (önceki avg ile karşılaştırma)
// ---------------------------------------------------------------------
function LastTestAnalysisCard({ questions, isMobile }) {
  const { Card, Icon, calcNet, round2, fmtDate } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;

  // Önce konu kayıtlarına öncelik ver (eski karma kayıtlarında konu yok)
  const sorted = React.useMemo(
    () => [...questions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [questions]
  );
  const last = sorted.find((q) => q.topic) || sorted[0] || null;

  if (!last) {
    return (
      <Card style={{ padding: isMobile ? 16 : 22, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="spark" size={16} color="#a78bfa" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
            Son Test Analizi
          </h2>
        </div>
        <p style={{ fontSize: 12, color: "#71717a", margin: "2px 0 0 24px" }}>
          Anında ders/konu bazlı feedback
        </p>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", color: "#52525b", fontSize: 13, textAlign: "center", gap: 8 }}>
          <Icon name="pen" size={28} color="#3f3f46" />
          <div>Henüz soru çözüm kaydı yok</div>
          <div style={{ fontSize: 11, color: "#3f3f46" }}>İlk kaydı ekle, anında analiz çıkar.</div>
        </div>
      </Card>
    );
  }

  const subj = SUBJ[last.subject];
  const successPct = last.total > 0 ? (last.correct / last.total) * 100 : 0;
  const net = calcNet(last.correct, last.wrong);

  // Trend: aynı subject + topic'e ait önceki kayıtların ortalama başarısı vs son kayıt
  let trendNode = null;
  if (last.topic) {
    const sameTopic = questions
      .filter((q) => q.subject === last.subject && q.topic === last.topic)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const priors = sameTopic.slice(0, -1);
    if (priors.length === 0) {
      trendNode = (
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>
          Bu konudan ilk kaydın — sonraki kayıtlarla karşılaştırılacak.
        </div>
      );
    } else {
      const priorAvg = priors.reduce((s, q) => s + (q.total > 0 ? (q.correct / q.total) * 100 : 0), 0) / priors.length;
      const delta = successPct - priorAvg;
      const better = delta > 1.5;
      const worse = delta < -1.5;
      const same = !better && !worse;
      const color = better ? "#10b981" : worse ? "#ef4444" : "#a1a1aa";
      const bg = better ? "#06120e" : worse ? "#1a0c0e" : "#111114";
      const border = better ? "#0e3b2c" : worse ? "#3b1d1e" : "#1f1f23";
      const arrow = better ? "▲" : worse ? "▼" : "·";
      const label = better ? "İyileşiyorsun" : worse ? "Kötüleşiyor" : "Sabit";
      trendNode = (
        <div
          style={{
            padding: "10px 12px",
            background: bg,
            border: "1px solid " + border,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color, fontWeight: 600, fontSize: 12.5 }}>
              {arrow} {label}
            </span>
            <span style={{ color, fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
              {delta >= 0 ? "+" : ""}{round2(delta)} puan
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.4 }}>
            {priors.length} önceki kaydın ortalaması: <span style={{ color: "#d4d4d8", fontWeight: 600 }}>%{round2(priorAvg)}</span> · son: <span style={{ color: "#d4d4d8", fontWeight: 600 }}>%{round2(successPct)}</span>
          </div>
        </div>
      );
    }
  } else {
    trendNode = (
      <div style={{ fontSize: 12, color: "#71717a", padding: "10px 12px", background: "#0c0c0e", border: "1px dashed #27272a", borderRadius: 8 }}>
        Bu kayıtta konu seçili değil (eski karma test) — analiz yapılamıyor.
      </div>
    );
  }

  return (
    <Card style={{ padding: isMobile ? 16 : 22, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          position: "absolute",
          top: -40, right: -40,
          width: 140, height: 140,
          borderRadius: "50%",
          background: subj ? `radial-gradient(circle, ${subj.color}14, transparent 70%)` : "transparent",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, position: "relative" }}>
        <Icon name="spark" size={16} color="#a78bfa" />
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>
          Son Test Analizi
        </h2>
      </div>
      <p style={{ fontSize: 12, color: "#71717a", margin: "2px 0 12px 24px", position: "relative" }}>
        Anında ders/konu bazlı feedback
      </p>

      <div style={{ marginBottom: 12, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: subj ? subj.color : "#52525b", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: subj ? subj.color : "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {subj ? subj.name : "—"}
          </span>
          <span style={{ fontSize: 11, color: "#52525b", marginLeft: "auto" }}>{fmtDate(last.date)}</span>
        </div>
        <div style={{ fontSize: 14, color: "#fafafa", fontWeight: 600, lineHeight: 1.35 }}>
          {last.topic || "Konu belirtilmemiş"}
        </div>
        <div style={{ fontSize: 11, color: "#52525b", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
          {last.correct} doğru · {last.wrong} yanlış · {last.blank} boş · {last.total} soru
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12, position: "relative" }}>
        <div style={{ padding: "10px 12px", background: "#0a0a0c", border: "1px solid #18181c", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Başarı</div>
          <div style={{ fontSize: 22, color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
            %{round2(successPct)}
          </div>
        </div>
        <div style={{ padding: "10px 12px", background: "#0a0a0c", border: "1px solid #18181c", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Net</div>
          <div style={{ fontSize: 22, color: "#a78bfa", fontWeight: 700, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
            {round2(net)}
          </div>
        </div>
      </div>

      <div style={{ position: "relative" }}>{trendNode}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Desktop tablo
// ---------------------------------------------------------------------
function QuestionTable({ questions, onEdit, onDelete }) {
  const { Icon, calcNet, round2, fmtDate } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;

  const th = { textAlign: "left", padding: "10px 8px", fontSize: 10.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, borderBottom: "1px solid #1a1a1d", whiteSpace: "nowrap" };
  const td = { padding: "12px 8px", borderBottom: "1px solid #131316", fontSize: 13, color: "#e4e4e7", verticalAlign: "middle" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Tarih</th>
            <th style={th}>Ders</th>
            <th style={th}>Konu</th>
            <th style={{ ...th, textAlign: "center" }}>Top.</th>
            <th style={{ ...th, textAlign: "center" }}>D</th>
            <th style={{ ...th, textAlign: "center" }}>Y</th>
            <th style={{ ...th, textAlign: "center" }}>B</th>
            <th style={{ ...th, textAlign: "right" }}>Net</th>
            <th style={{ ...th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const s = SUBJ[q.subject];
            const net = calcNet(q.correct, q.wrong);
            return (
              <tr key={q.id} style={{ transition: "background 0.15s" }}
                onMouseEnter={(ev) => ev.currentTarget.style.background = "#0c0c0e"}
                onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
              >
                <td style={{ ...td, color: "#a1a1aa", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(q.date)}</td>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s ? s.color : "#52525b" }} />
                    <span style={{ color: "#fafafa", fontWeight: 500 }}>{s ? s.name : "—"}</span>
                  </div>
                </td>
                <td style={{ ...td, color: "#a1a1aa", fontSize: 12.5 }}>
                  {q.topic ? q.topic : <span style={{ color: "#52525b" }}>—</span>}
                </td>
                <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#a1a1aa" }}>{q.total}</td>
                <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#10b981", fontWeight: 600 }}>{q.correct}</td>
                <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#ef4444", fontWeight: 600 }}>{q.wrong}</td>
                <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#71717a" }}>{q.blank}</td>
                <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>{round2(net)}</span>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button onClick={() => onEdit(q.id)} style={qIconBtn} title="Düzenle">
                      <Icon name="pen" size={13} />
                    </button>
                    <button onClick={() => onDelete(q.id)} style={qIconBtn} title="Sil">
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

const qIconBtn = {
  background: "transparent", border: "1px solid #1f1f23", borderRadius: 6,
  width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "#71717a", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
};

// ---------------------------------------------------------------------
// Mobil kart
// ---------------------------------------------------------------------
function QuestionCardMobile({ q, onEdit, onDelete }) {
  const { Icon, calcNet, round2, fmtDate } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;
  const s = SUBJ[q.subject];
  const net = calcNet(q.correct, q.wrong);

  return (
    <div style={{ padding: 14, background: "#0c0c0e", border: "1px solid #18181c", borderRadius: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s ? s.color : "#52525b" }} />
            <span style={{ fontSize: 13.5, color: "#fafafa", fontWeight: 600 }}>{s ? s.name : "—"}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#a1a1aa" }}>
            {q.topic || "—"}
          </div>
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>
            {fmtDate(q.date)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9.5, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Net</div>
          <div style={{ fontSize: 18, color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{round2(net)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 8 }}>
        {[
          { lbl: "Top.", val: q.total, color: "#a1a1aa" },
          { lbl: "Doğru", val: q.correct, color: "#10b981" },
          { lbl: "Yanlış", val: q.wrong, color: "#ef4444" },
          { lbl: "Boş", val: q.blank, color: "#71717a" },
        ].map((c) => (
          <div key={c.lbl} style={{ padding: "5px 4px", background: "#0a0a0c", border: "1px solid #18181c", borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.lbl}</div>
            <div style={{ fontSize: 12.5, color: c.color, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, paddingTop: 8, borderTop: "1px solid #18181c" }}>
        <button onClick={() => onEdit(q.id)} style={qIconBtn} title="Düzenle">
          <Icon name="pen" size={12} />
        </button>
        <button onClick={() => onDelete(q.id)} style={qIconBtn} title="Sil">
          <Icon name="trash" size={12} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Modal — sadece Konu Testi
// ---------------------------------------------------------------------
function QuestionModal({ existing, onClose }) {
  const { Button, Input, Select, Label, Icon, calcNet, round2 } = window.KPSS_UI;
  const SUBJ = window.KPSS_SUBJECTS;
  const { isMobile } = window.useViewport();

  const [date, setDate] = React.useState(existing ? window.KPSS_UI.trDateKey(existing.date) : window.KPSS_UI.trToday());
  const [subject, setSubject] = React.useState(existing?.subject || "");
  const [topic, setTopic] = React.useState(existing?.topic || "");
  const [total, setTotal] = React.useState(existing ? String(existing.total) : "");
  const [correct, setCorrect] = React.useState(existing ? String(existing.correct) : "");
  const [wrong, setWrong] = React.useState(existing ? String(existing.wrong) : "");
  const [error, setError] = React.useState("");

  const subjectOptions = Object.entries(SUBJ).map(([k, v]) => ({ value: k, label: v.name }));
  const subj = subject ? SUBJ[subject] : null;
  const topicOptions = subj ? subj.topics.map((t) => ({ value: t, label: t })) : [];

  const totalN = parseInt(total) || 0;
  const correctN = parseInt(correct) || 0;
  const wrongN = parseInt(wrong) || 0;
  const blank = Math.max(0, totalN - correctN - wrongN);
  const sum = correctN + wrongN;
  const overflow = sum > totalN && totalN > 0;
  const net = calcNet(correctN, wrongN);

  React.useEffect(() => { setError(""); }, [total, correct, wrong, subject, topic]);

  // Subject değişince konuyu sıfırla — ilk mount'ta (mevcut kaydı düzenliyorsak) atla
  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    setTopic("");
  }, [subject]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const onSave = () => {
    if (!subject) return setError("Lütfen ders seçiniz.");
    if (!topic) return setError("Lütfen konu seçiniz.");
    if (totalN <= 0) return setError("Toplam soru sayısı girilmelidir.");
    if (overflow) return setError(`Doğru + Yanlış (${sum}), Toplam (${totalN}) sayısını geçemez!`);
    if (correctN < 0 || wrongN < 0) return setError("Negatif değer girilemez.");

    const newIso = window.KPSS_UI.trMakeIso(date);
    const finalDate = existing && window.KPSS_UI.trDateKey(existing.date) === date ? existing.date : newIso;
    const payload = {
      date: finalDate,
      type: "konu",
      subject,
      topic,
      total: totalN,
      correct: correctN,
      wrong: wrongN,
      blank,
      weakTopics: [],
    };
    if (existing) window.kpssStore.updateQuestion(existing.id, payload);
    else window.kpssStore.addQuestion(payload);
    onClose();
  };

  const isLegacyKarma = existing && existing.type === "karma";

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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fafafa" }}>
              {existing ? "Soru Çözümünü Düzenle" : "Yeni Soru Çözümü"}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#71717a" }}>Konu seç, doğru/yanlış gir — net otomatik hesaplanır.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 8, width: 32, height: 32, color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: isMobile ? 18 : 24 }}>
          {isLegacyKarma && (
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "#0c0c0e", border: "1px dashed #27272a", borderRadius: 8, fontSize: 12, color: "#a1a1aa" }}>
              Bu eski bir karma kaydı — düzenlemek için bir konu seçmen gerekir. Karma test desteği kaldırıldı; eski kayıtlardaki "eksik konu" listesi konu seçildiğinde temizlenir.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <Label>Tarih</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Ders</Label>
              <Select value={subject} onChange={(e) => setSubject(e.target.value)} options={subjectOptions} placeholder="Ders seçiniz..." />
            </div>
            <div>
              <Label>Konu</Label>
              <Select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                options={topicOptions}
                placeholder={subject ? "Konu seçiniz..." : "Önce ders seçin"}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <Label>Toplam Soru</Label>
              <Input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Örn: 30" error={overflow} />
            </div>
            <div>
              <Label>Doğru</Label>
              <Input type="number" min="0" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="0" error={overflow} />
            </div>
            <div>
              <Label>Yanlış</Label>
              <Input type="number" min="0" value={wrong} onChange={(e) => setWrong(e.target.value)} placeholder="0" error={overflow} />
            </div>
            <div>
              <Label hint="otomatik">Boş</Label>
              <div
                style={{
                  background: "#0a0a0c",
                  border: "1px dashed #27272a",
                  borderRadius: 8,
                  color: "#71717a",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalN > 0 ? blank : "—"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#06120e",
              border: "1px solid #0e3b2c",
              borderRadius: 8,
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <span style={{ color: "#71d4af" }}>
              Net: <span style={{ color: "#10b981", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 16 }}>{round2(net)}</span>
            </span>
            <span style={{ color: "#52525b" }}>Net = Doğru − (Yanlış / 4)</span>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#1a0c0e", border: "1px solid #3b1d1e", borderRadius: 8, color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert" size={14} color="#ef4444" /> {error}
            </div>
          )}
        </div>

        <div style={{ position: "sticky", bottom: 0, background: "#0c0c0e", borderTop: "1px solid #1f1f23", padding: isMobile ? "14px 18px" : "16px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button onClick={onSave} disabled={overflow}>
            <Icon name="check" size={14} color="#04140e" /> {existing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Mini stat tile
// ---------------------------------------------------------------------
function QStatTile({ label, value, suffix, accent }) {
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

window.KPSS_QUESTIONS = QuestionsPage;
