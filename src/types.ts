export type DataFormat = "raw" | "json" | "number";
export type PanelType =
  | "button"
  | "switch"
  | "slider"
  | "text_input"
  | "text_log"
  | "node_status"
  | "combo_box"
  | "radio_buttons"
  | "led_indicator"
  | "multi_state_indicator"
  | "progress"
  | "gauge"
  | "color_picker"
  | "date_time_picker"
  | "line_graph"
  | "bar_graph"
  | "pie_chart"
  | "image"
  | "barcode_scan"
  | "uri_launcher"
  | "layout_decorator";

export type Appearance = {
  icon?: string;
  color?: string;
  width?: number;
  height?: number;
};

export type Panel = {
  id: string;
  type: PanelType;
  title: string;
  topic: string; // primary subscribe or publish topic
  sample_payload?: string;
  panel_config?: {
    publishTopic?: string;
    data_format?: DataFormat;
    json_path?: string;
    payload_template?: string;
    transforms?: { min?: number; max?: number; unit?: string; scale?: number; offset?: number };
    options?: unknown;
    conditions?: Record<string, unknown>;
    states?: Record<string, string>;
    uri_template?: string;
    publishOnly?: boolean;
    qos?: 0 | 1 | 2;
    retain?: boolean;
    appearance?: Appearance;
    [k: string]: unknown;
  };
};

export type Dashboard = {
  id: string;
  name: string;
  layout?: "grid";
  panels: Panel[];
};

export type ConnectionConfig = {
  id: string;
  name: string;
  protocol: "ws" | "wss" | "mqtt" | "mqtts";
  host: string;
  port: number;
  clientId?: string | null;
  username?: string | null;
  password?: string | null;
  keepalive?: number;
  tls?: boolean;
  autoReconnect?: boolean;
};

export type AppConfig = {
  version: "1.0";
  connection?: ConnectionConfig; // for compatibility with examples
  connections?: ConnectionConfig[];
  dashboards: Dashboard[];
  activeConnectionId?: string;
  activeDashboardId?: string;
};
