import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "../db/store";
import { AuthorizationError, authorizeAction, type Session } from "./authorize";

const advisor: Session = { userId: "u1", tenantId: "t_active", role: "service_advisor" };
const suspendedAdmin: Session = { userId: "u2", tenantId: "t_suspended", role: "admin" };

beforeEach(() => {
  const store = resetStore();
  store.seedTenant({ id: "t_active", name: "Northline Auto", status: "active" });
  store.seedTenant({ id: "t_suspended", name: "Pine Street Motors", status: "suspended" });
});

describe("authorizeAction", () => {
  it("allows a listed role to write on an active tenant", () => {
    expect(() => authorizeAction(advisor, ["service_advisor"])).not.toThrow();
  });
  it("refuses a role that is not listed", () => {
    expect(() => authorizeAction(advisor, ["admin"])).toThrow(
      expect.objectContaining({ code: "forbidden" }),
    );
  });
  it("refuses writes on a suspended tenant", () => {
    expect(() => authorizeAction(suspendedAdmin, ["admin"])).toThrow(
      expect.objectContaining({ code: "read_only" }),
    );
  });
  it("still allows reads on a suspended tenant", () => {
    expect(() => authorizeAction(suspendedAdmin, ["admin"], { intent: "read" })).not.toThrow();
  });
  it("refuses an unknown tenant before checking the role", () => {
    const ghost: Session = { userId: "u3", tenantId: "t_missing", role: "admin" };
    expect(() => authorizeAction(ghost, ["admin"])).toThrow(AuthorizationError);
    expect(() => authorizeAction(ghost, ["admin"])).toThrow(
      expect.objectContaining({ code: "unknown_tenant" }),
    );
  });
});
