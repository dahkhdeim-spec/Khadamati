/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../firebase';
import { ChatThread, ChatMessage, UserProfile } from '../types';
import { Send, User, ChevronRight, MessageSquare, ShieldAlert, Sparkles, PhoneCall } from 'lucide-react';

interface ChatsProps {
  currentUser: UserProfile;
  initialSelectedChatId?: string | null;
  onClearSelectedChat?: () => void;
}

export default function Chats({ currentUser, initialSelectedChatId, onClearSelectedChat }: ChatsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    const list = await dbService.getChatsForUser(currentUser.id);
    setThreads(list);
    
    // If we have an initial selected chat ID, bind it
    if (initialSelectedChatId) {
      const active = list.find(t => t.id === initialSelectedChatId);
      if (active) {
        setSelectedThread(active);
        const msgs = await dbService.getMessages(active.id);
        setMessages(msgs);
      }
    }
  };

  useEffect(() => {
    loadThreads();
    window.addEventListener('storage', loadThreads);
    return () => window.removeEventListener('storage', loadThreads);
  }, [currentUser, initialSelectedChatId]);

  // Scroll to bottom of message logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const selectThread = async (thread: ChatThread) => {
    setSelectedThread(thread);
    const msgs = await dbService.getMessages(thread.id);
    setMessages(msgs);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedThread) return;

    const textToSend = inputText;
    setInputText('');

    // Send original message
    await dbService.sendMessage(selectedThread.id, currentUser.id, currentUser.name, textToSend);
    
    // Instantly load messages
    const updatedMsgs = await dbService.getMessages(selectedThread.id);
    setMessages(updatedMsgs);

    // Dynamic responsive Chat-Bot triggers inside Simulator mode
    // Answering according to Mauritanian colloquialisms!
    const isProviderResponding = currentUser.id === selectedThread.customerId;
    if (isProviderResponding) {
      setTyping(true);
      setTimeout(async () => {
        setTyping(false);
        const autoResponses = [
          "أهلاً مرحباً بك يا أخي، نتشرف بخدمتكم في كل وقت.",
          "لقد اطلعت على تفاصيل طلبك المقترح، السعر مناسب ومستعد للبدء فور تأكيدكم.",
          "أنا متواجد حالياً بالقرب من تفرغ زينة، ويمكنني الحضور إليكم في غضون نصف ساعة للبدء.",
          "بإذن الله سأحمل كل المعدات والصمامات اللازمة للعمل، الخدمة مضمونة ومتقنة بالكامل.",
          "مرحباً بكم، هل من الممكن تفصيل العطل بشكل أكبر لو تكرمتم؟"
        ];
        const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        
        await dbService.sendMessage(
          selectedThread.id,
          selectedThread.providerId,
          selectedThread.providerName,
          randomResponse
        );

        const freshMsgs = await dbService.getMessages(selectedThread.id);
        setMessages(freshMsgs);
      }, 2500); // Typings delay simulator
    }
  };

  const handleBackToThreads = () => {
    setSelectedThread(null);
    if (onClearSelectedChat) {
      onClearSelectedChat();
    }
  };

  return (
    <div id="chats-screen" style={{ direction: 'rtl' }} className="h-full flex flex-col justify-between select-none">
      
      {/* 1. MAIN COHESIVE THREADS LIST (When no chat is explicitly selected) */}
      {!selectedThread ? (
        <div className="flex-1 space-y-4 px-5 pb-20 pt-4 overflow-y-auto">
          <div className="text-right">
            <h2 className="text-lg font-black text-sky-950">شاشات المحادثات المباشرة</h2>
            <p className="text-[10px] text-slate-400 font-semibold">اتفاقات آمنة، توفير للوقت وعقود ثقة مبرمة بنقرة زر</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 animate-pulse" />
                <h4 className="text-xs font-black text-slate-700">لا يوجد محادثات جارية</h4>
                <p className="text-[9px] text-slate-400 max-w-[200px]">
                  بدأت المحادثات مع الفنيين للتفاوض على الأسئلة أو تفاصيل المواعيد ستظهر مباشرة في هذه الخانة.
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const recipientAvatar = currentUser.role === 'customer' ? thread.providerAvatar : thread.customerAvatar;
                const recipientName = currentUser.role === 'customer' ? thread.providerName : thread.customerName;

                return (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread)}
                    className="bg-white border border-slate-100 rounded-2xl p-3.5 flex gap-3.5 shadow-sm hover:shadow-md transition cursor-pointer text-right items-center"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                      <img 
                        src={recipientAvatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 truncate">{recipientName}</h4>
                        <span className="text-[8px] font-mono font-medium text-slate-400">
                          {new Date(thread.lastMessageTime).toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {thread.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* 2. LIVE ACTIVE MESSAGING CHAT ROOM OVERLAY */
        <div className="flex-1 h-[530px] flex flex-col bg-slate-50 relative pb-4 text-right">
          
          {/* Room Header */}
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={handleBackToThreads}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100">
                <img 
                  src={currentUser.role === 'customer' ? selectedThread.providerAvatar : selectedThread.customerAvatar} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-800">
                  {currentUser.role === 'customer' ? selectedThread.providerName : selectedThread.customerName}
                </h4>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[8px] text-slate-400 font-bold">متصل في خدماتي</span>
                </div>
              </div>
            </div>

            {/* Quick Interactive phone call */}
            <a 
              href={`tel:${currentUser.role === 'customer' ? '46781234' : '36219876'}`}
              className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-800"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>

          <div className="p-2 bg-amber-50 text-[9px] text-amber-800 text-center flex items-center justify-center gap-1 border-b border-amber-100">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span>نظام الحماية مفعل. تجنب تحويل المبالغ خارج بنود اتفاق المنصة.</span>
          </div>

          {/* Messages Feed Logs */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-slate-100/50">
            {messages.map((msg) => {
              const belongsToSender = msg.senderId === currentUser.id;
              
              return (
                <div 
                  key={msg.id}
                  className={`flex ${belongsToSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-right ${belongsToSender 
                      ? 'bg-sky-950 text-white rounded-tl-none font-medium' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tr-none'}`}
                  >
                    {!belongsToSender && (
                      <span className="text-[8px] font-bold text-sky-600 block mb-0.5">{msg.senderName}</span>
                    )}
                    <p className="text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[7px] select-none block mt-1.5 text-left font-mono ${belongsToSender ? 'text-white/60' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Simulated typing bubble */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tr-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  <span className="text-[8px] text-slate-400 ml-1.5 font-bold">يكتب رسالة الآن...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box footer */}
          <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-100/80 p-2 px-3 flex gap-2 items-center">
            <input
              type="text"
              className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
              placeholder="اكتب رسالتك للاتفاق والتباحث..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={typing}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || typing}
              className="w-10 h-10 bg-sky-950 hover:bg-sky-900 rounded-2xl flex items-center justify-center text-white active:scale-95 disabled:opacity-40 transition"
            >
              <Send className="w-4.5 h-4.5 rotate-180" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
