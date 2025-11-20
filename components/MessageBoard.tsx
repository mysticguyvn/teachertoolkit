import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Maximize2, Minimize2, Clock, Play, Pause, RotateCcw, Mic, MicOff, ArrowDown, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRESET_MESSAGES } from '../types';

// --- HELPER: RENDER TEXT WITH EMOJI PRESERVATION ---
const renderMessageWithEmojis = (text: string) => {
    if (!text) return "...";
    
    // Regex to find emojis (Simple & Extended)
    // Note: This is a basic regex for common emojis.
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    
    const parts = text.split(emojiRegex);
    
    return parts.map((part, index) => {
        if (part.match(emojiRegex)) {
            // Render emoji with default styles (removes transparent text clip)
            return (
                <span key={index} style={{ 
                    color: 'initial', 
                    WebkitTextFillColor: 'initial',
                    backgroundImage: 'none',
                    textShadow: 'none' 
                }}>
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

// --- SUB-COMPONENT: MINI NOISE MONITOR ---
const MiniNoiseMonitor: React.FC = () => {
    const [volume, setVolume] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyzer = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            
            source.connect(analyzer);
            analyzer.fftSize = 64; // Low resolution for simple visual
            
            const bufferLength = analyzer.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
            
            audioContextRef.current = audioContext;
            analyzerRef.current = analyzer;
            
            setIsListening(true);
            detectVolume();
        } catch (e) {
            console.error("Mic Error", e);
            alert("Không thể truy cập Micro.");
        }
    };

    const stopListening = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        setIsListening(false);
        setVolume(0);
    };

    const detectVolume = () => {
        if (!analyzerRef.current || !dataArrayRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
        
        let sum = 0;
        for(let i=0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
        const avg = sum / dataArrayRef.current.length;
        setVolume(Math.min(avg / 100, 1)); // Normalize 0-1
        
        rafRef.current = requestAnimationFrame(detectVolume);
    };

    useEffect(() => {
        return () => { if(isListening) stopListening(); }
    }, []);

    // Color logic based on volume
    const getColor = () => {
        if (volume > 0.6) return 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]';
        if (volume > 0.3) return 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
        return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
    };

    return (
        <div className="flex flex-col items-center gap-2 bg-slate-900/90 backdrop-blur p-3 rounded-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 h-[136px]">
            <div className="flex-1 w-8 bg-slate-800 rounded-full overflow-hidden relative flex items-end justify-center">
                {/* Volume Bar */}
                <motion.div 
                    className={`w-full rounded-t-full transition-all duration-100 ${isListening ? getColor() : 'bg-slate-700'}`}
                    style={{ height: `${Math.max(5, volume * 100)}%` }}
                />
            </div>
            <button 
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                title={isListening ? "Tắt Mic" : "Bật Mic"}
            >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
        </div>
    );
};

// --- SUB-COMPONENT: ADVANCED FLOATING TIMER ---
const FloatingTimer: React.FC = () => {
    const [mode, setMode] = useState<'countup' | 'countdown'>('countdown');
    const [time, setTime] = useState(300); // Default 5 mins for countdown
    const [initialTime, setInitialTime] = useState(300);
    const [isRunning, setIsRunning] = useState(false);
    
    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Audio for beep
    const playBeep = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880; 
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    };

    useEffect(() => {
        let interval: any;
        if (isRunning) {
            interval = setInterval(() => {
                if (mode === 'countup') {
                    setTime(t => t + 1);
                } else {
                    setTime(t => {
                        if (t <= 1) {
                            setIsRunning(false);
                            playBeep();
                            return 0;
                        }
                        return t - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, mode]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const format = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const adjustTime = (delta: number) => {
        if (mode === 'countdown') {
            const newVal = Math.max(0, time + delta);
            setTime(newVal);
            if (!isRunning) setInitialTime(newVal);
        }
    };

    // --- EDIT HANDLERS ---
    const handleTimeClick = () => {
        if (mode === 'countdown' && !isRunning) {
            const m = Math.floor(time / 60);
            const s = time % 60;
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
            const parts = cleanValue.split(':');
            totalSeconds = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
        } else if (cleanValue.endsWith('s')) {
            totalSeconds = parseInt(cleanValue) || 0;
        } else {
            totalSeconds = (parseInt(cleanValue) || 0) * 60;
        }

        if (totalSeconds > 0) {
            setInitialTime(totalSeconds);
            setTime(totalSeconds);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleEditSave();
    };

    return (
        <div className="flex flex-col gap-2 bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 min-w-[200px]">
            {/* Header Switch */}
            <div className="flex justify-center gap-1 bg-slate-800 p-1 rounded-lg mb-1">
                <button 
                    onClick={() => { setMode('countdown'); setIsRunning(false); setTime(initialTime); }}
                    className={`flex-1 text-[10px] font-bold py-1 rounded px-2 ${mode === 'countdown' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                    Đếm Ngược
                </button>
                <button 
                    onClick={() => { setMode('countup'); setIsRunning(false); setTime(0); }}
                    className={`flex-1 text-[10px] font-bold py-1 rounded px-2 ${mode === 'countup' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                >
                    Bấm Giờ
                </button>
            </div>

            {/* Display */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleEditSave}
                    onKeyDown={handleKeyDown}
                    className="text-5xl font-mono font-bold tabular-nums text-center py-1 bg-slate-800 text-white rounded outline-none border border-slate-600 w-full"
                />
            ) : (
                <div 
                    onClick={handleTimeClick}
                    className={`text-5xl font-mono font-bold tabular-nums text-center py-1 select-none cursor-pointer hover:text-slate-300 transition-colors ${time <= 10 && mode === 'countdown' && isRunning ? 'text-red-500 animate-pulse' : ''}`}
                    title={mode === 'countdown' && !isRunning ? "Bấm để sửa" : ""}
                >
                    {format(time)}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <button 
                    onClick={() => { setIsRunning(false); setTime(mode === 'countdown' ? initialTime : 0); }}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`p-3 rounded-full transition-all transform active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white shadow-lg`}
                >
                    {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
            </div>

            {/* Quick Add for Countdown */}
            {mode === 'countdown' && (
                <div className="flex justify-between pt-2 border-t border-slate-700/50 mt-1">
                    <button onClick={() => adjustTime(-60)} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">-1m</button>
                    <button onClick={() => adjustTime(60)} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">+1m</button>
                </div>
            )}
        </div>
    );
};

const MessageBoard: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showNoise, setShowNoise] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
        {/* HEADER */}
        <div className="bg-orange-500 p-4 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Thông Báo
            </h2>
            <button 
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Toàn màn hình"
            >
                <Maximize2 className="w-5 h-5" />
            </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 flex flex-col gap-4">
          <div className="w-full h-48">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập thông điệp lớp học..."
                className="w-full h-full p-4 text-2xl font-semibold text-center rounded-xl bg-orange-50 border-2 border-orange-100 focus:border-orange-300 focus:ring-0 text-orange-900 placeholder-orange-200 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_MESSAGES.map((msg, idx) => (
                <button
                    key={idx}
                    onClick={() => setMessage(msg)}
                    className="px-2 py-2 text-xs font-bold bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-orange-600 rounded-lg transition-all shadow-sm active:scale-95"
                >
                    {msg}
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                // Changed to fixed w-screen h-screen to ensure it covers everything regardless of parent
                className="fixed inset-0 top-0 left-0 w-screen h-screen z-[100] bg-white flex flex-col items-center justify-center p-4 md:p-10 cursor-default overflow-hidden"
            >
                {/* Controls Top Right */}
                <div className="absolute top-6 right-6 flex gap-4 z-50">
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="p-4 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shadow-sm group"
                    >
                        <Minimize2 className="w-8 h-8 text-slate-400 group-hover:text-slate-600" />
                    </button>
                </div>

                {/* Main Message */}
                <div className="text-center w-full max-w-[90vw] break-words flex-1 flex items-center justify-center px-4">
                    <h1 className="text-[8vw] leading-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 drop-shadow-sm selection:bg-orange-100">
                        {renderMessageWithEmojis(message || "...")}
                    </h1>
                </div>

                {/* Bottom Toolbar (Tools) */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-end gap-4">
                     {/* Noise Monitor Widget */}
                     {showNoise && <MiniNoiseMonitor />}

                    {/* Timer Widget */}
                    {showTimer && <FloatingTimer />}

                    {/* Toggle Buttons */}
                    <div className="flex flex-col gap-2">
                         <button 
                            onClick={() => setShowNoise(!showNoise)}
                            className={`p-3 rounded-full shadow-lg transition-all border ${
                                showNoise 
                                    ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-900' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-emerald-600'
                            }`}
                            title="Đo tiếng ồn"
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                        
                        <button 
                            onClick={() => setShowTimer(!showTimer)}
                            className={`p-3 rounded-full shadow-lg transition-all border ${
                                showTimer 
                                    ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-900' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-blue-600'
                            }`}
                            title="Đồng hồ"
                        >
                            <Clock className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageBoard;