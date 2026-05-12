// Lightweight zustand-like store with localStorage persistence
const KEY = "kpss-takip-store-v1";

// Schema migration helper: weakTopics may be string[] (legacy) or {topic,wrong,blank}[]
export function normalizeWeakArr(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    if (typeof x === "string") return { topic: x, wrong: 1, blank: 0 };
    if (x && typeof x === "object" && x.topic) {
      return { topic: x.topic, wrong: Number(x.wrong) || 0, blank: Number(x.blank) || 0 };
    }
    return null;
  }).filter(Boolean);
}

function normalizeTopicStatus(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const sk of Object.keys(raw)) {
    const m = raw[sk];
    if (!m || typeof m !== "object") continue;
    const inner = {};
    for (const t of Object.keys(m)) {
      const v = m[t];
      if (v === "active" || v === "done") inner[t] = v;
    }
    if (Object.keys(inner).length > 0) out[sk] = inner;
  }
  return out;
}

// Hedef net (genel) + ders bazlı net hedefleri + hedef genel deneme süresi.
// perSubject boş kalan derslerde dashboard'da fixedCount oranıyla otomatik dağıtılır (UI tarafında).
// targetDurationMin yalnızca Genel deneme için (branş'a uygulanmaz).
function defaultGoals() {
  return { targetNet: 90, perSubject: {}, targetDurationMin: 130, perSubjectDuration: {} };
}
function normalizeGoals(raw) {
  if (!raw || typeof raw !== "object") return defaultGoals();
  const tn = Number(raw.targetNet);
  const targetNet = Number.isFinite(tn) ? Math.max(0, Math.min(120, tn)) : 90;
  const perSubject = {};
  if (raw.perSubject && typeof raw.perSubject === "object") {
    for (const k of Object.keys(raw.perSubject)) {
      const v = Number(raw.perSubject[k]);
      if (Number.isFinite(v) && v >= 0) perSubject[k] = v;
    }
  }
  let targetDurationMin = null;
  if (raw.targetDurationMin !== undefined && raw.targetDurationMin !== null && raw.targetDurationMin !== "") {
    const td = Number(raw.targetDurationMin);
    if (Number.isFinite(td) && td > 0) targetDurationMin = Math.min(600, td);
  } else if (raw.targetDurationMin === undefined) {
    // Hiç tanımlanmamış (eski snapshot) → varsayılan 130 dk
    targetDurationMin = 130;
  }
  const perSubjectDuration = {};
  if (raw.perSubjectDuration && typeof raw.perSubjectDuration === "object") {
    for (const k of Object.keys(raw.perSubjectDuration)) {
      const v = Number(raw.perSubjectDuration[k]);
      if (Number.isFinite(v) && v > 0) perSubjectDuration[k] = v;
    }
  }
  return { targetNet, perSubject, targetDurationMin, perSubjectDuration };
}

function normalizePlaylists(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object" && Array.isArray(p.videos))
    .map((p) => ({
      id: String(p.id || ("pl_" + Math.random().toString(36).slice(2, 9))),
      subject: String(p.subject || ""),
      name: String(p.name || "Adsız Liste"),
      importedAt: p.importedAt || new Date().toISOString(),
      // Eski kayıtlarda yoksa varsayılan olarak seçili — geriye dönük dashboard hesabı bozulmasın.
      selected: p.selected === undefined ? true : !!p.selected,
      videos: p.videos.map((v, i) => ({
        title: String(v.title || ""),
        videoUrl: String(v.videoUrl || ""),
        videoId: String(v.videoId || ""),
        position: Number.isFinite(Number(v.position)) ? Number(v.position) : i,
        publishedAt: String(v.publishedAt || ""),
        watched: !!v.watched,
      })).filter((v) => v.title && v.videoUrl),
    }));
}

