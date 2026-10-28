export const MOCK_ROOMS = [
  {
    resourceId: "res_room_alpha",
    resourceName: "Focus Room Alpha (2p)",
    resourceEmail: "room-alpha@resource.calendar.google.com",
    capacity: 2,
    featureInstances: [{ feature: { name: "screen" } }],
    buildingId: "Building A",
    floorName: "1",
  },
  {
    resourceId: "res_room_beta",
    resourceName: "Boardroom Beta (10p)",
    resourceEmail: "room-beta@resource.calendar.google.com",
    capacity: 10,
    featureInstances: [
      { feature: { name: "whiteboard" } },
      { feature: { name: "video-conference" } },
    ],
    buildingId: "Building A",
    floorName: "2",
  },
];

export const MOCK_DIRECTORY_USERS = [
  { id: "usr_alex_rivera", name: { fullName: "Alex Rivera" }, primaryEmail: "alex@example.com" },
  { id: "usr_sarah_chen", name: { fullName: "Sarah Chen" }, primaryEmail: "sarah@example.com" },
  { id: "usr_test_user", name: { fullName: "Test User" }, primaryEmail: "test@example.com" },
  { id: "usr_user1", name: { fullName: "User One" }, primaryEmail: "user1@example.com" },
];
