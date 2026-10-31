"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ElementType,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  BookOpen,
  GraduationCap,
  Home,
  MessageCircle,
  Search,
  ShieldCheck,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type MenuItem = {
  icon: ElementType;

  text: string;

  href?: string;

  showUnreadBadge?: boolean;
};

/*
 * =========================================================
 * MENU
 * =========================================================
 */

const menus: MenuItem[] = [
  {
    icon: Home,
    text: "หน้าหลัก",
    href: "/account",
  },

  {
    icon: Search,
    text: "ค้นหาทักษะ",
    href: "/skills",
  },

  {
    icon: BookOpen,
    text: "หมวดหมู่ทักษะ",
    href: "/categories",
  },

  {
    icon: GraduationCap,
    text: "การเรียนของฉัน",
    href: "/learning",
  },

  {
    icon: Users,
    text: "การสอนของฉัน",
    href: "/teaching",
  },

  {
    icon: Wallet,
    text: "กระเป๋าเงิน (Wallet)",
    href: "/wallet",
  },

  {
    icon: ShieldCheck,
    text: "ธุรกรรม",
    href: "/transactions",
  },

  {
    icon: Trophy,
    text: "รางวัล & ภารกิจ",
    href: "/rewards",
  },

  {
    icon: MessageCircle,
    text: "ข้อความ",
    href: "/messages",
    showUnreadBadge: true,
  },

  {
    icon: User,
    text: "โปรไฟล์",
    href: "/profile",
  },
];

/*
 * =========================================================
 * SIDEBAR
 * =========================================================
 */

