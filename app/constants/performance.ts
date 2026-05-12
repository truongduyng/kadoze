// Performance-related constants for heatmap and visualization

// Days of the week labels
export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// Month abbreviations
export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

// Grid configuration constants
export const GRID_CONSTANTS = {
  MIN_WEEKS: 53,
  SAFETY_BUFFER_WEEKS: 4,
  WEEK_START_DAY: 1, // Monday
  SQUARE_SIZE: 12,
  SQUARE_GAP: 2,
} as const;

// Color intensity thresholds for heatmap
export const COLOR_THRESHOLDS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 3,
  HIGH: 5,
} as const;