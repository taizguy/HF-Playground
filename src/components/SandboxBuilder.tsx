import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  Box,
  CheckCircle2,
  CornerUpRight,
  Droplets,
  Eraser,
  GitBranch,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  SkipForward,
  Sprout,
  Trash2,
  Waves,
  Zap,
} from 'lucide-react';
import {
  createInitialRuntime,
  executeNextStep,
  flattenProgram,
  formatActionLabel,
  formatConditionLabel,
  RuntimeState,
  turnRight,
} from '../engine/interpreter';
import {
  ActionBlockOrIf,
  ActionType,
  BlockToolType,
  CodeBlock,
  ConditionType,
  LevelGrid,
  TileType,
} from '../types/game';
import { sound } from '../utils/sound';
import { NovaSprite } from './NovaSprite';

type BrushTool = TileType | 'START';

const makeId = () => `sb-${Math.random().toString(36).slice(2, 9)}`;

const DEFAULT_GRID: LevelGrid = {
  width: 6,
  height: 5,
  start: { x: 0, y: 2 },
  startDir: 'RIGHT',
  tiles: [
    ['empty', 'empty', 'wall', 'empty', 'empty', 'empty'],
    ['empty', 'sprout', 'wall', 'empty', 'battery', 'empty'],
    ['empty', 'empty', 'puddle', 'empty', 'empty', 'goal'],
    ['empty', 'empty', 'wall', 'empty', 'sprout', 'empty'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ],
};

const ALL_TOOLS: BlockToolType[] = [
  'MOVE',
  'TURN_LEFT',
  'TURN_RIGHT',
  'JUMP',
  'WATER',
  'REPEAT',
  'IF_ELSE',
];

const ALL_ACTIONS: ActionType[] = ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'JUMP', 'WATER'];
const CONDITIONS: ConditionType[] = ['PUDDLE_AHEAD', 'WALL_AHEAD', 'SPROUT_HERE'];

