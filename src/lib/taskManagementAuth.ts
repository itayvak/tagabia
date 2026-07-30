import { isUserAssignedToTask } from "@/lib/assigneeTeams";
import {
  getPlatoonForTeam,
  getTeamsForPlatoon,
  isTaskAssignedToBattalionOrPlatoon,
} from "@/lib/platoons";
import { canManageTasks, getSubordinateRole, isBattalionRole } from "@/lib/roles";
import type { Platoon, Role } from "@/types/user";

interface TaskAssignmentData {
  creatorId?: unknown;
  creatorRole?: unknown;
  creatorPlatoon?: unknown;
  assignedTeams?: unknown;
  assignedUsers?: unknown;
}

export function canViewTaskManagement(
  userId: string,
  userTeam: number,
  userRole: Role,
  taskData: TaskAssignmentData,
  userPlatoon?: Platoon,
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

  if (
    isUserAssignedToTask(trimmedUserId, userTeam, assignedTeams, assignedUsers)
  ) {
    return true;
  }

  // Hierarchy check: 1-level-up supervisor in the same domain+group can view
  const subordinateRole = getSubordinateRole(userRole);
  const taskCreatorRole =
    typeof taskData.creatorRole === "string"
      ? (taskData.creatorRole as Role)
      : null;
  const taskCreatorPlatoon =
    typeof taskData.creatorPlatoon === "string"
      ? (taskData.creatorPlatoon as Platoon)
      : null;

  if (subordinateRole && taskCreatorRole === subordinateRole) {
    if (isBattalionRole(userRole)) {
      return true;
    }
    const viewerPlatoon = userPlatoon ?? getPlatoonForTeam(userTeam);
    if (viewerPlatoon && viewerPlatoon === taskCreatorPlatoon) {
      return true;
    }
  }

  const viewerPlatoon = userPlatoon ?? getPlatoonForTeam(userTeam);
  if (viewerPlatoon) {
    const platoonTeams = getTeamsForPlatoon(viewerPlatoon);
    if (isTaskAssignedToBattalionOrPlatoon(assignedTeams, platoonTeams)) {
      return true;
    }
  }

  return false;
}
