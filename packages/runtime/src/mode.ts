import type { RuntimeMode } from "./executor.js";
export interface ModeConfig {
  stripUnknownKeys: boolean;
  errorOnUnknownKeys: boolean;
  passthroughUnknownKeys: boolean;
}

export declare function getModeConfig(mode: RuntimeMode): ModeConfig;
