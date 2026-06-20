export const GAME_AVATARS = [
  {
    id: "game:spark-mage",
    name: "Spark Mage",
    source: require("@/assets/images/avatars/spark-mage.png"),
  },
  {
    id: "game:forest-scout",
    name: "Forest Scout",
    source: require("@/assets/images/avatars/forest-scout.png"),
  },
  {
    id: "game:moon-monk",
    name: "Moon Monk",
    source: require("@/assets/images/avatars/moon-monk.png"),
  },
  {
    id: "game:tiny-robot",
    name: "Tiny Robot",
    source: require("@/assets/images/avatars/tiny-robot.png"),
  },
  {
    id: "game:fire-runner",
    name: "Fire Runner",
    source: require("@/assets/images/avatars/fire-runner.png"),
  },
  {
    id: "game:water-guardian",
    name: "Water Guardian",
    source: require("@/assets/images/avatars/water-guardian.png"),
  },
  {
    id: "game:star-bard",
    name: "Star Bard",
    source: require("@/assets/images/avatars/star-bard.png"),
  },
  {
    id: "game:cloud-knight",
    name: "Cloud Knight",
    source: require("@/assets/images/avatars/cloud-knight.png"),
  },
] as const;

export type GameAvatarId = (typeof GAME_AVATARS)[number]["id"];

export function getGameAvatar(id: string | null | undefined) {
  return GAME_AVATARS.find((avatar) => avatar.id === id);
}
