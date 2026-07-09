import { getRoleLabel } from "@/lib/roles";
import { formatDaysLeft, formatDueDate, getDaysLeft } from "@/lib/taskDate";
import type { TaskReportEntry } from "@/types/taskReport";

const SCALE = 2;
const PADDING = 16;
const CARD_GAP = 12;
const COLUMN_GAP = 12;
const CARD_PADDING = 12;
const COLUMN_WIDTH = 328;
const CARD_INNER_WIDTH = COLUMN_WIDTH - CARD_PADDING * 2;
const MAX_TASKS_PER_COLUMN = 5;
const HEADER_HEIGHT = 56 + 8 + 24 + 18 + 8;
const CARD_FONT_SIZE = 13;
const CARD_LINE_HEIGHT = 18;
const CARD_TITLE_FONT_SIZE = 16;
const CARD_TITLE_LINE_HEIGHT = 20;
const CARD_LINE_GAP = 2;

const COLORS = {
  background: "#f5f5f5",
  card: "#ffffff",
  border: "#e0e0e0",
  borderOverdue: "#ef9a9a",
  textPrimary: "#1a1a1a",
  textSecondary: "rgba(0, 0, 0, 0.6)",
  error: "#d32f2f",
};

function getFontFamily(): string {
  return getComputedStyle(document.body).fontFamily || '"Segoe UI", Arial, sans-serif';
}

