// Main app — wires sidebar, topbar, and page routing
import { useState, useEffect } from "react";
import { Sidebar, Topbar } from "./components/shell";
import {
  KPSS_EXAM_DATE,
  KPSS_APPLY_DATE_START,
  KPSS_APPLY_DATE_END,
} from "./utils/subjects";
import Dashboard from "./pages/Dashboard";
import Topics from "./pages/Topics";
import Questions from "./pages/Questions";
import Exams from "./pages/Exams";
import Pomodoro from "./pages/Pomodoro";

function App() {
  const [page, setPage] = useState(() => window.location.hash.replace("#", "") || "dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setPage(window.location.hash.replace("#", "") || "dashboard");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (p) => {
    window.location.hash = p;
    setPage(p);
  };

  const Page =
    page === "topics" ? Topics :
    page === "questions" ? Questions :
    page === "exams" ? Exams :
    page === "pomodoro" ? Pomodoro :
    Dashboard;
  const screenLabel =
    page === "topics" ? "02 Konular" :
    page === "questions" ? "03 Soru Çözümü" :
    page === "exams" ? "04 Deneme Sınavları" :
    page === "pomodoro" ? "05 Pomodoro" :
    "01 Ana Sayfa";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0c", color: "#e4e4e7" }} data-screen-label={screenLabel}>
      <Sidebar active={page} onNav={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar examDate={KPSS_EXAM_DATE} applyDateStart={KPSS_APPLY_DATE_START} applyDateEnd={KPSS_APPLY_DATE_END} onMenu={() => setMobileOpen(true)} />
        <div style={{ flex: 1 }}>
          <Page />
        </div>
      </main>
    </div>
  );
}

export default App;
