import {
  ActionType,
  CodeBlock,
  ConditionType,
  Direction,
  LevelGrid,
  Point,
  TileType,
} from '../types/game';

export interface ExecutionStepItem {
  blockId: string;
  parentRepeatId?: string;
  iterationLabel?: string;
  action?: ActionType;
  ifElse?: {
    condition: ConditionType;
    thenAction: ActionType;
    elseAction: ActionType | 'NONE';
  };
}

export interface RuntimeState {
  pos: Point;
  dir: Direction;
  tiles: TileType[][];
  wateredCount: number;
  totalSprouts: number;
  collectedCount: number;
  totalBatteries: number;
  stepIndex: number;
  status: 'IDLE' | 'RUNNING' | 'WON' | 'ERROR' | 'INCOMPLETE';
  message: string;
  activeBlockId: string | null;
  activeParentId: string | null;
  activeIterationLabel: string | null;
  lastSensorCheck: {
    target: Point | null;
    result: boolean;
    label: string;
  } | null;
  lastActionEffect: 'MOVE' | 'TURN' | 'JUMP' | 'WATER' | 'COLLECT' | 'CRASH' | null;
}

export function countTotalBlocks(blocks: CodeBlock[]): number {
  return blocks.reduce((acc, block) => {
    if (block.type === 'REPEAT') {
      return acc + 1 + block.children.length;
    }
    return acc + 1;
  }, 0);
}

export function flattenProgram(blocks: CodeBlock[]): ExecutionStepItem[] {
  const queue: ExecutionStepItem[] = [];

  for (const block of blocks) {
    if (block.type === 'REPEAT') {
      for (let i = 1; i <= block.count; i++) {
        const label = `Loop ${i} of ${block.count}`;
        for (const child of block.children) {
          if (child.type === 'IF_ELSE') {
            queue.push({
              blockId: child.id,
              parentRepeatId: block.id,
              iterationLabel: label,
              ifElse: {
                condition: child.condition,
                thenAction: child.thenAction,
                elseAction: child.elseAction,
              },
            });
          } else {
            queue.push({
              blockId: child.id,
              parentRepeatId: block.id,
              iterationLabel: label,
              action: child.type,
            });
          }
        }
      }
    } else if (block.type === 'IF_ELSE') {
      queue.push({
        blockId: block.id,
        ifElse: {
          condition: block.condition,
          thenAction: block.thenAction,
          elseAction: block.elseAction,
        },
      });
    } else {
      queue.push({
        blockId: block.id,
        action: block.type,
      });
    }
  }

  return queue;
}

export function getDirectionDelta(dir: Direction): Point {
  switch (dir) {
    case 'UP':
      return { x: 0, y: -1 };
    case 'RIGHT':
      return { x: 1, y: 0 };
    case 'DOWN':
      return { x: 0, y: 1 };
    case 'LEFT':
      return { x: -1, y: 0 };
  }
}

export function turnLeft(dir: Direction): Direction {
  const order: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
  return order[(order.indexOf(dir) + 1) % 4];
}

export function turnRight(dir: Direction): Direction {
  const order: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
  return order[(order.indexOf(dir) + 1) % 4];
}

export function createInitialRuntime(grid: LevelGrid): RuntimeState {
  const clonedTiles = grid.tiles.map((row) => [...row]);
  let totalSprouts = 0;
  let totalBatteries = 0;

  for (const row of clonedTiles) {
    for (const tile of row) {
      if (tile === 'sprout') totalSprouts++;
      if (tile === 'battery') totalBatteries++;
    }
  }

  return {
    pos: { ...grid.start },
    dir: grid.startDir,
    tiles: clonedTiles,
    wateredCount: 0,
    totalSprouts,
    collectedCount: 0,
    totalBatteries,
    stepIndex: 0,
    status: 'IDLE',
    message: 'Add code blocks and press Run Code to guide Nova.',
    activeBlockId: null,
    activeParentId: null,
    activeIterationLabel: null,
    lastSensorCheck: null,
    lastActionEffect: null,
  };
}

function isInside(pos: Point, tiles: TileType[][]): boolean {
  return pos.y >= 0 && pos.y < tiles.length && pos.x >= 0 && pos.x < tiles[0].length;
}

