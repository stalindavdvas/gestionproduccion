import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileSpreadsheet, Sparkles, Wand2, Download } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  attachment?: {
    name: string;
    data: string; // Base64
  };
}

export default function ChatBot() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'bot', text: '¡Hola! Soy TechBot 🤖. Pídeme un reporte, por ejemplo: "Dame un reporte de Francisco Heredia de Noviembre 2024".' }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText }]);
    setIsTyping(true);

    try {
      // 1. Enviar al Backend Real
      const response = await axios.post('/api/chat/mensaje', { texto: userText });
      const data = response.data;

      // 2. Procesar Respuesta
      const botMsg: Message = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.contenido
      };

      // Si viene archivo, lo adjuntamos
      if (data.tipo === 'archivo' && data.archivo) {
        botMsg.attachment = {
          name: data.archivo.nombre,
          data: data.archivo.data
        };
      }

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: '❌ Error de conexión con el servidor.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Función para descargar el Base64 como archivo real
  const downloadFile = (base64Data: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Sparkles className="text-indigo-600" size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-700">Asistente IA Gemini</h2>
          <p className="text-xs text-slate-500">Conectado a Base de Datos</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}>
              {msg.type === 'user' ? <User size={16} /> : <Bot size={18} />}
            </div>

            <div className={`max-w-[85%] space-y-2`}>
              <div className={`p-4 text-sm shadow-sm ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-none'}`}>
                {msg.text}
              </div>

              {/* ARCHIVO ADJUNTO */}
              {msg.attachment && (
                <div onClick={() => downloadFile(msg.attachment!.data, msg.attachment!.name)} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all shadow-sm group">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">{msg.attachment.name}</p>
                    <p className="text-xs text-slate-500">Click para descargar</p>
                  </div>
                  <Download size={18} className="text-slate-400 group-hover:text-emerald-600" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
             <div className="w-8 h-8 bg-white border border-slate-200 text-indigo-600 rounded-full flex items-center justify-center shrink-0"><Bot size={18} /></div>
             <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: Reporte de Fabricio Gomez octubre 2025"
            className="flex-1 bg-slate-100 border-none px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
            <Send size={20} />
        </button>
      </div>
    </div>
  );
}