function migrateState(s) {
  if (!s || typeof s !== "object") return { questions: [], exams: [], topicStatus: {}, playlists: [], goals: defaultGoals() };
  const questions = (s.questions || []).map((q) => ({ ...q, weakTopics: normalizeWeakArr(q.weakTopics) }));
  const exams = (s.exams || []).map((e) => {
    if (e.type === "genel") {
      const subjects = {};
      for (const sk of Object.keys(e.subjects || {})) {
        subjects[sk] = { ...e.subjects[sk], weakTopics: normalizeWeakArr(e.subjects[sk].weakTopics) };
      }
      return { ...e, subjects };
    }
    return { ...e, weakTopics: normalizeWeakArr(e.weakTopics) };
  });
  const topicStatus = normalizeTopicStatus(s.topicStatus);
  const playlists = normalizePlaylists(s.playlists);
  const goals = normalizeGoals(s.goals);
  return { questions, exams, topicStatus, playlists, goals };
}

function seed() {
  // Seed tarihlerini Türkiye öğleninde (12:00 +03:00) sabitle —
  // sistem TZ farklı olsa bile dashboard binning'i (Türkiye günü) doğru gruplasın.
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const d = (offset) => {
    const x = new Date(today);
    x.setDate(x.getDate() - offset);
    return x.toISOString();
  };
  return {
    questions: [
      { id: "q1", date: d(8), type: "konu", subject: "matematik", topic: "Problemler", total: 20, correct: 13, wrong: 5, blank: 2, weakTopics: [] },
      { id: "q2", date: d(7), type: "konu", subject: "tarih", topic: "Osmanlı Devleti Siyasi Tarihi", total: 25, correct: 13, wrong: 8, blank: 4, weakTopics: [] },
      { id: "q3", date: d(5), type: "konu", subject: "turkce", topic: "Paragrafta Anlam", total: 25, correct: 20, wrong: 4, blank: 1, weakTopics: [] },
      { id: "q4", date: d(3), type: "konu", subject: "matematik", topic: "Geometri", total: 20, correct: 9, wrong: 8, blank: 3, weakTopics: [] },
      { id: "q5", date: d(2), type: "konu", subject: "cografya", topic: "Türkiye'nin İklimi ve Bitki Örtüsü", total: 15, correct: 11, wrong: 3, blank: 1, weakTopics: [] },
      { id: "q6", date: d(1), type: "konu", subject: "tarih", topic: "Osmanlı Devleti Siyasi Tarihi", total: 25, correct: 16, wrong: 6, blank: 3, weakTopics: [] },
    ],
    exams: [
      mkExam(d(40), "genel", { turkce: [22, 5], matematik: [16, 9], tarih: [15, 8], cografya: [10, 5], vatandaslik: [9, 4] }, { tarih: [{ topic: "Osmanlı Devleti Siyasi Tarihi", wrong: 5, blank: 1 }] }, "3D Yayınları TG-1", 130),
      mkExam(d(33), "genel", { turkce: [24, 4], matematik: [18, 8], tarih: [17, 6], cografya: [11, 4], vatandaslik: [10, 3] }, { matematik: [{ topic: "Geometri", wrong: 6, blank: 1 }] }, "Yediiklim TG-2", 128),
      mkExam(d(24), "genel", { turkce: [23, 5], matematik: [17, 10], tarih: [16, 7], cografya: [12, 4], vatandaslik: [11, 3] }, { matematik: [{ topic: "Problemler", wrong: 4, blank: 1 }, { topic: "Geometri", wrong: 5, blank: 2 }] }, "Pegem TG-3", 135),
      mkExam(d(18), "genel", { turkce: [25, 3], matematik: [20, 7], tarih: [18, 6], cografya: [12, 4], vatandaslik: [10, 4] }, { tarih: [{ topic: "20. Yüzyılda Osmanlı Devleti", wrong: 4, blank: 1 }] }, "Benim Hocam TG-1", 125),
      mkExam(d(11), "genel", { turkce: [24, 4], matematik: [19, 8], tarih: [16, 8], cografya: [13, 3], vatandaslik: [12, 2] }, { tarih: [{ topic: "Osmanlı Devleti Siyasi Tarihi", wrong: 4, blank: 2 }, { topic: "Atatürk Dönemi İç ve Dış Politika", wrong: 3, blank: 1 }] }, "İsem TG-1", 122),
      mkExam(d(8), "genel", { turkce: [26, 3], matematik: [21, 6], tarih: [19, 5], cografya: [14, 3], vatandaslik: [12, 2] }, {}, "Ankara Yayıncılık TG-1", 118),
      mkExam(d(5), "genel", { turkce: [25, 4], matematik: [22, 6], tarih: [18, 6], cografya: [13, 4], vatandaslik: [11, 3] }, { matematik: [{ topic: "Geometri", wrong: 4, blank: 1 }] }, "3D Yayınları TG-2", 120),
      mkExam(d(2), "genel", { turkce: [27, 2], matematik: [23, 5], tarih: [20, 5], cografya: [14, 3], vatandaslik: [12, 2] }, {}, "Yediiklim TG-3", 115),
      { id: "e9", type: "brans", date: d(10), subject: "turkce", total: 40, correct: 31, wrong: 7, blank: 2, weakTopics: [{ topic: "Anlatım Bozuklukları", wrong: 4, blank: 1 }], name: "Türkçe Branş Denemesi", durationMin: 50 },
      { id: "e10", type: "brans", date: d(3), subject: "matematik", total: 40, correct: 24, wrong: 12, blank: 4, weakTopics: [{ topic: "Geometri", wrong: 6, blank: 2 }, { topic: "Problemler", wrong: 4, blank: 1 }], name: "Matematik Branş Denemesi", durationMin: 65 },
    ],
    topicStatus: {
      turkce: { "Sözcükte Anlam": "done", "Cümlede Anlam": "done", "Paragrafta Anlam": "active" },
      matematik: { "Temel Kavramlar ve Sayılar": "done", "Rasyonel ve Ondalık Sayılar": "done", "Problemler": "active" },
      tarih: { "İslamiyet Öncesi Türk Tarihi": "done", "İlk Türk - İslam Devletleri": "done", "Osmanlı Devleti Siyasi Tarihi": "active" },
      cografya: { "Türkiye'nin Coğrafi Konumu": "done", "Türkiye'nin Fiziki Coğrafyası": "active" },
    },
    playlists: [],
    goals: defaultGoals(),
  };
}

