import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspace, initials, isWorkspace, projectProgress } from "../lib/workspace.ts";

test("sample workspace is valid and all assignments reference a member", () => {
  const workspace = createWorkspace();
  assert.equal(isWorkspace(workspace), true);
  for (const project of workspace.projects) for (const id of project.memberIds) assert.ok(workspace.members.some(member => member.id === id));
});
test("stored data validation rejects malformed tasks and members", () => {
  assert.equal(isWorkspace(null), false);
  assert.equal(isWorkspace({ version: 1 }), false);
  const workspace = createWorkspace();
  const badTasks = { ...workspace, projects: [{ ...workspace.projects[0], tasks: [null] }] };
  assert.equal(isWorkspace(badTasks), false);
  assert.equal(isWorkspace({ ...workspace, members: [{ ...workspace.members[0], role: "Owner" }] }), false);
  assert.equal(isWorkspace({ ...workspace, members: [] }), false);
  assert.equal(isWorkspace({ ...workspace, projects: [{ ...workspace.projects[0], dueDate: "invalid" }] }), false);
});
test("progress handles empty, partially completed, and completed checklists", () => {
  const project = createWorkspace().projects[0];
  assert.equal(projectProgress({ ...project, tasks: [] }), 0);
  assert.equal(projectProgress(project), 67);
  assert.equal(projectProgress({ ...project, tasks: project.tasks.map(task => ({ ...task, done: true })) }), 100);
});
test("initials handle multiword, single word, and blank names", () => {
  assert.equal(initials("  Alex Morgan  "), "AM");
  assert.equal(initials("Olivia"), "O");
  assert.equal(initials(""), "");
});
