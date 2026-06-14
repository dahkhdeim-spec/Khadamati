/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { UserProfile } from '../types';
import { Search as SearchIcon, Filter, MapPin, Star, ShieldCheck, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface SearchScreenProps {
  initialSearchQuery: string;
  onNavigate: (screen: string, extra?: any) => void;
  onUpdateQuery: (query: string) => void;
}

const MAURITANIAN_ZONES = [
  "الكل",
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

const CATEGORIES = [
  "الكل",
  "الكهرباء",
  "السباكة",
  "البناء",
  "النجارة",
  "التنظيف",
  "النقل",
  "التدريس الخصوصي",
  "التصميم والجرافيك",
  "البرمجة",
  "خدمات أخرى"
];

export default function SearchScreen({ initialSearchQuery, onNavigate, onUpdateQuery }: SearchScreenProps) {
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [filterCategory, setFilterCategory] = useState("الكل");
  const [filterZone, setFilterZone] = useState("الكل");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Sync internal state with external context trigger
  useEffect(() => {
    if (initialSearchQuery) {
      if (CATEGORIES.includes(initialSearchQuery)) {
        setFilterCategory(initialSearchQuery);
      } else {
        setSearchText(initialSearchQuery);
      }
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    const fetchAndFilter = async () => {
      const all = await dbService.getUsers();
      let matched = all.filter(u => u.role === 'provider');

      // 1. Text filter
      if (searchText.trim() !== '') {
        const queryNorm = searchText.toLowerCase();
        matched = matched.filter(p => 
          p.name.toLowerCase().includes(queryNorm) ||
          p.bio?.toLowerCase().includes(queryNorm) ||
          p.category?.toLowerCase().includes(queryNorm) ||
          p.skills?.some(s => s.toLowerCase().includes(queryNorm))
        );
      }

      // 2. Category filter
      if (filterCategory !== "الكل") {
        matched = matched.filter(p => p.category === filterCategory);
      }

      // 3. Location filter
      if (filterZone !== "الكل") {
        matched = matched.filter(p => p.location?.name === filterZone);
      }

      // 4. Sort calculations
      if (sortBy === 'rating') {
        matched.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === 'experience') {
        const getExpVal = (str?: string) => parseInt(str || '0', 10) || 0;
        matched.sort((a, b) => getExpVal(b.experience) - getExpVal(a.experience));
      } else if (sortBy === 'name') {
        matched.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      }

      setProviders(matched);
    };

    fetchAndFilter();
  }, [searchText, filterCategory, filterZone, sortBy]);

  const resetFilters = () => {
    setSearchText('');
    setFilterCategory('الكل');
    setFilterZone('الكل');
    setSortBy('rating');
    onUpdateQuery('');
  };

  return (
    <div id="search-filter-screen" style={{ direction: 'rtl' }} className="space-y-4 px-5 pb-20 select-none">
      {/* Search Header */}
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => onNavigate('home')}
          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-sky-950">البحث الذكي والتصفية</h2>
          <p className="text-[10px] text-slate-400 font-semibold">توصيل سلس مع الفني الأمثل في موريتانيا</p>
        </div>
      </div>

      {/* Primary Search Container with Toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative shadow-sm rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <input 
            type="text"
            className="w-full pr-10 pl-4 py-3 text-xs text-slate-800 placeholder-slate-400 font-sans focus:outline-none"
            placeholder="ابحث بـ الاسم، المهارات، أو الكلمة..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <SearchIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 bg-white border rounded-2xl flex items-center justify-center transition active:scale-95 shadow-sm ${showFilters ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-100 text-slate-600 hover:bg-slate-50'}`}
        >
          <Filter className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Expandable Advanced Filters Drawer UI */}
      {showFilters && (
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xl space-y-4 text-right">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              أدوات التصفية المتقدمة
            </span>
            <button 
              onClick={resetFilters} 
              className="text-[10px] text-red-500 font-extrabold hover:underline"
            >
              إعادة تهيئة
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500">التصنيف الفني</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500">البلدية أو المقاطعة</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none"
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
              >
                {MAURITANIAN_ZONES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 block">ترتيب النتائج معيارياً</label>
            <div className="flex gap-2">
              {['rating', 'experience', 'name'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSortBy(type as any)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition ${sortBy === type ? 'bg-sky-950 border-sky-950 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {type === 'rating' && '⭐ أعلى تقييم'}
                  {type === 'experience' && '💼 الأكثر خبرة'}
                  {type === 'name' && '📝 ترتيب هجائي'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Title count */}
      <div className="flex justify-between items-center px-1 py-1">
        <span className="text-xs font-bold text-slate-600 font-sans">
          وجدنا <strong className="text-sky-600 font-extrabold">{providers.length}</strong> مزود خدمة متصل
        </span>
        {sortBy === 'rating' && (
          <span className="text-[10px] text-slate-400 font-semibold">مرتب ذكياً حسب الأعلى تقييم</span>
        )}
      </div>

      {/* Results List Cards */}
      <div className="space-y-3.5">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
            <h4 className="text-sm font-black text-slate-700">لم نعثر على أي فني متاح!</h4>
            <p className="text-[10px] text-slate-400 max-w-[220px]">
              جرب تغيير كلمات البحث، معايير التصفية، أو تحديد موقع مختلف للوصول إلى المهنيين.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 py-2 px-4 bg-sky-950 text-white rounded-xl text-[10px] font-bold"
            >
              بحث في كل مقدمي الخدمات
            </button>
          </div>
        ) : (
          providers.map((prov) => (
            <div
              key={prov.id}
              onClick={() => onNavigate('provider_detail', prov)}
              className="bg-white border border-slate-100 rounded-3xl p-4 flex gap-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer rounded-l-none"
            >
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img 
                  src={prov.avatarUrl} 
                  alt={prov.name} 
                  className="w-full h-full object-cover"
                />
                {prov.isVerified && (
                  <span className="absolute bottom-0 right-0 py-0.5 px-1.5 bg-sky-950 text-[7px] font-bold text-white rounded-tr-md">
                    مُرخّص
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0 text-right">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 truncate leading-none">
                    {prov.name}
                  </h4>
                  <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold font-mono">{prov.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-600 block">{prov.category}</span>
                  <span>•</span>
                  <span>{prov.experience}</span>
                </div>

                <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal font-medium">
                  {prov.bio}
                </p>

                <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400">
                  <div className="flex items-center gap-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{prov.location?.name}</span>
                  </div>
                  {prov.isVerified ? (
                    <span className="text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">نشط الآن</span>
                  ) : (
                    <span className="text-amber-600 bg-amber-50 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">غير مفعّل</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