export const SandboxBuilder: React.FC = () => {
  const [grid, setGrid] = useState<LevelGrid>(() => JSON.parse(JSON.stringify(DEFAULT_GRID)));
  const [brush, setBrush] = useState<BrushTool>('wall');
  const [program, setProgram] = useState<CodeBlock[]>([
    { id: 'sb-init-1', type: 'MOVE' },
    { id: 'sb-init-2', type: 'JUMP' },
    { id: 'sb-init-3', type: 'MOVE' },
    { id: 'sb-init-4', type: 'MOVE' },
  ]);
  const [runtime, setRuntime] = useState<RuntimeState>(() => createInitialRuntime(DEFAULT_GRID));
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeRepeatId, setActiveRepeatId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const queue = useMemo(() => flattenProgram(program), [program]);

  useEffect(() => {
    if (!isAutoPlaying) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    timerRef.current = window.setInterval(() => {
      setRuntime((prev) => {
        const next = executeNextStep(prev, queue);
        if (next.status === 'WON') sound.win();
        else if (next.status === 'ERROR') sound.error();
        else if (next.lastActionEffect === 'COLLECT') sound.collect();
        else if (next.lastActionEffect === 'WATER') sound.water();
        else if (next.lastActionEffect === 'JUMP') sound.jump();
        else if (next.lastActionEffect === 'MOVE') sound.step();
        if (next.status === 'WON' || next.status === 'ERROR' || next.status === 'INCOMPLETE') {
          setIsAutoPlaying(false);
        }
        return next;
      });
    }, 360);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isAutoPlaying, queue]);

  const resetToGrid = (targetGrid: LevelGrid) => {
    setIsAutoPlaying(false);
    setRuntime(createInitialRuntime(targetGrid));
  };

  const handleTileClick = (x: number, y: number) => {
    if (isAutoPlaying) return;
    sound.click();

    const nextGrid: LevelGrid = {
      ...grid,
      tiles: grid.tiles.map((r) => [...r]),
      start: { ...grid.start },
    };

    if (brush === 'START') {
      nextGrid.tiles[y][x] = 'empty';
      nextGrid.start = { x, y };
    } else {
      if (nextGrid.start.x === x && nextGrid.start.y === y) {
        return; // Keep Nova start tile clear
      }
      nextGrid.tiles[y][x] = brush;
    }

    setGrid(nextGrid);
    resetToGrid(nextGrid);
  };

  const rotateStartDir = () => {
    sound.turn();
    const nextGrid = { ...grid, startDir: turnRight(grid.startDir) };
    setGrid(nextGrid);
    resetToGrid(nextGrid);
  };

  const clearBoard = () => {
    sound.click();
    const emptyTiles: TileType[][] = Array.from({ length: grid.height }, () =>
      Array.from({ length: grid.width }, () => 'empty')
    );
    emptyTiles[2][5] = 'goal';
    const cleanGrid: LevelGrid = {
      width: 6,
      height: 5,
      start: { x: 0, y: 2 },
      startDir: 'RIGHT',
      tiles: emptyTiles,
    };
    setGrid(cleanGrid);
    resetToGrid(cleanGrid);
  };

  const addTool = (tool: BlockToolType) => {
    sound.click();
    resetToGrid(grid);
    if (tool === 'REPEAT') {
      const blk: CodeBlock = { id: makeId(), type: 'REPEAT', count: 3, children: [] };
      setProgram((p) => [...p, blk]);
      setActiveRepeatId(blk.id);
      return;
    }
    const leaf: ActionBlockOrIf =
      tool === 'IF_ELSE'
        ? {
            id: makeId(),
            type: 'IF_ELSE',
            condition: 'PUDDLE_AHEAD',
            thenAction: 'JUMP',
            elseAction: 'MOVE',
          }
        : { id: makeId(), type: tool };

    if (activeRepeatId) {
      setProgram((prev) =>
        prev.map((blk) =>
          blk.id === activeRepeatId && blk.type === 'REPEAT'
            ? { ...blk, children: [...blk.children, leaf] }
            : blk
        )
      );
      return;
    }
    setProgram((p) => [...p, leaf]);
  };

  const updateRepeatCount = (id: string, delta: -1 | 1) => {
    sound.click();
    resetToGrid(grid);
    setProgram((prev) =>
      prev.map((blk) =>
        blk.id === id && blk.type === 'REPEAT'
          ? { ...blk, count: Math.min(12, Math.max(2, blk.count + delta)) }
          : blk
      )
    );
  };

  const removeBlock = (id: string, parentId?: string) => {
    sound.click();
    resetToGrid(grid);
    if (parentId) {
      setProgram((prev) =>
        prev.map((blk) =>
          blk.id === parentId && blk.type === 'REPEAT'
            ? { ...blk, children: blk.children.filter((c) => c.id !== id) }
            : blk
        )
      );
    } else {
      if (activeRepeatId === id) setActiveRepeatId(null);
      setProgram((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const cycleIfElse = (
    id: string,
    field: 'condition' | 'thenAction' | 'elseAction',
    parentId?: string
  ) => {
    sound.click();
    resetToGrid(grid);
    const updateLeaf = (item: ActionBlockOrIf): ActionBlockOrIf => {
      if (item.id !== id || item.type !== 'IF_ELSE') return item;
      if (field === 'condition') {
        return {
          ...item,
          condition: CONDITIONS[(CONDITIONS.indexOf(item.condition) + 1) % CONDITIONS.length],
        };
      }
      if (field === 'thenAction') {
        return {
          ...item,
          thenAction: ALL_ACTIONS[(ALL_ACTIONS.indexOf(item.thenAction) + 1) % ALL_ACTIONS.length],
        };
      }
      const choices: (ActionType | 'NONE')[] = [...ALL_ACTIONS, 'NONE'];
      return {
        ...item,
        elseAction: choices[(choices.indexOf(item.elseAction) + 1) % choices.length],
      };
    };

    if (parentId) {
      setProgram((prev) =>
        prev.map((blk) =>
          blk.id === parentId && blk.type === 'REPEAT'
            ? { ...blk, children: blk.children.map(updateLeaf) }
            : blk
        )
      );
    } else {
      setProgram((prev) => prev.map((blk) => (blk.type === 'IF_ELSE' ? updateLeaf(blk) : blk)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-sky-700 mb-1">Free-Play Maker Mode</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Build Your Own Puzzle</h1>
          <p className="text-sm text-slate-600 mt-1">
            Pick a tile brush on the left, click squares on the grid to design a lab course, then program Nova!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={rotateStartDir}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Rotate Start ({grid.startDir})
          </button>
          <button
            type="button"
            onClick={clearBoard}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            Clear Map
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map Designer & Grid */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          {/* Tile Brushes */}
          <div className="mb-4">
            <span className="block text-xs font-semibold text-slate-600 mb-2">
              1. Pick a Tile Brush, then click grid squares:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'wall', label: 'Crate', icon: <Box className="w-3.5 h-3.5" /> },
                  { id: 'puddle', label: 'Puddle', icon: <Waves className="w-3.5 h-3.5" /> },
                  { id: 'sprout', label: 'Sprout', icon: <Sprout className="w-3.5 h-3.5" /> },
                  { id: 'battery', label: 'Cell', icon: <BatteryCharging className="w-3.5 h-3.5" /> },
                  { id: 'goal', label: 'Goal', icon: <Zap className="w-3.5 h-3.5" /> },
                  { id: 'START', label: 'Move Nova', icon: <ArrowUp className="w-3.5 h-3.5" /> },
                  { id: 'empty', label: 'Erase', icon: <Eraser className="w-3.5 h-3.5" /> },
                ] as { id: BrushTool; label: string; icon: React.ReactNode }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sound.click();
                    setBrush(item.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                    brush === item.id
                      ? 'bg-sky-600 border-sky-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive 6x5 Grid */}
          <div
            className="grid gap-2 p-3 bg-slate-100 border border-slate-200 rounded-xl mx-auto"
            style={{
              gridTemplateColumns: `repeat(${grid.width}, minmax(0, 1fr))`,
              maxWidth: '540px',
            }}
          >
            {runtime.tiles.map((row, y) =>
              row.map((tile, x) => {
                const isNovaHere = runtime.pos.x === x && runtime.pos.y === y;
                const isBloomed = grid.tiles[y][x] === 'sprout' && tile === 'empty';
                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    onClick={() => handleTileClick(x, y)}
                    aria-label={`Grid cell ${x + 1}, ${y + 1}: ${tile}`}
                    className={`relative aspect-square rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      tile === 'wall'
                        ? 'bg-slate-700 border-slate-800 text-amber-300'
                        : tile === 'puddle'
                        ? 'bg-sky-100 border-sky-300 text-sky-600'
                        : tile === 'goal'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                        : isBloomed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-white border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {tile === 'wall' && <Box className="w-6 h-6" />}
                    {tile === 'puddle' && <Waves className="w-6 h-6" />}
                    {tile === 'sprout' && <Sprout className="w-6 h-6 text-amber-600" />}
                    {isBloomed && !isNovaHere && <Sprout className="w-6 h-6 text-emerald-600" />}
                    {tile === 'battery' && <BatteryCharging className="w-6 h-6 text-amber-500" />}
                    {tile === 'goal' && !isNovaHere && <Zap className="w-6 h-6" />}

                    {isNovaHere && (
                      <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
                        <NovaSprite
                          dir={runtime.dir}
                          mood={
                            runtime.status === 'ERROR'
                              ? 'oops'
                              : runtime.status === 'WON'
                              ? 'won'
                              : 'happy'
                          }
                        />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div
            className={`mt-4 px-4 py-3 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              runtime.status === 'WON'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : runtime.status === 'ERROR'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {runtime.status === 'WON' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : runtime.status === 'ERROR' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-sky-600 shrink-0" />
            )}
            <span>{runtime.message}</span>
          </div>
        </div>

        {/* Right: Code Workbench */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                sound.click();
                if (isAutoPlaying) {
                  setIsAutoPlaying(false);
                } else {
                  if (runtime.status !== 'IDLE' && runtime.status !== 'RUNNING') {
                    setRuntime(createInitialRuntime(grid));
                  }
                  setIsAutoPlaying(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer ${
                isAutoPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isAutoPlaying ? 'Pause' : 'Run Code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setRuntime((prev) => {
                  const base =
                    prev.status === 'WON' || prev.status === 'ERROR' || prev.status === 'INCOMPLETE'
                      ? createInitialRuntime(grid)
                      : prev;
                  return executeNextStep(base, queue);
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              Step
            </button>
            <button
              type="button"
              onClick={() => {
                sound.click();
                resetToGrid(grid);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">
                {activeRepeatId ? 'Adding blocks inside Loop:' : '2. Add Code Blocks:'}
              </span>
              {activeRepeatId && (
                <button
                  type="button"
                  onClick={() => setActiveRepeatId(null)}
                  className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                >
                  Back to Main List
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TOOLS.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  disabled={activeRepeatId !== null && tool === 'REPEAT'}
                  onClick={() => addTool(tool)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-40 whitespace-nowrap"
                >
                  {tool === 'MOVE' && <ArrowUp className="w-4 h-4 text-sky-600" />}
                  {tool === 'TURN_LEFT' && <RotateCcw className="w-4 h-4 text-amber-600" />}
                  {tool === 'TURN_RIGHT' && <RotateCw className="w-4 h-4 text-amber-600" />}
                  {tool === 'JUMP' && <CornerUpRight className="w-4 h-4 text-sky-700" />}
                  {tool === 'WATER' && <Droplets className="w-4 h-4 text-emerald-600" />}
                  {tool === 'REPEAT' && <Repeat className="w-4 h-4 text-sky-700" />}
                  {tool === 'IF_ELSE' && <GitBranch className="w-4 h-4 text-emerald-600" />}
                  <span>
                    {tool === 'REPEAT'
                      ? 'Repeat Loop'
                      : tool === 'IF_ELSE'
                      ? 'If / Else'
                      : formatActionLabel(tool)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Program</span>
              {program.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    resetToGrid(grid);
                    setActiveRepeatId(null);
                    setProgram([]);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {program.map((block, idx) =>
              block.type === 'REPEAT' ? (
                <div key={block.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{idx + 1}</span>
                      <span className="text-xs font-bold text-slate-900">Repeat</span>
                      <button
                        type="button"
                        onClick={() => updateRepeatCount(block.id, -1)}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-sky-700">
                        {block.count}×
                      </span>
                      <button
                        type="button"
                        onClick={() => updateRepeatCount(block.id, 1)}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveRepeatId(activeRepeatId === block.id ? null : block.id)
                        }
                        className="px-2 py-1 text-xs font-semibold bg-white border border-slate-200 text-sky-700 rounded cursor-pointer"
                      >
                        {activeRepeatId === block.id ? 'Done' : '+ Add inside'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        aria-label="Delete block"
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="pl-3 border-l-2 border-slate-300 space-y-1">
                    {block.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {child.type === 'IF_ELSE' ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => cycleIfElse(child.id, 'condition', block.id)}
                              className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded font-semibold cursor-pointer"
                            >
                              {formatConditionLabel(child.condition)}
                            </button>
                            <button
                              type="button"
                              onClick={() => cycleIfElse(child.id, 'thenAction', block.id)}
                              className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded font-semibold cursor-pointer"
                            >
                              {formatActionLabel(child.thenAction)}
                            </button>
                            <button
                              type="button"
                              onClick={() => cycleIfElse(child.id, 'elseAction', block.id)}
                              className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold cursor-pointer"
                            >
                              {formatActionLabel(child.elseAction)}
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {formatActionLabel(child.type)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeBlock(child.id, block.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  key={block.id}
                  className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  {block.type === 'IF_ELSE' ? (
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="font-mono text-slate-500">IF</span>
                      <button
                        type="button"
                        onClick={() => cycleIfElse(block.id, 'condition')}
                        className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded font-semibold cursor-pointer"
                      >
                        {formatConditionLabel(block.condition)}
                      </button>
                      <span className="font-mono text-slate-500">THEN</span>
                      <button
                        type="button"
                        onClick={() => cycleIfElse(block.id, 'thenAction')}
                        className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded font-semibold cursor-pointer"
                      >
                        {formatActionLabel(block.thenAction)}
                      </button>
                      <span className="font-mono text-slate-500">ELSE</span>
                      <button
                        type="button"
                        onClick={() => cycleIfElse(block.id, 'elseAction')}
                        className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold cursor-pointer"
                      >
                        {formatActionLabel(block.elseAction)}
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {formatActionLabel(block.type)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    aria-label="Delete block"
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
