import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NoiseMonitor from './components/NoiseMonitor';
import Timer from './components/Timer';
import RandomPicker from './components/RandomPicker';
import MessageBoard from './components/MessageBoard';
import Scoreboard from './components/Scoreboard';

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900">
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
            Lớp Học Thông Minh
          </h1>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 bg-white hover:bg-slate-50 rounded-full transition-colors text-slate-600 hover:text-indigo-600 shadow-sm"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
        {/* Column 1 */}
        <div className="flex flex-col gap-8 w-full">
          <div className="w-full">
            <NoiseMonitor />
          </div>
          <div className="w-full">
            <MessageBoard />
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-8 w-full">
          <div className="w-full">
            <Timer />
          </div>
          <div className="w-full">
            <RandomPicker />
          </div>
        </div>

        {/* Column 3 */}
        <div className="xl:col-span-1 md:col-span-2 w-full flex flex-col gap-8">
           <Scoreboard />
        </div>
      </div>

      {/* Settings Modal Placeholder */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Cài đặt</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                  <Settings className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Tính năng cài đặt đang được phát triển...</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;