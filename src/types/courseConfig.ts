import type { Timestamp } from "firebase-admin/firestore";

export interface StoredCourseWeek {
  weekId: string;
}

export interface PublicCourseWeek {
  weekId: string;
  name: string;
  image: string;
}

export interface FirestoreCourseConfig {
  startDate: string;
  weeks: StoredCourseWeek[];
  updatedAt: Timestamp;
}

export interface PublicCourseConfig {
  startDate: string;
  weeks: PublicCourseWeek[];
}

export interface GetCourseConfigSuccessResponse {
  config: PublicCourseConfig | null;
}

export interface GetCourseConfigErrorResponse {
  error: string;
}

export interface UpdateCourseConfigRequest {
  userId: string;
  startDate: string;
  weeks: StoredCourseWeek[];
}

export interface UpdateCourseConfigSuccessResponse {
  config: PublicCourseConfig;
}

export interface UpdateCourseConfigErrorResponse {
  error: string;
}
