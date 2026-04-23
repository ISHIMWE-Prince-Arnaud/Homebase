import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, updateProfileSchema } from "./schema";

describe("loginSchema", () => {
  it("passes with valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("fails with invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("fails with empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });
});

describe("registerSchema", () => {
  it("passes with valid input", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "secret123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword"
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Passwords don't match");
    }
  });

  it("fails with short password", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "abc",
      confirmPassword: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "password"
      );
      expect(issue).toBeDefined();
    }
  });

  it("fails with short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("passes with valid partial input (name only)", () => {
    const result = updateProfileSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("passes with both currentPassword and newPassword", () => {
    const result = updateProfileSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("fails when newPassword is provided without currentPassword", () => {
    const result = updateProfileSchema.safeParse({
      newPassword: "newpass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "currentPassword"
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("Current password is required");
    }
  });

  it("passes with empty object (no changes)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
