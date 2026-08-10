import type { UserRecord } from "../../../shared/types/user";
import { fetchUsers } from "../api/users.api";
import { useEffect, useState } from "react";

export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchUsers()
      .then((nextUsers) => {
        if (isActive) {
          setUsers(nextUsers);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("Unable to load users");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return { users, isLoading, error };
}
