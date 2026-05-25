interface Env {
  DB: D1Database;
}

interface OnboardingSubmission {
  profileId: number | null;
  name: string;
  avatar: string;
  painPoints: string[];
  mainGoal: string;
  keystoneHabit: string;
  referralSource: string;
  completedAt: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...init.headers,
    },
  });
}

function badRequest(message: string) {
  return json({ ok: false, error: message }, { status: 400 });
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseSubmission(value: unknown): OnboardingSubmission | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Partial<OnboardingSubmission>;
  const profileId =
    typeof data.profileId === "number" || data.profileId === null
      ? data.profileId
      : null;

  if (
    !isString(data.name) ||
    !isString(data.avatar) ||
    !Array.isArray(data.painPoints) ||
    !data.painPoints.every(isString) ||
    !isString(data.mainGoal) ||
    !isString(data.keystoneHabit) ||
    !isString(data.referralSource) ||
    !isString(data.completedAt)
  ) {
    return null;
  }

  return {
    profileId,
    name: data.name.slice(0, 120),
    avatar: data.avatar.slice(0, 120),
    painPoints: data.painPoints.slice(0, 3).map((item) => item.slice(0, 240)),
    mainGoal: data.mainGoal.slice(0, 1000),
    keystoneHabit: data.keystoneHabit.slice(0, 120),
    referralSource: data.referralSource.slice(0, 120),
    completedAt: data.completedAt,
  };
}

async function handleOnboarding(request: Request, env: Env) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const submission = parseSubmission(payload);
  if (!submission) {
    return badRequest("Invalid onboarding payload.");
  }

  await env.DB.prepare(
    `INSERT INTO onboarding_submissions (
      profile_id,
      name,
      avatar,
      pain_points,
      main_goal,
      keystone_habit,
      referral_source,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      submission.profileId,
      submission.name,
      submission.avatar,
      JSON.stringify(submission.painPoints),
      submission.mainGoal,
      submission.keystoneHabit,
      submission.referralSource,
      submission.completedAt,
    )
    .run();

  return json({ ok: true }, { status: 201 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/api/onboarding") {
      return handleOnboarding(request, env);
    }

    return json({ ok: false, error: "Not found." }, { status: 404 });
  },
};
