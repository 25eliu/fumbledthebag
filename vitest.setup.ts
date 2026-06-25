import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

/**
 * Clipboard compatibility shim
 *
 * @testing-library/user-event v14 calls Object.defineProperty on navigator.clipboard
 * to install its own stub (a getter). This overrides any clipboard mock set earlier
 * via Object.assign(navigator, { clipboard: ... }).
 *
 * This shim:
 *  1. Intercepts Object.assign on navigator so we know when a test sets a clipboard mock.
 *  2. Intercepts Object.defineProperty on navigator.clipboard so user-event's stub
 *     installation is redirected to use the test's mock instead.
 *  3. Resets the tracked mock before each test for isolation.
 */

// Track the clipboard mock set by the current test via Object.assign
let _pendingClipboardMock: unknown = null;

// Intercept Object.assign to capture navigator.clipboard assignments
const _origAssign = Object.assign;
Object.assign = function (target: unknown, ...sources: unknown[]) {
  for (const source of sources) {
    if (
      target === navigator &&
      source !== null &&
      typeof source === "object" &&
      "clipboard" in source
    ) {
      _pendingClipboardMock = (source as Record<string, unknown>).clipboard;
    }
  }
  return _origAssign.call(Object, target, ...sources) as typeof target;
} as typeof Object.assign;

// Intercept Object.defineProperty to redirect user-event's clipboard stub installation
const _origDefineProperty = Object.defineProperty;
Object.defineProperty = function (
  obj: unknown,
  prop: PropertyKey,
  descriptor: PropertyDescriptor
) {
  if (obj === navigator && prop === "clipboard" && _pendingClipboardMock !== null) {
    // Redirect: install the test's mock instead of user-event's getter stub
    return _origDefineProperty.call(Object, obj, prop, {
      value: _pendingClipboardMock,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
  return _origDefineProperty.call(Object, obj, prop, descriptor);
} as typeof Object.defineProperty;

// Reset the tracked mock before each test for isolation
beforeEach(() => {
  _pendingClipboardMock = null;
});
