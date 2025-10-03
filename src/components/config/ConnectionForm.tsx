import React, { useMemo, useState } from "react";
import type { ConnectionConfig } from "../../types";

type Props = {
  value?: ConnectionConfig | null;
  onSave: (next: ConnectionConfig) => void;
  onSetActive?: (id: string) => void;
  activeId?: string;
};

export default function ConnectionForm({ value, onSave, onSetActive, activeId }: Props) {
  const [form, setForm] = useState<ConnectionConfig>(
    value ?? {
      id: crypto.randomUUID(),
      name: "Demo Broker (public)",
      protocol: "wss",
      host: "test.mosquitto.org",
      port: 8081,
      clientId: "iot-panel-demo-client",
      keepalive: 60,
      tls: true,
      autoReconnect: true,
      username: null,
      password: null
    }
  );

  const url = useMemo(() => `${form.protocol}://${form.host}:${form.port}`, [form]);

  return (
    <div className="card p-4 space-y-3">
      <div className="text-slate-300 text-sm">Broker URL: <code>{url}</code></div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Name
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="text-sm">Protocol
          <select className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={form.protocol}
            onChange={(e) => setForm({ ...form, protocol: e.target.value as any })}>
            <option value="wss">wss</option>
            <option value="ws">ws</option>
          </select>
        </label>
        <label className="text-sm">Host
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })} />
        </label>
        <label className="text-sm">Port
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" type="number" value={form.port}
            onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
        </label>
        <label className="text-sm">Client ID
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={form.clientId ?? ""} placeholder="auto"
            onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
        </label>
        <label className="text-sm">Keepalive
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" type="number" value={form.keepalive ?? 60}
            onChange={(e) => setForm({ ...form, keepalive: Number(e.target.value) })} />
        </label>
        <label className="text-sm">Username
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="text-sm">Password
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
      </div>
      <div className="flex gap-2">
        <button className="card px-3 py-2" onClick={() => onSave(form)}>Save</button>
        {onSetActive && (
          <button className="card px-3 py-2" onClick={() => onSetActive(form.id)}>
            {activeId === form.id ? "Active" : "Set Active"}
          </button>
        )}
      </div>
    </div>
  );
}
