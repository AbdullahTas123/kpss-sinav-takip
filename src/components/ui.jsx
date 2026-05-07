// Shared UI primitives + helpers for KPSS Takip
import { useEffect } from "react";

// --- Türkiye saati (Europe/Istanbul) yardımcıları --------------------
// Tarih binning ve formatlama her yerde Türkiye yerel gününe göre yapılır;
// kullanıcı sistem saati farklı bir TZ'deyse bile kayıtlar 23:00–02:00
// arası "yanlış güne" düşmesin. UTC ISO key kullanmak Türkiye için
// bir gün kayma yaratıyordu ("30 Nisan 65 soru" hatası bundandı).
export const TR_TZ = "Europe/Istanbul";

// "YYYY-MM-DD" — verilen tarihin Türkiye yerel günü. Sistem TZ'sinden bağımsız.
export function trDateKey(d) {
  const x = d instanceof Date ? d : new Date(d);
  return x.toLocaleDateString("sv-SE", { timeZone: TR_TZ });
}
export function trToday() {
  return trDateKey(new Date());
}
// Key üzerine (saf string aritmetiği değil, UTC tabanlı güvenli) gün ekle/çıkar
export function trAddDays(key, days) {
  const [y, m, day] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
// "YYYY-MM-DD" → ISO timestamp anchored at 12:00 Türkiye saatinde.
// Form kayıtlarında kullanılır: hangi sistem TZ'sinden girilirse girilsin
// trDateKey aynı günü döndürsün.
export function trMakeIso(key) {
  return new Date(key + "T12:00:00+03:00").toISOString();
}

export function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const dayStart = s.toLocaleDateString("tr-TR", { day: "2-digit", timeZone: TR_TZ });
  const dayEnd = e.toLocaleDateString("tr-TR", { day: "2-digit", timeZone: TR_TZ });
  const month = e.toLocaleDateString("tr-TR", { month: "short", timeZone: TR_TZ });
  const year = e.toLocaleDateString("tr-TR", { year: "numeric", timeZone: TR_TZ });
  return `${dayStart} - ${dayEnd} ${month} ${year}`;
}

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: TR_TZ });
};

export const fmtDateShort = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: TR_TZ });
};
export const calcNet = (correct, wrong) => Math.max(0, correct - wrong / 4);
export const round2 = (n) => Math.round(n * 100) / 100;

