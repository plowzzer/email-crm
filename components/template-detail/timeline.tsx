"use client";

interface Stage {
  key: string;
  label: string;
  color: string;
}

interface Transition {
  from: string | null;
  to: string;
  date: string;
  by: string;
  note: string;
  files: string[];
  direction?: string;
}

interface TimelineProps {
  currentStage: string;
  stages: Stage[];
  transitions: Transition[];
}

export function Timeline({ currentStage, stages, transitions }: TimelineProps) {
  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  // Build a set of stages that had a backward transition into them
  const backwardStages = new Set<string>();
  for (const t of transitions) {
    if (t.direction === "backward") {
      backwardStages.add(t.to);
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max py-4">
        {stages.map((stage, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isFuture = currentIndex < index;
          const hasBackward = backwardStages.has(stage.key);

          return (
            <div key={stage.key} className="flex items-center">
              {/* Stage circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative flex items-center justify-center rounded-full transition-all
                    ${isCurrent ? "h-10 w-10" : "h-8 w-8"}
                    ${hasBackward ? "ring-2 ring-red-500 ring-offset-2" : ""}
                  `}
                  style={{
                    backgroundColor:
                      isCompleted || isCurrent ? stage.color : "#e2e8f0",
                  }}
                >
                  {isCompleted && (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isCurrent && (
                    <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
                  )}
                  {isFuture && (
                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                  )}
                </div>
                <span
                  className={`mt-2 max-w-[80px] text-center text-xs leading-tight ${
                    isCurrent
                      ? "font-semibold text-foreground"
                      : isCompleted
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connecting line between stages */}
              {index < stages.length - 1 && (
                <div
                  className="mx-1 h-0.5 w-12"
                  style={{
                    backgroundColor:
                      currentIndex > index ? stage.color : "#e2e8f0",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
