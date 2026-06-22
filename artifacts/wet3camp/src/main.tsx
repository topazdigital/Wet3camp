import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID
if (clarityId) {
  import('@microsoft/clarity').then(({ default: Clarity }) => {
    Clarity.init(clarityId)
  }).catch(() => {})
}

createRoot(document.getElementById("root")!).render(<App />);
