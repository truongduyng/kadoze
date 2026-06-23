# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `app/` directory using `bun`:

```bash
# Start dev server
bun run start

# Run on iOS simulator (targets iPhone 17)
bun run ios
# or from root:
make dev

# Lint
bun run lint

# Production build (EAS, iOS only)
bun run build
# or from root:
make build

# Submit to App Store
bun run submit
# or from root:
make submit
```

There is no test suite configured.

## Architecture Overview

**1Per** is an offline-first iOS/Android app (React Native + Expo SDK 55, React 19) built around the "10k Iteration Protocol" - habit tracking, daily focus, note capture, and routines in one unified workspace.

### Directory layout (inside `app/`)

```
app/           Expo Router file-based routes
  _layout.tsx  Root layout: ThemePreferenceProvider → ProfileInitializer → Stack
  (tabs)/      Bottom-tab shell using expo-router unstable-native-tabs (NativeTabs)
    index.tsx  Home / unified dashboard
    chat.tsx   Notes / quick capture (AI thread)
    routines.tsx  Habit tracker
    profile.tsx   Account & settings
  onboarding.tsx  First-run flow (gates app until complete)
  settings.tsx

components/    Presentational components, grouped by feature
contexts/      ThemeContext (system/light/dark preference stored in MMKV)
hooks/         Data + behavior hooks (useProfile, useOnboarding, useRevenueCat, etc.)
lib/
  db/
    schema.ts      Drizzle-ORM table definitions (single source of truth for types)
    database.ts    expo-sqlite connection + drizzle instance
    operations.ts  Typed CRUD helpers: profileOps, noteOps, habitOps, completionOps, focusOps, todoOps
    index.ts       Re-exports + initializeDatabase() + resetDatabase()
  storage.ts     MMKV instance (used for theme prefs and lightweight key-value state)
  notifications.ts, timezone.ts, timeCapsule.ts, performance.ts
constants/
  theme.ts     palette (charcoal + burnt orange), Colors, Fonts
```

### Data layer

- **SQLite via expo-sqlite + Drizzle ORM** - no remote sync; purely local.
- Schema tables: `profiles`, `notes`, `habits`, `habit_completions`, `daily_focus`, `todos`.
- `initializeDatabase()` runs `CREATE TABLE IF NOT EXISTS` on cold start via `ProfileInitializer`.
- `resetDatabase()` drops all tables and clears MMKV - used in dev/reset flows.
- Dates stored as `TEXT` (`'YYYY-MM-DD'`) for daily keys; timestamps stored as `INTEGER` (unix epoch).
- All DB operations go through the typed helpers in `lib/db/operations.ts`, never raw SQL in components.

### Startup / navigation flow

1. `_layout.tsx` wraps everything in `ThemePreferenceProvider` (MMKV-backed) and `ProfileInitializer`.
2. `ProfileInitializer` calls `initializeDatabase()` then checks for an existing profile.
   - No profile → create one → redirect to `/onboarding`.
   - Profile exists but `onboarding_completed = false` → redirect to `/onboarding`.
   - Otherwise → land on `(tabs)`.
3. Onboarding sets `onboarding_completed = true` on the profile row when finished.

### Theming

- Default theme is **dark**; user can override to `system` or `light` via `ThemePreferenceProvider`.
- Preference persisted in MMKV under key `theme_preference`.
- Color tokens live in `constants/theme.ts` (`palette`, `Colors`, `Fonts`). Use `palette.*` for direct color values and `Colors.dark.*` / `Colors.light.*` for semantic tokens.
- Tab bar uses native blur (`systemChromeMaterialDark`/`systemChromeMaterial`).

### Key libraries

| Library | Purpose |
|---|---|
| `expo-router` | File-based routing + unstable native tabs |
| `expo-sqlite` + `drizzle-orm` | Local SQLite database |
| `react-native-mmkv` | Fast key-value storage |
| `react-native-reanimated` + `react-native-gesture-handler` | Animations & gestures |
| `@shopify/react-native-skia` | Canvas/graphics |
| `react-native-purchases` | RevenueCat in-app purchases |
| `expo-notifications` | Push & local notifications |
| `react-native-keyboard-controller` | Keyboard-aware layouts |
