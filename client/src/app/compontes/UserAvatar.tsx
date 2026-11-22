import { LuUsers } from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarSrc } from "@/lib/avatar";
import { initials, tintFor } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "h-7 w-7 text-[0.625rem]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-28 w-28 text-3xl",
};

type Size = keyof typeof SIZES;

// decorative: the name is always written next to it or on the button around it
export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user?: { _id?: string; name?: string; avatarVersion?: number } | null;
  size?: Size;
  className?: string;
}) {
  return (
    <Avatar aria-hidden className={cn(SIZES[size], className)}>
      <AvatarImage src={avatarSrc(user)} alt="" />
      <AvatarFallback className={cn("font-semibold", tintFor(user?._id))}>{initials(user?.name)}</AvatarFallback>
    </Avatar>
  );
}

export function GroupAvatar({ id, size = "md", className }: { id: string; size?: Size; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-[38%]", SIZES[size], tintFor(id), className)}
    >
      <LuUsers className="h-1/2 w-1/2" />
    </span>
  );
}
