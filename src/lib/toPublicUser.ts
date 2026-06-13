import type { FirestoreUser, PublicUser } from "@/types/user";

export function toPublicUser(id: string, data: FirestoreUser): PublicUser {
  return {
    id,
    fullname: data.fullname,
    rank: data.rank,
    role: data.role,
    platoon: data.platoon,
    team: data.team,
  };
}
