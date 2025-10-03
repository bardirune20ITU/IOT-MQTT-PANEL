# IoT MQTT Panel (React + Vite + Tailwind + TypeScript)

A modern, minimal, responsive web-based IoT MQTT Panel SPA with realtime charts, switches, import/exportable dashboards, and Netlify deployment. Uses mqtt.js over WebSockets, Chart.js for visualization, and Framer Motion with `prefers-reduced-motion`.

## Features
- Multi-connection MQTT client (WebSockets) with reconnect
- Panels: Line Graph (Chart.js) and Switch (publish)
- JSON/JSONPath value extraction
- Import/Export dashboard JSON to/from localStorage
- Netlify-ready static build with SPA redirects
- Animations respecting `prefers-reduced-motion`

## Quickstart
```bash
npm ci
npm run dev
# build
npm run build
npm run preview
```

Open http://localhost:5173

## Demo Connection
- Default connects to `wss://test.mosquitto.org:8081`
- Subscribes to `demo/temperature` and logs/chart updates

## Import the Example Dashboard
- File: `examples/demo-dashboard.json`
- In the app: use Import -> select the file
- Export: click Export to download current config

## Netlify Deployment
1) Create a new site from your GitHub repo in Netlify
2) Set build command: `npm run build`
3) Set publish directory: `dist`
4) Ensure `netlify.toml` exists with SPA redirects:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
5) Deploy

## Mosquitto WebSockets Bridging (Example)
To bridge via WebSockets (public broker shown; adjust for your broker):
```bash
# /etc/mosquitto/conf.d/bridge.conf
connection websockets_bridge
address test.mosquitto.org:8081
topic # out 0
topic # in 0
```
Restart Mosquitto after changes.

## Security Notes
- Use TLS (`wss://`) endpoints; avoid plain `ws://` in production.
- Broker auth: prefer short-lived tokens; never store secrets in client-side code.
- Content Security Policy (recommend):
  - Default deny, allow self for scripts/styles, restrict connect-src to your broker origin.
- Prevent XSS by sanitizing any text displayed from broker messages.
- Validate imported configs; only allow known schema keys.
- Multi-tenant? Terminate TLS at a trusted gateway; avoid exposing private brokers directly.

## Smoke Test (mqtt.js)
```js
// Smoke test: connect to Mosquitto WebSocket broker and log demo/temperature
// Requires mqtt.js (npm i mqtt)
import mqtt from "mqtt";

const client = mqtt.connect("wss://test.mosquitto.org:8081", {
  keepalive: 60,
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  console.log("[smoke] connected to wss://test.mosquitto.org:8081");
  client.subscribe("demo/temperature", { qos: 0 }, (err) => {
    if (!err) console.log("[smoke] subscribed to demo/temperature");
    else console.error("[smoke] subscribe error:", err);
  });
});

client.on("message", (topic, message) => {
  const raw = message.toString();
  try {
    const payload = JSON.parse(raw);
    console.log(`[smoke] ${topic} -> value:`, payload.value, "ts:", payload.ts);
  } catch (e) {
    console.log(`[smoke] ${topic} (raw):`, raw);
  }
});

client.on("error", (err) => {
  console.error("[smoke] mqtt error:", err);
});
```

## Packaging
```bash
npm run build
cd dist
zip -r ../build-artifact.zip .
```

## License
MIT
