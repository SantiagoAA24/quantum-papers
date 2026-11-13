import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// cmdk usa ResizeObserver y scrollIntoView, que jsdom no implementa.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.scrollIntoView ??= () => {};

afterEach(() => cleanup());
