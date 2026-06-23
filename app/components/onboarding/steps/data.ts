import { Ionicons } from "@expo/vector-icons";
import React from "react";

export const PAIN_FOCUS_META = {
  mindset: { label: "Mindset", icon: "person-outline" },
  work: { label: "Work", icon: "briefcase-outline" },
  health: { label: "Health", icon: "star-outline" },
  relations: { label: "Relationships", icon: "heart-outline" },
  creative: { label: "Creativity", icon: "sparkles-outline" },
  finance: { label: "Money", icon: "cash-outline" },
} satisfies Record<string, { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }>;
export const PAIN_FOCUS_ORDER = ["mindset", "work", "health", "relations", "creative", "finance"] as const;

export const PAIN_MAPPINGS = [
  {
    focus: "mindset",
    pain: "My mind won't stop racing",
    habitId: "journal",
    reason: "Gets thoughts out of your head and onto paper",
  },
  {
    focus: "work",
    pain: "I start strong, then fall off",
    habitId: "plan",
    reason: "A nightly plan makes tomorrow easier to follow through on",
  },
  {
    focus: "work",
    pain: "I lose hours to my phone",
    habitId: "nophone",
    reason: "Keeps your first hour phone-free and intentional",
  },
  {
    focus: "health",
    pain: "I'm exhausted before the day begins",
    habitId: "walk",
    reason: "10 minutes outside resets your energy and nervous system",
  },
  {
    focus: "work",
    pain: "I have ideas but never execute",
    habitId: "mit",
    reason: "Forces you to name the one thing that actually matters",
  },
  {
    focus: "mindset",
    pain: "I've tried every app and nothing sticks",
    habitId: "quiet",
    reason: "5 minutes of stillness beats another complicated system",
  },
  {
    focus: "health",
    pain: "My body feels stiff and low-energy",
    habitId: "stretch",
    reason: "A tiny morning stretch tells your body the day has started",
  },
  {
    focus: "health",
    pain: "I keep sleeping later than I want",
    habitId: "sleep",
    reason: "A clear lights-out habit protects tomorrow's focus",
  },
  {
    focus: "health",
    pain: "I forget basic self-care",
    habitId: "water",
    reason: "Hydration is a small physical win you can repeat daily",
  },
  {
    focus: "mindset",
    pain: "I focus on what's wrong all day",
    habitId: "gratitude",
    reason: "A gratitude rep trains your attention toward what's working",
  },
  {
    focus: "mindset",
    pain: "I want to grow but keep scrolling instead",
    habitId: "read",
    reason: "10 pages gives your attention somewhere worth going",
  },
  {
    focus: "work",
    pain: "My workday is reactive",
    habitId: "pomodoro",
    reason: "One focused sprint creates a protected pocket of deep work",
  },
  {
    focus: "relations",
    pain: "I feel disconnected from people",
    habitId: "connect",
    reason: "One genuine message keeps relationships warm without pressure",
  },
  {
    focus: "relations",
    pain: "I'm present physically, but not mentally",
    habitId: "offline",
    reason: "Phone-free meals create a small daily pocket of presence",
  },
  {
    focus: "relations",
    pain: "I listen to reply, not understand",
    habitId: "listen",
    reason: "Practicing listening makes your conversations feel calmer",
  },
  {
    focus: "creative",
    pain: "My creativity keeps getting postponed",
    habitId: "create",
    reason: "Even 10 minutes of making keeps the creative signal alive",
  },
  {
    focus: "creative",
    pain: "Good ideas disappear before I use them",
    habitId: "capture",
    reason: "Capturing one idea a day builds trust with your imagination",
  },
  {
    focus: "finance",
    pain: "My money feels vague and stressful",
    habitId: "review",
    reason: "A spending review turns vague stress into visible choices",
  },
  {
    focus: "finance",
    pain: "I spend before I think",
    habitId: "save",
    reason: "Saving first makes the better choice automatic",
  },
  {
    focus: "finance",
    pain: "I avoid looking at my finances",
    habitId: "track",
    reason: "Tracking one goal gives your money a clear direction",
  },
] satisfies {
  focus: keyof typeof PAIN_FOCUS_META;
  pain: string;
  habitId: string;
  reason: string;
}[];
export const PAIN_POINTS = PAIN_MAPPINGS.map((item) => item.pain);
export const PAIN_POINT_SET = new Set(PAIN_POINTS);
export const PAIN_SECTIONS = PAIN_FOCUS_ORDER.map((focus) => ({
  focus,
  ...PAIN_FOCUS_META[focus],
  items: PAIN_MAPPINGS.filter((item) => item.focus === focus),
}));
export const PAIN_TO_HABIT = PAIN_MAPPINGS.reduce<Record<string, { id: string; reason: string }>>(
  (acc, item) => {
    acc[item.pain] = { id: item.habitId, reason: item.reason };
    return acc;
  },
  {},
);

