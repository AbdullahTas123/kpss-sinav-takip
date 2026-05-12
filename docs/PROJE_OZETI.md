# 📚 KPSS Sınav Takip — Proje Özeti

## 🎯 Proje Bilgileri

| | |
|---|---|
| **Proje Adı** | KPSS Sınav Takip |
| **Hedef Kitle** | KPSS Lisans (GY-GK) öğrencileri |
| **Sınav Tarihi (örnek)** | 13 Eylül 2026 |
| **Tip** | Tek-kullanıcılı, lokal, hesapsız PWA tarzı uygulama |

## 🪄 Amacı

KPSS'ye hazırlanan öğrenciler için **karmaşıklıktan tamamen arındırılmış, tek bir tarayıcıda çalışan** bir performans takip uygulaması. Öğrenci:

1. Günlük çözdüğü konu/karma testleri kaydeder.
2. Genel ve branş denemelerini girer.
3. Performans grafiklerinden ilerlemesini takip eder.
4. **Eksik konularını otomatik olarak tespit edip** çalışmaya odaklanacağı yerleri görür.

**Felsefe:** Hesap yok, internet yok, backend yok. Tüm veri tarayıcıda — istediği zaman JSON olarak yedekleyip yükleyebilir.

---

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| **Framework** | React 18.3.1 (UMD + Babel Standalone, build-step yok) |
| **Stilleme** | Inline JS-style (CSS-in-JS pattern), Inter font (Google Fonts) |
| **Veri Depolama** | `localStorage` (key: `kpss-takip-store-v1`) |
| **State Management** | Custom mini-store (publish/subscribe pattern, Zustand benzeri API) |
| **Grafikler** | Custom SVG (3rd-party kütüphane yok — daha hafif, daha kontrollü) |
| **İkonlar** | Custom inline SVG ikon seti (Lucide-stili stroke ikonlar) |
| **Routing** | URL hash-based (`#dashboard`, `#questions`, `#exams`) |

> **Not:** Brief'te Vite + Tailwind + Recharts + Zustand önerilmişti; tek HTML dosyasında çalışacak prototip için **eşdeğer pattern** (CSS-in-JS, custom store, custom SVG chart) tercih edildi. Mantık birebir aynı.

---

## 📁 Klasör Yapısı

```
/
├── KPSS Sınav Takip.html      # Ana HTML — script tag'leri ve fontlar
├── subjects.js                # KPSS dersleri ve konu listesi (constants)
├── store.js                   # Mini-store (localStorage persist + export/import)
├── ui.jsx                     # Ortak UI primitives (Card, Button, Input, Chip…)
├── shell.jsx                  # Sidebar + Topbar + geri sayım + responsive
├── dashboard.jsx              # Ana Sayfa — istatistikler, çizgi grafik, zayıf konular
├── questions.jsx              # Soru Çözümü sayfası
├── exam-chart.jsx             # Deneme grafiği (filtreler, ders toggle, tooltip)
├── exams.jsx                  # Deneme Sınavları sayfası + modal form
├── app.jsx                    # Root, hash router, mobile drawer state
└── tweaks-panel.jsx           # (kullanılmıyor — placeholder)
```

---

## 🎨 Tasarım Sistemi

### Renk Paleti (Dark Mode — Notion-stili)

| Token | Renk | Kullanım |
|---|---|---|
| `--bg` | `#0a0a0c` | Sayfa arka planı |
| `--surface` | `#111114` | Kart yüzeyleri |
| `--surface-2` | `#0c0c0e` | İkincil yüzey, input bg |
| `--border` | `#1f1f23` | Standart kart kenarı |
| `--border-soft` | `#18181c` | Hafif ayırıcı çizgi |
| `--text` | `#fafafa` | Birincil metin |
| `--text-muted` | `#a1a1aa` | İkincil metin |
| `--text-subtle` | `#71717a` | Yardımcı metin |
| `--text-faint` | `#52525b` | Etiketler, placeholder |

### Vurgu (Accent) Renkleri

| Renk | Hex | Kullanım |
|---|---|---|
| **Yeşil (primary)** | `#10b981` | Logo, başarı, ana CTA, doğru |
| **Cyan** | `#06b6d4` | Logo gradient, branş denemesi |
| **Amber** | `#f59e0b` | Uyarı, eksik konular, matematik |
| **Kırmızı** | `#ef4444` | Hata, validation, tarih dersi |
| **Mor** | `#a78bfa` | Dashboard mor kart, vatandaşlık |
| **Mavi** | `#60a5fa` | Türkçe dersi |

### Ders Renkleri

| Ders | Renk | Sabit Soru |
|---|---|---|
| Türkçe | `#60a5fa` (mavi) | 30 |
| Matematik | `#f59e0b` (amber) | 30 |
| Tarih | `#ef4444` (kırmızı) | 27 |
| Coğrafya | `#10b981` (yeşil) | 18 |
| Vatandaşlık | `#a78bfa` (mor) | 15 |
| **Toplam** | | **120** |

### Tipografi

- **Font:** Inter (400, 500, 600, 700) — `font-feature-settings: "cv11", "ss01", "ss03"`
- **Hiyerarşi:** 24px (sayfa başlığı), 14px (kart başlığı), 13–14px (gövde), 11–12px (etiket), 9–10px (uppercase tag)
- **Sayılar:** `font-variant-numeric: tabular-nums` — sıralı listelerde hizalı sayılar.

### Genel Tasarım Dili

- **Notion-tarzı:** Yumuşak gölgeler, ince kenarlıklar (1px), 8–12px köşe yarıçapları.
- **Subtle gradient'ler:** Yalnızca logo, ana CTA buton ve geri sayım rozetinde (yeşil→cyan).
- **Radial glow:** Stat kartlarının köşesinde dekoratif radial gradient.
- **Bilişsel yük düşük:** Boş alan bolca, yalnızca gerekli bilgi gösteriliyor.
- **Tüm kart yapısı:** `bg #111114 + border 1px #1f1f23 + radius 12px`.

---

## 📱 Sayfalar

### 1. Ana Sayfa (Dashboard) — `#dashboard`

**Amaç:** Genel performansa bir bakışta görmek.

- **3 Stat Kartı:** Toplam Çözülen Soru · Toplam Çözülen Deneme · Genel Ortalama Net
- **Son 10 Deneme — Toplam Net Trendi:** SVG çizgi grafik (gradient alan + nokta marker)
  - Sağ üstte son 2 deneme arası ▲/▼ delta rozeti (yeşil/kırmızı)
- **En Çok Hata Yapılan 5 Konu:** Renkli ders barlarıyla, tekrar sayısıyla
  - Hem konu testi `wrong > 0` durumlarından hem de seçilen "zayıf konu" rozetlerinden besleniyor

### 2. Soru Çözümü — `#questions`

**Amaç:** Günlük test çözümlerini kaydetmek.

