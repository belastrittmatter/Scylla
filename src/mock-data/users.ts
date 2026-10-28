export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  initials: string;
  role: string;
}

export const MOCK_CURRENT_USER: MockUser = {
  id: "usr-alex",
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatarUrl: "",
  initials: "AM",
  role: "Engineering Lead",
};

// Team members visible in UI.png top-right avatar stack (4 portraits)
export const MOCK_TEAM_MEMBERS: MockUser[] = [
  {
    id: "usr-1",
    name: "Olivia Chen",
    email: "olivia.chen@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    initials: "OC",
    role: "Product Manager",
  },
  {
    id: "usr-2",
    name: "Riley Cooper",
    email: "riley.cooper@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    initials: "RC",
    role: "Fullstack Engineer",
  },
  {
    id: "usr-3",
    name: "Alex Martinez",
    email: "alex.martinez@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    initials: "AM",
    role: "Designer",
  },
  {
    id: "usr-4",
    name: "Ava Wilson",
    email: "ava.wilson@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    initials: "AW",
    role: "Operations Lead",
  },
];

export async function fetchCurrentUser(): Promise<MockUser> {
  return MOCK_CURRENT_USER;
}

export async function fetchTeamMembers(): Promise<MockUser[]> {
  return MOCK_TEAM_MEMBERS;
}
