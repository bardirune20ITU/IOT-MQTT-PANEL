import React, { useState } from "react";
import type { Dashboard } from "../../types";

type Props = {
  dashboards: Dashboard[];
  activeId?: string;
  onAdd: (name: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddPanel: (dashboardId: string) => void;
};

export default function DashboardManager({
  dashboards, activeId, onAdd, onSelect, onRename, onDelete, onAddPanel
}: Props) {
  const [name, setName] = useState("");

  return (
    <div className="card p-4 space-y-3">
      <div className="flex gap-2">
        <input className="bg-slate-800 rounded px-2 py-1" placeholder="New Dashboard"
          value={name} onChange={(e) => setName(e.target.value)} />
        <button className="card px-3 py-1" onClick={() => { if (name) { onAdd(name); setName(""); }}}>Add</button>
      </div>
      <ul className="space-y-2">
        {dashboards.map((d) => (
          <li key={d.id} className={`flex items-center gap-2 ${activeId === d.id ? "text-emerald-300" : "text-slate-300"}`}>
            <button className="card px-2 py-1" onClick={() => onSelect(d.id)}>{d.name}</button>
            <button className="card px-2 py-1" onClick={() => onAddPanel(d.id)}>Add Panel</button>
            <button className="card px-2 py-1" onClick={() => onRename(d.id, prompt("Rename dashboard", d.name) || d.name)}>Rename</button>
            <button className="card px-2 py-1" onClick={() => onDelete(d.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
