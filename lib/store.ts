"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createWorkspace, isWorkspace, STORAGE_KEY, type WorkspaceData } from "./workspace";

type Snapshot = { data: WorkspaceData; ready: boolean; error: string | null };
const serverSnapshot: Snapshot = { data: createWorkspace(), ready: false, error: null };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
function hydrate() {
  if (snapshot.ready) return;
  let error: string | null = null;
  let data = snapshot.data;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isWorkspace(parsed)) data = parsed;
      else error = "Saved workspace data could not be read. The sample workspace is shown. Export or reset it in Settings.";
    }
  } catch {
    error = "Local storage is unavailable or contains unreadable data. Changes will last for this session only.";
  }
  snapshot = { data, ready: true, error };
  notify();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function updateWorkspace(update: (data: WorkspaceData) => WorkspaceData): boolean {
  const data = update(snapshot.data);
  let saved = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { saved = false; }
  snapshot = { data, ready: true, error: saved ? null : "Your changes are available in this session, but could not be saved to this browser." };
  notify();
  return saved;
}
export function useWorkspace() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
  useEffect(() => { hydrate(); }, []);
  return state;
}
