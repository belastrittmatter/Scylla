export interface TimeInterval {
  startMin: number; // minutes from 00:00, e.g. 8 * 60 = 480
  endMin: number; // minutes from 00:00, e.g. 18 * 60 = 1080
  label?: string;
}

export interface ParticipantSchedule {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  busySlots: TimeInterval[];
}

export interface RoomSchedule {
  id: string;
  name: string;
  displayName: string;
  capacity: number;
  floor: string;
  bookedSlots: TimeInterval[];
}

export const DAY_START_MIN = 8 * 60; // 480 (08:00)
export const DAY_END_MIN = 18 * 60; // 1080 (18:00)
export const TOTAL_MINUTES = DAY_END_MIN - DAY_START_MIN; // 600 minutes (10 hours)
export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export const getPercent = (min: number) => {
  const clamped = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min));
  return ((clamped - DAY_START_MIN) / TOTAL_MINUTES) * 100;
};

export const MOCK_PARTICIPANTS: ParticipantSchedule[] = [
  {
    id: "p-01",
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=faces",
    busySlots: [
      { startMin: 12 * 60, endMin: 13 * 60, label: "Busy: 12:00-13:00" },
    ],
  },
  {
    id: "p-02",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces",
    busySlots: [
      { startMin: 9 * 60, endMin: 9 * 60 + 45, label: "Busy: 09:00-09:45" },
      { startMin: 14 * 60, endMin: 15 * 60 + 30, label: "Busy: 14:00-15:30" },
    ],
  },
  {
    id: "p-03",
    name: "Eva Vance",
    email: "eva.vance@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces",
    busySlots: [
      { startMin: 10 * 60, endMin: 11 * 60 + 15, label: "Busy: 10:00-11:15" },
      {
        startMin: 15 * 60 + 30,
        endMin: 16 * 60 + 30,
        label: "Busy: 15:30-16:30",
      },
    ],
  },
  {
    id: "p-04",
    name: "David Kim",
    email: "david.kim@example.com",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces",
    busySlots: [
      {
        startMin: 10 * 60 + 30,
        endMin: 11 * 60 + 30,
        label: "Busy: 10:30-11:30",
      },
      { startMin: 16 * 60, endMin: 17 * 60, label: "Busy: 16:00-17:00" },
    ],
  },
];

export const MOCK_ROOM_SCHEDULES: RoomSchedule[] = [];
