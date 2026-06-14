/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService } from '../firebase';
import { AppNotification, UserProfile } from '../types';
import { Bell, ChevronRight, Check, Trash2, MailCheck, ShieldCheck } from 'lucide-react';

interface NotificationsScreenProps {
  currentUser: UserProfile;
  onNavigate: (screen: string) => void;
}

export default function NotificationsScreen({ currentUser, onNavigate }: NotificationsScreenProps) {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    const list = await dbService.getNotifications(currentUser.id);
    setNotifs(list);
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('storage', loadNotifications);
    return () => window.removeEventListener('storage', loadNotifications);
  }, [currentUser]);

  const handleClearNotifications = async () => {
    localStorage.setItem("khadamaty_notifications", JSON.stringify([]));
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await dbService.markAllNotificationsRead(currentUser.id);
    await loadNotifications();
  };

  return (
    <div id="notifications-screen" style={{ direction: 'rtl' }} className="space-y-4 px-5 pb-20 select-none">
      
      {/* Header with Back */}
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => onNavigate('home')}
          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-grow text-right">
          <h2 className="text-lg font-black text-sky-950">صندوق الإشعارات والرسائل</h2>
          <p className="text-[10px] text-slate-400 font-semibold">تنبيهات فورية لتتبع حجوزاتك وصيانتك المجدولة</p>
        </div>
      </div>

      <div className="flex justify-between items-center py-2 px-1">
        <button
          onClick={handleMarkAllRead}
          disabled={notifs.length === 0}
          className="text-[10px] text-sky-600 font-extrabold flex items-center gap-1 hover:underline disabled:opacity-40"
        >
          <MailCheck className="w-3.5 h-3.5" />
          تحديد المقروء ✓
        </button>

        <button
          onClick={handleClearNotifications}
          disabled={notifs.length === 0}
          className="text-[10px] text-red-500 font-bold flex items-center gap-1 hover:underline disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          حذف كافة الإشعارات
        </button>
      </div>

      {/* Notifications feed logs */}
      <div className="space-y-3 pt-1">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              🔔
            </div>
            <h4 className="text-xs font-black text-slate-700">صندوق الإشعارات فارغ!</h4>
            <p className="text-[9px] text-slate-400 max-w-[200px]">
              عند حجز صيانة جديدة، أو عند تلقيك لرسائل دردشة من الفنيين، ستصلك تنبيهات فورية هنا.
            </p>
          </div>
        ) : (
          notifs.map((n) => (
            <div 
              key={n.id}
              className={`p-3.5 rounded-2xl border text-right transition flex gap-3 shadow-xs bg-white ${n.isRead ? 'border-slate-100 opacity-75' : 'border-sky-500/25 bg-sky-50/20'}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center text-base">
                {n.type === 'request' && '💼'}
                {n.type === 'chat' && '💬'}
                {n.type === 'system' && '🔔'}
              </div>

              <div className="flex-1 space-y-1 text-right min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 leading-none truncate">{n.title}</h4>
                  <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 animate-pulse"></div>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal font-medium">{n.body}</p>
                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 font-mono">
                  <span>بث فوري عبر خدماتي 🇲🇷</span>
                  <span>{new Date(n.createdAt).toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-gradient-to-r from-sky-950 to-slate-900 text-white rounded-2xl flex items-center gap-2.5 text-right">
        <ShieldCheck className="w-8 h-8 text-amber-400 flex-shrink-0" />
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-extrabold text-amber-300">خدمة تتبع الإشعارات آمنة بالكامل</h4>
          <p className="text-[8px] text-sky-200 font-sans">
            تتم الحماية وتتبع الإشعارات عبر بروتوكولات مشفرة تضمن وصول المواعيد دون أي تشويش.
          </p>
        </div>
      </div>
    </div>
  );
}
