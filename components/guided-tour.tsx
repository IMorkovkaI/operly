"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/workspace";

export function useGuidedTour(ready: boolean, overview: boolean) {
  const [step, setStep] = useState<number | null>(null);
  useEffect(() => {
    if (!ready || !overview) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tour") !== "1") return;
    url.searchParams.delete("tour");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    // The URL is an external entry signal, consumed once without changing saved data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(0);
  }, [ready, overview]);
  return { step, setStep };
}

export function GuidedTour({ step, onStep, project, onOpenProject, onCreateProject, onProgress, onClose }: {
  step: number; onStep: (step: number) => void; project?: Project;
  onOpenProject: (id: string, checklist?: boolean) => void; onCreateProject: () => void;
  onProgress: () => void; onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const steps = [
    { title: "Explore a project", description: project ? `Open “${project.name}” to see its details, deadline, and team.` : "Your workspace is empty. Create a project to explore its details and team.", action: project ? "Open project" : "Create a project" },
    { title: "Try its checklist", description: project ? "Open the checklist to add a task or check one off. Only your own edits change the workspace." : "Create a project first, then add your first task inside it.", action: project ? "Open checklist" : "Create a project" },
    { title: "View your progress", description: "Your overview reflects completed tasks and each project’s progress. Watch it change as you work.", action: "View progress" },
  ];
  const current = steps[step];
  return <section className="panel guided-tour" aria-labelledby="tour-heading">
    <div className="tour-copy"><p className="tour-step">GUIDED DEMO · STEP {step + 1} OF 3</p><h2 id="tour-heading" tabIndex={-1} ref={heading}>{current.title}</h2><p>{current.description}</p></div>
    <div className="tour-controls"><button className="button button-primary" onClick={() => {
      if (step === 2) onProgress();
      else if (project) onOpenProject(project.id, step === 1);
      else onCreateProject();
    }}>{current.action}</button>
      <div className="tour-navigation"><button className="text-link" onClick={onClose}>Skip</button><button className="button button-secondary" disabled={step === 0} onClick={() => onStep(step - 1)}>Back</button><button className="button button-secondary" onClick={() => step === 2 ? onClose() : onStep(step + 1)}>{step === 2 ? "Finish tour" : "Next"}</button></div>
    </div>
  </section>;
}