export const PAIN_HARM: Record<string, { harm: string; cost: string }> = {
  "My mind won't stop racing": {
    harm: "Racing thoughts drain your willpower before the day even starts.",
    cost: "You end each day exhausted - not from doing too much, but from thinking too much.",
  },
  "I start strong, then fall off": {
    harm: "Every restart costs more motivation than the last one.",
    cost: "Over time you stop starting at all, because you already know how it ends.",
  },
  "I lose hours to my phone": {
    harm: "Scrolling feels like rest - but it leaves you more depleted than before.",
    cost: "The hours lost aren't just time. They're the version of you that never showed up.",
  },
  "I'm exhausted before the day begins": {
    harm: "Running on empty means every task takes twice the effort.",
    cost: "Your best thinking - creative, strategic, clear - never makes it out.",
  },
  "I have ideas but never execute": {
    harm: "Unused potential turns into quiet frustration.",
    cost: "The longer ideas sit unbuilt, the harder it is to believe you'll ever act on them.",
  },
  "I've tried every app and nothing sticks": {
    harm: "Each failed system chips away at your trust in yourself.",
    cost: "Eventually you stop trying - and call it 'just how I am'.",
  },
  "My body feels stiff and low-energy": {
    harm: "Physical inertia compounds into mental fog and low mood.",
    cost: "You tolerate your days instead of feeling alive in them.",
  },
  "I keep sleeping later than I want": {
    harm: "A late start means a reactive day - you're always catching up.",
    cost: "Mornings are your highest-leverage hours. You're spending them unconscious.",
  },
  "I forget basic self-care": {
    harm: "Neglecting small things signals to your brain that you don't matter.",
    cost: "When basics slip, everything else gets harder - focus, mood, resilience.",
  },
  "I focus on what's wrong all day": {
    harm: "A negative lens makes every obstacle feel bigger than it is.",
    cost: "You're solving problems that don't exist while the real ones compound.",
  },
  "I want to grow but keep scrolling instead": {
    harm: "Passive consumption quietly replaces the ambition you used to feel.",
    cost: "A year from now, the gap between who you are and who you wanted to be will be wider.",
  },
  "My workday is reactive": {
    harm: "Without a plan, everyone else's urgency becomes your priority.",
    cost: "You're busy all day and can't name a single thing that actually moved forward.",
  },
  "I feel disconnected from people": {
    harm: "Isolation compounds - the less you connect, the harder it gets.",
    cost: "Relationships atrophy slowly. By the time you notice, distance feels normal.",
  },
  "I'm present physically, but not mentally": {
    harm: "Half-presence is its own kind of absence.",
    cost: "People notice. And so do you - in the quiet moments after they've gone.",
  },
  "I listen to reply, not understand": {
    harm: "Conversations become transactions instead of connections.",
    cost: "You stop being someone people feel heard by. Closeness fades.",
  },
  "My creativity keeps getting postponed": {
    harm: "Creative energy doesn't wait - it redirects into anxiety.",
    cost: "The longer you postpone, the more it feels like something you 'used to do'.",
  },
  "Good ideas disappear before I use them": {
    harm: "Lost ideas aren't just forgotten - they erode your confidence in your own mind.",
    cost: "You start thinking you're not creative. You are. You're just not capturing.",
  },
  "My money feels vague and stressful": {
    harm: "Financial vagueness is its own kind of drain - always present, never resolved.",
    cost: "Stress without clarity leads to avoidance. Avoidance makes everything worse.",
  },
  "I spend before I think": {
    harm: "Impulse spending isn't just financial - it's a pattern of self-sabotage.",
    cost: "Every unplanned purchase is a vote against the future version of you.",
  },
  "I avoid looking at my finances": {
    harm: "What you don't measure, you can't change.",
    cost: "Avoidance feels safe until it isn't. By then, the problem is twice as big.",
  },
};

