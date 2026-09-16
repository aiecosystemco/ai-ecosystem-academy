/** Official generator links students open to practice. Not book prose. */

export const TOOL_CATEGORIES = [
  { id: "chat", label: "Chat", hint: "Write and refine prompts" },
  { id: "image", label: "Image", hint: "Still frames and art" },
  { id: "video", label: "Video", hint: "Clips and camera moves" },
  { id: "audio", label: "Voice & music", hint: "Voiceover and songs" },
  { id: "automation", label: "Automation", hint: "Connect tools together" },
  { id: "agent", label: "Agents", hint: "Let the model run the work" },
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]["id"];

export type PracticeTool = {
  id: string;
  name: string;
  category: ToolCategory;
  blurb: string;
  web: string;
  ios?: string;
  android?: string;
  desktop?: string;
  how: string;
  updatedAt?: string;
  active?: boolean;
  sortOrder?: number;
};

const SEEDED_AT = "2026-09-07T06:00:00.000Z";

const CATALOG: PracticeTool[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "chat",
    blurb: "Draft prompts, character bibles, and shot lists.",
    web: "https://chatgpt.com",
    ios: "https://apps.apple.com/app/chatgpt/id6448311069",
    android: "https://play.google.com/store/apps/details?id=com.openai.chatgpt",
    desktop: "https://chatgpt.com/download",
    how: "Website on a computer, official iPhone or Android app on a phone, Windows/Mac desktop app from ChatGPT.",
  },
  {
    id: "grok",
    name: "Grok",
    category: "chat",
    blurb: "xAI chat — also generates images and video inside the same app.",
    web: "https://grok.com",
    ios: "https://apps.apple.com/app/grok/id6670324846",
    android: "https://play.google.com/store/apps/details?id=ai.x.grok",
    how: "Opens Grok. On iPhone or Android, the Grok app is the fastest path.",
  },
  {
    id: "gemini",
    name: "Gemini",
    category: "chat",
    blurb: "Google chat. Image and Veo video live here on a phone.",
    web: "https://gemini.google.com",
    ios: "https://apps.apple.com/app/google-gemini/id6475988169",
    android: "https://play.google.com/store/apps/details?id=com.google.android.apps.bard",
    how: "Opens Gemini. Ask it to generate an image or a Veo clip.",
  },
  {
    id: "chatgpt-image",
    name: "ChatGPT Images",
    category: "image",
    blurb: "Generate stills inside ChatGPT — its own image studio, not just chat.",
    web: "https://chatgpt.com",
    ios: "https://apps.apple.com/app/chatgpt/id6448311069",
    android: "https://play.google.com/store/apps/details?id=com.openai.chatgpt",
    desktop: "https://chatgpt.com/download",
    how: "Open ChatGPT and ask it to generate an image. Save the still back in Studio.",
  },
  {
    id: "grok-image",
    name: "Grok Imagine",
    category: "image",
    blurb: "xAI image generation inside Grok.",
    web: "https://grok.com",
    ios: "https://apps.apple.com/app/grok/id6670324846",
    android: "https://play.google.com/store/apps/details?id=ai.x.grok",
    how: "Open Grok, switch to Imagine, paste your still prompt.",
  },
  {
    id: "gemini-image",
    name: "Gemini Images",
    category: "image",
    blurb: "Google image generation inside Gemini.",
    web: "https://gemini.google.com",
    ios: "https://apps.apple.com/app/google-gemini/id6475988169",
    android: "https://play.google.com/store/apps/details?id=com.google.android.apps.bard",
    how: "Open Gemini and ask it to generate an image.",
  },
  {
    id: "google-flow-image",
    name: "Google Flow Images",
    category: "image",
    blurb: "Google Flow stills — the same studio used for Veo filmmaking.",
    web: "https://labs.google/flow",
    how: "Open Flow on a computer. Set generation type to Image, then generate.",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    category: "image",
    blurb: "Cinematic stills and look development.",
    web: "https://www.midjourney.com",
    how: "Sign in on the Midjourney website (computer or phone browser) and open Imagine.",
  },
  {
    id: "leonardo",
    name: "Leonardo",
    category: "image",
    blurb: "Image studio with character consistency tools.",
    web: "https://app.leonardo.ai",
    how: "Opens the Leonardo workspace in your browser.",
  },
  {
    id: "flux",
    name: "Flux",
    category: "image",
    blurb: "Photoreal stills from Black Forest Labs.",
    web: "https://playground.bfl.ai",
    how: "Opens the official FLUX playground. Sign in and paste your prompt.",
  },
  {
    id: "higgsfield",
    name: "Higgsfield",
    category: "image",
    blurb: "Cinematic camera control and character lock.",
    web: "https://higgsfield.ai",
    how: "Opens Higgsfield. Use it for stills and camera-led video.",
  },
  {
    id: "google-flow",
    name: "Google Flow",
    category: "video",
    blurb: "Google filmmaking studio — Veo video with scene control.",
    web: "https://labs.google/flow",
    how: "Open Flow on a computer. Set generation type to Video, then generate.",
  },
  {
    id: "grok-video",
    name: "Grok Video",
    category: "video",
    blurb: "xAI image-to-video and Imagine video inside Grok.",
    web: "https://grok.com",
    ios: "https://apps.apple.com/app/grok/id6670324846",
    android: "https://play.google.com/store/apps/details?id=ai.x.grok",
    how: "Open Grok, use Imagine for video, then save a still back in Studio.",
  },
  {
    id: "veo",
    name: "Gemini Veo",
    category: "video",
    blurb: "Google Veo through the Gemini app — fastest on a phone.",
    web: "https://gemini.google.com",
    ios: "https://apps.apple.com/app/google-gemini/id6475988169",
    android: "https://play.google.com/store/apps/details?id=com.google.android.apps.bard",
    how: "Open Gemini and ask for a Veo video. On a computer, Google Flow is the full studio.",
  },
  {
    id: "kling",
    name: "Kling",
    category: "video",
    blurb: "Image-to-video and text-to-video with motion control.",
    web: "https://kling.ai",
    how: "Opens Kling. Paste the prompt from the chapter, then save a still back in Studio.",
  },
  {
    id: "runway",
    name: "Runway",
    category: "video",
    blurb: "Shot-by-shot video workspace.",
    web: "https://app.runwayml.com",
    how: "Opens Runway. Generate the clip, then upload a still to your chapter notebook.",
  },
  {
    id: "luma",
    name: "Luma",
    category: "video",
    blurb: "Dream Machine — cinematic video from text or image.",
    web: "https://lumalabs.ai/dream-machine",
    how: "Opens Luma Dream Machine in the browser.",
  },
  {
    id: "pika",
    name: "Pika",
    category: "video",
    blurb: "Short social clips from a prompt or still.",
    web: "https://pika.art",
    how: "Opens Pika. Good for fast 9:16 tests.",
  },
  {
    id: "capcut",
    name: "CapCut",
    category: "video",
    blurb: "Edit, caption, and finish the clip you generated.",
    web: "https://www.capcut.com",
    ios: "https://apps.apple.com/app/capcut-photo-video-editor/id1500855883",
    android: "https://play.google.com/store/apps/details?id=com.lemon.lvoverseas",
    desktop: "https://www.capcut.com/activity/download_pc",
    how: "Web for computer, the CapCut app for phone, or the Windows/Mac installer.",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "audio",
    blurb: "Voiceover and speech from a script — Make it accessible on computer and phone.",
    web: "https://elevenlabs.io",
    ios: "https://apps.apple.com/app/elevenlabs-ai-voice-generator/id6743162587",
    android: "https://play.google.com/store/apps/details?id=io.elevenlabs.coreapp",
    how: "Website on a computer. Official iPhone and Android apps for voiceover on a phone. Paste dialogue and generate a voice.",
  },
  {
    id: "suno",
    name: "Suno",
    category: "audio",
    blurb: "Songs and beds from a text prompt.",
    web: "https://suno.com",
    ios: "https://apps.apple.com/app/suno-ai-songs-music/id6474078353",
    android: "https://play.google.com/store/apps/details?id=com.suno.android",
    how: "Website on a computer. Official Suno app on iPhone and Android. Create the track, then bring it into CapCut.",
  },
  {
    id: "make",
    name: "Make",
    category: "automation",
    blurb: "Connect generators so one prompt can trigger the next step.",
    web: "https://www.make.com",
    how: "Opens Make. Build a scenario that hands work between your tools.",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "automation",
    blurb: "No-code automations between the apps you already use.",
    web: "https://zapier.com",
    how: "Opens Zapier. Useful when you want a repeatable posting or saving flow.",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    blurb: "Self-serve workflows for more technical students.",
    web: "https://n8n.io",
    how: "Opens n8n. Use cloud or self-host if you want full control.",
  },
  {
    id: "chatgpt-agent",
    name: "ChatGPT Agent",
    category: "agent",
    blurb: "Have ChatGPT run a multi-step task instead of only answering.",
    web: "https://chatgpt.com",
    ios: "https://apps.apple.com/app/chatgpt/id6448311069",
    android: "https://play.google.com/store/apps/details?id=com.openai.chatgpt",
    desktop: "https://chatgpt.com/download",
    how: "Open ChatGPT, then choose Agent from the tools menu (or type /agent).",
  },
  {
    id: "grok-agent",
    name: "Grok Agent",
    category: "agent",
    blurb: "Hand Grok a job — research, image, video — and let it carry it.",
    web: "https://grok.com",
    ios: "https://apps.apple.com/app/grok/id6670324846",
    android: "https://play.google.com/store/apps/details?id=ai.x.grok",
    how: "Open Grok and describe the whole task, not one prompt at a time.",
  },
];

