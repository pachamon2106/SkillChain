"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Coins,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Users,
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

type MissionType =
  | "learning"
  | "teaching"
  | "blockchain";

type Mission = {
  id: string;
  title: string;
  description: string;

  type:
    MissionType;

  progress: number;
  target: number;

  points: number;

  completed: boolean;

  progressPercent: number;
};

type Badge = {
  id: string;
  title: string;
  description: string;

  unlocked: boolean;

  requirement: string;
};

type RewardUser = {
  id: number;
  name: string | null;
  email: string;
};

type RewardStats = {
  enrollmentCount: number;

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

type RewardSummary = {
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

type LevelInfo = {
  level: number;

  name: string;

  currentPoints:
    number;

  nextLevelPoints:
    number | null;

  progressPercent:
    number;
};

type RewardResponse = {
  success: true;

  user:
    RewardUser;

  stats:
    RewardStats;

  missions:
    Mission[];

  rewards:
    RewardSummary;

  badges:
    Badge[];

  level:
    LevelInfo;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function RewardsPage() {
  const router =
    useRouter();

  const {
    resetWallet,
  } = useWallet();

  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const [
    data,
    setData,
  ] =
    useState<RewardResponse | null>(
      null
    );

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
   * LOAD REWARDS
   * =========================================================
   */

  async function loadRewards() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const response =
        await fetch(
          "/api/rewards",
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        response.status ===
        401
      ) {
        router.push(
          "/"
        );

        return;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        setData(
          null
        );

        setError(
          result?.message ||
            "ไม่สามารถโหลดข้อมูลรางวัลได้"
        );

        return;
      }

      setData(
        result
      );
    } catch (error) {
      console.error(
        "Load rewards error:",
        error
      );

      setData(
        null
      );

      setError(
        "ไม่สามารถเชื่อมต่อเพื่อโหลดข้อมูลรางวัลได้"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    void loadRewards();
  }, []);

  /*
   * =========================================================
   * MISSION GROUPS
   * =========================================================
   */

  const learningMissions =
    useMemo(
      () =>
        data?.missions.filter(
          (
            mission
          ) =>
            mission.type ===
            "learning"
        ) ??
        [],
      [
        data,
      ]
    );

  const teachingMissions =
    useMemo(
      () =>
        data?.missions.filter(
          (
            mission
          ) =>
            mission.type ===
            "teaching"
        ) ??
        [],
      [
        data,
      ]
    );

  const blockchainMissions =
    useMemo(
      () =>
        data?.missions.filter(
          (
            mission
          ) =>
            mission.type ===
            "blockchain"
        ) ??
        [],
      [
        data,
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
            กำลังคำนวณรางวัลจากข้อมูลจริง...
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
    !data
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
          <Trophy
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
            โหลดข้อมูลรางวัลไม่สำเร็จ
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-400
            "
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadRewards()
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
   * UI
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
      {/* MAIN */}
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
        {/* TOP BAR */}
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
              Rewards Center
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              รางวัล & ภารกิจ
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              ความสำเร็จจากการเรียน การสอน และการใช้งาน SkillChain
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            {/* BELL */}

            <button
              type="button"
              className="
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
            >
              <Bell
                size={18}
              />
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
                  {data.user
                    .name ||
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
                      {data.user
                        .name ||
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
                        data.user
                          .email
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
        {/* HERO / LEVEL */}
        {/* ======================================= */}

        <div
          className="
            relative
            mb-6
            overflow-hidden
            rounded-[32px]
            border
            border-violet-500/20
            bg-gradient-to-r
            from-[#181f4d]
            via-[#302568]
            to-[#672c92]
            p-7
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-80
              w-80
              rounded-full
              bg-fuchsia-400/15
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
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
              lg:grid-cols-[1fr_320px]
              lg:items-center
            "
          >
            {/* LEFT */}

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

                SkillChain Achievement
              </div>

              <h2
                className="
                  mt-4
                  text-3xl
                  font-bold
                "
              >
                Level{" "}
                {
                  data.level
                    .level
                }
                {" · "}
                {
                  data.level
                    .name
                }
              </h2>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-300
                "
              >
                ทำภารกิจจากการใช้งานจริงเพื่อสะสม Reward Points
                และปลดล็อก Badge ใหม่ ๆ
              </p>

              {/* LEVEL PROGRESS */}

              <div
                className="
                  mt-6
                  max-w-2xl
                "
              >
                <div
                  className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    gap-4
                    text-xs
                  "
                >
                  <span
                    className="
                      text-slate-300
                    "
                  >
                    {
                      data.level
                        .currentPoints
                    }{" "}
                    Points
                  </span>

                  <span
                    className="
                      text-slate-400
                    "
                  >
                    {data.level
                      .nextLevelPoints
                      ? `เป้าหมายถัดไป ${data.level.nextLevelPoints} Points`
                      : "ระดับสูงสุด"}
                  </span>
                </div>

                <div
                  className="
                    h-3
                    overflow-hidden
                    rounded-full
                    bg-black/20
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-white
                      transition-all
                      duration-500
                    "
                    style={{
                      width:
                        `${data.level.progressPercent}%`,
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
                    data.level
                      .progressPercent
                  }
                  % ของระดับปัจจุบัน
                </p>
              </div>
            </div>

            {/* TROPHY */}

            <div
              className="
                flex
                justify-center
                lg:justify-end
              "
            >
              <div
                className="
                  flex
                  h-52
                  w-52
                  flex-col
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.06]
                  text-center
                  backdrop-blur
                "
              >
                <Trophy
                  size={54}
                  className="
                    text-amber-300
                  "
                />

                <p
                  className="
                    mt-4
                    text-3xl
                    font-bold
                  "
                >
                  {
                    data.rewards
                      .earnedPoints
                  }
                </p>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-[0.18em]
                    text-white/60
                  "
                >
                  Reward Points
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* SUMMARY */}
        {/* ======================================= */}

        <div
          className="
            mb-6
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <SummaryCard
            icon={
              <Target
                size={20}
              />
            }
            title="ภารกิจสำเร็จ"
            value={`${data.rewards.completedMissionCount}/${data.rewards.totalMissionCount}`}
          />

          <SummaryCard
            icon={
              <Award
                size={20}
              />
            }
            title="Badge ที่ปลดล็อก"
            value={`${data.rewards.unlockedBadgeCount}/${data.rewards.totalBadgeCount}`}
          />

          <SummaryCard
            icon={
              <GraduationCap
                size={20}
              />
            }
            title="เรียนจบ Skill"
            value={
              data.stats
                .completedCourseCount
                .toString()
            }
          />

          <SummaryCard
            icon={
              <Users
                size={20}
              />
            }
            title="Skill ที่สร้าง"
            value={
              data.stats
                .createdSkillCount
                .toString()
            }
          />
        </div>

        {/* ======================================= */}
        {/* MISSION SECTIONS */}
        {/* ======================================= */}

        <div
          className="
            space-y-6
          "
        >
          {/* LEARNING */}

          <MissionSection
            title="ภารกิจการเรียน"
            subtitle="เรียนรู้และพัฒนาทักษะของคุณ"
            icon={
              <GraduationCap
                size={22}
              />
            }
            missions={
              learningMissions
            }
          />

          {/* TEACHING */}

          <MissionSection
            title="ภารกิจการสอน"
            subtitle="แบ่งปันความรู้ให้กับชุมชน SkillChain"
            icon={
              <BookOpen
                size={22}
              />
            }
            missions={
              teachingMissions
            }
          />

          {/* BLOCKCHAIN */}

          <MissionSection
            title="ภารกิจ Blockchain"
            subtitle="ใช้งาน SKT ภายในระบบ SkillChain"
            icon={
              <Coins
                size={22}
              />
            }
            missions={
              blockchainMissions
            }
          />
        </div>

        {/* ======================================= */}
        {/* BADGES */}
        {/* ======================================= */}

        <div
          className="
            mt-6
            rounded-[30px]
            border
            border-white/10
            bg-[#101734]
            p-6
          "
        >
          <div
            className="
              mb-6
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
                Achievement Badges
              </p>

              <h2
                className="
                  mt-1
                  text-2xl
                  font-bold
                "
              >
                Badge ของฉัน
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                "
              >
                Badge จะปลดล็อกจากกิจกรรมจริงของบัญชีนี้
              </p>
            </div>

            <div
              className="
                rounded-full
                border
                border-violet-500/20
                bg-violet-500/10
                px-4
                py-2
                text-sm
                font-semibold
                text-violet-300
              "
            >
              {
                data.rewards
                  .unlockedBadgeCount
              }
              /
              {
                data.rewards
                  .totalBadgeCount
              }{" "}
              ปลดล็อกแล้ว
            </div>
          </div>

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {data.badges.map(
              (
                badge
              ) => (
                <BadgeCard
                  key={
                    badge.id
                  }
                  badge={
                    badge
                  }
                />
              )
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* REAL STATS */}
        {/* ======================================= */}

        <div
          className="
            mt-6
            rounded-[30px]
            border
            border-white/10
            bg-[#101734]
            p-6
          "
        >
          <div
            className="
              mb-6
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
              สถิติของฉัน
            </h2>
          </div>

          <div
            className="
              grid
              gap-3
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            <MiniStat
              title="สมัครเรียนทั้งหมด"
              value={
                data.stats
                  .enrollmentCount
              }
            />

            <MiniStat
              title="บทเรียนที่เรียนจบ"
              value={
                data.stats
                  .completedLessonCount
              }
            />

            <MiniStat
              title="Skill ที่เรียนจบ"
              value={
                data.stats
                  .completedCourseCount
              }
            />

            <MiniStat
              title="สมัครด้วย SKT"
              value={
                data.stats
                  .paidEnrollmentCount
              }
            />

            <MiniStat
              title="Skill ที่สร้าง"
              value={
                data.stats
                  .createdSkillCount
              }
            />

            <MiniStat
              title="บทเรียนที่สร้าง"
              value={
                data.stats
                  .createdLessonCount
              }
            />
          </div>
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
 * SUMMARY CARD
 * =========================================================
 */

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon:
    ReactNode;

  title:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        rounded-[24px]
        border
        border-white/10
        bg-[#101734]
        p-5
      "
    >
      <div
        className="
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
              text-slate-400
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2
              text-2xl
              font-bold
            "
          >
            {value}
          </p>
        </div>

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-300
          "
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MISSION SECTION
 * =========================================================
 */

function MissionSection({
  title,
  subtitle,
  icon,
  missions,
}: {
  title:
    string;

  subtitle:
    string;

  icon:
    ReactNode;

  missions:
    Mission[];
}) {
  return (
    <section
      className="
        rounded-[30px]
        border
        border-white/10
        bg-[#101734]
        p-6
      "
    >
      <div
        className="
          mb-5
          flex
          items-center
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
            bg-violet-500/10
            text-violet-300
          "
        >
          {icon}
        </div>

        <div>
          <h2
            className="
              text-xl
              font-bold
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            {subtitle}
          </p>
        </div>
      </div>

      {missions.length ===
      0 ? (
        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.02]
            p-5
            text-sm
            text-slate-500
          "
        >
          ยังไม่มีภารกิจในหมวดนี้
        </div>
      ) : (
        <div
          className="
            grid
            gap-4
            lg:grid-cols-2
          "
        >
          {missions.map(
            (
              mission
            ) => (
              <MissionCard
                key={
                  mission.id
                }
                mission={
                  mission
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

/*
 * =========================================================
 * MISSION CARD
 * =========================================================
 */

function MissionCard({
  mission,
}: {
  mission:
    Mission;
}) {
  return (
    <div
      className={`
        rounded-[24px]
        border
        p-5

        ${
          mission.completed
            ? `
              border-emerald-500/20
              bg-emerald-500/[0.04]
            `
            : `
              border-white/10
              bg-white/[0.025]
            `
        }
      `}
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div
          className="
            flex
            min-w-0
            items-start
            gap-3
          "
        >
          <div
            className={`
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl

              ${
                mission.completed
                  ? `
                    bg-emerald-500/15
                    text-emerald-300
                  `
                  : `
                    bg-violet-500/10
                    text-violet-300
                  `
              }
            `}
          >
            {mission.completed ? (
              <CheckCircle2
                size={20}
              />
            ) : (
              <Target
                size={20}
              />
            )}
          </div>

          <div
            className="
              min-w-0
            "
          >
            <h3
              className="
                font-semibold
                text-white
              "
            >
              {mission.title}
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-slate-400
              "
            >
              {mission.description}
            </p>
          </div>
        </div>

        <span
          className="
            shrink-0
            rounded-full
            bg-amber-500/10
            px-3
            py-1.5
            text-xs
            font-semibold
            text-amber-300
          "
        >
          +{mission.points}
        </span>
      </div>

      {/* PROGRESS */}

      <div
        className="
          mt-5
        "
      >
        <div
          className="
            mb-2
            flex
            items-center
            justify-between
            text-xs
          "
        >
          <span
            className="
              text-slate-500
            "
          >
            ความคืบหน้า
          </span>

          <span
            className={
              mission.completed
                ? "font-semibold text-emerald-300"
                : "text-slate-300"
            }
          >
            {mission.progress}
            /
            {mission.target}
          </span>
        </div>

        <div
          className="
            h-2
            overflow-hidden
            rounded-full
            bg-white/5
          "
        >
          <div
            className={`
              h-full
              rounded-full
              transition-all
              duration-500

              ${
                mission.completed
                  ? "bg-emerald-400"
                  : "bg-violet-500"
              }
            `}
            style={{
              width:
                `${mission.progressPercent}%`,
            }}
          />
        </div>

        <div
          className="
            mt-3
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <span
            className="
              text-xs
              text-slate-500
            "
          >
            {
              mission.progressPercent
            }
            %
          </span>

          {mission.completed && (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                text-xs
                font-semibold
                text-emerald-300
              "
            >
              <CheckCircle2
                size={13}
              />

              สำเร็จแล้ว
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * BADGE CARD
 * =========================================================
 */

function BadgeCard({
  badge,
}: {
  badge:
    Badge;
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[24px]
        border
        p-5

        ${
          badge.unlocked
            ? `
              border-violet-500/25
              bg-violet-500/[0.05]
            `
            : `
              border-white/10
              bg-white/[0.02]
            `
        }
      `}
    >
      {badge.unlocked && (
        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-10
            h-28
            w-28
            rounded-full
            bg-violet-500/10
            blur-2xl
          "
        />
      )}

      <div
        className="
          relative
          z-10
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div
            className={`
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl

              ${
                badge.unlocked
                  ? `
                    bg-amber-500/15
                    text-amber-300
                  `
                  : `
                    bg-white/5
                    text-slate-600
                  `
              }
            `}
          >
            {badge.unlocked ? (
              <Star
                size={25}
              />
            ) : (
              <LockKeyhole
                size={22}
              />
            )}
          </div>

          <span
            className={`
              rounded-full
              px-2.5
              py-1
              text-[10px]
              font-semibold

              ${
                badge.unlocked
                  ? `
                    bg-emerald-500/10
                    text-emerald-300
                  `
                  : `
                    bg-white/5
                    text-slate-500
                  `
              }
            `}
          >
            {badge.unlocked
              ? "ปลดล็อกแล้ว"
              : "ยังล็อกอยู่"}
          </span>
        </div>

        <h3
          className={`
            mt-5
            text-lg
            font-bold

            ${
              badge.unlocked
                ? "text-white"
                : "text-slate-500"
            }
          `}
        >
          {badge.title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-500
          "
        >
          {badge.description}
        </p>

        <div
          className="
            mt-4
            rounded-xl
            bg-black/10
            px-3
            py-2.5
          "
        >
          <p
            className="
              text-[10px]
              uppercase
              tracking-[0.12em]
              text-slate-600
            "
          >
            Requirement
          </p>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-slate-400
            "
          >
            {badge.requirement}
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MINI STAT
 * =========================================================
 */

function MiniStat({
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
        rounded-2xl
        border
        border-white/10
        bg-white/[0.025]
        p-4
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

      <p
        className="
          mt-2
          text-2xl
          font-bold
          text-white
        "
      >
        {value}
      </p>
    </div>
  );
}