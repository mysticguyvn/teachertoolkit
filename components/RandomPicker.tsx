import React, { useState, useEffect, useRef } from 'react';
import { Dices, Sparkles, Trash2, Users, Grid, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

type Mode = 'wheel' | 'groups';

const RandomPicker: React.FC = () => {
  const [inputNames, setInputNames] = useState('');
  const [mode, setMode] = useState<Mode>('wheel');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentName, setCurrentName] = useState('?');

  const [groupSize, setGroupSize] = useState(4);
  const [groups, setGroups] = useState<string[][]>([]);

  const spinRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const namesList = inputNames
    .split(/\n|,/)
    .map(n => n.trim())
    .filter(n => n.length > 0);

  const handleSpin = () => {
    if (namesList.length < 2) {
        alert("Vui lòng nhập ít nhất 2 tên!");
        return;
    }

    setIsSpinning(true);
    setWinner(null);
    
    let counter = 0;
    const duration = 3000;
    const startTime = Date.now();
    
    const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        const randomIndex = Math.floor(Math.random() * namesList.length);
        setCurrentName(namesList[randomIndex]);

        if (elapsed < duration) {
            const nextTick = 50 + (progress * 400); 
            spinRef.current = setTimeout(tick, nextTick);
        } else {
            finishSpin();
        }
    };

    tick();
  };

  const finishSpin = () => {
    setIsSpinning(false);
    const finalIndex = Math.floor(Math.random() * namesList.length);
    const winnerName = namesList[finalIndex];
    setWinner(winnerName);
    setCurrentName(winnerName);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#3b82f6'],
      zIndex: 100 // ensure on top of fullscreen
    });
  };

  const handleSplitGroups = () => {
    if (namesList.length === 0) return;
    
    const shuffled = [...namesList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newGroups: string[][] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push(shuffled.slice(i, i + groupSize));
    }
    setGroups(newGroups);
  };

  useEffect(() => {
      return () => {
          if (spinRef.current) clearTimeout(spinRef.current);
      }
  }, []);

  return (
    <>
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="bg-purple-600 p-4 flex justify-between items-center shrink-0">
        <div className="flex bg-purple-800/50 p-0.5 rounded-lg">
            <button
                onClick={() => setMode('wheel')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    mode === 'wheel' ? 'bg-white text-purple-600 shadow-sm' : 'text-purple-100 hover:text-white'
                }`}
            >
                <Dices className="w-4 h-4" />
                Vòng Quay
            </button>
            <button
                onClick={() => setMode('groups')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    mode === 'groups' ? 'bg-white text-purple-600 shadow-sm' : 'text-purple-100 hover:text-white'
                }`}
            >
                <Users className="w-4 h-4" />
                Chia Nhóm
            </button>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => {
                    setInputNames('');
                    setWinner(null);
                    setGroups([]);
                }}
                className="text-purple-200 hover:text-white transition-colors p-1.5 hover:bg-purple-500 rounded-lg"
                title="Xóa danh sách"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
                <Maximize2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* CONTENT */}
      <div>
        {/* RESULT AREA */}
        <div className="bg-slate-50 h-64 border-b border-slate-200 relative overflow-hidden">
            {mode === 'wheel' && (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <AnimatePresence mode='wait'>
                        {winner ? (
                            <motion.div
                                key="winner"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 1, rotate: [0, -5, 5, 0] }}
                                className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center gap-2 z-10 text-center break-words max-w-full"
                            >
                                <Sparkles className="w-8 h-8 text-yellow-400 shrink-0" />
                                <span className="truncate">{winner}</span>
                                <Sparkles className="w-8 h-8 text-yellow-400 shrink-0" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="spinning"
                                className={`text-3xl font-bold text-slate-300 ${isSpinning ? 'text-slate-800 blur-[1px]' : ''}`}
                            >
                                {isSpinning ? currentName : (namesList.length > 0 ? 'Sẵn sàng!' : 'Nhập tên...')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {mode === 'groups' && (
                <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                    {groups.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {groups.map((grp, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm"
                                >
                                    <h4 className="text-xs font-bold text-purple-600 mb-1 uppercase">Nhóm {idx + 1}</h4>
                                    <ul className="text-sm text-slate-700">
                                        {grp.map((student, sIdx) => (
                                            <li key={sIdx} className="truncate">• {student}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                            <Grid className="w-8 h-8 mb-2 opacity-30" />
                            <p>Kết quả sẽ hiện ở đây</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-white flex flex-col gap-3">
            <div className="relative w-full">
                <textarea
                    value={inputNames}
                    onChange={(e) => setInputNames(e.target.value)}
                    placeholder="Nhập danh sách tên (xuống dòng)..."
                    className="w-full h-32 p-3 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    disabled={isSpinning}
                />
                <div className="absolute bottom-2 right-2 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 pointer-events-none">
                    {namesList.length}
                </div>
            </div>

            {/* ACTION BUTTONS */}
            {mode === 'wheel' ? (
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || namesList.length < 2}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 shrink-0"
                >
                    <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                    {isSpinning ? 'Đang quay...' : 'QUAY NGAY'}
                </button>
            ) : (
                <div className="flex gap-2 shrink-0">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Số người/nhóm:</span>
                        <input 
                            type="number" 
                            min="1"
                            max="50"
                            value={groupSize}
                            onChange={(e) => setGroupSize(Number(e.target.value))}
                            className="w-12 bg-transparent text-sm font-bold text-purple-600 outline-none text-center"
                        />
                    </div>
                    <button
                        onClick={handleSplitGroups}
                        disabled={namesList.length === 0}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                    >
                        <Grid className="w-4 h-4" />
                        CHIA
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>

    {/* FULLSCREEN OVERLAY */}
    <AnimatePresence>
        {isFullscreen && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 bg-purple-900/95 backdrop-blur-sm flex flex-col p-6"
            >
                 <div className="flex justify-end">
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <Minimize2 className="w-8 h-8" />
                    </button>
                 </div>

                 <div className="flex-1 flex flex-col items-center justify-center">
                    {mode === 'wheel' && (
                        <div className="w-full max-w-4xl text-center">
                            {winner ? (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 1 }}
                                    className="text-[8vw] font-extrabold text-white drop-shadow-2xl"
                                >
                                    🎉 {winner} 🎉
                                </motion.div>
                            ) : (
                                <div className={`text-[6vw] font-bold text-purple-200/50 ${isSpinning ? 'text-white blur-sm' : ''}`}>
                                    {isSpinning ? currentName : "Sẵn sàng..."}
                                </div>
                            )}

                            <button
                                onClick={handleSpin}
                                disabled={isSpinning || namesList.length < 2}
                                className="mt-12 px-12 py-6 text-2xl bg-white text-purple-600 rounded-2xl font-bold hover:bg-purple-50 disabled:opacity-50 shadow-2xl flex items-center justify-center gap-3 mx-auto"
                            >
                                <RotateCw className={`w-8 h-8 ${isSpinning ? 'animate-spin' : ''}`} />
                                {isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}
                            </button>
                        </div>
                    )}

                    {mode === 'groups' && (
                        <div className="w-full max-w-6xl h-[80vh] overflow-y-auto custom-scrollbar p-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.length > 0 ? groups.map((grp, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-xl">
                                         <h3 className="text-2xl font-bold text-purple-600 mb-4 border-b border-purple-100 pb-2">Nhóm {idx + 1}</h3>
                                         <ul className="space-y-2">
                                            {grp.map((student, sIdx) => (
                                                <li key={sIdx} className="text-lg text-slate-700 font-medium">• {student}</li>
                                            ))}
                                         </ul>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center text-white/50 text-2xl">Chưa có nhóm nào được chia.</div>
                                )}
                             </div>
                        </div>
                    )}
                 </div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default RandomPicker;