- **2 Sekme:** Konu Testi · Karma/Branş Testi
- **Form Alanları:** Ders → (Konu Testi'nde) Konu → Toplam · Doğru · Yanlış
- **Otomatik:** `Boş = Toplam − (Doğru + Yanlış)` — kullanıcı giremez, gri tire kutuda görünür
- **Anlık Net:** `Net = Doğru − (Yanlış / 4)` — alt strip'te canlı gösterim
- **Validation:**
  - `Doğru + Yanlış > Toplam` → kırmızı kenarlık + hata kutusu + kaydet engellenir
  - Negatif değer engelli
  - Konu Testi için ders **ve** konu zorunlu
- **Zayıf Konu Yakalama:** Karma sekmesinde yanlış/boş > 0 ise dersin tüm konuları rozet olarak açılır, kullanıcı seçer
- **Sağ panel:** Son 6 kayıt — silme aksiyonu

### 3. Deneme Sınavları — `#exams` ⭐ (en gelişmiş sayfa)

**Amaç:** Genel ve branş denemelerini girmek + analiz etmek.

- **Üst Köşe:** "+ Deneme Ekle" butonu → modal açar
- **3 Mini-stat:** Genel Deneme Sayısı · Branş Sayısı · Ortalama Net
- **Gelişmiş Performans Grafiği:**
  - **Zaman Aralığı Filtresi:** 7 Gün · 1 Ay · 3 Ay · Son 10
  - **3 Mod:** Toplam Net · Ders Bazında · Süre (dk)
  - **Ders Bazında:** Her ders için aç/kapa rozeti + "Tümünü Aç / Kapa"
  - **Hover/Dokunma:** Tooltip'te o denemenin adı, tarihi, her dersin neti, toplam net, süresi
  - **Touch destekli** (mobil grafik etkileşimi)
- **Tam Veri Tablosu:**
  - Sütunlar: Tarih · Deneme Adı (+ Genel/Branş etiket + eksik konu sayısı) · Türkçe · Mat. · Tarih · Coğ. · Vat. · Toplam Net · Süre · Aksiyon
  - Filtre: Tümü · Genel · Branş
  - Düzenle (modal'ı dolu açar) ve Sil butonları
  - **Mobilde:** otomatik olarak kart görünümüne dönüşür

#### Modal Form (Yeni / Düzenle)

- **Üst Alan:** Deneme Adı (ops.) · Tarih · Süre (dk)
- **2 Sekme:**
  - **Genel · 120 Soru:** 5 ders sabit; her ders için Doğru/Yanlış/Boş/Net satırı + ders bazında zayıf konu rozetleri açılır
  - **Branş Denemesi:** Ders + Toplam + Doğru/Yanlış/Boş/Net + zayıf konu rozetleri
- **Anlık Toplam Kart:** Yeşil glow ile 120 üzerinden net + Doğru/Yanlış/Boş özet
- **Validation (Genel):** Türkçe ≤ 30, Matematik ≤ 30, Tarih ≤ 27, Coğrafya ≤ 18, Vatandaşlık ≤ 15
- **Validation (Branş):** `Doğru + Yanlış ≤ Toplam`
- **ESC ile kapanır, scroll lock, sticky header/footer**

---

## 🧩 Core Features

### ✅ Veri Mantığı (Matematiksel Kurallar)

| Kural | Uygulama Yeri |
|---|---|
| `Boş = Toplam − (Doğru + Yanlış)` | Tüm formlar |
| `Net = Doğru − (Yanlış / 4)` | Tüm formlar, grafikler, tablo |
| Doğru+Yanlış ≤ Toplam | Soru Çözümü, Branş Deneme |
| Ders sabit soru tavanı | Genel Deneme (her ders için ayrı) |
| Negatif sayı engeli | Tüm input'lar |

### ✅ Zayıf Konu Tespiti (UX Harikası)

3 farklı kanaldan beslenir → Dashboard'da agregasyon:

1. **Konu Testi'nde** `wrong > 0` → o konu otomatik zayıf sayılır.
2. **Karma/Branş Test'te** kullanıcı yanlış yapınca dersin konu rozetleri açılır, seçer.
3. **Genel Deneme'de** her ders için ayrı zayıf konu rozeti seçimi.

### ✅ Veri Yedekleme (Export / Import)

Sidebar'ın altında 2 buton:
- **Dışa Aktar:** `kpss-takip-yedek-YYYY-MM-DD.json` indirir
- **İçe Aktar:** JSON dosyası yükler (onay diyaloğuyla mevcut verileri değiştirir)

### ✅ Canlı Geri Sayım

Topbar'da **Sınava Kalan: XX Gün : YY Saat : ZZ Dk : SS Sn** — her saniye günceller. Mobilde saniye gizlenir.

### ✅ Responsive (Mobil + Tablet + Desktop)

- **< 760px:** Sidebar gizli (hamburger menü), sayfa grid'leri stack
- **< 1024px:** Topbar başvuru tarihi rozeti gizli
- **Tüm sayfalar:** mobilde tek kolon, tablo → kart dönüşümü
- **Modal:** mobilde alttan açılan bottom-sheet, masaüstünde merkez

### ✅ Routing

URL hash ile sayfalar arası geçiş — geri/ileri tuşları çalışır, yer imi alınabilir.

---

## 🏗️ Store API (Pseudo-Zustand)

```js
window.kpssStore = {
  get(),              // state'i döndür
  subscribe(fn),      // state değişimlerine abone ol
  addQuestion(q),     // yeni soru kaydı
  deleteQuestion(id),
  addExam(e),         // yeni deneme
  updateExam(id, p),  // mevcut denemeyi güncelle (modal düzenleme)
  deleteExam(id),
  reset(),            // örnek seed verisine dön
  clear(),            // her şeyi sil
  exportJSON(),       // dosya indir
  importJSON(file),   // dosyadan yükle
}
```

State şekli:
```js
{
  questions: [{ id, date, type: "konu" | "karma", subject, topic, total, correct, wrong, blank, weakTopics: [] }],
  exams: [
    // Genel
    { id, type: "genel", date, name, durationMin, subjects: { turkce: { correct, wrong, weakTopics }, ... } },
    // Branş
    { id, type: "brans", date, name, durationMin, subject, total, correct, wrong, blank, weakTopics: [] }
  ]
}
```

---

## 🔍 Önemli Detaylar

- **Seed Verisi:** Uygulama ilk açıldığında 6 soru kaydı + 8 genel deneme + 2 branş denemesi örnek veriyle başlar — boş ekran yerine grafikler dolu görünür. (`kpssStore.reset()` ile sıfırlanabilir)
- **Renk Tutarlılığı:** Her ders kendi rengini her yerde taşır — grafik, badge, tablo, modal. Görsel hafıza güçlenir.
- **Erişilebilirlik:** `:focus-visible` outline yeşil; tüm butonlar gerçek `<button>`, semantik `<table>`, ESC modal kapatır.
- **Performans:** Tek `<deneme>` çizimi için bile React re-render minimal; SVG yerel, `ResizeObserver` ile chart genişliği canlı.
- **Localized:** Tüm metinler Türkçe — tarih formatı `tr-TR`.

---

## 📅 Geliştirme Günlüğü

### 2026-05-07 (ek 6) — Vite + React yapısına yapı taşıması

Eski "tek HTML + Babel Standalone in-browser compile" yaklaşımı, Vite tabanlı klasik React projesine taşındı. Mantık değişmedi — sadece yapı modernize edildi (bkz. `old_files/yapilacaklar.txt`).

**Yapılan değişiklikler:**
- `npm create vite@latest .` (React + JavaScript) ile Vite + React 19 ortamı kuruldu, eski dosyaların hepsi `old_files/` altına taşındı (güvende kalsınlar diye).
- Klasör yapısı: `src/{components,pages,store,utils,hooks}` — `yapilacaklar.txt`'de önerilen şema.
- **`window.KPSS_*` global namespace pattern kaldırıldı.** Tüm dosyalar ES module `import`/`export` kullanıyor:
  - `subjects.js` → `src/utils/subjects.js` (`KPSS_SUBJECTS`, `KPSS_EXAM_DATE`, `KPSS_APPLY_DATE_*`)
  - `store.js` → `src/store/store.js` (default export `kpssStore`; window'a yine eklenir ki devtools console'dan `kpssStore.reset()` çağrılabilsin)
  - `ui.jsx` → `src/components/ui.jsx` (`Card`, `Button`, `Input`, `Select`, `Label`, `Chip`, `Tabs`, `Icon`, `ConfirmModal`, tarih helper'ları)
  - `shell.jsx` → `src/components/shell.jsx` + `src/hooks/useViewport.js`
  - `exam-chart.jsx` → `src/components/ExamChart.jsx`
  - `dashboard/questions/exams/topics/pomodoro.jsx` → `src/pages/Dashboard.jsx` vb.
  - `usePersistentState` → `src/hooks/usePersistentState.js`
  - `app.jsx` → `src/App.jsx`
- Hook alias workaround'ları (`useStateApp`, `useStateShell`, `useMemoDash`, vb.) kaldırıldı — her dosyanın kendi modül scope'u olduğu için artık `useState`/`useEffect` direkt import edilebiliyor.
- `KPSS Sınav Takip.html` (33 script tag'iyle) → `index.html` (sadece `<script type="module" src="/src/main.jsx">`); Inter fontu ve global stiller `src/index.css`'e taşındı.
- Vite default `App.css`/`assets/` dosyaları temizlendi.
- `weak-topics.jsx` kasıtlı olarak taşınmadı (önceki turda kaldırılmıştı).

**Sonuç:**
- `npm run build`: 28 modül, 348 kB (gzip 96 kB), 93ms — başarılı.
- `npm run dev`: 142ms'de hazır, `http://localhost:5173`.
- Hızlı dev experience (hot module reload), Vercel deploy için optimize bundle, ileride routing/state library/test entegrasyonu kolay.
- Tüm kullanıcı verisi `localStorage` anahtarı `kpss-takip-store-v1`'de korundu — eski sürümden migrasyona ihtiyaç yok.

### 2026-05-05 — Soru Çözümü yeniden tasarımı + Pomodoro + Responsive Dashboard

**1) Soru Çözümü sayfası, Deneme Sınavları paterniyle yeniden organize edildi:**
- Sağ üstte **+ Soru Çözümü Ekle** butonu → modal açar (eski sol-form yerine)
- 4 mini-stat: Toplam Çözülen Soru · Konu Testi · Karma/Branş · Ortalama Net
- Üstte chart kartı: **Son 14 Gün — Günlük Çözülen Soru** (SVG bar chart, hover tooltip'te o günün çözülen soru sayısı + toplam neti, ResizeObserver ile responsive)
- Altta **tüm kayıtlar tablosu** (Tarih · Tip · Ders · Konu · Toplam/D/Y/B · Net · Sil) + filtre sekmeleri (Tümü / Konu Testi / Karma-Branş)
- Mobilde tablo otomatik kart görünümüne dönüşür
- Modal: Konu/Karma sekmeleri, otomatik Boş, anlık Net, validasyon, karma sekmesinde zayıf konu rozetleri; ESC ile kapanır, scroll lock, mobilde alttan açılan bottom-sheet

**2) Ana Sayfa (Dashboard) responsive yapıldı (mobile + tablet):**
- 3 stat kartı mobilde tek kolona stack
- Alt grid (chart + zayıf konular) tablet ve mobilde tek kolona stack (önceden `1.5fr 1fr` sabitti)
- StatCard içindeki büyük sayı `30 → 24px` mobilde, padding `20/22 → 14/16`
- Sayfa başlığı `24 → 20px` mobilde
- Trend rozeti `flex-wrap` ile küçük ekranda taşma engellendi

**3) Pomodoro sayfası eklendi (`#pomodoro`):**
- 3 mod sekmesi: **Pomodoro 25 dk** · **Kısa Mola 5 dk** · **Uzun Mola 15 dk**
- Büyük SVG **progress ring** (yeşil→cyan gradient) + ortada dijital saat (MM:SS, tabular-nums)
- Kontroller: Başlat / Duraklat · Sıfırla · (çalışırken) Atla
- Tamamlanan pomodoro sayacı; her 4 pomodorodan sonra otomatik **uzun mola** önerir
- Bitince çift-tonlu beep (Web Audio oscillator)
- `document.title` çalışırken kalan süreyi gösterir → arka plan sekmesinden de görünür
- **Arka Plan Sesi paneli (4 kanal):** Sessiz · Yağmur (white noise) · Yumuşak Yağmur (pink noise) · Derin Uğultu (brown noise) — tamamı Web Audio API ile gerçek zamanlı üretilen + lowpass filtreli gürültü; volume slider
- **Hiç mp3/dış kaynak gerekmez** — telifsiz, internetsiz çalışır, projenin "lokal-only" felsefesine uygun
- Tamamen mobile + tablet uyumlu (mod sekmeleri/ses kanalları küçük ekranda 2'li grid'e geçer, ring boyutu küçülür)

**4) `CLAUDE.md` eklendi:**
Claude Code için repo rehberi — build adımı yok, global namespace pattern (`window.KPSS_*`), script yükleme sırası, store API, domain kuralları (Net = D − Y/4, Boş = T − D − Y, ders sabit soru tavanları), tasarım sistemi.

**5) `ui.jsx` Icon set'ine 6 yeni ikon eklendi:**
`play`, `pause`, `refresh`, `skip`, `music`, `volume`.

