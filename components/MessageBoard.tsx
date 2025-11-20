import React, { useState } from 'react';
import { MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRESET_MESSAGES } from '../types';

const MessageBoard: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

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
                className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4 md:p-10 cursor-default"
            >
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-6 right-6 p-4 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shadow-sm group"
                >
                    <Minimize2 className="w-8 h-8 text-slate-400 group-hover:text-slate-600" />
                </button>
                
                <div className="text-center w-full max-w-7xl break-words">
                    <h1 className="text-[6vw] leading-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 drop-shadow-sm">
                        {message || "..."}
                    </h1>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageBoard;