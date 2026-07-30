import { MAX_TASK_MEDIA_FILE_SIZE_MB } from "@/lib/taskMediaValidation";

export function getTaskErrorMessage(error: string): string {
  switch (error) {
    case "Title is required":
      return "יש להזין כותרת";
    case "Content must be a string":
      return "תוכן המטלה לא תקין";
    case "Due date is required":
      return "יש לבחור תאריך ושעת יעד";
    case "Invalid due date":
      return "תאריך ושעת יעד לא תקינים";
    case "Creator not found":
      return "יוצר המטלה לא נמצא";
    case "Assigned teams must be a list of valid team numbers":
      return "יש לבחור צוותים תקינים למטלה";
    case "User not found":
      return "המשתמש לא נמצא";
    case "Create task failed":
      return "יצירת המטלה נכשלה";
    case "Task not found":
      return "המטלה לא נמצאה";
    case "User is not the task creator":
      return "אין לך הרשאה לערוך מטלה זו";
    case "User is not assigned to this task":
      return "אין לך הרשאה לצפות במטלה זו";
    case "Update task failed":
      return "עדכון המטלה נכשל";
    case "Delete task failed":
      return "מחיקת המטלה נכשלה";
    case "List tasks failed":
      return "טעינת המטלות נכשלה";
    case "Creator ID is required":
      return "מזהה יוצר חסר";
    case "List completions failed":
      return "טעינת הביצועים נכשלה";
    case "List submissions failed":
      return "טעינת התשובות נכשלה";
    case "Task has no form fields":
      return "למטלה זו אין טופס";
    case "Get task failed":
      return "טעינת המטלה נכשלה";
    case "Task data is invalid":
      return "נתוני המטלה לא תקינים";
    case "Form fields must be a list":
      return "שדות הטופס לא תקינים";
    case "Form field data is invalid":
      return "שדה טופס לא תקין";
    case "Form field label is required":
      return "יש להזין תווית לכל שדה בטופס";
    case "Form field type is invalid":
      return "סוג שדה הטופס לא תקין";
    case "Form field required flag is invalid":
      return "הגדרת חובת שדה לא תקינה";
    case "Multiple choice field must have at least two options":
    case "Choice field must have at least two options":
      return "שדה בחירה חייב לכלול לפחות שתי אפשרויות";
    case "Form answers are required":
      return "יש למלא את הטופס לפני סימון המטלה כבוצעה";
    case "Task category is required":
      return "יש לבחור קטגוריה";
    case "Invalid task category":
      return "יש לבחור קטגוריה תקינה";
    case "At least one assignee is required":
      return "יש לבחור לפחות צוות או צוער אחד";
    case "File is required":
      return "יש לבחור קובץ להעלאה";
    case "File type is not allowed":
      return "סוג הקובץ אינו נתמך. ניתן להעלות תמונות, סרטונים וקבצי PDF";
    case "File is too large":
      return `הקובץ גדול מדי (מקסימום ${MAX_TASK_MEDIA_FILE_SIZE_MB}MB)`;
    case "Maximum number of media files reached":
      return "הגעת למספר הקבצים המקסימלי למטלה";
    case "Maximum number of completion files reached":
      return "הגעת למספר הקבצים המקסימלי להגשת המטלה";
    case "Media not found":
      return "הקובץ לא נמצא";
    case "Upload task media failed":
      return "העלאת הקובץ נכשלה";
    case "Completion file uploads are not allowed":
      return "לא ניתן להעלות קבצים עבור מטלה זו";
    case "Completion file is required":
      return "יש לצרף לפחות קובץ אחד כדי להשלים את המטלה";
    case "Delete task media failed":
      return "מחיקת הקובץ נכשלה";
    case "Media ID is required":
      return "מזהה קובץ חסר";
    default:
      if (error.startsWith("Required form field is missing:")) {
        return "יש למלא את כל שדות החובה בטופס";
      }
      if (error.startsWith("Invalid option for form field:")) {
        return "נבחרה אפשרות לא תקינה בשדה בטופס";
      }
      return error;
  }
}
