import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === "string" && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">{errorMessage(error)}</p>
      <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-md bg-brass px-4 text-sm font-medium text-brass-fg"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
        <a
          href="/"
          className="inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline"
        >
          Back to the academy
        </a>
      </div>
    </main>
  );
}

export function AppNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 text-center text-fg">
      <div className="max-w-sm space-y-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-brass">Academy</p>
        <h1 className="font-display text-3xl tracking-tight">Page not found</h1>
        <p className="text-sm text-muted">That link is not part of this academy.</p>
        <a
          href="/"
          className="inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline"
        >
          Back to the academy
        </a>
      </div>
    </main>
  );
}
