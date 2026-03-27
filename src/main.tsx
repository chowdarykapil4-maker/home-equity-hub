import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force fresh module graph
createRoot(document.getElementById("root")!).render(<App />);
