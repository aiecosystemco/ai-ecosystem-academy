export const BOOK = {
  title: "Prompt Engineering & AI Content Creation Editing 101",
  series: "Practical Creator Series",
  author: "Daniel Christopher",
  handle: "@Brownigweco",
  priceNgn: "₦5,000",
  priceUsd: "US$3.78",
} as const;

export const GENERATOR_TOOLS = [
  "ChatGPT",
  "Grok",
  "Gemini",
  "Google Flow",
  "Midjourney",
  "Leonardo",
  "Flux",
  "Higgsfield",
  "Kling",
  "Runway",
  "Luma",
  "Pika",
  "Veo",
  "CapCut",
  "ElevenLabs",
  "Suno",
  "Other",
] as const;

export type GeneratorTool = (typeof GENERATOR_TOOLS)[number];

export const BIBLE_FIELDS = [
  "name",
  "age",
  "gender",
  "appearance",
  "hair",
  "eyes",
  "build",
  "wardrobe",
  "personality",
  "visualStyle",
  "props",
] as const;

export type BibleField = (typeof BIBLE_FIELDS)[number];

export const BIBLE_LABELS: Record<BibleField, string> = {
  name: "Name",
  age: "Age",
  gender: "Gender",
  appearance: "Appearance",
  hair: "Hair",
  eyes: "Eyes",
  build: "Build",
  wardrobe: "Wardrobe",
  personality: "Personality",
  visualStyle: "Visual style",
  props: "Important props",
};

export const FORMULA_PARTS = [
  { key: "subject", label: "Subject", hint: "Who or what is the audience seeing? Name, age, body, wardrobe, identity lock." },
  { key: "action", label: "Action", hint: "What is happening now? One verb. Walk. Sit. Look. Reach." },
  { key: "environment", label: "Environment", hint: "Where is the scene taking place? City, interior, weather, time." },
  { key: "camera", label: "Camera", hint: "How should the audience see it? Close-up, medium, wide, tracking." },
  { key: "lighting", label: "Lighting", hint: "Kind of light, time and atmosphere. Sunrise, practical lamps, neon." },
  { key: "emotion", label: "Emotion", hint: "What should the subject and audience feel?" },
  { key: "style", label: "Style", hint: "Photorealistic, cinematic, documentary, commercial…" },
  { key: "format", label: "Format", hint: "Vertical 9:16 or landscape 16:9. Aspect ratio is composition." },
] as const;

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "learn"; items: string[] }
  | { kind: "steps"; items: { title: string; body: string }[] }
  | { kind: "rule"; title: string; text: string }
  | { kind: "prompt"; title: string; text: string }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "pipeline"; items: string[] }
  | { kind: "assignment"; text: string }
  | { kind: "formula"; text: string }
  | { kind: "dialogue"; lines: { speaker: string; direction: string; line: string }[] };

export type Chapter = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  minutes: number;
  blocks: ContentBlock[];
};
