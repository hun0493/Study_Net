import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const THEME_STORAGE_KEY = "studynet_theme_mode";

export type MonoMode = "light" | "dark";

export type MonoTheme = {
  mode: MonoMode;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  inverse: string;
  statusBar: "dark-content" | "light-content";
};

type MonoThemeContextValue = {
  theme: MonoTheme;
  mode: MonoMode;
  isDark: boolean;
  setMode: (mode: MonoMode) => Promise<void>;
  toggleMode: (enabled: boolean) => Promise<void>;
};

export const monoLight: MonoTheme = {
  mode: "light",
  bg: "#fff",
  surface: "#fff",
  surfaceAlt: "#fff",
  border: "#000",
  text: "#000",
  muted: "#000",
  inverse: "#fff",
  statusBar: "dark-content",
};

export const monoDark: MonoTheme = {
  mode: "dark",
  bg: "#000",
  surface: "#000",
  surfaceAlt: "#000",
  border: "#fff",
  text: "#fff",
  muted: "#fff",
  inverse: "#000",
  statusBar: "light-content",
};

export const mono = monoLight;

const MonoThemeContext = createContext<MonoThemeContextValue>({
  theme: monoLight,
  mode: "light",
  isDark: false,
  setMode: async () => {},
  toggleMode: async () => {},
});

export function MonoThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<MonoMode>("light");

  useEffect(() => {
    const loadMode = async () => {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "dark" || saved === "light") {
        setModeState(saved);
      }
    };

    loadMode();
  }, []);

  const setMode = useCallback(async (nextMode: MonoMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(
    async (enabled: boolean) => {
      await setMode(enabled ? "dark" : "light");
    },
    [setMode],
  );

  const theme = mode === "dark" ? monoDark : monoLight;

  const value = useMemo(
    () => ({
      theme,
      mode,
      isDark: mode === "dark",
      setMode,
      toggleMode,
    }),
    [mode, setMode, theme, toggleMode],
  );

  return (
    <MonoThemeContext.Provider value={value}>
      {children}
    </MonoThemeContext.Provider>
  );
}

export const useMonoTheme = () => useContext(MonoThemeContext);
