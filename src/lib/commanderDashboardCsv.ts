import { rowsToCsv } from "@/lib/csv";
import { getRoleLabel } from "@/lib/roles";
import type {
  CommanderAssignmentStatus,
  CommanderDashboardData,
} from "@/types/commanderDashboard";

const FIXED_HEADERS = [
  "מזהה",
  "דרגה",
  "שם",
  "תפקיד",
  "פלוגה",
  "צוות",
  "מטלות בתקופה",
  "מטלות שהוגשו",
  "הוגשו בזמן",
  "הוגשו באיחור",
  "לא הוגשו ומועד ההגשה עבר",
  "השלים/ה את כל מטלות התקופה",
] as const;

const STATUS_LABELS: Record<CommanderAssignmentStatus, string> = {
  onTime: "הוגש בזמן",
  late: "הוגש באיחור",
  pending: "טרם הוגש — המועד טרם עבר",
  overdue: "טרם הוגש — מועד ההגשה עבר",
};

function formatExportDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}

function buildTaskHeader(
  task: CommanderDashboardData["tasks"][number],
): string {
  return [
    `מטלה: ${task.title}`,
    `מועד הגשה: ${formatExportDate(task.dueDate)}`,
    `יוצר: ${task.creatorName} (${getRoleLabel(task.creatorRole)})`,
  ].join(" | ");
}

export function buildCommanderDashboardCsv(
  dashboard: CommanderDashboardData,
): string {
  const headers = [
    ...FIXED_HEADERS,
    ...dashboard.tasks.map(buildTaskHeader),
  ];

  const rows = dashboard.members.map((member) => {
    const assignmentsByTask = new Map(
      dashboard.csvRows
        .filter((row) => row.userId === member.userId)
        .map((row) => [row.taskId, row]),
    );

    const taskCells = dashboard.tasks.map((task) => {
      const assignment = assignmentsByTask.get(task.taskId);
      if (!assignment) {
        return "לא משויך/ת";
      }

      const status = STATUS_LABELS[assignment.status];
      return assignment.completedAt
        ? `${status} | מועד ביצוע: ${formatExportDate(assignment.completedAt)}`
        : status;
    });

    return [
      member.userId,
      member.rank,
      member.fullname,
      getRoleLabel(member.role),
      member.platoon,
      String(member.team),
      String(member.assignmentCount),
      String(member.completedCount),
      String(member.onTimeCount),
      String(member.lateCount),
      String(member.overdueCount),
      member.assignmentCount === 0
        ? "אין מטלות בתקופה"
        : member.completedAllTasks
          ? "כן"
          : "לא",
      ...taskCells,
    ];
  });

  return `\uFEFF${rowsToCsv(headers, rows)}`;
}

export function downloadCommanderDashboardCsv(
  dashboard: CommanderDashboardData,
): void {
  const csv = buildCommanderDashboardCsv(dashboard);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `commander-team-${dashboard.scope.team}-${dashboard.range.from}-${dashboard.range.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
