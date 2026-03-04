// ─────────────────────────────────────────────────────────────────────────────
// AppWrapper — Wraps App with BrowserRouter so useNavigate works inside App.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "react-router";
import App from "./App";

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;