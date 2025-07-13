export type SawPattern = {
  pattern: string;
  speedMultiplier: number;
};

export type Saw = SawPattern & {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  time: number;
  spawnEdge: 'top' | 'bottom' | 'left' | 'right';
};

    