**6) Güncel script yükleme sırası (`KPSS Sınav Takip.html`):**
```
subjects.js → store.js → ui.jsx → shell.jsx → dashboard.jsx →
questions.jsx → exam-chart.jsx → exams.jsx → pomodoro.jsx → app.jsx
```

**7) Kalıcı kural:** Bundan sonra eklenecek **her yeni sayfa/modal/bileşen mobile + tablet uyumlu** yazılır. Pattern: `const { isMobile, isTablet } = window.useViewport()` → padding, grid, font-size, tablo→kart dönüşümü koşullu.

### 2026-05-05 (ek) — Dashboard "En Çok Hata Yapılan 5 Konu" ders filtresi

- Kart başlığının altına **Chip satırı** eklendi: **Genel** (varsayılan) + her ders (Türkçe, Matematik, Tarih, Coğrafya, Vatandaşlık).
- Aktif chip kendi ders rengini alır (Genel = yeşil); diğerleri pasif.
- `weakFilter` state'i `dashboard.jsx`'te tutuluyor; `weakTopics` useMemo `state` + `weakFilter` bağımlılığıyla yeniden hesaplanır.
- Filtre seçildiğinde tüm kanallar (konu testi `wrong>0`, karma rozetleri, genel deneme zayıf konuları, branş deneme zayıf konuları) **yalnızca o derse** ait kayıtlardan sayılır.
- Boş durum metni filtreye göre: "Henüz zayıf konu kaydedilmedi" (Genel) / "{Ders} için zayıf konu yok".
- Açıklama metni de Genel/Ders durumuna göre değişir.
- Chip satırı `flexWrap: wrap` — mobilde rahat alt satıra geçer.

### 2026-05-06 — Zayıf Konu hesabı: Penalty Score + Time Decay + kaynak ayrımı

**Sorun:** Eski hesap lifetime mutlak yanlış sayısı + rozet sayımı yapıyordu → (a) "Paragrafta Anlam" gibi yüksek-soru-sayılı konular volume bias ile hep tepede, (b) ilerleme görünmez (10 → 3'e düşse bile lifetime'da donuyordu), (c) rozetler kaba (5 yanlışla 1 yanlış aynı kefede).

**1) Şema değişikliği — `weakTopics`**
- Eski: `weakTopics: string[]`
- Yeni: `weakTopics: { topic: string, wrong: number, blank: number }[]`
- `store.js`'e `normalizeWeakArr` helper eklendi (`window.kpssNormalizeWeak`); legacy string entry'ler `{topic, wrong:1, blank:0}` formuna çevrilir.
- `load()` her okumada `migrateState` ile state'i normalize edip localStorage'a sessizce yazar — geriye dönük tüm kayıtlar otomatik göç eder.
- `importJSON` aynı path'i çağırır → eski yedek dosyalarından veri kaybı yok.
- Seed verisi yeni şemaya geçirildi; tarihler 0–40 gün aralığına yayıldı (decay etkisi seed'de görünür olsun diye).

**2) UI — Y/B inputlar (`questions.jsx`, `exams.jsx`)**
- Karma sekme (questions) + Genel sekme (exams, ders altı) + Branş sekme (exams) chip listelerinin **altında**, seçilen her konu için tek satır:
  ```
  Konu Adı     Y: [___]   B: [___]
  ```
- Chip aktive olunca default `{wrong:1, blank:0}`; kullanıcı kutucuklara gerçek değerleri girer.
- `exams.jsx` içinde ortak `renderWeakInputs(items, onWrong, onBlank)` helper ile tek pattern, hem genel hem branş aynı görünür.
- Mobilde `flexWrap` ile alt satıra rahat taşıyor.

**3) Dashboard hesabı — `dashboard.jsx`**
- **Penalty Score:** `score = wrong × 1.0 + blank × 0.5` (Yanlış = unutmak değil bilmemek; daha ağır cezalı).
- **Time Decay:** `0–14 gün ×1.0`, `15–30 gün ×0.7`, `30+ gün ×0.3`. Eski hatalar zamanla zayıflar → "10→3 yanlışa düştüm" senaryosunda eski yanlışlar penceresel olarak ufalır, kullanıcı listede aşağı iner.
- **Kaynak ayrımı (yeni Tabs satırı):** `Denemelerden` (varsayılan, sınav simülasyonu — birinci sınıf veri) · `Soru Çözümünden` (antrenman) · `Tümü`. KPSS hazır bulunuşluğu için deneme verisi öncelikli; toggle ile diğerleri açılır.
- Mevcut Genel/ders Chip filtresi korundu; iki filtre kombine çalışır (örn. "Denemelerden + Matematik").
- Konu testi (`type=konu`) için kayıt seviyesindeki gerçek `wrong`/`blank` doğrudan formüle girer; karma/genel/branş için entry başına `WeakItem.wrong/blank`.
- Liste satırı: artık "X kez" yerine **`X.X puan`** (1 ondalık).
- Boş durum metni `{kaynak} + {ders}` kombinasyonuna göre dinamik (örn. "Denemelerde Matematik için zayıf konu yok").

**4) Geriye dönük uyumluluk**
- Tüm `weakTopics?.length` kullanan yerler ([exams.jsx:176](exams.jsx) tablo, [exams.jsx:238](exams.jsx) mobil kart, [questions.jsx:297](questions.jsx) tablo, [questions.jsx:385](questions.jsx) kart) yeni şemada da çalışır — `.length` aynı.
- Eski JSON yedeklerinden import: string entry'ler otomatik `{wrong:1, blank:0}` olarak göçer, hata vermez.

**5) Etkilenen dosyalar:**
[store.js](store.js) · [questions.jsx](questions.jsx) · [exams.jsx](exams.jsx) · [dashboard.jsx](dashboard.jsx)

### 2026-05-06 (ek 2) — Branş denemeleri: sabit soru sayısı + Genel/Branş grafik toggle

**Sorun:** Branş denemesi eklerken kullanıcı Toplam Soru'yu manuel giriyordu. Oysa piyasada satılan branş denemeleri KPSS dağılımına uyar — Türkçe 30, Matematik 30, Tarih 27, Coğrafya 18, Vatandaşlık 15. Ayrıca branş denemeleri için ayrı bir performans grafiği yoktu; tüm grafik genel denemelere aitti.

**1) Branş Toplam Soru = ders sabit (`fixedCount`)** — [exams.jsx](exams.jsx) ExamModal
- `bTotal` state'i kaldırıldı. `bTotalN = SUBJ[bSubject].fixedCount` olarak türetildi.
- UI'da "Toplam Soru" inputu yerine read-only kutu: ders seçildiğinde sabit soru sayısı + ders rengiyle ders adı gösterilir, hint olarak "(KPSS sabit)" yazar.
- Ders değişince Boş/Net otomatik yeniden hesaplanır; validation (`Doğru + Yanlış ≤ Toplam`) sabit tavana göre çalışır.

**2) Genel / Branş grafik toggle'ı** — [exams.jsx](exams.jsx) ExamsPage
- Chart card başlığının sağ üstüne `KPSS_UI.Tabs` ile **Genel · Branş** seçici eklendi (`chartKind` state).
- Başlık ve açıklama metni seçime göre dinamik (Branş'ta cyan ikon: `#06b6d4`, "Branş Deneme Performansı").
- Mobilde toggle satır altına geçer (`flexWrap`).

**3) ExamChart `kind` prop'u** — [exam-chart.jsx](exam-chart.jsx)
- Yeni prop: `kind="genel" | "brans"` (default `"genel"`).
- `sourceExams = exams.filter(e => e.type === kind)` — branş'ta sadece branş denemeleri x-eksenine girer.
- Mode butonları: Branş'ta **Toplam Net** seçeneği gizli (anlamsız — her branş tek ders). Default mode `"subjects"`.
- Series builder (Branş + Ders Bazında): her aktif ders için seri; o derse ait olmayan denemelerde `value: null` → segmentli çizgi (gap'lerde kırılır).
- yMax: Branş'ta etkin dersler arasındaki en büyük `fixedCount` (max 30). Genel'de `total` modu 120, `subjects` modu yine fixedCount-bazlı.
- Çizgi/nokta render'ı `null` farkındalığına yükseltildi: `pen` toggle ile `M`/`L` segmentleri yönetilir; null noktalarda nokta da çizilmez.
- Tooltip Branş için ayrı şablon: ders rengi rozeti + Doğru/Yanlış/Boş/Net + Süre. Genel için mevcut "tüm dersler + Toplam Net" şablonu korundu.
- Aralık filtresi (7g · 1ay · 3ay · Son 10) ve süre modu Branş için de aynen çalışır.
- Kind değişince `hoverIdx` sıfırlanır ve uyumsuz mode (`total`) otomatik `subjects`'e döner.

**4) Responsive:** Yeni toggle ve kontroller mevcut `flexWrap: wrap` ile mobile + tablet'te alt satıra rahat taşır; chart genişliği `ResizeObserver` ile dinamik kalır.

