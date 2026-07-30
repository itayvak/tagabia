import type { CommanderDashboardData } from "@/types/commanderDashboard";

const WIDTH = 1200;
const PADDING = 64;
const CARD_GAP = 18;
const COLORS = {
  background: "#f3f6fb",
  card: "#ffffff",
  primary: "#1565c0",
  text: "#172033",
  muted: "#667085",
  border: "#d9e2ef",
  warning: "#b54708",
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    size?: number;
    weight?: number;
    color?: string;
    align?: CanvasTextAlign;
  } = {},
) {
  const {
    size = 28,
    weight = 400,
    color = COLORS.text,
    align = "right",
  } = options;
  context.font = `${weight} ${size}px ${getComputedStyle(document.body).fontFamily}`;
  context.fillStyle = color;
  context.textAlign = align;
  context.direction = "rtl";
  context.fillText(text, x, y);
}

export async function renderCommanderDashboardImage(
  dashboard: CommanderDashboardData,
): Promise<Blob> {
  await document.fonts.ready;
  const memberRows = dashboard.members.slice(0, 8);
  const bottlenecks = dashboard.bottlenecks.slice(0, 4);
  const insightCount =
    dashboard.insights.length + dashboard.repeatedLateMembers.length;
  const height =
    410 +
    insightCount * 54 +
    bottlenecks.length * 78 +
    memberRows.length * 62 +
    160;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.scale(2, 2);
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, WIDTH, height);

  drawText(context, "לוח מפקד · All In One", WIDTH - PADDING, 72, {
    size: 38,
    weight: 700,
    color: COLORS.primary,
  });
  drawText(
    context,
    `${dashboard.scope.teamName} · ${dashboard.range.label}`,
    WIDTH - PADDING,
    116,
    { size: 24, color: COLORS.muted },
  );

  const metrics = [
    ["מטלות", dashboard.summary.taskCount],
    ["חניכים בצוות", dashboard.summary.memberCount],
    ["שיעור השלמה", `${dashboard.summary.completionRate}%`],
    ["הושלמו בזמן", `${dashboard.summary.onTimeRate}%`],
    ["לא הושלמו בזמן", `${dashboard.summary.notOnTimeRate}%`],
    ["חניכים עם מטלה באיחור", dashboard.summary.overdueMemberCount],
  ] as const;
  const metricWidth = (WIDTH - PADDING * 2 - CARD_GAP * 5) / 6;
  metrics.forEach(([label, value], index) => {
    const x = PADDING + index * (metricWidth + CARD_GAP);
    context.fillStyle = COLORS.card;
    roundedRect(context, x, 154, metricWidth, 132, 18);
    drawText(context, String(value), x + metricWidth / 2, 216, {
      size: 34,
      weight: 700,
      align: "center",
      color:
        (label === "לא הושלמו בזמן" ||
          label === "חניכים עם מטלה באיחור") &&
        Number.parseFloat(String(value)) > 0
          ? COLORS.warning
          : COLORS.primary,
    });
    drawText(context, label, x + metricWidth / 2, 256, {
      size: 19,
      align: "center",
      color: COLORS.muted,
    });
  });

  let y = 338;
  const insightLines = [
    ...dashboard.repeatedLateMembers.map(
      (member) =>
        `אצל ${member.rank} ${member.fullname} נרשמו ${member.lateSubmissionCount} הגשות באיחור בשבועיים האחרונים.`,
    ),
    ...dashboard.insights,
  ];
  if (insightLines.length > 0) {
    drawText(context, "תובנות מרכזיות", WIDTH - PADDING, y, {
      size: 28,
      weight: 700,
    });
    y += 42;
    for (const insight of insightLines) {
      drawText(context, `• ${insight}`, WIDTH - PADDING, y, {
        size: 21,
      });
      y += 54;
    }
  }

  if (bottlenecks.length > 0) {
    y += 12;
    drawText(context, "מטלות שדורשות תשומת לב", WIDTH - PADDING, y, {
      size: 28,
      weight: 700,
    });
    y += 44;
    for (const task of bottlenecks) {
      context.fillStyle = COLORS.card;
      roundedRect(context, PADDING, y - 28, WIDTH - PADDING * 2, 62, 12);
      drawText(context, task.title, WIDTH - PADDING - 18, y, {
        size: 21,
        weight: 600,
      });
      drawText(
        context,
        `${task.completedCount} מתוך ${task.totalAssignments} חניכים הגישו · ${task.completionRate}%`,
        PADDING + 18,
        y,
        { size: 20, align: "left", color: COLORS.muted },
      );
      y += 78;
    }
  }

  y += 10;
  drawText(context, "מצב חברי הצוות", WIDTH - PADDING, y, {
    size: 28,
    weight: 700,
  });
  y += 42;
  for (const member of memberRows) {
    context.strokeStyle = COLORS.border;
    context.beginPath();
    context.moveTo(PADDING, y + 18);
    context.lineTo(WIDTH - PADDING, y + 18);
    context.stroke();
    drawText(
      context,
      `${member.rank} ${member.fullname}`,
      WIDTH - PADDING,
      y,
      { size: 20, weight: 600 },
    );
    drawText(
      context,
      `${
        member.completedAllTasks ? "השלים/ה את כל המטלות" : "נותרו מטלות"
      } · ${member.overdueBacklogCount} מטלות שמועדן עבר`,
      PADDING,
      y,
      { size: 19, align: "left", color: COLORS.muted },
    );
    y += 62;
  }

  drawText(
    context,
    `הופק ב-${new Intl.DateTimeFormat("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Jerusalem",
    }).format(new Date(dashboard.generatedAt))}`,
    WIDTH - PADDING,
    height - 48,
    { size: 17, color: COLORS.muted },
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image generation failed")),
      "image/png",
    );
  });
}
