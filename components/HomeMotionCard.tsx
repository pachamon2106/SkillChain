"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function HomeMotionCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      /*
       * Animation ตอนเปิดหน้าเท่านั้น
       *
       * ไม่มี:
       * - rotateX
       * - rotateY
       * - mouse tracking
       * - hover scale
       *
       * ดังนั้นการ์ดจะนิ่งตลอด
       */
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className="
        relative
      "
    >
      {/* Outer Glow */}
      <div
        className="
          pointer-events-none
          absolute
          -inset-2
          rounded-[36px]
          bg-gradient-to-r
          from-violet-500/30
          via-fuchsia-500/20
          to-violet-500/30
          blur-2xl
          opacity-60
        "
      />

      {/* Main Card Container */}
      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-slate-800
          bg-slate-900/60
          shadow-2xl
          shadow-violet-950/30
        "
      >
        {children}
      </div>
    </motion.div>
  );
}