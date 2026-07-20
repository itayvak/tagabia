import { isUserAssignedToTask } from "@/lib/assigneeTeams";
import { canManageTasks } from "@/lib/roles";
import type { Role } from "@/types/user";

interface TaskAssignmentData {
  creatorId?: unknown;
  assignedTeams?: unknown;
  assignedUsers?: unknown;
}

export function canViewTaskManagement(
  userId: string,
  userTeam: number,
  userRole: Role,
  taskData: TaskAssignmentData,
): boolean {
  const trimmedUserId = userId.trim();
  const creatorId =
    typeof taskData.creatorId === "string" ? taskData.creatorId.trim() : "";

  if (creatorId === trimmedUserId) {
    return true;
  }

  if (!canManageTasks(userRole)) {
    return false;
  }

  const assignedTeams = Array.isArray(taskData.assignedTeams)
    ? (taskData.assignedTeams as number[])
    : [];
  const assignedUsers = Array.isArray(taskData.assignedUsers)
    ? (taskData.assignedUsers as string[])
    : [];

  return isUserAssignedToTask(
    trimmedUserId,
    userTeam,
    assignedTeams,
    assignedUsers,
  );
}
