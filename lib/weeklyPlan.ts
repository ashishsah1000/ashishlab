/**
 * Structured AI plan stored (as JSON) in `goal_tasks.ai_suggestion`.
 * Client-safe: no db imports, so both API routes and client components can use it.
 * Older tasks hold a plain-text suggestion; `parseTaskPlan` returns null for those.
 */
export interface TaskPlan {
  v: 1;
  weekTarget: string; // What this milestone should achieve by the end of the week
  focus: string; // One-line summary of today's work
  why: string; // Reasoning grounded in the user's progress so far
  steps: string[]; // Concrete actions for the session
  deliverable: string; // Tangible output that proves the day is done
  generatedAt: string; // ISO timestamp
}

export function parseTaskPlan(aiSuggestion: string | null | undefined): TaskPlan | null {
  if (!aiSuggestion || !aiSuggestion.trimStart().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(aiSuggestion);
    if (parsed?.v === 1 && typeof parsed.focus === "string") {
      return {
        ...parsed,
        steps: Array.isArray(parsed.steps) ? parsed.steps.map(String) : [],
      } as TaskPlan;
    }
  } catch {
    // Not a plan; caller falls back to plain-text rendering
  }
  return null;
}

export function serializeTaskPlan(plan: Omit<TaskPlan, "v" | "generatedAt">): string {
  return JSON.stringify({ v: 1, ...plan, generatedAt: new Date().toISOString() } satisfies TaskPlan);
}
