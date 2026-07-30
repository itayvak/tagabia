import { PLATOON_LABELS } from "@/lib/platoons";
import { TASK_CATEGORIES } from "@/lib/taskCategory";
import type { PublicCourseConfig } from "@/types/courseConfig";
import type {
  CommanderAssignmentSource,
  CommanderAssignmentStatus,
  CommanderDashboardBucket,
  CommanderDashboardCategory,
  CommanderDashboardData,
  CommanderDashboardMember,
  CommanderDashboardPersonStatus,
  CommanderDashboardRange,
  CommanderDashboardSource,
  CommanderDashboardTask,
  CommanderRepeatedLateMember,
} from "@/types/commanderDashboard";
import type { PublicTask } from "@/types/task";
import type { PublicUser } from "@/types/user";

const JERUSALEM_TIME_ZONE = "Asia/Jerusalem";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

interface AssignmentRow {
  member: PublicUser;
  task: PublicTask;
  dueDateKey: string;
  completedDateKey: string | null;
  status: CommanderAssignmentStatus;
  completedAt: string | null;
  assignmentSource: CommanderAssignmentSource;
}

export function getJerusalemDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JERUSALEM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateKeyToUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(dateKey: string, days: number): string {
  const date = dateKeyToUtc(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (dateKeyToUtc(to).getTime() - dateKeyToUtc(from).getTime()) / DAY_MS,
  );
}

function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateKeyToUtc(dateKey));
}

function formatRangeLabel(from: string, to: string): string {
  return `${formatDateKey(from)}–${formatDateKey(to)}`;
}

export function isCommanderDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  return dateKeyToUtc(value).toISOString().slice(0, 10) === value;
}

export function createCommanderRange(
  from: string,
  to: string,
  label = formatRangeLabel(from, to),
): CommanderDashboardRange {
  return {
    from,
    to,
    label,
    bucket: daysBetween(from, to) <= 30 ? "day" : "week",
  };
}

export function getDefaultCommanderRange(
  config: PublicCourseConfig | null,
  now = new Date(),
): CommanderDashboardRange {
  const today = getJerusalemDateKey(now);

  if (config && isCommanderDateKey(config.startDate) && config.weeks.length > 0) {
    const courseDay = daysBetween(config.startDate, today);
    const weekIndex = Math.floor(courseDay / 7);

    if (courseDay >= 0 && weekIndex < config.weeks.length) {
      const from = addDays(config.startDate, weekIndex * 7);
      const to = addDays(from, 6);
      return createCommanderRange(
        from,
        to,
        `${config.weeks[weekIndex].name} · ${formatRangeLabel(from, to)}`,
      );
    }
  }

  const todayUtc = dateKeyToUtc(today);
  const dayOfWeek = todayUtc.getUTCDay();
  const from = addDays(today, -dayOfWeek);
  return createCommanderRange(
    from,
    addDays(from, 6),
    `השבוע הנוכחי · ${formatRangeLabel(from, addDays(from, 6))}`,
  );
}

