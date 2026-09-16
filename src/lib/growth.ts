/** Student grade from finished tasks. No book prose. */

export const ROADMAP_COUNT = 30;
export const CHAPTER_COUNT = 22;

export type GrowthScore = {
  roadmapDone: number;
  chapterDone: number;
  done: number;
  total: number;
  percent: number;
  complete: boolean;
};

export function growthScore(opts: {
  roadmapDone: number;
  chapterDone: number;
  roadmapTotal?: number;
  chapterTotal?: number;
}): GrowthScore {
  const roadmapTotal = opts.roadmapTotal ?? ROADMAP_COUNT;
  const chapterTotal = opts.chapterTotal ?? CHAPTER_COUNT;
  const roadmapDone = Math.max(0, Math.min(roadmapTotal, Math.floor(opts.roadmapDone) || 0));
  const chapterDone = Math.max(0, Math.min(chapterTotal, Math.floor(opts.chapterDone) || 0));
  const done = roadmapDone + chapterDone;
  const total = roadmapTotal + chapterTotal;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return {
    roadmapDone,
    chapterDone,
    done,
    total,
    percent,
    complete: total > 0 && done >= total,
  };
}

export function certificateSerial(userId: string, issuedAt: Date) {
  const y = issuedAt.getUTCFullYear();
  const seed = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "CAMPUS";
  const day = String(issuedAt.getUTCDate()).padStart(2, "0");
  const month = String(issuedAt.getUTCMonth() + 1).padStart(2, "0");
  return `AEA-${y}${month}${day}-${seed}`;
}
