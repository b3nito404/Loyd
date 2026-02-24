export function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Loyd validation timed out after ${ms}ms`)),
    ms,
  );
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}

export function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  const onAbort = (reason: unknown): void => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => onAbort(signal.reason), { once: true });
  }
  return controller.signal;
}

export function signalToPromise(signal: AbortSignal): Promise<never> {
  return new Promise<never>((_, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason ?? new Error("Aborted")), {
      once: true,
    });
  });
}
