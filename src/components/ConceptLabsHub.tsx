import React from 'react';
import { CHAPTERS } from '../data/curriculum';
import { MiniLab } from './MiniLabs';

interface ConceptLabsHubProps {
  miniLabsCompleted: Record<string, boolean>;
  onCompleteMiniLab: (chapterId: string) => void;
  onOpenChapter: (chapterId: string) => void;
}

export const ConceptLabsHub: React.FC<ConceptLabsHubProps> = ({
  miniLabsCompleted,
  onCompleteMiniLab,
  onOpenChapter,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8 pb-5 border-b border-slate-200">
        <p className="text-xs font-semibold text-sky-700 mb-1">Hands-On STEM Simulators</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Concept Lab</h1>
        <p className="text-base text-slate-600 mt-1 max-w-2xl">
          Experiment with how computers follow steps, compress loops, read sensors, and count in binary 1s and 0s.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {CHAPTERS.map((chapter) => (
          <div key={chapter.id} className="flex flex-col gap-2">
            <MiniLab
              type={chapter.miniLabType}
              completed={Boolean(miniLabsCompleted[chapter.id])}
              onComplete={() => onCompleteMiniLab(chapter.id)}
            />
            <div className="flex justify-end px-1">
              <button
                type="button"
                onClick={() => onOpenChapter(chapter.id)}
                className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
              >
                Go to Chapter {chapter.number}: {chapter.title} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
