import type { PublicTask } from "@/types/task";

export interface TaskReportEntry {
  task: PublicTask;
  completedCount: number;
  totalCount: number;
}
