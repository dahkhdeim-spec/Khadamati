/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbService } from '../firebase';
import { UserProfile } from '../types';
import { Edit2, ShieldCheck, Mail, Phone, MapPin, Award, Star, Sun, Moon, LogOut, Check, Save } from 'lucide-react';

interface ProfileProps {
  currentUser: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

export default function Profile({ currentUser, darkMode, onToggleDarkMode, onLogout, onUpdateUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Form fields
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [skills, setSkills] = useState(currentUser.skills?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];
      const updated: UserProfile = {
        ...currentUser,
        name,
        phone,
        bio,
        skills: skillsArray
      };

      await dbService.saveUser(updated);
      onUpdateUser(updated);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("فشل تحديث بيانات الملف الشخصي.");
    } finally {
      setSaving(false);
    }
  };

  // Simulated Analytics (Monthly job completions & revenue diagram)
  const MONTHLY_ANALYTICS = [
    { month: "يناير", jobs: 4, revenue: 6500 },
    { month: "فبراير", jobs: 7, revenue: 11200 },
    { month: "مارس", jobs: 9, revenue: 14500 },
    { month: "أبريل", jobs: 12, revenue: 19800 },
    { month: "مايو", jobs: 15, revenue: 24500 },
    { month: "يونيو", jobs: currentUser.role === 'provider' ? 18 : 2, revenue: currentUser.role === 'provider' ? (currentUser.earnings || 24500) : 3200 }
  ];

  const maxVal = Math.max(...MONTHLY_ANALYTICS.map(m => m.revenue));

  return (
    <div id="profile-screen" style={{ direction: 'rtl' }} className="space-y-6 px-5 pb-20 select-none">
      
      {/* Upper header with Logout */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="text-lg font-black text-sky-950 dark:text-white">حسابي الشخصي</h2>
          <p className="text-[10px] text-slate-400 font-semibold">إدارة الضوابط والخصوصية والملف والترقيات الإلكترونية</p>
        </div>

        <button 
          onClick={onLogout}
          className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center text-red-600 active:scale-95 transition shadow-xs"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Main visual Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
        
        {/* Toggle Theme inline switcher */}
        <button
          onClick={onToggleDarkMode}
          className="absolute left-4 top-4 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <div className="flex items-center gap-4 text-right">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.name} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">{currentUser.name}</h3>
              {currentUser.role === 'provider' && currentUser.isVerified && (
                <ShieldCheck className="w-4.5 h-4.5 text-sky-500" />
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold">
              {currentUser.role === 'customer' && 'عميل / طالب خدمات صيانة'}
              {currentUser.role === 'provider' && `فني معتمد • قسم ${currentUser.category}`}
              {currentUser.role === 'admin' && 'مدير عام المنصة 👑'}
            </p>

            <span className="inline-block text-[9px] font-mono text-slate-400">
              عضو منذ: {new Date(currentUser.createdAt).toLocaleDateString('ar-MR')}
            </span>
          </div>
        </div>

        {currentUser.role === 'provider' && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-sky-50/50 dark:bg-slate-800/40 p-3 rounded-2xl text-right">
              <span className="text-[9px] text-slate-400 font-bold block">إجمالي الأرباح المستلمة</span>
              <span className="text-xs font-black text-sky-700 dark:text-sky-300 font-mono">
                {currentUser.earnings || 0} أوقية MRU
              </span>
            </div>

            <div className="bg-amber-50/50 dark:bg-slate-800/40 p-3 rounded-2xl text-right">
              <span className="text-[9px] text-slate-400 font-bold block">متوسط تقييمك</span>
              <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-black font-mono">{currentUser.rating || 5.0} / 5</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Forms Edit or static details view */}
      {!isEditing ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 text-right">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-sky-950 dark:text-white">البيانات الفنية والاتصال</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-sky-600 font-extrabold flex items-center gap-1 hover:underline"
              >
                <Edit2 className="w-3 h-3" />
                تعديل البيانات
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-sky-600" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block">رقم للتواصل</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{currentUser.phone}</span>
                </div>
              </div>

              {currentUser.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">البريد الإلكتروني</span>
                    <span className="font-mono text-slate-800 dark:text-white">{currentUser.email}</span>
                  </div>
                </div>
              )}

              {currentUser.role === 'provider' && (
                <>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">مقر العمل الرئيسي</span>
                      <span className="font-bold text-slate-800 dark:text-white">{currentUser.location?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">الخبرة المهنية</span>
                      <span className="font-bold text-slate-800 dark:text-white">{currentUser.experience}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Inline SVG dynamic charts analytics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 text-right">
            <div>
              <h4 className="text-xs font-black text-sky-950 dark:text-white">
                {currentUser.role === 'provider' ? 'لوحة تتبع المداخيل وصافي المبيعات' : 'مؤشرات نشاط حسابي'}
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">مسار المداخيل والتحليلات البيانية بالأوقية</p>
            </div>

            {/* Render direct vector bars representing revenue */}
            <div className="pt-2 h-40 flex items-end gap-3 px-2 border-b border-slate-100 dark:border-slate-800">
              {MONTHLY_ANALYTICS.map((m, i) => {
                const pct = maxVal > 0 ? (m.revenue / maxVal) * 100 : 20;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Hover revenue label popup */}
                    <div className="bg-sky-950 text-white text-[8px] px-1 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition absolute -translate-y-16 font-mono">
                      {m.revenue}
                    </div>

                    <div 
                      style={{ height: `${pct * 0.7}%` }} 
                      className="w-full bg-sky-950 hover:bg-sky-600 rounded-t-lg transition-all duration-300 relative"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-amber-400 opacity-50 rounded-t-lg"></div>
                    </div>
                    
                    <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-950"></span>
                أداء الربح بالأوقية
              </span>
              <span>تحديث دوري نشط</span>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT PROFILE ONBOARDING FORM CLIENT SDK */
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-right">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-sky-950 dark:text-white">تعديل بيانات الحساب</h3>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[10px] text-slate-400 font-bold"
            >
              إلغاء
            </button>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border-r-4 border-emerald-500 rounded-xl text-emerald-800 text-xs flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              تم الحفظ بنجاح وتأمين الحساب!
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400">الاسم الكامل</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400">رقم الهاتف التواصل 🇲🇷</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {currentUser.role === 'provider' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 dark:text-slate-400">نبذة تعريفية مصغرة (Bio)</label>
                  <textarea
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 dark:text-slate-400">أبرز المهارات (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-2 py-3 bg-sky-950 dark:bg-sky-500 hover:bg-sky-900 font-extrabold text-white rounded-2xl text-xs flex justify-center items-center gap-1.5 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات الفنية'}
          </button>
        </form>
      )}
    </div>
  );
}
