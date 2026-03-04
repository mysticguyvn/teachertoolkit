import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, Maximize2, Minimize2, VolumeX, Volume1 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NoiseMonitor: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // --- Alert Specific States ---
  const [alertMode, setAlertMode] = useState(false);
  const [alertCount, setAlertCount] = useState(10);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('alert_muted');
    return saved ? JSON.parse(saved) : false;
  });

  // --- Audio & Canvas Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fsCanvasRef = useRef<HTMLCanvasElement | null>(null); 
  const alertCanvasRef = useRef<HTMLCanvasElement | null>(null); // Ref for alert mode

  // --- Siren Audio Refs ---
  const sirenCtxRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Persist Mute Setting ---
  useEffect(() => {
    localStorage.setItem('alert_muted', JSON.stringify(isMuted));
  }, [isMuted]);

  // --- ESC Key Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (alertMode) {
          // If alert is counting down (count > 0), stop it completely (close it)
          // If alert is finished (count === 0), just stop sound (which stopSiren does) and close overlay
          closeAlert();
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alertMode, isFullscreen]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyzer);
      analyzer.fftSize = 256;
      
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      setIsListening(true);
      draw();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopListening = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyzerRef.current) analyzerRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();

    setIsListening(false);
    setVolume(0);
  };

  const draw = () => {
    if (!analyzerRef.current || !dataArrayRef.current) return;

    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const normalizedVolume = Math.min(average / 100, 1); 
    setVolume(normalizedVolume);
    
    // Helper draw function
    const drawToCanvas = (canvas: HTMLCanvasElement, isAlert = false) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        
        const barWidth = (width / dataArrayRef.current!.length) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < dataArrayRef.current!.length; i++) {
          barHeight = dataArrayRef.current![i] / 2; 
          
          if (canvas === fsCanvasRef.current || isAlert) {
             barHeight = dataArrayRef.current![i] * 1.5;
          }

          // Color logic
          let r, g, b;
          if (isAlert) {
              // Red/White theme for alert
              r = 255;
              g = 255 - (barHeight * 2);
              b = 255 - (barHeight * 2);
          } else {
              r = barHeight + (25 * (i/dataArrayRef.current!.length));
              g = 250 * (i/dataArrayRef.current!.length);
              b = 50;
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
    }

    if (canvasRef.current) drawToCanvas(canvasRef.current);
    if (isFullscreen && fsCanvasRef.current) drawToCanvas(fsCanvasRef.current);
    if (alertMode && alertCanvasRef.current) drawToCanvas(alertCanvasRef.current, true);

    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    return () => {
      if (isListening) stopListening();
      stopSiren();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- SIREN LOGIC ---
  const startSiren = () => {
    if (isMuted) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    sirenCtxRef.current = ctx;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth'; // Còi cảnh sát thường dùng răng cưa
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.value = 0.3; // Âm lượng gốc

    osc.start();
    sirenOscRef.current = osc;
    sirenGainRef.current = gainNode;

    // Modulate Frequency (Wailing sound)
    let isHigh = false;
    const wail = () => {
        if (!sirenOscRef.current || !sirenCtxRef.current) return;
        const now = sirenCtxRef.current.currentTime;
        // Ramp frequency up and down
        if (isHigh) {
             sirenOscRef.current.frequency.linearRampToValueAtTime(600, now + 0.6);
        } else {
             sirenOscRef.current.frequency.linearRampToValueAtTime(1200, now + 0.6);
        }
        isHigh = !isHigh;
    };

    wail(); // First run
    sirenIntervalRef.current = setInterval(wail, 600);
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    if (sirenOscRef.current) {
        try { sirenOscRef.current.stop(); } catch (e) {}
        sirenOscRef.current.disconnect();
    }
    if (sirenCtxRef.current) sirenCtxRef.current.close();
    
    sirenOscRef.current = null;
    sirenGainRef.current = null;
    sirenCtxRef.current = null;
  };

  // --- ALERT LIFECYCLE ---
  const triggerAlert = () => {
      // Bật mic nếu chưa bật để hiển thị sóng âm
      if (!isListening) startListening();
      
      setAlertMode(true);
      setAlertCount(10);
      startSiren();
  };

  const closeAlert = () => {
      setAlertMode(false);
      stopSiren();
  };

  // Countdown Effect
  useEffect(() => {
      let timer: ReturnType<typeof setInterval>;
      
      if (alertMode && alertCount > 0) {
          timer = setInterval(() => {
              setAlertCount(prev => prev - 1);
          }, 1000);

          // FADE OUT LOGIC
          if (alertCount <= 3 && sirenGainRef.current && sirenCtxRef.current) {
              const now = sirenCtxRef.current.currentTime;
              // Ramp gain down to 0 over the remaining time
              try {
                  sirenGainRef.current.gain.cancelScheduledValues(now);
                  sirenGainRef.current.gain.linearRampToValueAtTime(0, now + 1);
              } catch(e) {}
          }

      } else if (alertCount === 0) {
          // Khi về 0: Chỉ dừng âm thanh, GIỮ NGUYÊN màn hình
          stopSiren();
      }

      return () => clearInterval(timer);
  }, [alertMode, alertCount]);

  // Monitor mute toggle during alert to cut sound immediately
  useEffect(() => {
      if (alertMode) {
          if (isMuted) {
              stopSiren();
          } else if (!sirenOscRef.current) {
              // Nếu đang alert mà bật tiếng lại -> chạy lại còi
              // Chỉ chạy nếu thời gian còn > 0
              if (alertCount > 0) startSiren();
          }
      }
  }, [isMuted]);

  const getRingColor = () => {
      if (volume > 0.65) return '#ef4444';
      if (volume > 0.35) return '#eab308';
      return '#10b981';
  }

  return (
    <>
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="bg-emerald-600 p-4 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Đo Tiếng Ồn
        </h2>
        <div className="flex gap-2">
            <button
            onClick={isListening ? stopListening : startListening}
            className={`p-1.5 rounded-lg transition-colors ${
                isListening 
                ? 'bg-white text-red-600 hover:bg-red-50' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isListening ? "Tắt mic" : "Bật mic"}
            >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
      <div className="p-6 flex flex-col items-center justify-center gap-6">
        <div className="relative">
            {/* Main Indicator */}
            <div 
              className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-200 bg-gray-50`}
              style={{ 
                borderColor: getRingColor(),
                boxShadow: isListening ? `0 0 ${volume * 60}px ${getRingColor()}` : 'none',
                transform: isListening ? `scale(${1 + volume * 0.1})` : 'scale(1)'
              }}
            >
              {isListening ? (
                <div className="text-center">
                    <span className="text-3xl font-bold text-gray-800">{Math.round(volume * 100)}</span>
                    <span className="text-xs text-gray-500 block">%</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400 font-medium">Đã tắt</span>
              )}
            </div>
        </div>

        {/* Canvas Waveform */}
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={60} 
          className="w-full h-16 rounded-lg bg-gray-100 border border-gray-200"
        />
        
        <div className="w-full flex flex-col gap-2">
            {/* Horizontal Progress Bar */}
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative border border-gray-200">
                <motion.div 
                    className="h-full absolute left-0 top-0 transition-colors duration-200"
                    style={{ 
                        width: `${Math.min(volume * 100, 100)}%`,
                        backgroundColor: getRingColor()
                    }}
                />
            </div>
            
            {/* Alert Button */}
            <div className="flex gap-2 mt-2">
                <button 
                    onClick={triggerAlert}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors font-bold text-sm"
                >
                    <AlertTriangle className="w-4 h-4" />
                    PHÁT CẢNH BÁO
                </button>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`px-3 rounded-lg border transition-colors ${
                        isMuted 
                        ? 'bg-gray-100 text-gray-500 border-gray-200' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}
                    title={isMuted ? "Bật âm cảnh báo" : "Tắt âm cảnh báo"}
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                </button>
            </div>
        </div>
      </div>
    </div>

    {/* ALERT OVERLAY (The "Quiet Please" Mode) */}
    <AnimatePresence>
        {alertMode && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center overflow-hidden h-[100dvh]"
            >
                {/* Background Pulse Effect */}
                <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-red-500 z-0"
                />

                {/* MAIN CONTAINER: Flex Column with Safe Spacing */}
                <div className="relative z-10 w-full max-w-5xl flex flex-col items-center h-full pt-8 pb-8 md:pt-12 md:pb-12 px-4">
                     
                     {/* TOP: Title (Fixed height/Shrink-0) */}
                    <motion.div 
                        initial={{ y: -50 }}
                        animate={{ y: 0 }}
                        className="shrink-0 mb-4 md:mb-8"
                    >
                        <h1 className="text-[12vw] md:text-[150px] font-black text-white uppercase tracking-tighter drop-shadow-lg leading-none text-center">
                            TRẬT TỰ 🤫
                        </h1>
                    </motion.div>

                    {/* MIDDLE: Countdown (Flex-1 to take available space) */}
                    <div className="flex-1 flex items-center justify-center relative w-full min-h-0">
                        <div className="text-[35vh] md:text-[400px] font-mono font-bold text-white tabular-nums leading-none drop-shadow-2xl flex items-center justify-center h-full">
                            {alertCount}
                        </div>
                        
                        {/* Mute Toggle Floating (Absolute to Middle Container) */}
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className="absolute right-0 bottom-0 md:right-10 md:bottom-10 p-3 md:p-4 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm"
                        >
                            {isMuted ? <VolumeX className="w-6 h-6 md:w-8 md:h-8" /> : <Volume1 className="w-6 h-6 md:w-8 md:h-8" />}
                        </button>
                    </div>

                    {/* BOTTOM: Canvas & Controls (Shrink-0 to NEVER disappear) */}
                    <div className="w-full flex flex-col items-center gap-6 md:gap-8 shrink-0 mt-4 md:mt-8">
                        <canvas 
                            ref={alertCanvasRef} 
                            width={600} 
                            height={100} 
                            className="w-full max-w-2xl h-16 md:h-24 rounded-full bg-black/20 backdrop-blur-sm"
                        />
                        
                        <button 
                            onClick={closeAlert}
                            className="px-8 py-3 md:px-10 md:py-4 bg-white text-red-600 rounded-full text-lg md:text-2xl font-bold hover:bg-red-50 shadow-xl flex items-center gap-2 transform active:scale-95 transition-all"
                        >
                            <Minimize2 className="w-6 h-6 md:w-8 md:h-8" />
                            Dừng Cảnh Báo (ESC)
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    {/* STANDARD FULLSCREEN MODE */}
    <AnimatePresence>
        {isFullscreen && !alertMode && (
             <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center p-4 md:p-8 overflow-hidden"
            >
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                >
                    <Minimize2 className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-8 mt-2 tracking-wider flex items-center gap-4 shrink-0">
                    <Volume2 className="w-8 h-8 md:w-10 md:h-10" />
                    GIÁM SÁT TIẾNG ỒN
                </h1>

                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl gap-4 md:gap-8 min-h-0">
                    <div 
                        className={`w-56 h-56 md:w-80 md:h-80 rounded-full border-[6px] md:border-[8px] flex items-center justify-center transition-all duration-100 bg-slate-800 shrink-0`}
                        style={{ 
                            borderColor: getRingColor(),
                            boxShadow: isListening ? `0 0 ${volume * 100}px ${getRingColor()}` : 'none',
                            transform: isListening ? `scale(${1 + volume * 0.05})` : 'scale(1)'
                        }}
                    >
                        {isListening ? (
                            <div className="text-center">
                                <span className="text-7xl md:text-8xl font-bold text-white tabular-nums">{Math.round(volume * 100)}</span>
                            </div>
                        ) : (
                            <span className="text-xl md:text-2xl text-gray-500 font-medium">Đang tắt</span>
                        )}
                    </div>

                     {/* Fullscreen Canvas */}
                    <canvas 
                        ref={fsCanvasRef} 
                        width={600} 
                        height={120} 
                        className="w-full h-24 md:h-32 rounded-2xl bg-slate-800 border border-slate-700 shadow-inner shrink-0"
                    />

                    <div className="flex gap-4 md:gap-6 shrink-0">
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`px-6 py-3 md:px-8 md:py-4 rounded-2xl text-lg md:text-xl font-bold flex items-center gap-3 transition-all ${
                                isListening 
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-900/50' 
                                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-900/50'
                            }`}
                        >
                            {isListening ? <><MicOff className="w-6 h-6 md:w-8 md:h-8" /> Tắt Mic</> : <><Mic className="w-6 h-6 md:w-8 md:h-8" /> Bật Mic</>}
                        </button>
                        <button 
                            onClick={triggerAlert}
                            className="px-6 py-3 md:px-8 md:py-4 rounded-2xl text-lg md:text-xl font-bold bg-white text-red-600 hover:bg-red-50 border-2 border-red-500 transition-all flex items-center gap-3"
                        >
                            <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
                            Cảnh Báo
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default NoiseMonitor;