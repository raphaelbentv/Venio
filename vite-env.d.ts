/// <reference types="vite/client" />

interface VantaEffect {
  destroy(): void;
}

interface Window {
  VANTA?: {
    WAVES?: (options: Record<string, unknown>) => VantaEffect;
  };
}