export const PRACTICE_TOOLS: PracticeTool[] = CATALOG.map((t, i) => ({
  ...t,
  updatedAt: t.updatedAt ?? SEEDED_AT,
  active: t.active ?? true,
  sortOrder: t.sortOrder ?? (i + 1) * 10,
}));

export const FEATURED_TOOL_IDS = [
  "chatgpt",
  "grok",
  "gemini",
  "chatgpt-image",
  "grok-image",
  "gemini-image",
  "google-flow-image",
  "google-flow",
  "grok-video",
  "veo",
  "kling",
  "capcut",
  "elevenlabs",
  "suno",
] as const;

export const ACCESSIBLE_TOOL_IDS = ["elevenlabs", "capcut", "suno", "chatgpt"] as const;

const NAME_ALIASES: Record<string, string> = {
  ChatGPT: "chatgpt",
  Grok: "grok",
  Gemini: "gemini",
  "ChatGPT Images": "chatgpt-image",
  "Grok Imagine": "grok-image",
  "Gemini Images": "gemini-image",
  "Google Flow Images": "google-flow-image",
  "Google Flow": "google-flow",
  "Grok Video": "grok-video",
  "Gemini Veo": "veo",
  Veo: "veo",
  Midjourney: "midjourney",
  Leonardo: "leonardo",
  Flux: "flux",
  Higgsfield: "higgsfield",
  Kling: "kling",
  Runway: "runway",
  Luma: "luma",
  Pika: "pika",
  CapCut: "capcut",
  ElevenLabs: "elevenlabs",
  Suno: "suno",
};

