/** Actions return a result for user-facing errors and throw only for authorization failures. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
