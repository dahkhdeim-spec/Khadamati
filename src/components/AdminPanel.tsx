/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { UserProfile, AdBanner, Complaint, ServiceRequest } from '../types';
import { BarChart3, Users, Image as ImageIcon, MessageSquareWarning, ShieldCheck, ShieldAlert, Check, Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  
  const [activeSegment, setActiveSegment] = useState<'stats' | 'users' | 'complaints' | 'ads'>('stats');

  // Ad banner creator state
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [adSubmitting, setAdSubmitting] = useState(false);

  const loadAdminData = async () => {
    const listUsers = await dbService.getUsers();
    setUsers(listUsers);

    const listAds = await dbService.getAds();
    setAds(listAds);

    const listComplaints = await dbService.getComplaints();
    setComplaints(listComplaints);

    const listRequests = await dbService.getRequests();
    setRequests(listRequests);
  };

  useEffect(() => {
    loadAdminData();
    window.addEventListener('storage', loadAdminData);
    return () => window.removeEventListener('storage', loadAdminData);
  }, []);

  const handleToggleVerifyProvider = async (provider: UserProfile) => {
    try {
      const updated: UserProfile = {
        ...provider,
        isVerified: !provider.isVerified
      };
      await dbService.saveUser(updated);
      await loadAdminData();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تعديل حالة الفني.");
    }
  };

  const handleResolveComplaint = async (id: string, currentStatus: Complaint['status']) => {
    const nextStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    try {
      await dbService.updateComplaintStatus(id, nextStatus as any);
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء تصفية الشكوى.");
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle || !newAdImageUrl) {
      alert("الرجاء تعبئة بيانات الإعلان بالكامل.");
      return;
    }
    setAdSubmitting(true);
    try {
      const newAd: AdBanner = {
        id: "ad_" + Math.random().toString(36).substring(2, 9),
        title: newAdTitle,
        imageUrl: newAdImageUrl,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await dbService.saveAd(newAd);
      setNewAdTitle('');
      setNewAdImageUrl('');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      alert("وقع خطأ أثناء حفظ الإعلان الجديد.");
    } finally {
      setAdSubmitting(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذا البانر الترويجي نهائياً؟")) {
      try {
        await dbService.deleteAd(adId);
        await loadAdminData();
      } catch (err) {
        console.error(err);
        alert("فشل حذف الإعلان.");
      }
    }
  };

  // Statistic calculations
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalProviders = users.filter(u => u.role === 'provider').length;
  const totalRequestsCount = requests.length;
  const completedRequests = requests.filter(r => r.status === 'completed');
  const totalFinancials = completedRequests.reduce((sum, r) => sum + r.price, 0);
  const totalCommissionEarned = completedRequests.reduce((sum, r) => sum + r.commission, 0);

  return (
    <div id="admin-panel-screen" style={{ direction: 'rtl' }} className="space-y-5 px-5 pb-20 select-none">
      
      {/* Upper header */}
      <div className="pt-4 text-right">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="p-1 px-2.5 bg-amber-400 text-sky-950 text-[10px] font-bold rounded-lg leading-normal">لوحة المدير</span>
          لوحة الإدارة والميزانية
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold">تحكم كامل وسيطرة شاملة على الأعضاء، الإعلانات والعمولات</p>
      </div>

      {/* Tabs list navigation */}
      <div className="flex bg-slate-100 rounded-2xl p-1 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveSegment('stats')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSegment === 'stats' ? 'bg-sky-950 text-white shadow-md' : 'hover:text-slate-800'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          الإحصائيات
        </button>
        <button
          onClick={() => setActiveSegment('users')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSegment === 'users' ? 'bg-sky-950 text-white shadow-md' : 'hover:text-slate-800'}`}
        >
          <Users className="w-3.5 h-3.5" />
          مقدمو الأعمال
        </button>
        <button
          onClick={() => setActiveSegment('complaints')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSegment === 'complaints' ? 'bg-sky-950 text-white shadow-md' : 'hover:text-slate-800'}`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" />
          الشكاوى
        </button>
        <button
          onClick={() => setActiveSegment('ads')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeSegment === 'ads' ? 'bg-sky-950 text-white shadow-md' : 'hover:text-slate-800'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          الإعلانات
        </button>
      </div>

      {/* SEGMENT 1: GENERAL METRICS DASHBOARD */}
      {activeSegment === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-100 p-3.5 rounded-2xl text-right">
              <span className="text-[8px] text-slate-400 font-bold block mb-1">العملاء النشطون</span>
              <strong className="text-lg font-black text-slate-800 font-mono">{totalCustomers + 6} مقيم</strong>
            </div>

            <div className="bg-white border border-slate-100 p-3.5 rounded-2xl text-right">
              <span className="text-[8px] text-slate-400 font-bold block mb-1">الفنيون المسجلون</span>
              <strong className="text-lg font-black text-teal-600 font-mono">{totalProviders} شريك</strong>
            </div>

            <div className="bg-white border border-slate-100 p-3.5 rounded-2xl text-right">
              <span className="text-[8px] text-slate-400 font-bold block mb-1">إجمالي طلبات الصيانة</span>
              <strong className="text-lg font-black text-slate-800 font-mono">{totalRequestsCount} طلب</strong>
            </div>

            <div className="bg-gradient-to-tr from-teal-50 to-emerald-50 border border-teal-100 p-3.5 rounded-2xl text-right">
              <span className="text-[8px] text-teal-900 font-bold block mb-1">أرباح منصة خدماتي (عمولة 10%)</span>
              <strong className="text-base font-black text-emerald-800 font-mono">{totalCommissionEarned} أوقية</strong>
            </div>
          </div>

          {/* Quick billing status box */}
          <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 flex gap-3 text-right">
            <DollarSign className="w-8 h-8 text-sky-800 bg-sky-100 rounded-xl p-1.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-sky-950">تتبع المعاملات والسيولة المالية لموريتانيا</h4>
              <p className="text-[9px] text-sky-800 leading-normal font-sans">
                إجمالي حجم التعاملات المفرزة عبر خدماتي حتى اللحظة بلغ <strong className="font-bold font-mono text-xs">{totalFinancials} أوقية مالي</strong>. تتوفر هذه السيولة للدفع للمهنيين بنجاح.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEGMENT 2: USER / PROVIDERS MANAGER (VERIFICATIONS BADGES) */}
      {activeSegment === 'users' && (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800 mb-1">التحكم بـ وتوثيق شركاء الخدمة</h4>
          
          <div className="space-y-3">
            {users.filter(u => u.role === 'provider').map((user) => (
              <div 
                key={user.id} 
                className="bg-white border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between text-right shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={user.avatarUrl} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{user.name}</h5>
                    <span className="text-[9px] text-slate-400 font-bold">{user.category} • هاتف: {user.phone}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleVerifyProvider(user)}
                  className={`py-1.5 px-3 rounded-lg text-[9px] font-extrabold flex items-center gap-1 transition-all ${user.isVerified ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                >
                  {user.isVerified ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      شريك موثّق
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      بانتظار التحقق
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEGMENT 3: COMPLAINTS REGISTER REVIEWER */}
      {activeSegment === 'complaints' && (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800">مراجعة وحل الشكاوى وتظلمات الشبكة</h4>

          <div className="space-y-3.5">
            {complaints.length === 0 ? (
              <div className="text-center py-8 bg-white border border-slate-100 rounded-2xl text-xs text-slate-400">
                لا توجد شكاوى أو بلاغات بانتظار المراجعة القانونية.
              </div>
            ) : (
              complaints.map((comp) => (
                <div 
                  key={comp.id} 
                  className={`p-4 border rounded-2xl bg-white space-y-2 text-right relative overflow-hidden shadow-xs ${comp.status === 'resolved' ? 'border-emerald-200' : 'border-slate-100'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800">{comp.userName}</span>
                    <span className={`py-0.5 px-2 text-[8px] font-extrabold rounded-md ${comp.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {comp.status === 'resolved' ? "محلولة" : "قيد المراجعة"}
                    </span>
                  </div>

                  <h5 className="text-[11px] font-bold text-sky-950">الموضوع: {comp.title}</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{comp.description}</p>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100/60 mt-1">
                    <span className="text-[8px] font-mono text-slate-400">بتاريخ: {new Date(comp.createdAt).toLocaleDateString()}</span>
                    
                    <button
                      onClick={() => handleResolveComplaint(comp.id, comp.status)}
                      className={`text-[9px] font-extrabold py-1 px-2.5 rounded-lg border transition ${comp.status === 'resolved' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-emerald-600 border-emerald-600 text-white'}`}
                    >
                      {comp.status === 'resolved' ? "إعادة فتح الشكوى" : "اعتماد حل الشكوى ✓"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SEGMENT 4: SLIDING ADVERTISEMENTS CREATOR */}
      {activeSegment === 'ads' && (
        <div className="space-y-4">
          {/* New Ad creator form */}
          <form onSubmit={handleAddAd} className="bg-white border border-slate-100 p-4 rounded-2xl space-y-3 text-right">
            <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5 pb-2 border-b border-slate-50">
              <Plus className="w-4 h-4 text-sky-600" />
              إضافة بانر إعلاني ترويجي جديد
            </h4>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500">نص البانر العريض (بالعربية)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                placeholder="خصم 20% على خدمات تمديد السباكة..."
                required
                value={newAdTitle}
                onChange={(e) => setNewAdTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500">رابط صورة الغلاف (Unsplash أو رابط ويب)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-left"
                style={{ direction: 'ltr' }}
                placeholder="https://images.unsplash.com/..."
                required
                value={newAdImageUrl}
                onChange={(e) => setNewAdImageUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={adSubmitting}
              className="w-full py-2 bg-sky-950 hover:bg-sky-900 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              {adSubmitting ? "جاري الإدخال..." : "تأكيد النشر الفوري للبانر"}
            </button>
          </form>

          {/* Active ads catalog list */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-slate-800">البانرات النشطة حالياً بالموقع ({ads.length})</h4>

            <div className="grid grid-cols-1 gap-2.5">
              {ads.map((ad) => (
                <div 
                  key={ad.id} 
                  className="bg-white border border-slate-100 p-2.5 rounded-2xl flex gap-3 text-right shadow-sm items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={ad.imageUrl} 
                      alt="Thumbnail Ad" 
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <p className="text-[10px] font-bold text-slate-700 line-clamp-2 min-w-0 font-sans leading-normal">
                      {ad.title}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
