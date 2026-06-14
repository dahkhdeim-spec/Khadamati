/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { UserProfile, AdBanner } from '../types';
import { Search, ChevronLeft, Star, ShieldCheck, MapPin, Sparkles, Sliders, Bell } from 'lucide-react';

interface HomeProps {
  currentUser: UserProfile;
  onNavigate: (screen: string, extra?: any) => void;
  onSearchQuery: (query: string) => void;
}

export default function Home({ currentUser, onNavigate, onSearchQuery }: HomeProps) {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [quickSearchText, setQuickSearchText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load Ads & Providers
    const load = async () => {
      const activeAds = await dbService.getAds();
      setAds(activeAds.filter(a => a.isActive));

      const u = await dbService.getUsers();
      // Filter verified service providers
      setProviders(u.filter(user => user.role === 'provider' && user.isVerified));

      // Load notification count
      const notifs = await dbService.getNotifications(currentUser.id);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    };
    load();

    // Re-verify on storage edits
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [currentUser]);

  // Infinite slider loop for Advertisements
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % ads.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [ads]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchQuery(quickSearchText);
    onNavigate('search');
  };

  const CATEGORY_ICONS: Record<string, string> = {
    "الكهرباء": "⚡",
    "السباكة": "🔧",
    "البناء": "🧱",
    "النجارة": "🪚",
    "التنظيف": "🧹",
    "النقل": "🚚",
    "التدريس الخصوصي": "📚",
    "التصميم والجرافيك": "🎨",
    "البرمجة": "💻",
    "خدمات أخرى": "✨"
  };

  return (
    <div id="home-screen" style={{ direction: 'rtl' }} className="space-y-6 pb-20 select-none">
      {/* Upper Brand Info Panel */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={currentUser.avatarUrl} 
              alt="Avatar" 
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-sky-950/10 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.name}`;
              }}
            />
            {currentUser.role === 'admin' && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">مدير</span>
            )}
            {currentUser.role === 'provider' && (
              <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">فني</span>
            )}
          </div>
          <div>
            <h3 className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">مرحباً بك</h3>
            <h2 className="text-sm font-black text-sky-950">{currentUser.name}</h2>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('notifications')}
          className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center relative hover:bg-slate-50 transition active:scale-95"
        >
          <Bell className="w-4.5 h-4.5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 ring-2 ring-white text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Uber-like Floating Search Box */}
      <div className="px-5">
        <form onSubmit={handleQuickSubmit} className="relative shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-white">
          <input 
            type="text"
            className="w-full pr-11 pl-12 py-3.5 text-xs text-slate-800 placeholder-slate-400 font-medium font-sans focus:outline-none"
            placeholder="ابحث عن كهربائي، سباك، معلم، مبرمج..."
            value={quickSearchText}
            onChange={(e) => setQuickSearchText(e.target.value)}
          />
          <Search className="absolute right-4 top-4 w-4.5 h-4.5 text-slate-400" />
          <button 
            type="submit"
            className="absolute left-2.5 top-2 py-2 px-3 bg-sky-950 hover:bg-sky-900 font-bold text-white text-[10px] rounded-xl transition"
          >
            بحث فوري
          </button>
        </form>
      </div>

      {/* Control Banner Display Slide */}
      {ads.length > 0 && (
        <div className="px-5">
          <div className="relative h-32 rounded-2xl overflow-hidden shadow-md bg-slate-900 group">
            <img 
              src={ads[activeAdIndex].imageUrl} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-80"
            />
            {/* Dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent"></div>
            
            <div className="absolute inset-x-4 bottom-3 text-right">
              <span className="inline-block px-1.5 py-0.5 bg-amber-400 text-sky-950 text-[8px] font-bold rounded-md mb-1.5">إعلان ترويجي</span>
              <p className="text-xs font-bold text-white leading-relaxed">{ads[activeAdIndex].title}</p>
            </div>

            {/* Pagination indicator dots */}
            {ads.length > 1 && (
              <div className="absolute left-4 top-3 flex gap-1">
                {ads.map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeAdIndex ? 'bg-amber-400 w-3' : 'bg-white/40'}`}
                  ></span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Swipe categories slider card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-5">
          <h3 className="text-xs font-black text-sky-950">تصفح الخدمات حسب التصنيف</h3>
          <button 
            onClick={() => onNavigate('categories')} 
            className="text-[10px] text-sky-600 font-extrabold flex items-center gap-0.5 hover:underline"
          >
            رؤية الكل
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-none flex gap-3.5 px-5 py-2">
          {Object.keys(CATEGORY_ICONS).map((catName) => (
            <button
              key={catName}
              onClick={() => {
                onSearchQuery(catName);
                onNavigate('search');
              }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-sky-500/30 hover:bg-sky-50/50 transition active:scale-95"
            >
              <span className="text-lg">{CATEGORY_ICONS[catName]}</span>
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{catName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Micro-Featured / Highlight card for Mauritania */}
      <div className="px-5">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-teal-950">فنيو خدماتي الموثوقون 🇲🇷</span>
            </div>
            <p className="text-[10px] text-teal-800 leading-relaxed font-sans">
              تم التحقق من هويات الفنيين والتحصيل الأكاديمي، لضمان صيانة موثوقة ونزيهة داخل نواكشوط ونواذيبو.
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-800">
            ⭐
          </div>
        </div>
      </div>

      {/* List of Verified Premium Providers */}
      <div className="space-y-3.5 px-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            أفضل مقدمي الخدمات الموثقين
          </h3>
          <button 
            onClick={() => {
              onSearchQuery('');
              onNavigate('search');
            }} 
            className="text-[10px] text-sky-600 font-extrabold flex items-center gap-0.5 hover:underline"
          >
            تصفح الشركاء
          </button>
        </div>

        <div className="space-y-3">
          {providers.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              لا يوجد مقدمي خدمات موثقين متصلين بالمنصة حالياً.
            </div>
          ) : (
            providers.map((prov) => (
              <div 
                key={prov.id}
                onClick={() => onNavigate('provider_detail', prov)}
                className="bg-white border border-slate-100 rounded-2xl p-3.5 flex gap-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group rounded-l-none"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img 
                    src={prov.avatarUrl} 
                    alt={prov.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/pixel-art/svg";
                    }}
                  />
                  <span className="absolute bottom-0 right-0 py-0.5 px-1 bg-sky-950 text-[7px] font-bold text-white uppercase rounded-tl-md">
                    {CATEGORY_ICONS[prov.category || ''] || '🛠️'}
                  </span>
                </div>

                <div className="flex-1 space-y-1 text-right min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                        {prov.name}
                      </h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-0.5 flex-shrink-0 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold font-mono">{prov.rating}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold truncate">
                    {prov.category} • {prov.experience}
                  </p>

                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {prov.bio}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 text-[9px] text-slate-400">
                    <div className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span className="truncate max-w-[120px]">{prov.location?.name}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 font-bold rounded-full">حجز فوري</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