**5) Etkilenen dosyalar:**
[exams.jsx](exams.jsx) · [exam-chart.jsx](exam-chart.jsx)

### 2026-05-06 (ek 3) — Branş grafiği: Süre modu da ders bazında

**Sorun:** Branş grafiğinde "Ders Bazında" ayrı bir buton olarak duruyordu — ama branş zaten her zaman ders bazında. Süre moduna geçildiğinde ise bütün branş denemelerinin süreleri tek bir cyan çizgide karışıyordu; ders ders süre takibi yapılamıyordu.

**Değişiklikler** — [exam-chart.jsx](exam-chart.jsx)
- "Ders Bazında" butonu Branş modunda **"Net"** olarak yeniden adlandırıldı (zaten ders bazında olmak zorunda; ad sadeleşti). Genel modunda etiket "Ders Bazında" olarak kalıyor.
- Branş + Süre modu artık **ders bazında çoklu seri**: her aktif ders için ayrı renkte çizgi, o derse ait olmayan denemelerde `value: null` → gap'li segment.
- Ders toggle satırı (chips) Branş modunda Süre seçildiğinde de görünür: koşul `(metric==="net" && mode==="subjects") || (isBrans && metric==="duration")` oldu.
- yMax (Süre): Branş'ta sadece **etkin dersler**'in dakikaları üzerinden hesaplanır — kapatılan dersler ölçeği bozmaz.
- Tooltip Branş + Süre: ders rengi rozeti + ders adı + Süre satırı. Genel + Süre tooltip'i tek "Süre" satırı olarak korundu.
- Area dolgusu Branş'ta tamamen kapalı (gap'li serilerle uyumsuz); sadece Genel + Toplam Net ya da Genel + Süre modlarında dolgu çizilir.

**Etkilenen dosyalar:** [exam-chart.jsx](exam-chart.jsx)

### 2026-05-06 (ek 4) — Kayıt düzenleme + onaylı silme modal'ı + ortadaki ekle butonu

**Sorun:** (a) Soru çözümü kayıtları sadece silinebiliyordu, düzenlenemiyordu — yanlış girilen değer için tek çare silip yeniden eklemekti. (b) Hem soru çözümü hem deneme sayfasında silme onayı tarayıcının yerel `confirm()` kutusu ile yapılıyordu — Notion-stili tasarımla uyuşmuyordu. (c) Kullanıcı kayıt listesinin altındayken yeni kayıt eklemek için sayfanın sağ üstündeki butona ulaşmak için kaydırmak zorundaydı.

**1) Soru çözümü kayıtlarına Düzenleme** — [questions.jsx](questions.jsx) · [store.js](store.js)
- `kpssStore.updateQuestion(id, patch)` eklendi (mevcut `updateExam` ile aynı pattern).
- `QuestionTable` ve `QuestionCardMobile` her satıra **kalem (Düzenle)** ikonu butonu aldı; `onEdit(id)` prop'u tablodan parent'a bubble ediyor.
- `QuestionsPage`: `editingId` state + `editingQuestion = state.questions.find(...)`. Modal `existing` prop'u alıyor.
- `QuestionModal` artık `existing` prop'u alır: tüm `useState` initial value'ları `existing` varsa ondan doldurulur. Başlık dinamik ("Yeni Soru Çözümü Ekle" / "Soru Çözümünü Düzenle"), kaydet butonu da ("Kaydet" / "Güncelle").
- `subject`/`tab` değişimini izleyen `useEffect` (weakTopics ve topic'i sıfırlar) düzenleme açılışında ilk render'da çalışmasın diye `isFirstMount` ref'i ile koruma eklendi — yoksa modal açılır açılmaz mevcut konu/zayıflar siliniyordu.
- Düzenlemede aynı gün kalıyorsa orijinal timestamp korunur, gün değiştiyse yeni ISO üretilir (sıralama tutarlılığı için).

**2) Ortak `ConfirmModal` (ekran ortasında)** — [ui.jsx](ui.jsx)
- Yeni `ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger })` bileşeni eklendi; `KPSS_UI.ConfirmModal` üzerinden expose edildi.
- ESC ile kapanır, scroll lock'lu, backdrop tıklamasıyla iptal. Mobilde de bottom-sheet değil **merkezde** açılır (kullanıcının açık talebi: "ekranın ortasında modal çıksın").
- `danger` flag'i kırmızı dolgu Sil butonu üretir; ikon olarak `trash` gösterir. Standart varyant ise yeşil "Onayla" butonu.
- Hem [questions.jsx](questions.jsx) hem [exams.jsx](exams.jsx) içinde `confirm()` çağrıları kaldırıldı; yerine `pendingDeleteId` state + ConfirmModal pattern'i:
  ```
  requestDelete(id) → setPendingDeleteId(id)
  ConfirmModal onConfirm → store.delete*(id) + setPendingDeleteId(null)
  ```

**3) Kayıt listesinin başında ikinci ekle butonu** — [questions.jsx](questions.jsx) · [exams.jsx](exams.jsx)
- Kayıt Card'ının header satırına (title + filtre Tabs arasına) ikinci bir **+ Ekle** butonu eklendi. Sayfanın sağ üstündeki orijinal buton da duruyor.
- Hem masaüstü hem mobilde header satırı `flexWrap: wrap` ile rahat alt satıra geçer; üç eleman (title-left, button-mid, tabs-right) `space-between` ile dağılır.

**4) Etkilenen dosyalar:**
[store.js](store.js) · [ui.jsx](ui.jsx) · [questions.jsx](questions.jsx) · [exams.jsx](exams.jsx)

### 2026-05-06 (ek 5) — Yeni sayfa: Konular + YouTube Playlist Takibi

**Amaç:** Kullanıcı bir derse çalışırken hem KPSS müfredatındaki konularda nerede olduğunu (başlamadı / aktif / bitti) hem de o ders için takip ettiği YouTube oynatma listelerinde ne kadar ilerlediğini tek bir yerden görsün. Embed yok — videolar siteye gömülü oynatılmaz, kullanıcı YouTube linkine tıklayıp izler ve bitirince tikler.

**Tasarım kararı:** Müfredat konuları ve playlist'ler **aynı sayfada** birleştirildi (ders odaklı tek sayfa) — kullanıcı bir derse çalıştığında hem müfredat ilerlemesini hem hocasının video serisindeki ilerlemesini aynı yerden takip edebilsin.

**1) Sidebar'da yeni "Konular" sekmesi** — [shell.jsx](shell.jsx) · [app.jsx](app.jsx) · [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html)
- `target` ikonuyla Soru Çözümü ↔ Pomodoro arasına yerleştirildi.
- `app.jsx` router'a `#topics` rotası eklendi.
- HTML'de `topics.jsx` script tag'ı `exams.jsx` ile `pomodoro.jsx` arasına eklendi.

