"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Image from "next/image";
import { Icon } from "./icon";
import type { Member, ProjectStatus } from "@/lib/workspace";

export function Logo({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? "brand-small" : ""}`}><Image src="/design/logo.svg" alt="" width={24} height={24}/>{!small && <span>operly<span className="brand-period">.</span></span>}</span>;
}
export function Avatar({ member, small = false }: { member: Member; small?: boolean }) {
  return <span title={member.name} className={`avatar tone-${member.color} ${small ? "avatar-small" : ""}`}>{member.initials}</span>;
}
export function AvatarGroup({ members }: { members: Member[] }) {
  return <span className="avatar-group" aria-label={members.map(m => m.name).join(", ")}>{members.slice(0, 3).map(m => <Avatar key={m.id} member={m} small/>)}{members.length > 3 && <span className="avatar avatar-small avatar-extra">+{members.length - 3}</span>}</span>;
}
export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}><span/>{status}</span>;
}
export function Modal({ title, children, onClose, wide = false, initialFocus }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; initialFocus?: string }) {
  const titleId = useId();
  const initialFocusRef = useRef(initialFocus);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    if (initialFocusRef.current) dialog?.querySelector<HTMLElement>(initialFocusRef.current)?.focus();
    return () => {
      dialog?.close();
      const visible = (element: HTMLElement | null) => {
        if (!element?.isConnected) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight;
      };
      const fallback = document.querySelector<HTMLElement>(".mobile-menu");
      if (visible(trigger)) trigger?.focus({ preventScroll: true });
      else if (visible(fallback)) fallback?.focus({ preventScroll: true });
      else document.querySelector<HTMLElement>(".search-trigger")?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) { const rect = e.currentTarget.getBoundingClientRect(); if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose(); } }} aria-labelledby={titleId}><div className="modal-heading"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="projects" size={28}/></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
