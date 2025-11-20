import React, { useState, useEffect } from 'react';
import { Medal, Star, Copy, ArrowUpDown, Maximize2, Minimize2, UserPlus, RotateCcw, Check, Plus, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
  id: string;
  name: string;
  score: number;
}

const StudentLeaderboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [isInputMode, setIsInputMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSort, setAutoSort] = useState(false); // Default off for fullscreen
  const [copied, setCopied] = useState(false);

  // Handle Fullscreen Toggle Logic
  useEffect(() => {
    if (isFullscreen) {
        // Requirement: Default autoSort to false when entering fullscreen
        setAutoSort(false);
    }
  }, [isFullscreen]);

  // Parse input text to create students
  const handleImport = () => {
    if (!rawInput.trim()) return;
    
    const lines = rawInput.split(/\n|,/).map(s => s.trim()).filter(s => s.length > 0);
    const newStudents: Student[] = lines.map((name, idx) => ({
        id: `student-${Date.now()}-${idx}`,
        name,
        score: 0
    }));
    
    setStudents(newStudents);
    setIsInputMode(false);
  };

  const handleReset = () => {
      if (window.confirm("Bạn có chắc muốn xóa toàn bộ danh sách và làm mới không?")) {
          setStudents([]);
          setRawInput('');
          setIsInputMode(true);
      }
  };

  const handleAddStudent = () => {
      const newStudent: Student = {
          id: `student-${Date.now()}`,
          name: 'Học sinh mới',
          score: 0
      };
      // Add to the end of the list
      setStudents([...students, newStudent]);
  };

  const handleRemoveStudent = (id: string) => {
      if (window.confirm("Xóa học sinh này?")) {
          setStudents(students.filter(s => s.id !== id));
      }
  };

  const updateName = (id: string, newName: string) => {
      setStudents(students.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const updateScore = (id: string, delta: number) => {
      setStudents(prev => {
          return prev.map(s => s.id === id ? { ...s, score: s.score + delta } : s);
      });
  };

  const handleExport = () => {
      const sortedList = [...students].sort((a, b) => b.score - a.score);
      const text = sortedList.map(s => `${s.name}: ${s.score}`).join('\n');
      
      navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

  // Dashboard always shows Top 5 sorted
  const dashboardDisplay = [...students].sort((a, b) => b.score - a.score).slice(0, 5);

  // Fullscreen display depends on toggle
  const fullscreenDisplay = autoSort 
    ? [...students].sort((a, b) => b.score - a.score) 
    : students;

  return (
    <>
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
        {/* HEADER */}
        <div className="bg-pink-600 p-4 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Medal className="w-5 h-5" />
                Thi Đua Cá Nhân
            </h2>
            <div className="flex items-center gap-2">
                 {!isInputMode && (
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-1 px-2 py-1.5 bg-pink-700 hover:bg-pink-800 rounded text-xs font-bold text-white transition-colors"
                        title="Sao chép kết quả"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Đã chép' : 'Xuất'}
                    </button>
                 )}
                 <button 
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-4">
            {isInputMode ? (
                <div className="flex flex-col gap-3">
                    <textarea
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="Nhập danh sách tên học sinh (xuống dòng)..."
                        className="w-full h-48 p-3 text-sm rounded-lg bg-pink-50 border border-pink-100 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                    />
                    <button
                        onClick={handleImport}
                        disabled={!rawInput.trim()}
                        className="w-full py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-colors disabled:opacity-50"
                    >
                        Bắt đầu tính điểm
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {/* Top 5 List Header */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Top Dẫn Đầu</span>
                        <button 
                            onClick={handleReset} 
                            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            title="Xóa danh sách và làm lại"
                        >
                            <RotateCcw className="w-3 h-3" /> Làm mới
                        </button>
                    </div>

                    {dashboardDisplay.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {dashboardDisplay.map((student, idx) => (
                                <div key={student.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                                            ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-pink-200 text-pink-700'}
                                        `}>
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-slate-700 truncate">{student.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`font-bold ${student.score < 0 ? 'text-red-500' : 'text-pink-600'}`}>{student.score}</span>
                                        {student.score >= 0 && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                                        <button 
                                            onClick={() => updateScore(student.id, 1)}
                                            className="p-1 bg-white border border-pink-100 rounded hover:bg-pink-50 text-pink-600 transition-colors"
                                        >
                                            +1
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {students.length > 5 && (
                                <div className="text-center text-xs text-slate-400 mt-1 italic">
                                    ...và {students.length - 5} học sinh khác (Xem toàn màn hình)
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-4">Chưa có dữ liệu</div>
                    )}
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
                className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-6"
            >
                {/* Fullscreen Header */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h1 className="text-3xl font-bold text-pink-500 flex items-center gap-3">
                        <Medal className="w-10 h-10" />
                        BẢNG SAO CÁ NHÂN ({students.length})
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleAddStudent}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Thêm
                        </button>

                        <div className="flex items-center gap-2 bg-white/10 px-4 rounded-lg select-none cursor-pointer" onClick={() => setAutoSort(!autoSort)}>
                             <span className="text-white/70 text-sm font-bold">Auto Sort</span>
                             <div className={`w-12 h-6 rounded-full transition-colors relative ${autoSort ? 'bg-pink-500' : 'bg-slate-600'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSort ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleExport}
                            className="px-6 py-2 bg-white text-pink-600 rounded-lg font-bold hover:bg-pink-50 flex items-center gap-2"
                        >
                             {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                             {copied ? 'Đã chép!' : 'Xuất Kết Quả'}
                        </button>

                        <button 
                            onClick={() => setIsFullscreen(false)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <Minimize2 className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                {/* Fullscreen Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                        {fullscreenDisplay.map((student, idx) => (
                            <motion.div 
                                layout={autoSort} // Only animate layout if autoSort is enabled
                                key={student.id}
                                className={`bg-white rounded-xl p-3 flex justify-between items-center shadow-lg border-l-4 group ${
                                    idx < 3 && autoSort ? 'border-yellow-400 bg-yellow-50' : 'border-pink-500'
                                }`}
                            >
                                <div className="min-w-0 flex-1 mr-4">
                                    <div className="flex items-center gap-2">
                                        {autoSort && idx < 3 && <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0" />}
                                        {/* Editable Name */}
                                        <input 
                                            type="text"
                                            value={student.name}
                                            onChange={(e) => updateName(student.id, e.target.value)}
                                            className="font-bold text-slate-800 text-lg w-full bg-transparent outline-none border-b border-transparent focus:border-pink-300 hover:border-slate-200 transition-colors"
                                        />
                                    </div>
                                    {autoSort && (
                                        <div className="text-slate-400 text-xs font-medium">Hạng {idx + 1}</div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                        <button 
                                            onClick={() => updateScore(student.id, -1)}
                                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:text-red-500 transition-colors text-slate-400 font-bold"
                                        >
                                            -
                                        </button>
                                        <span className={`text-xl font-bold w-8 text-center tabular-nums ${student.score < 0 ? 'text-red-500' : 'text-pink-600'}`}>{student.score}</span>
                                        <button 
                                            onClick={() => updateScore(student.id, 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded bg-white text-pink-600 shadow-sm hover:bg-pink-50 transition-colors font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleRemoveStudent(student.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </div>
                    {students.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <UserPlus className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-xl">Chưa có học sinh nào.</p>
                            <button onClick={handleAddStudent} className="mt-4 text-pink-500 font-bold hover:underline">Thêm học sinh ngay</button>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default StudentLeaderboard;