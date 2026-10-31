import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  GraduationCap,
  BadgeDollarSign,
  ShieldCheck,
} from "lucide-react";

import HomeLogin from "@/components/HomeLogin";
import HomeMotionCard from "@/components/HomeMotionCard";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  /*
   * ============================================================
   * ตรวจสอบ Login Session
   * ============================================================
   *
   * ห้ามตรวจเพียงว่า Cookie มีอยู่หรือไม่
   *
   * ต้องตรวจต่อว่า:
   * 1. มี skillchain_session
   * 2. token นี้มีจริงใน Database
   * 3. Session ยังไม่หมดอายุ
   *
   * ถ้าผ่านทั้งหมดจึง redirect ไป /account
   */

  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get("skillchain_session")?.value ?? null;

  let hasValidSession = false;

  if (sessionToken) {
    try {
      const session = await prisma.session.findUnique({
        where: {
          token: sessionToken,
        },

        select: {
          id: true,
          expiresAt: true,
        },
      });

      if (
        session &&
        session.expiresAt.getTime() > Date.now()
      ) {
        hasValidSession = true;
      }
    } catch (error) {
      console.error(
        "Home session check error:",
        error
      );
    }
  }

  /*
   * ใช้ relative URL
   *
   * localhost:3000
   *   -> localhost:3000/account
   *
   * 192.168.x.x:3000
   *   -> 192.168.x.x:3000/account
   *
   * ไม่มีการ hardcode localhost
   */

  if (hasValidSession) {
    redirect("/account");
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#030617]
        px-4
        py-5
        text-white
        md:px-8
        md:py-6
      "
    >
      <div className="mx-auto max-w-[1280px]">

        {/* Header */}
        <div className="mb-5 flex items-center">
          <h1 className="text-2xl font-bold md:text-3xl">
            Skill
            <span className="text-violet-500">
              Chain
            </span>
          </h1>
        </div>

        {/* Motion Main Card */}
        <HomeMotionCard>
          <div
            className="
              grid
              min-h-[620px]
              md:grid-cols-[1.1fr_0.9fr]
            "
          >

            {/* LEFT */}
            <div
              className="
                relative
                overflow-hidden
                bg-gradient-to-br
                from-violet-900
                via-purple-800
                to-fuchsia-700
                px-8
                py-9
                md:px-10
                md:py-10
              "
            >

              {/* Background Glow */}
              <div className="absolute inset-0 opacity-25">
                <div
                  className="
                    absolute
                    left-10
                    top-10
                    h-32
                    w-32
                    rounded-full
                    bg-fuchsia-400
                    blur-3xl
                  "
                />

                <div
                  className="
                    absolute
                    right-10
                    top-20
                    h-24
                    w-24
                    rounded-full
                    bg-white/10
                  "
                />

                <div
                  className="
                    absolute
                    bottom-10
                    left-16
                    h-52
                    w-52
                    rounded-full
                    border
                    border-white/10
                  "
                />
              </div>

              <div
                className="
                  relative
                  z-10
                  flex
                  h-full
                  flex-col
                  justify-between
                "
              >

                <div>
                  <div
                    className="
                      mb-5
                      inline-flex
                      rounded-full
                      border
                      border-white/20
                      bg-white/10
                      px-4
                      py-2
                      text-sm
                      text-violet-100
                    "
                  >
                    Skill Marketplace on Blockchain
                  </div>

                  <h2
                    className="
                      hero-title
                      max-w-xl
                      text-4xl
                      font-bold
                      leading-tight
                      md:text-6xl
                    "
                  >
                    เปลี่ยนทักษะของคุณ

                    <br />

                    <span className="text-violet-100">
                      ให้มีมูลค่าบน Blockchain
                    </span>
                  </h2>

                  <p
                    className="
                      mt-5
                      max-w-xl
                      text-base
                      leading-8
                      text-violet-100/90
                      md:text-lg
                    "
                  >
                    เรียนรู้ • สอน • แลกเปลี่ยนทักษะ

                    <br />

                    และรับ Skill Token (SKT)
                    บนแพลตฟอร์ม SkillChain
                  </p>

                  <div className="mt-7">
                    <Link
                      href="/marketplace"
                      className="
                        inline-flex
                        rounded-xl
                        border
                        border-white/30
                        bg-white/10
                        px-6
                        py-3
                        font-semibold
                        text-white
                        backdrop-blur
                        transition
                        hover:bg-white/20
                      "
                    >
                      สำรวจทักษะ
                    </Link>
                  </div>
                </div>

                {/* Feature Cards */}
                <div
                  className="
                    mt-8
                    grid
                    gap-4
                    md:grid-cols-3
                  "
                >
                  <FeatureCard
                    icon={GraduationCap}
                    title="เรียนรู้ทักษะ"
                    text="ค้นหาทักษะและคอร์สที่ใช่"
                  />

                  <FeatureCard
                    icon={BadgeDollarSign}
                    title="สอนและสร้างรายได้"
                    text="สร้างรายได้จากความรู้และประสบการณ์"
                  />

                  <FeatureCard
                    icon={ShieldCheck}
                    title="Blockchain"
                    text="โปร่งใส ปลอดภัย และตรวจสอบได้"
                  />
                </div>

              </div>
            </div>

            {/* RIGHT LOGIN */}
            <div
              className="
                flex
                items-center
                justify-center
                bg-slate-100
                px-6
                py-10
                text-slate-900
                md:px-8
              "
            >
              <HomeLogin />
            </div>

          </div>
        </HomeMotionCard>

      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/15
        bg-white/10
        p-5
        backdrop-blur
        transition
        duration-200
        hover:bg-white/15
      "
    >
      <div className="mb-4 flex justify-center">
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            border
            border-white/20
            bg-white/10
          "
        >
          <Icon
            className="h-6 w-6 text-white"
            strokeWidth={1.8}
          />
        </div>
      </div>

      <h3
        className="
          text-center
          text-base
          font-bold
          text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-2
          text-center
          text-sm
          leading-6
          text-violet-100/80
        "
      >
        {text}
      </p>
    </div>
  );
}