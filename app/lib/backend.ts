const WORKER_URL =
  process.env.EXPO_PUBLIC_CLOUDFLARE_WORKER_URL ??
  process.env.EXPO_PUBLIC_BACKEND_URL;
const REQUEST_TIMEOUT_MS = 8000;

export interface OnboardingSubmission {
  profileId: number | null;
  name: string;
  avatar: string;
  painPoints: string[];
  mainGoal: string;
  keystoneHabit: string;
  referralSource: string;
  completedAt: string;
}

function endpoint(path: string) {
  if (!WORKER_URL) return null;
  return `${WORKER_URL.replace(/\/$/, "")}${path}`;
}

async function postJson(path: string, body: unknown) {
  const url = endpoint(path);
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Backend request failed with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitOnboarding(data: OnboardingSubmission) {
  await postJson("/api/onboarding", data);
}

export interface ProofVerificationResult {
  verified: boolean;
  message: string;
}

export async function verifyProofOfWork(
  imageBase64: string,
  habitTitle: string,
): Promise<ProofVerificationResult> {
  const url = endpoint("/api/verify-proof");
  if (!url) {
    return { verified: true, message: "Verification unavailable offline." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, habitTitle }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { verified: true, message: "Could not verify — marked done." };
    }

    const data = await response.json() as ProofVerificationResult;
    return data;
  } catch {
    return { verified: true, message: "Could not verify — marked done." };
  } finally {
    clearTimeout(timeout);
  }
}
