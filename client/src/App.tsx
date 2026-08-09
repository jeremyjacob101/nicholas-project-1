import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { StrictMode } from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function checkServer() {
      try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();

        setStatus(data.status);
      } catch {
        setStatus("Server unavailable");
      }
    }

    checkServer();
  }, []);

  return (
    <main>
      <h1>Secure Research Uploads</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
