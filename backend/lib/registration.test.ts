import assert from "node:assert/strict";
import test from "node:test";
import { registrationAccount, registrationSchema } from "./registration.ts";

const input = { firstName: "  Ana ", lastName: " Cruz  ", email: " ANA@EXAMPLE.COM ", password: "ExamplePass123!", role: "Parent" };

test("registration normalizes identity and creates pending accounts without privileged fields", () => {
  for (const role of ["Parent", "Teacher"]) {
    const data = registrationSchema.parse({ ...input, role });
    const account = registrationAccount(data, "test-id", "2026-09-21T00:00:00Z");
    assert.equal(account.name, "Ana Cruz");
    assert.equal(account.email, "ana@example.com");
    assert.equal(account.role, role);
    assert.equal(account.status, "Pending");
    assert.equal(account.section, "");
    assert.equal(account.emailVerified, false);
    assert.equal("password" in account, false);
  }
});

test("public registration rejects elevated roles and caller-supplied approval", () => {
  for (const role of ["Super Admin", "Student", "admin"]) assert.equal(registrationSchema.safeParse({ ...input, role }).success, false);
  assert.equal(registrationSchema.safeParse({ ...input, status: "Active" }).success, false);
  assert.equal(registrationSchema.safeParse({ ...input, id: "existing-account" }).success, false);
});

test("registration rejects invalid identity and bcrypt-truncated passwords", () => {
  for (const patch of [{ firstName: " " }, { email: "invalid" }, { password: "short" }, { password: "a".repeat(73) }, { password: "é".repeat(37) }, { firstName: "a".repeat(50), lastName: "b".repeat(50) }]) {
    assert.equal(registrationSchema.safeParse({ ...input, ...patch }).success, false);
  }
});
