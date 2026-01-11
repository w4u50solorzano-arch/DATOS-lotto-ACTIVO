
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reward, ChatMessage, AdStatus } from './types';
import { REWARDS, WHATSAPP_NUMBER } from './constants';
import RewardCard from './components/RewardCard';
import { startChatSession } from './services/geminiService';
import { 
  Gift, Video, Sparkles, Zap, 
  MessageSquare, X, Send, ShieldCheck, History, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft,
  Check, Loader2
} from 'lucide-react';

const App: React.FC = () => {
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('puntos_user');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [history, setHistory] = useState<Array<{ id: string; action: string; points: number; timestamp: number }>>(() => {
    const saved = localStorage.getItem('puntos_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '¡Hola! Bienvenido a DATOS lotto ACTIVO. Soy tu Soporte Élite. ¿Listo para ganar hoy? 🎰⚡', timestamp: Date.now() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [adStatus, setAdStatus] = useState<AdStatus>({
    loading: false, error: null, message: null
  });

  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const chatSession = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('puntos_user', points.toString());
  }, [points]);

  useEffect(() => {
    localStorage.setItem('puntos_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isChatOpen && !chatSession.current) {
      chatSession.current = startChatSession();
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isChatOpen, chatMessages]);

  const addHistoryEntry = (action: string, pts: number) => {
    const entry = {
      id: crypto.randomUUID(),
      action,
      points: pts,
      timestamp: Date.now()
    };
    setHistory(prev => [entry, ...prev].slice(0, 50));
  };

  const triggerPointsAnimation = () => {
    setShowPointsAnimation(true);
    setTimeout(() => setShowPointsAnimation(false), 1200);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isAiTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: userInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsAiTyping(true);

    try {
      if (!chatSession.current) chatSession.current = startChatSession();
      const result = await chatSession.current.sendMessage({ message: userInput });
      const aiMsg: ChatMessage = { 
        role: 'model', 
        text: result.text || 'Entendido. ¡Sigamos ganando! 🚀', 
        timestamp: Date.now() 
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleWatchVideo = async () => {
    setAdStatus({ loading: true, error: null, message: 'Conectando con red de anuncios...' });
    
    const Adsgram = (window as any).Adsgram;
    if (Adsgram) {
      try {
        const AdController = Adsgram.init({ blockId: "4508" });
        const result = await AdController.show();
        if (result.done) {
          setPoints(prev => prev + 1);
          addHistoryEntry('Video visto', 1);
          triggerPointsAnimation();
          setAdStatus({ loading: false, error: null, message: '¡Excelente! +1 Punto acreditado.' });
        } else {
          setAdStatus({ loading: false, error: 'Debes ver el video completo.', message: null });
        }
      } catch (e) {
        setAdStatus({ loading: false, error: 'No hay videos disponibles ahora.', message: null });
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPoints(prev => prev + 1);
      addHistoryEntry('Prueba de video', 1);
      triggerPointsAnimation();
      setAdStatus({ loading: false, error: null, message: 'Prueba: +1 Punto sumado correctamente.' });
    }

    setTimeout(() => setAdStatus(prev => ({ ...prev, message: null, error: null })), 4000);
  };

  const initiateRedeem = (reward: Reward) => {
    if (points >= reward.cost) {
      setPendingReward(reward);
    } else {
      setAdStatus({ 
        loading: false, 
        error: `Te faltan ${reward.cost - points} puntos para ${reward.title}.`, 
        message: null 
      });
      setTimeout(() => setAdStatus(prev => ({ ...prev, error: null })), 4000);
    }
  };

  const confirmRedeem = async () => {
    if (!pendingReward || isRedeeming) return;

    setIsRedeeming(true);
    
    // Simulación de procesamiento de transacción
    await new Promise(resolve => setTimeout(resolve, 1200));

    const finalPoints = points - pendingReward.cost;
    setPoints(finalPoints);
    addHistoryEntry(`Canje: ${pendingReward.title}`, -pendingReward.cost);
    
    setRedeemSuccess(true);
    
    // Notificación de éxito inmediata antes de la redirección
    setAdStatus({ loading: false, error: null, message: '¡Canje exitoso! Preparando redirección...' });
    
    // Pequeña pausa para que el usuario vea el check de éxito en el modal
    await new Promise(resolve => setTimeout(resolve, 1200));

    const message = `Hola Soporte, acabo de canjear mis ${pendingReward.cost} puntos por: ${pendingReward.title}. Mi balance actual es ${finalPoints} pts.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    
    try {
      const win = window.open(url, '_blank');
      if (!win) {
        window.location.href = url;
      }
    } catch (e) {
      window.location.href = url;
    }
    
    // Limpiar estados de canje internos
    setTimeout(() => {
      setPendingReward(null);
      setIsRedeeming(false);
      setRedeemSuccess(false);
    }, 1000);

    // Asegurar que la notificación dure 5 segundos desde que apareció
    setTimeout(() => {
      setAdStatus(prev => ({ ...prev, message: null }));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {pendingReward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-3xl space-y-6 text-center transition-all duration-300 ${redeemSuccess ? 'scale-105 border-emerald-500/50' : ''}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${redeemSuccess ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 rotate-[360deg]' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'}`}>
              {redeemSuccess ? <Check size={40} className="animate-success-pop" /> : <span className="text-4xl">{pendingReward.icon}</span>}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-2">{redeemSuccess ? '¡Canje Realizado!' : '¿Confirmar Canje?'}</h3>
              <p className="text-slate-400 text-sm font-medium">
                {redeemSuccess 
                  ? 'Redirigiendo a WhatsApp para completar...' 
                  : <>Se descontarán <span className="text-indigo-400 font-bold">{pendingReward.cost} puntos</span> por <span className="text-white font-bold">{pendingReward.title}</span>.</>}
              </p>
            </div>
            {!redeemSuccess && (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmRedeem}
                  disabled={isRedeeming}
                  className={`relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 ${isRedeeming ? 'opacity-90' : ''}`}
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar y Recibir'
                  )}
                </button>
                <button 
                  onClick={() => setPendingReward(null)}
                  disabled={isRedeeming}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            )}
            {redeemSuccess && (
              <div className="py-4 flex justify-center">
                <Loader2 size={32} className="text-emerald-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Estilo Premium */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rayo-glow">
            <Zap size={24} className="text-white fill-white/20" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none text-white">
              DATOS lotto ACTIVO <span className="text-indigo-400 text-sm block md:inline md:ml-1">Rewards</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <ShieldCheck size={10} className="text-indigo-500" /> Sistema Verificado
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <div className={`relative bg-slate-900 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-inner transition-all duration-300 ${showPointsAnimation ? 'border-indigo-500 ring-4 ring-indigo-500/20 bg-slate-800' : ''}`}>
            <span className={`text-2xl font-black text-white tabular-nums transition-all ${showPointsAnimation ? 'animate-number-pop text-indigo-400' : 'animate-pulse-slow'}`}>
              {points}
            </span>
            <div className="w-px h-6 bg-white/10" />
            <Sparkles size={18} className={`text-amber-400 transition-transform ${showPointsAnimation ? 'scale-125 rotate-12' : ''}`} />
            
            {showPointsAnimation && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-emerald-400 font-black text-2xl animate-float-up pointer-events-none drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                +1
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-10 pb-20">
        
        {/* Banner Hero Principal */}
        <section className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-2xl transition-all duration-500 hover:border-indigo-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-600/10 opacity-50" />
          
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-md space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                SISTEMA EN LÍNEA
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
                Gana <span className="text-indigo-500">Puntos</span> <br />Rápido y Fácil.
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Interactúa con nuestra plataforma y canjea puntos por predicciones ganadoras y datos fijos exclusivos de alta fidelidad.
              </p>
              
              <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                <button 
                  onClick={handleWatchVideo}
                  disabled={adStatus.loading}
                  className="relative group/btn bg-white text-slate-950 px-8 py-4 rounded-2xl font-extrabold text-lg flex items-center gap-3 shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 animate-beam"
                >
                  <Video size={22} className="group-hover/btn:scale-110 transition-transform" />
                  {adStatus.loading ? 'Cargando...' : 'Ver Video (+1)'}
                </button>
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="bg-slate-800 text-white border border-white/10 px-8 py-4 rounded-2xl font-extrabold text-lg flex items-center gap-3 hover:bg-slate-700 transition-all shadow-lg"
                >
                  <MessageSquare size={22} />
                  Soporte Lotto
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full" />
              <div className={`relative bg-slate-950 border border-white/10 p-10 rounded-[3rem] shadow-3xl flex flex-col items-center justify-center w-56 h-56 md:w-72 md:h-72 transition-all duration-300 ${showPointsAnimation ? 'border-indigo-500/50 shadow-indigo-500/20' : ''}`}>
                <div className={`text-6xl md:text-8xl font-black text-white drop-shadow-2xl transition-all duration-300 ${showPointsAnimation ? 'animate-number-pop text-indigo-400' : ''}`}>
                  {points}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 text-center leading-tight">Puntos Reales<br/>Lotto Activo</div>
              </div>
            </div>
          </div>
        </section>

        {/* Notificaciones de Estado */}
        {(adStatus.message || adStatus.error) && (
          <div className={`mx-auto max-w-lg p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
            adStatus.error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            {adStatus.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="animate-bounce" />}
            {adStatus.error || adStatus.message}
          </div>
        )}

        {/* Catálogo de Premios */}
        <section className="space-y-8">
          <div className="flex items-end justify-between px-2">
            <div>
              <h3 className="text-3xl font-black text-white flex items-center gap-3">
                <Gift className="text-indigo-500" />
                Catálogo
              </h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Premios Disponibles</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REWARDS.map(reward => (
              <RewardCard 
                key={reward.id} 
                reward={reward} 
                userPoints={points} 
                onRedeem={initiateRedeem}
              />
            ))}
          </div>
        </section>

        {/* Sección de Historial y Verificación */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner">
                <History className="text-indigo-400" size={24} />
              </div>
              <h4 className="text-white font-bold">Actividad Reciente</h4>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-2 scrollbar-hide">
              {history.length > 0 ? (
                history.map((entry) => (
                  <div key={entry.id} className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${entry.points >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                        {entry.points >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{entry.action}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-black tabular-nums ${entry.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.points >= 0 ? `+${entry.points}` : entry.points}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-40">
                  <History size={48} />
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center space-y-4">
            <ShieldCheck size={48} className="text-indigo-500" />
            <h4 className="text-xl font-black text-white uppercase tracking-tighter text-center leading-none">Protección de Datos <br/>Verificada</h4>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">Tus puntos están protegidos por ID único y son canjeables instantáneamente vía WhatsApp con soporte oficial.</p>
          </div>
        </section>
      </main>

      {/* Botón Flotante Chat */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 z-50 bg-indigo-600 text-white p-5 rounded-3xl shadow-2xl shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all group border border-white/10"
        >
          <Zap size={32} className="group-hover:rotate-12 transition-transform fill-white/20" />
        </button>
      )}

      {/* Modal de Chat con IA */}
      {isChatOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 z-50 w-full md:w-[400px] h-full md:h-[550px] flex flex-col bg-slate-900 border border-white/10 md:rounded-[2.5rem] shadow-3xl animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
          <div className="p-5 bg-slate-800/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg border border-indigo-400/30 rayo-glow">
                <Zap size={20} className="text-white fill-white/20" />
              </div>
              <div>
                <h4 className="font-bold text-white leading-none">Soporte Lotto</h4>
                <p className="text-[10px] text-emerald-400 font-black uppercase mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                  En línea
                </p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/50 border-t border-white/5 flex gap-2">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="¿Cómo gano más puntos?"
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={!userInput.trim() || isAiTyping}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/10"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <footer className="mt-auto py-12 px-6 border-t border-white/5 bg-slate-950/50 text-center">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] leading-relaxed">
          DATOS lotto ACTIVO Rewards &copy; 2024 • GEMINI PRO AI • SISTEMA CERTIFICADO
        </p>
      </footer>
    </div>
  );
};

export default App;
