import React, { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { connectMqttLazy, gracefulEnd } from "./mqtt/client";
import type { MqttClient } from "mqtt";
import { extractByJsonPath } from "./utils/jsonPath";
import type { AppConfig, ConnectionConfig, Dashboard, Panel } from "./types";
import PanelRenderer from "./components/PanelRenderer";
import ConnectionForm from "./components/config/ConnectionForm";
import DashboardManager from "./components/config/DashboardManager";
import PanelEditor from "./components/config/PanelEditor";
import "./index.css";

const DEFAULT_CONFIG: AppConfig = {
  version: "1.0",
  dashboards: [
    { id: "dash-1", name: "Default Dashboard", layout: "grid", panels: [] }
  ]
};

function toUrl(conn: ConnectionConfig): string {
  const clientId = conn.clientId || `client-${Math.random().toString(16).slice(2)}`;
  return `${conn.protocol}://${conn.host}:${conn.port}?clientId=${encodeURIComponent(clientId)}`;
}

export default function App() {
  const reduced = useReducedMotion();
  const [cfg, setCfg] = useState<AppConfig>(() => {
    try {
      const raw = localStorage.getItem("iot-panel-config-v2");
      return raw ? (JSON.parse(raw) as AppConfig) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [activeConn, setActiveConn] = useState<ConnectionConfig>(() => cfg.connection ?? {
    id: "conn-demo-1",
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
  });

  const [activeDashId, setActiveDashId] = useState<string>(cfg.activeDashboardId ?? cfg.dashboards[0]?.id);
  const activeDash: Dashboard | undefined = useMemo(
    () => cfg.dashboards.find((d) => d.id === activeDashId) ?? cfg.dashboards[0],
    [cfg.dashboards, activeDashId]
  );

  const [client, setClient] = useState<MqttClient | null>(null);
  const [connected, setConnected] = useState(false);

  // panel runtime data
  const [panelData, setPanelData] = useState<Record<string, unknown>>({});
  const [lineSeries, setLineSeries] = useState<Record<string, { x: number; y: number }[]>>({});

  useEffect(() => {
    localStorage.setItem("iot-panel-config-v2", JSON.stringify({ ...cfg, activeDashboardId: activeDash?.id }));
  }, [cfg, activeDash?.id]);

  // Connect MQTT
  useEffect(() => {
    let mounted = true;
    const url = toUrl(activeConn);
    connectMqttLazy({ url, keepalive: activeConn.keepalive ?? 60, reconnectPeriod: 1000 })
      .then((c) => {
        if (!mounted) return;
        setClient(c);
        c.on("connect", () => {
          setConnected(true);
          // subscribe to all panel topics in the active dashboard
          const topics = (activeDash?.panels ?? []).map((p) => p.topic).filter(Boolean);
          [...new Set(topics)].forEach((t) => c.subscribe(t, { qos: 0 }));
        });
        c.on("close", () => setConnected(false));
        c.on("message", (topic, payload) => {
          const text = payload.toString();
          if (!activeDash) return;
          for (const p of activeDash.panels) {
            if (p.topic !== topic) continue;
            const fmt = p.panel_config?.data_format ?? "raw";
            let parsed: unknown = text;
            if (fmt === "json") {
              try { parsed = JSON.parse(text); } catch { parsed = text; }
            } else if (fmt === "number") {
              const n = Number(text);
              parsed = Number.isNaN(n) ? text : n;
            }
            setPanelData((prev) => ({ ...prev, [p.id]: parsed }));
            if (p.type === "line_graph") {
              const path = p.panel_config?.json_path ?? "$.value";
              const val = fmt === "json" ? extractByJsonPath<number>(parsed, path) : Number(parsed);
              const tsCandidate = fmt === "json" ? extractByJsonPath<number>(parsed, "$.ts") : Date.now();
              const ts = tsCandidate && tsCandidate < 10_000_000_000 ? tsCandidate * 1000 : (tsCandidate || Date.now());
              if (typeof val === "number") {
                setLineSeries((prev) => {
                  const arr = prev[p.id] ?? [];
                  return { ...prev, [p.id]: [...arr, { x: ts, y: val }].slice(-200) };
                });
              }
            }
          }
        });
      });
    return () => {
      mounted = false;
      if (client) gracefulEnd(client);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConn.protocol, activeConn.host, activeConn.port, activeDash?.id]);

  function saveConnection(next: ConnectionConfig) {
    setActiveConn(next);
    setCfg((prev) => ({ ...prev, connection: next }));
  }

  function setActiveConnection(id: string) {
    if (activeConn.id === id) return;
    setActiveConn((prev) => ({ ...prev }));
  }

  function addDashboard(name: string) {
    const d: Dashboard = { id: crypto.randomUUID(), name, layout: "grid", panels: [] };
    setCfg((prev) => ({ ...prev, dashboards: [...prev.dashboards, d] }));
    setActiveDashId(d.id);
  }

  function selectDashboard(id: string) { setActiveDashId(id); }

  function renameDashboard(id: string, name: string) {
    setCfg((prev) => ({ ...prev, dashboards: prev.dashboards.map((d) => (d.id === id ? { ...d, name } : d)) }));
  }

  function deleteDashboard(id: string) {
    setCfg((prev) => ({ ...prev, dashboards: prev.dashboards.filter((d) => d.id !== id) }));
    if (activeDashId === id) setActiveDashId(prev => (cfg.dashboards.find((d) => d.id !== id)?.id));
  }

  const [panelModalFor, setPanelModalFor] = useState<string | null>(null);

  function addPanel(panel: Panel) {
    if (!panelModalFor) return;
    setCfg((prev) => ({
      ...prev,
      dashboards: prev.dashboards.map((d) => (d.id === panelModalFor ? { ...d, panels: [...d.panels, panel] } : d))
    }));
    setPanelModalFor(null);
  }

  function onSwitchToggle(panel: Panel, next: boolean) {
    if (!client) return;
    const publishTopic = panel.panel_config?.publishTopic;
    if (!publishTopic) return;
    const templ = panel.panel_config?.payload_template ?? "{\"state\":\"{{state}}\"}";
    const payload = templ.replaceAll("{{state}}", next ? "ON" : "OFF");
    client.publish(publishTopic, payload, { qos: panel.panel_config?.qos ?? 0, retain: !!panel.panel_config?.retain });
  }

  function computeSwitchState(panel: Panel, data: unknown): boolean {
    if (data == null) return false;
    const fmt = panel.panel_config?.data_format ?? "raw";
    if (fmt === "json") {
      const path = panel.panel_config?.json_path ?? "$.state";
      const val = extractByJsonPath<string>(data, path);
      return String(val).toUpperCase() === "ON";
    }
    if (fmt === "number") return Number(data) !== 0;
    return String(data).toUpperCase() === "ON";
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iot-panel-config.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importConfig(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as AppConfig;
      setCfg(json);
      location.reload();
    } catch (e) {
      alert("Invalid config JSON");
      console.error(e);
    }
  }

  const url = `${activeConn.protocol}://${activeConn.host}:${activeConn.port}`;

  return (
    <div className="min-h-screen p-4 sm:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-100">IoT MQTT Panel</h1>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
              connected ? "bg-emerald-900/40 text-emerald-300" : "bg-slate-800 text-slate-400"
            }`}
            title={connected ? "Connected" : "Disconnected"}
          >
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`} />
            {connected ? "Connected" : "Disconnected"}
          </span>
          <label className="card px-3 py-2 cursor-pointer text-sm">
            <input type="file" accept="application/json" className="hidden" onChange={(e) => importConfig(e.target.files?.[0] ?? null)} />
            Import Config
          </label>
          <button onClick={exportConfig} className="card px-3 py-2 text-sm">Export Config</button>
        </div>
      </header>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card p-3 text-sm text-slate-400">
            <div className="font-medium text-slate-200 mb-2">Connection</div>
            <div className="mb-2">URL: <code>{url}</code></div>
            <ConnectionForm value={activeConn} onSave={saveConnection} onSetActive={setActiveConnection} activeId={activeConn.id} />
          </div>

          <div className="card p-3 text-sm text-slate-400">
            <div className="font-medium text-slate-200 mb-2">Dashboards</div>
            <DashboardManager
              dashboards={cfg.dashboards}
              activeId={activeDash?.id}
              onAdd={addDashboard}
              onSelect={selectDashboard}
              onRename={renameDashboard}
              onDelete={deleteDashboard}
              onAddPanel={(id) => setPanelModalFor(id)}
            />
          </div>

          {panelModalFor && (
            <div className="card p-3">
              <div className="font-medium text-slate-200 mb-2">New Panel</div>
              <PanelEditor onSave={addPanel} onCancel={() => setPanelModalFor(null)} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <PanelRenderer
            panels={activeDash?.panels ?? []}
            panelData={panelData}
            lineSeries={lineSeries}
            onSwitchToggle={onSwitchToggle}
            computedSwitchState={computeSwitchState}
            reducedMotion={!!reduced}
          />
        </div>
      </section>

      <footer className="text-xs text-slate-500 mt-6">
        Respects <code>prefers-reduced-motion</code>. SPA deployable to Netlify.
      </footer>
    </div>
  );
}
