export declare function timeoutSignal(ms: number): { aborted: boolean };
export declare function combineSignals(...signals: Array<{ aborted: boolean }>): {
  aborted: boolean;
};
export declare function signalToPromise(signal: { aborted: boolean }): Promise<never>;
