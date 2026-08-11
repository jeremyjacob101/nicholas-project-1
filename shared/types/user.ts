export type UserRecord = {
  id: string;
  name: string;
  company_name: string;
};

export type CurrentUserRecord = UserRecord & {
  email: string;
  company_id: string;
};

export type UserSwitcherProps = {
  users: UserRecord[];
  selectedUserId: string;
  disabled: boolean;
  onChange: (userId: string) => void;
};

export type CurrentUserLocals = {
  currentUser: CurrentUserRecord;
};
