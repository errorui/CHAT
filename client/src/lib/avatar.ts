export const avatarSrc = (user?: { _id?: string; avatarVersion?: number } | null) =>
  user?._id ? `/api/user/${user._id}/avatar${user.avatarVersion ? `?v=${user.avatarVersion}` : ""}` : undefined;
