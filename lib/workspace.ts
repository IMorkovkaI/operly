export type ProjectStatus = "In progress" | "In review" | "Completed";
export type Task = { id: string; title: string; done: boolean };
export type Project = { id: string; name: string; description: string; category: string; color: string; status: ProjectStatus; dueDate: string; memberIds: string[]; tasks: Task[] };
export type Member = { id: string; name: string; email: string; role: "Admin" | "Member"; initials: string; color: string };
export type Activity = { id: string; text: string; date: string; kind: "project" | "task" | "team" | "settings" };
export type WorkspaceData = { version: 1; name: string; userName: string; plan: "Starter" | "Team"; projects: Project[]; members: Member[]; activity: Activity[] };
export const STORAGE_KEY = "operly-workspace-v1";

export function createWorkspace(): WorkspaceData {
  return {
    version: 1, name: "Studio workspace", userName: "Alex Morgan", plan: "Starter",
    members: [
      { id: "alex", name: "Alex Morgan", email: "alex@example.com", role: "Admin", initials: "AM", color: "sand" },
      { id: "olivia", name: "Olivia Chen", email: "olivia@example.com", role: "Member", initials: "OC", color: "sage" },
      { id: "james", name: "James Wilson", email: "james@example.com", role: "Member", initials: "JW", color: "lavender" },
      { id: "mia", name: "Mia Thompson", email: "mia@example.com", role: "Member", initials: "MT", color: "rose" },
      { id: "leo", name: "Leo Park", email: "leo@example.com", role: "Member", initials: "LP", color: "blue" },
    ],
    projects: [
      { id: "website", name: "Website redesign", description: "A clearer, more considered home for our studio. Refresh the website from the first sketch to launch.", category: "Design", color: "sage", status: "In progress", dueDate: "2026-10-16", memberIds: ["alex", "olivia", "james"], tasks: [
        { id: "w1", title: "Audit the current website", done: true }, { id: "w2", title: "Map the new site structure", done: true }, { id: "w3", title: "Define typography and color", done: true }, { id: "w4", title: "Design the homepage", done: true }, { id: "w5", title: "Build responsive pages", done: false }, { id: "w6", title: "Review and launch", done: false },
      ] },
      { id: "brand", name: "Brand guidelines", description: "Bring our visual identity together in one useful guide for the whole team.", category: "Branding", color: "lavender", status: "In review", dueDate: "2026-10-09", memberIds: ["olivia", "mia"], tasks: [
        { id: "b1", title: "Collect brand assets", done: true }, { id: "b2", title: "Document logo usage", done: true }, { id: "b3", title: "Write voice guidelines", done: true }, { id: "b4", title: "Prepare the brand guide", done: true }, { id: "b5", title: "Get final team feedback", done: false },
      ] },
      { id: "product", name: "Product launch", description: "Keep the launch checklist, campaign assets, and team handoffs in one place.", category: "Marketing", color: "sand", status: "In progress", dueDate: "2026-10-28", memberIds: ["alex", "james", "leo"], tasks: [
        { id: "p1", title: "Define the launch audience", done: true }, { id: "p2", title: "Set the campaign direction", done: true }, { id: "p3", title: "Prepare launch assets", done: false }, { id: "p4", title: "Write announcement copy", done: false }, { id: "p5", title: "Review the launch checklist", done: false }, { id: "p6", title: "Publish the campaign", done: false },
      ] },
      { id: "onboarding", name: "Client onboarding", description: "Make the first week with a new client feel organized and welcoming.", category: "Operations", color: "blue", status: "Completed", dueDate: "2026-09-25", memberIds: ["mia", "leo"], tasks: [
        { id: "c1", title: "Create a welcome document", done: true }, { id: "c2", title: "Prepare the kickoff agenda", done: true }, { id: "c3", title: "Build a handoff checklist", done: true },
      ] },
    ],
    activity: [
      { id: "a1", text: "Olivia completed “Design the homepage”", date: "2026-10-01T08:45:00Z", kind: "task" },
      { id: "a2", text: "Brand guidelines moved to review", date: "2026-09-30T14:20:00Z", kind: "project" },
      { id: "a3", text: "Leo joined the workspace", date: "2026-09-29T09:00:00Z", kind: "team" },
      { id: "a4", text: "Client onboarding was completed", date: "2026-09-25T15:30:00Z", kind: "project" },
    ],
  };
}

export function projectProgress(project: Project): number {
  return project.tasks.length ? Math.round(project.tasks.filter(task => task.done).length / project.tasks.length * 100) : 0;
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
}

export function isWorkspace(value: unknown): value is WorkspaceData {
  if (!value || typeof value !== "object") return false;
  const data = value as WorkspaceData;
  const isText = (item: unknown) => typeof item === "string";
  const validDate = (item: unknown) => isText(item) && !Number.isNaN(new Date(item as string).getTime());
  return data.version === 1 && isText(data.name) && isText(data.userName) && ["Starter", "Team"].includes(data.plan)
    && Array.isArray(data.projects) && data.projects.every(p => p && [p.id, p.name, p.description, p.category, p.color, p.dueDate].every(isText) && validDate(p.dueDate) && ["In progress", "In review", "Completed"].includes(p.status) && Array.isArray(p.memberIds) && p.memberIds.every(isText) && Array.isArray(p.tasks) && p.tasks.every(t => t && isText(t.id) && isText(t.title) && typeof t.done === "boolean"))
    && Array.isArray(data.members) && data.members.length > 0 && data.members.every(m => m && [m.id, m.name, m.email, m.initials, m.color].every(isText) && ["Admin", "Member"].includes(m.role))
    && Array.isArray(data.activity) && data.activity.every(a => a && [a.id, a.text, a.date].every(isText) && validDate(a.date) && ["project", "task", "team", "settings"].includes(a.kind));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date));
}