function calculatePercent(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function getAssignmentSource(
  member: PublicUser,
  task: PublicTask,
): CommanderAssignmentSource | null {
  const byTeam = task.assignedTeams.includes(member.team);
  const byDirectAssignment = task.assignedUsers.includes(member.id);

  if (byTeam && byDirectAssignment) {
    return "both";
  }

  if (byTeam) {
    return "team";
  }

  if (byDirectAssignment) {
    return "direct";
  }

  return null;
}

function getAssignmentStatus(
  task: PublicTask,
  completedAt: string | null,
  now: string,
): CommanderAssignmentStatus {
  if (completedAt) {
    return new Date(completedAt).getTime() <= new Date(task.dueDate).getTime()
      ? "onTime"
      : "late";
  }

  return new Date(task.dueDate).getTime() < new Date(now).getTime()
    ? "overdue"
    : "pending";
}

function buildAssignmentRows(source: CommanderDashboardSource): AssignmentRow[] {
  const rows: AssignmentRow[] = [];

  for (const task of source.tasks) {
    for (const member of source.members) {
      const assignmentSource = getAssignmentSource(member, task);
      if (!assignmentSource) {
        continue;
      }

      const completedAt = source.completions[task.id]?.[member.id] ?? null;
      rows.push({
        member,
        task,
        dueDateKey: getJerusalemDateKey(new Date(task.dueDate)),
        completedDateKey: completedAt
          ? getJerusalemDateKey(new Date(completedAt))
          : null,
        status: getAssignmentStatus(task, completedAt, source.now),
        completedAt,
        assignmentSource,
      });
    }
  }

  return rows;
}

function isCompleted(status: CommanderAssignmentStatus): boolean {
  return status === "onTime" || status === "late";
}

function buildBuckets(
  rows: AssignmentRow[],
  range: CommanderDashboardRange,
): CommanderDashboardBucket[] {
  const bucketStarts: string[] = [];
  const step = range.bucket === "day" ? 1 : 7;

  for (
    let current = range.from;
    current <= range.to;
    current = addDays(current, step)
  ) {
    bucketStarts.push(current);
  }

  return bucketStarts.map((bucketStart) => {
    const bucketEnd =
      range.bucket === "day"
        ? bucketStart
        : addDays(
            bucketStart,
            Math.min(6, daysBetween(bucketStart, range.to)),
          );
    const bucketRows = rows.filter(
      (row) =>
        row.dueDateKey >= bucketStart && row.dueDateKey <= bucketEnd,
    );

    return {
      key: bucketStart,
      label:
        range.bucket === "day"
          ? new Intl.DateTimeFormat("he-IL", {
              weekday: "short",
              day: "numeric",
              month: "numeric",
              timeZone: "UTC",
            }).format(dateKeyToUtc(bucketStart))
          : formatRangeLabel(bucketStart, bucketEnd),
      taskCount: new Set(bucketRows.map((row) => row.task.id)).size,
      assignmentCount: bucketRows.length,
      memberCount: new Set(bucketRows.map((row) => row.member.id)).size,
      completedCount: bucketRows.filter((row) => isCompleted(row.status)).length,
      onTimeCount: bucketRows.filter((row) => row.status === "onTime").length,
      overdueCount: bucketRows.filter((row) => row.status === "overdue").length,
      overdueMemberCount: new Set(
        bucketRows
          .filter((row) => row.status === "overdue")
          .map((row) => row.member.id),
      ).size,
    };
  });
}

function buildCategories(
  rows: AssignmentRow[],
): CommanderDashboardCategory[] {
  return TASK_CATEGORIES.map((category) => {
    const categoryRows = rows.filter((row) => row.task.category === category);
    const completedCount = categoryRows.filter((row) =>
      isCompleted(row.status),
    ).length;
    const memberIds = new Set(categoryRows.map((row) => row.member.id));
    const completedMemberCount = [...memberIds].filter((memberId) => {
      const memberRows = categoryRows.filter(
        (row) => row.member.id === memberId,
      );
      return (
        memberRows.length > 0 &&
        memberRows.every((row) => isCompleted(row.status))
      );
    }).length;

    return {
      category,
      taskCount: new Set(categoryRows.map((row) => row.task.id)).size,
      assignmentCount: categoryRows.length,
      memberCount: memberIds.size,
      completedMemberCount,
      completedCount,
      completionRate: calculatePercent(completedMemberCount, memberIds.size),
    };
  }).filter((entry) => entry.assignmentCount > 0);
}

function buildTaskMetric(rows: AssignmentRow[]): CommanderDashboardTask {
  const task = rows[0].task;
  const completedCount = rows.filter((row) => isCompleted(row.status)).length;

  const people: CommanderDashboardPersonStatus[] = rows
    .map((row) => ({
      userId: row.member.id,
      fullname: row.member.fullname,
      rank: row.member.rank,
      status: row.status,
      completedAt: row.completedAt,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) {
        const order: Record<CommanderAssignmentStatus, number> = {
          overdue: 0,
          pending: 1,
          late: 2,
          onTime: 3,
        };
        return order[a.status] - order[b.status];
      }
      return a.fullname.localeCompare(b.fullname, "he");
    });

  return {
    taskId: task.id,
    title: task.title,
    category: task.category,
    creatorName: task.creatorName,
    creatorRank: task.creatorRank,
    creatorRole: task.creatorRole,
    dueDate: task.dueDate,
    totalAssignments: rows.length,
    completedCount,
    onTimeCount: rows.filter((row) => row.status === "onTime").length,
    lateCount: rows.filter((row) => row.status === "late").length,
    pendingCount: rows.filter((row) => row.status === "pending").length,
    overdueCount: rows.filter((row) => row.status === "overdue").length,
    completionRate: calculatePercent(completedCount, rows.length),
    people,
  };
}

function buildBottlenecks(rows: AssignmentRow[]): CommanderDashboardTask[] {
  return buildTaskMetrics(rows)
    .filter((task) => task.completedCount < task.totalAssignments)
    .sort((a, b) => {
      const aMissing = a.totalAssignments - a.completedCount;
      const bMissing = b.totalAssignments - b.completedCount;
      if (aMissing !== bMissing) {
        return bMissing - aMissing;
      }
      if (a.completionRate !== b.completionRate) {
        return a.completionRate - b.completionRate;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);
}

function buildTaskMetrics(rows: AssignmentRow[]): CommanderDashboardTask[] {
  const rowsByTask = new Map<string, AssignmentRow[]>();
  for (const row of rows) {
    const taskRows = rowsByTask.get(row.task.id) ?? [];
    taskRows.push(row);
    rowsByTask.set(row.task.id, taskRows);
  }

  return [...rowsByTask.values()]
    .map(buildTaskMetric)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() ||
        a.title.localeCompare(b.title, "he"),
    );
}

function buildMembers(
  members: PublicUser[],
  periodRows: AssignmentRow[],
  allRows: AssignmentRow[],
): CommanderDashboardMember[] {
  return members
    .map((member) => {
      const memberPeriodRows = periodRows.filter(
        (row) => row.member.id === member.id,
      );
      const backlogRows = allRows.filter(
        (row) => row.member.id === member.id && row.status === "overdue",
      );
      const taskRows = new Map<string, AssignmentRow>();

      for (const row of [...memberPeriodRows, ...backlogRows]) {
        taskRows.set(row.task.id, row);
      }

      const completedCount = memberPeriodRows.filter((row) =>
        isCompleted(row.status),
      ).length;

      return {
        userId: member.id,
        fullname: member.fullname,
        rank: member.rank,
        role: member.role,
        platoon: member.platoon,
        team: member.team,
        assignmentCount: memberPeriodRows.length,
        completedCount,
        onTimeCount: memberPeriodRows.filter((row) => row.status === "onTime")
          .length,
        lateCount: memberPeriodRows.filter((row) => row.status === "late")
          .length,
        pendingCount: memberPeriodRows.filter((row) => row.status === "pending")
          .length,
        overdueCount: memberPeriodRows.filter(
          (row) => row.status === "overdue",
        ).length,
        overdueBacklogCount: backlogRows.length,
        completedAllTasks:
          memberPeriodRows.length > 0 &&
          completedCount === memberPeriodRows.length,
        completionRate: calculatePercent(
          completedCount,
          memberPeriodRows.length,
        ),
        tasks: [...taskRows.values()]
          .sort((a, b) => {
            const statusOrder: Record<CommanderAssignmentStatus, number> = {
              overdue: 0,
              pending: 1,
              late: 2,
              onTime: 3,
            };
            if (a.status !== b.status) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            return (
              new Date(a.task.dueDate).getTime() -
              new Date(b.task.dueDate).getTime()
            );
          })
          .map((row) => ({
            taskId: row.task.id,
            title: row.task.title,
            category: row.task.category,
            creatorName: row.task.creatorName,
            dueDate: row.task.dueDate,
            status: row.status,
            completedAt: row.completedAt,
            assignmentSource: row.assignmentSource,
            requiresCampusSubmission: row.task.requiresCampusSubmission,
            hasFormFields: row.task.hasFormFields,
          })),
      };
    })
    .sort((a, b) => {
      if (a.overdueBacklogCount !== b.overdueBacklogCount) {
        return b.overdueBacklogCount - a.overdueBacklogCount;
      }
      if (a.completionRate !== b.completionRate) {
        return a.completionRate - b.completionRate;
      }
      return a.fullname.localeCompare(b.fullname, "he");
    });
}

function buildRepeatedLateMembers(
  rows: AssignmentRow[],
  range: CommanderDashboardRange,
  now: string,
): CommanderRepeatedLateMember[] {
  const today = getJerusalemDateKey(new Date(now));
  const recentFrom = addDays(today, -13);
  const intersectionFrom =
    range.from > recentFrom ? range.from : recentFrom;
  const intersectionTo = range.to < today ? range.to : today;

  if (intersectionFrom > intersectionTo) {
    return [];
  }

  const lateCounts = new Map<
    string,
    { member: PublicUser; lateSubmissionCount: number }
  >();

  for (const row of rows) {
    if (
      row.status !== "late" ||
      !row.completedDateKey ||
      row.completedDateKey < intersectionFrom ||
      row.completedDateKey > intersectionTo
    ) {
      continue;
    }

    const current = lateCounts.get(row.member.id);
    lateCounts.set(row.member.id, {
      member: row.member,
      lateSubmissionCount: (current?.lateSubmissionCount ?? 0) + 1,
    });
  }

  return [...lateCounts.values()]
    .filter(({ lateSubmissionCount }) => lateSubmissionCount >= 2)
    .sort(
      (a, b) =>
        b.lateSubmissionCount - a.lateSubmissionCount ||
        a.member.fullname.localeCompare(b.member.fullname, "he"),
    )
    .map(({ member, lateSubmissionCount }) => ({
      userId: member.id,
      fullname: member.fullname,
      rank: member.rank,
      lateSubmissionCount,
    }));
}

function buildInsights(
  summary: CommanderDashboardData["summary"],
  bottlenecks: CommanderDashboardTask[],
  buckets: CommanderDashboardBucket[],
): string[] {
  const insights: string[] = [];

  if (summary.overdueBacklogCount > 0) {
    insights.push(
      `${summary.overdueMemberCount} חניכים טרם הגישו מטלה אחת לפחות שמועד ההגשה שלה עבר.`,
    );
  }

  const topBottleneck = bottlenecks[0];
  if (topBottleneck) {
    insights.push(
      `המטלה "${topBottleneck.title}" דורשת את מרב תשומת הלב: ${topBottleneck.completedCount} מתוך ${topBottleneck.totalAssignments} חניכים הגישו.`,
    );
  }

  const peakBucket = [...buckets].sort(
    (a, b) => b.memberCount - a.memberCount,
  )[0];
  if (peakBucket && peakBucket.memberCount > 0) {
    insights.push(
      `עומס ההגשות הגבוה ביותר חל ב־${peakBucket.label}: ל־${peakBucket.memberCount} חניכים יש מטלה להגשה.`,
    );
  }

  if (summary.overdueBacklogCount === 0 && summary.assignmentCount > 0) {
    insights.unshift("אין כרגע חניכים עם מטלה שמועד הגשתה עבר.");
  }

  return insights.slice(0, 3);
}

function toDashboardCsvRow(
  row: AssignmentRow,
): CommanderDashboardData["csvRows"][number] {
  return {
    userId: row.member.id,
    fullname: row.member.fullname,
    rank: row.member.rank,
    memberRole: row.member.role,
    platoon: row.member.platoon,
    team: row.member.team,
    taskId: row.task.id,
    taskTitle: row.task.title,
    category: row.task.category,
    creatorName: row.task.creatorName,
    creatorRole: row.task.creatorRole,
    dueDate: row.task.dueDate,
    status: row.status,
    completedAt: row.completedAt,
    assignmentSource: row.assignmentSource,
    requiresCampusSubmission: row.task.requiresCampusSubmission,
    hasFormFields: row.task.hasFormFields,
  };
}

export function buildCommanderDashboard(
  source: CommanderDashboardSource,
): CommanderDashboardData {
  const allRows = buildAssignmentRows(source);
  const periodRows = allRows.filter(
    (row) =>
      row.dueDateKey >= source.range.from &&
      row.dueDateKey <= source.range.to,
  );
  const completedCount = periodRows.filter((row) =>
    isCompleted(row.status),
  ).length;
  const onTimeCount = periodRows.filter(
    (row) => row.status === "onTime",
  ).length;
  const lateCount = periodRows.filter((row) => row.status === "late").length;
  const buckets = buildBuckets(periodRows, source.range);
  const bottlenecks = buildBottlenecks(periodRows);
  const members = buildMembers(source.members, periodRows, allRows);
  const overdueRows = allRows.filter((row) => row.status === "overdue");
  const duePeriodRows = periodRows.filter((row) => row.status !== "pending");
  const notOnTimeCount = duePeriodRows.filter(
    (row) => row.status === "late" || row.status === "overdue",
  ).length;
  const onTimeRate = calculatePercent(onTimeCount, duePeriodRows.length);
  const assignedMembers = members.filter(
    (member) => member.assignmentCount > 0,
  );
  const fullyCompletedMemberCount = assignedMembers.filter(
    (member) => member.completedAllTasks,
  ).length;
  const summary = {
    taskCount: new Set(periodRows.map((row) => row.task.id)).size,
    assignmentCount: periodRows.length,
    memberCount: source.members.length,
    assignedMemberCount: assignedMembers.length,
    fullyCompletedMemberCount,
    completedCount,
    submissionCount: completedCount,
    completionRate: calculatePercent(
      fullyCompletedMemberCount,
      assignedMembers.length,
    ),
    onTimeCount,
    onTimeRate,
    dueAssignmentCount: duePeriodRows.length,
    notOnTimeCount,
    notOnTimeRate:
      duePeriodRows.length === 0 ? 0 : 100 - onTimeRate,
    lateCount,
    lateSubmissionCount: lateCount,
    lateSubmissionRate: calculatePercent(lateCount, completedCount),
    pendingCount: periodRows.filter((row) => row.status === "pending").length,
    overdueInRangeCount: periodRows.filter(
      (row) => row.status === "overdue",
    ).length,
    overdueBacklogCount: overdueRows.length,
    overdueMemberCount: new Set(overdueRows.map((row) => row.member.id)).size,
  };

  return {
    generatedAt: source.now,
    scope: {
      team: source.commander.team,
      platoon: source.commander.platoon,
      teamName: `צוות ${source.commander.team} · פלוגת ${
        PLATOON_LABELS[source.commander.platoon]
      }`,
      memberCount: source.members.length,
    },
    range: source.range,
    summary,
    buckets,
    categories: buildCategories(periodRows),
    tasks: buildTaskMetrics(periodRows),
    bottlenecks,
    members,
    insights: buildInsights(summary, bottlenecks, buckets),
    repeatedLateMembers: buildRepeatedLateMembers(
      allRows,
      source.range,
      source.now,
    ),
    csvRows: periodRows.map(toDashboardCsvRow),
    overdueRows: overdueRows.map(toDashboardCsvRow),
  };
}

export function filterCommanderDashboardByTask(
  dashboard: CommanderDashboardData,
  taskId: string,
): CommanderDashboardData {
  const task = dashboard.tasks.find((entry) => entry.taskId === taskId);
  if (!task) {
    return dashboard;
  }

  const rows = dashboard.csvRows.filter((row) => row.taskId === taskId);
  const rowByUserId = new Map(rows.map((row) => [row.userId, row]));
  const assignedMembers = dashboard.members
    .filter((member) => rowByUserId.has(member.userId))
    .map((member) => {
      const row = rowByUserId.get(member.userId)!;
      const completed = isCompleted(row.status);
      const overdue = row.status === "overdue";

      return {
        ...member,
        assignmentCount: 1,
        completedCount: completed ? 1 : 0,
        onTimeCount: row.status === "onTime" ? 1 : 0,
        lateCount: row.status === "late" ? 1 : 0,
        pendingCount: row.status === "pending" ? 1 : 0,
        overdueCount: overdue ? 1 : 0,
        overdueBacklogCount: overdue ? 1 : 0,
        completedAllTasks: completed,
        completionRate: completed ? 100 : 0,
        tasks: member.tasks.filter(
          (memberTask) => memberTask.taskId === taskId,
        ),
      };
    })
    .sort(
      (a, b) =>
        b.overdueCount - a.overdueCount ||
        Number(a.completedAllTasks) - Number(b.completedAllTasks) ||
        a.fullname.localeCompare(b.fullname, "he"),
    );

  const completedCount = rows.filter((row) => isCompleted(row.status)).length;
  const onTimeCount = rows.filter((row) => row.status === "onTime").length;
  const lateCount = rows.filter((row) => row.status === "late").length;
  const overdueRows = rows.filter((row) => row.status === "overdue");
  const dueRows = rows.filter((row) => row.status !== "pending");
  const notOnTimeCount = dueRows.filter(
    (row) => row.status === "late" || row.status === "overdue",
  ).length;

  return {
    ...dashboard,
    summary: {
      taskCount: 1,
      assignmentCount: rows.length,
      memberCount: assignedMembers.length,
      assignedMemberCount: assignedMembers.length,
      fullyCompletedMemberCount: completedCount,
      completedCount,
      submissionCount: completedCount,
      completionRate: calculatePercent(completedCount, rows.length),
      onTimeCount,
      onTimeRate: calculatePercent(onTimeCount, dueRows.length),
      dueAssignmentCount: dueRows.length,
      notOnTimeCount,
      notOnTimeRate: calculatePercent(notOnTimeCount, dueRows.length),
      lateCount,
      lateSubmissionCount: lateCount,
      lateSubmissionRate: calculatePercent(lateCount, completedCount),
      pendingCount: rows.filter((row) => row.status === "pending").length,
      overdueInRangeCount: overdueRows.length,
      overdueBacklogCount: overdueRows.length,
      overdueMemberCount: overdueRows.length,
    },
    buckets: [],
    categories: [
      {
        category: task.category,
        taskCount: 1,
        assignmentCount: rows.length,
        memberCount: rows.length,
        completedMemberCount: completedCount,
        completedCount,
        completionRate: calculatePercent(completedCount, rows.length),
      },
    ],
    tasks: [task],
    bottlenecks:
      task.completedCount < task.totalAssignments ? [task] : [],
    members: assignedMembers,
    insights: [
      `${task.completedCount} מתוך ${task.totalAssignments} הצוערים המשויכים למטלה "${task.title}" השלימו אותה.`,
    ],
    repeatedLateMembers: [],
    csvRows: rows,
    overdueRows,
  };
}
