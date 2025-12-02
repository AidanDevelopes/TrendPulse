import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, MessageSquare } from 'lucide-react';
import { fetchChatResponse } from '../services/geminiService';

const SUGGESTIONS = [
  "What is trending in Crypto?",
  "Latest NBA results",
  "Viral TikTok recipes",
  "SpaceX updates",
  "New Netflix shows",
  "Scientific breakthroughs today"
];

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const ChatBot: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'ai', text: "Can't find what you're looking for? Ask me about any other trending topic!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await fetchChatResponse(text);
    
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-3xl px-4 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-800/80 shadow-2xl backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 bg-slate-900/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Trend Assistant</h3>
            <p className="text-xs text-slate-400">Powered by Gemini 2.5</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="h-[400px] overflow-y-auto p-4 custom-scrollbar space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-500/20'}`}>
                {msg.role === 'user' ? <User className="h-5 w-5 text-slate-300" /> : <Sparkles className="h-5 w-5 text-indigo-400" />}
              </div>
              <div 
                className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-700/50 text-slate-200 border border-slate-600'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-slate-700/50 px-4 py-3 border border-slate-600">
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions & Input */}
        <div className="border-t border-white/5 bg-slate-900/50 p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                disabled={isLoading}
                className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-indigo-500/50 hover:bg-slate-750 hover:text-white disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a specific topic..."
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
