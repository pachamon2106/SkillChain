"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowDown,
  ArrowUp,
  Bell,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  Video,
  X,
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

type SkillInfo = {
  id: number;
  title: string;

  owner: {
    id: number;
    name: string | null;
  };
};

type Lesson = {
  id: number;
  skillId: number;
  title: string;
  content: string;
  videoUrl: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function LessonManagerPage() {
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
   * SKILL / LESSONS
   * =========================================================
   */

  const [
    skill,
    setSkill,
  ] =
    useState<SkillInfo | null>(
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
    lessonsLoading,
    setLessonsLoading,
  ] =
    useState(false);

  const [
    lessonsError,
    setLessonsError,
  ] =
    useState("");

  /*
   * =========================================================
   * CREATE FORM
   * =========================================================
   */

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    content,
    setContent,
  ] =
    useState("");

  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState("");

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    formError,
    setFormError,
  ] =
    useState("");

  const [
    formSuccess,
    setFormSuccess,
  ] =
    useState("");

  /*
   * =========================================================
   * EDIT
   * =========================================================
   */

  const [
    editingLessonId,
    setEditingLessonId,
  ] =
    useState<number | null>(
      null
    );

  const [
    editTitle,
    setEditTitle,
  ] =
    useState("");

  const [
    editContent,
    setEditContent,
  ] =
    useState("");

  const [
    editVideoUrl,
    setEditVideoUrl,
  ] =
    useState("");

  const [
    savingEdit,
    setSavingEdit,
  ] =
    useState(false);

  /*
   * =========================================================
   * ACTIONS
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
   * DELETE MODAL
   * =========================================================
   */

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<Lesson | null>(
      null
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

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
   * LOAD LESSONS
   * =========================================================
   */

  const loadLessons =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            skillId
          ) ||
          skillId <= 0
        ) {
          setLessonsError(
            "Skill ID ไม่ถูกต้อง"
          );

          return;
        }

        try {
          setLessonsLoading(
            true
          );

          setLessonsError(
            ""
          );

          const response =
            await fetch(
              `/api/lessons?skillId=${skillId}`,
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
            setSkill(
              null
            );

            setLessons([]);

            setLessonsError(
              data?.message ||
                "ไม่สามารถโหลดบทเรียนได้"
            );

            return;
          }

          /*
           * หน้านี้สำหรับเจ้าของ Skill เท่านั้น
           */
          if (
            data.access?.role !==
            "owner"
          ) {
            setSkill(
              data.skill ??
                null
            );

            setLessons([]);

            setLessonsError(
              "เฉพาะเจ้าของ Skill เท่านั้นที่สามารถจัดการบทเรียนได้"
            );

            return;
          }

          setSkill(
            data.skill
          );

          setLessons(
            Array.isArray(
              data.lessons
            )
              ? data.lessons
              : []
          );
        } catch (error) {
          console.error(
            "Load lessons error:",
            error
          );

          setLessonsError(
            "ไม่สามารถเชื่อมต่อเพื่อโหลดบทเรียนได้"
          );
        } finally {
          setLessonsLoading(
            false
          );
        }
      },
      [
        skillId,
      ]
    );

  useEffect(() => {
    void loadLessons();
  }, [
    loadLessons,
  ]);

  /*
   * =========================================================
   * CREATE LESSON
   * =========================================================
   */

  async function createLesson(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    setActionError("");
    setActionSuccess("");

    const cleanTitle =
      title.trim();

    const cleanContent =
      content.trim();

    const cleanVideoUrl =
      videoUrl.trim();

    if (!cleanTitle) {
      setFormError(
        "กรุณากรอกชื่อบทเรียน"
      );

      return;
    }

    if (!cleanContent) {
      setFormError(
        "กรุณากรอกเนื้อหาบทเรียน"
      );

      return;
    }

    try {
      setCreating(
        true
      );

      const response =
        await fetch(
          "/api/lessons",
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
                skillId,

                title:
                  cleanTitle,

                content:
                  cleanContent,

                videoUrl:
                  cleanVideoUrl,
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
        setFormError(
          data?.message ||
            "ไม่สามารถเพิ่มบทเรียนได้"
        );

        return;
      }

      setTitle("");
      setContent("");
      setVideoUrl("");

      setFormSuccess(
        data.message ||
          "เพิ่มบทเรียนสำเร็จแล้ว"
      );

      await loadLessons();
    } catch (error) {
      console.error(
        "Create lesson error:",
        error
      );

      setFormError(
        "เกิดข้อผิดพลาดในการเพิ่มบทเรียน"
      );
    } finally {
      setCreating(
        false
      );
    }
  }

  /*
   * =========================================================
   * START EDIT
   * =========================================================
   */

  function startEdit(
    lesson: Lesson
  ) {
    setEditingLessonId(
      lesson.id
    );

    setEditTitle(
      lesson.title
    );

    setEditContent(
      lesson.content
    );

    setEditVideoUrl(
      lesson.videoUrl ??
        ""
    );

    setActionError("");
    setActionSuccess("");

    setFormError("");
    setFormSuccess("");
  }

  /*
   * =========================================================
   * CANCEL EDIT
   * =========================================================
   */

  function cancelEdit() {
    setEditingLessonId(
      null
    );

    setEditTitle("");
    setEditContent("");
    setEditVideoUrl("");
  }

  /*
   * =========================================================
   * SAVE EDIT
   * =========================================================
   */

  async function saveEdit(
    lessonId: number
  ) {
    const cleanTitle =
      editTitle.trim();

    const cleanContent =
      editContent.trim();

    const cleanVideoUrl =
      editVideoUrl.trim();

    setActionError("");
    setActionSuccess("");

    if (!cleanTitle) {
      setActionError(
        "กรุณากรอกชื่อบทเรียน"
      );

      return;
    }

    if (!cleanContent) {
      setActionError(
        "กรุณากรอกเนื้อหาบทเรียน"
      );

      return;
    }

    try {
      setSavingEdit(
        true
      );

      setActionLessonId(
        lessonId
      );

      const response =
        await fetch(
          "/api/lessons",
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId,

                action:
                  "update",

                title:
                  cleanTitle,

                content:
                  cleanContent,

                videoUrl:
                  cleanVideoUrl,
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
            "ไม่สามารถแก้ไขบทเรียนได้"
        );

        return;
      }

      setActionSuccess(
        data.message ||
          "แก้ไขบทเรียนสำเร็จแล้ว"
      );

      cancelEdit();

      await loadLessons();
    } catch (error) {
      console.error(
        "Save lesson error:",
        error
      );

      setActionError(
        "เกิดข้อผิดพลาดในการแก้ไขบทเรียน"
      );
    } finally {
      setSavingEdit(
        false
      );

      setActionLessonId(
        null
      );
    }
  }

  /*
   * =========================================================
   * MOVE LESSON
   * =========================================================
   */

  async function moveLesson(
    lesson: Lesson,
    action:
      | "move_up"
      | "move_down"
  ) {
    setActionError("");
    setActionSuccess("");

    try {
      setActionLessonId(
        lesson.id
      );

      const response =
        await fetch(
          "/api/lessons",
          {
            method:
              "PATCH",

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

                action,
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
            "ไม่สามารถเปลี่ยนลำดับบทเรียนได้"
        );

        return;
      }

      setActionSuccess(
        data.message ||
          "เปลี่ยนลำดับบทเรียนแล้ว"
      );

      await loadLessons();
    } catch (error) {
      console.error(
        "Move lesson error:",
        error
      );

      setActionError(
        "เกิดข้อผิดพลาดในการเปลี่ยนลำดับบทเรียน"
      );
    } finally {
      setActionLessonId(
        null
      );
    }
  }

  /*
   * =========================================================
   * DELETE LESSON
   * =========================================================
   */

  async function deleteLesson() {
    if (!deleteTarget) {
      return;
    }

    setActionError("");
    setActionSuccess("");

    try {
      setDeleting(
        true
      );

      setActionLessonId(
        deleteTarget.id
      );

      const response =
        await fetch(
          "/api/lessons",
          {
            method:
              "DELETE",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lessonId:
                  deleteTarget.id,
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
            "ไม่สามารถลบบทเรียนได้"
        );

        return;
      }

      setActionSuccess(
        data.message ||
          "ลบบทเรียนสำเร็จแล้ว"
      );

      /*
       * ถ้าบทที่กำลัง Edit
       * ถูกลบ
       */
      if (
        editingLessonId ===
        deleteTarget.id
      ) {
        cancelEdit();
      }

      setDeleteTarget(
        null
      );

      await loadLessons();
    } catch (error) {
      console.error(
        "Delete lesson error:",
        error
      );

      setActionError(
        "เกิดข้อผิดพลาดในการลบบทเรียน"
      );
    } finally {
      setDeleting(
        false
      );

      setActionLessonId(
        null
      );
    }
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
              Course Builder
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              จัดการบทเรียน
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              {skill
                ? skill.title
                : "กำลังโหลด Skill..."}
            </p>
          </div>

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
                  "/teaching"
                )
              }
              className="
                hidden
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
                md:block
              "
            >
              กลับการสอนของฉัน
            </button>

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
                size={14}
              />

              Course Builder
            </div>

            <h2
              className="
                mt-4
                text-2xl
                font-bold
              "
            >
              {skill?.title ||
                "กำลังโหลด Skill..."}
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
              เพิ่ม แก้ไข ลบ และจัดลำดับบทเรียนได้จากหน้านี้
              ระบบจะเรียงบทเรียนตามลำดับที่กำหนด
              และผู้เรียนจะเห็นการเปลี่ยนแปลงจากหน้าเรียนโดยอัตโนมัติ
            </p>
          </div>
        </div>

        {/* ======================================= */}
        {/* ACCESS ERROR */}
        {/* ======================================= */}

        {lessonsError &&
          !skill && (
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
              {lessonsError}
            </div>
          )}

        {/* ======================================= */}
        {/* CONTENT */}
        {/* ======================================= */}

        {skill && (
          <div
            className="
              grid
              gap-6
              xl:grid-cols-[420px_1fr]
            "
          >
            {/* =================================== */}
            {/* CREATE */}
            {/* =================================== */}

            <div
              className="
                self-start
                rounded-[28px]
                border
                border-white/10
                bg-[#101734]
                p-6
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
                    bg-violet-500/15
                    text-violet-300
                  "
                >
                  <Plus
                    size={20}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-sm
                      text-violet-300
                    "
                  >
                    New Lesson
                  </p>

                  <h2
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    เพิ่มบทเรียนใหม่
                  </h2>
                </div>
              </div>

              <form
                onSubmit={
                  createLesson
                }
                className="
                  mt-6
                  space-y-5
                "
              >
                {/* TITLE */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    ชื่อบทเรียน
                  </label>

                  <input
                    value={
                      title
                    }
                    onChange={(
                      event
                    ) =>
                      setTitle(
                        event.target
                          .value
                      )
                    }
                    placeholder="เช่น CSS คืออะไร"
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-[#0b1028]
                      px-4
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-violet-400/60
                      focus:ring-4
                      focus:ring-violet-500/10
                    "
                  />
                </div>

                {/* CONTENT */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    เนื้อหาบทเรียน
                  </label>

                  <textarea
                    value={
                      content
                    }
                    onChange={(
                      event
                    ) =>
                      setContent(
                        event.target
                          .value
                      )
                    }
                    rows={10}
                    placeholder="เขียนเนื้อหาที่ผู้เรียนต้องศึกษาในบทนี้..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-white/10
                      bg-[#0b1028]
                      px-4
                      py-3
                      text-sm
                      leading-6
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-violet-400/60
                      focus:ring-4
                      focus:ring-violet-500/10
                    "
                  />
                </div>

                {/* VIDEO */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    Video URL{" "}
                    <span
                      className="
                        text-xs
                        font-normal
                        text-slate-500
                      "
                    >
                      ไม่บังคับ
                    </span>
                  </label>

                  <input
                    value={
                      videoUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setVideoUrl(
                        event.target
                          .value
                      )
                    }
                    placeholder="https://..."
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-[#0b1028]
                      px-4
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-violet-400/60
                      focus:ring-4
                      focus:ring-violet-500/10
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-500
                    "
                  >
                    เว้นว่างได้ หากบทเรียนเป็นเนื้อหาข้อความอย่างเดียว
                  </p>
                </div>

                {/* FORM ERROR */}

                {formError && (
                  <div
                    className="
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
                    {formError}
                  </div>
                )}

                {/* FORM SUCCESS */}

                {formSuccess && (
                  <div
                    className="
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
                    {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    creating
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
                  {creating ? (
                    <>
                      <Loader2
                        size={18}
                        className="
                          animate-spin
                        "
                      />

                      กำลังเพิ่ม...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={18}
                      />

                      เพิ่มบทเรียน
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* =================================== */}
            {/* LESSON LIST */}
            {/* =================================== */}

            <div
              className="
                rounded-[28px]
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
                    Course Content
                  </p>

                  <h2
                    className="
                      mt-1
                      text-2xl
                      font-bold
                    "
                  >
                    บทเรียนทั้งหมด
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
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
                    void loadLessons()
                  }
                  disabled={
                    lessonsLoading
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
                      lessonsLoading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  รีเฟรช
                </button>
              </div>

              {/* ACTION ERROR */}

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

              {/* ACTION SUCCESS */}

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

              {/* LOADING */}

              {lessonsLoading &&
                lessons.length ===
                  0 && (
                  <div
                    className="
                      flex
                      min-h-[400px]
                      items-center
                      justify-center
                    "
                  >
                    <Loader2
                      size={30}
                      className="
                        animate-spin
                        text-violet-400
                      "
                    />
                  </div>
                )}

              {/* ERROR */}

              {!lessonsLoading &&
                lessonsError && (
                  <div
                    className="
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
                    {lessonsError}
                  </div>
                )}

              {/* EMPTY */}

              {!lessonsLoading &&
                !lessonsError &&
                lessons.length ===
                  0 && (
                  <div
                    className="
                      flex
                      min-h-[420px]
                      flex-col
                      items-center
                      justify-center
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
                      <BookOpen
                        size={29}
                      />
                    </div>

                    <h3
                      className="
                        mt-5
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
                      เริ่มสร้างบทแรกจากแบบฟอร์มด้านซ้ายได้เลย
                    </p>
                  </div>
                )}

              {/* LIST */}

              {!lessonsError &&
                lessons.length >
                  0 && (
                  <div
                    className="
                      space-y-4
                    "
                  >
                    {lessons.map(
                      (
                        lesson,
                        index
                      ) => {
                        const isEditing =
                          editingLessonId ===
                          lesson.id;

                        const busy =
                          actionLessonId ===
                          lesson.id;

                        const isFirst =
                          index ===
                          0;

                        const isLast =
                          index ===
                          lessons.length -
                            1;

                        return (
                          <div
                            key={
                              lesson.id
                            }
                            className="
                              rounded-2xl
                              border
                              border-white/10
                              bg-white/[0.03]
                              p-4
                            "
                          >
                            {isEditing ? (
                              /*
                               * =================================
                               * EDIT MODE
                               * =================================
                               */
                              <div>
                                <div
                                  className="
                                    mb-4
                                    flex
                                    items-center
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
                                      EDIT LESSON{" "}
                                      {lesson.position}
                                    </p>

                                    <h3
                                      className="
                                        mt-1
                                        text-lg
                                        font-bold
                                      "
                                    >
                                      แก้ไขบทเรียน
                                    </h3>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelEdit
                                    }
                                    disabled={
                                      savingEdit
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
                                      disabled:opacity-40
                                    "
                                  >
                                    <X
                                      size={17}
                                    />
                                  </button>
                                </div>

                                <div
                                  className="
                                    space-y-4
                                  "
                                >
                                  <div>
                                    <label
                                      className="
                                        mb-2
                                        block
                                        text-sm
                                        text-slate-300
                                      "
                                    >
                                      ชื่อบทเรียน
                                    </label>

                                    <input
                                      value={
                                        editTitle
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setEditTitle(
                                          event.target
                                            .value
                                        )
                                      }
                                      className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-white/10
                                        bg-[#0b1028]
                                        px-4
                                        text-sm
                                        text-white
                                        outline-none
                                        focus:border-violet-400/60
                                      "
                                    />
                                  </div>

                                  <div>
                                    <label
                                      className="
                                        mb-2
                                        block
                                        text-sm
                                        text-slate-300
                                      "
                                    >
                                      เนื้อหาบทเรียน
                                    </label>

                                    <textarea
                                      value={
                                        editContent
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setEditContent(
                                          event.target
                                            .value
                                        )
                                      }
                                      rows={8}
                                      className="
                                        w-full
                                        resize-none
                                        rounded-xl
                                        border
                                        border-white/10
                                        bg-[#0b1028]
                                        px-4
                                        py-3
                                        text-sm
                                        leading-6
                                        text-white
                                        outline-none
                                        focus:border-violet-400/60
                                      "
                                    />
                                  </div>

                                  <div>
                                    <label
                                      className="
                                        mb-2
                                        block
                                        text-sm
                                        text-slate-300
                                      "
                                    >
                                      Video URL
                                    </label>

                                    <input
                                      value={
                                        editVideoUrl
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setEditVideoUrl(
                                          event.target
                                            .value
                                        )
                                      }
                                      placeholder="https://..."
                                      className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-white/10
                                        bg-[#0b1028]
                                        px-4
                                        text-sm
                                        text-white
                                        outline-none
                                        placeholder:text-slate-600
                                        focus:border-violet-400/60
                                      "
                                    />
                                  </div>

                                  <div
                                    className="
                                      grid
                                      gap-3
                                      sm:grid-cols-2
                                    "
                                  >
                                    <button
                                      type="button"
                                      onClick={
                                        cancelEdit
                                      }
                                      disabled={
                                        savingEdit
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
                                        disabled:opacity-40
                                      "
                                    >
                                      <X
                                        size={16}
                                      />

                                      ยกเลิก
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void saveEdit(
                                          lesson.id
                                        )
                                      }
                                      disabled={
                                        savingEdit
                                      }
                                      className="
                                        flex
                                        h-11
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
                                        disabled:opacity-50
                                      "
                                    >
                                      {savingEdit ? (
                                        <>
                                          <Loader2
                                            size={16}
                                            className="
                                              animate-spin
                                            "
                                          />

                                          กำลังบันทึก...
                                        </>
                                      ) : (
                                        <>
                                          <Save
                                            size={16}
                                          />

                                          บันทึกการแก้ไข
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /*
                               * =================================
                               * NORMAL MODE
                               * =================================
                               */
                              <div
                                className="
                                  flex
                                  gap-4
                                "
                              >
                                {/* NUMBER */}

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
                                    text-lg
                                    font-bold
                                    text-violet-300
                                  "
                                >
                                  {lesson.position}
                                </div>

                                {/* CONTENT */}

                                <div
                                  className="
                                    min-w-0
                                    flex-1
                                  "
                                >
                                  <div
                                    className="
                                      flex
                                      flex-wrap
                                      items-start
                                      justify-between
                                      gap-4
                                    "
                                  >
                                    <div
                                      className="
                                        min-w-0
                                        flex-1
                                      "
                                    >
                                      <p
                                        className="
                                          text-[10px]
                                          font-semibold
                                          uppercase
                                          tracking-[0.15em]
                                          text-violet-400
                                        "
                                      >
                                        LESSON{" "}
                                        {lesson.position}
                                      </p>

                                      <h3
                                        className="
                                          mt-1
                                          text-lg
                                          font-bold
                                          text-white
                                        "
                                      >
                                        {lesson.title}
                                      </h3>
                                    </div>

                                    {/* ACTION BUTTONS */}

                                    <div
                                      className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-2
                                      "
                                    >
                                      <button
                                        type="button"
                                        title="เลื่อนขึ้น"
                                        onClick={() =>
                                          void moveLesson(
                                            lesson,
                                            "move_up"
                                          )
                                        }
                                        disabled={
                                          isFirst ||
                                          busy ||
                                          editingLessonId !==
                                            null
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
                                          disabled:cursor-not-allowed
                                          disabled:opacity-30
                                        "
                                      >
                                        {busy ? (
                                          <Loader2
                                            size={15}
                                            className="
                                              animate-spin
                                            "
                                          />
                                        ) : (
                                          <ArrowUp
                                            size={16}
                                          />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        title="เลื่อนลง"
                                        onClick={() =>
                                          void moveLesson(
                                            lesson,
                                            "move_down"
                                          )
                                        }
                                        disabled={
                                          isLast ||
                                          busy ||
                                          editingLessonId !==
                                            null
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
                                          disabled:cursor-not-allowed
                                          disabled:opacity-30
                                        "
                                      >
                                        {busy ? (
                                          <Loader2
                                            size={15}
                                            className="
                                              animate-spin
                                            "
                                          />
                                        ) : (
                                          <ArrowDown
                                            size={16}
                                          />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        title="แก้ไขบทเรียน"
                                        onClick={() =>
                                          startEdit(
                                            lesson
                                          )
                                        }
                                        disabled={
                                          busy ||
                                          editingLessonId !==
                                            null
                                        }
                                        className="
                                          flex
                                          h-9
                                          w-9
                                          items-center
                                          justify-center
                                          rounded-xl
                                          border
                                          border-violet-500/20
                                          bg-violet-500/10
                                          text-violet-300
                                          transition
                                          hover:bg-violet-500/20
                                          hover:text-violet-200
                                          disabled:opacity-30
                                        "
                                      >
                                        <Pencil
                                          size={15}
                                        />
                                      </button>

                                      <button
                                        type="button"
                                        title="ลบบทเรียน"
                                        onClick={() => {
                                          setActionError(
                                            ""
                                          );

                                          setActionSuccess(
                                            ""
                                          );

                                          setDeleteTarget(
                                            lesson
                                          );
                                        }}
                                        disabled={
                                          busy ||
                                          editingLessonId !==
                                            null
                                        }
                                        className="
                                          flex
                                          h-9
                                          w-9
                                          items-center
                                          justify-center
                                          rounded-xl
                                          border
                                          border-red-500/20
                                          bg-red-500/10
                                          text-red-300
                                          transition
                                          hover:bg-red-500/20
                                          hover:text-red-200
                                          disabled:opacity-30
                                        "
                                      >
                                        <Trash2
                                          size={15}
                                        />
                                      </button>
                                    </div>
                                  </div>

                                  {/* LESSON CONTENT */}

                                  <p
                                    className="
                                      mt-3
                                      whitespace-pre-wrap
                                      text-sm
                                      leading-6
                                      text-slate-400
                                    "
                                  >
                                    {lesson.content}
                                  </p>

                                  {/* VIDEO */}

                                  {lesson.videoUrl && (
                                    <div
                                      className="
                                        mt-4
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-3
                                        rounded-xl
                                        border
                                        border-violet-500/15
                                        bg-violet-500/5
                                        px-4
                                        py-3
                                      "
                                    >
                                      <Video
                                        size={16}
                                        className="
                                          shrink-0
                                          text-violet-300
                                        "
                                      />

                                      <p
                                        className="
                                          min-w-0
                                          flex-1
                                          truncate
                                          text-xs
                                          text-slate-400
                                        "
                                      >
                                        {lesson.videoUrl}
                                      </p>

                                      <a
                                        href={
                                          lesson.videoUrl
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="
                                          inline-flex
                                          shrink-0
                                          items-center
                                          gap-1.5
                                          text-xs
                                          font-semibold
                                          text-violet-300
                                          transition
                                          hover:text-violet-200
                                        "
                                      >
                                        เปิดวิดีโอ

                                        <ExternalLink
                                          size={13}
                                        />
                                      </a>
                                    </div>
                                  )}

                                  {/* POSITION INFO */}

                                  <div
                                    className="
                                      mt-4
                                      flex
                                      flex-wrap
                                      items-center
                                      gap-3
                                      text-xs
                                      text-slate-600
                                    "
                                  >
                                    <span>
                                      ลำดับที่{" "}
                                      {lesson.position}
                                    </span>

                                    <span>
                                      •
                                    </span>

                                    <span>
                                      Lesson ID #
                                      {lesson.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
      </section>

      {/* ========================================= */}
      {/* DELETE MODAL */}
      {/* ========================================= */}

      {deleteTarget && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/70
            p-5
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-[28px]
              border
              border-white/10
              bg-[#101734]
              p-6
              shadow-2xl
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
                bg-red-500/10
                text-red-300
              "
            >
              <Trash2
                size={21}
              />
            </div>

            <h2
              className="
                mt-5
                text-xl
                font-bold
              "
            >
              ลบบทเรียนนี้?
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-400
              "
            >
              คุณกำลังจะลบ{" "}
              <span
                className="
                  font-semibold
                  text-white
                "
              >
                บทที่{" "}
                {deleteTarget.position}
                {" — "}
                {deleteTarget.title}
              </span>
            </p>

            <div
              className="
                mt-4
                rounded-xl
                border
                border-red-500/20
                bg-red-500/10
                px-4
                py-3
                text-xs
                leading-5
                text-red-300
              "
            >
              ความคืบหน้าของผู้เรียนที่ผูกกับบทนี้จะถูกลบตามไปด้วย
              และระบบจะจัดหมายเลขบทที่เหลือใหม่ให้อัตโนมัติ
            </div>

            <div
              className="
                mt-6
                grid
                gap-3
                sm:grid-cols-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                disabled={
                  deleting
                }
                className="
                  flex
                  h-11
                  items-center
                  justify-center
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
                  disabled:opacity-40
                "
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() =>
                  void deleteLesson()
                }
                disabled={
                  deleting
                }
                className="
                  flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-500
                  disabled:opacity-50
                "
              >
                {deleting ? (
                  <>
                    <Loader2
                      size={16}
                      className="
                        animate-spin
                      "
                    />

                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={16}
                    />

                    ยืนยันการลบ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}