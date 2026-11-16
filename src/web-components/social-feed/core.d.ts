// Types for core.js, a verbatim copy from cook-ssg (excluded from checkJs so it stays verbatim).
export function escapeHtml(s: unknown): string;
export function safeHttps(url: unknown): string | null;
export function normalizeBluesky(body: unknown, account: object): { items: any[]; cursor: string | null };
export function normalizeMastodon(statuses: unknown, account: object): { items: any[]; cursor: string | null };
export function normalizeGithubReleases(releases: unknown, repo: object, account: object): any[];
export function normalizeGithubEvents(events: unknown, account: object): any[];
export function matchesTags(item: unknown, tags?: string[]): boolean;
export function mergeItems(lists: unknown[][], options?: { tags?: string[]; limit?: number }): any[];
export function renderEntry(item: unknown, options?: { hideCounts?: boolean; serviceName?: string }): string;
export function renderFeedParts(options?: {
  items?: unknown[];
  accounts?: Array<{ service: string; profileUrl?: string | null }>;
  hideCounts?: boolean;
  services?: Record<string, { name: string }>;
}): { entries: string; empty: string; more: string };
