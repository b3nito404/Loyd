import type { RuntimeMode } from "./executor.js";

export interface ModeConfig {
  stripUnknownKeys: boolean;
  errorOnUnknownKeys: boolean;
  passthroughUnknownKeys: boolean;
}

const CONFIGS: Record<RuntimeMode, ModeConfig> = {
  strip: {
    stripUnknownKeys: true,
    errorOnUnknownKeys: false,
    passthroughUnknownKeys: false,
  },
  strict: {
    stripUnknownKeys: false,
    errorOnUnknownKeys: true,
    passthroughUnknownKeys: false,
  },
  passthrough: {
    stripUnknownKeys: false,
    errorOnUnknownKeys: false,
    passthroughUnknownKeys: true,
  },
};

export function getModeConfig(mode: RuntimeMode): ModeConfig {
  return CONFIGS[mode];
}
