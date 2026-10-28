import { HCM_MEETING_ROOMS, RoomDefinition } from "@/constants/rooms";

export interface MockRoomStatus extends RoomDefinition {
  isAvailable: boolean;
  statusLabel: "Available" | "Occupied" | "Cleaning";
  currentMeeting?: {
    title: string;
    organizer: string;
    attendeeCount: number;
    endsAt: string;
  };
  nextAvailableAt: string;
}

export const MOCK_ROOM_STATUSES: MockRoomStatus[] = [
  {
    ...HCM_MEETING_ROOMS[0], // Sai Gon 14
    isAvailable: true,
    statusLabel: "Available",
    nextAvailableAt: "Now",
  },
  {
    ...HCM_MEETING_ROOMS[1], // Bangkok 6
    isAvailable: false,
    statusLabel: "Occupied",
    currentMeeting: {
      title: "Sprint Planning Sync",
      organizer: "alex.morgan@example.com",
      attendeeCount: 5,
      endsAt: "11:30 AM",
    },
    nextAvailableAt: "11:30 AM",
  },
  {
    ...HCM_MEETING_ROOMS[2], // Kaunas 6
    isAvailable: true,
    statusLabel: "Available",
    nextAvailableAt: "Now",
  },
  {
    ...HCM_MEETING_ROOMS[3], // Cairo 6
    isAvailable: true,
    statusLabel: "Available",
    nextAvailableAt: "Now",
  },
  {
    ...HCM_MEETING_ROOMS[4], // Munich 6
    isAvailable: false,
    statusLabel: "Occupied",
    currentMeeting: {
      title: "Client Evaluation Call",
      organizer: "olivia.chen@example.com",
      attendeeCount: 4,
      endsAt: "12:00 PM",
    },
    nextAvailableAt: "12:00 PM",
  },
];

export async function fetchRoomStatuses(): Promise<MockRoomStatus[]> {
  return MOCK_ROOM_STATUSES;
}
