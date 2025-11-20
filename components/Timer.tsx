import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Plus, Minus, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Timer: React.FC = () => {
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // --- EDIT TIME STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!isRunning) {
        setTimeLeft(mode === 'countdown' ? initialTime : 0);
    }
  }, [mode, initialTime]);

  // Focus input when editing starts
  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
      }
  }, [isEditing]);

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
        const newTime = Math.max(0, timeLeft + seconds);
        setTimeLeft(newTime);
        // If not running, update the initial time too so reset works as expected
        if (!isRunning) {
            setInitialTime(newTime);
        }
    }
  };

  // --- EDIT HANDLERS ---
  const handleTimeClick = () => {
      if (mode === 'countdown' && !isRunning) {
          // Convert current seconds to a user-friendly string for editing
          const m = Math.floor(timeLeft / 60);
          const s = timeLeft % 60;
          // Always format as m:ss (e.g. 5:00) instead of just 5
          setEditValue(`${m}:${s.toString().padStart(2, '0')}`);
          setIsEditing(true);
      }
  };

  const handleEditSave = () => {
      setIsEditing(false);
      if (!editValue.trim()) return;

      let totalSeconds = 0;
      const cleanValue = editValue.toLowerCase().trim();

      if (cleanValue.includes(':')) {
          // Handle mm:ss format
          const parts = cleanValue.split(':');
          const m = parseInt(parts[0]) || 0;
          const s = parseInt(parts[1]) || 0;
          totalSeconds = m * 60 + s;
      } else if (cleanValue.endsWith('s')) {
          // Handle "30s" format
          totalSeconds = parseInt(cleanValue) || 0;
      } else {
          // Default: Assume minutes
          totalSeconds = (parseInt(cleanValue) || 0) * 60;
      }

      // Allow 0
      setInitialTime(totalSeconds);
      setTimeLeft(totalSeconds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleEditSave();
  };

  // Updated presets as requested: 1, 3, 5, 10, 15
  const presets = [1, 3, 5, 10, 15];

  return (
    <>
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="bg-blue-600 p-4 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Đồng Hồ
        </h2>
        <div className="flex items-center gap-2">
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
            <button 
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
                <Maximize2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 flex flex-col items-center justify-center gap-8">
        <div className="relative">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleEditSave}
                    onKeyDown={handleKeyDown}
                    className="text-7xl font-mono font-bold text-center w-64 bg-slate-100 text-blue-600 rounded-xl outline-none focus:ring-4 ring-blue-200"
                />
            ) : (
                <div 
                    onClick={handleTimeClick}
                    className={`text-7xl font-mono font-bold tabular-nums tracking-wider cursor-pointer hover:bg-slate-50 rounded-xl px-4 transition-colors select-none ${timeLeft <= 10 && mode === 'countdown' && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}
                    title={mode === 'countdown' && !isRunning ? "Bấm để sửa thời gian" : ""}
                >
                    {formatTime(timeLeft)}
                </div>
            )}
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

        {/* Presets & Quick Adjust */}
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
                <div className="flex justify-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <button 
                        onClick={() => quickAdd(-60)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                        <Minus className="w-3 h-3" /> 1m
                    </button>
                    <button 
                        onClick={() => quickAdd(-10)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                        <Minus className="w-3 h-3" /> 10s
                    </button>
                    
                    <div className="w-px h-4 bg-slate-200 mx-1 self-center"></div>

                    <button 
                        onClick={() => quickAdd(10)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="w-3 h-3" /> 10s
                    </button>
                    <button 
                        onClick={() => quickAdd(60)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="w-3 h-3" /> 1m
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>

    {/* FULLSCREEN OVERLAY */}
    <AnimatePresence>
        {isFullscreen && (
             <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-8 transition-colors duration-500 ${
                    timeLeft <= 10 && mode === 'countdown' && timeLeft > 0 && isRunning
                        ? 'bg-red-600' 
                        : 'bg-slate-900'
                }`}
            >
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <Minimize2 className="w-8 h-8" />
                </button>

                <div className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl">
                     {/* BIG TIMER */}
                     {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={handleKeyDown}
                            className="font-mono font-bold text-[20vw] leading-none text-center w-full bg-transparent text-white border-b-4 border-white/50 outline-none mb-12"
                            autoFocus
                        />
                     ) : (
                        <div 
                            onClick={handleTimeClick}
                            className={`font-mono font-bold tabular-nums tracking-wider text-[20vw] leading-none text-white mb-12 select-none cursor-pointer hover:text-white/90 transition-colors`}
                        >
                            {formatTime(timeLeft)}
                        </div>
                     )}

                    {/* BIG CONTROLS */}
                    <div className="flex gap-12 items-center">
                        <button
                            onClick={resetTimer}
                            className="p-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <RotateCcw className="w-12 h-12" />
                        </button>
                        <button
                            onClick={toggleTimer}
                            className={`p-10 rounded-full transition-all shadow-2xl transform active:scale-95 ${
                                isRunning 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            {isRunning ? <Pause className="w-16 h-16 fill-current" /> : <Play className="w-16 h-16 fill-current ml-2" />}
                        </button>
                    </div>

                    {/* MODE SWITCH IN FULLSCREEN */}
                     <div className="flex gap-4 mt-12 bg-white/10 p-2 rounded-2xl">
                        <button
                            onClick={() => setMode('countdown')}
                            className={`px-6 py-3 rounded-xl text-lg font-bold transition-colors ${
                                mode === 'countdown' ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'
                            }`}
                        >
                            Đếm ngược
                        </button>
                        <button
                            onClick={() => setMode('stopwatch')}
                            className={`px-6 py-3 rounded-xl text-lg font-bold transition-colors ${
                                mode === 'stopwatch' ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'
                            }`}
                        >
                            Bấm giờ
                        </button>
                    </div>
                    
                    {/* Quick Add In Fullscreen */}
                    {mode === 'countdown' && (
                        <div className="flex gap-4 mt-6 flex-wrap justify-center">
                             <button 
                                onClick={() => quickAdd(-60)}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/20 font-bold border border-white/10 flex items-center gap-1"
                            >
                                -1m
                            </button>
                             <button 
                                onClick={() => quickAdd(-10)}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/20 font-bold border border-white/10 flex items-center gap-1"
                            >
                                -10s
                            </button>
                             <button 
                                onClick={() => quickAdd(10)}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/20 font-bold border border-white/10 flex items-center gap-1"
                            >
                                +10s
                            </button>
                             <button 
                                onClick={() => quickAdd(60)}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/20 font-bold border border-white/10 flex items-center gap-1"
                            >
                                +1m
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default Timer;