export function isToolCategory(value: string): value is ToolCategory {
  return TOOL_CATEGORIES.some((c) => c.id === value);
}

export function toolByName(name: string, catalog: PracticeTool[] = PRACTICE_TOOLS) {
  const id = NAME_ALIASES[name] ?? name.toLowerCase().replace(/\s+/g, "-");
  return catalog.find((t) => t.id === id || t.name === name) ?? null;
}

export function toolsIn(category: ToolCategory, catalog: PracticeTool[] = PRACTICE_TOOLS) {
  return catalog.filter((t) => t.category === category && t.active !== false);
}

export function formatToolDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function slugForTool(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || `tool-${Date.now().toString(36)}`;
}

function truthyFlag(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

export function mapPracticeToolRow(row: {
  id: string;
  name: string;
  category: string;
  blurb: string;
  web: string;
  ios?: string | null;
  android?: string | null;
  desktop?: string | null;
  how: string;
  updated_at?: string | Date | null;
  active?: unknown;
  sort_order?: number | string | null;
}): PracticeTool | null {
  if (!isToolCategory(row.category)) return null;
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : row.updated_at
        ? String(row.updated_at)
        : undefined;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    blurb: row.blurb,
    web: row.web,
    ios: row.ios || undefined,
    android: row.android || undefined,
    desktop: row.desktop || undefined,
    how: row.how,
    updatedAt,
    active: row.active === undefined || row.active === null ? true : truthyFlag(row.active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}
