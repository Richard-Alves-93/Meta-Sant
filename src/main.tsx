import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const STORAGE_RESET_KEY = 'crm_supabase_session_reset_v1';
const isOAuthCallback = window.location.search.includes('access_token=') || window.location.search.includes('code=') || window.location.search.includes('provider=');

if (!localStorage.getItem(STORAGE_RESET_KEY) && !isOAuthCallback) {
  console.warn('[Auth] Limpando apenas tokens Supabase antigos do localStorage.');
  const projectId = import.meta.env.VITE_SUPABASE_URL?.match(/\/\/([^.]+)\./)?.[1];
  const authPrefix = projectId ? `sb-${projectId}` : 'sb-';

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(authPrefix)) {
      localStorage.removeItem(key);
    }
  });

  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith(authPrefix)) {
      sessionStorage.removeItem(key);
    }
  });

  localStorage.setItem(STORAGE_RESET_KEY, '1');
}

createRoot(document.getElementById("root")!).render(<App />);
