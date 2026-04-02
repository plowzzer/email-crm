import { DEFAULT_STAGES, type StageDefinition } from "./constants";

interface TeamLike {
  key: string;
  pipelines: { key: string; stages: StageDefinition[] }[];
}

export function getStages(
  teams: TeamLike[],
  teamKey: string | null,
  pipelineKey: string | null
): StageDefinition[] {
  if (pipelineKey && pipelineKey !== "__all__") {
    const team = teams.find((t) => t.key === teamKey);
    const pipeline = team?.pipelines.find((p) => p.key === pipelineKey);
    if (pipeline?.stages && pipeline.stages.length > 0) {
      return pipeline.stages;
    }
  }
  return [...DEFAULT_STAGES];
}
