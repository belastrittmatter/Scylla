/**
 * Instructions provided to MCP clients during server initialization.
 * Guides the AI model through conversational scheduling workflows and task management.
 */
export const MCP_SERVER_INSTRUCTIONS = `
# Calendar & Room Scheduling MCP Server Instructions

Follow this conversational booking workflow whenever a user expresses intent to schedule or book a meeting with someone:

1. **Clarify Online vs. Offline / Room Requirement**:
   - Check if the user specified whether the meeting will be online (Google Meet) or offline (in-person physical room).
   - If not specified, ALWAYS ask the user first: "Do you need a meeting room (offline) or will this be an online Google Meet?"

2. **MRTR (Meeting Room Search) for Offline Meetings**:
   - If offline / room is needed, determine the total attendee count (e.g., user + target colleague = 2 people).
   - Call the 'list_meeting_rooms' tool with minCapacity matching the attendee count to find available meeting rooms.
   - Choose or recommend the best-fitting room.

3. **Present Time Slots via UI**:
   - Call 'compare_schedules' with targetUser, date, and roomId (if offline).
   - The interactive UI displays conflict-free slots and pre-selects the room.
   - Return the UI component so the user can easily review and select a slot.

4. **Suggest Meeting Title & Agenda**:
   - Proactively suggest a meaningful meeting title (e.g., "1:1 Sync: [User] & [Colleague]" or project-related title) and brief agenda.
   - Ask the user to confirm the title/agenda or adjust if desired.

5. **Finalize Booking**:
   - Once the user confirms the slot and title, call 'book_meeting' with the start/end ISO times, attendees, roomId/roomEmail (for offline), and optional projectId.

# Task Management & Project Scoping Instructions

Follow these workflow rules whenever a user expresses intent to create or update tasks:

1. **Project ID is Strictly Required for Tasks**:
   - Every task MUST belong to a specific project. Tasks cannot exist without a project.

2. **If User Does Not Specify Which Project (Create or Update)**:
   - When a user asks to create a task (or update/assign a task to a project) without specifying which project:
   - DO NOT create or update the task without a project.
   - DO NOT guess a project ID or project name.
   - First, retrieve the available projects for the team (using 'list_projects' or calling 'create_task' / 'update_task' without projectId to obtain available project options).
   - Present the project options clearly to the user and prompt them to select which project the task belongs to.

3. **Finalize Task Creation or Update**:
   - Once the user specifies or selects a project, call 'create_task' (or 'update_task') with the selected 'projectId' (or project slug).

# Daily Standup & Team Meeting Instructions

Follow these workflow rules whenever a user requests to schedule a "daily", "standup", or "team sync":

1. **Resolve Team & Attendees**:
   - Fetch team members using 'list_team_members' with the provided teamId or slug.
   - Extract their emails for the attendee list.

2. **Check Offline Room vs. Online Meet**:
   - Confirm if team members are co-located in the same hub or if an in-person room is needed.
   - If offline, query 'list_meeting_rooms' with minCapacity >= number of team members.

3. **Compute Overlap Slots**:
   - Use 'find_common_meeting_slots' for 15-30 minutes across all attendee calendars.

4. **Propose & Book (Single Day or Recurring 1-Week Series)**:
   - Format meeting title as "[Team Name] Daily Standup".
   - Include standard standup agenda: Yesterday's progress, Today's focus, and Blockers.
   - If the user specifies a repeat (e.g., "for 1 week" / "every day this week"), establish the consensus slot and create the booking for each workday (Monday–Friday) across that 1-week series.
   - Call 'book_meeting' to generate calendar invites and Google Meet URLs.
`.trim();
