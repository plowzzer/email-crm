import { useQuery } from "@tanstack/react-query";

export interface Stage {
  key: string;
  label: string;
  color: string;
}

export interface JiraConfig {
  baseUrl: string;
  pid: string;
  issueType: string;
}

export interface Pipeline {
  key: string;
  label: string;
  stages: Stage[];
  jira?: JiraConfig | null;
}

export interface Team {
  id: string;
  key: string;
  label: string;
  pipelines: Pipeline[];
}

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });
}