**2) Store'da yeni state alanları** — [store.js](store.js)
- `state.topicStatus`: `{ [subject]: { [topic]: "active" | "done" } }` — sadece "active" ve "done" tutulur; "todo" varsayılan ve kayıtta yer almaz (silinir).
- `state.playlists`: `[{ id, subject, name, importedAt, videos: [{ title, videoUrl, videoId, position, publishedAt, watched }] }]`.
- Yeni metotlar: `setTopicStatus(subject, topic, status)`, `addPlaylist(p)`, `deletePlaylist(id)`, `renamePlaylist(id, name)`, `togglePlaylistVideo(id, idx)`, `setPlaylistAllWatched(id, watched)`.
- `migrateState`: yeni `normalizeTopicStatus` (geçersiz değerleri eler) ve `normalizePlaylists` (eksik alanları default'lar) helper'larıyla eski yedeklerden veri kaybı yok; yeni alanlar yoksa boş objeler.
- `exportJSON` versiyon `2` oldu, `topicStatus` ve `playlists` da paketleniyor. `importJSON` da bu alanları kabul eder; geri dönüş objesinde `topics` ve `playlists` sayıları döner.
- Sidebar import mesajı zenginleştirildi: "✓ X soru, Y deneme, Z konu, W liste yüklendi".
- Seed verisine örnek topicStatus eklendi (Türkçe, Matematik, Tarih, Coğrafya'da bir kaç konu için "done" + "active") — ilk açılışta sayfa boş görünmesin, dashboard ilerleme barları dolu olsun. Playlist seed'i yok (her hocaya özel olduğundan).

**3) Konular sayfası** — [topics.jsx](topics.jsx) (yeni dosya)
- **Üst stat şeridi (4 tile):** Toplam Konu · Bitirilen · Aktif · Genel İlerleme (%). Mobilde 2x2 grid.
- **Ders seçici Card:** Her ders için renkli pill chip (ders kendi rengini taşır); aktif ders koyu vurgulu, yanında o dersin ilerleme yüzdesi. `flexWrap` ile mobilde alt satıra rahat geçer.
- **Konular Card:** Seçili dersin müfredat konuları (subjects.js'den çekilir) — her konu tıklanabilir bir satır; tıklayınca durum sıralı geçer: **Başlamadın → Aktif → Bitti → Başlamadın**. Bitti = yeşil dolu daire + check + line-through; Aktif = amber dolu daire + "AKTİF" rozeti; Başlamadı = boş gri daire.
  - Üstte: ders rengiyle progress bar + "X / Y" + "%pct".
  - Legend satırı (Başlamadın · Aktif · Bitti) ve "satıra tıkla" hint'i.
  - Konular grid: masaüstü ve tablette 2 kolon, mobilde 1 kolon.
- **Çalışma Listeleri Card:** O ders için yüklenen YouTube playlist'leri.
  - Sağ üstte **+ CSV Yükle** butonu → modal açar.
  - Bilgi kutusu: `https://sanishtech.com/tools/youtube-playlist-link-extractor/` linkli, "playlist linkini yapıştır → CSV indir → buraya yükle" akış açıklaması. "Embed yok, link ile YouTube'a gidersin" notu.
  - Boş state: `music` ikon + "henüz liste yok" + "+ İlk Listeyi Yükle".
  - Her playlist `PlaylistRow` bileşeni:
    - Header: genişlet/daralt chevron · adı (tıklanınca inline edit input + Enter/blur ile kaydet, Esc iptal) · X/Y video · %pct · ders renginde mini progress bar · sil butonu.
    - Genişletildiğinde: "Hepsini işaretle" / "Hepsini sıfırla" toplu aksiyonlar; sonra her video için satır: özel checkbox (tıklanınca toggle) + başlık (izlendiyse line-through + yumuşak yeşil) + "YouTube ↗" link kutusu (yeni sekme, `noopener noreferrer`).
    - Maks 420px scrollable video alanı (uzun liste UI'ı bozmasın).
- **Modal: CSV Upload** (`CsvUploadModal`):
  - Ders selector (varsayılan: aktif ders), Liste Adı input (CSV dosya adından otomatik öneri), .csv file input.
  - Yükleme anında parse edilir, başarılıysa "✓ N video bulundu" preview kartı; hata varsa kırmızı mesaj.
  - "Kaydet" → `kpssStore.addPlaylist(...)` → modal kapanır.
  - ESC ile kapanır, scroll lock, mobilde alttan açılan bottom-sheet, masaüstünde merkez.
- **CSV Parser** (`parseCsvText`): RFC4180-lite — quoted fields (`""` escape destekli) + CR/LF + tek-satır boş satır filtresi. Sanishtech çıktısı quote'suz olsa da güvende kalmak için quote pattern'i de işliyor. Header'dan `title`, `videoUrl` zorunlu; `videoId`, `position`, `publishedAt` opsiyonel. `position` varsa o sırayla sıralanır; yoksa CSV sırası korunur.
- **Silme onayı:** Mevcut `KPSS_UI.ConfirmModal` ortak bileşeni kullanılıyor — playlist silme onayı da ekran ortasında modal'la sorulur.

**4) Dashboard'a "Çalışma İlerlemesi" kartı** — [dashboard.jsx](dashboard.jsx)
- Mevcut zayıf konular kartının altına yeni full-width Card eklendi.
- Her ders için tek satır, masaüstünde 3 kolon (label · Konular barı · Playlist barı), tablette label+Konular tek satır + Playlist alt satıra `gridColumn: 1/-1` ile yayılır, mobilde tüm bileşenler stack.
- "Konular sayfasına git →" butonu → `window.location.hash = "topics"`.
- `ProgressLine` bileşeni: başlık + done/total + %pct + ders renginde 4px ince bar. Playlist hiç yoksa "yüklü liste yok" muted state.

**5) Responsive uyum:**
- Tüm yeni yerlerde `useViewport` hook'u ile koşullu padding/grid/font-size; mobilde stack, tablette 2 kolon, desktop'ta tam genişlik.
- Modal: bottom-sheet ↔ merkez geçişi mevcut pattern ile uyumlu.
- CSV bilgi kutusunda link `wordBreak: break-all` ile uzun URL alt satıra rahat geçer.

**6) Etkilenen dosyalar:**
[store.js](store.js) · [shell.jsx](shell.jsx) · [app.jsx](app.jsx) · [topics.jsx](topics.jsx) (yeni) · [dashboard.jsx](dashboard.jsx) · [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html)

**7) Güncel script yükleme sırası:**
```
subjects.js → store.js → ui.jsx → shell.jsx → dashboard.jsx →
questions.jsx → exam-chart.jsx → exams.jsx → topics.jsx → pomodoro.jsx → app.jsx
```

**8) Kalıcı kural:** Bundan sonra her görev sonunda PROJE_OZETI.md "Geliştirme Günlüğü"ne tarihli yeni bir alt başlık eklenir (aynı gün ek görev varsa "(ek N)").

### 2026-05-06 (ek 6) — Bugfix: store re-render bailout (Konular sayfası anlık güncellenmiyordu)

**Sorun:** Konular sayfasındaki bir konuya tıklayınca durum (Başlamadın → Aktif → Bitti) anında ekrana yansımıyordu; sayfayı yenilemek veya başka derse geçip geri dönmek gerekiyordu. Veri store'a yazılıyordu (localStorage'da görülebiliyordu), ama komponent re-render olmuyordu.

**Kök neden:** [store.js](store.js) `save()` fonksiyonu, listener'lara state'in **aynı object reference**'ını veriyordu. Mutation pattern'i (`state.questions = [...]`, `state.topicStatus = {...}`) iç field'ı değiştiriyordu ama dış `state` objesinin reference'ı sabit kalıyordu. React'in `useState` setter'ı `Object.is(prev, next)` ile aynı reference'ı görünce **eager bailout** yapıyor — re-render zinciri tetiklenmiyor.

**Neden Soru Çözümü/Deneme'de fark edilmedi?** O sayfalarda kayıt ekleme/silme sonrası modal kapanıyor (`setModalOpen(false)`) → bu ayrı state değişikliği zaten bir re-render tetikliyor → yeni veri (zaten aynı obje üzerinden mutate edildiği için React'in elindeki referansta da görünüyor) ekrana yansıyor. Konular sayfasında konu tıklaması başka hiçbir local state'i değiştirmediği için bailout yüzünden görünür güncelleme olmuyordu.

**Çözüm:** `save()` her notify'dan önce state için yeni bir top-level reference üretir:
```js
function save() {
  state = { ...state };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}
```
Tüm field-level mutation'lar zaten yeni array/obje üretiyor (`[...arr]`, `{...obj}`), dolayısıyla shallow copy yeterli; her abone yeni reference görüp re-render olur.

**Kalıcı kural (mimari):** Store mutation metotları sadece **ilgili field**'ı yeniden üretmek zorunda değil — `save()` her zaman yeni bir top-level state reference yaymalı. Yeni metot yazarken bunu unutsak bile abonelerin re-render'ı garanti.

**Etkilenen dosyalar:** [store.js](store.js)

### 2026-05-06 (ek 7) — Playlist seçimi + sayfa-içi durum kalıcılığı (site-genel kural)

**Sorun:** (a) Bir derse birden fazla oynatma listesi yüklenince, ana sayfadaki *Çalışma İlerlemesi* kartı **bütün listelerin toplamı** üzerinden hesaplıyordu — kullanıcı sadece o anda takip ettiği listeyi (veya 2-3 listeyi) görmek istiyor. (b) Konular sayfasında bir derse tıklayıp başka sayfaya geçince, geri dönünce **ilk dersliğe dönüyordu** — son kalınan yer hatırlanmıyordu. Aynı durum diğer sayfalardaki filtre/seçim state'leri için de geçerliydi.

**1) Oynatma listesi seçimi (selected flag)** — [store.js](store.js) · [topics.jsx](topics.jsx) · [dashboard.jsx](dashboard.jsx)
- Playlist şemasına `selected: boolean` alanı eklendi (varsayılan `true`).
- `normalizePlaylists` migrasyonu: eski yedeklerde alan yoksa otomatik `true` olarak göçer — geriye dönük dashboard hesabı bozulmaz.
- Yeni store metodu: `setPlaylistSelected(id, selected)`. `addPlaylist` da yeni listeyi varsayılan `selected:true` ile ekler.
- `topics.jsx` PlaylistRow header'ına ders renginde **checkbox** eklendi (chevron'un solunda). Tıkla → toggle. Seçili değilse satır soluk (`opacity 0.62`) ve arka plan biraz koyulaşır — görsel feedback.
- Playlist listesinin başına bilgi kutusu: "Ana sayfa ilerlemesine sadece **seçili** listeler katılır. Birden fazla seçersen toplamı alınır." + sağ tarafta `X / Y seçili` sayacı.
- `dashboard.jsx` `ProgressCard`: `state.playlists.filter((p) => p.selected !== false)` — sadece seçili listelerden video toplam/done hesaplanır. Etiket dinamik: 1 seçili → "Playlist", 2+ seçili → `Playlist (N liste)`. Hiç seçili yoksa muted state: `N liste · seçili değil`.

