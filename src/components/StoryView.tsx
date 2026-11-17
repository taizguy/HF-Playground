import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Cpu, Play, Star } from 'lucide-react';
import { LEVELS } from '../data/curriculum';
import { ChapterDefinition, LevelProgress } from '../types/game';
import { sound } from '../utils/sound';
import { MiniLab } from './MiniLabs';

interface StoryViewProps {
  chapter: ChapterDefinition;
  levelProgress: Record<string, LevelProgress>;
  miniLabDone: boolean;
  onCompleteMiniLab: (chapterId: string) => void;
  onBackToMap: () => void;
  onStartLevel: (levelId: string) => void;
  onNextChapter?: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({
  chapter,
  levelProgress,
  miniLabDone,
  onCompleteMiniLab,
  onBackToMap,
  onStartLevel,
  onNextChapter,
}) => {
  const [imgError, setImgError] = useState(false);

  const chapterLevels = chapter.levelIds.map((id) => LEVELS[id]).filter(Boolean);
  const allSolved = chapterLevels.every((l) => levelProgress[l.id]?.completed);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => {
            sound.click();
            onBackToMap();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          Adventure Map
        </button>

        <div className="text-xs font-medium text-slate-500">
          Chapter {chapter.number} <span aria-hidden="true">·</span> {chapter.concept}
        </div>
      </div>

      {/* Story Split Section */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch mb-8">
        {/* Illustration Frame */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {!imgError ? (
            <img
              src={chapter.imagePath}
              alt={chapter.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-64 sm:h-72 lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-64 sm:h-72 lg:h-full bg-sky-50 flex flex-col items-center justify-center p-6 text-center">
              <Cpu className="w-12 h-12 text-sky-600 mb-2" />
              <p className="text-sm font-semibold text-slate-800">{chapter.title}</p>
            </div>
          )}
        </div>

        {/* Narrative & STEM Takeaway */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-sky-700 mb-1">
              Chapter {chapter.number} · {chapter.concept}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {chapter.title}
            </h1>
            <p className="text-sm text-slate-600 mb-5">{chapter.subtitle}</p>

            <div className="space-y-3">
              {chapter.storyLines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <p className="text-xs font-bold text-slate-900 mb-1">{line.speaker}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{line.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
            <p className="text-xs font-bold text-sky-800 mb-1">Tech Discovery</p>
            <p className="text-sm text-sky-950 leading-relaxed">{chapter.stemTakeaway}</p>
          </div>
        </div>
      </div>

      {/* Interactive Concept Mini-Lab */}
      <div className="mb-8">
        <MiniLab
          type={chapter.miniLabType}
          completed={miniLabDone}
          onComplete={() => onCompleteMiniLab(chapter.id)}
        />
      </div>

      {/* Chapter Coding Puzzles */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Coding Missions</h2>
            <p className="text-sm text-slate-600">
              Put what you learned into action by programming Nova!
            </p>
          </div>
          {allSolved && onNextChapter && (
            <button
              type="button"
              onClick={() => {
                sound.click();
                onNextChapter();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Next Chapter
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {chapterLevels.map((lvl) => {
            const prog = levelProgress[lvl.id];
            return (
              <div
                key={lvl.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500">
                    <span>
                      Level {lvl.number} <span aria-hidden="true">·</span> {lvl.conceptTag}
                    </span>
                    {prog?.completed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Solved
                      </span>
                    ) : (
                      <span>Not solved yet</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{lvl.title}</h3>
                  <p className="text-sm text-slate-600">{lvl.goalSummary}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          prog && s <= prog.stars
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      onStartLevel(lvl.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4" />
                    {prog?.completed ? 'Play Again' : 'Start Puzzle'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
