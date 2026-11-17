import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Cpu, Play, Star } from 'lucide-react';
import { CHAPTERS, LEVELS } from '../data/curriculum';
import { SavedProgress } from '../types/game';
import { sound } from '../utils/sound';

interface AdventureMapProps {
  progress: SavedProgress;
  onOpenChapter: (chapterId: string) => void;
  onStartLevel: (levelId: string) => void;
  onOpenSandbox: () => void;
}

export const AdventureMap: React.FC<AdventureMapProps> = ({
  progress,
  onOpenChapter,
  onStartLevel,
  onOpenSandbox,
}) => {
  const [heroError, setHeroError] = useState(false);
  const [chapterImgErrors, setChapterImgErrors] = useState<Record<string, boolean>>({});

  const totalLevels = Object.keys(LEVELS).length;
  const solvedLevels = Object.values(progress.levels).filter((l) => l.completed).length;
  const totalStars = Object.values(progress.levels).reduce((acc, l) => acc + (l.stars || 0), 0);
  const labsDone = Object.values(progress.miniLabsCompleted).filter(Boolean).length;

  // Find next unsolved level for primary CTA
  const nextUnsolvedLevel =
    Object.values(LEVELS).find((lvl) => !progress.levels[lvl.id]?.completed) ?? LEVELS.lvl1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Hero Split Banner */}
      <section className="grid lg:grid-cols-12 gap-6 items-stretch bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center">
          <p className="text-xs font-semibold text-sky-700 mb-2">
            STEM Storytelling &amp; Logic Puzzles · Ages 8–10
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Learn Tech &amp; Coding by Guiding Nova
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mb-6">
            Join Nova the solar rover and Inventor Mia across four interactive lab adventures.
            Build step-by-step algorithms, unlock repeat loops, test real sensors, and squash code bugs!
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sound.click();
                onStartLevel(nextUnsolvedLevel.id);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              {solvedLevels > 0 ? `Continue: Level ${nextUnsolvedLevel.number}` : 'Start First Mission'}
            </button>

            <button
              type="button"
              onClick={() => {
                sound.click();
                onOpenSandbox();
              }}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              Build Your Own Puzzle
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 min-h-[240px]">
          {!heroError ? (
            <img
              src="/src/assets/images/hero_workshop_banner_1794914861416.jpg"
              alt="Nova the blue wheeled robot inside a sunny robotics and plant STEM workshop"
              referrerPolicy="no-referrer"
              onError={() => setHeroError(true)}
              className="w-full h-64 sm:h-72 lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[240px] bg-sky-50 flex flex-col items-center justify-center p-8 text-center">
              <Cpu className="w-12 h-12 text-sky-600 mb-2" />
              <p className="text-sm font-semibold text-slate-800">SparkQuest Robotics Workshop</p>
            </div>
          )}
        </div>
      </section>

      {/* 4-Column Progress Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Story Chapters</p>
          <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {CHAPTERS.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Missions Solved</p>
          <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {solvedLevels}/{totalLevels}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Stars Earned</p>
          <p className="font-mono text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {totalStars}/{totalLevels * 3}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Concept Labs</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {labsDone}/{CHAPTERS.length}
          </p>
        </div>
      </section>

      {/* 4 Story Chapters */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Story Adventures</h2>
            <p className="text-sm text-slate-600">
              Read each story beat, test the hands-on STEM lab, and solve 10 coding missions per chapter.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {CHAPTERS.map((chapter) => {
            const chapterLevels = chapter.levelIds.map((id) => LEVELS[id]).filter(Boolean);
            const solvedCount = chapterLevels.filter(
              (l) => progress.levels[l.id]?.completed
            ).length;
            const nextChapterLevel =
              chapterLevels.find((l) => !progress.levels[l.id]?.completed) ?? chapterLevels[0];
            const labDone = Boolean(progress.miniLabsCompleted[chapter.id]);

            return (
              <article
                key={chapter.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    {!chapterImgErrors[chapter.id] ? (
                      <img
                        src={chapter.imagePath}
                        alt={chapter.imageAlt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setChapterImgErrors((prev) => ({ ...prev, [chapter.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-700">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-sky-700">Chapter {chapter.number}</span>
                      <span aria-hidden="true">·</span>
                      <span>{chapter.concept}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {solvedCount}/{chapterLevels.length} Solved
                      </span>
                      {labDone && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lab Done
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-1.5">{chapter.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">{chapter.subtitle}</p>

                    {/* 10-Level Compact Selector Grid */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {chapterLevels.map((lvl) => {
                        const lvlProg = progress.levels[lvl.id];
                        const isSolved = Boolean(lvlProg?.completed);
                        return (
                          <button
                            key={lvl.id}
                            type="button"
                            title={`Level ${lvl.number}: ${lvl.title}`}
                            aria-label={`Level ${lvl.number}: ${lvl.title}${isSolved ? ' (Solved)' : ''}`}
                            onClick={() => {
                              sound.click();
                              onStartLevel(lvl.id);
                            }}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-colors cursor-pointer ${
                              isSolved
                                ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-900'
                                : 'bg-slate-50 border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-800'
                            }`}
                          >
                            <span className="font-mono text-sm font-bold tabular-nums leading-tight">
                              {lvl.number}
                            </span>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-2.5 h-2.5 ${
                                    lvlProg && s <= lvlProg.stars
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      onStartLevel(nextChapterLevel.id);
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-sky-700 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Play Level {nextChapterLevel.number}: {nextChapterLevel.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      onOpenChapter(chapter.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Open Story &amp; Lab
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
