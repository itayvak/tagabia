import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { formatDueDate, getCalendarDateKey, getDueDateCalendarKey } from "@/lib/taskDate";
import type { PublicCalendarReminder } from "@/types/calendarReminder";
import type { CalendarTask } from "@/types/task";

const WEEKDAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const MONTH_LABELS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

const MAX_VISIBLE_TASKS_IN_CELL = 2;

type CalendarDay = {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

interface MonthCalendarProps {
  tasks: CalendarTask[];
  reminders: PublicCalendarReminder[];
}

function isSameDay(a: Date, b: Date): boolean {
  return getCalendarDateKey(a) === getCalendarDateKey(b);
}

function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const cells: CalendarDay[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    cells.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
    });
  }

  const trailingCells = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= trailingCells; day += 1) {
    const date = new Date(year, month + 1, day);
    cells.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
    });
  }

  return cells;
}

function groupTasksByDueDate(tasks: CalendarTask[]): Map<string, CalendarTask[]> {
  const grouped = new Map<string, CalendarTask[]>();

  for (const task of tasks) {
    const key = getDueDateCalendarKey(task.dueDate);
    const dayTasks = grouped.get(key) ?? [];
    dayTasks.push(task);
    grouped.set(key, dayTasks);
  }

  for (const dayTasks of grouped.values()) {
    dayTasks.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }

  return grouped;
}

function chunkWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function getRemindersForWeek(
  week: CalendarDay[],
  reminders: PublicCalendarReminder[],
): PublicCalendarReminder[] {
  const weekDateKeys = new Set(week.map((day) => getCalendarDateKey(day.date)));

  return reminders
    .filter((reminder) => weekDateKeys.has(reminder.dateKey))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function CalendarReminderLine({ reminder }: { reminder: PublicCalendarReminder }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: "text.disabled",
        fontSize: "0.7rem",
        lineHeight: 1.3,
        marginInline: "calc(50% - 50vw)",
        px: 1,
        py: 0.125,
        whiteSpace: "normal",
        width: "100vw",
      }}
    >
      {reminder.text}
    </Typography>
  );
}

export default function MonthCalendar({ tasks, reminders }: MonthCalendarProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const tasksByDueDate = useMemo(() => groupTasksByDueDate(tasks), [tasks]);

  const days = useMemo(
    () => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );

  const weeks = useMemo(() => chunkWeeks(days), [days]);

  const selectedDayTasks =
    selectedDate === null
      ? []
      : (tasksByDueDate.get(getCalendarDateKey(selectedDate)) ?? []);

  const monthLabel = `${MONTH_LABELS[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

  const goToPreviousMonth = () => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  const openTask = (taskId: string) => {
    void router.push(`/tasks/${taskId}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 1.5,
          flexShrink: 0,
        }}
      >
        <IconButton aria-label="חודש קודם" onClick={goToPreviousMonth}>
          <ChevronRightIcon />
        </IconButton>
        <Typography variant="h6" component="h1">
          {monthLabel}
        </Typography>
        <IconButton aria-label="חודש הבא" onClick={goToNextMonth}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          px: 1,
          pb: 0.5,
          flexShrink: 0,
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ fontWeight: 600, py: 0.5 }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: 0.5,
          minHeight: 0,
          overflowY: "auto",
          px: 1,
          pb: 1,
        }}
      >
        {weeks.map((week) => {
          const weekReminders = getRemindersForWeek(week, reminders);

          return (
            <Box
              key={week[0]?.date.toISOString() ?? "week"}
              sx={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                gap: 0.5,
                minHeight: weekReminders.length > 0 ? "auto" : 0,
              }}
            >
              {weekReminders.map((reminder) => (
                <CalendarReminderLine key={reminder.id} reminder={reminder} />
              ))}

              <Box
                sx={{
                  display: "grid",
                  flex: 1,
                  gap: 0.5,
                  gridTemplateColumns: "repeat(7, 1fr)",
                  minHeight: 72,
                }}
              >
                {week.map((day) => {
          const dayKey = getCalendarDateKey(day.date);
          const dayTasks = tasksByDueDate.get(dayKey) ?? [];
          const isSelected =
            selectedDate !== null && isSameDay(day.date, selectedDate);
          const hiddenTaskCount = Math.max(
            0,
            dayTasks.length - MAX_VISIBLE_TASKS_IN_CELL,
          );

          return (
            <Box
              key={day.date.toISOString()}
              component="button"
              type="button"
              onClick={() => setSelectedDate(day.date)}
              sx={{
                border: 1,
                borderColor: isSelected ? "primary.main" : "divider",
                borderRadius: 1,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                bgcolor: day.isToday ? "action.selected" : "background.paper",
                color: day.isCurrentMonth ? "text.primary" : "text.disabled",
                font: "inherit",
                minHeight: 0,
                overflow: "hidden",
                p: 0.5,
                textAlign: "right",
                transition: "border-color 0.15s ease, background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: day.isToday ? 700 : 500,
                  lineHeight: 1.2,
                  mb: 0.25,
                }}
              >
                {day.dayOfMonth}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                {dayTasks.slice(0, MAX_VISIBLE_TASKS_IN_CELL).map((task) => (
                  <Box
                    key={task.id}
                    component="span"
                    onClick={(event) => {
                      event.stopPropagation();
                      openTask(task.id);
                    }}
                    sx={{
                      bgcolor: task.completed ? "action.disabledBackground" : "primary.main",
                      borderRadius: 0.5,
                      color: task.completed ? "text.disabled" : "primary.contrastText",
                      cursor: "pointer",
                      display: "block",
                      fontSize: "0.65rem",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      px: 0.5,
                      py: 0.25,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {task.title}
                  </Box>
                ))}
                {hiddenTaskCount > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    +{hiddenTaskCount}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          maxHeight: "36%",
          minHeight: 120,
          overflow: "hidden",
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          {selectedDate === null
            ? "מטלות"
            : `מטלות ל-${selectedDate.toLocaleDateString("he-IL", {
                day: "numeric",
                month: "long",
              })}`}
        </Typography>

        {selectedDayTasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>
            אין מטלות ביום זה
          </Typography>
        ) : (
          <List dense disablePadding sx={{ overflowY: "auto" }}>
            {selectedDayTasks.map((task) => (
              <ListItemButton key={task.id} onClick={() => openTask(task.id)}>
                <ListItemText
                  primary={task.title}
                  secondary={formatDueDate(task.dueDate)}
                  slotProps={{
                    primary: {
                      sx: {
                        color: task.completed ? "text.disabled" : "text.primary",
                      },
                    },
                    secondary: { variant: "caption" },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
