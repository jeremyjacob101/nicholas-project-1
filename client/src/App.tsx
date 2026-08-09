import type { UserRecord } from "../../shared/types/user";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { StrictMode } from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [status, setStatus] = useState("Checking...");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userError, setUserError] = useState("");

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

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch(`${API_URL}/api/users`);

        if (!response.ok) {
          throw new Error("Unable to load users");
        }

        const data: { users: UserRecord[] } = await response.json();
        setUsers(data.users);
        setSelectedUserId(data.users[0]?.id ?? "");
      } catch {
        setUserError("Unable to load users");
      }
    }

    loadUsers();
  }, []);

  return (
    <main>
      <h1>Secure Research Uploads</h1>
      <p>Backend status: {status}</p>

      <label>
        Current user
        <select
          value={selectedUserId}
          onChange={(event) => setSelectedUserId(event.target.value)}
          disabled={users.length === 0}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — {user.company_name}
            </option>
          ))}
        </select>
      </label>

      {userError && <p>{userError}</p>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
