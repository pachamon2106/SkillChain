"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  ExternalLink,
  GraduationCap,
  Loader2,
  PlayCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";

import {
  useWallet,
} from "@/components/wallet/WalletProvider";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type User = {
  id: number;
  name: string | null;
  email: string;
};

type Enrollment = {
  id: number;

  status: string;

  paidAmount: number;

  paymentTxHash:
    | string
    | null;

  createdAt: string;

  updatedAt: string;

  skill: {
    id: number;

    title: string;

    description: string;

    price: number;

    payoutAddress:
      | string
      | null;

    createdAt: string;

    owner: {
      id: number;

      name:
        | string
        | null;
    };
  };
};

type CourseProgress = {
  totalLessons: number;
  completedLessons: number;
  percent: number;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function LearningPage() {
  const router =
    useRouter();

  /*
   * =========================================================
   * WALLET
   * =========================================================
   *
   * หน้านี้ไม่ได้ใช้ Wallet Balance
   * เป็นแหล่งข้อมูลการเรียน
   *
   * Enrollment จาก DB
   * คือข้อมูลหลัก
   *
   * เราใช้ resetWallet เฉพาะตอน Logout
   */
  const {
    resetWallet,
  } = useWallet();

  /*
   * =========================================================
   * USER
   * =========================================================
   */

  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    pageLoading,
    setPageLoading,
  ] =
    useState(true);

  const [
    openProfile,
    setOpenProfile,
  ] =
    useState(false);

  /*
   * =========================================================
   * ENROLLMENTS
   * =========================================================
   */

  const [
    enrollments,
    setEnrollments,
  ] =
    useState<Enrollment[]>(
      []
    );

  const [
    enrollmentsLoading,
    setEnrollmentsLoading,
  ] =
    useState(false);

  const [
    enrollmentsError,
    setEnrollmentsError,
  ] =
    useState("");

  /*
   * =========================================================
   * LOAD PROFILE
   * =========================================================
   */

  useEffect(() => {
    async function loadProfile() {
      try {
        const response =
          await fetch(
            "/api/profile",
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
              () => null
            );

        if (
          !response.ok ||
          !data?.success
        ) {
          setUser(null);

          return;
        }

        setUser(
          data.user
        );
      } catch (error) {
        console.error(
          "Load profile error:",
          error
        );

        setUser(null);
      } finally {
        setPageLoading(
          false
        );
      }
    }

    void loadProfile();
  }, []);

  /*
   * =========================================================
   * LOAD ENROLLMENTS
   * =========================================================
   */

  const loadEnrollments =
    useCallback(
      async () => {
        try {
          setEnrollmentsLoading(
            true
          );

          setEnrollmentsError(
            ""
          );

          const response =
            await fetch(
              "/api/enrollments",
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
                () => null
              );

          if (
            !response.ok ||
            !data?.success
          ) {
            setEnrollments(
              []
            );

            setEnrollmentsError(
              data?.message ||
                "ไม่สามารถโหลดรายการเรียนได้"
            );

            return;
          }

          setEnrollments(
            Array.isArray(
              data.enrollments
            )
              ? data.enrollments
              : []
          );
        } catch (error) {
          console.error(
            "Load enrollments error:",
            error
          );

          setEnrollments(
            []
          );

          setEnrollmentsError(
            "ไม่สามารถเชื่อมต่อเพื่อโหลดรายการเรียนได้"
          );
        } finally {
          setEnrollmentsLoading(
            false
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
    void loadEnrollments();
  }, [
    loadEnrollments,
  ]);

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  const activeCount =
    useMemo(
      () =>
        enrollments.filter(
          (
            enrollment
          ) =>
            enrollment.status ===
            "active"
        ).length,
      [
        enrollments,
      ]
    );

  const freeCount =
    useMemo(
      () =>
        enrollments.filter(
          (
            enrollment
          ) =>
            enrollment.paidAmount ===
            0
        ).length,
      [
        enrollments,
      ]
    );

  const paidCount =
    useMemo(
      () =>
        enrollments.filter(
          (
            enrollment
          ) =>
            enrollment.paidAmount >
            0
        ).length,
      [
        enrollments,
      ]
    );

  const totalPaid =
    useMemo(
      () =>
        enrollments.reduce(
          (
            total,
            enrollment
          ) =>
            total +
            enrollment.paidAmount,
          0
        ),
      [
        enrollments,
      ]
    );

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  async function logout() {
    /*
     * Wallet Connect เป็น React memory
     *
     * Logout แล้วล้างทันที
     * เพื่อให้ Account ถัดไปต้อง Connect ใหม่
     */
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

    router.push("/");

    router.refresh();
  }

  /*
   * =========================================================
   * PAGE LOADING
   * =========================================================
   */

  if (pageLoading) {
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
        <Loader2
          size={30}
          className="
            animate-spin
            text-violet-400
          "
        />
      </main>
    );
  }

  /*
   * =========================================================
   * NOT LOGIN
   * =========================================================
   */

  if (!user) {
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
        กรุณาเข้าสู่ระบบ
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
      {/* MAIN CONTENT */}
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
              My Learning
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              การเรียนของฉัน
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              ดูทักษะทั้งหมดที่คุณสมัครเรียนใน SkillChain
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            {/* Notification */}

            <button
              type="button"
              className="
                rounded-full
                border
                border-white/10
                bg-[#111a33]
                px-4
                py-3
                transition
                hover:bg-[#182442]
              "
            >
              <Bell
                size={18}
              />
            </button>

            {/* Profile */}

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
                  {user.name ||
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
                      {user.name ||
                        "User"}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      logout
                    }
                    className="
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

        <div
          className="
            relative
            mb-6
            overflow-hidden
            rounded-[32px]
            border
            border-violet-500/20
            bg-gradient-to-r
            from-[#171f4b]
            via-[#28245f]
            to-[#4a2678]
            p-7
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-72
              w-72
              rounded-full
              bg-violet-500/20
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              max-w-3xl
            "
          >
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
                text-violet-200
              "
            >
              <GraduationCap
                size={14}
              />

              Learn & Grow
            </div>

            <h2
              className="
                mt-4
                text-3xl
                font-bold
                leading-tight
              "
            >
              ความรู้ที่คุณเลือก
              <br />
              อยู่ที่นี่ทั้งหมด
            </h2>

            <p
              className="
                mt-3
                max-w-2xl
                text-sm
                leading-6
                text-slate-300
              "
            >
              ติดตามทักษะที่สมัครเรียน
              ดูสถานะการเรียน
              และตรวจสอบข้อมูลการชำระ SKT
              ของคุณได้จากที่เดียว
            </p>
          </div>
        </div>

        {/* ======================================= */}
        {/* STATS */}
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
          <StatCard
            label="ทักษะที่สมัคร"
            value={
              enrollments.length.toString()
            }
            icon={
              <BookOpen
                size={19}
              />
            }
          />

          <StatCard
            label="กำลังเรียน"
            value={
              activeCount.toString()
            }
            icon={
              <GraduationCap
                size={19}
              />
            }
          />

          <StatCard
            label="ทักษะฟรี"
            value={
              freeCount.toString()
            }
            icon={
              <CheckCircle2
                size={19}
              />
            }
          />

          <StatCard
            label="SKT ที่ชำระ"
            value={`${totalPaid.toLocaleString()} SKT`}
            icon={
              <Coins
                size={19}
              />
            }
          />
        </div>

        {/* ======================================= */}
        {/* LIBRARY HEADER */}
        {/* ======================================= */}

        <div
          className="
            mb-5
            flex
            flex-wrap
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
              Learning Library
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-bold
              "
            >
              ทักษะที่ฉันกำลังเรียน
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              ฟรี{" "}
              {freeCount}{" "}
              • ชำระเงิน{" "}
              {paidCount}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadEnrollments()
            }
            disabled={
              enrollmentsLoading
            }
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-2.5
              text-sm
              text-slate-300
              transition
              hover:bg-white/10
              hover:text-white
              disabled:opacity-40
            "
          >
            <RefreshCw
              size={16}
              className={
                enrollmentsLoading
                  ? "animate-spin"
                  : ""
              }
            />

            รีเฟรช
          </button>
        </div>

        {/* ======================================= */}
        {/* LOADING */}
        {/* ======================================= */}

        {enrollmentsLoading && (
          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              rounded-[28px]
              border
              border-white/10
              bg-[#101734]
            "
          >
            <Loader2
              size={30}
              className="
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
              กำลังโหลดรายการเรียน...
            </p>
          </div>
        )}

        {/* ======================================= */}
        {/* ERROR */}
        {/* ======================================= */}

        {!enrollmentsLoading &&
          enrollmentsError && (
            <div
              className="
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/10
                p-5
                text-sm
                text-red-300
              "
            >
              {enrollmentsError}
            </div>
          )}

        {/* ======================================= */}
        {/* EMPTY */}
        {/* ======================================= */}

        {!enrollmentsLoading &&
          !enrollmentsError &&
          enrollments.length ===
            0 && (
            <div
              className="
                flex
                min-h-[360px]
                flex-col
                items-center
                justify-center
                rounded-[28px]
                border
                border-white/10
                bg-[#101734]
                text-center
              "
            >
              <div
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-500/10
                  text-violet-300
                "
              >
                <GraduationCap
                  size={30}
                />
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-semibold
                "
              >
                ยังไม่มีทักษะที่สมัครเรียน
              </h3>

              <p
                className="
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                ไปที่เมนูค้นหาทักษะ
                แล้วเลือก Skill
                ที่คุณสนใจได้เลย
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/skills"
                  )
                }
                className="
                  mt-5
                  rounded-xl
                  bg-violet-600
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-violet-500
                "
              >
                ไปค้นหาทักษะ
              </button>
            </div>
          )}

        {/* ======================================= */}
        {/* ENROLLMENT GRID */}
        {/* ======================================= */}

        {!enrollmentsLoading &&
          !enrollmentsError &&
          enrollments.length >
            0 && (
            <div
              className="
                grid
                gap-5
                xl:grid-cols-2
              "
            >
              {enrollments.map(
                (
                  enrollment
                ) => (
                  <LearningCard
                    key={
                      enrollment.id
                    }
                    enrollment={
                      enrollment
                    }
                  />
                )
              )}
            </div>
          )}
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
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
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
          items-start
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
            {label}
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

        <div
          className="
            flex
            h-10
            w-10
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
 * LEARNING CARD
 * =========================================================
 */

function LearningCard({
  enrollment,
}: {
  enrollment: Enrollment;
}) {
  const router =
    useRouter();

  const skill =
    enrollment.skill;

  const ownerName =
    skill.owner.name
      ?.trim() ||
    `ผู้สอน #${skill.owner.id}`;

  const isFree =
    enrollment.paidAmount ===
    0;

  const isActive =
    enrollment.status ===
    "active";

  const isCompleted =
    enrollment.status ===
    "completed";

  /*
   * =========================================================
   * COURSE PROGRESS
   * =========================================================
   */

  const [
    progress,
    setProgress,
  ] =
    useState<CourseProgress | null>(
      null
    );

  const [
    progressLoading,
    setProgressLoading,
  ] =
    useState(true);

  const [
    progressError,
    setProgressError,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function loadProgress() {
      try {
        setProgressLoading(
          true
        );

        setProgressError(
          false
        );

        const response =
          await fetch(
            `/api/lesson-progress?skillId=${skill.id}`,
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
              () => null
            );

        if (
          !response.ok ||
          !data?.success
        ) {
          if (
            !cancelled
          ) {
            setProgress(
              null
            );

            setProgressError(
              true
            );
          }

          return;
        }

        if (
          cancelled
        ) {
          return;
        }

        setProgress({
          totalLessons:
            Number(
              data
                .courseProgress
                ?.totalLessons ??
                0
            ),

          completedLessons:
            Number(
              data
                .courseProgress
                ?.completedLessons ??
                0
            ),

          percent:
            Number(
              data
                .courseProgress
                ?.percent ??
                0
            ),
        });
      } catch (error) {
        console.error(
          `Load progress Skill #${skill.id} error:`,
          error
        );

        if (
          !cancelled
        ) {
          setProgress(
            null
          );

          setProgressError(
            true
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setProgressLoading(
            false
          );
        }
      }
    }

    void loadProgress();

    return () => {
      cancelled =
        true;
    };
  }, [
    skill.id,
  ]);

  /*
   * =========================================================
   * BUTTON LABEL
   * =========================================================
   */

  const courseButtonLabel =
    progress &&
    progress.percent >=
      100
      ? "ทบทวนบทเรียน"
      : progress &&
          progress.percent >
            0
        ? "เรียนต่อ"
        : "เข้าเรียน";

  /*
   * =========================================================
   * STATUS LABEL
   * =========================================================
   */

  const statusLabel =
    isCompleted
      ? "เรียนครบแล้ว"
      : isActive
        ? "กำลังเรียน"
        : enrollment.status;

  return (
    <article
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-[#101734]
      "
    >
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div
        className="
          border-b
          border-white/5
          bg-gradient-to-r
          from-violet-500/10
          via-indigo-500/5
          to-transparent
          p-5
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
            className="
              flex
              min-w-0
              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-violet-500/15
                text-violet-300
              "
            >
              <BookOpen
                size={21}
              />
            </div>

            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-violet-400
                "
              >
                Skill #{skill.id}
              </p>

              <h3
                className="
                  mt-1
                  text-lg
                  font-bold
                  text-white
                "
              >
                {skill.title}
              </h3>
            </div>
          </div>

          <div
            className={`
              shrink-0
              rounded-full
              px-3
              py-1.5
              text-xs
              font-semibold

              ${
                isCompleted
                  ? "bg-violet-500/10 text-violet-300"
                  : isActive
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-white/5 text-slate-400"
              }
            `}
          >
            {statusLabel}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* BODY */}
      {/* ========================================= */}

      <div
        className="
          p-5
        "
      >
        <p
          className="
            line-clamp-3
            text-sm
            leading-6
            text-slate-400
          "
        >
          {skill.description}
        </p>

        {/* ======================================= */}
        {/* PROGRESS */}
        {/* ======================================= */}

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-violet-500/20
            bg-violet-500/5
            p-4
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
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              {progress &&
              progress.percent ===
                100 ? (
                <CheckCircle2
                  size={17}
                  className="
                    text-emerald-400
                  "
                />
              ) : (
                <PlayCircle
                  size={17}
                  className="
                    text-violet-300
                  "
                />
              )}

              <p
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >
                ความคืบหน้าการเรียน
              </p>
            </div>

            {progressLoading ? (
              <Loader2
                size={16}
                className="
                  animate-spin
                  text-violet-300
                "
              />
            ) : progress ? (
              <p
                className="
                  text-lg
                  font-bold
                  text-violet-300
                "
              >
                {progress.percent}%
              </p>
            ) : null}
          </div>

          {progressLoading ? (
            <p
              className="
                mt-3
                text-xs
                text-slate-500
              "
            >
              กำลังโหลดความคืบหน้า...
            </p>
          ) : progressError ? (
            <p
              className="
                mt-3
                text-xs
                text-slate-500
              "
            >
              ไม่สามารถโหลดความคืบหน้าได้
              แต่ยังสามารถเข้าเรียนได้
            </p>
          ) : progress ? (
            <>
              <div
                className="
                  mt-3
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-white/10
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-violet-400
                    transition-all
                    duration-500
                  "
                  style={{
                    width:
                      `${progress.percent}%`,
                  }}
                />
              </div>

              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-between
                  gap-3
                  text-xs
                  text-slate-500
                "
              >
                <span>
                  {progress.totalLessons >
                  0
                    ? `${progress.completedLessons}/${progress.totalLessons} บท`
                    : "ยังไม่มีบทเรียน"}
                </span>

                {progress.percent ===
                  100 && (
                  <span
                    className="
                      font-semibold
                      text-emerald-300
                    "
                  >
                    เรียนครบแล้ว
                  </span>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ======================================= */}
        {/* INFO GRID */}
        {/* ======================================= */}

        <div
          className="
            mt-5
            grid
            gap-3
            sm:grid-cols-2
          "
        >
          {/* Teacher */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >
              <UserRound
                size={14}
              />

              ผู้สอน
            </div>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-white
              "
            >
              {ownerName}
            </p>
          </div>

          {/* Payment */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >
              <Coins
                size={14}
              />

              ค่าเรียน
            </div>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-violet-300
              "
            >
              {isFree
                ? "ฟรี"
                : `${enrollment.paidAmount.toLocaleString()} SKT`}
            </p>
          </div>

          {/* Enrollment Date */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >
              <Clock3
                size={14}
              />

              สมัครเมื่อ
            </div>

            <p
              className="
                mt-2
                text-sm
                text-slate-300
              "
            >
              {formatDateTime(
                enrollment.createdAt
              )}
            </p>
          </div>

          {/* Enrollment ID */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >
              <GraduationCap
                size={14}
              />

              Enrollment
            </div>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-slate-300
              "
            >
              #{enrollment.id}
            </p>
          </div>
        </div>

        {/* ======================================= */}
        {/* TX HASH */}
        {/* ======================================= */}

        {enrollment.paymentTxHash && (
          <div
            className="
              mt-3
              rounded-2xl
              border
              border-violet-500/20
              bg-violet-500/5
              p-4
            "
          >
            <p
              className="
                text-xs
                text-slate-500
              "
            >
              Transaction การชำระ
            </p>

            <p
              className="
                mt-2
                break-all
                font-mono
                text-xs
                leading-5
                text-violet-200
              "
            >
              {enrollment.paymentTxHash}
            </p>

            <a
              href={`https://testnet.bscscan.com/tx/${enrollment.paymentTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="
                mt-3
                inline-flex
                items-center
                gap-1.5
                text-xs
                font-semibold
                text-violet-300
                transition
                hover:text-violet-200
              "
            >
              ดู Transaction บน BscScan

              <ExternalLink
                size={13}
              />
            </a>
          </div>
        )}

        {/* ======================================= */}
        {/* COURSE ACCESS */}
        {/* ======================================= */}

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-white/10
            bg-[#0b1028]
            p-4
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-violet-500/10
                text-violet-300
              "
            >
              <GraduationCap
                size={18}
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >
                เนื้อหาการเรียน
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                เข้าเรียนเนื้อหาที่ผู้สอนจัดเตรียมไว้
                และระบบจะบันทึกความคืบหน้าของคุณ
                ในแต่ละบทเรียนโดยอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/learning/${skill.id}`
              )
            }
            className="
              mt-4
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
              text-white
              transition
              hover:bg-violet-500
            "
          >
            {progress &&
            progress.percent ===
              100 ? (
              <CheckCircle2
                size={17}
              />
            ) : (
              <BookOpen
                size={17}
              />
            )}

            {courseButtonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "th-TH",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}