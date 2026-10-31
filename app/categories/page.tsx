"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Coins,
  Layers3,
  Loader2,
  Search,
  Tags,
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

  _count?: {
    enrollments: number;
    lessons: number;
  };
};

type CategorySummary = {
  name: string;
  total: number;
  free: number;
  paid: number;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function CategoriesPage() {
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
    skillsLoading,
    setSkillsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
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
  }, [
    router,
  ]);

  /*
   * =========================================================
   * LOAD SKILLS
   * =========================================================
   */

  useEffect(() => {
    async function loadSkills() {
      try {
        setSkillsLoading(
          true
        );

        setError(
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

          setError(
            data?.message ||
              "ไม่สามารถโหลดหมวดหมู่ทักษะได้"
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
      } catch (error) {
        console.error(
          "Load categories error:",
          error
        );

        setSkills(
          []
        );

        setError(
          "เกิดข้อผิดพลาดในการโหลดหมวดหมู่ทักษะ"
        );
      } finally {
        setSkillsLoading(
          false
        );
      }
    }

    void loadSkills();
  }, []);

  /*
   * =========================================================
   * CATEGORY SUMMARY
   * =========================================================
   */

  const categories =
    useMemo<
      CategorySummary[]
    >(
      () => {
        const map =
          new Map<
            string,
            CategorySummary
          >();

        for (
          const skill of
          skills
        ) {
          const categoryName =
            skill.category
              ?.trim();

          /*
           * Skill เก่าที่ไม่มี Category
           * ไม่เอามารวมเป็นหมวดหลัก
           */
          if (
            !categoryName
          ) {
            continue;
          }

          const existing =
            map.get(
              categoryName
            );

          if (
            existing
          ) {
            existing.total +=
              1;

            if (
              skill.price ===
              0
            ) {
              existing.free +=
                1;
            } else {
              existing.paid +=
                1;
            }

            continue;
          }

          map.set(
            categoryName,
            {
              name:
                categoryName,

              total:
                1,

              free:
                skill.price ===
                0
                  ? 1
                  : 0,

              paid:
                skill.price >
                0
                  ? 1
                  : 0,
            }
          );
        }

        return Array.from(
          map.values()
        ).sort(
          (
            a,
            b
          ) => {
            /*
             * หมวดที่มี Skill มาก
             * ขึ้นก่อน
             */
            if (
              b.total !==
              a.total
            ) {
              return (
                b.total -
                a.total
              );
            }

            return a.name.localeCompare(
              b.name,
              "th"
            );
          }
        );
      },
      [
        skills,
      ]
    );

  /*
   * =========================================================
   * TOTALS
   * =========================================================
   */

  const categorizedSkills =
    useMemo(
      () =>
        skills.filter(
          (
            skill
          ) =>
            Boolean(
              skill.category
                ?.trim()
            )
        ).length,
      [
        skills,
      ]
    );

  const uncategorizedSkills =
    skills.length -
    categorizedSkills;

  /*
   * =========================================================
   * OPEN CATEGORY
   * =========================================================
   */

  function openCategory(
    categoryName: string
  ) {
    router.push(
      `/skills?category=${encodeURIComponent(
        categoryName
      )}`
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
          size={32}
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
              Explore Categories
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              หมวดหมู่ทักษะ
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              เลือกหมวดหมู่เพื่อค้นหาทักษะที่คุณสนใจ
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
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
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
                  text-violet-200
                "
              >
                <Tags
                  size={14}
                />

                Skill Categories
              </div>

              <h2
                className="
                  mt-4
                  text-2xl
                  font-bold
                "
              >
                ค้นหาความรู้ตามหมวดหมู่
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
                สำรวจ Skill จากผู้สอนใน SkillChain
                แล้วเลือกสิ่งที่ตรงกับสิ่งที่คุณอยากเรียน
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
                h-11
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-5
                text-sm
                font-semibold
                text-violet-700
                transition
                hover:bg-violet-50
              "
            >
              <Search
                size={17}
              />

              ดูทักษะทั้งหมด
            </button>
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
            icon={
              <Layers3
                size={19}
              />
            }
            title="หมวดหมู่ทั้งหมด"
            value={
              categories.length.toString()
            }
          />

          <StatCard
            icon={
              <BookOpen
                size={19}
              />
            }
            title="ทักษะในหมวดหมู่"
            value={
              categorizedSkills.toString()
            }
          />

          <StatCard
            icon={
              <Tags
                size={19}
              />
            }
            title="ยังไม่ระบุหมวด"
            value={
              uncategorizedSkills.toString()
            }
          />
        </div>

        {/* ======================================= */}
        {/* CATEGORY SECTION */}
        {/* ======================================= */}

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
            "
          >
            <p
              className="
                text-sm
                text-violet-300
              "
            >
              Browse
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-bold
              "
            >
              เลือกหมวดหมู่
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              กดหมวดหมู่เพื่อไปดู Skill ในหมวดนั้น
            </p>
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
                กำลังโหลดหมวดหมู่...
              </p>
            </div>
          )}

          {/* ERROR */}

          {!skillsLoading &&
            error && (
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

          {/* EMPTY */}

          {!skillsLoading &&
            !error &&
            categories.length ===
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
                  <Tags
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
                  ยังไม่มีหมวดหมู่
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
                  เมื่อผู้สอนสร้าง Skill
                  และกำหนดหมวดหมู่
                  หมวดหมู่จะมาแสดงตรงนี้อัตโนมัติ
                </p>
              </div>
            )}

          {/* CATEGORY GRID */}

          {!skillsLoading &&
            !error &&
            categories.length >
              0 && (
              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-2
                  2xl:grid-cols-3
                "
              >
                {categories.map(
                  (
                    item,
                    index
                  ) => (
                    <CategoryCard
                      key={
                        item.name
                      }
                      category={
                        item
                      }
                      index={
                        index
                      }
                      onClick={() =>
                        openCategory(
                          item.name
                        )
                      }
                    />
                  )
                )}
              </div>
            )}

          {/* UNCATEGORIZED */}

          {!skillsLoading &&
            !error &&
            uncategorizedSkills >
              0 && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-amber-500/15
                  bg-amber-500/[0.04]
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
                  <Tags
                    size={18}
                    className="
                      mt-0.5
                      shrink-0
                      text-amber-300
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-amber-200
                      "
                    >
                      มี Skill เก่าที่ยังไม่ได้ระบุหมวดหมู่
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      ทั้งหมด{" "}
                      {uncategorizedSkills}{" "}
                      Skill ซึ่งสร้างไว้ก่อนเพิ่มระบบหมวดหมู่
                    </p>
                  </div>
                </div>
              </div>
            )}
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
  icon,
  title,
  value,
}: {
  icon:
    React.ReactNode;

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
 * CATEGORY CARD
 * =========================================================
 */

function CategoryCard({
  category,
  index,
  onClick,
}: {
  category:
    CategorySummary;

  index: number;

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
        group
        rounded-[24px]
        border
        border-white/10
        bg-white/[0.03]
        p-5
        text-left
        transition
        hover:-translate-y-0.5
        hover:border-violet-500/30
        hover:bg-violet-500/[0.06]
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
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/15
            text-violet-300
            transition
            group-hover:bg-violet-500/20
          "
        >
          <Tags
            size={21}
          />
        </div>

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-white/5
            text-slate-500
            transition
            group-hover:bg-violet-500/10
            group-hover:text-violet-300
          "
        >
          <ChevronRight
            size={17}
          />
        </div>
      </div>

      <p
        className="
          mt-5
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.18em]
          text-slate-600
        "
      >
        Category{" "}
        {String(
          index +
            1
        ).padStart(
          2,
          "0"
        )}
      </p>

      <h3
        className="
          mt-1
          text-lg
          font-bold
          text-white
        "
      >
        {category.name}
      </h3>

      <div
        className="
          mt-4
          flex
          flex-wrap
          gap-2
        "
      >
        <span
          className="
            rounded-full
            bg-violet-500/10
            px-2.5
            py-1
            text-xs
            text-violet-300
          "
        >
          {category.total}{" "}
          Skill
        </span>

        <span
          className="
            rounded-full
            bg-emerald-500/10
            px-2.5
            py-1
            text-xs
            text-emerald-300
          "
        >
          ฟรี{" "}
          {category.free}
        </span>

        <span
          className="
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-amber-500/10
            px-2.5
            py-1
            text-xs
            text-amber-300
          "
        >
          <Coins
            size={11}
          />

          มีราคา{" "}
          {category.paid}
        </span>
      </div>
    </button>
  );
}