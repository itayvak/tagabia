import { canAccessAdminByUserId } from "@/lib/adminAccess";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { isTrainingFileKey } from "@/types/workEnvironment";
import type { WorkEnvironmentFileKey } from "@/types/workEnvironment";
import type { FirestoreUser } from "@/types/user";

export async function canUploadWorkEnvironmentFile(
  fileKey: WorkEnvironmentFileKey,
  userId: string,
): Promise<boolean> {
  if (isTrainingFileKey(fileKey)) {
    return canAccessAdminByUserId(userId);
  }

  if (await canAccessAdminByUserId(userId)) {
    return true;
  }

  const userDoc = await getAdminFirestore().collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return false;
  }

  const user = userDoc.data() as FirestoreUser;

  if (fileKey === "shuttles") {
    return user.role === "logisticsBatallion";
  }

  if (fileKey === "guardRosters") {
    return user.role === "missionsPlatoon";
  }

  return false;
}
