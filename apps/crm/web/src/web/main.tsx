import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthenticationGate } from "./AuthenticationGate";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><AuthenticationGate><App /></AuthenticationGate></StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}
