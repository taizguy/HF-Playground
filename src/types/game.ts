export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export type TileType = 'empty' | 'wall' | 'puddle' | 'sprout' | 'battery' | 'goal';

export type ActionType = 'MOVE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'JUMP' | 'WATER';

export type ConditionType = 'WALL_AHEAD' | 'PUDDLE_AHEAD' | 'SPROUT_HERE';

export interface ActionBlock {
  id: string;
  type: ActionType;
}

export interface RepeatBlock {
  id: string;
  type: 'REPEAT';
  count: number;
  children: ActionBlockOrIf[];
}

export interface IfElseBlock {
  id: string;
  type: 'IF_ELSE';
  condition: ConditionType;
  thenAction: ActionType;
  elseAction: ActionType | 'NONE';
}

export type ActionBlockOrIf = ActionBlock | IfElseBlock;
export type CodeBlock = ActionBlock | RepeatBlock | IfElseBlock;

export type BlockToolType = ActionType | 'REPEAT' | 'IF_ELSE';

export interface Point {
  x: number;
  y: number;
}

export interface LevelGrid {
  width: number;
  height: number;
  tiles: TileType[][]; // [y][x]
  start: Point;
  startDir: Direction;
}

export interface LevelDefinition {
  id: string;
  chapterId: string;
  number: number;
  title: string;
  conceptTag: string;
  goalSummary: string;
  hint: string;
  parBlocks: number;
  maxBlocks: number;
  availableTools: BlockToolType[];
  grid: LevelGrid;
  starterProgram?: CodeBlock[];
  isDebugLevel?: boolean;
}

export interface ChapterDefinition {
  id: string;
  number: number;
  title: string;
  concept: string;
  subtitle: string;
  imagePath: string;
  imageAlt: string;
  storyLines: {
    speaker: string;
    text: string;
  }[];
  stemTakeaway: string;
  miniLabType: 'SEQUENCER' | 'LOOP_COMPRESSOR' | 'SENSOR_TESTER' | 'BINARY_SWITCH';
  levelIds: string[];
}

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestBlocks: number;
}

export interface SavedProgress {
  levels: Record<string, LevelProgress>;
  miniLabsCompleted: Record<string, boolean>;
  soundEnabled: boolean;
}
