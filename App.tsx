
import React, { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isWakingUp: false,
    isFormed: false,
    isFist: false,
    cameraActive: false,
  });

  const [selectedDeco, setSelectedDeco] = useState<string>('westie');
  const [instruction, setInstruction] = useState("Waiting for camera...");

  useEffect(() => {
    if (!state.cameraActive) {
      setInstruction("Please allow camera access to start the magic.");
    } else if (!state.isFormed && !state.isWakingUp) {
      setInstruction("Clench your hand into a FIST to summon the tree!");
    } else if (state.isWakingUp) {
      setInstruction("The ice is crystallizing...");
    } else if (state.isFormed) {
      setInstruction("Select a decoration and click the tree!");
    }
  }, [state]);

  const decoTypes = [
    { id: 'westie', label: '🐶 Westie', color: 'bg-white' },
    { id: 'bell', label: '🔔 Bell', color: 'bg-yellow-400' },
    { id: 'ornament', label: '🔴 Ornament', color: 'bg-red-500' },
    { id: 'snowflake', label: '❄️ Snowflake', color: 'bg-blue-100' },
    { id: 'candycane', label: '🦯 Cane', color: 'bg-red-200' },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      {/* 3D Scene */}
      <Scene 
        appState={state} 
        onStateChange={setState} 
        selectedDecoration={selectedDeco}
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex flex-col items-center justify-start z-10">
        <h1 className="text-4xl md:text-6xl font-light tracking-widest text-[#A5F3FC] drop-shadow-[0_0_15px_rgba(165,243,252,0.8)] mb-2">
          ICE CRYSTAL WESTIE
        </h1>
        <p className="text-white/60 text-sm tracking-widest uppercase mb-8">Christmas Interactive Experience</p>
        
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full transition-all duration-500 transform translate-y-0 opacity-100">
          <p className="text-white text-lg font-light tracking-wide">{instruction}</p>
        </div>
      </div>

      {/* Decoration Selection Bar */}
      {state.isFormed && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-black/50 p-3 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
          {decoTypes.map((deco) => (
            <button
              key={deco.id}
              onClick={() => setSelectedDeco(deco.id)}
              className={`px-4 py-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 border ${
                selectedDeco === deco.id 
                ? 'bg-white/20 border-white/40 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                : 'bg-transparent border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <span className="text-2xl">{deco.label.split(' ')[0]}</span>
              <span className="text-[10px] uppercase tracking-tighter text-white/80 font-bold">{deco.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[8px] tracking-[0.3em] uppercase pointer-events-none">
        Flat Style Decorations • No Light Interaction
      </div>

      {/* Hidden Video for MediaPipe */}
      <video
        id="input-video"
        className="hidden"
        playsInline
      ></video>
    </div>
  );
};

export default App;
