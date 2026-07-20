const COLOR_MODE_KEY = "tagabia_color_mode";

export type ColorMode = "light" | "dark";

function isColorMode(value: unknown): value is ColorMode {
  return value === "light" || value === "dark";
}

export function getStoredColorMode(): ColorMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(COLOR_MODE_KEY);
  return isColorMode(stored) ? stored : null;
}

export function saveColorMode(mode: ColorMode): void {
  localStorage.setItem(COLOR_MODE_KEY, mode);
}
