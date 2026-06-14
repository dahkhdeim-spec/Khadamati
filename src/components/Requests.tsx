/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { ServiceRequest, UserProfile } from '../types';
import { Briefcase, Clock, CheckCircle2, XCircle, MapPin, Star, Sparkles, MessageCircle, AlertCircle, Trash2 } from 'lucide-react';

interface RequestsProps {
  currentUser: UserProfile;
  onNavigate: (screen: string, extra?: any) => void;
}

export default function Requests({ currentUser, onNavigate }: RequestsProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [ratingTarget, setRatingTarget] = useState<string | null>(null);
  
  // Rating form state
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState('');

  const loadRequests = async () => {
    const list = await dbService.getRequestsForUser(currentUser.id, currentUser.role);
    setRequests(list);
  };

  useEffect(() => {
    loadRequests();
    // Refresh dynamically on local storage writes (dual-mode sync)
    window.addEventListener('storage', loadRequests);
    return () => window.removeEventListener('storage', loadRequests);
  }, [currentUser]);

  const handleStatusChange = async (requestId: string, newStatus: ServiceRequest['status']) => {
    try {
      await dbService.updateRequestStatus(requestId, newStatus);
      await loadRequests();
    } catch (e) {
      console.error(e);
      alert("فشل تحديث حالة الطلب.");
    }
  };

  const submitRating = async (e: React.FormEvent, reqId: string) => {
    e.preventDefault();
    if (!feedback) {
      alert("الرجاء كتابة تعليق مع التقييم");
      return;
    }
    try {
      await dbService.rateServiceRequest(reqId, stars, feedback);
      setRatingTarget(null);
      setFeedback('');
      setStars(5);
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ التقييم.");
    }
  };

  const handleChatQuickShortcut = async (provOrCustId: string) => {
    // Determine target ID
    const chatId = await dbService.startChat(
      currentUser.role === 'customer' ? currentUser.id : provOrCustId,
      currentUser.role === 'customer' ? provOrCustId : currentUser.id
    );
    onNavigate('chats', chatId);
  };

  // Partition requests into Active VS History
  const activeRequests = requests.filter(r => ['pending', 'accepted'].includes(r.status));
  const pastRequests = requests.filter(r => ['completed', 'rejected', 'cancelled'].includes(r.status));
  const displayed = activeTab === 'active' ? activeRequests : pastRequests;

  const STATUS_LABELS: Record<string, { label: string, color: string }> = {
    'pending': { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'accepted': { label: 'تم القبول / قيد التنفيذ', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    'completed': { label: 'مكتمل بنجاح', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'rejected': { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-200' },
    'cancelled': { label: 'ملغي من العميل', color: 'bg-slate-50 text-slate-500 border-slate-200' }
  };

  return (
    <div id="requests-screen" style={{ direction: 'rtl' }} className="space-y-4 px-5 pb-20 select-none">
      
      {/* Upper header */}
      <div className="pt-4 text-right">
        <h2 className="text-lg font-black text-sky-950">لوحة تتبع طلباتي</h2>
        <p className="text-[10px] text-slate-400 font-semibold">متابعة دقيقة وتقييمات للخدمات ومراحل التنفيذ</p>
      </div>

      {/* Segment switcher */}
      <div className="flex bg-slate-100 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${activeTab === 'active' ? 'bg-white text-sky-950 shadow' : 'text-slate-500'}`}
        >
          الطلبات النشطة ({activeRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${activeTab === 'past' ? 'bg-white text-sky-950 shadow' : 'text-slate-500'}`}
        >
          أرشيف الطلبات وتاريخها ({pastRequests.length})
        </button>
      </div>

      {/* Main requests queue */}
      <div className="space-y-4">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 animate-pulse" />
            <h4 className="text-xs font-black text-slate-700">لا يوجد طلبات في هذه الفئة</h4>
            <p className="text-[9px] text-slate-400 max-w-[200px]">
              {currentUser.role === 'customer' 
                ? 'لم تطلب أي صيانة حتى الآن، جرب مهارات أحد الفنيين الآن في القسم الرئيسي!'
                : 'أهلاً بك، لا يوجد مهام معلقة في قائمتك الآن. ترقب وصول إشعارات جديدة.'}
            </p>
            {currentUser.role === 'customer' && (
              <button
                onClick={() => onNavigate('home')}
                className="mt-2 py-2 px-4 bg-sky-950 text-white rounded-xl text-[10px] font-bold"
              >
                تصفح مقدمي الخدمات
              </button>
            )}
          </div>
        ) : (
          displayed.map((req) => {
            const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: 'bg-slate-100' };
            const counterpartyName = currentUser.role === 'customer' ? req.providerName : req.customerName;
            
            return (
              <div 
                key={req.id} 
                className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3.5 shadow-sm text-right relative overflow-hidden"
              >
                {/* Horizontal Category Tag Ribbon */}
                <span className="absolute top-0 right-0 py-1 px-3 bg-slate-100 rounded-bl-xl text-[8px] font-bold text-slate-500">
                  {req.category}
                </span>

                <div className="flex justify-between items-start pt-1.5">
                  <div>
                    <h3 className="text-xs font-black text-slate-800">{req.title}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {currentUser.role === 'customer' ? "المشرف الفني:" : "العميل:"} {counterpartyName}
                    </p>
                  </div>
                  
                  <span className={`py-1 px-2.5 border text-[9px] font-bold rounded-xl whitespace-nowrap ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed font-sans bg-slate-50/50 p-2.5 rounded-xl border border-slate-50">
                  {req.description}
                </p>

                {/* Pricing & Location */}
                <div className="flex justify-between items-center text-[10px] text-slate-600 font-sans border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span className="truncate max-w-[150px]">{req.location.name}</span>
                  </div>
                  <span className="text-slate-800 font-extrabold text-xs">
                    السعر: <strong className="text-sky-600 font-bold font-mono">{req.price} MRU</strong>
                  </span>
                </div>

                {/* Interactive Dynamic Action Buttons based on User Role & Order State */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100/30">
                  
                  {/* General: Jump to messages thread directly */}
                  <button
                    onClick={() => handleChatQuickShortcut(currentUser.role === 'customer' ? req.providerId : req.customerId)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl flex justify-center items-center gap-1 border border-slate-200 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                    محادثة للتنسيق
                  </button>

                  {/* 1. PROVIDER ACTIONS */}
                  {currentUser.role === 'provider' && req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(req.id, 'accepted')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-xl flex justify-center items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        قبول المهمة
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, 'rejected')}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] rounded-xl flex justify-center items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        رفض وصرف
                      </button>
                    </>
                  )}

                  {currentUser.role === 'provider' && req.status === 'accepted' && (
                    <button
                      onClick={() => handleStatusChange(req.id, 'completed')}
                      className="w-full py-2.5 bg-sky-950 hover:bg-sky-900 text-white font-extrabold text-[10px] rounded-xl flex justify-center items-center gap-1 transition shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      إعلان إكمال الصيانة بنجاح وتحصيل المبلغ
                    </button>
                  )}

                  {/* 2. CUSTOMER ACTIONS */}
                  {currentUser.role === 'customer' && req.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(req.id, 'cancelled')}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded-xl flex justify-center items-center gap-1 border border-red-200/30 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      إلغاء الطلب الفوري
                    </button>
                  )}

                  {/* Customer Left reviews on completed jobs */}
                  {currentUser.role === 'customer' && req.status === 'completed' && !req.rating && (
                    <button
                      onClick={() => setRatingTarget(req.id)}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-slate-950 font-extrabold text-[10px] rounded-xl flex justify-center items-center gap-1.5 transition-all shadow shadow-amber-500/10"
                    >
                      <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                      تقديم تقييم ومراجعة للخدمة ⭐
                    </button>
                  )}
                </div>

                {/* Rating Input Expandable Box Overlay */}
                {ratingTarget === req.id && (
                  <form 
                    onSubmit={(e) => submitRating(e, req.id)} 
                    className="mt-3.5 pt-3.5 border-t border-dashed border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-600 block">حدد نجوم التقييم:</span>
                      
                      {/* Star picker */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((starIdx) => (
                          <button
                            type="button"
                            key={starIdx}
                            onClick={() => setStars(starIdx)}
                            className="focus:outline-none"
                          >
                            <Star className={`w-5.5 h-5.5 ${starIdx <= stars ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        placeholder="اكتب كلمة شكر أو ملحوظة نقدية لمساعدة الفني وتحسين مجتمع خدماتي..."
                        required
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRatingTarget(null)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-bold rounded-lg transition"
                      >
                        إلغاء الإجراء
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 px-4.5 bg-sky-950 text-white text-[9px] font-extrabold rounded-lg transition shadow-md"
                      >
                        نشر التقييم بنجاح
                      </button>
                    </div>
                  </form>
                )}

                {/* Display review details if already given */}
                {req.rating && (
                  <div className="mt-3.5 pt-3 bg-amber-50/50 border border-amber-100 rounded-2xl p-3 space-y-1 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-amber-900 block">لقد قمت بتقييم الخدمة:</span>
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: req.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-normal font-sans italic">
                      "{req.reviewText}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
