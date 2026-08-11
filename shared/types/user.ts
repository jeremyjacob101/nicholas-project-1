export type UserRecord = {
  id: string;
  name: string;
  email: string;
  company_id: string;
  company_name: string;
};

export type UserSwitcherProps = {
  users: UserRecord[];
  selectedUserId: string;
  disabled: boolean;
  onChange: (userId: string) => void;
};

export type CurrentUserLocals = {
  currentUser: UserRecord;
};
