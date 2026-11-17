import React from 'react';
import { BookOpen, Cpu } from 'lucide-react';
import { FIELD_GUIDE_CONCEPTS } from '../data/curriculum';

interface FieldGuideViewProps {
  onOpenChapter: (chapterId: string) => void;
}

const CONCEPT_TO_CHAPTER: Record<string, string> = {
  algorithm: 'ch1',
  loop: 'ch2',
  conditional: 'ch3',
  debugging: 'ch4',
  binary: 'ch4',
};

export const FieldGuideView: React.FC<FieldGuideViewProps> = ({ onOpenChapter }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8 pb-5 border-b border-slate-200">
        <p className="text-xs font-semibold text-sky-700 mb-1">STEM &amp; Coding Dictionary</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Inventor’s Field Guide</h1>
        <p className="text-base text-slate-600 mt-1 max-w-2xl">
          Every big computer program and smart robot is built out of these five simple ideas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {FIELD_GUIDE_CONCEPTS.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 mb-2">
                <span>Concept 0{idx + 1}</span>
                <BookOpen className="w-4 h-4 text-sky-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h2>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{item.summary}</p>

              <div className="space-y-2.5 text-sm">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-900 block mb-0.5">Everyday Example</span>
                  <span className="text-slate-600">{item.example}</span>
                </div>
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-lg">
                  <span className="font-semibold text-sky-900 flex items-center gap-1.5 mb-0.5">
                    <Cpu className="w-3.5 h-3.5" /> Real-World Tech
                  </span>
                  <span className="text-sky-950">{item.realTech}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenChapter(CONCEPT_TO_CHAPTER[item.id] ?? 'ch1')}
                className="text-sm font-semibold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
              >
                Practice this in Chapter {CONCEPT_TO_CHAPTER[item.id]?.replace('ch', '')} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
