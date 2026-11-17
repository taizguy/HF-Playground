import React, { useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Droplets, RotateCcw, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/sound';

interface MiniLabProps {
  type: 'SEQUENCER' | 'LOOP_COMPRESSOR' | 'SENSOR_TESTER' | 'BINARY_SWITCH';
  onComplete?: () => void;
  completed?: boolean;
}

export const MiniLab: React.FC<MiniLabProps> = ({ type, onComplete, completed }) => {
  if (type === 'SEQUENCER') {
    return <SequencerLab onComplete={onComplete} completed={completed} />;
  }
  if (type === 'LOOP_COMPRESSOR') {
    return <LoopCompressorLab onComplete={onComplete} completed={completed} />;
  }
  if (type === 'SENSOR_TESTER') {
    return <SensorTesterLab onComplete={onComplete} completed={completed} />;
  }
  return <BinarySwitchLab onComplete={onComplete} completed={completed} />;
};

// 1. Chapter 1: Order Matters Sequencer
const INITIAL_STEPS = [
  { id: 'power', label: 'Flip Power Switch ON', correctOrder: 2 },
  { id: 'charge', label: 'Wait for Green Battery Light', correctOrder: 3 },
  { id: 'plug', label: 'Plug Charging Cable into Nova', correctOrder: 1 },
];

const SequencerLab: React.FC<{ onComplete?: () => void; completed?: boolean }> = ({
  onComplete,
  completed,
}) => {
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [result, setResult] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [feedback, setFeedback] = useState('Put these 3 robot charging steps in the right order, then test!');

  const move = (index: number, delta: -1 | 1) => {
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    sound.click();
    const copy = [...steps];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setSteps(copy);
    setResult('idle');
  };

  const testOrder = () => {
    const isCorrect = steps.every((s, idx) => s.correctOrder === idx + 1);
    if (isCorrect) {
      sound.win();
      setResult('ok');
      setFeedback('Exact order! Plug in first, flip power ON second, then wait for the green light.');
      onComplete?.();
    } else {
      sound.error();
      setResult('fail');
      if (steps[0].id === 'charge') {
        setFeedback('Oops! Nova cannot wait for a green light before the cable is even plugged in.');
      } else if (steps[0].id === 'power') {
        setFeedback('Careful! Never turn power ON before plugging the charging cable in first.');
      } else {
        setFeedback('Almost! Check step 2 and step 3—can you get a green light before turning power ON?');
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-sky-700">Interactive Concept Lab · Order Matters</p>
          <h3 className="text-lg font-bold text-slate-900">Fix the Charging Algorithm</h3>
        </div>
        {(completed || result === 'ok') && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Lab Verified
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                0{index + 1}
              </span>
              <span className="text-sm font-medium text-slate-800 truncate">{step.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${step.label} up`}
                className="p-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === steps.length - 1}
                aria-label={`Move ${step.label} down`}
                className="p-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-sm font-medium flex items-center gap-2 ${
            result === 'ok'
              ? 'text-emerald-700'
              : result === 'fail'
              ? 'text-red-700'
              : 'text-slate-600'
          }`}
        >
          {result === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {result === 'fail' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback}</span>
        </p>
        <button
          type="button"
          onClick={testOrder}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Test Order
        </button>
      </div>
    </div>
  );
};

// 2. Chapter 2: Loop Compressor Lab
const LoopCompressorLab: React.FC<{ onComplete?: () => void; completed?: boolean }> = ({
  onComplete,
  completed,
}) => {
  const [mode, setMode] = useState<'manual' | 'loop'>('manual');
  const [watered, setWatered] = useState(0);
  const [running, setRunning] = useState(false);

  const runDemo = (selectedMode: 'manual' | 'loop') => {
    sound.click();
    setMode(selectedMode);
    setWatered(0);
    setRunning(true);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      sound.water();
      setWatered(count);
      if (count >= 4) {
        window.clearInterval(timer);
        setRunning(false);
        if (selectedMode === 'loop') {
          onComplete?.();
        }
      }
    }, 300);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-sky-700">Interactive Concept Lab · Loops</p>
          <h3 className="text-lg font-bold text-slate-900">Compare Manual Code vs. Repeat Loop</h3>
        </div>
        {(completed || (mode === 'loop' && watered === 4)) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Lab Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        {[1, 2, 3, 4].map((idx) => {
          const isWatered = watered >= idx;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-colors ${
                isWatered
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Droplets className={`w-5 h-5 mb-1 ${isWatered ? 'text-sky-600' : 'text-slate-300'}`} />
              <span className="text-xs font-semibold">Sprout {idx}</span>
              <span className="text-[11px]">{isWatered ? 'Watered' : 'Dry'}</span>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div
          className={`p-3.5 rounded-lg border ${
            mode === 'manual' ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-900">Manual Way</span>
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">8 blocks</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Move, Water, Move, Water, Move, Water, Move, Water. Hard to edit!
          </p>
          <button
            type="button"
            disabled={running}
            onClick={() => runDemo('manual')}
            className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Run 8 Manual Blocks
          </button>
        </div>

        <div
          className={`p-3.5 rounded-lg border ${
            mode === 'loop' ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-900">Repeat Loop Way</span>
            <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">3 blocks</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Repeat 4× [ Move Forward + Water Sprout ]. Same job, 62% less code!
          </p>
          <button
            type="button"
            disabled={running}
            onClick={() => runDemo('loop')}
            className="w-full px-3 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Run Repeat 4× Loop
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Chapter 3: Sensor IF / ELSE Tester
const SensorTesterLab: React.FC<{ onComplete?: () => void; completed?: boolean }> = ({
  onComplete,
  completed,
}) => {
  const [puddleAhead, setPuddleAhead] = useState(false);
  const [testedTrue, setTestedTrue] = useState(false);

  const toggleSensor = (nextValue: boolean) => {
    sound.sensor();
    setPuddleAhead(nextValue);
    if (nextValue) {
      setTestedTrue(true);
      onComplete?.();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-sky-700">Interactive Concept Lab · Sensors &amp; IF / ELSE</p>
          <h3 className="text-lg font-bold text-slate-900">Test Nova’s Water Sensor</h3>
        </div>
        {(completed || testedTrue) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Lab Verified
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium text-slate-700 mr-2">Tile in front of Nova:</span>
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => toggleSensor(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              !puddleAhead ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dry Floor (Clear)
          </button>
          <button
            type="button"
            onClick={() => toggleSensor(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              puddleAhead ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Water Puddle
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div
          className={`p-3.5 rounded-lg border transition-colors ${
            puddleAhead ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <p className="font-mono text-xs font-semibold text-slate-700 mb-1">
            IF (Puddle Ahead == {puddleAhead ? 'TRUE' : 'FALSE'})
          </p>
          <p className="text-sm font-bold text-slate-900">Action: Jump 2 Tiles</p>
          <p className="text-xs text-slate-600 mt-1">
            {puddleAhead ? 'Active! Sensor detected water so Nova jumps safely.' : 'Skipped because floor is dry.'}
          </p>
        </div>

        <div
          className={`p-3.5 rounded-lg border transition-colors ${
            !puddleAhead ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <p className="font-mono text-xs font-semibold text-slate-700 mb-1">
            ELSE (Otherwise)
          </p>
          <p className="text-sm font-bold text-slate-900">Action: Move Forward</p>
          <p className="text-xs text-slate-600 mt-1">
            {!puddleAhead ? 'Active! Path is dry, so Nova rolls forward.' : 'Skipped because IF branch ran.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 4. Chapter 4: Binary Switch Decoder Lab
const TARGET_CODES = [5, 10, 13];
const BIT_VALUES = [8, 4, 2, 1];

const BinarySwitchLab: React.FC<{ onComplete?: () => void; completed?: boolean }> = ({
  onComplete,
  completed,
}) => {
  const [bits, setBits] = useState<number[]>([0, 0, 0, 0]);
  const [targetIdx, setTargetIdx] = useState(0);

  const target = TARGET_CODES[targetIdx];
  const currentSum = bits.reduce((sum, b, idx) => sum + b * BIT_VALUES[idx], 0);
  const isMatch = currentSum === target;

  const toggleBit = (idx: number) => {
    sound.click();
    const next = [...bits];
    next[idx] = next[idx] === 1 ? 0 : 1;
    setBits(next);
    const nextSum = next.reduce((sum, b, i) => sum + b * BIT_VALUES[i], 0);
    if (nextSum === target) {
      sound.collect();
      if (targetIdx === TARGET_CODES.length - 1) {
        onComplete?.();
      }
    }
  };

  const nextTarget = () => {
    sound.click();
    setBits([0, 0, 0, 0]);
    setTargetIdx((prev) => (prev + 1) % TARGET_CODES.length);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-medium text-sky-700">Interactive Concept Lab · Binary 1s &amp; 0s</p>
          <h3 className="text-lg font-bold text-slate-900">Unlock the Rocket Binary Vault</h3>
        </div>
        {(completed || (isMatch && targetIdx === TARGET_CODES.length - 1)) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Lab Verified
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Flip the ON (<span className="font-mono font-semibold">1</span>) and OFF (
        <span className="font-mono font-semibold">0</span>) switches so their values add up to Target Code{' '}
        <strong className="font-mono text-slate-900 tabular-nums">{target}</strong>.
      </p>

      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {BIT_VALUES.map((val, idx) => {
          const isOn = bits[idx] === 1;
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggleBit(idx)}
              className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-colors cursor-pointer ${
                isOn
                  ? 'bg-sky-600 border-sky-700 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className={`text-xs font-semibold ${isOn ? 'text-sky-100' : 'text-slate-500'}`}>
                Value {val}
              </span>
              <span className="font-mono text-2xl font-bold my-1 tabular-nums">{bits[idx]}</span>
              <span className="text-[11px] font-semibold">{isOn ? 'ON' : 'OFF'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm">
          <Zap className={`w-4 h-4 ${isMatch ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="text-slate-700">
            Binary <span className="font-mono font-semibold text-slate-900">{bits.join('')}</span> ={' '}
            <strong className="font-mono text-slate-900 tabular-nums">{currentSum}</strong>
          </span>
          {isMatch && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Match!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.click();
              setBits([0, 0, 0, 0]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
          {isMatch && (
            <button
              type="button"
              onClick={nextTarget}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {targetIdx < TARGET_CODES.length - 1 ? 'Next Code' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