async function ensureFontsLoaded(fontFamily: string): Promise<void> {
  const sizes = [12, 13, 14, 16, 20];
  await Promise.all(
    sizes.flatMap((size) => [
      document.fonts.load(`400 ${size}px ${fontFamily}`),
      document.fonts.load(`600 ${size}px ${fontFamily}`),
      document.fonts.load(`700 ${size}px ${fontFamily}`),
    ]),
  );
  await document.fonts.ready;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function chunkEntries(
  entries: TaskReportEntry[],
  chunkSize: number,
): TaskReportEntry[][] {
  const columns: TaskReportEntry[][] = [];

  for (let index = 0; index < entries.length; index += chunkSize) {
    columns.push(entries.slice(index, index + chunkSize));
  }

  return columns;
}

function wrapTextLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = "";

  const pushLongWord = (word: string) => {
    let segment = "";
    for (const char of word) {
      const testSegment = `${segment}${char}`;
      if (context.measureText(testSegment).width <= maxWidth || segment.length === 0) {
        segment = testSegment;
      } else {
        lines.push(segment);
        segment = char;
      }
    }
    if (segment) {
      currentLine = segment;
    }
  };

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (context.measureText(word).width <= maxWidth) {
      currentLine = word;
    } else {
      pushLongWord(word);
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

function drawRtlTextBlock(
  context: CanvasRenderingContext2D,
  lines: string[],
  xRight: number,
  y: number,
  lineHeight: number,
): number {
  context.direction = "rtl";
  context.textAlign = "right";

  let currentY = y;
  for (const line of lines) {
    context.fillText(line, xRight, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function getCardTextFont(fontFamily: string): string {
  return `400 ${CARD_FONT_SIZE}px ${fontFamily}`;
}

function getCardTitleFont(fontFamily: string): string {
  return `600 ${CARD_TITLE_FONT_SIZE}px ${fontFamily}`;
}

interface CardTextLineOptions {
  font?: string;
  color?: string;
  lineHeight?: number;
  maxWidth?: number;
}

function drawCardTextLine(
  context: CanvasRenderingContext2D,
  text: string,
  textRight: number,
  y: number,
  fontFamily: string,
  options: CardTextLineOptions = {},
): number {
  const {
    font = getCardTextFont(fontFamily),
    color = COLORS.textPrimary,
    lineHeight = CARD_LINE_HEIGHT,
    maxWidth,
  } = options;

  context.fillStyle = color;
  context.font = font;
  const lines = maxWidth ? wrapTextLines(context, text, maxWidth) : [text];
  const endY = drawRtlTextBlock(context, lines, textRight, y, lineHeight);
  return endY + CARD_LINE_GAP;
}

function formatCompletionStats(completedCount: number, totalCount: number): string {
  return `בוצעו ${completedCount}/${totalCount} צוערים`;
}

function measureCardHeight(
  context: CanvasRenderingContext2D,
  entry: TaskReportEntry,
  fontFamily: string,
): number {
  const { task, totalCount } = entry;
  context.font = getCardTitleFont(fontFamily);
  const titleLines = wrapTextLines(context, task.title, CARD_INNER_WIDTH);
  const bodyLineCount = 3 + (totalCount > 0 ? 1 : 0);

  const titleHeight =
    titleLines.length * CARD_TITLE_LINE_HEIGHT +
    (titleLines.length > 0 ? CARD_LINE_GAP : 0);
  const bodyHeight =
    bodyLineCount * CARD_LINE_HEIGHT +
    Math.max(bodyLineCount - 1, 0) * CARD_LINE_GAP;

  return CARD_PADDING + titleHeight + bodyHeight + CARD_PADDING;
}

function measureColumnHeight(
  context: CanvasRenderingContext2D,
  columnEntries: TaskReportEntry[],
  fontFamily: string,
): number {
  if (columnEntries.length === 0) {
    return 0;
  }

  let height = 0;
  for (const entry of columnEntries) {
    height += measureCardHeight(context, entry, fontFamily) + CARD_GAP;
  }

  return height - CARD_GAP;
}

function measureReportSize(
  context: CanvasRenderingContext2D,
  columns: TaskReportEntry[][],
  fontFamily: string,
): { width: number; height: number } {
  const columnCount = Math.max(columns.length, 1);
  const width =
    PADDING * 2 + columnCount * COLUMN_WIDTH + (columnCount - 1) * COLUMN_GAP;
  const columnsHeight = columns.reduce(
    (maxHeight, columnEntries) =>
      Math.max(maxHeight, measureColumnHeight(context, columnEntries, fontFamily)),
    0,
  );

  return {
    width,
    height: PADDING + HEADER_HEIGHT + columnsHeight + PADDING,
  };
}

function getColumnX(reportWidth: number, columnIndex: number, columnCount: number): number {
  const rtlColumnIndex = columnCount - 1 - columnIndex;
  return PADDING + rtlColumnIndex * (COLUMN_WIDTH + COLUMN_GAP);
}

function drawCard(
  context: CanvasRenderingContext2D,
  entry: TaskReportEntry,
  x: number,
  y: number,
  fontFamily: string,
): number {
  const { task, completedCount, totalCount } = entry;
  const isOverdue = getDaysLeft(task.dueDate) < 0;
  const cardHeight = measureCardHeight(context, entry, fontFamily);
  const textRight = x + COLUMN_WIDTH - CARD_PADDING;

  context.fillStyle = COLORS.card;
  context.beginPath();
  context.roundRect(x, y, COLUMN_WIDTH, cardHeight, 8);
  context.fill();

  context.strokeStyle = isOverdue ? COLORS.borderOverdue : COLORS.border;
  context.lineWidth = 1;
  context.stroke();

  let textY = y + CARD_PADDING + 14;

  textY = drawCardTextLine(context, task.title, textRight, textY, fontFamily, {
    font: getCardTitleFont(fontFamily),
    lineHeight: CARD_TITLE_LINE_HEIGHT,
    maxWidth: CARD_INNER_WIDTH,
  });

  textY = drawCardTextLine(
    context,
    `מאת ${task.creatorRank} ${task.creatorName} - ${getRoleLabel(task.creatorRole)}`,
    textRight,
    textY,
    fontFamily,
  );

  textY = drawCardTextLine(
    context,
    `תג"ב: ${formatDueDate(task.dueDate)}`,
    textRight,
    textY,
    fontFamily,
  );

  textY = drawCardTextLine(
    context,
    formatDaysLeft(task.dueDate),
    textRight,
    textY,
    fontFamily,
    { color: isOverdue ? COLORS.error : COLORS.textPrimary },
  );

  if (totalCount > 0) {
    drawCardTextLine(
      context,
      formatCompletionStats(completedCount, totalCount),
      textRight,
      textY,
      fontFamily,
    );
  }

  return y + cardHeight + CARD_GAP;
}

function drawColumn(
  context: CanvasRenderingContext2D,
  columnEntries: TaskReportEntry[],
  x: number,
  startY: number,
  fontFamily: string,
): void {
  let y = startY;

  for (const entry of columnEntries) {
    y = drawCard(context, entry, x, y, fontFamily);
  }
}

export async function renderTaskReportImage(
  entries: TaskReportEntry[],
  options: { subtitle?: string } = {},
): Promise<Blob> {
  const subtitle = options.subtitle ?? "דוח מטלות";
  const fontFamily = getFontFamily();
  await ensureFontsLoaded(fontFamily);

  const columns = chunkEntries(entries, MAX_TASKS_PER_COLUMN);

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) {
    throw new Error("Canvas is not supported");
  }

  measureContext.font = getCardTextFont(fontFamily);
  const { width: reportWidth, height: reportHeight } = measureReportSize(
    measureContext,
    columns,
    fontFamily,
  );

  const canvas = document.createElement("canvas");
  canvas.width = reportWidth * SCALE;
  canvas.height = reportHeight * SCALE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported");
  }

  context.scale(SCALE, SCALE);
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, reportWidth, reportHeight);

  let y = PADDING;

  try {
    const logo = await loadImage("/bahad1.png");
    const logoX = (reportWidth - 56) / 2;
    context.drawImage(logo, logoX, y, 56, 56);
    y += 56 + 8;
  } catch {
    y += 8;
  }

  context.fillStyle = COLORS.textPrimary;
  context.font = `700 20px ${fontFamily}`;
  context.direction = "rtl";
  context.textAlign = "center";
  context.fillText('תג"ביה', reportWidth / 2, y + 16);
  y += 24;

  context.fillStyle = COLORS.textSecondary;
  context.font = `400 14px ${fontFamily}`;
  context.fillText(subtitle, reportWidth / 2, y + 12);
  y += 18 + 8;

  const cardsStartY = y;
  const columnCount = columns.length;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const columnX = getColumnX(reportWidth, columnIndex, columnCount);
    drawColumn(context, columns[columnIndex], columnX, cardsStartY, fontFamily);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Failed to create image blob"));
    }, "image/png");
  });
}
