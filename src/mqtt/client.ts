import mqtt, { MqttClient, IClientOptions } from "mqtt";

export type ConnectOptions = IClientOptions & {
  url: string;
};

export function connectMqtt(options: ConnectOptions): MqttClient {
  const { url, ...opts } = options;

  const client = mqtt.connect(url, {
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

  client.on("error", (err) => {
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