export default function Sidebar() {
  const pathname =
    usePathname();

  /*
   * =========================================================
   * REAL MESSAGE UNREAD
   * =========================================================
   */

  const [
    unreadMessages,
    setUnreadMessages,
  ] =
    useState(0);

  /*
   * =========================================================
   * LOAD UNREAD
   * =========================================================
   */

  const loadUnreadMessages =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/messages",
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          /*
           * ยังไม่ได้ Login
           *
           * ไม่ต้องแสดง Error
           */
          if (
            response.status ===
            401
          ) {
            setUnreadMessages(
              0
            );

            return;
          }

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok ||
            !data?.success
          ) {
            return;
          }

          setUnreadMessages(
            typeof data.totalUnread ===
              "number"
              ? data.totalUnread
              : 0
          );
        } catch (error) {
          /*
           * Sidebar ไม่ควรทำให้ทั้งหน้า Error
           * ถ้า API Message โหลดไม่ได้ชั่วคราว
           */

          console.error(
            "Load sidebar unread messages error:",
            error
          );
        }
      },
      []
    );

  /*
   * =========================================================
   * FIRST LOAD
   * =========================================================
   */

  useEffect(() => {
    void loadUnreadMessages();
  }, [
    loadUnreadMessages,
  ]);

  /*
   * =========================================================
   * POLLING
   * =========================================================
   *
   * เช็กข้อความใหม่ทุก 5 วินาที
   *
   * ไม่มี Badge ปลอม
   */
  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          void loadUnreadMessages();
        },
        5000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    loadUnreadMessages,
  ]);

  /*
   * =========================================================
   * ROUTE CHANGE REFRESH
   * =========================================================
   *
   * เวลาเปลี่ยนหน้า
   * เช่นเปิด /messages แล้วอ่านข้อความ
   *
   * ให้ Sidebar เช็กจำนวนใหม่ด้วย
   */
  useEffect(() => {
    void loadUnreadMessages();
  }, [
    pathname,
    loadUnreadMessages,
  ]);

  /*
   * =========================================================
   * ACTIVE MENU
   * =========================================================
   */

  function isActive(
    href?: string
  ) {
    if (!href) {
      return false;
    }

    /*
     * Dashboard
     */
    if (
      href ===
      "/account"
    ) {
      return (
        pathname ===
        "/account"
      );
    }

    /*
     * รองรับ Nested Routes
     *
     * /skills
     * /skills/...
     *
     * /categories
     * /categories/...
     *
     * /learning
     * /learning/...
     *
     * /teaching
     * /teaching/...
     *
     * /wallet
     * /wallet/...
     *
     * /transactions
     * /transactions/...
     *
     * /rewards
     * /rewards/...
     *
     * /messages
     * /messages/...
     *
     * /profile
     * /profile/...
     */
    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <aside
      className="
        hidden
        min-h-screen
        w-[260px]
        flex-col
        border-r
        border-white/10
        bg-[#070d20]
        p-5
        lg:flex
      "
    >
      {/* ========================================= */}
      {/* LOGO */}
      {/* ========================================= */}

      <Link
        href="/account"
        className="
          mb-10
          block
        "
      >
        <h1
          className="
            text-3xl
            font-bold
          "
        >
          Skill

          <span
            className="
              text-violet-500
            "
          >
            Chain
          </span>
        </h1>

        <p
          className="
            mt-1
            text-xs
            text-slate-400
          "
        >
          Learn • Teach • Earn
        </p>
      </Link>

      {/* ========================================= */}
      {/* MENU */}
      {/* ========================================= */}

      <nav
        className="
          space-y-2
        "
      >
        {menus.map(
          (
            item
          ) => {
            const Icon =
              item.icon;

            const active =
              isActive(
                item.href
              );

            /*
             * =====================================
             * เมนูที่มีหน้าแล้ว
             * =====================================
             */

            if (
              item.href
            ) {
              return (
                <Link
                  key={
                    item.text
                  }
                  href={
                    item.href
                  }
                  className={`
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    px-4
                    py-3
                    transition

                    ${
                      active
                        ? `
                          bg-violet-600/30
                          text-white
                        `
                        : `
                          text-slate-400
                          hover:bg-white/5
                          hover:text-white
                        `
                    }
                  `}
                >
                  <Icon
                    size={20}
                    strokeWidth={
                      1.8
                    }
                  />

                  <span
                    className="
                      text-sm
                    "
                  >
                    {
                      item.text
                    }
                  </span>

                  {/* ================================= */}
                  {/* REAL UNREAD BADGE */}
                  {/* ================================= */}

                  {item.showUnreadBadge &&
                    unreadMessages >
                      0 && (
                      <span
                        className="
                          ml-auto
                          flex
                          min-h-5
                          min-w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          px-1.5
                          text-[10px]
                          font-bold
                          text-white
                        "
                      >
                        {unreadMessages >
                        99
                          ? "99+"
                          : unreadMessages}
                      </span>
                    )}
                </Link>
              );
            }

            /*
             * =====================================
             * เมนูที่ยังไม่มีหน้า
             * =====================================
             */

            return (
              <button
                key={
                  item.text
                }
                type="button"
                className="
                  flex
                  w-full
                  items-center
                  gap-4
                  rounded-xl
                  px-4
                  py-3
                  text-left
                  text-slate-400
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
              >
                <Icon
                  size={20}
                  strokeWidth={
                    1.8
                  }
                />

                <span
                  className="
                    text-sm
                  "
                >
                  {
                    item.text
                  }
                </span>
              </button>
            );
          }
        )}
      </nav>

      {/* ========================================= */}
      {/* BOTTOM CARD */}
      {/* ========================================= */}

      <div
        className="
          relative
          mt-auto
          overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-violet-900
          to-purple-600
          p-5
        "
      >
        <div
          className="
            absolute
            bottom-0
            right-0
            h-24
            w-24
            rounded-full
            bg-white/20
            blur-2xl
          "
        />

        <h3
          className="
            relative
            text-xl
            font-bold
          "
        >
          ยังสอน
          <br />
          ยังได้รับ
        </h3>

        <p
          className="
            relative
            mt-2
            text-sm
            text-white/70
          "
        >
          แชร์ความรู้
          <br />
          สร้างรายได้ด้วย SKT
        </p>

        <Link
          href="/teaching"
          className="
            relative
            mt-5
            inline-flex
            rounded-full
            bg-white
            px-5
            py-2
            font-bold
            text-violet-700
            transition
            hover:bg-violet-50
          "
        >
          เริ่มสอนเลย
        </Link>
      </div>

      {/* ========================================= */}
      {/* VERSION */}
      {/* ========================================= */}

      <p
        className="
          mt-5
          text-xs
          text-slate-500
        "
      >
        SkillChain v1.0.0
      </p>
    </aside>
  );
}