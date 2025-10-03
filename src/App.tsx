import React, { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { connectMqttLazy, gracefulEnd } from "./mqtt/client";
import type { MqttClient } from "mqtt";
import { extractByJsonPath } from "./utils/jsonPath";
import { LineGraph, type LineGraphPoint } from "./components/LineGraph";
import "./index.css";

type SavedConfig = {
  url: string;
  topics: string[];
};

const DEFAULT_URL = "wss://test.mosquitto.org:8081";
const DEFAULT_TOPICS = ["demo/temperature"];

export default function App() {
  const reduced = useReducedMotion();
  const [client, setClient] = useState<MqttClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [fanOn, setFanOn] = useState<boolean>(false);
  const [points, setPoints] = useState<LineGraphPoint[]>([]);

  const saved: SavedConfig = useMemo(() => {
    try {
      const raw = localStorage.getItem("iot-panel-config");
      return raw ? JSON.parse(raw) : { url: DEFAULT_URL, topics: DEFAULT_TOPICS };
    } catch {
      return { url: DEFAULT_URL, topics: DEFAULT_TOPICS };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    connectMqttLazy({ url: saved.url, keepalive: 60, reconnectPeriod: 1000 }).then((c) => {
      if (!mounted) return;
      setClient(c);

    c.on("connect", () => {
      setConnected(true);
      console.info("[app] connected", saved.url);
      for (const t of saved.topics) {
        c.subscribe(t, { qos: 0 }, (err) => {
          if (err) console.error("[app] subscribe error", t, err);
        });
      }
    });

    c.on("close", () => setConnected(false));

    c.on("message", (topic, payload) => {
      const raw = payload.toString();
      if (topic === "demo/temperature") {
        try {
          const parsed = JSON.parse(raw);
          const val = extractByJsonPath<number>(parsed, "$.value");
          const ts = extractByJsonPath<number>(parsed, "$.ts") ?? Date.now();
          if (typeof val === "number") {
            setPoints((prev) => [...prev, { x: ts * (ts < 10_000_000_000 ? 1000 : 1), y: val }].slice(-200));
          }
        } catch {
          const num = Number(raw);
          if (!Number.isNaN(num)) {
            setPoints((prev) => [...prev, { x: Date.now(), y: num }].slice(-200));
          }
        }
      }
    });

      return () => {
        gracefulEnd(c);
      };
    });

    return () => {
      mounted = false;
    };
  }, [saved.url, saved.topics]);

  const exportConfig = () => {
    const cfg: SavedConfig = { url: saved.url, topics: saved.topics };
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iot-panel-config.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importConfig = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    try {
      const cfg = JSON.parse(text) as SavedConfig;
      localStorage.setItem("iot-panel-config", JSON.stringify(cfg));
      location.reload();
    } catch (e) {
      alert("Invalid config JSON");
      console.error(e);
    }
  };

  const toggleFan = () => {
    if (!client) return;
    const next = !fanOn;
    setFanOn(next);
    client.publish("home/livingroom/fan/set", JSON.stringify({ state: next ? "ON" : "OFF" }), {
      qos: 0,
      retain: false
    });
  };

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
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`}></span>
            {connected ? "Connected" : "Disconnected"}
          </span>
          <label className="card px-3 py-2 cursor-pointer text-sm">
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => importConfig(e.target.files?.[0] ?? null)}
            />
            Import
          </label>
          <button onClick={exportConfig} className="card px-3 py-2 text-sm">
            Export
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineGraph
            title="demo/temperature"
            unit="°C"
            points={points}
            reducedMotion={reduced || false}
          />
        </div>

        <div className="space-y-4">
          <SwitchPanel label="Ceiling Fan" isOn={fanOn} onToggle={toggleFan} />
          <div className="card p-4 text-sm space-y-2">
            <div className="font-medium text-slate-200">Connection</div>
            <div className="text-slate-400 break-all">{saved.url}</div>
            <div className="text-slate-400">Topics: {saved.topics.join(", ")}</div>
          </div>
        </div>
      </main>

      <footer className="text-xs text-slate-500">
        Respects <code>prefers-reduced-motion</code>. SPA deployable to Netlify.
      </footer>
    </div>
  );
}
