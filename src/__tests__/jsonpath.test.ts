import { extractByJsonPath } from "../../src/utils/jsonPath";

test("extracts simple value with $.value", () => {
  const payload = { value: 42, ts: 123 };
  expect(extractByJsonPath<number>(payload, "$.value")).toBe(42);
});

test("extracts nested path payload.sensor.temp", () => {
  const payload = { payload: { sensor: { temp: 21.5 } } };
  expect(extractByJsonPath<number>(payload, "$.payload.sensor.temp")).toBe(21.5);
});

test("handles invalid path gracefully", () => {
  const payload = { value: 1 };
  expect(extractByJsonPath<number>(payload, "$.missing")).toBeUndefined();
});
