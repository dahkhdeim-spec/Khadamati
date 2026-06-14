/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Flame, Wrench, Sparkles } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2800); // Elegant 2.8s entrance fade
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      id="splash-screen"
      style={{ direction: 'rtl' }}
      className="flex flex-col items-center justify-center min-h-[580px] h-full w-full bg-gradient-to-tr from-slate-900 via-sky-950 to-slate-900 text-white relative overflow-hidden px-6"
    >
      {/* Decorative Traditional Arabic Vector Meshes / Ornaments (SVG) Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
          <circle cx="50" cy="50" r="10" stroke="currentColor" fill="none" strokeWidth="2" />
        </svg>
      </div>

      <div className="absolute top-10 flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-sky-200">صنع في موريتانيا 🇲🇷</span>
      </div>

      {/* Main Logo Sphere */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center justify-center"
      >
        <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-b from-sky-400 to-blue-600 flex items-center justify-center shadow-2xl relative">
          {/* Inner Golden Ring */}
          <div className="absolute inset-2.5 rounded-2xl border-2 border-dashed border-amber-300 opacity-40 animate-spin" style={{ animationDuration: '20s' }}></div>
          <Wrench className="w-12 h-12 text-white relative z-10" />
        </div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl font-extrabold tracking-tight text-white font-sans text-center drop-shadow-lg"
        >
          خَدَماتِي
        </motion.h1>

        <motion.p 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 0.8 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-3 text-sm text-sky-200 text-center font-medium font-sans px-4 max-w-sm"
        >
          الربط الأمثل والأسهل بين مقدمي الخدمات والعملاء في موريتانيا
        </motion.p>
      </motion.div>

      {/* Loading Bar Slider */}
      <div className="absolute bottom-20 left-12 right-12 max-w-xs mx-auto">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.3, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400"
          ></motion.div>
        </div>
        <div className="flex justify-between mt-2.5 text-[10px] text-sky-300 font-mono">
          <span>جاري التحميل...</span>
          <span>١٠٠٪</span>
        </div>
      </div>

      <div className="absolute bottom-6 text-center">
        <div className="text-[11px] text-white/50 flex items-center justify-center gap-1.5 font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>تشفير آمن وضمان كامل بالنزاهة</span>
        </div>
      </div>
    </div>
  );
}
