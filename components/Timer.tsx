import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Plus, RotateCcw } from 'lucide-react';

const Timer: React.FC = () => {
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playBeep = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (mode === 'countdown') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              playBeep();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setTimeLeft((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  useEffect(() => {
    setIsRunning(false);
    setTimeLeft(mode === 'countdown' ? initialTime : 0);
  }, [mode, initialTime]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'countdown' ? initialTime : 0);
  };

  const setPreset = (minutes: number) => {
    const seconds = minutes * 60;
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setMode('countdown');
    setIsRunning(false);
  };

  const quickAdd = (seconds: number) => {
    if (mode === 'countdown') {
        const newTime = timeLeft + seconds;
        setTimeLeft(newTime);
        if (!isRunning && timeLeft === initialTime) {
            setInitialTime(newTime);
        }
    }
  };

  const presets = [1, 3, 5, 10, 15];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="bg-blue-600 p-4 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Đồng Hồ
        </h2>
        <div className="flex bg-blue-700/50 p-0.5 rounded-lg">
          <button
            onClick={() => setMode('countdown')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
              mode === 'countdown' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white'
            }`}
          >
            Đếm ngược
          </button>
          <button
            onClick={() => setMode('stopwatch')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
              mode === 'stopwatch' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white'
            }`}
          >
            Bấm giờ
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 flex flex-col items-center justify-center gap-8">
        <div className="relative">
            <div className={`text-7xl font-mono font-bold tabular-nums tracking-wider ${timeLeft <= 10 && mode === 'countdown' && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
            {formatTime(timeLeft)}
            </div>
        </div>

        {/* Controls */}
        <div className="flex gap-6 items-center">
          <button
            onClick={resetTimer}
            className="p-4 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Đặt lại"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            onClick={toggleTimer}
            className={`p-5 rounded-full transition-all shadow-lg transform active:scale-95 ${
              isRunning 
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 ring-4 ring-amber-50' 
                : 'bg-blue-600 text-white hover:bg-blue-700 ring-4 ring-blue-50'
            }`}
          >
            {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
        </div>

        {/* Presets */}
        {mode === 'countdown' && (
            <div className="w-full space-y-4">
                <div className="flex justify-center gap-2 flex-wrap">
                    {presets.map(min => (
                        <button
                            key={min}
                            onClick={() => setPreset(min)}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                            {min}'
                        </button>
                    ))}
                </div>
                <div className="flex justify-center gap-3 pt-2 border-t border-slate-100">
                    <button 
                        onClick={() => quickAdd(10)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="w-3 h-3" /> 10s
                    </button>
                    <button 
                        onClick={() => quickAdd(60)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="w-3 h-3" /> 1 phút
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Timer;