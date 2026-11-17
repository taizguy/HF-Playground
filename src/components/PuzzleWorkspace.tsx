import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BatteryCharging,
  Box,
  CheckCircle2,
  CornerUpRight,
  Droplets,
  GitBranch,
  HelpCircle,
  Pause,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  RotateCw,
  SkipForward,
  Sprout,
  Star,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from 'lucide-react';
import {
  countTotalBlocks,
  createInitialRuntime,
  executeNextStep,
  flattenProgram,
  formatActionLabel,
  formatConditionLabel,
  RuntimeState,
} from '../engine/interpreter';
import {
  ActionBlockOrIf,
  ActionType,
  BlockToolType,
  CodeBlock,
  ConditionType,
  LevelDefinition,
  LevelProgress,
} from '../types/game';
import { sound } from '../utils/sound';
import { NovaSprite } from './NovaSprite';

interface PuzzleWorkspaceProps {
  level: LevelDefinition;
  chapterTitle: string;
  progress?: LevelProgress;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToStory: () => void;
  onNextLevel?: () => void;
  onWinLevel: (levelId: string, stars: number, blockCount: number) => void;
}

const makeId = () => `blk-${Math.random().toString(36).slice(2, 9)}`;

const cloneBlocks = (blocks?: CodeBlock[]): CodeBlock[] =>
  blocks ? JSON.parse(JSON.stringify(blocks)) : [];

const CONDITIONS: ConditionType[] = ['PUDDLE_AHEAD', 'WALL_AHEAD', 'SPROUT_HERE'];

