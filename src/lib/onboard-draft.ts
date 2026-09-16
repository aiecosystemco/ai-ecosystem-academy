const ONBOARD_KEY = "aea.onboard";

export type OnboardDraft = {
  role: "student" | "tutor";
  displayName: string;
  referral: string;
  batch: string;
};

export function writeOnboardDraft(draft: OnboardDraft) {
  sessionStorage.setItem(ONBOARD_KEY, JSON.stringify(draft));
}

export function readOnboardDraft(): OnboardDraft | null {
  try {
    const raw = sessionStorage.getItem(ONBOARD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardDraft;
  } catch {
    return null;
  }
}

export function clearOnboardDraft() {
  sessionStorage.removeItem(ONBOARD_KEY);
}