**2) Sayfa-içi UI durumu kalıcılığı** — [ui.jsx](ui.jsx) (yeni helper)
- `window.usePersistentState(key, initial)` hook'u eklendi — `useState` API'si, ama değer `localStorage`'da `kpss-ui-state-<key>` anahtarı altında JSON serialize edilerek saklanır. Mount'ta ilk değer localStorage'dan okunur; her değişiklikte `useEffect` ile yazılır.
- Store'un kendi `kpss-takip-store-v1` anahtarından **tamamen ayrı** namespace — UI state'i yedek dosyalarına girmez, kullanıcının veri export'una dahil edilmez (uygun seçim: bunlar kişisel UI tercihleri, yedeklenmesine gerek yok).

**3) Tüm sayfalarda uygulandı (kural site-geneli):**
- [topics.jsx](topics.jsx): `topics.activeSubj` — son seçili ders. Geçersiz/silinmiş ders kontrolü ile düşülür.
- [dashboard.jsx](dashboard.jsx): `dashboard.weakFilter` (genel/ders chip'i) + `dashboard.weakSource` (Denemelerden/Soru Çözümünden/Tümü).
- [questions.jsx](questions.jsx): `questions.filterType` (Tümü/Konu Testi/Karma-Branş).
- [exams.jsx](exams.jsx): `exams.filterType` (Tümü/Genel/Branş) + `exams.chartKind` (Genel/Branş chart toggle).
- [exam-chart.jsx](exam-chart.jsx): `examchart.range` (7g/1ay/3ay/Son 10) + `examchart.mode` (total/subjects) + `examchart.metric` (net/duration). Mevcut "kind değişince incompatible mode'u düzelt" useEffect'i korundu.
- [pomodoro.jsx](pomodoro.jsx): `pomodoro.mode` (pomodoro/short/long). `timeLeft` initializer'ı da artık restore edilen mode'u baz alıyor (mevcut mode-değişimi useEffect'i de mount'ta tetiklenip senkronize eder).

**4) Responsive uyum:**
- Topics PlaylistRow checkbox + chevron + isim + progress bar + sil — `flexWrap: wrap` ile mobile'da rahat alt satıra geçer (mevcut pattern korundu).
- Bilgi kutusu da `flexWrap` ile küçük ekranda sayaç alt satıra düşer.
- Dashboard ProgressCard mevcut grid'i değişmedi (mobile/tablet/desktop ayrımı korundu).

**5) Kalıcı kural:** **Sayfa içi UI durumu (filtreler, seçili ders, açık sekme, vb.) `usePersistentState` ile localStorage'a saklanmalı.** Kullanıcı başka bir sayfaya gidip geri döndüğünde son kaldığı yerden devam etmeli — bu, projede yeni eklenecek her sayfa için varsayılan davranıştır. Anahtar konvansiyonu: `<sayfa>.<state>` (örn. `topics.activeSubj`, `pomodoro.mode`).

**6) Etkilenen dosyalar:**
[ui.jsx](ui.jsx) · [store.js](store.js) · [topics.jsx](topics.jsx) · [dashboard.jsx](dashboard.jsx) · [questions.jsx](questions.jsx) · [exams.jsx](exams.jsx) · [exam-chart.jsx](exam-chart.jsx) · [pomodoro.jsx](pomodoro.jsx)

---

### 2026-05-06 (ek 8) — Pomodoro: 4. mod ("Uzun") + yeni ambient sesler & yeni "Eksik Konular" sayfası

**Sorun:** (a) Pomodoro'da yalnızca 25 dk çalışma modu vardı; bazı kullanıcılar 50 dk gibi daha uzun sürelerle odaklanmak istiyor. Mevcut "white/pink/brown noise" üreteci en düşük volume seviyesinde bile rahatsız ediciydi. (b) Yanlış/boş yapılan konuların zamansal değişimini (artıyor mu, azalıyor mu) tek bakışta görecek özel bir sayfa yoktu — Ana Sayfa'daki "En Çok Hata Yapılan 5 Konu" kartı sadece anlık skor gösteriyordu, trend yoktu.

**1) Pomodoro — yeni mod & ses motoru** — [pomodoro.jsx](pomodoro.jsx)
- 4 mod: **Kısa Pomodoro (25 dk)** + **Kısa Mola (5 dk)** (yeşil work-rest çifti) ve **Uzun Pomodoro (50 dk)** + **Uzun Mola (15 dk)** (mor work-rest çifti). Her modun `kind: "work"|"rest"` etiketi var.
- Auto-cycle: çalışma bittiğinde mola, mola bittiğinde son seçili çalışma moduna dön (`lastWorkRef`). "Uzun Pomodoro" → her seferinde "long mola"; "Kısa Pomodoro" → 4 tur sayacında bir "long", aksi halde "short".
- Mode tab grid responsive: mobil/tablet 2×2, desktop 4 kolon.
- **Yeni ambient ses motoru** (Web Audio API, dış URL/dosya yok — tamamen procedural, internet bağımlılığı yok):
  - **Yağmur**: pink noise + highpass 220 Hz + lowpass 1.5 kHz + rastgele aralıklarla küçük damla impulse'ları (sine + exp ramp).
  - **Hafif Yağmur**: brown noise + ağır lowpass (~750 Hz) — uzaktan yağmur hissi.
  - **Okyanus**: pink noise + lowpass 1.1 kHz + 0.1 Hz LFO ile gain modülasyonu (10 sn'lik dalga swell'i).
  - **Müzik**: Am-F-C-G akor pad (sine + soft triangle, hafif detune), 6.5 sn'de bir akor değişimi, slow tremolo LFO 0.12 Hz.
- **Volume eğrisi düzeltildi:** Slider değeri perceptual `x^1.6 * 0.5` ile gain'e çevriliyor — eskiden max 1.0'dı (rahatsız edici), şimdi max 0.5 ve eğri sayesinde alt seviyelerde de rahat duyulabilir hale geldi. Default volume %30.
- Ses sekme grid'i responsive: mobil 2 kol, tablet 3 kol, desktop 5 kol.

**2) Yeni sayfa: Eksik Konular** — [weak-topics.jsx](weak-topics.jsx) (yeni)
- Soru çözümü ve denemelerden konu bazlı yanlış/boş **agregasyonu**: subject+topic key'iyle gruplanır, her grup için `totalWrong`, `totalBlank`, `score = wrong + blank/2`, kayıt sayısı, son tarih hesaplanır.
- **Trend hesabı:** Konunun event'leri tarihe göre sıralanır, ortadan ikiye bölünür; ilk yarı ile son yarının ortalama puanı karşılaştırılır → `% değişim`. Pozitif = kötüleşme (kırmızı ▲), negatif = iyileşme (yeşil ▼).
- **Mini sparkline:** Her kart içinde basit SVG line chart — X tarih, Y konunun o gün/deneme'deki yanlış+boş/2 puanı. Daire noktaların üzerine `<title>` ile tooltip (yanlış, boş, puan). Y ekseninde 3 grid çizgisi (0/orta/max).
- **Üst özet:** "Kötüleşenler" (en çok artan ilk 3) ve "İyileşenler" (en çok azalan ilk 3) kartları — sadece ≥2 kayıt olan konular dahil.
- **Filtreler** (hepsi `usePersistentState` ile kalıcı):
  - `weak.source`: Tümü / Denemelerden / Soru Çözümünden
  - `weak.range`: Son 30 Gün / Son 90 Gün / Tümü
  - `weak.sortBy`: Puan / Kötüleşenler / Son Tarih
  - `weak.subjFilter`: Genel / her ders ayrı chip
- **Boş hal**: Filtre/zaman/ders kombinasyonuna göre bağlam-duyarlı mesaj ("Denemelerde Tarih için son 30 günde eksik konu yok").
- Stat grid'i kart altında: 4 kutu (Yanlış/Boş/Puan/Kayıt) — `repeat(4, 1fr)` ile her ekranda kalır.
- Responsive: mobil tek kolon, tablet tek kolon, desktop 2 kolon kart grid'i.

**3) Sidebar & router entegrasyonu**
- [shell.jsx](shell.jsx) sidebar items'a `{ id: "weak", label: "Eksik Konular", icon: "alert" }` (Pomodoro'dan önce, Deneme Sınavları sonrası).
- [app.jsx](app.jsx) routing: `page === "weak" → window.KPSS_WEAK_TOPICS`, screen label `"05 Eksik Konular"` (Pomodoro `"06"` oldu).
- [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html) `weak-topics.jsx` script tag'i `topics.jsx`'ten sonra, `pomodoro.jsx`'ten önce yüklenir.

**4) Etkilenen dosyalar:**
[pomodoro.jsx](pomodoro.jsx) · [weak-topics.jsx](weak-topics.jsx) (yeni) · [shell.jsx](shell.jsx) · [app.jsx](app.jsx) · [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html)

---

### 2026-05-07 — Türkiye TZ tarih düzeltmesi + Hedef Net + Anasayfa yeniden düzeni

**Sorun:** (a) Tarih binning'i UTC ISO key kullandığı için Türkiye saatine göre kayıtlar yanlış güne düşüyordu — örn. 29 Nisan'da 65 soru çözüldü ama soru çözümü grafiğinde "30 Nisan" sütununda görünüyordu (`new Date(...)setHours(0,0,0,0)` → `toISOString()` Türkiye'nin UTC+3'lük öne pozisyonu nedeniyle UTC günü bir gün geriye kayıyor; aynı şekilde kayıt ISO'sunun UTC günü Türkiye gününden farklı olabiliyor → bucket'lar 1 gün kaymış oluyordu). (b) Kullanıcı bir hedef net belirleyemiyordu; net trend grafiğinin neye göre değerlendirileceği belirsizdi. (c) Eksik Konular sayfası fazla grafikli/filtreli ve kafa karıştırıcı bulundu — kullanıcı sayfayı kaldırmak ve içeriğini Anasayfa'ya taşımak istedi.

