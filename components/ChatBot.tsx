import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card } from './ui/DesignSystem';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface ChatBotProps {
  currentView: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hi! I\'m CarrerBot. I can help you navigate the app or answer questions about your career tools. How can I help?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Get response from Gemini
      // Filter out the initial welcome message from history sent to API to avoid confusion if needed, 
      // though typically it's fine.
      const responseText = await sendChatMessage(messages, userMsg.text, currentView);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">CarrerBot</h3>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-none shadow-sm",
                      msg.role === 'user' ? "bg-white border border-slate-200" : "bg-brand-100 text-brand-700"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm",
                      msg.role === 'user' 
                        ? "bg-brand-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                    )}>
                      {msg.role === 'model' ? (
                         <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                           <ReactMarkdown>{msg.text}</ReactMarkdown>
                         </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 max-w-[85%]">
                     <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-none shadow-sm">
                        <Bot className="w-5 h-5" />
                     </div>
                     <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form onSubmit={handleSend} className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about CarrerX..."
                    className="pr-12 py-3 rounded-full bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-1 top-1 bottom-1 w-9 h-9 rounded-full p-0 flex items-center justify-center"
                  >
                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative",
            isOpen ? "bg-slate-900 text-white rotate-90" : "bg-brand-600 text-white hover:bg-brand-700"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          
          {/* Notification Dot (fake) */}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ChatBot;