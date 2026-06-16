export function getTaskErrorMessage(error: string): string {
  switch (error) {
    case "Title is required":
      return "יש להזין כותרת";
    case "Content is required":
      return "יש להזין תוכן";
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
    case "Get task failed":
      return "טעינת המטלה נכשלה";
    case "Task data is invalid":
      return "נתוני המטלה לא תקינים";
    default:
      return error;
  }
}