function evaluateCondition(
  condition: ConditionType,
  pos: Point,
  dir: Direction,
  tiles: TileType[][]
): { result: boolean; target: Point | null; label: string } {
  const delta = getDirectionDelta(dir);
  const ahead: Point = { x: pos.x + delta.x, y: pos.y + delta.y };

  if (condition === 'WALL_AHEAD') {
    const blocked = !isInside(ahead, tiles) || tiles[ahead.y][ahead.x] === 'wall';
    return {
      result: blocked,
      target: isInside(ahead, tiles) ? ahead : null,
      label: blocked ? 'Wall Ahead: TRUE' : 'Wall Ahead: FALSE',
    };
  }

  if (condition === 'PUDDLE_AHEAD') {
    const hasPuddle = isInside(ahead, tiles) && tiles[ahead.y][ahead.x] === 'puddle';
    return {
      result: hasPuddle,
      target: isInside(ahead, tiles) ? ahead : null,
      label: hasPuddle ? 'Puddle Ahead: TRUE' : 'Puddle Ahead: FALSE',
    };
  }

  const hasSprout = tiles[pos.y][pos.x] === 'sprout';
  return {
    result: hasSprout,
    target: { ...pos },
    label: hasSprout ? 'Sprout Here: TRUE' : 'Sprout Here: FALSE',
  };
}

