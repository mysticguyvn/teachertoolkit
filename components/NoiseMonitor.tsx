import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const NoiseMonitor: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (!analyzerRef.current || !dataArrayRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const normalizedVolume = Math.min(average / 100, 1); // Normalize roughly 0-1
    
    setVolume(normalizedVolume);
    
    // Draw visualization
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = (width / dataArrayRef.current.length) * 2.5;
    let barHeight;
    let x = 0;

    for(let i = 0; i < dataArrayRef.current.length; i++) {
      barHeight = dataArrayRef.current[i] / 2; // Scale down slightly
      
      const r = barHeight + (25 * (i/dataArrayRef.current.length));
      const g = 250 * (i/dataArrayRef.current.length);
      const b = 50;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    return () => {
      if (isListening) stopListening();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const getRingColor = () => {
      if (volume > 0.65) return '#ef4444';
      if (volume > 0.35) return '#eab308';
      return '#10b981';
  }

  const playAlert = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="bg-emerald-600 p-4 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Đo Tiếng Ồn
        </h2>
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
            <button 
                onClick={playAlert}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors font-bold text-sm"
            >
                <AlertTriangle className="w-4 h-4" />
                PHÁT CẢNH BÁO
            </button>
        </div>
      </div>
    </div>
  );
};

export default NoiseMonitor;