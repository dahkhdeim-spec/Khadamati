/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { ChevronRight, Grid, User } from 'lucide-react';

interface CategoriesProps {
  onNavigate: (screen: string) => void;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES_DATA = [
  { name: "الكهرباء", emoji: "⚡", count: "12 فني", desc: "تمديدات، صيانة منزلية ومكيفات", color: "from-amber-500 to-yellow-500" },
  { name: "السباكة", emoji: "🔧", count: "8 فنيين", desc: "كشف التسربات، تمديد مياه وصرف صحي", color: "from-sky-500 to-blue-600" },
  { name: "البناء", emoji: "🧱", count: "15 فني", desc: "أعمال الصيانة العامة، الترميم والمقاولات", color: "from-emerald-500 to-teal-600" },
  { name: "النجارة", emoji: "🪚", count: "6 فنيين", desc: "تصميم غرف، ترميم أثاث وأبواب ونوافذ", color: "from-orange-500 to-amber-700" },
  { name: "التنظيف", emoji: "🧹", count: "11 فني", desc: "تنظيف منازل وشقق وتعقيم شامل", color: "from-pink-500 to-rose-600" },
  { name: "النقل", emoji: "🚚", count: "9 سائقين", desc: "شحن وتوصيل بضائع وأثاث منازل", color: "from-indigo-500 to-purple-600" },
  { name: "التدريس الخصوصي", emoji: "📚", count: "18 معلم", desc: "رياضيات، فيزياء، لغات وعلوم إسلامية", color: "from-red-500 to-orange-500" },
  { name: "التصميم والجرافيك", emoji: "🎨", count: "7 مصممين", desc: "شعارات، هويات بصرية، ومطبوعات فاخرة", color: "from-fuchsia-500 to-purple-700" },
  { name: "البرمجة", emoji: "💻", count: "5 مبرمجين", desc: "تطبيقات هواتف، مواقع إنترنت ومنصات ويب", color: "from-cyan-500 to-blue-500" },
  { name: "خدمات أخرى", emoji: "✨", count: "4 مرشدين", desc: "خدمات عامة استشارية وتطوير متنوع", color: "from-slate-500 to-slate-700" }
];

export default function Categories({ onNavigate, onSelectCategory }: CategoriesProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const allUsers = await dbService.getUsers();
      const mapping: Record<string, number> = {};
      allUsers.forEach(u => {
        if (u.role === 'provider' && u.category) {
          mapping[u.category] = (mapping[u.category] || 0) + 1;
        }
      });
      setCounts(mapping);
    };
    fetchCounts();
  }, []);

  return (
    <div id="categories-screen" style={{ direction: 'rtl' }} className="space-y-5 px-5 pb-20 select-none">
      {/* Header with back button */}
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => onNavigate('home')}
          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h2 className="text-lg font-black text-sky-950">تصنيفات الخدمات</h2>
          <p className="text-[10px] text-slate-400 font-semibold">اختر تصنيفاً للبحث عن الفني المناسب</p>
        </div>
      </div>

      {/* Grid of categories with statistics */}
      <div className="grid grid-cols-1 gap-3.5 pt-2">
        {CATEGORIES_DATA.map((cat) => {
          const actualCount = counts[cat.name] || 0;
          return (
            <div
              key={cat.name}
              onClick={() => {
                onSelectCategory(cat.name);
                onNavigate('search');
              }}
              className="group cursor-pointer bg-white border border-slate-100 p-4 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-sky-500/10 transition-all text-right duration-250"
            >
              <div className="flex items-center gap-4">
                {/* Visual Icon Badge */}
                <div className={`w-14 h-14 bg-gradient-to-r ${cat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-sky-950/5`}>
                  {cat.emoji}
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 font-sans">
                    {cat.name}
                  </h4>
                  <p className="text-[9px] text-slate-500 max-w-[200px] line-clamp-1 font-medium leading-normal">
                    {cat.desc}
                  </p>
                </div>
              </div>

              {/* Counts indicator bento */}
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {actualCount > 0 ? `${actualCount} فني نشط` : "جاهز للحجز"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold group-hover:translate-x-[-2px] transition-transform">
                  👈 تصفح
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
