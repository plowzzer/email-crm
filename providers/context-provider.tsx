"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string | null) {
  if (value === null) {
    document.cookie = `${name}=; path=/; max-age=0`;
  } else {
    // 1 year
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
  }
}

function readInitial(key: string): string | null {
  if (typeof document === "undefined") return null;
  return getCookie(key);
}

interface AppContextValue {
  selectedTeam: string | null;
  selectedPipeline: string | null;
  setSelectedTeam: (team: string | null) => void;
  setSelectedPipeline: (pipeline: string | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [selectedTeam, setSelectedTeamState] = useState<string | null>(() =>
    readInitial("selectedTeam"),
  );
  const [selectedPipeline, setSelectedPipelineState] = useState<string | null>(
    () => readInitial("selectedPipeline"),
  );

  const setSelectedPipeline = useCallback((pipeline: string | null) => {
    setSelectedPipelineState(pipeline);
    setCookie("selectedPipeline", pipeline);
  }, []);

  const setSelectedTeam = useCallback(
    (team: string | null) => {
      setSelectedTeamState(team);
      setCookie("selectedTeam", team);
      setSelectedPipeline(null);
    },
    [setSelectedPipeline],
  );

  return (
    <AppContext.Provider
      value={{
        selectedTeam,
        selectedPipeline,
        setSelectedTeam,
        setSelectedPipeline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
