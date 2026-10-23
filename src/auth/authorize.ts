import { getStore } from "../db/store";

export type Role = "admin" | "service_advisor" | "technician";

export interface Session {
  userId: string;
  tenantId: string;
  role: Role;
}

export type Intent = "read" | "write";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "read_only" | "unknown_tenant",
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Every action calls this before touching the store.
 *
 * The default intent is "write". A suspended tenant may still read its own
 * data, but every write is refused, so read-only actions must say so with
 * `{ intent: "read" }`.
 */
export function authorizeAction(
  session: Session,
  roles: readonly Role[],
  options: { intent?: Intent } = {},
): void {
  const intent = options.intent ?? "write";
  const tenant = getStore().tenants.get(session.tenantId);
  if (!tenant) {
    throw new AuthorizationError(`Unknown tenant ${session.tenantId}`, "unknown_tenant");
  }
  if (!roles.includes(session.role)) {
    throw new AuthorizationError(`Role ${session.role} may not perform this action`, "forbidden");
  }
  if (intent === "write" && tenant.status === "suspended") {
    throw new AuthorizationError("Tenant is read-only while suspended", "read_only");
  }
}
