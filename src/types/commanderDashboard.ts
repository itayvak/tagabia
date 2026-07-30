import type { TaskCategory } from "@/lib/taskCategory";
import type { Platoon, PublicUser, Role } from "@/types/user";

export type CommanderAssignmentStatus =
  | "onTime"
  | "late"
  | "pending"
  | "overdue";

export type CommanderAssignmentSource = "team" | "direct" | "both";

export interface CommanderDashboardRange {
  from: string;
  to: string;
  label: string;
  bucket: "day" | "week";
}

export interface CommanderDashboardScope {
  team: number;
  platoon: Platoon;
  teamName: string;
  memberCount: number;
}

export interface CommanderDashboardSummary {
  taskCount: number;
  assignmentCount: number;
  memberCount: number;
  assignedMemberCount: number;
  fullyCompletedMemberCount: number;
  completedCount: number;
  submissionCount: number;
  completionRate: number;
  onTimeCount: number;
  onTimeRate: number;
  dueAssignmentCount: number;
  notOnTimeCount: number;
  notOnTimeRate: number;
  lateCount: number;
  lateSubmissionCount: number;
  lateSubmissionRate: number;
  pendingCount: number;
  overdueInRangeCount: number;
  overdueBacklogCount: number;
  overdueMemberCount: number;
}

export interface CommanderDashboardBucket {
  key: string;
  label: string;
  taskCount: number;
  assignmentCount: number;
  memberCount: number;
  completedCount: number;
  onTimeCount: number;
  overdueCount: number;
  overdueMemberCount: number;
}

export interface CommanderDashboardCategory {
  category: TaskCategory;
  taskCount: number;
  assignmentCount: number;
  memberCount: number;
  completedMemberCount: number;
  completedCount: number;
  completionRate: number;
}

export interface CommanderRepeatedLateMember {
  userId: string;
  fullname: string;
  rank: string;
  lateSubmissionCount: number;
}

export interface CommanderDashboardPersonStatus {
  userId: string;
  fullname: string;
  rank: string;
  status: CommanderAssignmentStatus;
  completedAt: string | null;
}

export interface CommanderDashboardTask {
  taskId: string;
  title: string;
  category: TaskCategory;
  creatorName: string;
  creatorRank: string;
  creatorRole: Role;
  dueDate: string;
  totalAssignments: number;
  completedCount: number;
  onTimeCount: number;
  lateCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
  people: CommanderDashboardPersonStatus[];
}

export interface CommanderMemberTask {
  taskId: string;
  title: string;
  category: TaskCategory;
  creatorName: string;
  dueDate: string;
  status: CommanderAssignmentStatus;
  completedAt: string | null;
  assignmentSource: CommanderAssignmentSource;
  requiresCampusSubmission: boolean;
  hasFormFields: boolean;
}

export interface CommanderDashboardMember {
  userId: string;
  fullname: string;
  rank: string;
  role: Role;
  platoon: Platoon;
  team: number;
  assignmentCount: number;
  completedCount: number;
  onTimeCount: number;
  lateCount: number;
  pendingCount: number;
  overdueCount: number;
  overdueBacklogCount: number;
  completedAllTasks: boolean;
  completionRate: number;
  tasks: CommanderMemberTask[];
}

export interface CommanderDashboardCsvRow {
  userId: string;
  fullname: string;
  rank: string;
  memberRole: Role;
  platoon: Platoon;
  team: number;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  creatorName: string;
  creatorRole: Role;
  dueDate: string;
  status: CommanderAssignmentStatus;
  completedAt: string | null;
  assignmentSource: CommanderAssignmentSource;
  requiresCampusSubmission: boolean;
  hasFormFields: boolean;
}

export interface CommanderDashboardData {
  generatedAt: string;
  scope: CommanderDashboardScope;
  range: CommanderDashboardRange;
  summary: CommanderDashboardSummary;
  buckets: CommanderDashboardBucket[];
  categories: CommanderDashboardCategory[];
  tasks: CommanderDashboardTask[];
  bottlenecks: CommanderDashboardTask[];
  members: CommanderDashboardMember[];
  insights: string[];
  repeatedLateMembers: CommanderRepeatedLateMember[];
  csvRows: CommanderDashboardCsvRow[];
  overdueRows: CommanderDashboardCsvRow[];
}

export interface CommanderDashboardSuccessResponse {
  dashboard: CommanderDashboardData;
}

export interface CommanderDashboardErrorResponse {
  error: string;
}

export interface CommanderDashboardSource {
  commander: PublicUser;
  members: PublicUser[];
  tasks: import("@/types/task").PublicTask[];
  completions: Record<string, Record<string, string>>;
  range: CommanderDashboardRange;
  now: string;
}
