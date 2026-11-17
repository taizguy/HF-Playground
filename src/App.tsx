import { useCallback, useEffect, useState } from 'react';
import { AdventureMap } from './components/AdventureMap';
import { ConceptLabsHub } from './components/ConceptLabsHub';
import { FieldGuideView } from './components/FieldGuideView';
import { PuzzleWorkspace } from './components/PuzzleWorkspace';
import { SandboxBuilder } from './components/SandboxBuilder';
import { StoryView } from './components/StoryView';
import { CHAPTERS, LEVELS } from './data/curriculum';
import { SavedProgress } from './types/game';
import { sound } from './utils/sound';

const STORAGE_KEY = 'sparkquest-lab-progress-v1';

const DEFAULT_PROGRESS: SavedProgress = {
  levels: {},
  miniLabsCompleted: {},
  soundEnabled: true,
};

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      levels: parsed.levels ?? {},
      miniLabsCompleted: parsed.miniLabsCompleted ?? {},
      soundEnabled: parsed.soundEnabled ?? true,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

type AppView =
  | { type: 'MAP' }
  | { type: 'LABS' }
  | { type: 'SANDBOX' }
  | { type: 'GUIDE' }
  | { type: 'STORY'; chapterId: string }
  | { type: 'PUZZLE'; levelId: string };

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [view, setView] = useState<AppView>({ type: 'MAP' });

  useEffect(() => {
    sound.enabled = progress.soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  const handleToggleSound = useCallback(() => {
    setProgress((prev) => {
      const nextSound = !prev.soundEnabled;
      sound.enabled = nextSound;
      if (nextSound) sound.click();
      return { ...prev, soundEnabled: nextSound };
    });
  }, []);

  const handleWinLevel = useCallback(
    (levelId: string, stars: number, blockCount: number) => {
      setProgress((prev) => {
        const existing = prev.levels[levelId];
        const bestStars = Math.max(existing?.stars ?? 0, stars);
        const bestBlocks = existing?.bestBlocks
          ? Math.min(existing.bestBlocks, blockCount)
          : blockCount;
        return {
          ...prev,
          levels: {
            ...prev.levels,
            [levelId]: {
              completed: true,
              stars: bestStars,
              bestBlocks,
            },
          },
        };
      });
    },
    []
  );

  const handleCompleteMiniLab = useCallback((chapterId: string) => {
    setProgress((prev) => ({
      ...prev,
      miniLabsCompleted: {
        ...prev.miniLabsCompleted,
        [chapterId]: true,
      },
    }));
  }, []);

  const nextUnsolvedLevel =
    Object.values(LEVELS).find((lvl) => !progress.levels[lvl.id]?.completed) ?? LEVELS.lvl1;

  const navigate = (nextView: AppView) => {
    sound.click();
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate({ type: 'MAP' })}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            SparkQuest Lab
          </button>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => navigate({ type: 'MAP' })}
              className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view.type === 'MAP' ? 'text-slate-900 font-semibold underline' : ''
              }`}
            >
              Adventure Map
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'LABS' })}
              className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view.type === 'LABS' ? 'text-slate-900 font-semibold underline' : ''
              }`}
            >
              Concept Labs
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'SANDBOX' })}
              className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view.type === 'SANDBOX' ? 'text-slate-900 font-semibold underline' : ''
              }`}
            >
              Sandbox
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'GUIDE' })}
              className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view.type === 'GUIDE' ? 'text-slate-900 font-semibold underline' : ''
              }`}
            >
              Field Guide
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => navigate({ type: 'PUZZLE', levelId: nextUnsolvedLevel.id })}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Play Mission {nextUnsolvedLevel.number}
            </button>
          </div>
        </div>

        {/* Mobile secondary compact nav */}
        <nav className="flex md:hidden items-center justify-around px-3 py-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => navigate({ type: 'MAP' })}
            className={`px-2 py-1 whitespace-nowrap ${
              view.type === 'MAP' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => navigate({ type: 'LABS' })}
            className={`px-2 py-1 whitespace-nowrap ${
              view.type === 'LABS' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Labs
          </button>
          <button
            type="button"
            onClick={() => navigate({ type: 'SANDBOX' })}
            className={`px-2 py-1 whitespace-nowrap ${
              view.type === 'SANDBOX' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Sandbox
          </button>
          <button
            type="button"
            onClick={() => navigate({ type: 'GUIDE' })}
            className={`px-2 py-1 whitespace-nowrap ${
              view.type === 'GUIDE' ? 'text-sky-700 font-semibold' : ''
            }`}
          >
            Guide
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {view.type === 'MAP' && (
          <AdventureMap
            progress={progress}
            onOpenChapter={(chapterId) => navigate({ type: 'STORY', chapterId })}
            onStartLevel={(levelId) => navigate({ type: 'PUZZLE', levelId })}
            onOpenSandbox={() => navigate({ type: 'SANDBOX' })}
          />
        )}

        {view.type === 'LABS' && (
          <ConceptLabsHub
            miniLabsCompleted={progress.miniLabsCompleted}
            onCompleteMiniLab={handleCompleteMiniLab}
            onOpenChapter={(chapterId) => navigate({ type: 'STORY', chapterId })}
          />
        )}

        {view.type === 'SANDBOX' && <SandboxBuilder />}

        {view.type === 'GUIDE' && (
          <FieldGuideView
            onOpenChapter={(chapterId) => navigate({ type: 'STORY', chapterId })}
          />
        )}

        {view.type === 'STORY' && (() => {
          const chapterIdx = CHAPTERS.findIndex((c) => c.id === view.chapterId);
          const chapter = CHAPTERS[chapterIdx] ?? CHAPTERS[0];
          const nextChapter = CHAPTERS[chapterIdx + 1];
          return (
            <StoryView
              chapter={chapter}
              levelProgress={progress.levels}
              miniLabDone={Boolean(progress.miniLabsCompleted[chapter.id])}
              onCompleteMiniLab={handleCompleteMiniLab}
              onBackToMap={() => navigate({ type: 'MAP' })}
              onStartLevel={(levelId) => navigate({ type: 'PUZZLE', levelId })}
              onNextChapter={
                nextChapter
                  ? () => navigate({ type: 'STORY', chapterId: nextChapter.id })
                  : undefined
              }
            />
          );
        })()}

        {view.type === 'PUZZLE' && (() => {
          const level = LEVELS[view.levelId] ?? LEVELS.lvl1;
          const chapter = CHAPTERS.find((c) => c.id === level.chapterId) ?? CHAPTERS[0];
          const allLevelIds = Object.keys(LEVELS);
          const nextId = allLevelIds[allLevelIds.indexOf(level.id) + 1];

          return (
            <PuzzleWorkspace
              level={level}
              chapterTitle={`Chapter ${chapter.number}: ${chapter.title}`}
              progress={progress.levels[level.id]}
              soundEnabled={progress.soundEnabled}
              onToggleSound={handleToggleSound}
              onBackToStory={() => navigate({ type: 'STORY', chapterId: chapter.id })}
              onNextLevel={
                nextId ? () => navigate({ type: 'PUZZLE', levelId: nextId }) : undefined
              }
              onWinLevel={handleWinLevel}
            />
          );
        })()}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>SparkQuest Lab · STEM Stories &amp; Coding Logic for Ages 8–10</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleSound}
              className="hover:text-slate-900 cursor-pointer"
            >
              Sound: {progress.soundEnabled ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (Object.keys(progress.levels).length === 0) return;
                setProgress({ ...DEFAULT_PROGRESS, soundEnabled: progress.soundEnabled });
              }}
              className="hover:text-slate-900 cursor-pointer"
            >
              Reset Progress
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
