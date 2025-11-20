import React, { useState } from 'react';
import { Trophy, Plus, Minus, Target, Trash2, ArrowUpDown, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, TEAM_COLORS } from '../types';

const Scoreboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Nhóm 1', score: 0, color: TEAM_COLORS[0] },
    { id: '2', name: 'Nhóm 2', score: 0, color: TEAM_COLORS[8] },
  ]);
  const [targetScore, setTargetScore] = useState(20);
  const [autoSort, setAutoSort] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const addTeam = () => {
    const nextColorIdx = teams.length % TEAM_COLORS.length;
    const newTeam: Team = {
        id: Date.now().toString(),
        name: `Nhóm ${teams.length + 1}`,
        score: 0,
        color: TEAM_COLORS[nextColorIdx]
    };
    setTeams([...teams, newTeam]);
  };

  const removeTeam = (id: string) => {
      setTeams(teams.filter(t => t.id !== id));
  };

  const updateScore = (id: string, delta: number) => {
      setTeams(prev => {
          const newTeams = prev.map(t => {
              if (t.id === id) {
                  return { ...t, score: Math.max(0, t.score + delta) };
              }
              return t;
          });
          
          if (autoSort) {
              return [...newTeams].sort((a, b) => b.score - a.score);
          }
          return newTeams;
      });
  };

  const updateName = (id: string, name: string) => {
      setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
  };

  const sortedTeams = autoSort ? [...teams].sort((a, b) => b.score - a.score) : teams;

  return (
    <>
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="bg-amber-500 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Bảng Thi Đua
        </h2>
        
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-amber-600/50 p-1 rounded-lg">
                <div className="flex items-center gap-2 px-2">
                    <Target className="w-4 h-4 text-amber-100" />
                    <input 
                        type="number" 
                        value={targetScore}
                        onChange={(e) => setTargetScore(Number(e.target.value))}
                        className="w-10 bg-transparent text-white font-bold text-sm outline-none text-center"
                        title="Mục tiêu điểm"
                    />
                </div>
                <div className="h-4 w-px bg-amber-400/50"></div>
                <button 
                    onClick={() => setAutoSort(!autoSort)}
                    className={`p-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                        autoSort ? 'bg-white text-amber-600' : 'text-amber-100 hover:bg-amber-600'
                    }`}
                    title="Tự động sắp xếp"
                >
                    <ArrowUpDown className="w-3 h-3" />
                    Auto
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

      {/* TEAM LIST AREA */}
      <div className="p-4 bg-slate-50 overflow-y-auto custom-scrollbar max-h-[500px]">
        <AnimatePresence initial={false} mode="popLayout">
            <div className="flex flex-col gap-3">
                {sortedTeams.map((team) => {
                    const progress = Math.min(100, Math.max(0, (team.score / targetScore) * 100));
                    const isWinner = team.score >= targetScore;

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`bg-white p-3 rounded-xl border-2 shadow-sm transition-all relative overflow-hidden ${
                                isWinner ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-transparent'
                            }`}
                        >
                             {/* Progress Bar Background */}
                            <div 
                                className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out"
                                style={{ 
                                    width: `${progress}%`, 
                                    backgroundColor: team.color.replace('bg-', 'text-').replace('500', '500') 
                                }} 
                            />

                            <div className="flex items-center gap-3 relative z-10">
                                {/* Color/Rank Indicator */}
                                <div className={`w-1.5 h-12 rounded-full ${team.color} shrink-0`}></div>
                                
                                {/* Team Info */}
                                <div className="flex-1 min-w-0">
                                    <input 
                                        type="text" 
                                        value={team.name}
                                        onChange={(e) => updateName(team.id, e.target.value)}
                                        className="font-bold text-slate-800 w-full outline-none bg-transparent placeholder-slate-400 focus:border-b border-slate-200"
                                        placeholder="Tên nhóm..."
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${team.color} transition-all duration-500`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <button 
                                        onClick={() => updateScore(team.id, -1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-lg text-slate-700 tabular-nums">
                                        {team.score}
                                    </span>
                                    <button 
                                        onClick={() => updateScore(team.id, 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-green-500 hover:shadow-sm transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={() => updateScore(team.id, 5)}
                                    className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                                >
                                    +5
                                </button>

                                <button 
                                    onClick={() => removeTeam(team.id)}
                                    className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </AnimatePresence>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <button
            onClick={addTeam}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
        >
            <Plus className="w-5 h-5" />
            Thêm Nhóm Mới
        </button>
      </div>
    </div>

    {/* FULLSCREEN OVERLAY */}
    <AnimatePresence>
        {isFullscreen && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-6"
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
                        <Trophy className="w-10 h-10" />
                        BẢNG THI ĐUA
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={addTeam}
                            className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
                        >
                            + Thêm Nhóm
                        </button>
                        <button 
                            onClick={() => setIsFullscreen(false)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <Minimize2 className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {sortedTeams.map((team) => {
                             const progress = Math.min(100, Math.max(0, (team.score / targetScore) * 100));
                             return (
                                <div key={team.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
                                     <div 
                                        className={`absolute bottom-0 left-0 h-2 ${team.color}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-3 h-16 rounded-full ${team.color}`}></div>
                                        <div className="flex-1 ml-4">
                                             <h3 className="text-3xl font-bold text-white mb-1">{team.name}</h3>
                                             <div className="text-slate-400 text-sm font-medium">{progress.toFixed(0)}% Hoàn thành</div>
                                        </div>
                                        <div className="text-5xl font-bold text-white tabular-nums">{team.score}</div>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-6">
                                        <button onClick={() => updateScore(team.id, -1)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-xl">-1</button>
                                        <button onClick={() => updateScore(team.id, 1)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-xl">+1</button>
                                        <button onClick={() => updateScore(team.id, 5)} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold text-xl">+5</button>
                                    </div>
                                </div>
                             )
                         })}
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default Scoreboard;