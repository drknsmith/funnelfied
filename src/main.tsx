import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker with update prompt
const updateSW = registerSW({
  onNeedRefresh() {
    // Show update notification
    const toast = document.createElement("div");
    toast.id = "pwa-update-toast";
    toast.innerHTML = `
      <div style="position:fixed;bottom:20px;right:20px;background:#2563eb;color:white;padding:16px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;z-index:9999;font-family:system-ui,sans-serif;">
        <span>Update available!</span>
        <button id="pwa-refresh-btn" style="background:white;color:#2563eb;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;">Refresh</button>
      </div>
    `;
    document.body.appendChild(toast);
    
    document.getElementById("pwa-refresh-btn")?.addEventListener("click", () => {
      updateSW(true);
    });
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
