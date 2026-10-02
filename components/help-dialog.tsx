"use client";

import { Modal } from "./ui";
import { Icon } from "./icon";

export function HelpDialog({ onClose, onCreateProject, onNavigate, onRestartTour, shortcut }: {
  onClose: () => void; onCreateProject: () => void; onNavigate: (href: string) => void;
  onRestartTour: () => void; shortcut: string;
}) {
  const actions = [
    { title: "Create a project", description: "Give your work a name, category, and due date.", action: onCreateProject },
    { title: "Find your tasks", description: "Open a project to add steps or check off its checklist.", action: () => onNavigate("/projects") },
    { title: "Manage teammates", description: "Add local team records and roles. Assign people inside a project.", action: () => onNavigate("/team") },
    { title: "Open Settings", description: "Export your workspace as JSON or reset it to the sample data.", action: () => onNavigate("/settings") },
  ];
  return <Modal title="Help & getting started" onClose={onClose}>
    <p className="modal-description">A few small steps to make this workspace yours.</p>
    <div className="help-actions">{actions.map(item => <button key={item.title} onClick={item.action}>
      <span><strong>{item.title}</strong><small>{item.description}</small></span><Icon name="arrow" size={17}/>
    </button>)}</div>
    <p className="help-tip">Press <kbd>{shortcut}</kbd> to find projects and workspace pages. For individual tasks, open their project.</p>
    <p className="help-tip">Changes stay in this browser. Adding teammates does not send invitations.</p>
    <div className="form-actions"><button className="button button-secondary" onClick={onRestartTour}>Restart guided demo</button><button className="button button-primary" onClick={onClose}>Got it</button></div>
  </Modal>;
}
