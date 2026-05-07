import { useState, useEffect } from "react";

// usePersistentState — sayfa içi UI durumunu localStorage'a saklar.
// Site genelinde kural: kullanıcı bir sayfada filtre/seçim yaptıysa, başka sayfaya
// gidip geri döndüğünde aynı yerden devam etsin (örn. Konular sayfasında seçili ders).
// Anahtarlar `kpss-ui-state-` öneki ile namespace'lenir; veri JSON serileştirilir.
export function usePersistentState(key, initial) {
  const fullKey = "kpss-ui-state-" + key;
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null || raw === undefined) return typeof initial === "function" ? initial() : initial;
      return JSON.parse(raw);
    } catch (_) {
      return typeof initial === "function" ? initial() : initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(fullKey, JSON.stringify(value)); } catch (_) {}
  }, [fullKey, value]);
  return [value, setValue];
}
