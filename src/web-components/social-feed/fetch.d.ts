// Types for fetch.js, a verbatim copy from cook-ssg (excluded from checkJs so it stays verbatim).
type FetchOptions = {
  fetch: (url: string, init?: object) => Promise<any>;
  cursor?: string | null;
  timeoutMs?: number;
  token?: string;
  mode?: 'build' | 'browser';
  headers?: Record<string, string>;
};
type Page = { items: any[]; cursor: string | null; done: boolean };
export function fetchAccountPage(account: object, options: FetchOptions): Promise<Page>;
export function collectItems(account: object, options: FetchOptions & { tags?: string[]; want?: number }): Promise<Page>;