export const PuzzleWorkspace: React.FC<PuzzleWorkspaceProps> = ({
  level,
  chapterTitle,
  progress,
  soundEnabled,
  onToggleSound,
  onBackToStory,
  onNextLevel,
  onWinLevel,
}) => {
  const [program, setProgram] = useState<CodeBlock[]>(() => cloneBlocks(level.starterProgram));
  const [runtime, setRuntime] = useState<RuntimeState>(() => createInitialRuntime(level.grid));
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [fastSpeed, setFastSpeed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeRepeatId, setActiveRepeatId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const queue = useMemo(() => flattenProgram(program), [program]);
  const totalBlocks = useMemo(() => countTotalBlocks(program), [program]);

  const availableActions: ActionType[] = useMemo(
    () =>
      level.availableTools.filter(
        (t): t is ActionType => t !== 'REPEAT' && t !== 'IF_ELSE'
      ),
    [level.availableTools]
  );

  // Reset workspace when switching levels
  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setIsAutoPlaying(false);
    setProgram(cloneBlocks(level.starterProgram));
    setRuntime(createInitialRuntime(level.grid));
    setShowHint(false);
    setActiveRepeatId(null);
  }, [level]);

  // Auto-play loop
  useEffect(() => {
    if (!isAutoPlaying) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    const delay = fastSpeed ? 210 : 420;
    timerRef.current = window.setInterval(() => {
      setRuntime((prev) => {
        const next = executeNextStep(prev, queue);
        playEffectSound(next);
        if (next.status === 'WON' || next.status === 'ERROR' || next.status === 'INCOMPLETE') {
          setIsAutoPlaying(false);
          if (next.status === 'WON') {
            const stars = computeStars(totalBlocks, level.parBlocks);
            onWinLevel(level.id, stars, totalBlocks);
          }
        }
        return next;
      });
    }, delay);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isAutoPlaying, fastSpeed, queue, totalBlocks, level.id, level.parBlocks, onWinLevel]);

  const playEffectSound = (state: RuntimeState) => {
    if (state.status === 'WON') {
      sound.win();
      return;
    }
    if (state.status === 'ERROR') {
      sound.error();
      return;
    }
    if (state.lastActionEffect === 'COLLECT') sound.collect();
    else if (state.lastActionEffect === 'WATER') sound.water();
    else if (state.lastActionEffect === 'JUMP') sound.jump();
    else if (state.lastActionEffect === 'TURN') sound.turn();
    else if (state.lastActionEffect === 'MOVE') sound.step();
  };

  const resetRun = () => {
    setIsAutoPlaying(false);
    setRuntime(createInitialRuntime(level.grid));
  };

  const handleRunToggle = () => {
    if (isAutoPlaying) {
      sound.click();
      setIsAutoPlaying(false);
      return;
    }
    if (program.length === 0) {
      sound.error();
      setRuntime((prev) => ({
        ...prev,
        message: 'Add at least one code block on the right first!',
      }));
      return;
    }
    sound.click();
    // Restart from beginning if finished/errored
    if (runtime.status === 'WON' || runtime.status === 'ERROR' || runtime.status === 'INCOMPLETE') {
      setRuntime(createInitialRuntime(level.grid));
    }
    setIsAutoPlaying(true);
  };

  const handleStep = () => {
    setIsAutoPlaying(false);
    if (program.length === 0) {
      sound.error();
      return;
    }
    setRuntime((prev) => {
      const base =
        prev.status === 'WON' || prev.status === 'ERROR' || prev.status === 'INCOMPLETE'
          ? createInitialRuntime(level.grid)
          : prev;
      const next = executeNextStep(base, queue);
      playEffectSound(next);
      if (next.status === 'WON') {
        const stars = computeStars(totalBlocks, level.parBlocks);
        onWinLevel(level.id, stars, totalBlocks);
      }
      return next;
    });
  };

  const addToolBlock = (tool: BlockToolType) => {
    if (totalBlocks >= level.maxBlocks) {
      sound.error();
      setRuntime((prev) => ({
        ...prev,
        message: `Block limit reached (${level.maxBlocks} max). Try removing unused blocks or using a Repeat loop!`,
      }));
      return;
    }
    sound.click();
    resetRun();

    if (tool === 'REPEAT') {
      const newRepeat: CodeBlock = {
        id: makeId(),
        type: 'REPEAT',
        count: 3,
        children: [],
      };
      setProgram((prev) => [...prev, newRepeat]);
      setActiveRepeatId(newRepeat.id);
      return;
    }

    const newInner: ActionBlockOrIf =
      tool === 'IF_ELSE'
        ? {
            id: makeId(),
            type: 'IF_ELSE',
            condition: level.grid.tiles.some((r) => r.includes('puddle'))
              ? 'PUDDLE_AHEAD'
              : 'WALL_AHEAD',
            thenAction: availableActions.includes('JUMP') ? 'JUMP' : 'TURN_RIGHT',
            elseAction: 'MOVE',
          }
        : {
            id: makeId(),
            type: tool,
          };

    if (activeRepeatId) {
      let inserted = false;
      setProgram((prev) =>
        prev.map((blk) => {
          if (blk.id === activeRepeatId && blk.type === 'REPEAT') {
            inserted = true;
            return { ...blk, children: [...blk.children, newInner] };
          }
          return blk;
        })
      );
      if (inserted) return;
    }

    setProgram((prev) => [...prev, newInner]);
  };

  const removeBlock = (id: string, parentId?: string) => {
    sound.click();
    resetRun();
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
      setProgram((prev) => prev.filter((blk) => blk.id !== id));
    }
  };

  const moveBlock = (index: number, delta: -1 | 1, parentId?: string) => {
    sound.click();
    resetRun();
    if (parentId) {
      setProgram((prev) =>
        prev.map((blk) => {
          if (blk.id !== parentId || blk.type !== 'REPEAT') return blk;
          const nextIdx = index + delta;
          if (nextIdx < 0 || nextIdx >= blk.children.length) return blk;
          const copy = [...blk.children];
          [copy[index], copy[nextIdx]] = [copy[nextIdx], copy[index]];
          return { ...blk, children: copy };
        })
      );
    } else {
      const nextIdx = index + delta;
      if (nextIdx < 0 || nextIdx >= program.length) return;
      const copy = [...program];
      [copy[index], copy[nextIdx]] = [copy[nextIdx], copy[index]];
      setProgram(copy);
    }
  };

  const updateRepeatCount = (repeatId: string, delta: -1 | 1) => {
    sound.click();
    resetRun();
    setProgram((prev) =>
      prev.map((blk) => {
        if (blk.id !== repeatId || blk.type !== 'REPEAT') return blk;
        const nextCount = Math.min(12, Math.max(2, blk.count + delta));
        return { ...blk, count: nextCount };
      })
    );
  };

  const cycleIfElseField = (
    blockId: string,
    field: 'condition' | 'thenAction' | 'elseAction',
    parentId?: string
  ) => {
    sound.click();
    resetRun();
    const updateItem = (item: ActionBlockOrIf): ActionBlockOrIf => {
      if (item.id !== blockId || item.type !== 'IF_ELSE') return item;
      if (field === 'condition') {
        const nextIdx = (CONDITIONS.indexOf(item.condition) + 1) % CONDITIONS.length;
        return { ...item, condition: CONDITIONS[nextIdx] };
      }
      if (field === 'thenAction') {
        const nextIdx = (availableActions.indexOf(item.thenAction) + 1) % availableActions.length;
        return { ...item, thenAction: availableActions[nextIdx] };
      }
      const elseChoices: (ActionType | 'NONE')[] = [...availableActions, 'NONE'];
      const nextIdx = (elseChoices.indexOf(item.elseAction) + 1) % elseChoices.length;
      return { ...item, elseAction: elseChoices[nextIdx] };
    };

    if (parentId) {
      setProgram((prev) =>
        prev.map((blk) =>
          blk.id === parentId && blk.type === 'REPEAT'
            ? { ...blk, children: blk.children.map(updateItem) }
            : blk
        )
      );
    } else {
      setProgram((prev) => prev.map((blk) => (blk.type === 'IF_ELSE' ? updateItem(blk) : blk)));
    }
  };

  const earnedStars = runtime.status === 'WON' ? computeStars(totalBlocks, level.parBlocks) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              sound.click();
              onBackToStory();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Story
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>{chapterTitle}</span>
              <span aria-hidden="true">·</span>
              <span>Level {level.number}</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-700 font-semibold">{level.conceptTag}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{level.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {progress?.completed && (
            <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= progress.stars ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <HelpCircle className="w-4 h-4 text-sky-600" />
            Hint
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="p-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Goal & Hint Banner */}
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-base text-slate-700 font-medium">{level.goalSummary}</p>
        {showHint && (
          <div className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900">
            <strong className="font-semibold">Inventor Hint:</strong> {level.hint}
          </div>
        )}
      </div>

      {/* Main Two-Zone Split Stage */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Interactive Lab Grid */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          {/* Live Objective Counters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 text-xs font-semibold text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              {runtime.totalSprouts > 0 && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  Sprouts Watered: {runtime.wateredCount}/{runtime.totalSprouts}
                </span>
              )}
              {runtime.totalBatteries > 0 && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <BatteryCharging className="w-4 h-4 text-amber-600" />
                  Energy Cells: {runtime.collectedCount}/{runtime.totalBatteries}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                Step {runtime.stepIndex}/{queue.length}
              </span>
            </div>

            <div className="font-mono tabular-nums text-slate-500">
              Blocks: <span className="text-slate-900">{totalBlocks}</span> / {level.maxBlocks} (Par {level.parBlocks})
            </div>
          </div>

          {/* Grid Canvas */}
          <div
            className="grid gap-2 p-3 bg-slate-100 border border-slate-200 rounded-xl mx-auto"
            style={{
              gridTemplateColumns: `repeat(${level.grid.width}, minmax(0, 1fr))`,
              maxWidth: `${level.grid.width * 92}px`,
            }}
          >
            {runtime.tiles.map((row, y) =>
              row.map((tile, x) => {
                const isNovaHere = runtime.pos.x === x && runtime.pos.y === y;
                const initialTile = level.grid.tiles[y][x];
                const isBloomedSprout = initialTile === 'sprout' && tile === 'empty';
                const isSensorTarget =
                  runtime.lastSensorCheck?.target?.x === x &&
                  runtime.lastSensorCheck?.target?.y === y;

                return (
                  <div
                    key={`${x}-${y}`}
                    aria-label={`Row ${y + 1} Column ${x + 1}: ${tile}`}
                    className={`relative aspect-square rounded-lg border flex items-center justify-center transition-colors ${
                      tile === 'wall'
                        ? 'bg-slate-700 border-slate-800 text-slate-200'
                        : tile === 'puddle'
                        ? 'bg-sky-100 border-sky-300 text-sky-700'
                        : tile === 'goal'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : isBloomedSprout
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-400'
                    } ${
                      isSensorTarget
                        ? runtime.lastSensorCheck?.result
                          ? 'ring-2 ring-emerald-500'
                          : 'ring-2 ring-amber-500'
                        : ''
                    }`}
                  >
                    {/* Tile Content */}
                    {tile === 'wall' && <Box className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />}
                    {tile === 'puddle' && (
                      <div className="flex flex-col items-center">
                        <Waves className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600" />
                      </div>
                    )}
                    {tile === 'sprout' && (
                      <div className="flex flex-col items-center">
                        <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                        <span className="text-[10px] font-semibold text-amber-700">Dry</span>
                      </div>
                    )}
                    {isBloomedSprout && !isNovaHere && (
                      <div className="flex flex-col items-center">
                        <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                        <span className="text-[10px] font-semibold text-emerald-700">Bloomed</span>
                      </div>
                    )}
                    {tile === 'battery' && (
                      <div className="flex flex-col items-center">
                        <BatteryCharging className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
                        <span className="text-[10px] font-semibold text-amber-700">Cell</span>
                      </div>
                    )}
                    {tile === 'goal' && !isNovaHere && (
                      <div className="flex flex-col items-center">
                        <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700">Goal</span>
                      </div>
                    )}

                    {/* Nova Overlay */}
                    {isNovaHere && (
                      <div className="absolute inset-0 flex items-center justify-center p-1">
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
                  </div>
                );
              })
            )}
          </div>

          {/* Live Feedback Bar */}
          <div
            className={`mt-4 px-4 py-3 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              runtime.status === 'WON'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : runtime.status === 'ERROR'
                ? 'bg-red-50 border-red-300 text-red-900'
                : runtime.status === 'INCOMPLETE'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {runtime.status === 'WON' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : runtime.status === 'ERROR' || runtime.status === 'INCOMPLETE' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-sky-600 shrink-0" />
            )}
            <span>{runtime.message}</span>
          </div>

          {/* Victory Summary Strip */}
          {runtime.status === 'WON' && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= earnedStars ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold text-emerald-900">
                    {earnedStars === 3
                      ? 'Super Efficient Code!'
                      : earnedStars === 2
                      ? 'Great Job!'
                      : 'Mission Solved!'}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 tabular-nums">
                  Solved using {totalBlocks} blocks (Target for 3 stars: {level.parBlocks} blocks).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetRun}
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Replay
                </button>
                {onNextLevel ? (
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      onNextLevel();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Next Level
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onBackToStory}
                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Finish Chapter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Zone: Code Workbench */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          {/* Execution Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunToggle}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isAutoPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAutoPlaying ? 'Pause' : 'Run Code'}
              </button>
              <button
                type="button"
                onClick={handleStep}
                disabled={isAutoPlaying}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <SkipForward className="w-4 h-4" />
                Step
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  resetRun();
                }}
                aria-label="Reset Nova to start"
                className="inline-flex items-center gap-1 px-3 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFastSpeed((f) => !f)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border cursor-pointer whitespace-nowrap ${
                fastSpeed
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Speed: {fastSpeed ? '2x' : '1x'}
            </button>
          </div>

          {/* Code Block Palette */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">
                {activeRepeatId
                  ? 'Click a block to add inside your Repeat Loop:'
                  : 'Click a block to add to your program:'}
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
              {level.availableTools.map((tool) => {
                const disabledInLoop = activeRepeatId !== null && tool === 'REPEAT';
                return (
                  <button
                    key={tool}
                    type="button"
                    disabled={disabledInLoop}
                    onClick={() => addToolBlock(tool)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 border border-slate-200 rounded-lg transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <ToolIcon tool={tool} />
                    <span className="truncate">{formatToolName(tool)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Program Sequence List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Your Program</span>
              <div className="flex items-center gap-2">
                {level.isDebugLevel && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      resetRun();
                      setProgram(cloneBlocks(level.starterProgram));
                    }}
                    className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                  >
                    Restore Buggy Code
                  </button>
                )}
                {program.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      resetRun();
                      setActiveRepeatId(null);
                      setProgram([]);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {program.length === 0 ? (
              <div className="py-8 px-4 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">
                Your program is empty. Tap blocks above to build Nova’s instructions!
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {program.map((block, index) => {
                  const isActive =
                    runtime.activeBlockId === block.id || runtime.activeParentId === block.id;

                  if (block.type === 'REPEAT') {
                    const isEditingInside = activeRepeatId === block.id;
                    return (
                      <div
                        key={block.id}
                        className={`p-3 rounded-xl border transition-colors ${
                          isActive
                            ? 'bg-sky-50 border-sky-500'
                            : isEditingInside
                            ? 'bg-amber-50/40 border-amber-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400 tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <Repeat className="w-4 h-4 text-sky-700" />
                            <span className="text-sm font-bold text-slate-900">Repeat</span>
                            <div className="inline-flex items-center bg-white border border-slate-300 rounded-md">
                              <button
                                type="button"
                                onClick={() => updateRepeatCount(block.id, -1)}
                                aria-label="Decrease repeat count"
                                className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono text-xs font-bold text-sky-700 tabular-nums">
                                {block.count}×
                              </span>
                              <button
                                type="button"
                                onClick={() => updateRepeatCount(block.id, 1)}
                                aria-label="Increase repeat count"
                                className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveRepeatId(isEditingInside ? null : block.id)
                              }
                              className={`px-2 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                                isEditingInside
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white border border-slate-200 text-sky-700 hover:bg-sky-50'
                              }`}
                            >
                              {isEditingInside ? 'Done' : '+ Add inside'}
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, -1)}
                              disabled={index === 0}
                              aria-label="Move block up"
                              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, 1)}
                              disabled={index === program.length - 1}
                              aria-label="Move block down"
                              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              aria-label="Delete repeat block"
                              className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {runtime.activeParentId === block.id && runtime.activeIterationLabel && (
                          <div className="mb-2 text-xs font-mono font-semibold text-sky-700">
                            {runtime.activeIterationLabel}
                          </div>
                        )}

                        <div className="pl-4 border-l-2 border-slate-300 space-y-1.5">
                          {block.children.length === 0 ? (
                            <p className="text-xs text-slate-500 py-1">
                              Empty loop — click “+ Add inside” then pick blocks above.
                            </p>
                          ) : (
                            block.children.map((child, childIdx) => (
                              <LeafBlockRow
                                key={child.id}
                                block={child}
                                indexLabel={`${index + 1}.${childIdx + 1}`}
                                isActive={runtime.activeBlockId === child.id}
                                isFirst={childIdx === 0}
                                isLast={childIdx === block.children.length - 1}
                                onMove={(d) => moveBlock(childIdx, d, block.id)}
                                onDelete={() => removeBlock(child.id, block.id)}
                                onCycleIfElse={(field) =>
                                  cycleIfElseField(child.id, field, block.id)
                                }
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <LeafBlockRow
                      key={block.id}
                      block={block}
                      indexLabel={String(index + 1).padStart(2, '0')}
                      isActive={isActive}
                      isFirst={index === 0}
                      isLast={index === program.length - 1}
                      onMove={(d) => moveBlock(index, d)}
                      onDelete={() => removeBlock(block.id)}
                      onCycleIfElse={(field) => cycleIfElseField(block.id, field)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface LeafBlockRowProps {
  block: ActionBlockOrIf;
  indexLabel: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
  onCycleIfElse: (field: 'condition' | 'thenAction' | 'elseAction') => void;
}

const LeafBlockRow: React.FC<LeafBlockRowProps> = ({
  block,
  indexLabel,
  isActive,
  isFirst,
  isLast,
  onMove,
  onDelete,
  onCycleIfElse,
}) => {
  if (block.type === 'IF_ELSE') {
    return (
      <div
        className={`p-2.5 rounded-lg border transition-colors ${
          isActive ? 'bg-sky-50 border-sky-500' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400 tabular-nums">{indexLabel}</span>
            <GitBranch className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">IF / ELSE Rule</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={isFirst}
              aria-label="Move up"
              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={isLast}
              aria-label="Move down"
              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete block"
              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-mono font-semibold text-slate-500">IF</span>
          <button
            type="button"
            onClick={() => onCycleIfElse('condition')}
            className="px-2 py-1 font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 rounded hover:bg-emerald-100 cursor-pointer"
          >
            {formatConditionLabel(block.condition)}
          </button>
          <span className="font-mono font-semibold text-slate-500">THEN</span>
          <button
            type="button"
            onClick={() => onCycleIfElse('thenAction')}
            className="px-2 py-1 font-semibold bg-sky-50 border border-sky-200 text-sky-800 rounded hover:bg-sky-100 cursor-pointer"
          >
            {formatActionLabel(block.thenAction)}
          </button>
          <span className="font-mono font-semibold text-slate-500">ELSE</span>
          <button
            type="button"
            onClick={() => onCycleIfElse('elseAction')}
            className="px-2 py-1 font-semibold bg-slate-100 border border-slate-200 text-slate-800 rounded hover:bg-slate-200 cursor-pointer"
          >
            {formatActionLabel(block.elseAction)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${
        isActive ? 'bg-sky-50 border-sky-500' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="font-mono text-xs text-slate-400 tabular-nums">{indexLabel}</span>
        <ToolIcon tool={block.type} />
        <span className="text-sm font-semibold text-slate-800 truncate">
          {formatActionLabel(block.type)}
        </span>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          aria-label="Move block up"
          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast}
          aria-label="Move block down"
          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete block"
          className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

function computeStars(used: number, par: number): number {
  if (used <= par) return 3;
  if (used <= par + 2) return 2;
  return 1;
}

function formatToolName(tool: BlockToolType): string {
  switch (tool) {
    case 'REPEAT':
      return 'Repeat Loop';
    case 'IF_ELSE':
      return 'If / Else';
    default:
      return formatActionLabel(tool);
  }
}

function ToolIcon({ tool }: { tool: BlockToolType }) {
  switch (tool) {
    case 'MOVE':
      return <ArrowUp className="w-4 h-4 text-sky-600 shrink-0" />;
    case 'TURN_LEFT':
      return <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'TURN_RIGHT':
      return <RotateCw className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'JUMP':
      return <CornerUpRight className="w-4 h-4 text-sky-700 shrink-0" />;
    case 'WATER':
      return <Droplets className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'REPEAT':
      return <Repeat className="w-4 h-4 text-sky-700 shrink-0" />;
    case 'IF_ELSE':
      return <GitBranch className="w-4 h-4 text-emerald-600 shrink-0" />;
    default:
      return <Plus className="w-4 h-4 text-slate-600 shrink-0" />;
  }
}
