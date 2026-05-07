// AppShell: Sidebar + Topbar + Countdown (responsive)
import { useState, useEffect, useRef } from "react";
import { Icon, formatRange } from "./ui";
import { useViewport } from "../hooks/useViewport";
import kpssStore from "../store/store";

function useCountdown(targetIso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

export function Sidebar({ active, onNav, mobileOpen, setMobileOpen }) {
  const { isMobile } = useViewport();
  const items = [
    { id: "dashboard", label: "Ana Sayfa", icon: "grid" },
    { id: "topics", label: "Konular", icon: "target" },
    { id: "questions", label: "Soru Çözümü", icon: "pen" },
    { id: "exams", label: "Deneme Sınavları", icon: "book" },
    { id: "pomodoro", label: "Pomodoro", icon: "clock" },
  ];

  const sidebarStyle = isMobile
    ? {
        width: 260,
        background: "#0a0a0c",
        borderRight: "1px solid #1a1a1d",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
      }
    : {
        width: 248,
        flexShrink: 0,
        background: "#0a0a0c",
        borderRight: "1px solid #1a1a1d",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
      };

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99, backdropFilter: "blur(2px)" }}
        />
      )}
      <aside style={sidebarStyle}>
        <div style={{ padding: "8px 10px 24px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              KPSS Sınav Takip
            </div>
            <div style={{ fontSize: 11, color: "#52525b", marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Lisans · 2026
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer", padding: 4 }}
              aria-label="Kapat"
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => { onNav(it.id); setMobileOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: active === it.id ? "#16161a" : "transparent",
                color: active === it.id ? "#fafafa" : "#a1a1aa",
                fontSize: 13.5,
                fontWeight: active === it.id ? 600 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {active === it.id && (
                <div style={{ position: "absolute", left: -14, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #10b981, #06b6d4)", borderRadius: 2 }} />
              )}
              <Icon name={it.icon} size={16} color={active === it.id ? "#10b981" : "#71717a"} />
              <span>{it.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <DataActions />

        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "#0d0d10",
            border: "1px solid #18181c",
            fontSize: 11,
            color: "#71717a",
            lineHeight: 1.55,
          }}
        >
          <div style={{ color: "#a1a1aa", fontWeight: 600, marginBottom: 4, fontSize: 12 }}>📚 Bilgi</div>
          Tüm verilerin tarayıcında saklanır. Hesap veya internet gerekmez.
        </div>
      </aside>
    </>
  );
}

function DataActions() {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");

  const onImport = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm("Mevcut tüm verilerin yedekteki verilerle değiştirilecek. Devam edilsin mi?")) {
      e.target.value = "";
      return;
    }
    try {
      const r = await kpssStore.importJSON(f);
      const parts = [`${r.questions} soru`, `${r.exams} deneme`];
      if (r.topics) parts.push(`${r.topics} konu`);
      if (r.playlists) parts.push(`${r.playlists} liste`);
      setMsg(`✓ ${parts.join(", ")} yüklendi`);
    } catch (err) {
      setMsg("✗ " + err.message);
    }
    setTimeout(() => setMsg(""), 3000);
    e.target.value = "";
  };

  const btn = {
    flex: 1,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "8px 10px", borderRadius: 8,
    background: "#0d0d10", border: "1px solid #18181c", color: "#a1a1aa",
    fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.15s",
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, padding: "0 4px" }}>
        Veri Yedekleme
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={btn} onClick={() => kpssStore.exportJSON()} title="JSON olarak indir">
          <Icon name="trend" size={12} /> Dışa Aktar
        </button>
        <button style={btn} onClick={() => fileRef.current.click()} title="JSON yedeği yükle">
          <Icon name="plus" size={12} /> İçe Aktar
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImport} style={{ display: "none" }} />
      </div>
      {msg && (
        <div style={{ fontSize: 10.5, color: msg.startsWith("✓") ? "#10b981" : "#ef4444", marginTop: 6, padding: "0 4px" }}>
          {msg}
        </div>
      )}
    </div>
  );
}

export function Topbar({ examDate, applyDateStart, applyDateEnd, onMenu }) {
  const c = useCountdown(examDate);
  const { isMobile, isTablet } = useViewport();

  const Block = ({ value, label }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 30 }}>
      <span style={{ fontVariantNumeric: "tabular-nums", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#10b981", lineHeight: 1 }}>
        {String(value).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
        {label}
      </span>
    </div>
  );
  const Sep = () => <span style={{ color: "#27272a", fontSize: 14, fontWeight: 300 }}>:</span>;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(10,10,12,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #18181c",
        padding: isMobile ? "12px 16px" : "14px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onMenu}
            style={{ background: "transparent", border: "1px solid #27272a", borderRadius: 8, padding: 8, color: "#a1a1aa", cursor: "pointer" }}
            aria-label="Menü"
          >
            <Icon name="list" size={16} />
          </button>
        )}
        {!isMobile && (
          <div>
            <div style={{ fontSize: 13, color: "#71717a" }}>KPSS Analiz ve Takip</div>
            <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
              Sık sık verilerinizi yedeklemeyi (dışa aktarmayı) unutmayın
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, flexShrink: 0 }}>
        {!isTablet && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              borderRadius: 10,
              background: "#0d0d10",
              border: "1px solid #18181c",
            }}
          >
            <Icon name="calendar" size={15} color="#71717a" />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em"}}>
                Başvuru Tarihi
              </span>
              <span style={{ fontSize: 13, color: "#d4d4d8", fontWeight: 500 }}>
                {formatRange(applyDateStart, applyDateEnd)}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 14,
            padding: isMobile ? "6px 12px" : "8px 18px",
            borderRadius: 10,
            background: "#06120e",
            border: "1px solid #0e3b2c",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 0% 50%, rgba(16,185,129,0.10), transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <Icon name="clock" size={15} color="#10b981" />
          {!isMobile && (
            <span style={{ fontSize: 11, color: "#71d4af", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Sınava Kalan
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 6, position: "relative" }}>
            <Block value={c.days} label="Gün" />
            <Sep />
            <Block value={c.hours} label="Saat" />
            <Sep />
            <Block value={c.mins} label="Dk" />
            {!isMobile && (
              <>
                <Sep />
                <Block value={c.secs} label="Sn" />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
