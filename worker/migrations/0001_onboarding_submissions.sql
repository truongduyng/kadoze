CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  pain_points TEXT NOT NULL,
  main_goal TEXT NOT NULL,
  keystone_habit TEXT NOT NULL,
  referral_source TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_received_at
  ON onboarding_submissions(received_at);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_referral_source
  ON onboarding_submissions(referral_source);
