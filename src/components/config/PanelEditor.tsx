import React, { useState } from "react";
import type { Panel, PanelType } from "../../types";

type Props = {
  onSave: (panel: Panel) => void;
  onCancel: () => void;
};

const panelTypes: PanelType[] = [
  "switch", "line_graph", "button", "slider", "text_input", "text_log", "node_status",
  "combo_box", "radio_buttons", "led_indicator", "multi_state_indicator", "progress",
  "gauge", "color_picker", "date_time_picker", "bar_graph", "pie_chart", "image",
  "barcode_scan", "uri_launcher", "layout_decorator"
];

export default function PanelEditor({ onSave, onCancel }: Props) {
  const [type, setType] = useState<PanelType>("switch");
  const [title, setTitle] = useState("New Panel");
  const [topic, setTopic] = useState("");
  const [publishTopic, setPublishTopic] = useState("");
  const [dataFormat, setDataFormat] = useState<"raw"|"json"|"number">("raw");
  const [jsonPath, setJsonPath] = useState("");
  const [template, setTemplate] = useState("");
  const [unit, setUnit] = useState("");

  const create = (): Panel => ({
    id: crypto.randomUUID(),
    type,
    title,
    topic,
    panel_config: {
      publishTopic: publishTopic || undefined,
      data_format: dataFormat,
      json_path: jsonPath || undefined,
      payload_template: template || undefined,
      transforms: unit ? { unit } : undefined,
      appearance: { width: 2, height: 1 }
    }
  });

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Type
          <select className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value as PanelType)}>
            {panelTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">Title
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="text-sm">Topic
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" placeholder="subscribe or publish topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </label>
        <label className="text-sm">Publish Topic
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" placeholder="optional" value={publishTopic} onChange={(e) => setPublishTopic(e.target.value)} />
        </label>
        <label className="text-sm">Data Format
          <select className="w-full mt-1 bg-slate-800 rounded px-2 py-1" value={dataFormat} onChange={(e) => setDataFormat(e.target.value as any)}>
            <option value="raw">raw</option>
            <option value="json">json</option>
            <option value="number">number</option>
          </select>
        </label>
        <label className="text-sm">JSONPath
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" placeholder="e.g. $.value" value={jsonPath} onChange={(e) => setJsonPath(e.target.value)} />
        </label>
        <label className="text-sm">Payload Template
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" placeholder='e.g. {"state":"{{state}}"}' value={template} onChange={(e) => setTemplate(e.target.value)} />
        </label>
        <label className="text-sm">Unit
          <input className="w-full mt-1 bg-slate-800 rounded px-2 py-1" placeholder="e.g. °C or %" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button className="card px-3 py-2" onClick={() => onSave(create())}>Save</button>
        <button className="card px-3 py-2" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
