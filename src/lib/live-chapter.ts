import { chapters, chapterBySlug, type Chapter, type ContentBlock } from "@/lib/book-content";

export type ExampleOverride = {
  example_key: string;
  slug: string;
  title: string;
  body: string;
};

export function isExampleBlock(block: ContentBlock) {
  return (
    block.kind === "prompt" ||
    block.kind === "dialogue" ||
    block.kind === "rule" ||
    block.kind === "assignment"
  );
}

export function exampleKey(slug: string, index: number, block: ContentBlock) {
  if (!isExampleBlock(block)) return null;
  return `${slug}:${index}`;
}

export function examplePreview(block: ContentBlock) {
  if (block.kind === "prompt") return { kind: "prompt", title: block.title, body: block.text };
  if (block.kind === "rule") return { kind: "rule", title: block.title, body: block.text };
  if (block.kind === "assignment") return { kind: "assignment", title: "Assignment", body: block.text };
  if (block.kind === "dialogue") {
    const body = block.lines
      .map((l) => `${l.speaker} — ${l.direction}: "${l.line}"`)
      .join("\n");
    return { kind: "dialogue", title: "Dialogue", body };
  }
  return { kind: block.kind, title: "Example", body: "" };
}

function parseDialogue(body: string, fallback: Extract<ContentBlock, { kind: "dialogue" }>): ContentBlock {
  const lines = body
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const m = row.match(/^(.+?)\s+[—-]\s+([^:]+):\s*[“"]?(.+?)[”"]?$/);
      if (!m) return null;
      return { speaker: m[1].trim(), direction: m[2].trim(), line: m[3].trim() };
    })
    .filter((x): x is { speaker: string; direction: string; line: string } => Boolean(x));
  if (lines.length === 0) return fallback;
  return { kind: "dialogue", lines };
}

export function applyOverride(block: ContentBlock, override: ExampleOverride): ContentBlock {
  if (block.kind === "prompt") {
    return { kind: "prompt", title: override.title.trim() || block.title, text: override.body };
  }
  if (block.kind === "rule") {
    return { kind: "rule", title: override.title.trim() || block.title, text: override.body };
  }
  if (block.kind === "assignment") {
    return { kind: "assignment", text: override.body };
  }
  if (block.kind === "dialogue") {
    return parseDialogue(override.body, block);
  }
  return block;
}

export function mergeChapter(chapter: Chapter, overrides: ExampleOverride[]): Chapter {
  const map = new Map(overrides.map((o) => [o.example_key, o]));
  return {
    ...chapter,
    blocks: chapter.blocks.map((block, index) => {
      const key = exampleKey(chapter.slug, index, block);
      if (!key) return block;
      const hit = map.get(key);
      return hit ? applyOverride(block, hit) : block;
    }),
  };
}

export function catalogFor(slug?: string) {
  const list = slug ? chapters.filter((c) => c.slug === slug) : chapters;
  return list.flatMap((ch) =>
    ch.blocks.flatMap((block, index) => {
      const key = exampleKey(ch.slug, index, block);
      if (!key) return [];
      const preview = examplePreview(block);
      return [
        {
          key,
          slug: ch.slug,
          chapterId: ch.id,
          chapterTitle: ch.title,
          kind: preview.kind,
          title: preview.title,
          body: preview.body,
        },
      ];
    }),
  );
}

export function liveChapterBySlug(slug: string, overrides: ExampleOverride[]) {
  const chapter = chapterBySlug(slug);
  if (!chapter) return null;
  const relevant = overrides.filter((o) => o.slug === slug || o.example_key.startsWith(`${slug}:`));
  return mergeChapter(chapter, relevant);
}