export function executeNextStep(
  state: RuntimeState,
  queue: ExecutionStepItem[]
): RuntimeState {
  if (state.status === 'WON' || state.status === 'ERROR') {
    return state;
  }

  if (state.stepIndex >= queue.length) {
    const onGoal = state.tiles[state.pos.y][state.pos.x] === 'goal';
    if (!onGoal) {
      return {
        ...state,
        status: 'INCOMPLETE',
        activeBlockId: null,
        activeParentId: null,
        message: 'Program finished, but Nova did not reach the goal pad yet. Try adding more blocks!',
      };
    }
    return {
      ...state,
      status: 'INCOMPLETE',
      activeBlockId: null,
      activeParentId: null,
      message: 'Nova reached the goal, but some sprouts or batteries were missed!',
    };
  }

  const item = queue[state.stepIndex];
  const nextTiles = state.tiles.map((r) => [...r]);
  let pos = { ...state.pos };
  let dir = state.dir;
  let wateredCount = state.wateredCount;
  let collectedCount = state.collectedCount;
  let lastSensorCheck: RuntimeState['lastSensorCheck'] = null;
  let actionToRun: ActionType | 'NONE' = item.action ?? 'NONE';
  let statusMsg = '';

  if (item.ifElse) {
    const check = evaluateCondition(item.ifElse.condition, pos, dir, nextTiles);
    lastSensorCheck = check;
    actionToRun = check.result ? item.ifElse.thenAction : item.ifElse.elseAction;
    statusMsg = `${check.label} -> ${actionToRun === 'NONE' ? 'Skip' : formatActionLabel(actionToRun)}`;
  } else if (actionToRun !== 'NONE') {
    statusMsg = `Running: ${formatActionLabel(actionToRun)}`;
  }

  let effect: RuntimeState['lastActionEffect'] = null;

  if (actionToRun === 'MOVE') {
    const delta = getDirectionDelta(dir);
    const nextPos = { x: pos.x + delta.x, y: pos.y + delta.y };
    if (!isInside(nextPos, nextTiles)) {
      return {
        ...state,
        status: 'ERROR',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: 'CRASH',
        message: 'Oops! Nova drove off the edge of the floor grid.',
      };
    }
    const targetTile = nextTiles[nextPos.y][nextPos.x];
    if (targetTile === 'wall') {
      return {
        ...state,
        status: 'ERROR',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: 'CRASH',
        message: 'Bonk! Nova bumped into a crate. Try turning or checking with a sensor.',
      };
    }
    if (targetTile === 'puddle') {
      return {
        ...state,
        pos: nextPos,
        status: 'ERROR',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: 'CRASH',
        message: 'Splash! Nova rolled into a puddle. Use Jump to leap over puddles!',
      };
    }
    pos = nextPos;
    effect = 'MOVE';
  } else if (actionToRun === 'JUMP') {
    const delta = getDirectionDelta(dir);
    const landPos = { x: pos.x + delta.x * 2, y: pos.y + delta.y * 2 };
    if (!isInside(landPos, nextTiles)) {
      return {
        ...state,
        status: 'ERROR',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: 'CRASH',
        message: 'Oops! That jump would land outside the lab floor.',
      };
    }
    const landTile = nextTiles[landPos.y][landPos.x];
    if (landTile === 'wall') {
      return {
        ...state,
        status: 'ERROR',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: 'CRASH',
        message: 'Bonk! There is a crate right where Nova tried to land.',
      };
    }
    if (landTile === 'puddle') {
      return {
        ...state,
        pos: landPos,
        status: 'ERROR',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: 'CRASH',
        message: 'Splash! Nova jumped right onto another puddle.',
      };
    }
    pos = landPos;
    effect = 'JUMP';
  } else if (actionToRun === 'TURN_LEFT') {
    dir = turnLeft(dir);
    effect = 'TURN';
  } else if (actionToRun === 'TURN_RIGHT') {
    dir = turnRight(dir);
    effect = 'TURN';
  } else if (actionToRun === 'WATER') {
    if (nextTiles[pos.y][pos.x] === 'sprout') {
      nextTiles[pos.y][pos.x] = 'empty';
      wateredCount += 1;
      statusMsg = 'Sprout watered! Leaves perked right up.';
    } else {
      statusMsg = 'Sprayed water mist (no sprout on this tile).';
    }
    effect = 'WATER';
  }

  // Auto-collect battery if Nova lands on it
  if (nextTiles[pos.y][pos.x] === 'battery') {
    nextTiles[pos.y][pos.x] = 'empty';
    collectedCount += 1;
    effect = 'COLLECT';
    statusMsg = 'Collected an Energy Cell!';
  }

  const nextStepIndex = state.stepIndex + 1;
  const onGoal = nextTiles[pos.y][pos.x] === 'goal';
  const allSproutsDone = wateredCount >= state.totalSprouts;
  const allBatteriesDone = collectedCount >= state.totalBatteries;

  if (onGoal && allSproutsDone && allBatteriesDone) {
    return {
      ...state,
      pos,
      dir,
      tiles: nextTiles,
      wateredCount,
      collectedCount,
      stepIndex: nextStepIndex,
      status: 'WON',
      activeBlockId: item.blockId,
      activeParentId: item.parentRepeatId ?? null,
      activeIterationLabel: item.iterationLabel ?? null,
      lastSensorCheck,
      lastActionEffect: effect,
      message: 'Mission Complete! Nova followed your program and powered the objective.',
    };
  }

  // Check if queue ends right after this step
  if (nextStepIndex >= queue.length) {
    if (onGoal && (!allSproutsDone || !allBatteriesDone)) {
      return {
        ...state,
        pos,
        dir,
        tiles: nextTiles,
        wateredCount,
        collectedCount,
        stepIndex: nextStepIndex,
        status: 'INCOMPLETE',
        activeBlockId: item.blockId,
        activeParentId: item.parentRepeatId ?? null,
        activeIterationLabel: item.iterationLabel ?? null,
        lastSensorCheck,
        lastActionEffect: effect,
        message: 'Almost! Nova reached the goal, but check if any sprouts or batteries remain.',
      };
    }
    return {
      ...state,
      pos,
      dir,
      tiles: nextTiles,
      wateredCount,
      collectedCount,
      stepIndex: nextStepIndex,
      status: 'INCOMPLETE',
      activeBlockId: item.blockId,
      activeParentId: item.parentRepeatId ?? null,
      activeIterationLabel: item.iterationLabel ?? null,
      lastSensorCheck,
      lastActionEffect: effect,
      message: 'Program reached the end before Nova finished the mission. Add or adjust blocks!',
    };
  }

  return {
    ...state,
    pos,
    dir,
    tiles: nextTiles,
    wateredCount,
    collectedCount,
    stepIndex: nextStepIndex,
    status: 'RUNNING',
    activeBlockId: item.blockId,
    activeParentId: item.parentRepeatId ?? null,
    activeIterationLabel: item.iterationLabel ?? null,
    lastSensorCheck,
    lastActionEffect: effect,
    message: statusMsg,
  };
}

export function formatActionLabel(action: ActionType | 'NONE'): string {
  switch (action) {
    case 'MOVE':
      return 'Move Forward';
    case 'TURN_LEFT':
      return 'Turn Left';
    case 'TURN_RIGHT':
      return 'Turn Right';
    case 'JUMP':
      return 'Jump 2 Tiles';
    case 'WATER':
      return 'Water Sprout';
    case 'NONE':
      return 'Do Nothing';
  }
}

export function formatConditionLabel(condition: ConditionType): string {
  switch (condition) {
    case 'WALL_AHEAD':
      return 'Wall Ahead';
    case 'PUDDLE_AHEAD':
      return 'Puddle Ahead';
    case 'SPROUT_HERE':
      return 'Sprout Here';
  }
}
