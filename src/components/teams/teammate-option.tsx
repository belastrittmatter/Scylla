import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPersonInitials } from "@/lib/format-person-name";
import type { Teammate } from "@/services/user";

/** Avatar + name/email row shared by teammate comboboxes. */
export function TeammateOption({ user }: { user: Teammate }) {
  const label = user.name || user.email;
  return (
    <>
      <Avatar>
        <AvatarImage
          src={user.image || user.avatarUrl || undefined}
          alt={label}
        />
        <AvatarFallback>{getPersonInitials(label)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 truncate">
        <p className="text-foreground truncate text-xs font-medium leading-tight">
          {label}
        </p>
        {user.name && user.name.toLowerCase() !== user.email.toLowerCase() && (
          <p className="text-muted-foreground truncate text-xs leading-tight">
            {user.email}
            {user.department ? ` • ${user.department}` : ""}
          </p>
        )}
      </div>
    </>
  );
}
