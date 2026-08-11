import type { UserSwitcherProps } from "../../../../shared/types/user";

export function UserSwitcher({
  users,
  selectedUserId,
  disabled,
  onChange,
}: UserSwitcherProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div
      className="user-switcher"
      role="group"
      aria-label="Switch current user"
    >
      <span className="switcher-label">User</span>
      <div className="user-switcher-buttons">
        {users.map((user, index) => {
          const isSelected = user.id === selectedUserId;
          const userLetter = String.fromCharCode(65 + index);

          return (
            <button
              aria-label={`Switch to ${user.name}`}
              aria-pressed={isSelected}
              className={`user-switcher-button${isSelected ? " is-selected" : ""}`}
              disabled={disabled}
              key={user.id}
              onClick={() => onChange(user.id)}
              title={`${user.name} — ${user.company_name}`}
              type="button"
            >
              <span className="user-switcher-letter" aria-hidden="true">
                {userLetter}
              </span>
              <span className="user-switcher-name">{user.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
