// Main app — wires sidebar, topbar, and page routing
const { useState: useStateApp } = React;

function App() {
  const [page, setPage] = useStateApp(() => window.location.hash.replace("#", "") || "dashboard");
  const [mobileOpen, setMobileOpen] = useStateApp(false);

  React.useEffect(() => {
    const onHash = () => setPage(window.location.hash.replace("#", "") || "dashboard");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (p) => {
    window.location.hash = p;
    setPage(p);
  };

  const Page =
    page === "topics" ? window.KPSS_TOPICS :
    page === "questions" ? window.KPSS_QUESTIONS :
    page === "exams" ? window.KPSS_EXAMS :
    page === "pomodoro" ? window.KPSS_POMODORO :
    window.KPSS_DASHBOARD;
  const screenLabel =
    page === "topics" ? "02 Konular" :
    page === "questions" ? "03 Soru Çözümü" :
    page === "exams" ? "04 Deneme Sınavları" :
    page === "pomodoro" ? "05 Pomodoro" :
    "01 Ana Sayfa";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0c", color: "#e4e4e7" }} data-screen-label={screenLabel}>
      <window.KPSS_SHELL.Sidebar active={page} onNav={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <window.KPSS_SHELL.Topbar examDate={window.KPSS_EXAM_DATE} applyDateStart={window.KPSS_APPLY_DATE_START} applyDateEnd={window.KPSS_APPLY_DATE_END} onMenu={() => setMobileOpen(true)} />
        <div style={{ flex: 1 }}>
          <Page />
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
