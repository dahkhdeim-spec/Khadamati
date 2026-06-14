/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from './firebase';
import { UserProfile } from './types';

// Import modular components
import Splash from './components/Splash';
import Auth from './components/Auth';
import Home from './components/Home';
import Categories from './components/Categories';
import SearchScreen from './components/Search';
import ProviderDetail from './components/ProviderDetail';
import Requests from './components/Requests';
import Chats from './components/Chats';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import NotificationsScreen from './components/NotificationsScreen';

// Icons for navigation
import { Home as HomeIcon, Search as SearchIcon, ClipboardList, MessageSquareCode, User as UserIcon, ShieldAlert, Sparkles, Wifi, Battery, RotateCcw } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<string>('splash');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [localTime, setLocalTime] = useState<string>('');

  // Track dynamic clock matching Mauritanian local hour
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Format to HH:MM 24hr format
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setLocalTime(`${hrs}:${mins}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSplashFinish = () => {
    // Attempt auto login using persistent session
    const localUsers = JSON.parse(localStorage.getItem('khadamaty_users') || "[]");
    const adminUser = localUsers.find((u: any) => u.role === 'admin');
    
    if (adminUser) {
      setCurrentUser(adminUser);
      setScreen('home');
    } else {
      setScreen('auth');
    }
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setScreen('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProvider(null);
    setSearchQuery('');
    setActiveChatId(null);
    setScreen('auth');
  };

  const handleNavigate = (targetScreen: string, extraData?: any) => {
    if (targetScreen === 'provider_detail' && extraData) {
      setSelectedProvider(extraData);
    }
    if (targetScreen === 'chats' && typeof extraData === 'string') {
      setActiveChatId(extraData);
    }
    setScreen(targetScreen);
  };

  // Clean simulator resets (flushes localStorage back to pristine defaults)
  const handleResetSimulator = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Switch role profiles instantly to let reviewers play with different states instantly
  const handleQuickSwitchRole = async (targetRole: 'customer' | 'provider' | 'admin') => {
    const allUsers = await dbService.getUsers();
    const matched = allUsers.find(u => u.role === targetRole);
    if (matched) {
      setCurrentUser(matched);
      setSelectedProvider(null);
      setSearchQuery('');
      setScreen('home');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'} flex flex-col md:flex-row items-center justify-center p-0 md:p-8 font-sans transition-colors duration-300 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]`}>
      
      {/* ⚠️ Side Administrative Panel Drawer for Large Screens (Aesthetic Sandbox Controls) */}
      <div className="hidden md:flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl text-right space-y-4 self-start mr-8">
        <div>
          <span className="text-[9px] font-extrabold uppercase py-1 px-2.5 bg-amber-400 text-sky-950 rounded-md">مساعد المطور 🛠️</span>
          <h3 className="text-sm font-black text-sky-950 dark:text-white mt-1.5">لوحة التحكم التجريبي</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">قاعدة بيانات سحابية Firebase متصلة بتبادلية مرنة ومحاكاة فورية.</p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-500 block">تبديل الأدوار فوراً للمعاينة والتجربة:</span>
          
          <button
            onClick={() => handleQuickSwitchRole('customer')}
            disabled={!currentUser}
            className={`w-full py-2.5 px-3 text-right text-xs font-bold rounded-xl transition flex items-center justify-between border ${currentUser?.role === 'customer' ? 'bg-sky-50 dark:bg-sky-950 border-sky-400 text-sky-700 dark:text-sky-300' : 'bg-slate-50 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100'}`}
          >
            <span>👤 عميل (شراء وتقييم)</span>
            {currentUser?.role === 'customer' && <span className="text-[9px]">نشط</span>}
          </button>

          <button
            onClick={() => handleQuickSwitchRole('provider')}
            disabled={!currentUser}
            className={`w-full py-2.5 px-3 text-right text-xs font-bold rounded-xl transition flex items-center justify-between border ${currentUser?.role === 'provider' ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-400 text-teal-800 dark:text-teal-300' : 'bg-slate-50 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100'}`}
          >
            <span>🛠️ فني (قبول ومتابعة أرباح)</span>
            {currentUser?.role === 'provider' && <span className="text-[9px]">نشط</span>}
          </button>

          <button
            onClick={() => handleQuickSwitchRole('admin')}
            disabled={!currentUser}
            className={`w-full py-2.5 px-3 text-right text-xs font-bold rounded-xl transition flex items-center justify-between border ${currentUser?.role === 'admin' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300' : 'bg-slate-50 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100'}`}
          >
            <span>👑 مدير (إعلانات وشكاوى وشخصيات)</span>
            {currentUser?.role === 'admin' && <span className="text-[9px]">نشط</span>}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={handleResetSimulator}
            className="w-full py-2.5 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-xl transition flex items-center justify-between border border-red-200/30"
          >
            <span>إعادة تهيئة البيانات الافتراضية</span>
            <RotateCcw className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-500 leading-relaxed rounded-2xl">
          💡 يمكنك النقر على <strong>لوحة التحكم التجريبي</strong> للانتقال الفوري بين حسابات العميل، الفني، المعتمد والمدير دون الحاجة للتسجيل المتكرر.
        </div>
      </div>

      {/* 📱 CORE DEVICE SMARTPHONE CONTAINER WRAPPER */}
      <div className="w-full md:max-w-md bg-white dark:bg-slate-900 md:rounded-[3rem] md:ring-[14px] md:ring-slate-950 relative md:shadow-2xl overflow-hidden min-h-screen md:min-h-[780px] md:h-[780px] flex flex-col justify-between border border-transparent md:border-slate-800 flex-shrink-0 animate-fade-in text-slate-900 dark:text-slate-150">
        
        {/* Device Premium Top Status Bar Decoration */}
        <div className="hidden md:flex justify-between items-center px-6 py-2 pb-1.5 bg-slate-950 text-white font-sans text-[10px] font-bold z-50 select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-mono">{localTime}</span>
          </div>

          {/* Dumb front Camera Notch segment */}
          <div className="w-24 h-4.5 bg-slate-950 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>

          <div className="flex items-center gap-1.5 font-sans">
            <span className="text-[8px] font-bold">Mauritel 4G+</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <Battery className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Dynamic active screens */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen + (selectedProvider?.id || '')}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22 }}
              className="h-full"
            >
              {screen === 'splash' && <Splash onFinish={handleSplashFinish} />}
              {screen === 'auth' && <Auth onAuthSuccess={handleAuthSuccess} />}
              {screen === 'home' && currentUser && (
                <Home 
                  currentUser={currentUser} 
                  onNavigate={handleNavigate}
                  onSearchQuery={setSearchQuery} 
                />
              )}
              {screen === 'categories' && (
                <Categories 
                  onNavigate={handleNavigate} 
                  onSelectCategory={setSearchQuery} 
                />
              )}
              {screen === 'search' && (
                <SearchScreen 
                  initialSearchQuery={searchQuery}
                  onNavigate={handleNavigate}
                  onUpdateQuery={setSearchQuery}
                />
              )}
              {screen === 'provider_detail' && selectedProvider && currentUser && (
                <ProviderDetail 
                  provider={selectedProvider} 
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                  onStartChatThread={setActiveChatId}
                />
              )}
              {screen === 'orders' && currentUser && (
                <Requests 
                  currentUser={currentUser} 
                  onNavigate={handleNavigate} 
                />
              )}
              {screen === 'chats' && currentUser && (
                <Chats 
                  currentUser={currentUser} 
                  initialSelectedChatId={activeChatId}
                  onClearSelectedChat={() => setActiveChatId(null)}
                />
              )}
              {screen === 'notifications' && currentUser && (
                <NotificationsScreen 
                  currentUser={currentUser} 
                  onNavigate={handleNavigate} 
                />
              )}
              {screen === 'profile' && currentUser && (
                <Profile 
                  currentUser={currentUser}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  onLogout={handleLogout}
                  onUpdateUser={(updated) => setCurrentUser(updated)}
                />
              )}
              {screen === 'admin' && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Smartphone Dynamic System Home Bar decoration */}
        <div className="hidden md:block absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/60 rounded-full z-50"></div>

        {/* 🧭 NATIVE TABS SYSTEM ACTION BAR */}
        {currentUser && screen !== 'splash' && screen !== 'auth' && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 py-2.5 px-4 flex justify-between items-center z-40 select-none shadow-lg max-w-sm mx-auto w-full">
            
            <button
              onClick={() => handleNavigate('home')}
              className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-colors ${screen === 'home' ? 'text-sky-950 dark:text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <HomeIcon className="w-4.5 h-4.5" />
              <span className="text-[8px] font-bold">الرئيسية</span>
            </button>

            <button
              onClick={() => {
                setSearchQuery('');
                handleNavigate('search');
              }}
              className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-colors ${screen === 'search' ? 'text-sky-950 dark:text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <SearchIcon className="w-4.5 h-4.5" />
              <span className="text-[8px] font-bold">البحث</span>
            </button>

            <button
              onClick={() => handleNavigate('orders')}
              className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-colors ${screen === 'orders' ? 'text-sky-950 dark:text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ClipboardList className="w-4.5 h-4.5" />
              <span className="text-[8px] font-bold">طلباتي</span>
            </button>

            <button
              onClick={() => handleNavigate('chats')}
              className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-colors ${screen === 'chats' ? 'text-sky-950 dark:text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <MessageSquareCode className="w-4.5 h-4.5" />
              <span className="text-[8px] font-bold">الدردشة</span>
            </button>

            <button
              onClick={() => handleNavigate('profile')}
              className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-colors ${screen === 'profile' ? 'text-sky-950 dark:text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <UserIcon className="w-4.5 h-4.5" />
              <span className="text-[8px] font-bold">حسابي</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => handleNavigate('admin')}
                className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-colors ${screen === 'admin' ? 'text-sky-950 dark:text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="text-[12px] filter grayscale-0">👑</span>
                <span className="text-[8px] font-bold">الإدارة</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
