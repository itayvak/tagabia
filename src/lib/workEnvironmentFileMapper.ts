import type {
  FirestoreWorkEnvironmentFile,
  PublicWorkEnvironmentFile,
  WorkEnvironmentFileKey,
} from "@/types/workEnvironment";

export function toPublicWorkEnvironmentFile(
  key: WorkEnvironmentFileKey,
  data: Partial<FirestoreWorkEnvironmentFile> | undefined,
): PublicWorkEnvironmentFile {
  return {
    key,
    title: data?.title ?? null,
    media: data?.media ?? null,
  };
}
