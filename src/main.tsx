import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const STORAGE_RESET_KEY = 'crm_supabase_session_reset_v1';
if (!localStorage.getItem(STORAGE_RESET_KEY)) {
  console.warn('[Auth] Limpando sessão local antiga do Supabase.');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(STORAGE_RESET_KEY, '1');
}

createRoot(document.getElementById("root")!).render(<App />);
