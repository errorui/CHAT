import React from "react";
import { UserAvatar } from "./UserAvatar";
import { User } from "../type";

const UserListItem = ({
  i,
  handlefunction,
  trailing,
  selected,
  disabled,
}: {
  i: User;
  handlefunction?: () => void;
  trailing?: React.ReactNode;
  /** only pass this where the row works as a toggle */
  selected?: boolean;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={handlefunction}
      disabled={disabled}
      aria-pressed={selected}
      className="flex w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent"
    >
      <UserAvatar user={i} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{i.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{i.email}</span>
      </span>
      {trailing}
    </button>
  );
};

export default UserListItem;
