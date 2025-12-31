import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, FileSpreadsheet, Sparkles, Wand2 } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  attachment?: {
    type: 'excel' | 'pdf';
    name: string;
    size: string;
  };
}

export default function ChatBot() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Historial inicial
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: '¡Hola! Soy TechBot 🤖. Tengo acceso a la base de datos de Tecnipeso. Puedo buscar órdenes, analizar productividad o generar reportes Excel. ¿Qué necesitas?' }
  ]);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');

    // 1. Mostrar mensaje de usuario
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText }]);
    setIsTyping(true);

    // 2. SIMULACIÓN DE RESPUESTA (Aquí conectaremos la API de Gemini más adelante)
    setTimeout(() => {
      let botResponse: Message = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Lo siento, aún estoy aprendiendo. Por favor intenta preguntar por un "Reporte de productividad".'
      };

      // Respuestas simuladas para el DEMO
      const lowerInput = userText.toLowerCase();

      if (lowerInput.includes('fabricio') || lowerInput.includes('reporte')) {
        botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          text: '✅ He analizado los datos. Aquí tienes el reporte de productividad de Fabricio Gomez correspondiente a Octubre 2025. Se encontraron 45 mantenimientos (30 Campo / 15 Taller).',
          attachment: {
            type: 'excel',
            name: 'Reporte_Fabricio_Oct2025.xlsx',
            size: '24 KB'
          }
        };
      } else if (lowerInput.includes('hola')) {
        botResponse.text = '¡Hola de nuevo! 👋 ¿En qué te ayudo?';
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const sugerencias = [
    "📊 Reporte mensual de Fabricio",
    "🏭 Clientes con más mantenimientos",
    "⚠️ Equipos pendientes de entrega"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Sparkles className="text-indigo-600" size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-700">Asistente IA Gemini</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Conectado a Base de Datos
          </p>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
              ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}>
              {msg.type === 'user' ? <User size={16} /> : <Bot size={18} />}
            </div>

            {/* Burbuja */}
            <div className={`max-w-[85%] lg:max-w-[70%] space-y-2`}>
              <div className={`p-4 text-sm shadow-sm
                ${msg.type === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-none'}`}>
                {msg.text}
              </div>

              {/* Archivo Adjunto (Simulado) */}
              {msg.attachment && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm group">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{msg.attachment.name}</p>
                    <p className="text-xs text-slate-500">{msg.attachment.size} • Generado por IA</p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100">
                    Bajar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Animación Escribiendo */}
        {isTyping && (
          <div className="flex gap-3">
             <div className="w-8 h-8 bg-white border border-slate-200 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
               <Bot size={18} />
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-4">

        {/* Sugerencias Rápidas */}
        {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {sugerencias.map((sug, idx) => (
                    <button
                        key={idx}
                        onClick={() => setInput(sug)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all whitespace-nowrap"
                    >
                        <Wand2 size={12} />
                        {sug}
                    </button>
                ))}
            </div>
        )}

        <div className="flex gap-2 max-w-4xl mx-auto items-end">
          <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors mb-0.5">
            <Paperclip size={20} />
          </button>
          <div className="flex-1 bg-slate-100 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 border border-transparent transition-all">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Pregunta algo sobre los datos... (Ej: Rendimiento de octubre)"
                className="w-full bg-transparent border-none px-4 py-3 outline-none resize-none max-h-32 text-slate-700 placeholder:text-slate-400"
                rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 mb-0.5"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}