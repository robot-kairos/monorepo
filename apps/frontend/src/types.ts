export type Accent = 'amber' | 'green' | 'cyan' | 'violet';
export type TempUnit = 'C' | 'F';

export interface Temperature {
  tempC: number;
}

export interface Vitals {
  hr: number;
  br: number;
  distance: number;
}

export interface RobotState {
  temperature: Temperature;
  vitals: Vitals;
  playing: string | null;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERR';

export interface LogEntry {
  t: string;
  lvl: LogLevel;
  m: string;
}

export const DEFAULT_STATE: RobotState = {
  temperature: { tempC: 23.6 },
  vitals: { hr: 78, br: 16, distance: 3.42 },
  playing: null,
};

export type WsOutMessage =
  | { type: 'ptt_start' }
  | { type: 'ptt_stop' }
  | { type: 'play_sound'; id: string }
  | { type: 'stop_sound' };

/** CSS variable references — use in DOM/inline styles */
export const ACCENTS: Record<Accent, string> = {
  amber: 'var(--amber)',
  green: 'var(--green)',
  cyan: 'var(--cyan)',
  violet: 'var(--violet)',
};

/** Resolved oklch values — use inside Canvas 2D contexts (no CSS var support) */
export const CANVAS_COLORS: Record<Accent, string> = {
  amber:  'oklch(0.82 0.15 75)',
  green:  'oklch(0.82 0.16 155)',
  cyan:   'oklch(0.82 0.11 210)',
  violet: 'oklch(0.72 0.12 290)',
};

export const CANVAS_FG       = 'oklch(0.95 0.005 250)';
export const CANVAS_FG_MUTE  = 'oklch(0.52 0.012 250)';

export interface Tweaks {
  accent: Accent;
  density: 'comfortable' | 'compact';
  unitTemp: TempUnit;
  gridLines: boolean;
}

export const DEFAULT_TWEAKS: Tweaks = {
  accent: 'amber',
  density: 'comfortable',
  unitTemp: 'C',
  gridLines: true,
};
