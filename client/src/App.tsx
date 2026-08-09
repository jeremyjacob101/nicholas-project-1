import ResearchUploadsPage from "./pages/ResearchUploadsPage";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import "./index.css";

export default function App() {
  return <ResearchUploadsPage />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
