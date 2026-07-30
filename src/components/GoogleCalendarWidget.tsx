import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Link, Typography } from "@mui/material";
import { fetchGoogleCalendarEvents } from "@/lib/fetchGoogleCalendarEvents";
import type {
  ListGoogleCalendarEventsSuccessResponse,
  PublicGoogleCalendarEvent,
} from "@/types/googleCalendar";

const WEEKDAY_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

/** Current event plus the next three. */
const VISIBLE_EVENT_COUNT = 7;

const EVENT_COLOR_PALETTE: Record<string, string> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6bf26",
  "6": "#f4511e",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#d50000",
};

const DEFAULT_COLOR_CYCLE = [
  "oklch(0.55 0.18 255)",
  "oklch(0.6 0.15 150)",
  "oklch(0.45 0.18 290)",
  "oklch(0.6 0.16 40)",
];

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** All-day events arrive as "YYYY-MM-DD"; parse those as local, not UTC. */
function parseEventDate(value: string): Date {
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function resolveEventColor(
  event: PublicGoogleCalendarEvent,
  index: number,
): string {
  if (event.colorId && EVENT_COLOR_PALETTE[event.colorId]) {
    return EVENT_COLOR_PALETTE[event.colorId];
  }

  return DEFAULT_COLOR_CYCLE[index % DEFAULT_COLOR_CYCLE.length];
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function getWeekStart(date: Date): Date {
  return addDays(startOfDay(date), -date.getDay());
}

function formatTime(iso: string): string {
  return parseEventDate(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const monthYearFormatter = new Intl.DateTimeFormat("he-IL", {
  month: "long",
  year: "numeric",
});

function CalendarGlyph() {
  return (
    <Box
      component="svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      sx={{ display: "block" }}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="oklch(0.5 0.15 255)"
        strokeWidth="2"
      />
      <path d="M3 9H21" stroke="oklch(0.5 0.15 255)" strokeWidth="2" />
      <path
        d="M8 3V6M16 3V6"
        stroke="oklch(0.5 0.15 255)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Box>
  );
}

function Chevron({ direction }: { direction: "next" | "previous" }) {
  return (
    <Box
      component="svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      sx={{ display: "block" }}
    >
      <path
        d={direction === "next" ? "M15 6L9 12L15 18" : "M9 6L15 12L9 18"}
        stroke="oklch(0.5 0.01 260)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

function LocationGlyph() {
  return (
    <Box
      component="svg"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      sx={{ flexShrink: 0, display: "block" }}
    >
      <path
        d="M12 21C12 21 19 15 19 10C19 6.13 15.87 3 12 3C8.13 3 5 6.13 5 10C5 15 12 21 12 21Z"
        stroke="oklch(0.6 0.01 260)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.3"
        stroke="oklch(0.6 0.01 260)"
        strokeWidth="2"
      />
    </Box>
  );
}

const cardSx = {
  background: "#fff",
  borderRadius: "16px",
  padding: "14px 16px 8px",
  boxShadow: "0 1px 3px rgba(20,20,43,0.06)",
} as const;

export default function GoogleCalendarWidget() {
  const [events, setEvents] = useState<PublicGoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { response, data } = await fetchGoogleCalendarEvents();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setErrorMessage("טעינת היומן נכשלה");
          return;
        }

        setEvents((data as ListGoogleCalendarEventsSuccessResponse).events);
      } catch {
        if (!cancelled) {
          setErrorMessage("טעינת היומן נכשלה");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep "what's happening now" accurate as time passes.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => {
    const weekStart = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [selectedDate]);

  const visibleEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        parseEventDate(a.start).getTime() - parseEventDate(b.start).getTime(),
    );
    const onSelectedDay = sorted.filter((event) =>
      isSameDay(parseEventDate(event.start), selectedDate),
    );

    // For today show what's running plus what's next; other days start at the top.
    const source = isSameDay(selectedDate, now)
      ? onSelectedDay.filter(
          (event) => event.allDay || parseEventDate(event.end) >= now,
        )
      : onSelectedDay;

    return source.slice(0, VISIBLE_EVENT_COUNT);
  }, [events, selectedDate, now]);

  if (isLoading) {
    return (
      <Box
        sx={{
          ...cardSx,
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (errorMessage) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }

  return (
    <Box sx={cardSx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "12px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "5px",
              background: "#fff",
              border: "1px solid oklch(0.85 0.01 260)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CalendarGlyph />
          </Box>
          <Typography
            component="span"
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "oklch(0.25 0.01 260)",
            }}
          >
            יומן Google{" "}
            <Box
              component="span"
              sx={{ fontWeight: 400, color: "oklch(0.6 0.01 260)" }}
            >
              - לוח זמנים
            </Box>
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: 12,
            color: "oklch(0.4 0.01 260)",
            fontWeight: 500,
          }}
        >
          <Box
            role="button"
            aria-label="שבוע הבא"
            onClick={() => setSelectedDate((date) => addDays(date, 7))}
            sx={{ display: "flex", cursor: "pointer" }}
          >
            <Chevron direction="next" />
          </Box>
          <Box component="span" sx={{ whiteSpace: "nowrap" }}>
            {monthYearFormatter.format(selectedDate)}
          </Box>
          <Box
            role="button"
            aria-label="שבוע קודם"
            onClick={() => setSelectedDate((date) => addDays(date, -7))}
            sx={{ display: "flex", cursor: "pointer" }}
          >
            <Chevron direction="previous" />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: "2px",
          mb: "10px",
        }}
      >
        {weekDays.map((day) => (
          <Box
            key={`label-${day.toISOString()}`}
            sx={{
              textAlign: "center",
              fontSize: 11,
              color: "oklch(0.6 0.01 260)",
              pb: "6px",
            }}
          >
            {WEEKDAY_LETTERS[day.getDay()]}
          </Box>
        ))}
        {weekDays.map((day) => {
          const selected = isSameDay(day, selectedDate);

          return (
            <Box
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  background: selected
                    ? "oklch(0.5 0.15 255)"
                    : "transparent",
                  color: selected ? "#fff" : "oklch(0.35 0.01 260)",
                  fontWeight: selected ? 700 : 400,
                }}
              >
                {day.getDate()}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid oklch(0.93 0.003 260)",
        }}
      >
        {visibleEvents.length === 0 ? (
          <Typography
            sx={{
              py: "18px",
              textAlign: "center",
              fontSize: 13,
              color: "oklch(0.55 0.01 260)",
            }}
          >
            אין אירועים ביום זה
          </Typography>
        ) : (
          visibleEvents.map((event, index) => (
            <Box
              key={event.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 2px",
                borderBottom: "1px solid oklch(0.95 0.003 260)",
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: resolveEventColor(event, index),
                  mt: "6px",
                  flexShrink: 0,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "oklch(0.25 0.01 260)",
                      minWidth: 0,
                    }}
                  >
                    {event.title}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      fontSize: 12,
                      color: "oklch(0.5 0.01 260)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {event.allDay
                      ? "כל היום"
                      : `${formatTime(event.start)} - ${formatTime(event.end)}`}
                  </Box>
                </Box>
                {event.location && (
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <LocationGlyph />
                    <Box
                      component="span"
                      sx={{ fontSize: 12, color: "oklch(0.55 0.01 260)" }}
                    >
                      {event.location}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Link
        href="https://calendar.google.com/calendar/u/0/r"
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        sx={{
          display: "block",
          textAlign: "center",
          padding: "10px 0 4px",
          fontSize: 13,
          color: "oklch(0.5 0.15 255)",
          fontWeight: 600,
        }}
      >
        פתח ביומן
      </Link>
    </Box>
  );
}