**1) Türkiye TZ tarih helper'ları** — [ui.jsx](ui.jsx)
- `TR_TZ = "Europe/Istanbul"`, `trDateKey(d)` → `"YYYY-MM-DD"` Türkiye yerel günü (sistem TZ bağımsız), `trToday()`, `trAddDays(key, n)` (UTC tabanlı güvenli aritmetik), `trMakeIso(key)` → `key + "T12:00:00+03:00"` ISO (form kayıtları öğlen anchor — sistem TZ ne olursa olsun aynı güne düşer).
- `fmtDate`, `fmtDateShort`, `formatRange` artık `timeZone: "Europe/Istanbul"` opsiyonu ile formatlıyor.
- Site genel kuralı: tüm tarih bucketlama ve karşılaştırması Türkiye yerel günüyle yapılır; UTC ISO key (`.toISOString().slice(0, 10)`) kullanılmaz.

**2) Soru Çözümü & Deneme — TZ-güvenli kayıt** — [questions.jsx](questions.jsx) · [exams.jsx](exams.jsx)
- Modal'larda `<input type="date">` default'u `trToday()`; düzenlemede `trDateKey(existing.date)`.
- Save'de `new Date(date + "T" + ...).toISOString()` yerine `trMakeIso(date)` — kayıt ISO'su her zaman ilgili Türkiye gününe ait öğlen 12:00 +03:00.
- 14-günlük volume bar chart: `today.toISOString().slice(0,10)` yerine `trToday()` + `trAddDays(-i)`; eşleşme `trDateKey(q.date)` ile.
- `monthLbl` ve `fmtDateFull` artık `timeZone: TR_TZ` ile formatlıyor. Bug düzeldi: 23:00–02:00 Türkiye saatinde girilen kayıt artık doğru güne düşüyor.

**3) Hedef sistemi (state.goals)** — [store.js](store.js)
- Store şemasına `goals: { targetNet: 90, perSubject: { turkce?: number, ... } }` eklendi. `defaultGoals()`, `normalizeGoals()` migration ile geri-uyumlu (eski snapshot'lar default 90 hedefli açılır).
- `kpssStore.setGoals(patch)` — top-level `targetNet` ya da `perSubject` (merge) güncelleyebilir.
- `exportJSON.version` 2 → 3, `goals` alanı dahil; `importJSON` `data.goals`'i `migrateState` üzerinden geçirir. `clear()` `goals: defaultGoals()` döndürür.
- `seed()`'in tarih anchor'ı `today.setHours(12, 0, 0, 0)` ile öğlen yapıldı — gece girilen seed Türkiye gününe doğru düşer.

**4) Anasayfa yeniden düzeni** — [dashboard.jsx](dashboard.jsx)
- **Row 1**: Mevcut 3 stat kart (Toplam Soru, Toplam Deneme, Genel Ortalama Net).
- **Row 2**: `1.5fr` net trend grafiği + `1fr` **Hedef Net Kartı**. Grafiğe yatay turuncu kesik hedef çizgisi (`#f59e0b`, `strokeDasharray="6 4"`) ve sağ üstte "Hedef X" badge'i — `targetNet` 0–120 aralığındaysa.
- **Hedef Net Kartı**: Büyük rakam (`44px`, `#f59e0b`) + `/ 120 net`. Altında 5 ders satırı: ders rengi noktası, ders adı, "/ fixedCount" notu, hedef değeri. Manuel girilmemiş dersler için `targetNet × fixedCount / 120` ile otomatik dağıtılır ve "otomatik" etiketi gösterilir.
- **Hedef düzenleme modal'ı**: Toplam hedef + 5 ders alanı (her biri 0..fixedCount aralığında doğrulanır). "Otomatik dağıt" tuşu fixedCount oranına göre doldurur; "Temizle" boşaltır. Validation kırmızı uyarı kutusu.
- **Filtre çubuğu** (kart): Kaynak (Tümü/Denemelerden/Soru Çözümünden) + Ders chip'leri — tek yerde, aşağıdaki iki konu kartına ortak uygulanır.
- **Row 3**: Yan yana iki kart **birebir aynı tasarımda** (`1fr 1fr`, tablet'te `1fr` stack):
  - **En Çok Hata Yapılan 5 Konu** — `score = wrong + blank/2` toplamı, sıralama desc.
  - **En Çok İyileşme Gösteren 5 Konu** — sadece ≥2 event'li gruplar; `trend = sonYarıAvg - ilkYarıAvg < 0`, sıralama trend asc (en negatif üstte). Sağ etikette `▼ %X` yeşil.
- Dashboard'daki eski "yaş çarpanlı" (14g/30g/30g+) skor formülü kaldırıldı — `weak-topics.jsx` ile aynı algoritma kullanılıyor (kopya kaldırıldı).
- **Row 4**: ProgressCard değişmedi (her ders için konu + playlist tamamlama %).

**5) Eksik Konular sayfası kaldırıldı**
- [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html) `weak-topics.jsx` script tag'i çıkarıldı.
- [shell.jsx](shell.jsx) sidebar items'tan `{ id: "weak", ... }` çıkarıldı.
- [app.jsx](app.jsx) router'dan `page === "weak"` dalı ve "05 Eksik Konular" label'ı çıkarıldı; Pomodoro screen label'ı "05" oldu.
- `weak-topics.jsx` dosyası kaldı (silinmedi) — istenirse referans olarak bakılabilir, runtime'da hiçbir yere bağlı değil.

**6) Etkilenen dosyalar:**
[ui.jsx](ui.jsx) · [store.js](store.js) · [questions.jsx](questions.jsx) · [exams.jsx](exams.jsx) · [dashboard.jsx](dashboard.jsx) · [shell.jsx](shell.jsx) · [app.jsx](app.jsx) · [KPSS Sınav Takip.html](KPSS%20S%C4%B1nav%20Takip.html)

---

### 2026-05-07 (ek) — 3. konu kartı (En Çok Kötüleşen) + Deneme Sınavları grafiğine hedef çizgisi

**1) Anasayfa — 3 konu kartı yan yana** — [dashboard.jsx](dashboard.jsx)
- Row 3 grid: `1fr 1fr 1fr` (desktop) · `1fr 1fr` (tablet) · `1fr` (mobile).
- Sıra: **En Çok Hata Yapılan 5 Konu** (turuncu) → **En Çok Kötüleşen 5 Konu** (kırmızı, `▲ %X`) → **En Çok İyileşen 5 Konu** (yeşil, `▼ %X`). Üçü de aynı kart şablonunu (`TopicListCard`) kullanıyor — `kind: "wrong" | "worsened" | "improved"`.
- Kötüleşen filtresi: `g.events.length >= 2 && g.trend > 0`, sıralama trend desc (en pozitif üstte). Mevcut paylaşılan filtre (Kaynak + Ders) üçüne birden uygulanır.

**2) Deneme Sınavları grafiği — hedef çizgisi** — [exam-chart.jsx](exam-chart.jsx) · [exams.jsx](exams.jsx)
- ExamChart artık `goals` prop'unu da alıyor; exams.jsx içinde `state.goals` ile geçirildi.
- **Toplam Net modu** (Genel + `mode === "total"`): Anasayfa ile aynı stil — yatay turuncu kesik (`#f59e0b`, `strokeDasharray="6 4"`) + sağ üstte "Hedef X" badge'i. `targetNet > yMax` ise gizlenir.
- **Ders Bazında modu** (Genel `subjects` veya Branş): her açık ders için kendi renginde ince kesik çizgi (`opacity 0.55`, `strokeDasharray="4 4"`) — değer `goals.perSubject[sk]` (girilmişse) ya da `targetNet × fixedCount / totalFixed` (otomatik). Sağ uçta kısa etiket (ders adının ilk 4 karakteri + hedef). yMax'ı aşan hedefler atlanır.
- **Süre modu**: hedef çizgisi yoktur.

**3) Etkilenen dosyalar:**
[dashboard.jsx](dashboard.jsx) · [exam-chart.jsx](exam-chart.jsx) · [exams.jsx](exams.jsx)

---

### 2026-05-07 (ek 2) — Hedef süre alanı + Deneme grafiği Süre modunda hedef çizgisi

**1) `goals.targetDurationMin`** — [store.js](store.js)
- `defaultGoals()` → `targetDurationMin: 130` (KPSS GY-GK Lisans 130 dk).
- `normalizeGoals` mantığı: `null`/`""` ⇒ `null` (kullanıcı temizledi, çizgi yok), `undefined` ⇒ 130 (eski snapshot default), pozitif sayı (≤600) ⇒ kabul, aksi ⇒ `null`.

**2) Hedef Net kartı + modal** — [dashboard.jsx](dashboard.jsx)
- Kartın hedef rakamı altına küçük "Hedef genel deneme süresi: X dk" satırı (clock ikonu, cyan vurgu). Set edilmemişse "—".
- TargetModal üst satırı `1fr 1fr` grid'e döndü: solda **Toplam Hedef Net** (0-120), sağda **Hedef Süre** (1-600 dk, opsiyonel, boş bırakılabilir). Boş gönderildiğinde `targetDurationMin: null` olarak kaydedilir → çizgi gizlenir.

