# Product Requirements Document (PRD)

**Product Name:** Kadoze

## 1. Product Vision & Objective

To provide a unified mobile workspace that seamlessly integrates unstructured idea capture (notes) with structured daily execution (planning and habits). Rooted in the 10k Iteration Protocol, the application empowers users to achieve lasting change through small, consistent, daily actions rather than overwhelming overhauls.

## 2. Problem Statement

Users currently fracture their focus across multiple applications: a note-taking app for ideas, a habit tracker for routines, and a calendar for daily planning. This fragmentation causes friction, leading to lost ideas, broken habits, and a lack of clear daily intention.

## 3. Target Audience

Professionals, solopreneurs, and continuous learners who need a distraction-free environment to organize their thoughts, track self-improvement goals, and execute daily tasks without cognitive overload.

## 4. Design & Technical Constraints

* **UI/UX:** Minimalist, distraction-free interface utilizing a charcoal and burnt orange palette to reduce eye strain while providing clear visual hierarchy.
* **Framework:** Cross-platform mobile development (React Native / Expo).
* **Backend & Sync:** Offline-first architecture with seamless cloud syncing via Supabase.

---

## 5. Functional Requirements (Core Features)

### 5.1. The 10k Iteration Engine (Onboarding & Gamification)

* **Progressive Locking:** New users are restricted to selecting only 1–2 daily habits initially.
* **Consistency Tracking:** The system tracks consecutive daily completions (iterations) rather than intensity or duration. Additional habit slots unlock only after a baseline of consistency is achieved.

### 5.2. Capture & Clarity (Notes)

* **Quick Capture:** A lock-screen widget and persistent quick-add button for instant text or voice capture.
* **Universal Search:** An advanced search engine capable of filtering by tags, dates, and text (including OCR for images).
* **Distraction-Free Editor:** A clean writing interface that hides all navigation elements during active typing.

### 5.3. Daily Planning & execution

* **Unified Dashboard:** A single daily view aggregating the "One Main Goal," active habits, and pinned notes for the day.
* **Single-Tasking Timer:** A Pomodoro-style focus timer that blocks in-app distractions to encourage deep work on a single objective.

### 5.4. Holistic Habit Modules

* **Mindfulness:** 5-minute timers for meditation or morning reflection.
* **Vitality:** Trackers for 30-minute intentional movement, daily water intake (2–3 liters), and sleep consistency alerts (7-8 hours).
* **Emotional Well-being:** A daily gratitude prompt requiring three short inputs, and a cognitive reframing text tool.
* **Evening Reset:** A gamified 10-minute timer for daily decluttering and a prompt to draft tomorrow's agenda.

---

## 6. User Flows

### Flow 1: First-Time Onboarding & Intention Setting

1. **Trigger:** User opens the app for the first time.
2. **Action:** User is greeted with the 10k Iteration philosophy and asked to define their primary life focus.
3. **Action:** System prompts the user to select only *one* keystone habit (e.g., 10-minute morning walk). All other habit categories are visually locked.
4. **Action:** User lands on the Unified Dashboard.
5. **Resolution:** The dashboard displays their selected habit and prompts them to set their "One Main Goal" for the current day.

### Flow 2: Quick Capture to Task Conversion

1. **Trigger:** User taps the lock-screen Quick Capture widget while on the go.
2. **Action:** A fast-loading text box appears. User types: "Review marketing copy for landing page."
3. **Action:** User hits "Save to Inbox."
4. **Action:** Later, user opens the app and navigates to the Inbox.
5. **Action:** User swipes right on the captured note.
6. **System Response:** Note transforms into an actionable task.
7. **Resolution:** User assigns the task to "Tomorrow's Planner," clearing the inbox.

### Flow 3: The Single-Tasking Deep Work Session

1. **Trigger:** User selects their "One Main Goal" from the daily dashboard.
2. **Action:** User taps the "Focus" button next to the goal.
3. **System Response:** The UI strips away all navigation tabs, displaying only the goal text, a charcoal background with burnt orange accents, and a 25-minute timer.
4. **Action:** Timer reaches zero.
5. **System Response:** A subtle chime plays. The system logs 1 iteration towards the user's focus habit.
6. **Resolution:** User is prompted to take a 5-minute break or immediately log the task as complete.

### Flow 4: The Evening Reset

1. **Trigger:** System sends a push notification at 8:00 PM: "Time for your daily reset."
2. **Action:** User taps the notification and opens the app.
3. **System Response:** The Evening Reset screen appears, featuring the 10-Minute Declutter Timer.
4. **Action:** User starts the timer and cleans their physical workspace.
5. **Action:** Timer finishes; user confirms completion.
6. **System Response:** App transitions to the "Tomorrow's Planner" screen.
7. **Resolution:** User selects tomorrow's "One Main Goal" and sets their morning habit intent, completing the daily loop.
