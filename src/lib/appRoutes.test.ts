import { describe, expect, it } from "vitest";
import { getUserHomePath, isCommanderAllowedPage } from "@/lib/appRoutes";

describe("commander routing", () => {
  it("uses the commander dashboard as the commander home", () => {
    expect(getUserHomePath({ role: "commander" })).toBe("/commander");
    expect(getUserHomePath({ role: "peasant" })).toBe("/allTasks");
  });

  it("allows commanders only on login and dashboard pages", () => {
    expect(isCommanderAllowedPage("/")).toBe(true);
    expect(isCommanderAllowedPage("/commander")).toBe(true);
    expect(isCommanderAllowedPage("/allTasks")).toBe(false);
    expect(isCommanderAllowedPage("/tasks/[taskId]")).toBe(false);
    expect(isCommanderAllowedPage("/admin")).toBe(false);
  });
});
