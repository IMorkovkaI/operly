"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "./icon";
import { Modal } from "./ui";
import type { Project } from "@/lib/workspace";

const subscribe = () => () => {};
export function useSearchShortcut() {
  const mac = useSyncExternalStore(subscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  return mac ? "⌘ K" : "Ctrl K";
}

type Page = { title: string; href: string; icon: IconName };
export function SearchDialog({ projects, pages, onClose, onOpenProject, onNavigate }: {
  projects: Project[]; pages: Page[]; onClose: () => void;
  onOpenProject: (id: string) => void; onNavigate: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const resultsRef = useRef<HTMLDivElement>(null);
  const term = query.trim().toLowerCase();
  const projectResults = projects.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(term));
  const pageResults = pages.filter(p => p.title.toLowerCase().includes(term));
  const results = [
    ...projectResults.map(p => ({ key: p.id, title: p.name, subtitle: p.category, color: p.color, icon: null, action: () => onOpenProject(p.id) })),
    ...pageResults.map(p => ({ key: p.href, title: p.title, subtitle: "Workspace page", color: "", icon: p.icon, action: () => onNavigate(p.href) })),
  ];
  const selected = Math.min(active, Math.max(results.length - 1, 0));
  useEffect(() => {
    resultsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selected, query]);

  function options(start: number, count: number) {
    return results.slice(start, start + count).map((result, offset) => {
      const index = start + offset;
      return <button type="button" role="option" id={`${id}-${index}`} key={result.key}
        aria-selected={selected === index} tabIndex={-1} className="search-option"
        onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={result.action}>
        {result.icon ? <Icon name={result.icon}/> : <span aria-hidden="true" className={`project-symbol tone-${result.color}`}>{result.title[0]}</span>}
        <span>{result.title}<small>{result.subtitle}</small></span><Icon name="arrow" size={16}/>
      </button>;
    });
  }

  return <Modal title="Search projects or pages" onClose={onClose} initialFocus='input[role="combobox"]'>
    <label className="search-dialog-input"><Icon name="search"/><input autoFocus role="combobox"
      aria-label="Search projects or pages" aria-expanded="true" aria-autocomplete="list"
      aria-controls={`${id}-results`} aria-activedescendant={results.length ? `${id}-${selected}` : undefined}
      aria-describedby={`${id}-instructions`} value={query} placeholder="Search projects or pages"
      onChange={event => { setQuery(event.target.value); setActive(0); }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (results.length) setActive((selected + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
        } else if (event.key === "Enter") { event.preventDefault(); results[selected]?.action(); }
      }}/></label>
    <p id={`${id}-instructions`} className="search-instructions">Search by project name, category, or page. Use ↑ ↓ to choose and Enter to open.</p>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{results.length ? `${results.length} results: ${projectResults.length} projects and ${pageResults.length} pages.` : "No matching projects or pages."}</p>
    <div className="search-results" id={`${id}-results`} role="listbox" aria-label="Projects and pages" ref={resultsRef}>
      {!!projectResults.length && <div role="group" aria-label="Projects"><span className="nav-label" aria-hidden="true">PROJECTS</span>{options(0, projectResults.length)}</div>}
      {!!pageResults.length && <div role="group" aria-label="Pages"><span className="nav-label" aria-hidden="true">PAGES</span>{options(projectResults.length, pageResults.length)}</div>}
    </div>
    {!results.length && <p className="search-empty">No matching projects or pages. Try another name or category.</p>}
  </Modal>;
}
