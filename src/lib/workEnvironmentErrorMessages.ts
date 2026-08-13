import { MAX_WORK_ENVIRONMENT_FILE_SIZE_MB } from "@/lib/workEnvironmentFileValidation";

export function getWorkEnvironmentErrorMessage(error: string): string {
  switch (error) {
    case "Invalid file key":
      return "סוג הקובץ אינו מוכר";
    case "User ID is required":
      return "מזהה משתמש חסר";
    case "Forbidden":
      return "אין לך הרשאה להעלות קובץ זה";
    case "File is required":
      return "לא נבחר קובץ";
    case "File type is not allowed":
      return "ניתן להעלות קובץ אקסל בלבד (xlsx או xls)";
    case "File is too large":
      return `הקובץ גדול מדי (עד ${MAX_WORK_ENVIRONMENT_FILE_SIZE_MB} MB)`;
    case "Upload work environment file failed":
      return "העלאת הקובץ נכשלה";
    case "List work environment files failed":
      return "טעינת הקבצים נכשלה";
    default:
      return error;
  }
}