// Card
export function Card({ children, className = "", style = {}, ...props }) {
  return (
    <div
      className={"kpss-card " + className}
      style={{
        background: "#111114",
        border: "1px solid #1f1f23",
        borderRadius: 12,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Button
export function Button({ children, variant = "primary", size = "md", onClick, disabled, type = "button", style = {}, className = "" }) {
  const base = {
    border: "1px solid transparent",
    borderRadius: 8,
    fontWeight: 500,
    fontSize: size === "sm" ? 13 : 14,
    padding: size === "sm" ? "6px 12px" : "9px 16px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "inherit",
    lineHeight: 1.2,
  };
  const variants = {
    primary: {
      background: "linear-gradient(135deg, #10b981, #14b8a6)",
      color: "#04140e",
      fontWeight: 600,
    },
    ghost: {
      background: "transparent",
      color: "#a1a1aa",
      border: "1px solid #27272a",
    },
    danger: {
      background: "transparent",
      color: "#ef4444",
      border: "1px solid #3f1d1d",
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// Input
export function Input({ value, onChange, placeholder, type = "text", min, max, error, style = {}, ...props }) {
  return (
    <input
      type={type}
      value={value === null || value === undefined ? "" : value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      style={{
        width: "100%",
        background: "#0c0c0e",
        border: "1px solid " + (error ? "#7f1d1d" : "#27272a"),
        borderRadius: 8,
        color: "#e4e4e7",
        padding: "10px 12px",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.15s",
        ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = error ? "#7f1d1d" : "#3f3f46")}
      onBlur={(e) => (e.target.style.borderColor = error ? "#7f1d1d" : "#27272a")}
      {...props}
    />
  );
}

// Select
export function Select({ value, onChange, options, placeholder, style = {} }) {
  return (
    <select
      value={value || ""}
      onChange={onChange}
      style={{
        width: "100%",
        background: "#0c0c0e",
        border: "1px solid #27272a",
        borderRadius: 8,
        color: value ? "#e4e4e7" : "#52525b",
        padding: "10px 12px",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        appearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 4.5l3 3 3-3' stroke='%2371717a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: 32,
        ...style,
      }}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0c0c0e", color: "#e4e4e7" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Field label
export function Label({ children, hint, style = {} }) {
  return (
    <label style={{ display: "block", fontSize: 12, color: "#a1a1aa", fontWeight: 500, marginBottom: 6, ...style }}>
      {children}
      {hint && <span style={{ color: "#52525b", fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
    </label>
  );
}

// Badge / topic chip
export function Chip({ children, active, onClick, color = "#10b981", style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? color + "22" : "transparent",
        border: "1px solid " + (active ? color : "#27272a"),
        color: active ? color : "#a1a1aa",
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 12,
        fontFamily: "inherit",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
        fontWeight: active ? 600 : 400,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Tabs
export function Tabs({ tabs, value, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "#0c0c0e",
        border: "1px solid #1f1f23",
        borderRadius: 10,
        padding: 4,
        gap: 2,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          style={{
            background: value === t.value ? "#1f1f23" : "transparent",
            color: value === t.value ? "#fafafa" : "#71717a",
            border: "none",
            borderRadius: 7,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: value === t.value ? 600 : 500,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Icon set (stroke-based, lucide style)
export const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.75 }) => {
  const paths = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2z"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    pen: <><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.5 7.5"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z"/><path d="M4 19.5V22h16"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    trend: <><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    alert: <><path d="M12 2L2 21h20L12 2z"/><path d="M12 9v5M12 18v.01"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></>,
    check: <><path d="M5 12l5 5L20 7"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color}/></>,
    flame: <><path d="M12 2s4 4 4 9a4 4 0 11-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0012 0c0-7-6-12-6-12z"/></>,
    spark: <><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
    play: <><path d="M6 4l14 8-14 8V4z" fill={color}/></>,
    pause: <><rect x="6" y="4" width="4" height="16" fill={color}/><rect x="14" y="4" width="4" height="16" fill={color}/></>,
    refresh: <><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></>,
    skip: <><path d="M5 4l10 8-10 8V4z" fill={color}/><path d="M19 4v16"/></>,
    music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    volume: <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15 9a4 4 0 010 6"/><path d="M18 6a8 8 0 010 12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// Reusable centered confirmation modal (used for destructive actions: delete records etc.)
export function ConfirmModal({ title, message, confirmLabel = "Onayla", cancelLabel = "Vazgeç", onConfirm, onCancel, danger = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 250,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0c0e",
          border: "1px solid #1f1f23",
          borderRadius: 14,
          width: "100%",
          maxWidth: 420,
          padding: "22px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              flexShrink: 0,
              width: 40, height: 40, borderRadius: 10,
              background: danger ? "#1a0c0e" : "#06120e",
              border: "1px solid " + (danger ? "#3b1d1e" : "#0e3b2c"),
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name={danger ? "alert" : "check"} size={18} color={danger ? "#ef4444" : "#10b981"} />
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{title}</h3>
            {message && (
              <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#a1a1aa", lineHeight: 1.55 }}>{message}</p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            style={danger ? { background: "#7f1d1d", color: "#fee2e2", border: "1px solid #991b1b", fontWeight: 600 } : {}}
          >
            <Icon name={danger ? "trash" : "check"} size={14} color={danger ? "#fee2e2" : "#04140e"} /> {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
