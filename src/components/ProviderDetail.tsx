/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { UserProfile, ServiceRequest } from '../types';
import { ChevronRight, ShieldCheck, Mail, Phone, MapPin, Star, MessageCircle, Briefcase, Calendar, Sparkles, Send, Check, Share2, Copy } from 'lucide-react';

interface ProviderDetailProps {
  provider: UserProfile;
  currentUser: UserProfile;
  onNavigate: (screen: string, extra?: any) => void;
  onStartChatThread: (chatId: string) => void;
}

const MAURITANIAN_NEIGHBORHOODS = [
  "تفرغ زينة، نواكشوط",
  "عرفات، نواكشوط",
  "لكصر، نواكشوط",
  "السبخة، نواكشوط",
  "تيارت، نواكشوط",
  "دار النعيم، نواكشوط",
  "الميناء، نواكشوط",
  "توجونين، نواكشوط",
  "نواذيبو، الساحل",
  "روصو، الجنوب"
];

export default function ProviderDetail({ provider, currentUser, onNavigate, onStartChatThread }: ProviderDetailProps) {
  const [reviews, setReviews] = useState<ServiceRequest[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // New request fields
  const [orderTitle, setOrderTitle] = useState('');
  const [orderDesc, setOrderDesc] = useState('');
  const [orderPrice, setOrderPrice] = useState('1500'); // Proposed in MRU
  const [neighborhood, setNeighborhood] = useState(provider.location?.name || MAURITANIAN_NEIGHBORHOODS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `أنصحك بمقدم الخدمة المتميز هذا في تطبيق خدماتي 🇲🇷:
👤 الاسم: ${provider.name}
🛠️ التخصص: ${provider.category || 'صيانة عامة'}
💼 الخبرة: ${provider.experience || 'غير محددة'}
⭐️ التقييم: ${provider.rating || '5.0'} (${provider.reviewsCount || 0} تقييم)
📍 الموقع المغطى: ${provider.location?.name || 'نواكشوط'}

يمكنك حجز الخدمة مباشرة والتواصل معه عبر تطبيق خدماتي المتميز!`;

  const handleWhatsAppShare = () => {
    const textUrl = encodeURIComponent(`${shareText}\n\nرابط التطبيق: ${window.location.origin}`);
    window.open(`https://api.whatsapp.com/send?text=${textUrl}`, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nرابط التطبيق: ${window.location.origin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `خدماتي - الملف الشخصي لمقدم الخدمة ${provider.name}`,
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.warn("Native share failure:", err);
      }
    } else {
      handleCopyText();
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const all = await dbService.getRequests();
      // Find completed orders for this provider containing ratings
      const filtered = all.filter(r => r.providerId === provider.id && r.status === 'completed' && r.rating !== undefined);
      setReviews(filtered);
    };
    fetchReviews();
  }, [provider]);

  const handleStartChat = async () => {
    if (currentUser.id === provider.id) {
      alert("هذا حسابك الخاص، لا يمكنك محادثة نفسك!");
      return;
    }
    const chatId = await dbService.startChat(currentUser.id, provider.id);
    onStartChatThread(chatId);
    onNavigate('chats');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.id === provider.id) {
      alert("لا يمكنك توظيف نفسك!");
      return;
    }
    if (!orderTitle || !orderDesc || !orderPrice) {
      alert("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    setSubmitting(true);
    try {
      await dbService.createRequest({
        customerId: currentUser.id,
        customerName: currentUser.name,
        providerId: provider.id,
        providerName: provider.name,
        category: provider.category || "عام",
        title: orderTitle,
        description: orderDesc,
        status: 'pending',
        price: parseFloat(orderPrice) || 1000,
        location: {
          latitude: 18.085,
          longitude: -15.975,
          name: neighborhood
        }
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowOrderModal(false);
        setOrderTitle('');
        setOrderDesc('');
        onNavigate('orders'); // Redirect to orders screen immediately
      }, 1800);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال طلب الصيانة.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="provider-detail-screen" style={{ direction: 'rtl' }} className="space-y-6 pb-24 select-none">
      {/* Header Panel */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-3">
          <button 
            id="provider-back-btn"
            onClick={() => onNavigate('search')}
            className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="text-lg font-black text-sky-950">تفاصيل مقدم الخدمة</h2>
            <p className="text-[10px] text-slate-400 font-semibold">تواصل مباشر واتفاق آمن مع أفضل مزودي الكفاءات</p>
          </div>
        </div>

        <button
          id="provider-share-trigger-btn"
          onClick={() => setShowShareModal(true)}
          className="w-10 h-10 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center hover:bg-slate-100/70 text-sky-700 transition active:scale-95 shadow-sm"
          title="مشاركة تفاصيل الفني"
        >
          <Share2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Main Profile Info Header Card */}
      <div className="px-5">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center relative overflow-hidden">
          {/* Top subtle visual ribbon */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-sky-500 via-amber-400 to-indigo-600"></div>
          
          <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-3.5 bg-slate-100 mt-2">
            <img 
              src={provider.avatarUrl} 
              alt={provider.name} 
              className="w-full h-full object-cover"
            />
            {provider.isVerified && (
              <span className="absolute bottom-0 right-0 w-full py-0.5 bg-sky-950 text-[8px] text-white font-bold tracking-wider">مُوثّق</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-sm font-black text-slate-800">{provider.name}</h3>
            {provider.isVerified && <ShieldCheck className="w-4 h-4 text-sky-500" />}
          </div>

          <span className="inline-block mt-1 text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
            {provider.category}
          </span>

          <p className="mt-3.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {provider.bio}
          </p>

          {/* Quick Metrics grid */}
          <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-100">
            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-bold block mb-1">التقييم</span>
              <div className="flex items-center justify-center gap-0.5 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-black font-mono">{provider.rating}</span>
              </div>
            </div>
            
            <div className="text-center border-x border-slate-100">
              <span className="text-[9px] text-slate-400 font-bold block mb-1">الخبرة</span>
              <span className="text-xs font-black text-slate-800">{provider.experience}</span>
            </div>

            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-bold block mb-1">التقييمات</span>
              <span className="text-xs font-black text-slate-800 font-mono">{provider.reviewsCount || 0} تقييم</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Map Segment */}
      <div className="px-5">
        <h4 className="text-xs font-black text-sky-950 mb-3 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-red-500 animate-bounce" />
          مكان تقديم الخدمة والمدى الجغرافي
        </h4>

        <div className="h-36 rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 relative shadow-sm">
          {/* Embedded simulated high-fidelty grid map */}
          <div className="absolute inset-0 bg-slate-100 opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute"></div>
            <div className="w-5 h-5 rounded-full bg-red-500 ring-4 ring-red-500/25 flex items-center justify-center text-white text-[10px] relative z-20">📍</div>
            <h5 className="text-xs font-bold text-slate-800 mt-2.5">{provider.location?.name}</h5>
            <span className="text-[8px] text-slate-400 mt-0.5 font-semibold font-mono">طول: 18.085 , عرض: -15.975 (تحديد الموقع الجغرافي)</span>
          </div>

          <div className="absolute top-2 right-2 py-1 px-2.5 bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-extrabold text-slate-700 border border-slate-200">
            نواكشوط 🇲🇷
          </div>
        </div>
      </div>

      {/* Skills tags selection */}
      {provider.skills && provider.skills.length > 0 && (
        <div className="space-y-3 px-5">
          <h4 className="text-xs font-black text-sky-950">أبرز المهارات والخدمات الفرعية</h4>
          <div className="flex flex-wrap gap-2">
            {provider.skills.map((skill, i) => (
              <span key={i} className="py-1.5 px-3 bg-white border border-slate-100 text-[10px] font-bold text-slate-700 rounded-xl shadow-sm">
                🛠️ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Client Feedback Ratings Reviews Section */}
      <div className="space-y-4 px-5">
        <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500 fill-current" />
          مراجعات وتوصيات العملاء ({reviews.length})
        </h4>

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-white border border-slate-100 rounded-3xl text-xs text-slate-400">
              لا توجد تقييمات مسجلة لهذا الفني حتى الآن.
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-slate-50 rounded-2xl p-3.5 space-y-2 text-right shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">{rev.customerName}</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">{rev.reviewText}</p>
                <span className="text-[8px] text-slate-400 block font-mono">
                  {new Date(rev.updatedAt).toLocaleDateString('ar-MR', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Persistent Bottom Floating CTA Navigation Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-3.5 flex gap-3.5 max-w-md mx-auto z-40">
        <button
          onClick={handleStartChat}
          className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-sky-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs active:scale-95 transition"
        >
          <MessageCircle className="w-4.5 h-4.5 text-sky-700" />
          محادثة واتفاق
        </button>

        <button
          onClick={() => setShowOrderModal(true)}
          className="flex-[1.5] py-3 bg-sky-950 hover:bg-sky-900 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-xs active:scale-95 shadow-lg shadow-sky-950/20 transition"
        >
          <Briefcase className="w-4.5 h-4.5 text-white animate-pulse" />
          طلب خدمة صيانة
        </button>
      </div>

      {/* Float overlay slide panel (Service booking form) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-[2.5rem] p-6 w-full max-w-sm space-y-4 shadow-2xl relative translate-y-0 text-right animate-slide-up rounded-b-3xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-sky-950">إرسال طلب صيانة جديد</h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-center flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold animate-bounce">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-emerald-800">تم إرسال الطلب بنجاح!</h4>
                <p className="text-[10px] text-slate-500">تم إرسال الطلب، وسيقوم الفني بالرد في غضون لحظات.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600">عنوان الطلب باختصار</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    placeholder="مثال: تصليح تسريبات مياه في الحمام"
                    required
                    value={orderTitle}
                    onChange={(e) => setOrderTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600">التفاصيل والمتطلبات</label>
                  <textarea
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    placeholder="يرجى كتابة التفاصيل هنا لمساعدة الفني على حمل الأدوات المناسبة..."
                    required
                    value={orderDesc}
                    onChange={(e) => setOrderDesc(e.target.value)}
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600">السعر المقترح (أوقية MRU)</label>
                    <input
                      type="number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600">المقاطعة / الحي</label>
                    <select
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                    >
                      {MAURITANIAN_NEIGHBORHOODS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl block text-[10px] text-amber-800 leading-relaxed">
                  ⚠️ <strong>نظام الحماية والضمان:</strong> رسوم المنصة 10% مقتطعة تلقائياً من الفني. يرجى إبقاء كل المحادثات والاتفاق داخل تطبيق <strong>خدماتي</strong> لضمان النزاهة والحماية القانونية.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-sky-950 hover:bg-sky-900 text-white font-extrabold rounded-2xl text-xs transition flex justify-center items-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4 rotate-180" />
                  {submitting ? 'جاري الإرسال...' : 'تأكيد الحجز الفوري وإرسال الطلب'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Slide-up Share Sheet Modal */}
      {showShareModal && (
        <div id="share-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50 p-4">
          <div id="share-modal-content" className="bg-white rounded-t-[2.5rem] p-6 w-full max-w-sm space-y-4 shadow-2xl relative translate-y-0 text-right animate-slide-up rounded-b-3xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-sky-950 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-sky-700" />
                مشاركة الملف الشخصي لمقدم الخدمة
              </h3>
              <button 
                id="close-share-btn"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-500 font-bold text-center flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
              شارك بيانات الفني المفضل لديك مع الأصدقاء والعائلة عبر تطبيقات التواصل الاجتماعي بضغطة زر واحدة!
            </p>

            {/* Formatted Text Preview */}
            <div className="space-y-1.5 text-right">
              <span className="text-[9px] font-black text-slate-500">معاينة الرسالة التي ستتم مشاركتها:</span>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] text-slate-600 font-semibold whitespace-pre-wrap leading-relaxed shadow-inner max-h-36 overflow-y-auto">
                {shareText}
              </div>
            </div>

            {/* Share action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="share-whatsapp-btn"
                onClick={handleWhatsAppShare}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-[11px] transition flex justify-center items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95"
              >
                <span className="text-sm">🟢</span>
                مشاركة عبر واتساب
              </button>

              <button
                id="share-native-btn"
                onClick={handleNativeShare}
                className="py-3 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl text-[11px] transition flex justify-center items-center gap-2 shadow-md shadow-sky-600/10 active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                مشاركة عبر النظام
              </button>
            </div>

            <button
              id="share-copy-btn"
              onClick={handleCopyText}
              className={`w-full py-3.5 border transition flex justify-center items-center gap-2 rounded-2xl text-xs font-bold active:scale-95 ${
                copied 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                  تم نسخ كافّة التفاصيل والرابط بنجاح!
                </>
              ) : (
                <>
                  <Copy className="w-4.5 h-4.5 text-slate-500" />
                  نسخ التفاصيل ورابط التطبيق للطلب
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
