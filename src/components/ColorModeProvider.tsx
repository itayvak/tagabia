import { getTheme } from "@/theme";
import {
  getStoredColorMode,
  saveColorMode,
  type ColorMode,
} from "@/lib/colorModeStorage";
import { CssBaseline, ThemeProvider } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function getInitialColorMode(): ColorMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return getStoredColorMode() ?? "light";
}

interface ColorModeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode must be used within ColorModeProvider");
  }

  return context;
}

export default function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(getInitialColorMode);

  const setMode = useCallback((nextMode: ColorMode) => {
    setModeState(nextMode);
    saveColorMode(nextMode);
  }, []);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