function mkExam(date, type, scores, weakBySubject, name, durationMin) {
  const subjects = {};
  for (const k of Object.keys(scores)) {
    const [c, w] = scores[k];
    subjects[k] = { correct: c, wrong: w, weakTopics: weakBySubject[k] || [] };
  }
  return { id: "e_" + Math.random().toString(36).slice(2, 9), type, date, subjects, name: name || "Genel Deneme", durationMin: durationMin || null };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw);
    const migrated = migrateState(parsed);
    // Silent migration: write back if shape changed (so legacy string entries become objects)
    try { localStorage.setItem(KEY, JSON.stringify(migrated)); } catch (_) {}
    return migrated;
  } catch (e) {
    return { questions: [], exams: [] };
  }
}

const listeners = new Set();
let state = load();

function save() {
  // Yeni bir top-level reference üret — React'in useState bailout'u (Object.is aynı ref ise re-render etmez)
  // Konular sayfasındaki tıklamalar gibi başka state değişikliğinin tetiklenmediği akışlarda da
  // tüm aboneler yeniden render olabilsin diye gerekli.
  state = { ...state };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}

const kpssStore = {
  get: () => state,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  addQuestion(q) {
    state.questions = [...state.questions, { ...q, id: "q_" + Date.now() }];
    save();
  },
  deleteQuestion(id) {
    state.questions = state.questions.filter((q) => q.id !== id);
    save();
  },
  updateQuestion(id, patch) {
    state.questions = state.questions.map((q) => (q.id === id ? { ...q, ...patch } : q));
    save();
  },
  addExam(e) {
    state.exams = [...state.exams, { ...e, id: "e_" + Date.now() }];
    save();
  },
  deleteExam(id) {
    state.exams = state.exams.filter((e) => e.id !== id);
    save();
  },
  updateExam(id, patch) {
    state.exams = state.exams.map((e) => (e.id === id ? { ...e, ...patch } : e));
    save();
  },
  setTopicStatus(subject, topic, status) {
    const cur = { ...(state.topicStatus[subject] || {}) };
    if (status === "active" || status === "done") {
      cur[topic] = status;
    } else {
      delete cur[topic];
    }
    const next = { ...state.topicStatus };
    if (Object.keys(cur).length === 0) delete next[subject];
    else next[subject] = cur;
    state.topicStatus = next;
    save();
  },
  addPlaylist(p) {
    const playlist = {
      ...p,
      id: "pl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      importedAt: new Date().toISOString(),
      selected: p.selected === undefined ? true : !!p.selected,
    };
    state.playlists = [...state.playlists, playlist];
    save();
  },
  setPlaylistSelected(id, selected) {
    state.playlists = state.playlists.map((p) => (p.id === id ? { ...p, selected: !!selected } : p));
    save();
  },
  deletePlaylist(id) {
    state.playlists = state.playlists.filter((p) => p.id !== id);
    save();
  },
  renamePlaylist(id, name) {
    state.playlists = state.playlists.map((p) => (p.id === id ? { ...p, name } : p));
    save();
  },
  togglePlaylistVideo(id, idx) {
    state.playlists = state.playlists.map((p) => {
      if (p.id !== id) return p;
      const videos = p.videos.map((v, i) => (i === idx ? { ...v, watched: !v.watched } : v));
      return { ...p, videos };
    });
    save();
  },
  setPlaylistAllWatched(id, watched) {
    state.playlists = state.playlists.map((p) => {
      if (p.id !== id) return p;
      return { ...p, videos: p.videos.map((v) => ({ ...v, watched: !!watched })) };
    });
    save();
  },
  setGoals(patch) {
    const cur = state.goals || defaultGoals();
    const next = { ...cur, ...patch };
    // perSubject patch geldiyse merge, gelmediyse mevcut korunsun
    if (patch && patch.perSubject !== undefined) {
      next.perSubject = { ...(cur.perSubject || {}), ...patch.perSubject };
    } else {
      next.perSubject = cur.perSubject || {};
    }
    if (patch && patch.perSubjectDuration !== undefined) {
      next.perSubjectDuration = { ...(cur.perSubjectDuration || {}), ...patch.perSubjectDuration };
    } else {
      next.perSubjectDuration = cur.perSubjectDuration || {};
    }
    state.goals = normalizeGoals(next);
    save();
  },
  reset() {
    state = seed();
    save();
  },
  clear() {
    state = { questions: [], exams: [], topicStatus: {}, playlists: [], goals: defaultGoals() };
    save();
  },
  exportJSON() {
    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      questions: state.questions,
      exams: state.exams,
      topicStatus: state.topicStatus,
      playlists: state.playlists,
      goals: state.goals || defaultGoals(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const now = new Date();
    // YYYY-MM-DD formatı için (Örn: 2026-05-06)
    const date = now.toLocaleDateString('sv-SE');
    // HH-mm formatı için (Örn: 14-37)
    const time = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(':', '-');
    const ts = `${date}_${time}`;
    a.download = `kpss-takip-yedek-${ts}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !Array.isArray(data.questions) || !Array.isArray(data.exams)) {
            throw new Error("Geçersiz yedek dosyası.");
          }
          state = migrateState({
            questions: data.questions,
            exams: data.exams,
            topicStatus: data.topicStatus || {},
            playlists: data.playlists || [],
            goals: data.goals || undefined,
          });
          save();
          const topicCount = Object.values(state.topicStatus).reduce((s, m) => s + Object.keys(m).length, 0);
          resolve({
            questions: state.questions.length,
            exams: state.exams.length,
            topics: topicCount,
            playlists: state.playlists.length,
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error("Dosya okunamadı."));
      reader.readAsText(file);
    });
  },
  importData(data) {
    if (!data || !Array.isArray(data.questions) || !Array.isArray(data.exams)) {
      throw new Error("Geçersiz yedek dosyası.");
    }
    state = migrateState({
      questions: data.questions,
      exams: data.exams,
      topicStatus: data.topicStatus || {},
      playlists: data.playlists || [],
      goals: data.goals || undefined,
    });
    save();
    const topicCount = Object.values(state.topicStatus).reduce((s, m) => s + Object.keys(m).length, 0);
    return {
      questions: state.questions.length,
      exams: state.exams.length,
      topics: topicCount,
      playlists: state.playlists.length,
    };
  },
};

// DevTools/console kolaylığı için: kpssStore.reset() / clear() çağırılabilsin.
if (typeof window !== "undefined") {
  window.kpssStore = kpssStore;
}

export default kpssStore;
