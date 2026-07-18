import { isAdminUser } from "@/lib/admin";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { FirestoreUser } from "@/types/user";

export async function canAccessAdminByUserId(
  userId: string,
): Promise<boolean> {
  if (isAdminUser(userId)) {
    return true;
  }

  const userDoc = await getAdminFirestore().collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return false;
  }

  const user = userDoc.data() as FirestoreUser;
  return user.role === "developer";
}
