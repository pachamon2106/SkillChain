"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Coins,
  GraduationCap,
  Layers3,
  Loader2,
  MessageCircle,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  Wallet2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";

import {
  useWallet,
} from "@/components/wallet/WalletProvider";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ProfileUser = {
  id: number;

  name: string | null;

  email: string;

  createdAt?: string;
};

type Skill = {
  id: number;

  title: string;

  description: string;

  price: number;

  category: string | null;

  payoutAddress: string | null;

  createdAt: string;

  owner: {
    id: number;

    name: string | null;
  };

  _count?: {
    enrollments:
      number;

    lessons:
      number;
  };
};

type RewardsData = {
  success: true;

  stats: {
    enrollmentCount:
      number;

    completedCourseCount:
      number;

    completedLessonCount:
      number;

    paidEnrollmentCount:
      number;

    createdSkillCount:
      number;

    createdLessonCount:
      number;
  };

  rewards: {
    earnedPoints:
      number;

    totalAvailablePoints:
      number;

    completedMissionCount:
      number;

    totalMissionCount:
      number;

    unlockedBadgeCount:
      number;

    totalBadgeCount:
      number;
  };

  level: {
    level: number;

    name: string;

    currentPoints:
      number;

    nextLevelPoints:
      number | null;

    progressPercent:
      number;
  };
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function AccountPage() {
  const router =
    useRouter();

  /*
   * =========================================================
   * WALLET
   * =========================================================
   */

  const {
    address,
    status,
    message:
      walletMessage,
    connecting,
    isConnected,
    formattedBalance,
    connectWallet,
    switchToBscTestnet,
    resetWallet,
  } = useWallet();

  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileUser | null>(
      null
    );

  const [
    skills,
    setSkills,
  ] =
    useState<Skill[]>(
      []
    );

  const [
    rewards,
    setRewards,
  ] =
    useState<RewardsData | null>(
      null
    );

  const [
    unreadMessages,
    setUnreadMessages,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    openProfile,
    setOpenProfile,
  ] =
    useState(false);

  /*
   * =========================================================
   * LOAD DASHBOARD
   * =========================================================
   */

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const [
            profileResponse,
            skillsResponse,
            rewardsResponse,
            messagesResponse,
          ] =
            await Promise.all([
              fetch(
                "/api/profile",
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/skills",
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/rewards",
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/messages",
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              ),
            ]);

          /*
           * ===================================================
           * SESSION
           * ===================================================
           */

          if (
            profileResponse.status ===
              401 ||
            rewardsResponse.status ===
              401
          ) {
            router.push(
              "/"
            );

            return;
          }

          const [
            profileData,
            skillsData,
            rewardsData,
            messagesData,
          ] =
            await Promise.all([
              profileResponse
                .json()
                .catch(
                  () =>
                    null
                ),

              skillsResponse
                .json()
                .catch(
                  () =>
                    null
                ),

              rewardsResponse
                .json()
                .catch(
                  () =>
                    null
                ),

              messagesResponse
                .json()
                .catch(
                  () =>
                    null
                ),
            ]);

          /*
           * ===================================================
           * PROFILE
           * ===================================================
           */

          if (
            !profileResponse.ok ||
            !profileData?.success ||
            !profileData?.user
          ) {
            setError(
              profileData?.message ||
                "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้"
            );

            return;
          }

          setProfile(
            profileData.user
          );

          /*
           * ===================================================
           * SKILLS
           * ===================================================
           */

          if (
            skillsResponse.ok &&
            skillsData?.success &&
            Array.isArray(
              skillsData.skills
            )
          ) {
            setSkills(
              skillsData.skills
            );
          } else {
            setSkills(
              []
            );
          }

          /*
           * ===================================================
           * REWARDS / STATS
           * ===================================================
           */

          if (
            rewardsResponse.ok &&
            rewardsData?.success
          ) {
            setRewards(
              rewardsData
            );
          } else {
            setRewards(
              null
            );

            setError(
              rewardsData?.message ||
                "ไม่สามารถโหลดสถิติของบัญชีได้"
            );

            return;
          }

          /*
           * ===================================================
           * MESSAGES
           * ===================================================
           */

          if (
            messagesResponse.ok &&
            messagesData?.success
          ) {
            setUnreadMessages(
              typeof messagesData.totalUnread ===
                "number"
                ? messagesData.totalUnread
                : 0
            );
          } else {
            setUnreadMessages(
              0
            );
          }
        } catch (error) {
          console.error(
            "Load dashboard error:",
            error
          );

          setError(
            "ไม่สามารถเชื่อมต่อเพื่อโหลด Dashboard ได้"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        router,
      ]
    );

  /*
   * =========================================================
   * FIRST LOAD
   * =========================================================
   */

  useEffect(() => {
    void loadDashboard();
  }, [
    loadDashboard,
  ]);

  /*
   * =========================================================
   * MESSAGE BADGE POLLING
   * =========================================================
   */

  useEffect(() => {
    const timer =
      window.setInterval(
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

            const data =
              await response
                .json()
                .catch(
                  () =>
                    null
                );

            if (
              response.ok &&
              data?.success
            ) {
              setUnreadMessages(
                typeof data.totalUnread ===
                  "number"
                  ? data.totalUnread
                  : 0
              );
            }
          } catch {
            /*
             * Dashboard ไม่พัง
             * ถ้า Message API มีปัญหาชั่วคราว
             */
          }
        },
        5000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  /*
   * =========================================================
   * MY SKILLS
   * =========================================================
   */

  const mySkills =
    useMemo(
      () => {
        if (!profile) {
          return [];
        }

        return skills.filter(
          (
            skill
          ) =>
            skill.owner.id ===
            profile.id
        );
      },
      [
        profile,
        skills,
      ]
    );

  /*
   * =========================================================
   * MY STUDENTS
   * =========================================================
   */

  const myStudentCount =
    useMemo(
      () =>
        mySkills.reduce(
          (
            total,
            skill
          ) =>
            total +
            (
              skill._count
                ?.enrollments ??
              0
            ),
          0
        ),
      [
        mySkills,
      ]
    );

  /*
   * =========================================================
   * LATEST REAL SKILLS
   * =========================================================
   */

  const latestSkills =
    useMemo(
      () =>
        [
          ...skills,
        ]
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.createdAt
              ).getTime() -
              new Date(
                a.createdAt
              ).getTime()
          )
          .slice(
            0,
            3
          ),
      [
        skills,
      ]
    );

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  async function logout() {
    resetWallet(
      "ออกจากระบบแล้ว กรุณา Connect Wallet ใหม่"
    );

    try {
      await fetch(
        "/api/logout",
        {
          method:
            "POST",

          credentials:
            "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    router.push(
      "/"
    );

    router.refresh();
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (
    loading
  ) {
    return (
      <main
        className="
          flex
          h-screen
          items-center
          justify-center
          bg-[#050816]
          text-white
        "
      >
        <div
          className="
            text-center
          "
        >
          <Loader2
            size={32}
            className="
              mx-auto
              animate-spin
              text-violet-400
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-slate-400
            "
          >
            กำลังโหลดข้อมูล Dashboard...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (
    !profile ||
    !rewards
  ) {
    return (
      <main
        className="
          flex
          h-screen
          items-center
          justify-center
          bg-[#050816]
          px-6
          text-white
        "
      >
        <div
          className="
            max-w-md
            text-center
          "
        >
          <Layers3
            size={42}
            className="
              mx-auto
              text-violet-400
            "
          />

          <h1
            className="
              mt-5
              text-xl
              font-bold
            "
          >
            โหลด Dashboard ไม่สำเร็จ
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-400
            "
          >
            {error ||
              "ไม่พบข้อมูลบัญชี"}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            className="
              mt-5
              rounded-xl
              bg-violet-600
              px-5
              py-2.5
              text-sm
              font-semibold
              transition
              hover:bg-violet-500
            "
          >
            ลองอีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <main
      className="
        flex
        h-screen
        overflow-hidden
        bg-[#050816]
        text-white
      "
    >
      {/* ========================================= */}
      {/* SIDEBAR */}
      {/* ========================================= */}

      <aside
        className="
          h-screen
          shrink-0
          overflow-hidden
        "
      >
        <Sidebar />
      </aside>

      {/* ========================================= */}
      {/* CONTENT */}
      {/* ========================================= */}

      <section
        className="
          h-screen
          flex-1
          overflow-y-auto
          px-6
          py-5
        "
      >
        {/* ======================================= */}
        {/* HEADER */}
        {/* ======================================= */}

        <div
          className="
            mb-6
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-sm
                text-violet-300
              "
            >
              SkillChain Dashboard
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              หน้าหลัก
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              ภาพรวมการเรียน การสอน และกิจกรรมของคุณ
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            {/* MESSAGE NOTIFICATION */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/messages"
                )
              }
              className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-white/10
                bg-[#111a33]
                transition
                hover:bg-[#182442]
              "
              title="ข้อความ"
            >
              <Bell
                size={18}
              />

              {unreadMessages >
                0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    min-h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
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
            </button>

            {/* PROFILE */}

            <div
              className="
                relative
              "
            >
              <button
                type="button"
                onClick={() =>
                  setOpenProfile(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-[#111a33]
                  px-5
                  py-3
                  transition
                  hover:bg-[#182442]
                "
              >
                <UserRound
                  size={17}
                />

                <span>
                  {profile.name ||
                    "User"}
                </span>

                <ChevronDown
                  size={16}
                  className={`
                    transition

                    ${
                      openProfile
                        ? "rotate-180"
                        : ""
                    }
                  `}
                />
              </button>

              {openProfile && (
                <div
                  className="
                    absolute
                    right-0
                    top-14
                    z-50
                    w-64
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#111a33]
                    p-4
                    shadow-2xl
                  "
                >
                  <div
                    className="
                      mb-3
                      border-b
                      border-white/10
                      pb-3
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      {profile.name ||
                        "User"}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      {
                        profile.email
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/profile"
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-slate-300
                      transition
                      hover:bg-white/5
                      hover:text-white
                    "
                  >
                    โปรไฟล์
                  </button>

                  <button
                    type="button"
                    onClick={
                      logout
                    }
                    className="
                      mt-1
                      w-full
                      rounded-xl
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-red-400
                      transition
                      hover:bg-red-500/10
                    "
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* HERO */}
        {/* ======================================= */}

        <section
          className="
            relative
            mb-6
            overflow-hidden
            rounded-[32px]
            border
            border-violet-500/20
            bg-gradient-to-r
            from-[#171e4c]
            via-[#2b2264]
            to-[#5a278b]
            p-7
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-24
              h-80
              w-80
              rounded-full
              bg-fuchsia-500/15
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-24
              left-1/3
              h-64
              w-64
              rounded-full
              bg-violet-500/20
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              grid
              gap-8
              lg:grid-cols-[1fr_300px]
              lg:items-center
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/5
                  px-3
                  py-1.5
                  text-xs
                  text-violet-100
                "
              >
                <Sparkles
                  size={14}
                />

                Learn • Teach • Earn
              </div>

              <h2
                className="
                  mt-5
                  text-3xl
                  font-bold
                  leading-tight
                  md:text-4xl
                "
              >
                ยินดีต้อนรับ{" "}
                <span
                  className="
                    text-violet-300
                  "
                >
                  {profile.name ||
                    "ผู้ใช้งาน"}
                </span>
              </h2>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-7
                  text-slate-300
                "
              >
                เรียนรู้ทักษะใหม่ แบ่งปันความรู้
                และติดตามความก้าวหน้าของคุณจากข้อมูลจริงใน SkillChain
              </p>

              <div
                className="
                  mt-6
                  flex
                  flex-wrap
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/skills"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-violet-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-violet-500
                  "
                >
                  ค้นหาทักษะ

                  <ArrowRight
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/teaching"
                    )
                  }
                  className="
                    rounded-xl
                    border
                    border-white/15
                    bg-white/5
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-white/10
                  "
                >
                  จัดการการสอน
                </button>
              </div>
            </div>

            {/* LEVEL */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/rewards"
                )
              }
              className="
                rounded-[26px]
                border
                border-white/10
                bg-white/[0.06]
                p-5
                text-left
                backdrop-blur
                transition
                hover:bg-white/[0.09]
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-amber-500/15
                    text-amber-300
                  "
                >
                  <Trophy
                    size={23}
                  />
                </div>

                <span
                  className="
                    text-xs
                    text-violet-200
                  "
                >
                  ดูรางวัล
                </span>
              </div>

              <p
                className="
                  mt-5
                  text-sm
                  text-slate-400
                "
              >
                ระดับปัจจุบัน
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                "
              >
                Lv.
                {
                  rewards.level
                    .level
                }{" "}
                <span
                  className="
                    text-base
                    font-medium
                    text-violet-300
                  "
                >
                  {
                    rewards.level
                      .name
                  }
                </span>
              </p>

              <div
                className="
                  mt-4
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-black/20
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-violet-300
                  "
                  style={{
                    width:
                      `${rewards.level.progressPercent}%`,
                  }}
                />
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  text-slate-400
                "
              >
                {
                  rewards.rewards
                    .earnedPoints
                }{" "}
                Reward Points
              </p>
            </button>
          </div>
        </section>

        {/* ======================================= */}
        {/* CONTENT GRID */}
        {/* ======================================= */}

        <div
          className="
            grid
            gap-6
            xl:grid-cols-[minmax(0,1fr)_340px]
          "
        >
          {/* ===================================== */}
          {/* LEFT */}
          {/* ===================================== */}

          <div
            className="
              min-w-0
              space-y-6
            "
          >
            {/* =================================== */}
            {/* STATS */}
            {/* =================================== */}

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
                xl:grid-cols-4
              "
            >
              <StatCard
                icon={
                  <BookOpen
                    size={20}
                  />
                }
                title="ทักษะที่ฉันสอน"
                value={
                  mySkills.length
                }
                suffix="Skills"
              />

              <StatCard
                icon={
                  <Users
                    size={20}
                  />
                }
                title="ผู้เรียนของฉัน"
                value={
                  myStudentCount
                }
                suffix="คน"
              />

              <StatCard
                icon={
                  <CheckCircle2
                    size={20}
                  />
                }
                title="บทเรียนที่เรียนจบ"
                value={
                  rewards.stats
                    .completedLessonCount
                }
                suffix="บท"
              />

              <StatCard
                icon={
                  <GraduationCap
                    size={20}
                  />
                }
                title="Skill ที่เรียนจบ"
                value={
                  rewards.stats
                    .completedCourseCount
                }
                suffix="Skills"
              />
            </div>

            {/* =================================== */}
            {/* LATEST SKILLS */}
            {/* =================================== */}

            <section
              className="
                rounded-[30px]
                border
                border-white/10
                bg-[#0d1430]
                p-6
              "
            >
              <div
                className="
                  mb-5
                  flex
                  flex-wrap
                  items-end
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      text-violet-300
                    "
                  >
                    Skill Marketplace
                  </p>

                  <h2
                    className="
                      mt-1
                      text-2xl
                      font-bold
                    "
                  >
                    ทักษะล่าสุด
                  </h2>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-500
                    "
                  >
                    ข้อมูล Skill จริงล่าสุดจากระบบ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/skills"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-violet-300
                    transition
                    hover:text-violet-200
                  "
                >
                  ดูทั้งหมด

                  <ArrowRight
                    size={15}
                  />
                </button>
              </div>

              {latestSkills.length ===
              0 ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-white/10
                    p-8
                    text-center
                  "
                >
                  <BookOpen
                    size={28}
                    className="
                      mx-auto
                      text-slate-600
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-sm
                      text-slate-500
                    "
                  >
                    ยังไม่มี Skill ในระบบ
                  </p>
                </div>
              ) : (
                <div
                  className="
                    grid
                    gap-4
                    lg:grid-cols-3
                  "
                >
                  {latestSkills.map(
                    (
                      skill
                    ) => (
                      <SkillCard
                        key={
                          skill.id
                        }
                        skill={
                          skill
                        }
                        onOpen={() =>
                          router.push(
                            skill.category
                              ? `/skills?category=${encodeURIComponent(
                                  skill.category
                                )}`
                              : "/skills"
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* =================================== */}
            {/* ACCOUNT ACTIVITY */}
            {/* =================================== */}

            <section
              className="
                rounded-[30px]
                border
                border-white/10
                bg-[#0d1430]
                p-6
              "
            >
              <div
                className="
                  mb-5
                "
              >
                <p
                  className="
                    text-sm
                    text-violet-300
                  "
                >
                  Real Activity
                </p>

                <h2
                  className="
                    mt-1
                    text-2xl
                    font-bold
                  "
                >
                  ภาพรวมกิจกรรมของฉัน
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                  "
                >
                  ตัวเลขจากการใช้งานจริงของบัญชีนี้
                </p>
              </div>

              <div
                className="
                  grid
                  gap-3
                  md:grid-cols-2
                "
              >
                <ActivityCard
                  icon={
                    <GraduationCap
                      size={19}
                    />
                  }
                  title="สมัครเรียนทั้งหมด"
                  value={
                    rewards.stats
                      .enrollmentCount
                  }
                  suffix="Skill"
                  onClick={() =>
                    router.push(
                      "/learning"
                    )
                  }
                />

                <ActivityCard
                  icon={
                    <Coins
                      size={19}
                    />
                  }
                  title="สมัครเรียนด้วย SKT"
                  value={
                    rewards.stats
                      .paidEnrollmentCount
                  }
                  suffix="ครั้ง"
                  onClick={() =>
                    router.push(
                      "/learning"
                    )
                  }
                />

                <ActivityCard
                  icon={
                    <Layers3
                      size={19}
                    />
                  }
                  title="บทเรียนที่สร้าง"
                  value={
                    rewards.stats
                      .createdLessonCount
                  }
                  suffix="บท"
                  onClick={() =>
                    router.push(
                      "/teaching"
                    )
                  }
                />

                <ActivityCard
                  icon={
                    <MessageCircle
                      size={19}
                    />
                  }
                  title="ข้อความที่ยังไม่ได้อ่าน"
                  value={
                    unreadMessages
                  }
                  suffix="ข้อความ"
                  onClick={() =>
                    router.push(
                      "/messages"
                    )
                  }
                />
              </div>
            </section>
          </div>

          {/* ===================================== */}
          {/* RIGHT */}
          {/* ===================================== */}

          <aside
            className="
              space-y-6
            "
          >
            {/* =================================== */}
            {/* WALLET */}
            {/* =================================== */}

            <section
              className="
                overflow-hidden
                rounded-[30px]
                border
                border-violet-500/20
                bg-gradient-to-br
                from-[#171d47]
                via-[#211758]
                to-[#371664]
                p-5
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-2xl
                      bg-violet-500/20
                      text-violet-200
                    "
                  >
                    <Wallet2
                      size={21}
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-xs
                        text-violet-300
                      "
                    >
                      Skill Wallet
                    </p>

                    <h3
                      className="
                        font-bold
                      "
                    >
                      My Wallet
                    </h3>
                  </div>
                </div>

                <span
                  className={`
                    rounded-full
                    px-2.5
                    py-1
                    text-[10px]
                    font-semibold

                    ${
                      isConnected
                        ? `
                          bg-emerald-500/10
                          text-emerald-300
                        `
                        : status ===
                          "wrong-network"
                        ? `
                          bg-amber-500/10
                          text-amber-300
                        `
                        : `
                          bg-white/5
                          text-slate-400
                        `
                    }
                  `}
                >
                  {isConnected
                    ? "Connected"
                    : status ===
                      "wrong-network"
                    ? "Wrong Network"
                    : "Not Connected"}
                </span>
              </div>

              <div
                className="
                  mt-7
                "
              >
                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  SKT Balance
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-bold
                  "
                >
                  {isConnected
                    ? formattedBalance
                    : "--"}{" "}
                  <span
                    className="
                      text-lg
                      text-violet-300
                    "
                  >
                    SKT
                  </span>
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  {walletMessage}
                </p>
              </div>

              {/* CONNECT */}

              {!isConnected &&
                status !==
                  "wrong-network" && (
                  <button
                    type="button"
                    disabled={
                      connecting
                    }
                    onClick={() =>
                      void connectWallet()
                    }
                    className="
                      mt-5
                      flex
                      h-11
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-violet-600
                      text-sm
                      font-semibold
                      transition
                      hover:bg-violet-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {connecting ? (
                      <>
                        <Loader2
                          size={17}
                          className="
                            animate-spin
                          "
                        />

                        กำลังเชื่อมต่อ...
                      </>
                    ) : (
                      "Connect MetaMask"
                    )}
                  </button>
                )}

              {/* WRONG NETWORK */}

              {status ===
                "wrong-network" && (
                <button
                  type="button"
                  onClick={() =>
                    void switchToBscTestnet()
                  }
                  className="
                    mt-5
                    h-11
                    w-full
                    rounded-xl
                    bg-amber-500
                    text-sm
                    font-semibold
                    text-black
                    transition
                    hover:bg-amber-400
                  "
                >
                  เปลี่ยนเป็น BSC Testnet
                </button>
              )}

              {/* ADDRESS */}

              <div
                className="
                  mt-5
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/10
                  p-4
                "
              >
                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.12em]
                    text-slate-500
                  "
                >
                  Wallet Address
                </p>

                <p
                  className="
                    mt-2
                    break-all
                    text-xs
                    leading-5
                    text-slate-300
                  "
                >
                  {address
                    ? shortenAddress(
                        address
                      )
                    : "ยังไม่ได้เชื่อม Wallet"}
                </p>
              </div>

              {/* WALLET ACTIONS */}

              <div
                className="
                  mt-4
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/wallet"
                    )
                  }
                  className="
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    py-3
                    text-xs
                    font-semibold
                    text-slate-300
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  เปิด Wallet
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/transactions"
                    )
                  }
                  className="
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    py-3
                    text-xs
                    font-semibold
                    text-slate-300
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  ธุรกรรม
                </button>
              </div>
            </section>

            {/* =================================== */}
            {/* REWARDS */}
            {/* =================================== */}

            <section
              className="
                rounded-[30px]
                border
                border-white/10
                bg-[#0d1430]
                p-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      text-violet-300
                    "
                  >
                    Rewards
                  </p>

                  <h3
                    className="
                      mt-1
                      text-xl
                      font-bold
                    "
                  >
                    ความสำเร็จ
                  </h3>
                </div>

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-amber-500/10
                    text-amber-300
                  "
                >
                  <Trophy
                    size={21}
                  />
                </div>
              </div>

              <div
                className="
                  mt-5
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <SmallMetric
                  title="Reward Points"
                  value={
                    rewards.rewards
                      .earnedPoints
                  }
                />

                <SmallMetric
                  title="Badge"
                  value={
                    rewards.rewards
                      .unlockedBadgeCount
                  }
                  suffix={`/${rewards.rewards.totalBadgeCount}`}
                />

                <SmallMetric
                  title="Mission"
                  value={
                    rewards.rewards
                      .completedMissionCount
                  }
                  suffix={`/${rewards.rewards.totalMissionCount}`}
                />

                <SmallMetric
                  title="Level"
                  value={
                    rewards.level
                      .level
                  }
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/rewards"
                  )
                }
                className="
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-500/10
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-violet-300
                  transition
                  hover:bg-violet-500/15
                "
              >
                ดูรางวัล & ภารกิจ

                <ArrowRight
                  size={15}
                />
              </button>
            </section>

            {/* =================================== */}
            {/* SYSTEM SUMMARY */}
            {/* =================================== */}

            <section
              className="
                rounded-[30px]
                border
                border-white/10
                bg-[#0d1430]
                p-5
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    text-violet-300
                  "
                >
                  Marketplace
                </p>

                <h3
                  className="
                    mt-1
                    text-xl
                    font-bold
                  "
                >
                  ภาพรวมระบบ
                </h3>
              </div>

              <div
                className="
                  mt-5
                  space-y-3
                "
              >
                <SummaryRow
                  title="Skill ทั้งหมด"
                  value={
                    skills.length
                  }
                />

                <SummaryRow
                  title="Skill ที่ฉันสร้าง"
                  value={
                    mySkills.length
                  }
                />

                <SummaryRow
                  title="ผู้เรียนของฉัน"
                  value={
                    myStudentCount
                  }
                />

                <SummaryRow
                  title="ข้อความใหม่"
                  value={
                    unreadMessages
                  }
                />
              </div>
            </section>
          </aside>
        </div>

        <div
          className="
            h-8
          "
        />
      </section>
    </main>
  );
}

/*
 * =========================================================
 * STAT CARD
 * =========================================================
 */

function StatCard({
  icon,
  title,
  value,
  suffix,
}: {
  icon:
    ReactNode;

  title:
    string;

  value:
    number;

  suffix:
    string;
}) {
  return (
    <div
      className="
        rounded-[24px]
        border
        border-white/10
        bg-[#0d1430]
        p-5
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-violet-500/15
          text-violet-300
        "
      >
        {icon}
      </div>

      <p
        className="
          mt-5
          text-sm
          text-slate-400
        "
      >
        {title}
      </p>

      <div
        className="
          mt-1
          flex
          items-end
          gap-2
        "
      >
        <p
          className="
            text-2xl
            font-bold
          "
        >
          {value}
        </p>

        <span
          className="
            mb-0.5
            text-xs
            text-violet-300
          "
        >
          {suffix}
        </span>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * SKILL CARD
 * =========================================================
 */

function SkillCard({
  skill,
  onOpen,
}: {
  skill:
    Skill;

  onOpen:
    () => void;
}) {
  return (
    <article
      className="
        flex
        min-h-[270px]
        flex-col
        overflow-hidden
        rounded-[24px]
        border
        border-white/10
        bg-[#111a33]
      "
    >
      {/* TOP */}

      <div
        className="
          bg-gradient-to-br
          from-violet-700
          via-purple-600
          to-indigo-700
          p-4
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <span
            className="
              rounded-full
              bg-white/10
              px-3
              py-1
              text-[10px]
              font-semibold
              text-violet-100
            "
          >
            {skill.category ||
              "ยังไม่ระบุหมวด"}
          </span>

          <span
            className="
              rounded-full
              bg-black/15
              px-3
              py-1
              text-xs
              font-semibold
            "
          >
            {skill.price <=
            0
              ? "ฟรี"
              : `${skill.price} SKT`}
          </span>
        </div>
      </div>

      {/* BODY */}

      <div
        className="
          flex
          flex-1
          flex-col
          p-4
        "
      >
        <h3
          className="
            line-clamp-2
            text-base
            font-bold
          "
        >
          {skill.title}
        </h3>

        <p
          className="
            mt-2
            line-clamp-2
            text-xs
            leading-5
            text-slate-500
          "
        >
          {skill.description}
        </p>

        <p
          className="
            mt-3
            text-xs
            text-slate-400
          "
        >
          โดย{" "}
          {skill.owner
            .name ||
            `User #${skill.owner.id}`}
        </p>

        <div
          className="
            mt-3
            flex
            flex-wrap
            gap-3
            text-[10px]
            text-slate-500
          "
        >
          <span>
            {
              skill._count
                ?.lessons ??
              0
            }{" "}
            บทเรียน
          </span>

          <span>
            {
              skill._count
                ?.enrollments ??
              0
            }{" "}
            ผู้เรียน
          </span>
        </div>

        <button
          type="button"
          onClick={
            onOpen
          }
          className="
            mt-auto
            flex
            w-full
            items-center
            justify-between
            rounded-xl
            border
            border-white/10
            bg-white/[0.03]
            px-4
            py-3
            text-sm
            font-semibold
            transition
            hover:bg-violet-500/10
          "
        >
          ดูใน Marketplace

          <ArrowRight
            size={15}
          />
        </button>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * ACTIVITY CARD
 * =========================================================
 */

function ActivityCard({
  icon,
  title,
  value,
  suffix,
  onClick,
}: {
  icon:
    ReactNode;

  title:
    string;

  value:
    number;

  suffix:
    string;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-white/[0.025]
        p-4
        text-left
        transition
        hover:border-violet-500/20
        hover:bg-violet-500/5
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-violet-500/10
          text-violet-300
        "
      >
        {icon}
      </div>

      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            text-xs
            text-slate-500
          "
        >
          {title}
        </p>

        <div
          className="
            mt-1
            flex
            items-end
            gap-2
          "
        >
          <span
            className="
              text-xl
              font-bold
            "
          >
            {value}
          </span>

          <span
            className="
              mb-0.5
              text-xs
              text-slate-400
            "
          >
            {suffix}
          </span>
        </div>
      </div>

      <ArrowRight
        size={15}
        className="
          shrink-0
          text-slate-600
        "
      />
    </button>
  );
}

/*
 * =========================================================
 * SMALL METRIC
 * =========================================================
 */

function SmallMetric({
  title,
  value,
  suffix = "",
}: {
  title:
    string;

  value:
    number;

  suffix?: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.025]
        p-3
      "
    >
      <p
        className="
          text-[10px]
          text-slate-500
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          text-lg
          font-bold
        "
      >
        {value}

        {suffix && (
          <span
            className="
              ml-1
              text-xs
              font-medium
              text-slate-500
            "
          >
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * SUMMARY ROW
 * =========================================================
 */

function SummaryRow({
  title,
  value,
}: {
  title:
    string;

  value:
    number;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
        rounded-xl
        bg-white/[0.025]
        px-4
        py-3
      "
    >
      <span
        className="
          text-sm
          text-slate-400
        "
      >
        {title}
      </span>

      <span
        className="
          font-bold
          text-white
        "
      >
        {value}
      </span>
    </div>
  );
}

/*
 * =========================================================
 * SHORT ADDRESS
 * =========================================================
 */

function shortenAddress(
  address:
    string
) {
  if (
    address.length <=
    20
  ) {
    return address;
  }

  return `${address.slice(
    0,
    8
  )}...${address.slice(
    -6
  )}`;
}