export function debugLog(enabled: boolean, ...args: unknown[]): void {
  if (enabled) {
    console.log(...args);
  }
}
