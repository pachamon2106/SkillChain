"use client";

import {
  useCallback,
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
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Coins,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Tags,
  UserRound,
  Wallet2,
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
  price: number;

  category:
    | string
    | null;

  payoutAddress:
    | string
    | null;

  createdAt: string;

  owner: {
    id: number;
    name: string | null;
  };
};

/*
 * =========================================================
 * DEFAULT CATEGORY SUGGESTIONS
 * =========================================================
 *
 * ผู้สอนยังสามารถพิมพ์หมวดหมู่ใหม่เองได้
 */
const DEFAULT_CATEGORIES = [
  "Programming",
  "Web Development",
  "Design",
  "ภาษา",
  "ธุรกิจ",
  "การตลาด",
  "การเงิน",
  "ดนตรี",
  "ไลฟ์สไตล์",
];

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function TeachingPage() {
  const router =
    useRouter();

  /*
   * =========================================================
   * SHARED WALLET
   * =========================================================
   */

  const {
    address,
    status,
    message,
    connecting,
    isConnected,
    connectWallet,
    switchToBscTestnet,
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
   * SKILLS
   * =========================================================
   */

  const [
    skills,
    setSkills,
  ] =
    useState<Skill[]>(
      []
    );

  const [
    categories,
    setCategories,
  ] =
    useState<string[]>(
      []
    );

  const [
    skillsLoading,
    setSkillsLoading,
  ] =
    useState(false);

  const [
    skillsError,
    setSkillsError,
  ] =
    useState("");

  /*
   * =========================================================
   * FORM
   * =========================================================
   */

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("");

  const [
    price,
    setPrice,
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
   * PRICE STATE
   * =========================================================
   */

  const numericPrice =
    Number(
      price
    );

  const isPaidSkill =
    price.trim() !== "" &&
    Number.isFinite(
      numericPrice
    ) &&
    numericPrice > 0;

  /*
   * =========================================================
   * CATEGORY OPTIONS
   * =========================================================
   *
   * รวม:
   * - หมวดแนะนำ
   * - หมวดที่มีอยู่จริงใน Database
   */
  const categoryOptions =
    useMemo(
      () => {
        return Array.from(
          new Set([
            ...DEFAULT_CATEGORIES,
            ...categories,
          ])
        ).sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b,
              "th"
            )
        );
      },
      [
        categories,
      ]
    );

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
          setUser(
            null
          );

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

        setUser(
          null
        );
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
   * LOAD SKILLS
   * =========================================================
   */

  const loadSkills =
    useCallback(
      async () => {
        try {
          setSkillsLoading(
            true
          );

          setSkillsError(
            ""
          );

          const response =
            await fetch(
              "/api/skills",
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
            setSkills(
              []
            );

            setCategories(
              []
            );

            setSkillsError(
              data?.message ||
                "ไม่สามารถโหลดทักษะได้"
            );

            return;
          }

          setSkills(
            Array.isArray(
              data.skills
            )
              ? data.skills
              : []
          );

          setCategories(
            Array.isArray(
              data.categories
            )
              ? data.categories.filter(
                  (
                    item: unknown
                  ): item is string =>
                    typeof item ===
                      "string" &&
                    item.trim() !==
                      ""
                )
              : []
          );
        } catch (error) {
          console.error(
            "Load skills error:",
            error
          );

          setSkills(
            []
          );

          setCategories(
            []
          );

          setSkillsError(
            "ไม่สามารถโหลดทักษะได้"
          );
        } finally {
          setSkillsLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadSkills();
  }, [
    loadSkills,
  ]);

  /*
   * =========================================================
   * MY SKILLS
   * =========================================================
   */

  const mySkills =
    useMemo(
      () => {
        if (!user) {
          return [];
        }

        return skills.filter(
          (
            skill
          ) =>
            skill.owner.id ===
            user.id
        );
      },
      [
        skills,
        user,
      ]
    );

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  const freeSkills =
    useMemo(
      () =>
        mySkills.filter(
          (
            skill
          ) =>
            skill.price ===
            0
        ).length,
      [
        mySkills,
      ]
    );

  const paidSkills =
    useMemo(
      () =>
        mySkills.filter(
          (
            skill
          ) =>
            skill.price >
            0
        ).length,
      [
        mySkills,
      ]
    );

  /*
   * =========================================================
   * CREATE SKILL
   * =========================================================
   */

  async function createSkill(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError(
      ""
    );

    setFormSuccess(
      ""
    );

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const cleanCategory =
      category.trim();

    const cleanPrice =
      Number(
        price
      );

    /*
     * =====================================================
     * BASIC VALIDATION
     * =====================================================
     */

    if (
      !cleanTitle
    ) {
      setFormError(
        "กรุณากรอกชื่อทักษะ"
      );

      return;
    }

    if (
      !cleanDescription
    ) {
      setFormError(
        "กรุณากรอกรายละเอียดทักษะ"
      );

      return;
    }

    /*
     * New Skill ต้องมีหมวดหมู่
     *
     * Skill เก่าที่สร้างก่อนระบบ Category
     * ยังสามารถเป็น null ได้
     */
    if (
      !cleanCategory
    ) {
      setFormError(
        "กรุณาเลือกหรือกรอกหมวดหมู่ทักษะ"
      );

      return;
    }

    if (
      cleanCategory.length >
      80
    ) {
      setFormError(
        "ชื่อหมวดหมู่ยาวเกินไป"
      );

      return;
    }

    if (
      price.trim() ===
      ""
    ) {
      setFormError(
        "กรุณากรอกราคา SKT"
      );

      return;
    }

    if (
      !Number.isFinite(
        cleanPrice
      ) ||
      !Number.isInteger(
        cleanPrice
      ) ||
      cleanPrice < 0
    ) {
      setFormError(
        "ราคา SKT ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป"
      );

      return;
    }

    /*
     * =====================================================
     * PAID SKILL WALLET VALIDATION
     * =====================================================
     */

    if (
      cleanPrice >
      0
    ) {
      /*
       * ผิด Network
       */
      if (
        status ===
        "wrong-network"
      ) {
        setFormError(
          "กรุณาเปลี่ยน MetaMask เป็น BNB Smart Chain Testnet ก่อน"
        );

        return;
      }

      /*
       * ยังไม่ Connect
       */
      if (
        !isConnected ||
        !address
      ) {
        setFormError(
          "Skill ที่มีราคาต้อง Connect MetaMask ก่อนสร้าง"
        );

        return;
      }
    }

    /*
     * =====================================================
     * CREATE
     * =====================================================
     */

    try {
      setCreating(
        true
      );

      const response =
        await fetch(
          "/api/skills",
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
                title:
                  cleanTitle,

                description:
                  cleanDescription,

                category:
                  cleanCategory,

                price:
                  cleanPrice,

                /*
                 * Skill ฟรี
                 * → null
                 *
                 * Skill มีราคา
                 * → Wallet ที่ Connect อยู่
                 */
                payoutAddress:
                  cleanPrice >
                  0
                    ? address
                    : null,
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
            "ไม่สามารถสร้างทักษะได้"
        );

        return;
      }

      /*
       * ===================================================
       * CLEAR FORM
       * ===================================================
       */

      setTitle(
        ""
      );

      setDescription(
        ""
      );

      setCategory(
        ""
      );

      setPrice(
        ""
      );

      /*
       * ===================================================
       * SUCCESS
       * ===================================================
       */

      setFormSuccess(
        cleanPrice >
        0
          ? "สร้างทักษะสำเร็จ และบันทึก Wallet รับ SKT แล้ว"
          : "สร้างทักษะฟรีสำเร็จแล้ว"
      );

      /*
       * ===================================================
       * RELOAD DATABASE
       * ===================================================
       */

      await loadSkills();
    } catch (error) {
      console.error(
        "Create skill error:",
        error
      );

      setFormError(
        "เกิดข้อผิดพลาดในการสร้างทักษะ"
      );
    } finally {
      setCreating(
        false
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

    router.push(
      "/"
    );

    router.refresh();
  }

  /*
   * =========================================================
   * PAGE LOADING
   * =========================================================
   */

  if (
    pageLoading
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

  if (
    !user
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
              Teaching Center
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              การสอนของฉัน
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              สร้างและจัดการทักษะที่คุณต้องการแบ่งปัน
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            {/* BELL */}

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
              <Sparkles
                size={14}
              />

              Teach & Earn
            </div>

            <h2
              className="
                mt-4
                text-2xl
                font-bold
              "
            >
              แชร์สิ่งที่คุณเก่ง
              และสร้าง Skill ของคุณเอง
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
              หาก Skill มีราคา Wallet ที่คุณ Connect
              ขณะเผยแพร่จะถูกใช้เป็น Wallet รับ SKT
              ของ Skill นั้น
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
            md:grid-cols-3
          "
        >
          <StatCard
            title="ทักษะของฉัน"
            value={
              mySkills.length.toString()
            }
          />

          <StatCard
            title="ทักษะฟรี"
            value={
              freeSkills.toString()
            }
          />

          <StatCard
            title="ทักษะมีราคา"
            value={
              paidSkills.toString()
            }
          />
        </div>

        {/* ======================================= */}
        {/* CONTENT GRID */}
        {/* ======================================= */}

        <div
          className="
            grid
            gap-6
            xl:grid-cols-[420px_1fr]
          "
        >
          {/* ===================================== */}
          {/* CREATE FORM */}
          {/* ===================================== */}

          <div
            className="
              self-start
              rounded-[30px]
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
                  New Skill
                </p>

                <h2
                  className="
                    text-xl
                    font-bold
                  "
                >
                  สร้างทักษะใหม่
                </h2>
              </div>
            </div>

            <form
              onSubmit={
                createSkill
              }
              className="
                mt-6
                space-y-5
              "
            >
              {/* ================================= */}
              {/* TITLE */}
              {/* ================================= */}

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
                  ชื่อทักษะ
                </label>

                <input
                  value={
                    title
                  }
                  onChange={(
                    event
                  ) => {
                    setTitle(
                      event.target
                        .value
                    );

                    setFormError(
                      ""
                    );

                    setFormSuccess(
                      ""
                    );
                  }}
                  placeholder="เช่น พื้นฐาน React สำหรับผู้เริ่มต้น"
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

              {/* ================================= */}
              {/* DESCRIPTION */}
              {/* ================================= */}

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
                  รายละเอียด
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) => {
                    setDescription(
                      event.target
                        .value
                    );

                    setFormError(
                      ""
                    );

                    setFormSuccess(
                      ""
                    );
                  }}
                  rows={7}
                  placeholder="อธิบายว่าผู้เรียนจะได้เรียนรู้อะไรจากทักษะนี้..."
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

              {/* ================================= */}
              {/* CATEGORY */}
              {/* ================================= */}

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
                  หมวดหมู่ทักษะ
                </label>

                <div
                  className="
                    relative
                  "
                >
                  <Tags
                    size={17}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-violet-400
                    "
                  />

                  <input
                    list="skill-category-options"
                    value={
                      category
                    }
                    onChange={(
                      event
                    ) => {
                      setCategory(
                        event.target
                          .value
                      );

                      setFormError(
                        ""
                      );

                      setFormSuccess(
                        ""
                      );
                    }}
                    maxLength={
                      80
                    }
                    placeholder="เลือกหรือพิมพ์หมวดหมู่"
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

                  <datalist
                    id="skill-category-options"
                  >
                    {categoryOptions.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        />
                      )
                    )}
                  </datalist>
                </div>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  เลือกหมวดที่มีอยู่ หรือพิมพ์หมวดหมู่ใหม่ได้
                </p>

                {categoryOptions.length >
                  0 && (
                  <div
                    className="
                      mt-3
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    {categoryOptions
                      .slice(
                        0,
                        6
                      )
                      .map(
                        (
                          item
                        ) => (
                          <button
                            key={
                              item
                            }
                            type="button"
                            onClick={() => {
                              setCategory(
                                item
                              );

                              setFormError(
                                ""
                              );

                              setFormSuccess(
                                ""
                              );
                            }}
                            className="
                              rounded-full
                              border
                              border-white/10
                              bg-white/5
                              px-3
                              py-1.5
                              text-xs
                              text-slate-400
                              transition
                              hover:border-violet-500/30
                              hover:bg-violet-500/10
                              hover:text-violet-300
                            "
                          >
                            {item}
                          </button>
                        )
                      )}
                  </div>
                )}
              </div>

              {/* ================================= */}
              {/* PRICE */}
              {/* ================================= */}

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
                  ราคา SKT
                </label>

                <div
                  className="
                    relative
                  "
                >
                  <Coins
                    size={17}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-violet-400
                    "
                  />

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      price
                    }
                    onChange={(
                      event
                    ) => {
                      setPrice(
                        event.target
                          .value
                      );

                      setFormError(
                        ""
                      );

                      setFormSuccess(
                        ""
                      );
                    }}
                    placeholder="30"
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-[#0b1028]
                      pl-11
                      pr-14
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

                  <span
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-xs
                      font-semibold
                      text-slate-500
                    "
                  >
                    SKT
                  </span>
                </div>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  ใส่ 0 หากต้องการเผยแพร่ทักษะฟรี
                </p>
              </div>

              {/* ================================= */}
              {/* PAID SKILL WALLET */}
              {/* ================================= */}

              {isPaidSkill && (
                <div
                  className="
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
                        bg-violet-500/15
                        text-violet-300
                      "
                    >
                      <Wallet2
                        size={18}
                      />
                    </div>

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        Wallet รับ SKT
                      </p>

                      {!isConnected ? (
                        <>
                          <p
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-slate-400
                            "
                          >
                            Skill นี้มีราคา กรุณา Connect MetaMask
                            เพื่อกำหนด Wallet รับเงิน
                          </p>

                          {status ===
                            "wrong-network" &&
                          address ? (
                            <button
                              type="button"
                              onClick={
                                switchToBscTestnet
                              }
                              disabled={
                                connecting
                              }
                              className="
                                mt-3
                                rounded-xl
                                bg-yellow-300
                                px-4
                                py-2
                                text-sm
                                font-semibold
                                text-slate-900
                                transition
                                hover:bg-yellow-200
                                disabled:opacity-50
                              "
                            >
                              เปลี่ยนเป็น BNB Testnet
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={
                                connectWallet
                              }
                              disabled={
                                connecting
                              }
                              className="
                                mt-3
                                rounded-xl
                                bg-violet-600
                                px-4
                                py-2
                                text-sm
                                font-semibold
                                text-white
                                transition
                                hover:bg-violet-500
                                disabled:opacity-50
                              "
                            >
                              {connecting
                                ? "กำลังเปิด MetaMask..."
                                : "Connect MetaMask"}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div
                            className="
                              mt-2
                              flex
                              items-center
                              gap-2
                              text-xs
                              font-semibold
                              text-emerald-300
                            "
                          >
                            <CheckCircle2
                              size={14}
                            />

                            พร้อมรับ SKT
                          </div>

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
                            {address}
                          </p>

                          <p
                            className="
                              mt-2
                              text-xs
                              leading-5
                              text-slate-500
                            "
                          >
                            Wallet นี้จะถูกบันทึกกับ Skill นี้
                            เป็น Wallet สำหรับรับค่าเรียน
                          </p>
                        </>
                      )}

                      {message && (
                        <p
                          className="
                            mt-2
                            text-xs
                            text-slate-500
                          "
                        >
                          {message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================= */}
              {/* ERROR */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* SUCCESS */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* SUBMIT */}
              {/* ================================= */}

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

                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Plus
                      size={18}
                    />

                    สร้างทักษะ
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ===================================== */}
          {/* MY SKILLS */}
          {/* ===================================== */}

          <div
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
                mb-6
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
                  Teaching Library
                </p>

                <h2
                  className="
                    mt-1
                    text-2xl
                    font-bold
                  "
                >
                  ทักษะของฉัน
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadSkills()
                }
                disabled={
                  skillsLoading
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
                    skillsLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                รีเฟรช
              </button>
            </div>

            {/* LOADING */}

            {skillsLoading && (
              <div
                className="
                  flex
                  min-h-[300px]
                  flex-col
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

                <p
                  className="
                    mt-4
                    text-sm
                    text-slate-400
                  "
                >
                  กำลังโหลดทักษะ...
                </p>
              </div>
            )}

            {/* ERROR */}

            {!skillsLoading &&
              skillsError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/10
                    p-4
                    text-sm
                    text-red-300
                  "
                >
                  {skillsError}
                </div>
              )}

            {/* EMPTY */}

            {!skillsLoading &&
              !skillsError &&
              mySkills.length ===
                0 && (
                <div
                  className="
                    flex
                    min-h-[300px]
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
                      size={28}
                    />
                  </div>

                  <h3
                    className="
                      mt-5
                      text-lg
                      font-semibold
                    "
                  >
                    ยังไม่มีทักษะ
                  </h3>

                  <p
                    className="
                      mt-2
                      max-w-sm
                      text-sm
                      leading-6
                      text-slate-500
                    "
                  >
                    สร้างทักษะแรกของคุณจากแบบฟอร์มด้านซ้ายได้เลย
                  </p>
                </div>
              )}

            {/* LIST */}

            {!skillsLoading &&
              !skillsError &&
              mySkills.length >
                0 && (
                <div
                  className="
                    space-y-3
                  "
                >
                  {mySkills.map(
                    (
                      skill
                    ) => (
                      <SkillRow
                        key={
                          skill.id
                        }
                        skill={
                          skill
                        }
                        onManageLessons={() =>
                          router.push(
                            `/teaching/${skill.id}/lessons`
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
          </div>
        </div>
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
  title,
  value,
}: {
  title: string;
  value: string;
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
          text-white
        "
      >
        {value}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * SKILL ROW
 * =========================================================
 */

function SkillRow({
  skill,
  onManageLessons,
}: {
  skill: Skill;
  onManageLessons: () => void;
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
          gap-4
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
          <BookOpen
            size={19}
          />
        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >
          {/* ===================================== */}
          {/* TITLE + PRICE */}
          {/* ===================================== */}

          <div
            className="
              flex
              flex-wrap
              items-start
              justify-between
              gap-3
            "
          >
            <div
              className="
                min-w-0
                flex-1
              "
            >
              <h3
                className="
                  font-semibold
                  text-white
                "
              >
                {skill.title}
              </h3>

              <p
                className="
                  mt-1
                  line-clamp-2
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                {skill.description}
              </p>
            </div>

            <div
              className="
                shrink-0
                rounded-full
                bg-violet-500/10
                px-3
                py-1.5
                text-xs
                font-semibold
                text-violet-300
              "
            >
              {skill.price ===
              0
                ? "ฟรี"
                : `${skill.price.toLocaleString()} SKT`}
            </div>
          </div>

          {/* ===================================== */}
          {/* META */}
          {/* ===================================== */}

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            {/* CATEGORY */}

            {skill.category ? (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-violet-500/20
                  bg-violet-500/10
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  text-violet-300
                "
              >
                <Tags
                  size={12}
                />

                {skill.category}
              </span>
            ) : (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-amber-500/20
                  bg-amber-500/10
                  px-2.5
                  py-1
                  text-xs
                  text-amber-300
                "
              >
                <Tags
                  size={12}
                />

                ยังไม่ระบุหมวดหมู่
              </span>
            )}

            {/* DATE */}

            <span
              className="
                text-xs
                text-slate-500
              "
            >
              สร้างเมื่อ{" "}
              {formatDate(
                skill.createdAt
              )}
            </span>
          </div>

          {/* ===================================== */}
          {/* WALLET */}
          {/* ===================================== */}

          {skill.price >
            0 && (
            <div
              className="
                mt-3
                flex
                items-center
                gap-1.5
                text-xs
              "
            >
              <Wallet2
                size={13}
                className="
                  shrink-0
                  text-violet-400
                "
              />

              {skill.payoutAddress ? (
                <span
                  className="
                    font-mono
                    text-slate-500
                  "
                >
                  {shortAddress(
                    skill.payoutAddress
                  )}
                </span>
              ) : (
                <span
                  className="
                    text-amber-300
                  "
                >
                  ยังไม่มี Wallet รับ SKT
                </span>
              )}
            </div>
          )}

          {/* ===================================== */}
          {/* MANAGE LESSONS */}
          {/* ===================================== */}

          <div
            className="
              mt-4
            "
          >
            <button
              type="button"
              onClick={
                onManageLessons
              }
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-violet-500/20
                bg-violet-500/10
                px-4
                py-2.5
                text-sm
                font-semibold
                text-violet-300
                transition
                hover:border-violet-400/30
                hover:bg-violet-500/20
                hover:text-violet-200
              "
            >
              <BookOpen
                size={16}
              />

              จัดการบทเรียน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * SHORT ADDRESS
 * =========================================================
 */

function shortAddress(
  address: string
) {
  if (
    address.length <=
    18
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

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function formatDate(
  value: string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "th-TH",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}