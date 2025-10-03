import type { MqttClient, IClientOptions } from "mqtt";

export type ConnectOptions = IClientOptions & { url: string };

export async function connectMqttLazy(options: ConnectOptions): Promise<MqttClient> {
  const { url, ...opts } = options;
  const mqttMod = await import("mqtt");
  const mqtt = (mqttMod as any).default ?? (mqttMod as any);
  const client: MqttClient = mqtt.connect(url, {
    keepalive: 60,
    reconnectPeriod: 1000,
    clean: true,
    ...opts
  });

  client.on("reconnect", () => {
    console.info("[mqtt] reconnecting...");
  });

  client.on("close", () => {
    console.info("[mqtt] connection closed");
  });

  client.on("error", (err: unknown) => {
    console.error("[mqtt] error:", err);
  });

  return client;
}

export function gracefulEnd(client: MqttClient | null) {
  try {
    client?.end(true);
  } catch {
    // no-op
  }
}
