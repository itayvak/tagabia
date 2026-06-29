export type TextSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

function stripTrailingPunctuation(url: string): string {
  let trimmed = url;
  while (trimmed.length > 0 && /[.,;:!?]/.test(trimmed[trimmed.length - 1]!)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

function toHref(url: string): string {
  return url.startsWith("www.") ? `https://${url}` : url;
}

export function linkifyText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    const matchIndex = match.index ?? 0;
    const rawUrl = match[0];

    if (matchIndex > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }

    const display = stripTrailingPunctuation(rawUrl);
    const trailing = rawUrl.slice(display.length);

    if (display.length > 0) {
      segments.push({ type: "link", value: display, href: toHref(display) });
    } else {
      segments.push({ type: "text", value: rawUrl });
    }

    if (trailing.length > 0) {
      segments.push({ type: "text", value: trailing });
    }

    lastIndex = matchIndex + rawUrl.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}
