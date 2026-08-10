import type { UserRecord } from "../types/user.ts";

export type UserSelectorProps = {
  users: UserRecord[];
  selectedUserId: string;
  isLoading: boolean;
  disabled: boolean;
  error: string | null;
  onChange: (userId: string) => void;
};
