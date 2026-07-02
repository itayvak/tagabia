import { fetchTaskCompletions } from "@/lib/fetchTaskCompletions";
import { renderTaskReportImage } from "@/lib/renderTaskReportImage";
import { shareImageFile, type ShareImageResult } from "@/lib/shareImageFile";
import type {
  ListTaskCompletionsSuccessResponse,
  PublicTask,
} from "@/types/task";
import type { TaskReportEntry } from "@/types/taskReport";

async function buildTaskReportEntry(
  task: PublicTask,
  userId: string,
): Promise<TaskReportEntry> {
  const entry: TaskReportEntry = {
    task,
    completedCount: 0,
    totalCount: 0,
  };

  if (task.creatorId !== userId) {
    return entry;
  }

  const { response, data } = await fetchTaskCompletions(task.id, userId);
  if (!response.ok) {
    return entry;
  }

  const assignees = (data as ListTaskCompletionsSuccessResponse).assignees;
  entry.completedCount = assignees.filter((assignee) => assignee.completed).length;
  entry.totalCount = assignees.length;

  return entry;
}

export async function shareTaskAsImage(
  task: PublicTask,
  userId: string,
): Promise<ShareImageResult> {
  const entry = await buildTaskReportEntry(task, userId);
  const blob = await renderTaskReportImage([entry], { subtitle: "מטלה" });
  return shareImageFile(blob, `tagabia-task-${task.id}.png`, "מטלה");
}
