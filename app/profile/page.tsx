"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
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

type ProfileUser = {
  id: number;

  name:
    | string
    | null;

  email: string;

  createdAt: string;

  updatedAt?:
    | string;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function ProfilePage() {
  const router =
    useRouter();

  const {
    resetWallet,
  } = useWallet();

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  const [
    user,
    setUser,
  ] =
    useState<ProfileUser | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  /*
   * =========================================================
   * FORM
   * =========================================================
   */

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  /*
   * =========================================================
   * MESSAGE
   * =========================================================
   */

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /*
   * =========================================================
   * HEADER PROFILE MENU
   * =========================================================
   */

  const [
    openProfile,
    setOpenProfile,
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
        setLoading(
          true
        );

        setError("");

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

        /*
         * Session หาย
         */
        if (
          response.status ===
          401
        ) {
          router.push("/");

          return;
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          setError(
            data?.message ||
              "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้"
          );

          return;
        }

        const loadedUser:
          ProfileUser =
          data.user;

        setUser(
          loadedUser
        );

        setName(
          loadedUser.name ??
            ""
        );

        setEmail(
          loadedUser.email
        );
      } catch (error) {
        console.error(
          "Load profile error:",
          error
        );

        setError(
          "เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์"
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    void loadProfile();
  }, [
    router,
  ]);

  /*
   * =========================================================
   * INITIAL
   * =========================================================
   */

  const initial =
    useMemo(
      () => {
        const source =
          name.trim() ||
          user?.name?.trim() ||
          email.trim() ||
          "?";

        return source
          .charAt(0)
          .toUpperCase();
      },
      [
        name,
        email,
        user,
      ]
    );

  /*
   * =========================================================
   * MEMBER SINCE
   * =========================================================
   */

  const memberSince =
    useMemo(
      () => {
        if (
          !user?.createdAt
        ) {
          return "-";
        }

        const date =
          new Date(
            user.createdAt
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return "-";
        }

        return new Intl.DateTimeFormat(
          "th-TH",
          {
            day:
              "numeric",

            month:
              "long",

            year:
              "numeric",
          }
        ).format(
          date
        );
      },
      [
        user?.createdAt,
      ]
    );

  /*
   * =========================================================
   * HAS CHANGES
   * =========================================================
   */

  const hasChanges =
    useMemo(
      () => {
        if (!user) {
          return false;
        }

        const originalName =
          user.name?.trim() ??
          "";

        const originalEmail =
          user.email
            .trim()
            .toLowerCase();

        return (
          name.trim() !==
            originalName ||
          email
            .trim()
            .toLowerCase() !==
            originalEmail
        );
      },
      [
        user,
        name,
        email,
      ]
    );

  /*
   * =========================================================
   * SAVE PROFILE
   * =========================================================
   */

  async function saveProfile(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    /*
     * Client validation
     */
    if (!cleanName) {
      setError(
        "กรุณากรอกชื่อผู้ใช้งาน"
      );

      return;
    }

    if (!cleanEmail) {
      setError(
        "กรุณากรอกอีเมล"
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await fetch(
          "/api/profile",
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
                name:
                  cleanName,

                email:
                  cleanEmail,
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
        response.status ===
        401
      ) {
        router.push("/");

        return;
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        setError(
          data?.message ||
            "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้"
        );

        return;
      }

      const updatedUser:
        ProfileUser =
        data.user;

      setUser(
        updatedUser
      );

      setName(
        updatedUser.name ??
          ""
      );

      setEmail(
        updatedUser.email
      );

      setSuccess(
        data.message ||
          "บันทึกข้อมูลโปรไฟล์สำเร็จแล้ว"
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setError(
        "เกิดข้อผิดพลาดในการบันทึกโปรไฟล์"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /*
   * =========================================================
   * RESET FORM
   * =========================================================
   */

  function resetForm() {
    if (!user) {
      return;
    }

    setName(
      user.name ??
        ""
    );

    setEmail(
      user.email
    );

    setError("");
    setSuccess("");
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

  if (loading) {
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
            กำลังโหลดโปรไฟล์...
          </p>
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
              Account Settings
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              โปรไฟล์
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              จัดการข้อมูลบัญชี SkillChain ของคุณ
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

            {/* PROFILE MENU */}

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
                  {user?.name ||
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
                      {user?.name ||
                        "User"}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      {user?.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      logout
                    }
                    className="
                      mt-3
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
        {/* ERROR */}
        {/* ======================================= */}

        {error &&
          !user && (
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
              {error}
            </div>
          )}

        {user && (
          <>
            {/* =================================== */}
            {/* PROFILE HERO */}
            {/* =================================== */}

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
                p-7
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
                  gap-5
                  md:flex-row
                  md:items-center
                "
              >
                {/* AVATAR */}

                <div
                  className="
                    flex
                    h-24
                    w-24
                    shrink-0
                    items-center
                    justify-center
                    rounded-[28px]
                    border
                    border-white/15
                    bg-white/10
                    text-4xl
                    font-bold
                    text-white
                    shadow-xl
                  "
                >
                  {initial}
                </div>

                {/* INFO */}

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.15em]
                      text-violet-200
                    "
                  >
                    SkillChain Account
                  </p>

                  <h2
                    className="
                      mt-2
                      text-3xl
                      font-bold
                    "
                  >
                    {user.name ||
                      "ผู้ใช้งาน"}
                  </h2>

                  <p
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                      text-sm
                      text-slate-300
                    "
                  >
                    <Mail
                      size={15}
                    />

                    {user.email}
                  </p>

                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      gap-3
                    "
                  >
                    <span
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
                        text-slate-200
                      "
                    >
                      <ShieldCheck
                        size={13}
                      />

                      Account ID #
                      {user.id}
                    </span>

                    <span
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
                        text-slate-200
                      "
                    >
                      <CalendarDays
                        size={13}
                      />

                      สมาชิกตั้งแต่{" "}
                      {memberSince}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================== */}
            {/* GRID */}
            {/* =================================== */}

            <div
              className="
                grid
                gap-6
                xl:grid-cols-[1fr_330px]
              "
            >
              {/* ================================= */}
              {/* EDIT PROFILE */}
              {/* ================================= */}

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
                    mb-6
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
                    <UserRound
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
                      Personal Information
                    </p>

                    <h2
                      className="
                        text-xl
                        font-bold
                      "
                    >
                      ข้อมูลบัญชี
                    </h2>
                  </div>
                </div>

                <form
                  onSubmit={
                    saveProfile
                  }
                  className="
                    space-y-5
                  "
                >
                  {/* NAME */}

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
                      ชื่อผู้ใช้งาน
                    </label>

                    <div
                      className="
                        relative
                      "
                    >
                      <UserRound
                        size={17}
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-500
                        "
                      />

                      <input
                        value={
                          name
                        }
                        onChange={(
                          event
                        ) => {
                          setName(
                            event
                              .target
                              .value
                          );

                          setError("");
                          setSuccess("");
                        }}
                        maxLength={
                          100
                        }
                        placeholder="ชื่อผู้ใช้งาน"
                        className="
                          h-12
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-[#0b1028]
                          pl-11
                          pr-4
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
                  </div>

                  {/* EMAIL */}

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
                      อีเมล
                    </label>

                    <div
                      className="
                        relative
                      "
                    >
                      <Mail
                        size={17}
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-500
                        "
                      />

                      <input
                        type="email"
                        value={
                          email
                        }
                        onChange={(
                          event
                        ) => {
                          setEmail(
                            event
                              .target
                              .value
                          );

                          setError("");
                          setSuccess("");
                        }}
                        maxLength={
                          191
                        }
                        placeholder="email@example.com"
                        className="
                          h-12
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-[#0b1028]
                          pl-11
                          pr-4
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

                    <p
                      className="
                        mt-2
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      อีเมลต้องไม่ซ้ำกับบัญชี SkillChain อื่น
                    </p>
                  </div>

                  {/* ERROR */}

                  {error && (
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
                      {error}
                    </div>
                  )}

                  {/* SUCCESS */}

                  {success && (
                    <div
                      className="
                        flex
                        items-center
                        gap-2
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
                      <CheckCircle2
                        size={17}
                        className="
                          shrink-0
                        "
                      />

                      {success}
                    </div>
                  )}

                  {/* BUTTONS */}

                  <div
                    className="
                      grid
                      gap-3
                      pt-2
                      sm:grid-cols-2
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        resetForm
                      }
                      disabled={
                        saving ||
                        !hasChanges
                      }
                      className="
                        flex
                        h-12
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
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                    >
                      ยกเลิกการแก้ไข
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !hasChanges
                      }
                      className="
                        flex
                        h-12
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
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      {saving ? (
                        <>
                          <Loader2
                            size={17}
                            className="
                              animate-spin
                            "
                          />

                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save
                            size={17}
                          />

                          บันทึกการเปลี่ยนแปลง
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* ================================= */}
              {/* ACCOUNT SUMMARY */}
              {/* ================================= */}

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
                <p
                  className="
                    text-sm
                    text-violet-300
                  "
                >
                  Account
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                  "
                >
                  ข้อมูลบัญชี
                </h2>

                <div
                  className="
                    mt-6
                    space-y-3
                  "
                >
                  {/* ID */}

                  <InfoRow
                    icon={
                      <ShieldCheck
                        size={17}
                      />
                    }
                    label="Account ID"
                    value={`#${user.id}`}
                  />

                  {/* EMAIL */}

                  <InfoRow
                    icon={
                      <Mail
                        size={17}
                      />
                    }
                    label="อีเมล"
                    value={
                      user.email
                    }
                  />

                  {/* CREATED */}

                  <InfoRow
                    icon={
                      <CalendarDays
                        size={17}
                      />
                    }
                    label="วันที่สมัคร"
                    value={
                      memberSince
                    }
                  />
                </div>

                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-violet-500/15
                    bg-violet-500/[0.06]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      gap-3
                    "
                  >
                    <ShieldCheck
                      size={19}
                      className="
                        mt-0.5
                        shrink-0
                        text-violet-300
                      "
                    />

                    <div>
                      <p
                        className="
                          text-sm
                          font-semibold
                          text-slate-200
                        "
                      >
                        SkillChain Account
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-slate-500
                        "
                      >
                        บัญชี SkillChain และ MetaMask
                        ทำหน้าที่แยกกัน
                        การแก้ไขโปรไฟล์จะไม่เปลี่ยน Wallet
                        ที่กำลังเลือกใน MetaMask
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

/*
 * =========================================================
 * INFO ROW
 * =========================================================
 */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label: string;

  value: string;
}) {
  return (
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
          gap-3
        "
      >
        <div
          className="
            flex
            h-9
            w-9
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
          "
        >
          <p
            className="
              text-xs
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              break-words
              text-sm
              font-semibold
              text-slate-200
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}