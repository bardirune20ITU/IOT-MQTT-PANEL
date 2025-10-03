import React from "react";
import type { Panel } from "../types";
import { LineGraph, type LineGraphPoint } from "./LineGraph";
import { SwitchPanel } from "./SwitchPanel";

type Props = {
  panels: Panel[];
  panelData: Record<string, unknown>;
  lineSeries: Record<string, LineGraphPoint[]>;
  onSwitchToggle: (panel: Panel, next: boolean) => void;
  computedSwitchState: (panel: Panel, data: unknown) => boolean;
  reducedMotion: boolean;
};

export default function PanelRenderer({
  panels, panelData, lineSeries, onSwitchToggle, computedSwitchState, reducedMotion
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {panels.map((p) => {
        if (p.type === "line_graph") {
          const points = lineSeries[p.id] ?? [];
          const unit = p.panel_config?.transforms?.unit as string | undefined;
          return (
            <div key={p.id} className="lg:col-span-2">
              <LineGraph title={p.title} unit={unit} points={points} reducedMotion={reducedMotion} />
            </div>
          );
        }
        if (p.type === "switch") {
          const d = panelData[p.id];
          const isOn = computedSwitchState(p, d);
          return (
            <div key={p.id}>
              <SwitchPanel label={p.title} isOn={isOn} onToggle={() => onSwitchToggle(p, !isOn)} />
            </div>
          );
        }
        return (
          <div key={p.id} className="card p-4">
            <div className="text-slate-300 text-sm">{p.title}</div>
            <div className="text-slate-500 text-xs mt-2">Panel type “{p.type}” placeholder</div>
          </div>
        );
      })}
    </div>
  );
}
