"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  ExternalLink,
  Loader2,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
  UserRound,
  Video,
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

type Skill = {
  id: number;
  title: string;
  description: string;

  owner: {
    id: number;
    name: string | null;
  };
};

type Enrollment = {
  id: number;
  status: string;
  createdAt: string;
};

type CourseProgress = {
  totalLessons: number;
  completedLessons: number;
  percent: number;
};

type LessonProgress = {
  id: number | null;

  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | string;

  lastViewedAt:
    | string
    | null;

  completedAt:
    | string
    | null;
};

type Lesson = {
  id: number;
  skillId: number;
  title: string;
  content: string;

  videoUrl:
    | string
    | null;

  position: number;

  createdAt: string;
  updatedAt: string;

  progress:
    LessonProgress;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function LearningCoursePage() {
  const router =
    useRouter();

  const params =
    useParams();

  const {
    resetWallet,
  } = useWallet();

  /*
   * =========================================================
   * SKILL ID
   * =========================================================
   */

  const rawSkillId =
    Array.isArray(
      params.skillId
    )
      ? params.skillId[0]
      : params.skillId;

  const skillId =
    Number(
      rawSkillId
    );

  /*
   * =========================================================
   * PROFILE
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
    profileLoading,
    setProfileLoading,
  ] =
    useState(true);

  const [
    openProfile,
    setOpenProfile,
  ] =
    useState(false);

  /*
   * =========================================================
   * COURSE
   * =========================================================
   */

  const [
    skill,
    setSkill,
  ] =
    useState<Skill | null>(
      null
    );

  const [
    enrollment,
    setEnrollment,
  ] =
    useState<Enrollment | null>(
      null
    );

  const [
    lessons,
    setLessons,
  ] =
    useState<Lesson[]>(
      []
    );

  const [
    courseProgress,
    setCourseProgress,
  ] =
    useState<CourseProgress>({
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
    });

  const [
    courseLoading,
    setCourseLoading,
  ] =
    useState(true);

  const [
    courseError,
    setCourseError,
  ] =
    useState("");

  /*
   * =========================================================
   * ACTIVE LESSON
   * =========================================================
   */

  const [
    activeLessonId,
    setActiveLessonId,
  ] =
    useState<number | null>(
      null
    );

  /*
   * =========================================================
   * ACTION
   * =========================================================
   */

  const [
    actionLessonId,
    setActionLessonId,
  ] =
    useState<number | null>(
      null
    );

  const [
    actionError,
    setActionError,
  ] =
    useState("");

  const [
    actionSuccess,
    setActionSuccess,
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
        setProfileLoading(
          false
        );
      }
    }

    void loadProfile();
  }, []);

  /*
   * =========================================================
   * LESSON LOCK
   * =========================================================
   */

  const isLessonLocked =
    useCallback(
      (
        lesson: Lesson,
        lessonList:
          Lesson[] = lessons
      ) => {
        if (
          lesson.position ===
          1
        ) {
          return false;
        }

        const previousLessons =
          lessonList.filter(
            (
              item
            ) =>
              item.position <
              lesson.position
          );

        return !previousLessons.every(
          (
            item
          ) =>
            item.progress
              .status ===
            "completed"
        );
      },
      [
        lessons,
      ]
    );

  /*
   * =========================================================
   * LOAD COURSE
   * =========================================================
   */

  const loadCourse =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            skillId
          ) ||
          skillId <= 0
        ) {
          setCourseError(
            "Skill ID ไม่ถูกต้อง"
          );

          setCourseLoading(
            false
          );

          return;
        }

        try {
          setCourseLoading(
            true
          );

          setCourseError(
            ""
          );

          const response =
            await fetch(
              `/api/lesson-progress?skillId=${skillId}`,
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
            setCourseError(
              data?.message ||
                "ไม่สามารถโหลดคอร์สได้"
            );

            return;
          }

          const loadedLessons:
            Lesson[] =
            Array.isArray(
              data.lessons
            )
              ? data.lessons
              : [];

          setSkill(
            data.skill ??
              null
          );

          setEnrollment(
            data.enrollment ??
              null
          );

          setLessons(
            loadedLessons
          );

          setCourseProgress(
            data.courseProgress ?? {
              totalLessons:
                loadedLessons.length,

              completedLessons:
                0,

              percent:
                0,
            }
          );

          /*
           * ===============================================
           * ถ้าไม่มีบทเรียน
           * ===============================================
           */

          if (
            loadedLessons.length ===
            0
          ) {
            setActiveLessonId(
              null
            );

            return;
          }

          /*
           * ===============================================
           * ถ้ามีบทที่กำลังเรียน
           * ===============================================
           */

          const inProgressLesson =
            loadedLessons.find(
              (
                lesson
              ) =>
                lesson.progress
                  .status ===
                "in_progress" &&
                !isLockedFromList(
                  lesson,
                  loadedLessons
                )
            );

          if (
            inProgressLesson
          ) {
            setActiveLessonId(
              inProgressLesson.id
            );

            return;
          }

          /*
           * ===============================================
           * หาบทแรกที่ยังไม่จบและไม่ล็อก
           * ===============================================
           */

          const nextAvailableLesson =
            loadedLessons.find(
              (
                lesson
              ) =>
                lesson.progress
                  .status !==
                  "completed" &&
                !isLockedFromList(
                  lesson,
                  loadedLessons
                )
            );

          if (
            nextAvailableLesson
          ) {
            setActiveLessonId(
              nextAvailableLesson.id
            );

            return;
          }

          /*
           * ===============================================
           * ถ้าจบหมดแล้ว
           * เปิดบทแรกให้ทบทวน
           * ===============================================
           */

          setActiveLessonId(
            loadedLessons[0].id
          );
        } catch (error) {
          console.error(
            "Load course error:",
            error
          );

          setCourseError(
            "เกิดข้อผิดพลาดในการโหลดคอร์ส"
          );
        } finally {
          setCourseLoading(
            false
          );
        }
      },
      [
        skillId,
      ]
    );

  useEffect(() => {
    void loadCourse();
  }, [
    loadCourse,
  ]);

  /*
   * =========================================================
   * ACTIVE LESSON
   * =========================================================
   */

  const activeLesson =
    useMemo(
      () =>
        lessons.find(
          (
            lesson
          ) =>
            lesson.id ===
            activeLessonId
        ) ??
        null,
      [
        lessons,
        activeLessonId,
      ]
    );

  const activeIndex =
    useMemo(
      () =>
        activeLesson
          ? lessons.findIndex(
              (
                lesson
              ) =>
                lesson.id ===
                activeLesson.id
            )
          : -1,
      [
        lessons,
        activeLesson,
      ]
    );

  const previousLesson =
    activeIndex >
    0
      ? lessons[
          activeIndex -
            1
        ]
      : null;

  const nextLesson =
    activeIndex >=
      0 &&
    activeIndex <
      lessons.length -
        1
      ? lessons[
          activeIndex +
            1
        ]
      : null;

  /*
   * =========================================================
   * OPEN LESSON
   * =========================================================
   */

  async function openLesson(
    lesson: Lesson
  ) {
    setActionError("");
    setActionSuccess("");

    if (
      isLessonLocked(
        lesson
      )
    ) {
      setActionError(
        `กรุณาเรียนบทก่อนหน้าให้จบก่อน จึงจะเปิดบทที่ ${lesson.position} ได้`
      );

      return;
    }

    setActiveLessonId(
      lesson.id
    );

    /*
     * ถ้าเริ่มแล้วหรือจบแล้ว
     * ไม่ต้อง start ซ้ำ
     */
    if (
      lesson.progress
        .status !==
      "not_started"
    ) {
      return;
    }

    try {
      setActionLessonId(
        lesson.id
      );

      const response =
        await fetch(
          "/api/lesson-progress",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId:
                  lesson.id,

                action:
                  "start",
              }),
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
        setActionError(
          data?.message ||
            "ไม่สามารถเปิดบทเรียนได้"
        );

        return;
      }

      setLessons(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
              lesson.id
                ? {
                    ...item,

                    progress: {
                      ...item.progress,

                      ...data.progress,

                      status:
                        data.progress
                          ?.status ??
                        "in_progress",
                    },
                  }
                : item
          )
      );

      if (
        data.courseProgress
      ) {
        setCourseProgress(
          data.courseProgress
        );
      }
    } catch (error) {
      console.error(
        "Start lesson error:",
        error
      );

      setActionError(
        "เกิดข้อผิดพลาดในการเปิดบทเรียน"
      );
    } finally {
      setActionLessonId(
        null
      );
    }
  }

  /*
   * =========================================================
   * COMPLETE LESSON
   * =========================================================
   */

  async function completeLesson() {
    if (!activeLesson) {
      return;
    }

    if (
      activeLesson.progress
        .status ===
      "completed"
    ) {
      return;
    }

    setActionError("");
    setActionSuccess("");

    try {
      setActionLessonId(
        activeLesson.id
      );

      /*
       * ===============================================
       * COMPLETE CURRENT
       * ===============================================
       */

      const response =
        await fetch(
          "/api/lesson-progress",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId:
                  activeLesson.id,

                action:
                  "complete",
              }),
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
        setActionError(
          data?.message ||
            "ไม่สามารถบันทึกว่าจบบทเรียนได้"
        );

        return;
      }

      setLessons(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
              activeLesson.id
                ? {
                    ...item,

                    progress: {
                      ...item.progress,

                      ...data.progress,

                      status:
                        "completed",
                    },
                  }
                : item
          )
      );

      if (
        data.courseProgress
      ) {
        setCourseProgress(
          data.courseProgress
        );
      }

      /*
       * ===============================================
       * LAST LESSON
       * ===============================================
       */

      if (!nextLesson) {
        setActionSuccess(
          data.message ||
            "เรียนครบทุกบทแล้ว"
        );

        if (
          data.enrollmentStatus
        ) {
          setEnrollment(
            (
              current
            ) =>
              current
                ? {
                    ...current,

                    status:
                      data.enrollmentStatus,
                  }
                : current
          );
        }

        return;
      }

      /*
       * ===============================================
       * START NEXT LESSON
       * ===============================================
       */

      const startResponse =
        await fetch(
          "/api/lesson-progress",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId:
                  nextLesson.id,

                action:
                  "start",
              }),
          }
        );

      const startData =
        await startResponse
          .json()
          .catch(
            () => null
          );

      if (
        !startResponse.ok ||
        !startData?.success
      ) {
        await loadCourse();

        setActionError(
          startData?.message ||
            "เรียนจบบทนี้แล้ว แต่ไม่สามารถเปิดบทถัดไปอัตโนมัติได้"
        );

        return;
      }

      setLessons(
        (
          current
        ) =>
          current.map(
            (
              item
            ) => {
              if (
                item.id ===
                activeLesson.id
              ) {
                return {
                  ...item,

                  progress: {
                    ...item.progress,

                    status:
                      "completed",

                    completedAt:
                      data.progress
                        ?.completedAt ??
                      new Date()
                        .toISOString(),
                  },
                };
              }

              if (
                item.id ===
                nextLesson.id
              ) {
                return {
                  ...item,

                  progress: {
                    ...item.progress,

                    ...startData.progress,

                    status:
                      startData.progress
                        ?.status ??
                      "in_progress",
                  },
                };
              }

              return item;
            }
          )
      );

      setActiveLessonId(
        nextLesson.id
      );

      if (
        startData.courseProgress
      ) {
        setCourseProgress(
          startData.courseProgress
        );
      }

      setActionSuccess(
        `เรียนจบบทที่ ${activeLesson.position} แล้ว เปิดบทที่ ${nextLesson.position} ให้แล้ว`
      );
    } catch (error) {
      console.error(
        "Complete lesson error:",
        error
      );

      setActionError(
        "เกิดข้อผิดพลาดในการบันทึกความคืบหน้า"
      );
    } finally {
      setActionLessonId(
        null
      );
    }
  }

  /*
   * =========================================================
   * PREVIOUS
   * =========================================================
   */

  function goPrevious() {
    if (!previousLesson) {
      return;
    }

    void openLesson(
      previousLesson
    );
  }

  /*
   * =========================================================
   * NEXT
   * =========================================================
   */

  function goNext() {
    if (!nextLesson) {
      return;
    }

    if (
      activeLesson?.progress
        .status !==
      "completed"
    ) {
      setActionError(
        "กรุณากดเรียนจบบทนี้ก่อน เพื่อปลดล็อกบทถัดไป"
      );

      return;
    }

    void openLesson(
      nextLesson
    );
  }

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

    router.push("/");

    router.refresh();
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (
    profileLoading ||
    courseLoading
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
              mt-3
              text-sm
              text-slate-400
            "
          >
            กำลังโหลดบทเรียน...
          </p>
        </div>
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
   * ERROR
   * =========================================================
   */

  if (
    courseError &&
    !skill
  ) {
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
        <aside
          className="
            h-screen
            shrink-0
          "
        >
          <Sidebar />
        </aside>

        <section
          className="
            flex
            flex-1
            items-center
            justify-center
            p-6
          "
        >
          <div
            className="
              max-w-lg
              rounded-3xl
              border
              border-red-500/20
              bg-red-500/10
              p-8
              text-center
            "
          >
            <p
              className="
                text-red-300
              "
            >
              {courseError}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/learning"
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
                transition
                hover:bg-violet-500
              "
            >
              กลับการเรียนของฉัน
            </button>
          </div>
        </section>
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
        "
      >
        <Sidebar />
      </aside>

      {/* ========================================= */}
      {/* PAGE */}
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
          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/learning"
                )
              }
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-[#111a33]
                text-slate-300
                transition
                hover:bg-[#182442]
                hover:text-white
              "
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <div>
              <p
                className="
                  text-xs
                  text-violet-300
                "
              >
                Learning Classroom
              </p>

              <h1
                className="
                  text-2xl
                  font-bold
                "
              >
                เข้าเรียน
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-400
                "
              >
                {skill?.title}
              </p>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
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

                  <div
                    className="
                      my-3
                      h-px
                      bg-white/10
                    "
                  />

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
            rounded-[30px]
            border
            border-violet-500/20
            bg-gradient-to-r
            from-[#171f4b]
            via-[#28245f]
            to-[#4a2678]
            p-6
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-16
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
              flex
              flex-col
              justify-between
              gap-6
              lg:flex-row
              lg:items-center
            "
          >
            <div
              className="
                min-w-0
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
                <BookOpen
                  size={13}
                />

                My Course
              </div>

              <h2
                className="
                  mt-4
                  text-2xl
                  font-bold
                "
              >
                {skill?.title}
              </h2>

              <p
                className="
                  mt-2
                  max-w-3xl
                  text-sm
                  leading-6
                  text-slate-300
                "
              >
                {skill?.description}
              </p>

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-5
                  text-xs
                  text-slate-300
                "
              >
                <span
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <UserRound
                    size={14}
                  />

                  {skill?.owner
                    .name ||
                    "ผู้สอน"}
                </span>

                <span>
                  Enrollment #
                  {enrollment?.id}
                </span>
              </div>
            </div>

            {/* PROGRESS */}

            <div
              className="
                w-full
                shrink-0
                rounded-2xl
                border
                border-white/10
                bg-black/10
                p-4
                lg:w-52
              "
            >
              <p
                className="
                  text-xs
                  text-slate-300
                "
              >
                ความคืบหน้า
              </p>

              <div
                className="
                  mt-1
                  flex
                  items-end
                  justify-between
                "
              >
                <span
                  className="
                    text-3xl
                    font-bold
                  "
                >
                  {courseProgress.percent}
                  %
                </span>

                <span
                  className="
                    text-xs
                    text-violet-200
                  "
                >
                  {
                    courseProgress.completedLessons
                  }
                  /
                  {
                    courseProgress.totalLessons
                  }{" "}
                  บท
                </span>
              </div>

              <div
                className="
                  mt-4
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-white/10
                "
              >
                <div
                  style={{
                    width:
                      `${Math.min(
                        100,
                        Math.max(
                          0,
                          courseProgress.percent
                        )
                      )}%`,
                  }}
                  className="
                    h-full
                    rounded-full
                    bg-violet-400
                    transition-all
                    duration-300
                  "
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* MESSAGES */}
        {/* ======================================= */}

        {actionError && (
          <div
            className="
              mb-4
              rounded-xl
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-3
              text-sm
              text-red-300
            "
          >
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div
            className="
              mb-4
              rounded-xl
              border
              border-emerald-500/20
              bg-emerald-500/10
              px-4
              py-3
              text-sm
              text-emerald-300
            "
          >
            {actionSuccess}
          </div>
        )}

        {/* ======================================= */}
        {/* COURSE */}
        {/* ======================================= */}

        <div
          className="
            grid
            gap-6
            xl:grid-cols-[300px_1fr]
          "
        >
          {/* ===================================== */}
          {/* LESSON LIST */}
          {/* ===================================== */}

          <div
            className="
              self-start
              rounded-[26px]
              border
              border-white/10
              bg-[#101734]
              p-4
            "
          >
            <div
              className="
                mb-4
                flex
                items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    text-violet-300
                  "
                >
                  Course Content
                </p>

                <h3
                  className="
                    mt-1
                    font-bold
                  "
                >
                  บทเรียนทั้งหมด
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  {lessons.length}
                  {" "}
                  บทเรียน
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadCourse()
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  text-slate-400
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <RefreshCw
                  size={15}
                />
              </button>
            </div>

            {lessons.length ===
            0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-5
                  text-center
                  text-sm
                  text-slate-500
                "
              >
                ยังไม่มีบทเรียน
              </div>
            ) : (
              <div
                className="
                  space-y-2
                "
              >
                {lessons.map(
                  (
                    lesson
                  ) => {
                    const locked =
                      isLessonLocked(
                        lesson
                      );

                    const active =
                      lesson.id ===
                      activeLessonId;

                    const completed =
                      lesson.progress
                        .status ===
                      "completed";

                    const inProgress =
                      lesson.progress
                        .status ===
                      "in_progress";

                    const busy =
                      actionLessonId ===
                      lesson.id;

                    return (
                      <button
                        key={
                          lesson.id
                        }
                        type="button"
                        disabled={
                          locked ||
                          busy
                        }
                        onClick={() =>
                          void openLesson(
                            lesson
                          )
                        }
                        className={`
                          w-full
                          rounded-2xl
                          border
                          p-4
                          text-left
                          transition

                          ${
                            active
                              ? "border-violet-500/50 bg-violet-500/15"
                              : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
                          }

                          ${
                            locked
                              ? "cursor-not-allowed opacity-40"
                              : ""
                          }
                        `}
                      >
                        <div
                          className="
                            flex
                            gap-3
                          "
                        >
                          <div
                            className={`
                              mt-0.5
                              flex
                              h-7
                              w-7
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border

                              ${
                                completed
                                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                                  : inProgress
                                  ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                                  : "border-white/10 bg-white/5 text-slate-500"
                              }
                            `}
                          >
                            {busy ? (
                              <Loader2
                                size={13}
                                className="
                                  animate-spin
                                "
                              />
                            ) : locked ? (
                              <LockKeyhole
                                size={13}
                              />
                            ) : completed ? (
                              <Check
                                size={14}
                              />
                            ) : (
                              <PlayCircle
                                size={13}
                              />
                            )}
                          </div>

                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >
                            <p
                              className="
                                text-[9px]
                                uppercase
                                tracking-[0.15em]
                                text-slate-500
                              "
                            >
                              Lesson{" "}
                              {lesson.position}
                            </p>

                            <p
                              className="
                                mt-1
                                line-clamp-2
                                text-sm
                                font-semibold
                                text-slate-200
                              "
                            >
                              {lesson.title}
                            </p>

                            <p
                              className="
                                mt-1
                                text-[10px]
                                text-slate-500
                              "
                            >
                              {locked
                                ? "เรียนบทก่อนหน้าให้จบก่อน"
                                : completed
                                ? "เรียนจบแล้ว"
                                : inProgress
                                ? "กำลังเรียน"
                                : "ยังไม่ได้เริ่ม"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* ===================================== */}
          {/* ACTIVE LESSON */}
          {/* ===================================== */}

          <div
            className="
              min-h-[500px]
              rounded-[26px]
              border
              border-white/10
              bg-[#101734]
              p-6
            "
          >
            {!activeLesson ? (
              <div
                className="
                  flex
                  min-h-[450px]
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                <BookOpen
                  size={42}
                  className="
                    text-violet-400
                  "
                />

                <h3
                  className="
                    mt-4
                    text-lg
                    font-semibold
                  "
                >
                  ยังไม่มีบทเรียน
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                  "
                >
                  รอผู้สอนเพิ่มเนื้อหาบทเรียนก่อนนะ
                </p>
              </div>
            ) : (
              <>
                {/* LESSON HEADER */}

                <div
                  className="
                    flex
                    flex-wrap
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-violet-400
                      "
                    >
                      Lesson{" "}
                      {
                        activeLesson.position
                      }
                      {" • "}
                      บทที่{" "}
                      {
                        activeLesson.position
                      }{" "}
                      จาก{" "}
                      {
                        lessons.length
                      }
                    </p>

                    <h2
                      className="
                        mt-2
                        text-2xl
                        font-bold
                      "
                    >
                      {
                        activeLesson.title
                      }
                    </h2>
                  </div>

                  <LessonStatusBadge
                    status={
                      activeLesson
                        .progress
                        .status
                    }
                  />
                </div>

                {/* ================================= */}
                {/* VIDEO */}
                {/* ================================= */}

                {activeLesson.videoUrl && (
                  <LessonVideo
                    url={
                      activeLesson.videoUrl
                    }
                  />
                )}

                {/* ================================= */}
                {/* CONTENT */}
                {/* ================================= */}

                <div
                  className="
                    mt-6
                    min-h-[190px]
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#0b1028]
                    p-6
                  "
                >
                  <p
                    className="
                      whitespace-pre-wrap
                      text-sm
                      leading-7
                      text-slate-200
                    "
                  >
                    {
                      activeLesson.content
                    }
                  </p>
                </div>

                {/* ================================= */}
                {/* COMPLETE */}
                {/* ================================= */}

                <div
                  className="
                    mt-6
                    border-t
                    border-white/10
                    pt-5
                  "
                >
                  {activeLesson
                    .progress
                    .status ===
                  "completed" ? (
                    <div
                      className="
                        flex
                        h-12
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-emerald-500/20
                        bg-emerald-500/10
                        font-semibold
                        text-emerald-300
                      "
                    >
                      <CheckCircle2
                        size={18}
                      />

                      เรียนจบบทนี้แล้ว
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void completeLesson()
                      }
                      disabled={
                        actionLessonId ===
                        activeLesson.id
                      }
                      className="
                        flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-violet-600
                        font-semibold
                        text-white
                        transition
                        hover:bg-violet-500
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {actionLessonId ===
                      activeLesson.id ? (
                        <>
                          <Loader2
                            size={18}
                            className="
                              animate-spin
                            "
                          />

                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={18}
                          />

                          เรียนจบบทนี้
                        </>
                      )}
                    </button>
                  )}

                  {/* PREVIOUS / NEXT */}

                  <div
                    className="
                      mt-3
                      grid
                      gap-3
                      sm:grid-cols-2
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        goPrevious
                      }
                      disabled={
                        !previousLesson
                      }
                      className="
                        flex
                        h-11
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        text-sm
                        font-semibold
                        text-slate-300
                        transition
                        hover:bg-white/10
                        hover:text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                    >
                      <ChevronLeft
                        size={17}
                      />

                      บทก่อนหน้า
                    </button>

                    <button
                      type="button"
                      onClick={
                        goNext
                      }
                      disabled={
                        !nextLesson ||
                        activeLesson
                          .progress
                          .status !==
                          "completed" ||
                        (nextLesson
                          ? isLessonLocked(
                              nextLesson
                            )
                          : true)
                      }
                      className="
                        flex
                        h-11
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        text-sm
                        font-semibold
                        text-slate-300
                        transition
                        hover:bg-white/10
                        hover:text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                    >
                      บทถัดไป

                      <ChevronRight
                        size={17}
                      />
                    </button>
                  </div>

                  {nextLesson &&
                    activeLesson
                      .progress
                      .status !==
                      "completed" && (
                      <p
                        className="
                          mt-3
                          text-center
                          text-xs
                          text-slate-600
                        "
                      >
                        กด{" "}
                        “เรียนจบบทนี้”{" "}
                        เพื่อปลดล็อกบทถัดไป
                      </p>
                    )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/*
 * =========================================================
 * LESSON STATUS BADGE
 * =========================================================
 */

function LessonStatusBadge({
  status,
}: {
  status: string;
}) {
  if (
    status ===
    "completed"
  ) {
    return (
      <div
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-emerald-500/10
          px-3
          py-1.5
          text-xs
          font-semibold
          text-emerald-300
        "
      >
        <CheckCircle2
          size={13}
        />

        เรียนจบแล้ว
      </div>
    );
  }

  if (
    status ===
    "in_progress"
  ) {
    return (
      <div
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-violet-500/10
          px-3
          py-1.5
          text-xs
          font-semibold
          text-violet-300
        "
      >
        <CirclePlay
          size={13}
        />

        กำลังเรียน
      </div>
    );
  }

  return (
    <div
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-white/5
        px-3
        py-1.5
        text-xs
        font-semibold
        text-slate-400
      "
    >
      <CirclePlay
        size={13}
      />

      ยังไม่ได้เริ่ม
    </div>
  );
}

/*
 * =========================================================
 * LESSON VIDEO
 * =========================================================
 *
 * YouTube
 * => แสดง Player ในหน้าเรียน
 *
 * URL อื่น
 * => ปุ่มเปิดวิดีโอ
 */
function LessonVideo({
  url,
}: {
  url: string;
}) {
  const youtubeEmbedUrl =
    getYouTubeEmbedUrl(
      url
    );

  /*
   * =======================================================
   * YOUTUBE
   * =======================================================
   */

  if (
    youtubeEmbedUrl
  ) {
    return (
      <div
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-black
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-white/10
            bg-[#0b1028]
            px-4
            py-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <Video
              size={16}
              className="
                text-violet-300
              "
            />

            <span
              className="
                text-sm
                font-semibold
                text-slate-200
              "
            >
              วิดีโอบทเรียน
            </span>
          </div>

          <span
            className="
              rounded-full
              bg-red-500/10
              px-2.5
              py-1
              text-[10px]
              font-semibold
              text-red-300
            "
          >
            YouTube
          </span>
        </div>

        <div
          className="
            aspect-video
            w-full
            bg-black
          "
        >
          <iframe
            src={
              youtubeEmbedUrl
            }
            title="Lesson video"
            className="
              h-full
              w-full
              border-0
            "
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
              web-share
            "
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * OTHER URL
   * =======================================================
   */

  return (
    <div
      className="
        mt-6
        rounded-2xl
        border
        border-violet-500/20
        bg-violet-500/[0.06]
        p-5
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
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
              bg-violet-500/15
              text-violet-300
            "
          >
            <Video
              size={20}
            />
          </div>

          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                text-sm
                font-semibold
              "
            >
              วิดีโอบทเรียน
            </p>

            <p
              className="
                mt-1
                truncate
                text-xs
                text-slate-500
              "
            >
              {url}
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="
            inline-flex
            h-10
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-violet-600
            px-4
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-violet-500
          "
        >
          <ExternalLink
            size={15}
          />

          เปิดวิดีโอ
        </a>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * YOUTUBE URL -> EMBED URL
 * =========================================================
 *
 * รองรับ:
 *
 * https://youtu.be/VIDEO_ID
 *
 * https://youtu.be/VIDEO_ID?si=xxxxx
 *
 * https://youtube.com/watch?v=VIDEO_ID
 *
 * https://www.youtube.com/watch?v=VIDEO_ID
 *
 * https://m.youtube.com/watch?v=VIDEO_ID
 *
 * https://music.youtube.com/watch?v=VIDEO_ID
 *
 * https://youtube.com/shorts/VIDEO_ID
 *
 * https://youtube.com/live/VIDEO_ID
 *
 * https://youtube.com/embed/VIDEO_ID
 *
 * https://youtube-nocookie.com/embed/VIDEO_ID
 */
function getYouTubeEmbedUrl(
  rawUrl: string
) {
  /*
   * =======================================================
   * NORMALIZE
   * =======================================================
   */

  const normalizedUrl =
    String(
      rawUrl ?? ""
    )
      .trim()
      .replace(
        /&amp;/gi,
        "&"
      )
      .replace(
        /[\u200B-\u200D\uFEFF]/g,
        ""
      );

  if (!normalizedUrl) {
    return null;
  }

  let videoId:
    | string
    | null =
    null;

  /*
   * =======================================================
   * URL PARSER
   * =======================================================
   */

  try {
    const parsedUrl =
      new URL(
        normalizedUrl
      );

    const hostname =
      parsedUrl.hostname
        .toLowerCase()
        .replace(
          /^www\./,
          ""
        );

    const pathParts =
      parsedUrl.pathname
        .split("/")
        .filter(Boolean);

    /*
     * =====================================================
     * youtu.be/VIDEO_ID
     * =====================================================
     */

    if (
      hostname ===
      "youtu.be"
    ) {
      videoId =
        pathParts[0] ??
        null;
    }

    /*
     * =====================================================
     * youtube.com
     * =====================================================
     */

    if (
      hostname ===
        "youtube.com" ||
      hostname ===
        "m.youtube.com" ||
      hostname ===
        "music.youtube.com" ||
      hostname ===
        "youtube-nocookie.com"
    ) {
      /*
       * youtube.com/watch?v=
       */
      if (
        parsedUrl.pathname ===
        "/watch"
      ) {
        videoId =
          parsedUrl.searchParams.get(
            "v"
          );
      }

      /*
       * youtube.com/shorts/
       */
      if (
        pathParts[0] ===
        "shorts"
      ) {
        videoId =
          pathParts[1] ??
          null;
      }

      /*
       * youtube.com/live/
       */
      if (
        pathParts[0] ===
        "live"
      ) {
        videoId =
          pathParts[1] ??
          null;
      }

      /*
       * youtube.com/embed/
       */
      if (
        pathParts[0] ===
        "embed"
      ) {
        videoId =
          pathParts[1] ??
          null;
      }
    }
  } catch {
    /*
     * ถ้า URL parser อ่านไม่ได้
     * ยังไม่ return
     *
     * ด้านล่างมี Regex fallback
     */
  }

  /*
   * =======================================================
   * REGEX FALLBACK
   * =======================================================
   */

  if (!videoId) {
    const patterns:
      RegExp[] = [
      /*
       * youtu.be/VIDEO_ID
       */
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([A-Za-z0-9_-]+)/i,

      /*
       * youtube.com/watch?v=VIDEO_ID
       */
      /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:[^#\s]*&)?v=([A-Za-z0-9_-]+)/i,

      /*
       * youtube.com/shorts/VIDEO_ID
       */
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i,

      /*
       * youtube.com/live/VIDEO_ID
       */
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([A-Za-z0-9_-]+)/i,

      /*
       * youtube.com/embed/VIDEO_ID
       */
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]+)/i,

      /*
       * youtube-nocookie.com/embed/VIDEO_ID
       */
      /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]+)/i,
    ];

    for (
      const pattern of
      patterns
    ) {
      const match =
        normalizedUrl.match(
          pattern
        );

      if (
        match &&
        match[1]
      ) {
        videoId =
          match[1];

        break;
      }
    }
  }

  /*
   * =======================================================
   * CLEAN VIDEO ID
   * =======================================================
   */

  if (!videoId) {
    return null;
  }

  try {
    videoId =
      decodeURIComponent(
        videoId
      );
  } catch {
    /*
     * ใช้ค่าเดิม
     */
  }

  videoId =
    videoId
      .trim()
      .replace(
        /[\u200B-\u200D\uFEFF]/g,
        ""
      );

  /*
   * ตัด query/hash ที่อาจติดมา
   */
  videoId =
    videoId
      .split("?")[0]
      .split("&")[0]
      .split("#")[0];

  /*
   * YouTube ID ปกติจะยาว 11 ตัว
   *
   * แต่ไม่บังคับ 11 ตรง ๆ
   * เพื่อรองรับบาง URL รูปแบบอื่น
   */
  const cleanVideoId =
    videoId.match(
      /^[A-Za-z0-9_-]+$/
    )?.[0] ??
    null;

  if (!cleanVideoId) {
    return null;
  }

  /*
   * =======================================================
   * EMBED
   * =======================================================
   */

  return (
    "https://www.youtube.com/embed/" +
    cleanVideoId +
    "?rel=0"
  );
}

/*
 * =========================================================
 * LOCK CHECK FROM SUPPLIED LIST
 * =========================================================
 */

function isLockedFromList(
  lesson: Lesson,
  lessonList: Lesson[]
) {
  if (
    lesson.position ===
    1
  ) {
    return false;
  }

  const previousLessons =
    lessonList.filter(
      (
        item
      ) =>
        item.position <
        lesson.position
    );

  return !previousLessons.every(
    (
      item
    ) =>
      item.progress
        .status ===
      "completed"
  );
}