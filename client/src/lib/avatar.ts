export const avatarSrc = (user?: { _id?: string } | null) =>
  user?._id ? `/api/user/${user._id}/avatar` : undefined;
