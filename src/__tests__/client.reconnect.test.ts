import { connectMqttLazy } from "../../src/mqtt/client";
import type { MqttClient } from "mqtt";

jest.mock("mqtt", () => {
  const handlers: Record<string, Function[]> = {};
  const fakeClient: Partial<MqttClient> = {
    on: (ev: string, cb: Function) => {
      handlers[ev] = handlers[ev] || [];
      handlers[ev].push(cb);
      return fakeClient as MqttClient;
    },
    end: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn()
  };
  const connect = jest.fn(() => {
    setTimeout(() => handlers["connect"]?.forEach((cb) => cb()), 5);
    setTimeout(() => handlers["close"]?.forEach((cb) => cb()), 10);
    setTimeout(() => handlers["reconnect"]?.forEach((cb) => cb()), 15);
    setTimeout(() => handlers["connect"]?.forEach((cb) => cb()), 20);
    return fakeClient as MqttClient;
  });
  return { __esModule: true, default: { connect }, connect };
});

test("connects and reconnects", async () => {
  const client = await connectMqttLazy({ url: "wss://example.com/mqtt" });
  const events: string[] = [];

  (client as any).on("connect", () => events.push("connect"));
  (client as any).on("reconnect", () => events.push("reconnect"));
  (client as any).on("close", () => events.push("close"));

  await new Promise((r) => setTimeout(r, 40));
  expect(events).toEqual(expect.arrayContaining(["connect", "close", "reconnect"]));
});
