import { describe, expect, it } from "vitest";
import {
  buildCommanderDashboard,
  createCommanderRange,
  filterCommanderDashboardByTask,
  getDefaultCommanderRange,
} from "@/lib/commanderDashboard";
import { buildCommanderDashboardCsv } from "@/lib/commanderDashboardCsv";
import { parseCsv } from "@/lib/csv";
import type { PublicTask } from "@/types/task";
import type { PublicUser } from "@/types/user";

function user(
  id: string,
  team: number,
  role: PublicUser["role"] = "peasant",
): PublicUser {
  return {
    id,
    fullname: `User ${id}`,
    rank: "צוער",
    role,
    platoon: team <= 4 ? "A" : "B",
    team,
  };
}

function task(
  id: string,
  dueDate: string,
  assignedTeams: number[],
  assignedUsers: string[] = [],
): PublicTask {
  return {
    id,
    title: `Task ${id}`,
    content: "",
    category: "אחר",
    creatorId: "creator",
    creatorName: "Creator",
    creatorRank: "סגן",
    creatorRole: "tuitionTeam",
    dueDate,
    assignedTeams,
    assignedUsers,
    hasFormFields: false,
    requiresCampusSubmission: false,
    media: [],
  };
}

describe("commander dashboard aggregation", () => {
  it("deduplicates team/direct assignments and classifies timing", () => {
    const commander = user("commander", 5, "commander");
    const first = user("first", 5);
    const second = user("second", 5);
    const dashboard = buildCommanderDashboard({
      commander,
      members: [first, second],
      tasks: [
        task("team", "2026-07-10T12:00:00.000Z", [5]),
        task("direct", "2026-07-08T12:00:00.000Z", [], ["first"]),
        task("both", "2026-07-11T12:00:00.000Z", [5], ["first"]),
      ],
      completions: {
        team: {
          first: "2026-07-10T10:00:00.000Z",
          second: "2026-07-10T13:00:00.000Z",
        },
      },
      range: createCommanderRange("2026-07-01", "2026-07-12"),
      now: "2026-07-09T12:00:00.000Z",
    });

    expect(dashboard.summary.taskCount).toBe(3);
    expect(dashboard.summary.assignmentCount).toBe(5);
    expect(dashboard.summary.completedCount).toBe(2);
    expect(dashboard.summary.onTimeCount).toBe(1);
    expect(dashboard.summary.lateCount).toBe(1);
    expect(dashboard.summary.onTimeRate).toBe(33);
    expect(dashboard.summary.notOnTimeCount).toBe(2);
    expect(dashboard.summary.notOnTimeRate).toBe(67);
    expect(dashboard.summary.lateSubmissionRate).toBe(50);
    expect(dashboard.summary.memberCount).toBe(2);
    expect(dashboard.summary.assignedMemberCount).toBe(2);
    expect(dashboard.summary.fullyCompletedMemberCount).toBe(0);
    expect(dashboard.summary.completionRate).toBe(0);
    expect(dashboard.summary.overdueInRangeCount).toBe(1);
    expect(dashboard.tasks).toHaveLength(3);
    expect(dashboard.tasks.map((entry) => entry.taskId)).toEqual([
      "direct",
      "team",
      "both",
    ]);
    expect(
      dashboard.buckets.find((bucket) => bucket.assignmentCount > 1)
        ?.memberCount,
    ).toBe(2);
    expect(dashboard.categories[0].memberCount).toBe(2);
    expect(
      dashboard.csvRows.filter((row) => row.taskId === "both"),
    ).toHaveLength(2);
    expect(
      dashboard.csvRows.find(
        (row) => row.taskId === "both" && row.userId === "first",
      )?.assignmentSource,
    ).toBe("both");
  });

  it("keeps overdue backlog outside the selected range", () => {
    const commander = user("commander", 5, "commander");
    const member = user("member", 5);
    const dashboard = buildCommanderDashboard({
      commander,
      members: [member],
      tasks: [task("old", "2026-06-01T12:00:00.000Z", [5])],
      completions: {},
      range: createCommanderRange("2026-07-01", "2026-07-07"),
      now: "2026-07-03T12:00:00.000Z",
    });

    expect(dashboard.summary.assignmentCount).toBe(0);
    expect(dashboard.summary.overdueBacklogCount).toBe(1);
    expect(dashboard.summary.overdueMemberCount).toBe(1);
    expect(dashboard.overdueRows).toHaveLength(1);
    expect(dashboard.overdueRows[0]).toMatchObject({
      userId: "member",
      taskId: "old",
      status: "overdue",
    });
    expect(dashboard.summary.onTimeRate).toBe(0);
    expect(dashboard.summary.notOnTimeRate).toBe(0);
    expect(dashboard.summary.lateSubmissionRate).toBe(0);
    expect(dashboard.members[0].overdueBacklogCount).toBe(1);
    expect(dashboard.members[0].tasks[0].taskId).toBe("old");
  });

  it("uses the configured course week as the default", () => {
    const range = getDefaultCommanderRange(
      {
        startDate: "2026-06-01",
        weeks: [
          { weekId: "one", name: "שבוע ראשון", image: "" },
          { weekId: "two", name: "שבוע שני", image: "" },
        ],
      },
      new Date("2026-06-10T12:00:00.000Z"),
    );

    expect(range.from).toBe("2026-06-08");
    expect(range.to).toBe("2026-06-14");
    expect(range.label).toContain("שבוע שני");
  });

  it("switches long custom ranges to weekly buckets", () => {
    const range = createCommanderRange("2026-06-01", "2026-07-15");
    expect(range.bucket).toBe("week");
  });

  it("counts distinct cadets instead of multiplying cadets by tasks", () => {
    const commander = user("commander", 5, "commander");
    const first = user("first", 5);
    const second = user("second", 5);
    const dashboard = buildCommanderDashboard({
      commander,
      members: [first, second],
      tasks: [
        task("one", "2026-07-20T12:00:00.000Z", [5]),
        task("two", "2026-07-20T15:00:00.000Z", [5]),
      ],
      completions: {},
      range: createCommanderRange("2026-07-20", "2026-07-20"),
      now: "2026-07-19T12:00:00.000Z",
    });

    expect(dashboard.summary.assignmentCount).toBe(4);
    expect(dashboard.summary.memberCount).toBe(2);
    expect(dashboard.buckets[0].assignmentCount).toBe(4);
    expect(dashboard.buckets[0].memberCount).toBe(2);
    expect(dashboard.categories[0].assignmentCount).toBe(4);
    expect(dashboard.categories[0].memberCount).toBe(2);
  });

  it("finds every cadet with two late submissions in the selected recent window", () => {
    const commander = user("commander", 5, "commander");
    const first = { ...user("first", 5), fullname: "אורי" };
    const second = { ...user("second", 5), fullname: "בר" };
    const dashboard = buildCommanderDashboard({
      commander,
      members: [first, second],
      tasks: [
        task("recent-one", "2026-07-18T08:00:00.000Z", [5]),
        task("recent-two", "2026-07-20T08:00:00.000Z", [5]),
        task("old", "2026-07-14T08:00:00.000Z", [5]),
        task("older-due", "2026-07-13T08:00:00.000Z", [], ["first"]),
      ],
      completions: {
        "recent-one": {
          first: "2026-07-19T08:00:00.000Z",
          second: "2026-07-19T09:00:00.000Z",
        },
        "recent-two": {
          first: "2026-07-21T08:00:00.000Z",
          second: "2026-07-22T08:00:00.000Z",
        },
        old: {
          first: "2026-07-16T08:00:00.000Z",
        },
        "older-due": {
          first: "2026-07-18T10:00:00.000Z",
        },
      },
      range: createCommanderRange("2026-07-15", "2026-07-30"),
      now: "2026-07-30T12:00:00.000Z",
    });

    expect(dashboard.repeatedLateMembers).toEqual([
      {
        userId: "first",
        fullname: "אורי",
        rank: "צוער",
        lateSubmissionCount: 3,
      },
      {
        userId: "second",
        fullname: "בר",
        rank: "צוער",
        lateSubmissionCount: 2,
      },
    ]);
  });

  it("defines completion as cadets who finished every assigned task in range", () => {
    const commander = user("commander", 5, "commander");
    const first = user("first", 5);
    const second = user("second", 5);
    const dashboard = buildCommanderDashboard({
      commander,
      members: [first, second],
      tasks: [
        task("one", "2026-07-20T08:00:00.000Z", [5]),
        task("two", "2026-07-21T08:00:00.000Z", [5]),
      ],
      completions: {
        one: {
          first: "2026-07-19T08:00:00.000Z",
          second: "2026-07-19T08:00:00.000Z",
        },
        two: {
          first: "2026-07-20T08:00:00.000Z",
        },
      },
      range: createCommanderRange("2026-07-20", "2026-07-21"),
      now: "2026-07-22T08:00:00.000Z",
    });

    expect(dashboard.summary.assignedMemberCount).toBe(2);
    expect(dashboard.summary.fullyCompletedMemberCount).toBe(1);
    expect(dashboard.summary.completionRate).toBe(50);
    expect(dashboard.members.find((member) => member.userId === "first"))
      .toMatchObject({ completedAllTasks: true });
    expect(dashboard.members.find((member) => member.userId === "second"))
      .toMatchObject({ completedAllTasks: false });
    expect(dashboard.categories[0]).toMatchObject({
      memberCount: 2,
      completedMemberCount: 1,
      completionRate: 50,
    });
  });

  it("exports one Excel-friendly row per cadet with Hebrew roles and task columns", () => {
    const commander = user("commander", 5, "commander");
    const first = user("first", 5);
    const second = user("second", 5);
    const dashboard = buildCommanderDashboard({
      commander,
      members: [first, second],
      tasks: [task("team", "2026-07-20T08:00:00.000Z", [5])],
      completions: {
        team: {
          first: "2026-07-19T08:00:00.000Z",
        },
      },
      range: createCommanderRange("2026-07-20", "2026-07-20"),
      now: "2026-07-21T08:00:00.000Z",
    });

    const rows = parseCsv(buildCommanderDashboardCsv(dashboard));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain("תפקיד");
    expect(rows[0].some((header) => header.includes("ק. הדרכה צוותי"))).toBe(
      true,
    );
    const firstRow = rows.find((row) => row[0] === "first");
    const secondRow = rows.find((row) => row[0] === "second");
    expect(firstRow?.[3]).toBe("צוער");
    expect(secondRow?.[3]).toBe("צוער");
    expect(firstRow?.some((cell) => cell.includes("הוגש בזמן"))).toBe(true);
    expect(
      secondRow?.some((cell) =>
        cell.includes("טרם הוגש — מועד ההגשה עבר"),
      ),
    ).toBe(true);
  });

  it("projects every dashboard view and export row onto one selected task", () => {
    const commander = user("commander", 5, "commander");
    const first = user("first", 5);
    const second = user("second", 5);
    const dashboard = buildCommanderDashboard({
      commander,
      members: [first, second],
      tasks: [
        task("selected", "2026-07-20T08:00:00.000Z", [5]),
        task("other", "2026-07-21T08:00:00.000Z", [], ["first"]),
      ],
      completions: {
        selected: {
          first: "2026-07-19T08:00:00.000Z",
        },
        other: {
          first: "2026-07-20T08:00:00.000Z",
        },
      },
      range: createCommanderRange("2026-07-20", "2026-07-21"),
      now: "2026-07-22T08:00:00.000Z",
    });

    const filtered = filterCommanderDashboardByTask(dashboard, "selected");

    expect(filtered.summary.taskCount).toBe(1);
    expect(filtered.summary.memberCount).toBe(2);
    expect(filtered.summary.fullyCompletedMemberCount).toBe(1);
    expect(filtered.summary.completionRate).toBe(50);
    expect(filtered.summary.notOnTimeCount).toBe(1);
    expect(filtered.tasks.map((entry) => entry.taskId)).toEqual(["selected"]);
    expect(filtered.csvRows.every((row) => row.taskId === "selected")).toBe(
      true,
    );
    expect(filtered.members).toHaveLength(2);
    expect(filtered.categories).toHaveLength(1);
  });
});