**3) Deneme Sınavları grafiği — Süre modu hedef çizgisi** — [exam-chart.jsx](exam-chart.jsx)
- **Süre modu + Genel** (`metric === "duration"`, `!isBrans`): yatay turuncu kesik (`#f59e0b`) + sağ üstte "Hedef X dk" badge — Anasayfa stilinde.
- **Branş + Süre**: hedef çizgisi yok (tek bir genel hedef, branş için anlamsız).
- **yMax fix**: Süre modu yMax hesabı `Math.max(60, targetDurationMin, ...durations)` ile genişletildi — tüm denemeler hedefin altındaysa bile çizgi görünür.
- Net modu (Toplam/Ders Bazında) çizgileri olduğu gibi korundu.

**4) Etkilenen dosyalar:**
[store.js](store.js) · [dashboard.jsx](dashboard.jsx) · [exam-chart.jsx](exam-chart.jsx)

---

### 2026-05-07 (ek 3) — Konu bazlı yanlış/boş toplam validation'ı

**Sorun:** Soru çözümü/deneme eklerken bir derste 3 yanlış yapan kullanıcı, "yanlış olan konular"a tek tek girerken yanlışlıkla 1 yerine 10 yazınca tüm istatistikler bozuluyordu — agregasyon ve trend skorları gerçek dışı şişiyordu.

**1) Canlı uyarı + sınır gösterimi**
- [exams.jsx](exams.jsx) `renderWeakInputs(items, onWrong, onBlank, maxWrong, maxBlank)` artık iki ek parametre alır. Üst satırda `Yanlış: X / max` ve `Boş: Y / max` özet — geçerken kırmızı (sayı kırmızı, etiket vurgulanır), input border'ı `#7f1d1d`'ya döner. Genel için her ders kendi `t.w` / `t.b`'siyle, branş için `bWrongN` / `bBlank` ile çağrılıyor.
- [questions.jsx](questions.jsx) Karma test modal'ında aynı pattern: weakTopics bölümünün başına özet, hatalı input'lar kırmızı border, alt satırda kırmızı uyarı kutusu.

**2) Save-time blokaj**
- [exams.jsx](exams.jsx) Genel kayıtta her ders için `sum(weakTopics.wrong) > t.w` veya `sum(weakTopics.blank) > t.b` ise `globalError`'a "Türkçe: konu bazlı yanlış toplamı (10), dersteki yanlış sayısını (3) geçiyor." gibi mesaj — kayıt yapılmaz.
- Branş kayıtta aynı kontrol `bWrongN` / `bBlank` üzerinden.
- [questions.jsx](questions.jsx) Karma testte `wrongN` ve hesaplanmış `blank` üzerinden aynı kontrol.

**3) Etkilenen dosyalar:**
[questions.jsx](questions.jsx) · [exams.jsx](exams.jsx)

---

### 2026-05-07 (ek 4) — Konu Y/B input'larında select-on-focus

**Sorun:** Zayıf konu Y/B input'ları default `0` ile geliyordu; kullanıcı `1` yazmaya çalışınca `01` oluyordu (cursor değer sonunda) ve `0`'ı silmek için fazladan tuş basmak gerekiyordu.

**Düzeltme:** Y ve B input'larına `onFocus={(e) => e.target.select()}` eklendi — input focus aldığında mevcut değer seçili gelir, ilk basılan rakam onu replace eder. Default `wrong: 1, blank: 0` aynen korundu.

[questions.jsx](questions.jsx) · [exams.jsx](exams.jsx) (`renderWeakInputs`)

---

### 2026-05-07 (ek 5) — Soru Çözümü yeniden tasarımı: range filter + Son Test Analizi + Karma kaldırıldı

**Sorun & yeni yaklaşım:** Karma test girişi yapıyı karmaşıklaştırıyordu; konu çözümünden ayrı, başka bir veri modeli (weakTopics chip + Y/B inputs) gerektiriyordu, ama "konu konu çözüp ayrı ayrı kaydetmek" projenin amacına daha uygun. Çoklu konu içeren bir test için kullanıcı her grubu ayrı kayıt olarak girer. Bu sadeleştirme + "anında feedback" kartı eklendi.

**1) Karma test desteği projeden kaldırıldı** — [questions.jsx](questions.jsx) · [store.js](store.js)
- QuestionModal artık sadece **Konu Testi**: Tabs kaldırıldı; Tarih + Ders + Konu + Toplam + Doğru + Yanlış (Boş otomatik). Konu zorunlu — boşsa kaydetilmez.
- weakTopics chip + Y/B input bölümü ve buna bağlı toplam validation tamamen kaldırıldı.
- Yeni kayıtlar daima `type: "konu"`, `weakTopics: []`. Eski karma kayıtları (`type: "karma"`, `topic: null`) listede kalır; düzenlemek için bir konu seçilmesi gerekir, edit'te "Bu eski bir karma kaydı" notu görünür.
- store.js seed'inde 3 karma kaydı (q2/q4/q6) konu kaydına dönüştürüldü; q2 ve q6 aynı `Osmanlı Devleti Siyasi Tarihi` konusunu hedefliyor → Son Test Analizi trend hesabı için anlamlı veri.
- QuestionTable'dan "Tip" sütunu kaldırıldı; QuestionCardMobile'dan "Konu/Karma" badge'i ve weakTopics notu kaldırıldı.
- Stats grid 4 → 3 kart: Toplam Çözülen Soru, Toplam Test Kaydı, Ortalama Net.
- Liste filtresi (`questions.filterType`) kaldırıldı — tek liste gösterilir.

**2) Çözülen soru hacmi grafiği — range filter** — [questions.jsx](questions.jsx)
- Sağ üstte `RangeTabs`: **14 Gün · 1 Ay · 3 Ay · Tümü** (`usePersistentState("questions.chartRange")`).
- Bin stratejisi:
  - **14g/1ay** → günlük bar (14 / 30 bar).
  - **3ay** → haftalık bar (12 bar, bugüne dayanan 7'şer günlük pencereler).
  - **tum** → aylık bar (en eski kayıt ayından bugüne).
- `buildBins(questions, range)` fonksiyonu bin'leri ve mode'u (day/week/month) döndürür; `binAxisLabel`/`binTooltipLabel` her mode için uygun TR-formatlı etiket üretir (ör. weekly tooltip: "5 May – 11 May", monthly: "May 2026").
- X label sıklığı bin sayısına göre adapte (≤14 her 2'de bir, ≤20 her 3'te bir, fazlası `ceil(n/8)`).

**3) Son Test Analizi kartı** — [questions.jsx](questions.jsx) `LastTestAnalysisCard`
- Chart'ın yanında (`1.5fr 1fr` desktop, tablet'te alt-alta).
- En son konu kaydı: ders rengi noktası + ders adı + tarih + büyük konu başlığı + alt satırda `D/Y/B/T` özeti.
- 2'li grid: **Başarı %** (`#10b981`) + **Net** (`#a78bfa`).
- **Trend kutusu**: aynı `subject + topic`'e ait önceki kayıtların ortalama başarısı vs son kayıt → +/- delta. ≥1.5 puan iyileşme yeşil ▲ "İyileşiyorsun", −1.5 puan altı kırmızı ▼ "Kötüleşiyor", arası "Sabit". Kutuda "N önceki kaydın ortalaması: %X · son: %Y".
- İlk kayıt için "Bu konudan ilk kaydın — sonraki kayıtlarla karşılaştırılacak."
- Konusu olmayan kayıt için "Bu kayıtta konu seçili değil (eski karma test)" notu.

**4) Etkilenen dosyalar:**
[questions.jsx](questions.jsx) (komple rewrite) · [store.js](store.js) (seed)

---

### 2026-05-07 (öncesi) — Strateji belgesi: Danışman 3 değerlendirmesi
İki danışman görüşü (`docs/danisman1.md`, `docs/danisman2.md`) ve mevcut kod birleştirilerek `docs/son_durum.md` yazıldı: dürüst eleştiri (kopyalar, yanlış öncelikler), her sayfanın net rolü, kullanıcı akışı diyagramı, P0/P1/P2 öncelik listesi. Kod değişikliği yok; sadece strateji.

---

### 2026-05-12 — Branş ExamChart: Son 10 modunda genel-mod ile aynı x ekseni mantığı

Önceki round'larda branş + son 10 deneme için eklenen "her ders kendi son 10'unu bağımsız al + sağa hizalı 10 slot" özel durumu, çoklu ders açıkken çakışan x-skalaları yüzünden hover tooltip'inin bazı serilerde gözükmemesine yol açıyordu. Genel deneme grafiğindeki sade mantığa hizalandı:

- `series` useMemo'sundaki `isBrans && range === "last10"` özel case'i kaldırıldı; branş tüm range'lerde (7d/30d/90d/last10) aynı gap-based seri üretimini kullanıyor.
- `chartLen` her zaman `filtered.length` (genel ile aynı). Sağa-hizalı 10-slotluk özel x ekseni kaldırıldı.
- `hoveredExam` doğrudan `filtered[hoverIdx]` — her slotta tek bir deneme paylaşılıyor, tüm seriler bu slot için aynı tooltip'i tetikliyor.
- Çizgi/nokta çiziminde `xOf`/`isHov` yardımcıları kaldırıldı; klasik `toX(i, s.points.length)` ve `hoverIdx === i` kullanılıyor.
- X-ekseni etiketi: tek bir `filtered.map` döngüsünde, range last10 ise sıra numarası (`1.`, `2.`, …), değilse `fmtDateShort` gösterilir.
- yMax/yTicks süre adımları (step-based: ≤60→10, 60<m≤120→20, m>120→30) korundu — taban değer 30 dk.

**Etkilenen dosyalar:** [src/components/ExamChart.jsx](src/components/ExamChart.jsx)
