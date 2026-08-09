import type { UserSelectorProps } from "../../../../shared/props/user";

export function UserSelector({
  users,
  selectedUserId,
  isLoading,
  error,
  onChange,
}: UserSelectorProps) {
  return (
    <div className="field">
      <label htmlFor="current-user">Current user</label>
      <select
        id="current-user"
        value={selectedUserId}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || users.length === 0}
      >
        {isLoading && <option>Loading users...</option>}
        {!isLoading && users.length === 0 && (
          <option value="">No users available</option>
        )}
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} — {user.company_name}
          </option>
        ))}
      </select>
      {error && <p className="message error">{error}</p>}
    </div>
  );
}
