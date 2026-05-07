// Pomodoro page — 4 mod (Pomodoro 25, Uzun 50, Kısa Mola 5, Uzun Mola 15) +
// Web Audio ile self-contained ambient sesler (yumuşak yağmur, hafif yağmur,
// okyanus dalgaları, dinlendirici akor pad müziği). Volume eğrisi perceptual
// + max gain cap → en yüksekte bile rahatsız etmesin.
import { useState, useEffect, useRef } from "react";
import { Card, Button, Icon } from "../components/ui";
import { useViewport } from "../hooks/useViewport";
import { usePersistentState } from "../hooks/usePersistentState";

function PomodoroPage() {
  const { isMobile, isTablet } = useViewport();

  const MODES = {
    pomodoro: { label: "Kısa Pomodoro", short: "Çalışma",   duration: 25 * 60, color: "#10b981", kind: "work" },
    short:    { label: "Kısa Mola", short: "Kısa Mola", duration:  5 * 60, color: "#10b981", kind: "rest" },
    extended: { label: "Uzun Pomodoro",     short: "Uzun Çalışma", duration: 50 * 60, color: "#a78bfa", kind: "work" },
    long:     { label: "Uzun Mola", short: "Uzun Mola", duration: 10 * 60, color: "#a78bfa", kind: "rest" },
  };

  const [mode, setMode] = usePersistentState("pomodoro.mode", "pomodoro");
  const [timeLeft, setTimeLeft] = useState(() => (MODES[mode] || MODES.pomodoro).duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);

  // Mola sonrası dönülecek son çalışma modu — pomodoro mu uzun mu seçtiyse onu hatırla.
  const lastWorkRef = useRef(MODES[mode]?.kind === "work" ? mode : "pomodoro");
  useEffect(() => {
    if (MODES[mode] && MODES[mode].kind === "work") lastWorkRef.current = mode;
  }, [mode]);

  // Ambient sesler
  const ambient = useAmbientPlayer();

  // Reset when mode changes manually
  useEffect(() => {
    setTimeLeft((MODES[mode] || MODES.pomodoro).duration);
    setIsRunning(false);
  }, [mode]);

  // Tick
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          playBeep();
          setIsRunning(false);
          const cur = MODES[mode];
          if (cur && cur.kind === "work") {
            setCompleted((c) => {
              const nextCount = c + 1;
              const next = mode === "extended" ? "long" : (nextCount % 4 === 0 ? "long" : "short");
              setTimeout(() => setMode(next), 200);
              return nextCount;
            });
          } else {
            // Mola bitti → son çalışma moduna dön
            setTimeout(() => setMode(lastWorkRef.current || "pomodoro"), 200);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, mode]);

  // Update document title with countdown
  useEffect(() => {
    if (!isRunning) {
      document.title = "KPSS Sınav Takip";
      return;
    }
    document.title = `${formatTime(timeLeft)} · ${MODES[mode].short} — KPSS`;
    return () => { document.title = "KPSS Sınav Takip"; };
  }, [timeLeft, isRunning, mode]);

  const cur = MODES[mode] || MODES.pomodoro;
  const progress = 1 - timeLeft / cur.duration;

  const onToggle = () => setIsRunning((r) => !r);
  const onReset = () => { setTimeLeft(cur.duration); setIsRunning(false); };
  const onSkip = () => { setTimeLeft(0); };

  // Mode tab grid: mobil 2x2, tablet 2x2, desktop 4 kol
  const modeCols = isMobile ? "1fr 1fr" : isTablet ? "1fr 1fr" : "repeat(4, 1fr)";

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px 16px" : "28px 32px 64px 32px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: isMobile ? 18 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
          Pomodoro
        </h1>
        <p style={{ fontSize: isMobile ? 12.5 : 13.5, color: "#71717a", margin: "4px 0 0 0" }}>
          Çalışma: 25 veya 50 dk · Mola: 5 / 10 dk · 4 kısa pomodoro sonrası uzun mola.
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "grid", gridTemplateColumns: modeCols, gap: 4, padding: 4, background: "#0c0c0e", border: "1px solid #1f1f23", borderRadius: 10, marginBottom: isMobile ? 14 : 18 }}>
        {Object.entries(MODES).map(([key, m]) => {
          const active = mode === key;
          return (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                background: active ? "#16161a" : "transparent",
                border: "none",
                borderRadius: 7,
                padding: isMobile ? "10px 6px" : "11px 12px",
                cursor: "pointer",
                color: active ? "#fafafa" : "#71717a",
                fontSize: isMobile ? 12 : 13,
                fontWeight: active ? 600 : 500,
                fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span>{m.label}</span>
              <span style={{ fontSize: isMobile ? 10 : 10.5, color: active ? m.color : "#52525b", fontVariantNumeric: "tabular-nums" }}>
                {Math.floor(m.duration / 60)} dk
              </span>
            </button>
          );
        })}
      </div>

      {/* Timer card */}
      <Card style={{ padding: isMobile ? "28px 16px" : "40px 24px", marginBottom: isMobile ? 14 : 16, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: -60, right: -60,
            width: 200, height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cur.color}1a, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 18 : 24, position: "relative" }}>
          <ProgressRing
            value={progress}
            color={cur.color}
            size={isMobile ? 220 : 280}
            stroke={isMobile ? 10 : 12}
            label={formatTime(timeLeft)}
            sublabel={cur.short.toUpperCase()}
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={onToggle}
              style={{
                background: isRunning ? "transparent" : `linear-gradient(135deg, ${cur.color}, ${cur.color}cc)`,
                border: isRunning ? "1px solid #27272a" : "1px solid transparent",
                color: isRunning ? "#fafafa" : "#04140e",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 28px",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minWidth: 140,
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <Icon name={isRunning ? "pause" : "play"} size={14} color={isRunning ? "#fafafa" : "#04140e"} />
              {isRunning ? "Duraklat" : "Başlat"}
            </button>
            <Button variant="ghost" onClick={onReset}>
              <Icon name="refresh" size={14} /> Sıfırla
            </Button>
            {isRunning && (
              <Button variant="ghost" onClick={onSkip}>
                <Icon name="skip" size={14} /> Atla
              </Button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#71717a" }}>
            <span>
              Tamamlanan: <span style={{ color: "#10b981", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{completed}</span> pomodoro
            </span>
            {completed > 0 && (
              <button
                onClick={() => { if (confirm("Pomodoro sayacı sıfırlansın mı?")) setCompleted(0); }}
                style={{ background: "transparent", border: "none", color: "#52525b", fontSize: 11, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
              >
                sıfırla
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Ambient sounds card */}
      <Card style={{ padding: isMobile ? 16 : 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="music" size={16} color="#a78bfa" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", margin: 0 }}>Arka Plan Sesi</h2>
        </div>
        <p style={{ fontSize: 12, color: "#71717a", margin: "2px 0 14px 24px" }}>
          Sözsüz ambiyans — odaklanmaya yardımcı, yumuşak sesler.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {AMBIENT_TRACKS.map((tr) => {
            const active = ambient.mode === tr.id;
            return (
              <button
                key={tr.id}
                onClick={() => ambient.setMode(tr.id)}
                style={{
                  padding: "12px 10px",
                  borderRadius: 10,
                  border: "1px solid " + (active ? tr.color : "#1f1f23"),
                  background: active ? `${tr.color}14` : "#0c0c0e",
                  color: active ? tr.color : "#a1a1aa",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                }}
              >
                <Icon name={tr.icon} size={16} color={active ? tr.color : "#71717a"} />
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 500 }}>{tr.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#0c0c0e", border: "1px solid #18181c", borderRadius: 8 }}>
          <Icon name="volume" size={14} color="#71717a" />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(ambient.volume * 100)}
            onChange={(e) => ambient.setVolume(parseInt(e.target.value) / 100)}
            disabled={ambient.mode === "off"}
            style={{
              flex: 1,
              accentColor: "#10b981",
              cursor: ambient.mode === "off" ? "not-allowed" : "pointer",
              opacity: ambient.mode === "off" ? 0.4 : 1,
            }}
          />
          <span style={{ fontSize: 11, color: "#71717a", fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "right" }}>
            {Math.round(ambient.volume * 100)}
          </span>
        </div>
      </Card>
    </div>
  );
}

const AMBIENT_TRACKS = [
  { id: "off",      label: "Sessiz",     icon: "x",     color: "#71717a" },
  { id: "rain",     label: "Yağmur",     icon: "music", color: "#06b6d4" },
  { id: "softrain", label: "Hafif Yağmur", icon: "music", color: "#10b981" },
  { id: "waves",    label: "Okyanus",    icon: "music", color: "#60a5fa" },
  { id: "music",    label: "Müzik",      icon: "music", color: "#a78bfa" },
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return String(m).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
}

// ---------------------------------------------------------------------
// Progress ring (SVG) — center label is timer
// ---------------------------------------------------------------------
function ProgressRing({ value, color, size = 240, stroke = 12, label, sublabel }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  const center = size / 2;
  const gradId = "ringGrad_" + color.replace("#", "");

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} stroke="#18181c" strokeWidth={stroke} fill="none" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.4s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: size > 240 ? 64 : 52,
            fontWeight: 700,
            color: "#fafafa",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 10.5, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Ambient player — Web Audio API ile self-contained sesler.
// İnternet/dış URL gerekmez. Volume perceptual (x^1.6) + max gain 0.5 ile cap.
// ---------------------------------------------------------------------
function useAmbientPlayer() {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const cleanupRef = useRef(null);
  const [mode, setMode] = useState("off");
  const [volume, setVolume] = useState(0.3);

  useEffect(() => {
    // Önceki track'i durdur
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (mode === "off") return;

    if (!ctxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current = new Ctor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (!masterRef.current) {
      const m = ctx.createGain();
      m.gain.value = volumeToGain(volume);
      m.connect(ctx.destination);
      masterRef.current = m;
    }
    const master = masterRef.current;

    if (mode === "rain")     cleanupRef.current = startRain(ctx, master);
    else if (mode === "softrain") cleanupRef.current = startSoftRain(ctx, master);
    else if (mode === "waves")    cleanupRef.current = startWaves(ctx, master);
    else if (mode === "music")    cleanupRef.current = startMusic(ctx, master);
  }, [mode]);

  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      const t = ctxRef.current.currentTime;
      const g = masterRef.current.gain;
      g.cancelScheduledValues(t);
      g.linearRampToValueAtTime(volumeToGain(volume), t + 0.06);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (ctxRef.current) try { ctxRef.current.close(); } catch (e) {}
    };
  }, []);

  return { mode, setMode, volume, setVolume };
}

// Slider değerini perceptually doğal hissettirecek gain'e çevir.
// Max ~0.5 — eski 1.0 değerinin yarısı, kullanıcı en üstte bile rahatsız olmasın.
function volumeToGain(v) {
  const x = Math.max(0, Math.min(1, v));
  return Math.pow(x, 1.6) * 0.5;
}

// ---------------------------------------------------------------------
// Track generators — her biri cleanup function döner.
// ---------------------------------------------------------------------

// Yağmur: pink noise + high-pass (rumble at) + low-pass (harsh giderme) +
// rastgele aralıklarla küçük "damla" impulse'ları.
function startRain(ctx, master) {
  const buf = createPinkBuffer(ctx, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 220;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1500;
  lp.Q.value = 0.7;

  const trackGain = ctx.createGain();
  trackGain.gain.value = 0.55;

  src.connect(hp).connect(lp).connect(trackGain).connect(master);
  src.start();

  let stopped = false;
  const scheduleDroplet = () => {
    if (stopped) return;
    const delay = 700 + Math.random() * 2000;
    setTimeout(() => {
      if (stopped) return;
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        const f = 700 + Math.random() * 900;
        const t = ctx.currentTime;
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.06);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.018, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g).connect(trackGain);
        o.start(t);
        o.stop(t + 0.13);
      } catch (e) {}
      scheduleDroplet();
    }, delay);
  };
  scheduleDroplet();

  return () => {
    stopped = true;
    try { src.stop(); } catch (e) {}
    try { src.disconnect(); } catch (e) {}
    try { trackGain.disconnect(); } catch (e) {}
  };
}

// Hafif Yağmur: brown noise + ağır low-pass — uzaktan yağmur hissi, çok yumuşak.
function startSoftRain(ctx, master) {
  const buf = createBrownBuffer(ctx, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 750;

  const trackGain = ctx.createGain();
  trackGain.gain.value = 0.65;

  src.connect(lp).connect(trackGain).connect(master);
  src.start();

  return () => {
    try { src.stop(); } catch (e) {}
    try { src.disconnect(); } catch (e) {}
    try { trackGain.disconnect(); } catch (e) {}
  };
}

// Okyanus dalgaları: pink noise + low-pass + LFO ile yavaş gain modülasyonu (swell).
function startWaves(ctx, master) {
  const buf = createPinkBuffer(ctx, 4);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1100;

  const waveGain = ctx.createGain();
  waveGain.gain.value = 0.45;

  // 0.1 Hz = 10 sn'lik swell periyodu
  const lfo = ctx.createOscillator();
  const lfoAmt = ctx.createGain();
  lfo.frequency.value = 0.1;
  lfoAmt.gain.value = 0.35;
  lfo.connect(lfoAmt).connect(waveGain.gain);
  lfo.start();

  src.connect(lp).connect(waveGain).connect(master);
  src.start();

  return () => {
    try { src.stop(); } catch (e) {}
    try { lfo.stop(); } catch (e) {}
    try { src.disconnect(); } catch (e) {}
    try { lfo.disconnect(); } catch (e) {}
    try { waveGain.disconnect(); } catch (e) {}
  };
}

// Dinlendirici müzik: Am-F-C-G akor pad (sine + soft triangle) + slow tremolo.
function startMusic(ctx, master) {
  const chords = [
    [220.00, 261.63, 329.63], // Am: A3, C4, E4
    [174.61, 220.00, 261.63], // F:  F3, A3, C4
    [261.63, 329.63, 392.00], // C:  C4, E4, G4
    [196.00, 246.94, 293.66], // G:  G3, B3, D4
  ];

  const padGain = ctx.createGain();
  padGain.gain.value = 0.18;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1700;

  padGain.connect(lp).connect(master);

  // Slow tremolo
  const lfo = ctx.createOscillator();
  const lfoAmt = ctx.createGain();
  lfo.frequency.value = 0.12;
  lfoAmt.gain.value = 0.04;
  lfo.connect(lfoAmt).connect(padGain.gain);
  lfo.start();

  let active = []; // { o, g }
  let chordIdx = 0;
  let stopped = false;

  const playChord = (freqs) => {
    if (stopped) return;
    const t = ctx.currentTime;
    const fadeOut = 1.6;
    const fadeIn  = 2.5;
    // Önceki akor fade-out
    const old = active;
    active = [];
    for (const it of old) {
      try {
        it.g.gain.cancelScheduledValues(t);
        it.g.gain.setValueAtTime(it.g.gain.value, t);
        it.g.gain.linearRampToValueAtTime(0.0001, t + fadeOut);
        it.o.stop(t + fadeOut + 0.1);
      } catch (e) {}
    }
    const peak = 0.45 / freqs.length;
    for (const f of freqs) {
      try {
        const o1 = ctx.createOscillator();
        o1.type = "sine";
        o1.frequency.value = f;
        const o2 = ctx.createOscillator();
        o2.type = "triangle";
        o2.frequency.value = f * 1.005;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + fadeIn);
        o1.connect(g);
        o2.connect(g);
        g.connect(padGain);
        o1.start(t);
        o2.start(t);
        active.push({ o: o1, g });
        active.push({ o: o2, g });
      } catch (e) {}
    }
  };

  playChord(chords[0]);
  const iv = setInterval(() => {
    chordIdx = (chordIdx + 1) % chords.length;
    playChord(chords[chordIdx]);
  }, 6500);

  return () => {
    stopped = true;
    clearInterval(iv);
    try { lfo.stop(); } catch (e) {}
    try { lfo.disconnect(); } catch (e) {}
    for (const it of active) {
      try { it.o.stop(); } catch (e) {}
    }
    active = [];
    try { padGain.disconnect(); } catch (e) {}
  };
}

// ---------------------------------------------------------------------
// Noise buffer factories
// ---------------------------------------------------------------------
function createPinkBuffer(ctx, seconds) {
  const sampleRate = ctx.sampleRate;
  const length = seconds * sampleRate;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buffer;
}

function createBrownBuffer(ctx, seconds) {
  const sampleRate = ctx.sampleRate;
  const length = seconds * sampleRate;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function playBeep() {
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const tone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(g).connect(ctx.destination);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    tone(880, 0, 0.25);
    tone(1175, 0.3, 0.35);
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 1200);
  } catch (e) {
    // ignored
  }
}

export default PomodoroPage;
