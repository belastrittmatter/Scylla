import { CalendarDays, FolderKanban, LucideIcon, Settings, Users } from "lucide-react";

export interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string | number;
  isExternal?: boolean;
}

export interface FilesNavItem {
  id: string;
  title: string;
  url: string;
  count: number;
}

// Primary sidebar navigation items
export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: "calendar",
    title: "Calendar",
    url: "/",
    icon: CalendarDays,
  },
  {
    id: "tasks",
    title: "Tasks",
    url: "/tasks",
    icon: FolderKanban,
  },
  {
    id: "teams",
    title: "Teams",
    url: "/teams",
    icon: Users,
  },
  {
    id: "settings",
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export const WORKSPACE_INFO = {
  name: "Scylla",
  brand: "Scylla",
  logoUrl: "/logo.svg",
};
