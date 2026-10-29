export interface RoomDefinition {
  id: string;
  name: string;
  capacity: number;
  location: string;
  facilities: string[];
}

export const HCM_MEETING_ROOMS: RoomDefinition[] = [
  {
    id: "sai-gon-14",
    name: "Sai Gon 14",
    capacity: 14,
    location: "Floor 1, East Wing",
    facilities: [
      'Dual 75" 4K Displays',
      "Google Meet Room Kit",
      "Acoustic Baffles",
      "Whiteboard",
    ],
  },
  {
    id: "bangkok-6",
    name: "Bangkok 6",
    capacity: 6,
    location: "Floor 1, Central Hall",
    facilities: ['55" 4K Screen', "Poly Studio Bar", "Glass Whiteboard"],
  },
  {
    id: "kaunas-6",
    name: "Kaunas 6",
    capacity: 6,
    location: "Floor 1, West Wing",
    facilities: ['55" 4K Screen', "Logitech MeetUp", "Glass Whiteboard"],
  },
  {
    id: "cairo-6",
    name: "Cairo 6",
    capacity: 6,
    location: "Floor 1, North Corridor",
    facilities: ['55" 4K Screen', "Poly Studio Bar", "Soundproof Panel"],
  },
  {
    id: "munich-6",
    name: "Munich 6",
    capacity: 6,
    location: "Floor 1, South Corridor",
    facilities: ['55" 4K Screen', "Logitech MeetUp", "Soundproof Panel"],
  },
];