export const DEFAULT_HARM = {
  harm: "Letting this go unaddressed means the pattern deepens over time.",
  cost: "Small problems compound. What feels manageable today becomes a ceiling tomorrow.",
};

export const FAST_WINS = [
  {
    icon: "sunny-outline" as const,
    title: "In 7 days",
    lines: ["Clearer focus", "Fewer distractions", "Daily momentum"],
  },
  {
    icon: "calendar-outline" as const,
    title: "In 30 days",
    lines: ["Visible consistency", "Stronger routines", "Calmer mind"],
  },
  {
    icon: "flag-outline" as const,
    title: "In 90 days",
    lines: ["Identity shift", "Deep work habit", "Self-trust"],
  },
];

export const TRUST_AVATARS = [
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=56",
];

export const TRUST_REVIEWS = [
  {
    name: "Maya",
    role: "Founder",
    avatar: "https://i.pravatar.cc/96?img=5",
    text: "It helped me stop turning every thought into a giant to-do list.",
  },
  {
    name: "Daniel",
    role: "Designer",
    avatar: "https://i.pravatar.cc/96?img=15",
    text: "The capture, focus, reflect loop feels calm enough to actually stick with.",
  },
  {
    name: "Anika",
    role: "Student",
    avatar: "https://i.pravatar.cc/96?img=44",
    text: "I use it when my day feels noisy. It gets me back to one clear next step.",
  },
];

export const DEFAULT_GOAL_SUGGESTIONS = [
  "Finish one important task",
  "Plan tomorrow before bed",
  "Take a 10-minute walk",
];

export const GOAL_SUGGESTIONS_BY_FOCUS = {
  mindset: ["Journal for 5 minutes", "Do one quiet reset", "Read 10 pages"],
  work: ["Finish one important task", "Do one focused sprint", "Plan tomorrow before bed"],
  health: ["Take a 10-minute walk", "Drink water first", "Stretch for 5 minutes"],
  relations: ["Send one thoughtful message", "Have one phone-free meal", "Listen without interrupting"],
  creative: ["Make for 10 minutes", "Capture one idea", "Finish one small draft"],
  finance: ["Review today's spending", "Save a small amount", "Track one money goal"],
} satisfies Record<keyof typeof PAIN_FOCUS_META, string[]>;

export const GOAL_SUGGESTIONS_BY_PAIN: Record<string, string> = {
  "My mind won't stop racing": "Journal for 5 minutes",
  "I start strong, then fall off": "Plan tomorrow before bed",
  "I lose hours to my phone": "Start phone-free for 1 hour",
  "I'm exhausted before the day begins": "Take a 10-minute walk",
  "I have ideas but never execute": "Finish one important task",
  "I've tried every app and nothing sticks": "Do one tiny habit today",
  "My body feels stiff and low-energy": "Stretch for 5 minutes",
  "I keep sleeping later than I want": "Set tonight's lights-out time",
  "I forget basic self-care": "Drink water first",
  "I focus on what's wrong all day": "Write 3 good things",
  "I want to grow but keep scrolling instead": "Read 10 pages",
  "My workday is reactive": "Do one focused sprint",
  "I feel disconnected from people": "Send one thoughtful message",
  "I'm present physically, but not mentally": "Have one phone-free meal",
  "I listen to reply, not understand": "Listen without interrupting",
  "My creativity keeps getting postponed": "Make for 10 minutes",
  "Good ideas disappear before I use them": "Capture one idea",
  "My money feels vague and stressful": "Review today's spending",
  "I spend before I think": "Save a small amount",
  "I avoid looking at my finances": "Track one money goal",
};

export function getGoalSuggestions(focusAreas: string[], painPoints: string[]) {
  const suggestions = [
    ...painPoints.map((pain) => GOAL_SUGGESTIONS_BY_PAIN[pain]).filter(Boolean),
    ...focusAreas.flatMap((focus) =>
      focus in GOAL_SUGGESTIONS_BY_FOCUS
        ? GOAL_SUGGESTIONS_BY_FOCUS[focus as keyof typeof GOAL_SUGGESTIONS_BY_FOCUS]
        : [],
    ),
    ...DEFAULT_GOAL_SUGGESTIONS,
  ];

  return Array.from(new Set(suggestions)).slice(0, 4);
}
