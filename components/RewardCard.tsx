
import React, { memo, useState } from 'react';
import { Reward } from '../types';
import { Loader2 } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (reward: Reward) => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onRedeem }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isLocked = userPoints < reward.cost;
  const progress = Math.min(100, (userPoints / reward.cost) * 100);

  const handleRedeemClick = () => {
    setIsProcessing(true);
    // Simular una pequeña latencia para feedback visual
    setTimeout(() => {
      onRedeem(reward);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className={`relative group p-6 rounded-[2rem] bg-slate-900 border border-white/5 flex flex-col justify-between transition-all duration-500 ${isLocked ? 'grayscale opacity-60' : 'hover:scale-[1.03] hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10'}`}>
      <div className="absolute top-4 right-4 text-[10px] font-black text-slate-700 group-hover:text-indigo-500/50 transition-colors uppercase tracking-[0.2em] pointer-events-none">
        {reward.id} PTS
      </div>
      
      <div>
        <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-inner border border-white/5 group-hover:border-indigo-500/20 transition-colors">
          {reward.icon}
        </div>
        <h4 className="text-xl font-black text-white mb-1">{reward.title}</h4>
        <p className="text-slate-500 text-[11px] font-bold leading-relaxed">{reward.description}</p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Requisito</span>
            <span className="text-sm font-bold text-slate-300">{reward.cost} Puntos</span>
          </div>
          <span className="text-lg font-black text-indigo-500 tabular-nums">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={handleRedeemClick}
          disabled={isLocked || isProcessing}
          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
            isLocked 
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5' 
            : isProcessing 
              ? 'bg-indigo-700 text-white animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95 animate-beam'
          }`}
        >
          {isLocked ? (
            `Faltan ${reward.cost - userPoints}`
          ) : isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Procesando
            </>
          ) : (
            'Solicitar Acceso'
          )}
        </button>
      </div>
    </div>
  );
};

export default memo(RewardCard);
