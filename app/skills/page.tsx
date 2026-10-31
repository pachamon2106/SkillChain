"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  BrowserProvider,
  parseUnits,
} from "ethers";

import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  ExternalLink,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  UserRound,
  Wallet2,
  X,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";

import {
  useWallet,
} from "@/components/wallet/WalletProvider";

import {
  getSkillTokenContract,
} from "@/lib/token";

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

type SkillOwner = {
  id: number;
  name: string | null;
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

  owner: SkillOwner;
};

type Enrollment = {
  id: number;
  status: string;
  paidAmount: number;

  paymentTxHash:
    | string
    | null;

  createdAt: string;

  skill: {
    id: number;
  };
};

type SortMode =
  | "newest"
  | "price-low"
  | "price-high";

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function SkillsPage() {
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
    formattedBalance,
    connectWallet,
    switchToBscTestnet,
    refreshBalance,
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

  /*
   * =========================================================
   * SEARCH
   * =========================================================
   */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] =
    useState("");

  /*
   * =========================================================
   * CATEGORY
   * =========================================================
   */

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState("");

  /*
   * =========================================================
   * SORT
   * =========================================================
   */

  const [
    sortMode,
    setSortMode,
  ] =
    useState<SortMode>(
      "newest"
    );

  /*
   * =========================================================
   * DETAIL MODAL
   * =========================================================
   */

  const [
    selectedSkill,
    setSelectedSkill,
  ] =
    useState<Skill | null>(
      null
    );

  /*
   * =========================================================
   * ENROLLMENT UI
   * =========================================================
   */

  const [
    enrollingSkillId,
    setEnrollingSkillId,
  ] =
    useState<number | null>(
      null
    );

  const [
    enrollmentError,
    setEnrollmentError,
  ] =
    useState("");

  const [
    enrollmentSuccess,
    setEnrollmentSuccess,
  ] =
    useState("");

  /*
   * ถ้าจ่าย Blockchain แล้ว
   * แต่ API ยังบันทึก Enrollment ไม่สำเร็จ
   *
   * เก็บ Transaction เดิมใน Memory
   * เพื่อไม่ให้ผู้เรียนจ่ายซ้ำ
   */
  const [
    pendingPayment,
    setPendingPayment,
  ] =
    useState<{
      skillId: number;
      txHash: string;
    } | null>(
      null
    );

  /*
   * =========================================================
   * REQUEST GUARD
   * =========================================================
   */

  const requestIdRef =
    useRef(
      0
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
   *
   * รองรับพร้อมกัน:
   *
   * q
   * category
   *
   * ตัวอย่าง:
   *
   * /api/skills?q=css&category=Programming
   */
  const loadSkills =
    useCallback(
      async (
        query = "",
        categoryFilter = ""
      ) => {
        const requestId =
          ++requestIdRef.current;

        try {
          setSkillsLoading(
            true
          );

          setSkillsError(
            ""
          );

          const params =
            new URLSearchParams();

          /*
           * SEARCH
           */
          if (
            query.trim()
          ) {
            params.set(
              "q",
              query.trim()
            );
          }

          /*
           * CATEGORY
           */
          if (
            categoryFilter.trim()
          ) {
            params.set(
              "category",
              categoryFilter.trim()
            );
          }

          const url =
            params.toString()
              ? `/api/skills?${params.toString()}`
              : "/api/skills";

          const response =
            await fetch(
              url,
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
           * Request เก่า
           * ห้ามทับ Request ใหม่
           */
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          if (
            !response.ok ||
            !data?.success
          ) {
            setSkills(
              []
            );

            setSkillsError(
              data?.message ||
                "ไม่สามารถโหลดรายการทักษะได้"
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

          /*
           * Categories
           * มาจาก Database จริง
           */
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
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          console.error(
            "Load skills error:",
            error
          );

          setSkills(
            []
          );

          setSkillsError(
            "ไม่สามารถเชื่อมต่อเพื่อโหลดรายการทักษะได้"
          );
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setSkillsLoading(
              false
            );
          }
        }
      },
      []
    );

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
   *
   * รองรับ:
   *
   * /skills
   *
   * /skills?category=Programming
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const initialCategory =
      params
        .get(
          "category"
        )
        ?.trim() ??
      "";

    /*
     * ถ้าเข้ามาจากหน้า Categories
     * ตั้งหมวดให้อัตโนมัติ
     */
    setSelectedCategory(
      initialCategory
    );

    void loadSkills(
      "",
      initialCategory
    );

    void loadEnrollments();
  }, [
    loadSkills,
    loadEnrollments,
  ]);

  /*
   * =========================================================
   * SEARCH + CATEGORY DEBOUNCE
   * =========================================================
   */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const normalized =
            search.trim();

          setAppliedSearch(
            normalized
          );

          void loadSkills(
            normalized,
            selectedCategory
          );
        },
        400
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    search,
    selectedCategory,
    loadSkills,
  ]);

  /*
   * =========================================================
   * CHANGE CATEGORY
   * =========================================================
   */

  function changeCategory(
    nextCategory: string
  ) {
    setSelectedCategory(
      nextCategory
    );

    /*
     * Update URL
     *
     * เพื่อให้หน้า Categories
     * และหน้า Skills เชื่อมกัน
     */
    const params =
      new URLSearchParams();

    if (
      nextCategory.trim()
    ) {
      params.set(
        "category",
        nextCategory.trim()
      );
    }

    const nextUrl =
      params.toString()
        ? `/skills?${params.toString()}`
        : "/skills";

    router.replace(
      nextUrl,
      {
        scroll: false,
      }
    );
  }

  /*
   * =========================================================
   * ENROLLED SKILL IDS
   * =========================================================
   */

  const enrolledSkillIds =
    useMemo(
      () => {
        return new Set(
          enrollments.map(
            (
              item
            ) =>
              item.skill.id
          )
        );
      },
      [
        enrollments,
      ]
    );

  /*
   * =========================================================
   * SORT
   * =========================================================
   */

  const sortedSkills =
    useMemo(
      () => {
        const list =
          [
            ...skills,
          ];

        /*
         * PRICE LOW
         */
        if (
          sortMode ===
          "price-low"
        ) {
          list.sort(
            (
              a,
              b
            ) =>
              a.price -
              b.price
          );
        }

        /*
         * PRICE HIGH
         */
        if (
          sortMode ===
          "price-high"
        ) {
          list.sort(
            (
              a,
              b
            ) =>
              b.price -
              a.price
          );
        }

        /*
         * NEWEST
         */
        if (
          sortMode ===
          "newest"
        ) {
          list.sort(
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
          );
        }

        return list;
      },
      [
        skills,
        sortMode,
      ]
    );

  /*
   * =========================================================
   * RESULT TITLE
   * =========================================================
   */

  const resultTitle =
    useMemo(
      () => {
        if (
          appliedSearch &&
          selectedCategory
        ) {
          return `ผลการค้นหา “${appliedSearch}” ในหมวด “${selectedCategory}”`;
        }

        if (
          appliedSearch
        ) {
          return `ผลการค้นหา “${appliedSearch}”`;
        }

        if (
          selectedCategory
        ) {
          return `หมวดหมู่ “${selectedCategory}”`;
        }

        return "ทักษะทั้งหมด";
      },
      [
        appliedSearch,
        selectedCategory,
      ]
    );

  /*
   * =========================================================
   * OPEN SKILL
   * =========================================================
   */

  function openSkill(
    skill: Skill
  ) {
    setEnrollmentError(
      ""
    );

    setEnrollmentSuccess(
      ""
    );

    setSelectedSkill(
      skill
    );
  }

  /*
   * =========================================================
   * CLOSE SKILL
   * =========================================================
   */

  function closeSkill() {
    if (
      enrollingSkillId !==
      null
    ) {
      return;
    }

    setSelectedSkill(
      null
    );

    setEnrollmentError(
      ""
    );

    setEnrollmentSuccess(
      ""
    );
  }

  /*
   * =========================================================
   * ESC CLOSE MODAL
   * =========================================================
   */

  useEffect(() => {
    if (
      !selectedSkill
    ) {
      return;
    }

    const handleKeyDown =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
            "Escape" &&
          enrollingSkillId ===
            null
        ) {
          closeSkill();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedSkill,
    enrollingSkillId,
  ]);

  /*
   * =========================================================
   * CREATE ENROLLMENT FROM API
   * =========================================================
   */

  async function submitEnrollment({
    skill,
    txHash,
  }: {
    skill: Skill;

    txHash?:
      string;
  }) {
    const response =
      await fetch(
        "/api/enrollments",
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
              skillId:
                skill.id,

              ...(txHash
                ? {
                    txHash,
                  }
                : {}),
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
      throw new Error(
        data?.message ||
          "ไม่สามารถสมัครเรียนได้"
      );
    }

    return data;
  }

  /*
   * =========================================================
   * ENROLL FREE
   * =========================================================
   */

  async function enrollFreeSkill(
    skill: Skill
  ) {
    try {
      setEnrollingSkillId(
        skill.id
      );

      setEnrollmentError(
        ""
      );

      setEnrollmentSuccess(
        ""
      );

      await submitEnrollment({
        skill,
      });

      setEnrollmentSuccess(
        "สมัครเรียนสำเร็จแล้ว"
      );

      await loadEnrollments();
    } catch (error) {
      console.error(
        "Free enrollment error:",
        error
      );

      setEnrollmentError(
        getErrorMessage(
          error
        )
      );
    } finally {
      setEnrollingSkillId(
        null
      );
    }
  }

  /*
   * =========================================================
   * PAID ENROLLMENT
   * =========================================================
   */

  async function enrollPaidSkill(
    skill: Skill
  ) {
    /*
     * Skill เก่า
     * ไม่มี Wallet รับเงิน
     */
    if (
      !skill.payoutAddress
    ) {
      setEnrollmentError(
        "Skill นี้ยังไม่มี Wallet สำหรับรับ SKT กรุณาให้ผู้สอนตั้งค่า Wallet ก่อน"
      );

      return;
    }

    /*
     * Network ผิด
     */
    if (
      status ===
      "wrong-network"
    ) {
      setEnrollmentError(
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
      setEnrollmentError(
        "กรุณา Connect MetaMask ก่อนชำระ SKT"
      );

      return;
    }

    const ethereum =
      (
        window as any
      ).ethereum;

    if (
      !ethereum
    ) {
      setEnrollmentError(
        "ไม่พบ MetaMask ใน Browser"
      );

      return;
    }

    /*
     * เก็บ Hash ไว้ใน Local Variable ด้วย
     *
     * ถ้าส่ง Token สำเร็จ
     * แต่ Server มีปัญหา
     * จะรู้แน่นอนว่าห้ามจ่ายใหม่
     */
    let sentTxHash:
      | string
      | null =
      null;

    try {
      setEnrollingSkillId(
        skill.id
      );

      setEnrollmentError(
        ""
      );

      setEnrollmentSuccess(
        ""
      );

      /*
       * =====================================================
       * CHECK CURRENT METAMASK ACCOUNT
       * =====================================================
       */

      const accounts =
        (
          await ethereum.request({
            method:
              "eth_accounts",
          })
        ) as string[];

      if (
        !accounts ||
        accounts.length ===
          0
      ) {
        throw new Error(
          "MetaMask ไม่ได้เชื่อม Account อยู่ กรุณา Connect ใหม่"
        );
      }

      const currentAccount =
        accounts[0];

      if (
        currentAccount.toLowerCase() !==
        address.toLowerCase()
      ) {
        throw new Error(
          "Account ใน MetaMask เปลี่ยนไปแล้ว กรุณา Connect Wallet ใหม่"
        );
      }

      /*
       * =====================================================
       * PROVIDER + SIGNER
       * =====================================================
       */

      const provider =
        new BrowserProvider(
          ethereum
        );

      const signer =
        await provider.getSigner();

      const token =
        getSkillTokenContract(
          signer
        );

      /*
       * =====================================================
       * AMOUNT
       * =====================================================
       */

      const decimals =
        await token.decimals();

      const amount =
        parseUnits(
          String(
            skill.price
          ),
          decimals
        );

      /*
       * =====================================================
       * CHECK SKT BALANCE
       * =====================================================
       */

      const balance =
        await token.balanceOf(
          address
        );

      if (
        balance <
        amount
      ) {
        throw new Error(
          `SKT ไม่เพียงพอ ต้องใช้ ${skill.price.toLocaleString()} SKT`
        );
      }

      /*
       * =====================================================
       * TRANSFER
       * =====================================================
       */

      setEnrollmentSuccess(
        "กรุณายืนยันการชำระ SKT ใน MetaMask"
      );

      const transaction =
        await token.transfer(
          skill.payoutAddress,
          amount
        );

      sentTxHash =
        transaction.hash;

      /*
       * เก็บทันที
       *
       * ใช้ Retry ได้
       * โดยไม่ Transfer ใหม่
       */
      setPendingPayment({
        skillId:
          skill.id,

        txHash:
          transaction.hash,
      });

      setEnrollmentSuccess(
        "ส่ง Transaction แล้ว กำลังรอ Blockchain ยืนยัน..."
      );

      /*
       * =====================================================
       * WAIT BLOCKCHAIN
       * =====================================================
       */

      await transaction.wait();

      /*
       * Wallet Balance / History
       */
      window.dispatchEvent(
        new Event(
          "sktBalanceChanged"
        )
      );

      await refreshBalance();

      /*
       * =====================================================
       * SERVER VERIFY
       * =====================================================
       */

      setEnrollmentSuccess(
        "Blockchain ยืนยันแล้ว กำลังตรวจสอบการชำระ..."
      );

      await submitEnrollment({
        skill,

        txHash:
          transaction.hash,
      });

      /*
       * Success
       */
      setPendingPayment(
        null
      );

      setEnrollmentError(
        ""
      );

      setEnrollmentSuccess(
        "ชำระ SKT และสมัครเรียนสำเร็จแล้ว"
      );

      await loadEnrollments();
    } catch (error: any) {
      console.error(
        "Paid enrollment error:",
        error
      );

      /*
       * User ยกเลิก
       * ก่อนส่ง Transaction
       */
      if (
        error?.code ===
          4001 ||
        error?.code ===
          "ACTION_REJECTED"
      ) {
        setEnrollmentSuccess(
          ""
        );

        setEnrollmentError(
          "ยกเลิกการชำระใน MetaMask"
        );

        return;
      }

      /*
       * ถ้ามี Transaction แล้ว
       *
       * ห้ามจ่ายซ้ำ
       */
      if (
        sentTxHash ||
        pendingPayment?.skillId ===
          skill.id
      ) {
        setEnrollmentSuccess(
          ""
        );

        setEnrollmentError(
          "มี Transaction การชำระแล้ว แต่ยังบันทึกการสมัครไม่สำเร็จ กรุณากด “ยืนยันการสมัครอีกครั้ง” โดยไม่ต้องชำระซ้ำ"
        );

        return;
      }

      setEnrollmentSuccess(
        ""
      );

      setEnrollmentError(
        getErrorMessage(
          error
        )
      );
    } finally {
      setEnrollingSkillId(
        null
      );
    }
  }

  /*
   * =========================================================
   * RETRY EXISTING PAYMENT
   * =========================================================
   *
   * ไม่ Transfer ใหม่
   *
   * ใช้ txHash เดิม
   * ให้ Server ตรวจอีกครั้ง
   */
  async function retryPaidEnrollment(
    skill: Skill
  ) {
    if (
      !pendingPayment ||
      pendingPayment.skillId !==
        skill.id
    ) {
      return;
    }

    try {
      setEnrollingSkillId(
        skill.id
      );

      setEnrollmentError(
        ""
      );

      setEnrollmentSuccess(
        "กำลังตรวจสอบ Transaction เดิม..."
      );

      await submitEnrollment({
        skill,

        txHash:
          pendingPayment.txHash,
      });

      setPendingPayment(
        null
      );

      setEnrollmentError(
        ""
      );

      setEnrollmentSuccess(
        "ยืนยันการชำระและสมัครเรียนสำเร็จแล้ว"
      );

      await loadEnrollments();

      window.dispatchEvent(
        new Event(
          "sktBalanceChanged"
        )
      );

      await refreshBalance();
    } catch (error) {
      console.error(
        "Retry enrollment error:",
        error
      );

      setEnrollmentSuccess(
        ""
      );

      setEnrollmentError(
        getErrorMessage(
          error
        )
      );
    } finally {
      setEnrollingSkillId(
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
              Skill Marketplace
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              ค้นหาทักษะ
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              ค้นหาความรู้และทักษะจากผู้สอนใน SkillChain
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
            rounded-[32px]
            border
            border-violet-500/20
            bg-gradient-to-r
            from-[#171f4b]
            via-[#26245f]
            to-[#432875]
            p-7
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
              max-w-3xl
            "
          >
            <div
              className="
                mb-4
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

              Discover Skills
            </div>

            <h2
              className="
                text-3xl
                font-bold
                leading-tight
              "
            >
              เรียนรู้สิ่งใหม่
              <br />
              จากคนในชุมชน SkillChain
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
              ค้นหาทักษะที่สนใจ ดูรายละเอียดผู้สอน
              สมัครเรียนฟรี หรือชำระด้วย SKT ผ่าน Blockchain
            </p>

            {/* SEARCH */}

            <div
              className="
                relative
                mt-6
                max-w-2xl
              "
            >
              <Search
                size={19}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="ค้นหาชื่อทักษะหรือรายละเอียด..."
                className="
                  h-14
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#0b1028]/80
                  pl-12
                  pr-12
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-500
                  focus:border-violet-400/60
                  focus:ring-4
                  focus:ring-violet-500/10
                "
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch(
                      ""
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    flex
                    h-7
                    w-7
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <X
                    size={16}
                  />
                </button>
              )}
            </div>

            {/* ACTIVE CATEGORY */}

            {selectedCategory && (
              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  กำลังดูหมวด:
                </span>

                <button
                  type="button"
                  onClick={() =>
                    changeCategory(
                      ""
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-violet-400/30
                    bg-violet-500/15
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    text-violet-200
                    transition
                    hover:bg-violet-500/25
                  "
                >
                  <Tags
                    size={12}
                  />

                  {selectedCategory}

                  <X
                    size={12}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* TOOLBAR */}
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
                text-lg
                font-semibold
              "
            >
              {resultTitle}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              พบ{" "}
              {
                sortedSkills.length
              }{" "}
              รายการ
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            {/* CATEGORY FILTER */}

            <select
              value={
                selectedCategory
              }
              onChange={(
                event
              ) =>
                changeCategory(
                  event.target
                    .value
                )
              }
              className="
                h-11
                max-w-[220px]
                rounded-xl
                border
                border-white/10
                bg-[#111a33]
                px-4
                text-sm
                text-slate-200
                outline-none
                transition
                focus:border-violet-400/50
              "
            >
              <option
                value=""
              >
                ทุกหมวดหมู่
              </option>

              {categories.map(
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
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            {/* SORT */}

            <select
              value={
                sortMode
              }
              onChange={(
                event
              ) =>
                setSortMode(
                  event.target
                    .value as SortMode
                )
              }
              className="
                h-11
                rounded-xl
                border
                border-white/10
                bg-[#111a33]
                px-4
                text-sm
                text-slate-200
                outline-none
              "
            >
              <option
                value="newest"
              >
                ใหม่ล่าสุด
              </option>

              <option
                value="price-low"
              >
                ราคาน้อย → มาก
              </option>

              <option
                value="price-high"
              >
                ราคามาก → น้อย
              </option>
            </select>

            {/* REFRESH */}

            <button
              type="button"
              disabled={
                skillsLoading
              }
              onClick={() => {
                void loadSkills(
                  appliedSearch,
                  selectedCategory
                );

                void loadEnrollments();
              }}
              className="
                flex
                h-11
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-4
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
        </div>

        {/* ======================================= */}
        {/* LOADING */}
        {/* ======================================= */}

        {skillsLoading && (
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
              size={32}
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
              กำลังค้นหาทักษะ...
            </p>
          </div>
        )}

        {/* ======================================= */}
        {/* ERROR */}
        {/* ======================================= */}

        {!skillsLoading &&
          skillsError && (
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
              {skillsError}
            </div>
          )}

        {/* ======================================= */}
        {/* EMPTY */}
        {/* ======================================= */}

        {!skillsLoading &&
          !skillsError &&
          sortedSkills.length ===
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
                <Search
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
                ไม่พบทักษะ
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
                {appliedSearch &&
                selectedCategory
                  ? "ไม่พบ Skill ที่ตรงกับคำค้นหาในหมวดหมู่นี้ ลองเปลี่ยนคำค้นหาหรือเลือกทุกหมวดหมู่"
                  : appliedSearch
                  ? "ลองค้นหาด้วยคำอื่น หรือเคลียร์ช่องค้นหาเพื่อดูทักษะทั้งหมด"
                  : selectedCategory
                  ? "ยังไม่มี Skill ในหมวดหมู่นี้"
                  : "ยังไม่มีทักษะถูกสร้างในระบบ"}
              </p>

              {selectedCategory && (
                <button
                  type="button"
                  onClick={() =>
                    changeCategory(
                      ""
                    )
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
                  ดูทุกหมวดหมู่
                </button>
              )}
            </div>
          )}

        {/* ======================================= */}
        {/* SKILL GRID */}
        {/* ======================================= */}

        {!skillsLoading &&
          !skillsError &&
          sortedSkills.length >
            0 && (
            <div
              className="
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {sortedSkills.map(
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
                    isMine={
                      skill.owner.id ===
                      user.id
                    }
                    isEnrolled={
                      enrolledSkillIds.has(
                        skill.id
                      )
                    }
                    onOpen={() =>
                      openSkill(
                        skill
                      )
                    }
                  />
                )
              )}
            </div>
          )}
      </section>

      {/* ========================================= */}
      {/* DETAIL MODAL */}
      {/* ========================================= */}

      {selectedSkill && (
        <SkillDetailModal
          skill={
            selectedSkill
          }
          user={
            user
          }
          isEnrolled={
            enrolledSkillIds.has(
              selectedSkill.id
            )
          }
          enrollmentsLoading={
            enrollmentsLoading
          }
          isConnected={
            isConnected
          }
          walletAddress={
            address
          }
          walletBalance={
            formattedBalance
          }
          walletStatus={
            status
          }
          walletMessage={
            message
          }
          connecting={
            connecting
          }
          enrolling={
            enrollingSkillId ===
            selectedSkill.id
          }
          error={
            enrollmentError
          }
          success={
            enrollmentSuccess
          }
          pendingTxHash={
            pendingPayment?.skillId ===
            selectedSkill.id
              ? pendingPayment.txHash
              : null
          }
          onConnect={
            connectWallet
          }
          onSwitchNetwork={
            switchToBscTestnet
          }
          onEnrollFree={() =>
            void enrollFreeSkill(
              selectedSkill
            )
          }
          onEnrollPaid={() =>
            void enrollPaidSkill(
              selectedSkill
            )
          }
          onRetry={() =>
            void retryPaidEnrollment(
              selectedSkill
            )
          }
          onClose={
            closeSkill
          }
        />
      )}
    </main>
  );
}

/*
 * =========================================================
 * SKILL CARD
 * =========================================================
 */

function SkillCard({
  skill,
  isMine,
  isEnrolled,
  onOpen,
}: {
  skill: Skill;
  isMine: boolean;
  isEnrolled: boolean;
  onOpen: () => void;
}) {
  const ownerName =
    skill.owner.name
      ?.trim() ||
    `ผู้สอน #${skill.owner.id}`;

  return (
    <article
      className="
        group
        flex
        min-h-[330px]
        flex-col
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-[#101734]
        transition
        hover:-translate-y-1
        hover:border-violet-500/30
        hover:shadow-2xl
        hover:shadow-violet-950/20
      "
    >
      {/* HEADER */}

      <div
        className="
          relative
          overflow-hidden
          border-b
          border-white/5
          bg-gradient-to-br
          from-violet-500/15
          via-indigo-500/5
          to-transparent
          p-5
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-8
            -top-8
            h-28
            w-28
            rounded-full
            bg-violet-500/10
            blur-2xl
          "
        />

        <div
          className="
            relative
            flex
            items-start
            justify-between
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
            <BookOpen
              size={20}
            />
          </div>

          <div
            className="
              flex
              flex-col
              items-end
              gap-2
            "
          >
            <div
              className="
                rounded-full
                border
                border-white/10
                bg-black/10
                px-3
                py-1.5
                text-xs
                font-semibold
                text-violet-200
              "
            >
              {skill.price ===
              0
                ? "ฟรี"
                : `${skill.price.toLocaleString()} SKT`}
            </div>

            {isMine && (
              <span
                className="
                  rounded-full
                  bg-blue-500/10
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  text-blue-300
                "
              >
                ทักษะของคุณ
              </span>
            )}

            {isEnrolled && (
              <span
                className="
                  rounded-full
                  bg-emerald-500/10
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  text-emerald-300
                "
              >
                สมัครแล้ว
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}

      <div
        className="
          flex
          flex-1
          flex-col
          p-5
        "
      >
        <h3
          className="
            line-clamp-2
            text-lg
            font-bold
            leading-7
            text-white
          "
        >
          {skill.title}
        </h3>

        {/* CATEGORY */}

        <div
          className="
            mt-3
          "
        >
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
                border-white/10
                bg-white/5
                px-2.5
                py-1
                text-xs
                text-slate-500
              "
            >
              <Tags
                size={12}
              />

              ยังไม่ระบุหมวดหมู่
            </span>
          )}
        </div>

        <p
          className="
            mt-3
            line-clamp-3
            text-sm
            leading-6
            text-slate-400
          "
        >
          {skill.description}
        </p>

        <div
          className="
            mt-5
            space-y-2
          "
        >
          {/* OWNER */}

          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              text-slate-400
            "
          >
            <UserRound
              size={15}
              className="
                text-violet-400
              "
            />

            <span
              className="
                truncate
              "
            >
              {ownerName}
            </span>
          </div>

          {/* DATE */}

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

            {formatDate(
              skill.createdAt
            )}
          </div>
        </div>

        <div
          className="
            mt-auto
            pt-5
          "
        >
          <button
            type="button"
            onClick={
              onOpen
            }
            className="
              flex
              w-full
              items-center
              justify-between
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              group-hover:border-violet-500/20
              hover:bg-violet-500/10
            "
          >
            ดูรายละเอียด

            <ArrowRight
              size={17}
            />
          </button>
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * SKILL DETAIL MODAL
 * =========================================================
 */

function SkillDetailModal({
  skill,
  user,
  isEnrolled,
  enrollmentsLoading,
  isConnected,
  walletAddress,
  walletBalance,
  walletStatus,
  walletMessage,
  connecting,
  enrolling,
  error,
  success,
  pendingTxHash,
  onConnect,
  onSwitchNetwork,
  onEnrollFree,
  onEnrollPaid,
  onRetry,
  onClose,
}: {
  skill: Skill;

  user: User;

  isEnrolled: boolean;

  enrollmentsLoading:
    boolean;

  isConnected:
    boolean;

  walletAddress:
    | string
    | null;

  walletBalance:
    string;

  walletStatus:
    string;

  walletMessage:
    string;

  connecting:
    boolean;

  enrolling:
    boolean;

  error:
    string;

  success:
    string;

  pendingTxHash:
    | string
    | null;

  onConnect:
    () =>
      void | Promise<void>;

  onSwitchNetwork:
    () =>
      void | Promise<void>;

  onEnrollFree:
    () =>
      void;

  onEnrollPaid:
    () =>
      void;

  onRetry:
    () =>
      void;

  onClose:
    () =>
      void;
}) {
  const ownerName =
    skill.owner.name
      ?.trim() ||
    `ผู้สอน #${skill.owner.id}`;

  const isOwnSkill =
    skill.owner.id ===
    user.id;

  const isPaid =
    skill.price >
    0;

  const missingPayout =
    isPaid &&
    !skill.payoutAddress;

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        px-4
        backdrop-blur-sm
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !enrolling
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative
          max-h-[90vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-[30px]
          border
          border-violet-500/20
          bg-[#0b1028]
          p-6
          shadow-2xl
          shadow-violet-950/60
        "
      >
        {/* CLOSE */}

        <button
          type="button"
          onClick={
            onClose
          }
          disabled={
            enrolling
          }
          className="
            absolute
            right-5
            top-5
            flex
            h-10
            w-10
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
            size={19}
          />
        </button>

        {/* ICON */}

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/15
            text-violet-300
          "
        >
          <BookOpen
            size={25}
          />
        </div>

        {/* ID */}

        <p
          className="
            mt-5
            text-xs
            font-semibold
            uppercase
            tracking-[0.2em]
            text-violet-400
          "
        >
          Skill #{skill.id}
        </p>

        {/* TITLE */}

        <h2
          className="
            mt-2
            pr-10
            text-2xl
            font-bold
            leading-9
            text-white
          "
        >
          {skill.title}
        </h2>

        {/* CATEGORY */}

        <div
          className="
            mt-3
          "
        >
          <span
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              border-violet-500/20
              bg-violet-500/10
              px-3
              py-1.5
              text-xs
              font-medium
              text-violet-300
            "
          >
            <Tags
              size={13}
            />

            {skill.category ||
              "ยังไม่ระบุหมวดหมู่"}
          </span>
        </div>

        {/* DESCRIPTION */}

        <p
          className="
            mt-4
            whitespace-pre-wrap
            text-sm
            leading-7
            text-slate-300
          "
        >
          {skill.description}
        </p>

        {/* ======================================= */}
        {/* INFO */}
        {/* ======================================= */}

        <div
          className="
            mt-6
            grid
            gap-3
            sm:grid-cols-3
          "
        >
          {/* OWNER */}

          <InfoBox
            icon={
              <UserRound
                size={14}
              />
            }
            label="ผู้สอน"
            value={
              ownerName
            }
          />

          {/* PRICE */}

          <InfoBox
            icon={
              <Coins
                size={14}
              />
            }
            label="ราคา"
            value={
              skill.price ===
              0
                ? "ฟรี"
                : `${skill.price.toLocaleString()} SKT`
            }
            valueClassName="text-violet-300"
          />

          {/* CATEGORY */}

          <InfoBox
            icon={
              <Tags
                size={14}
              />
            }
            label="หมวดหมู่"
            value={
              skill.category ||
              "ยังไม่ระบุ"
            }
          />
        </div>

        {/* DATE */}

        <div
          className="
            mt-3
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

            สร้างเมื่อ
          </div>

          <p
            className="
              mt-2
              text-sm
              text-slate-300
            "
          >
            {formatDateTime(
              skill.createdAt
            )}
          </p>
        </div>

        {/* ======================================= */}
        {/* PAID WALLET */}
        {/* ======================================= */}

        {isPaid && (
          <div
            className="
              mt-3
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
              <Wallet2
                size={14}
              />

              Wallet รับ SKT
            </div>

            {skill.payoutAddress ? (
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
                {skill.payoutAddress}
              </p>
            ) : (
              <p
                className="
                  mt-2
                  text-sm
                  font-medium
                  text-amber-300
                "
              >
                Skill นี้ยังไม่มี Wallet รับ SKT
              </p>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* STUDENT WALLET */}
        {/* ======================================= */}

        {isPaid &&
          !isOwnSkill &&
          !isEnrolled &&
          !missingPayout && (
            <div
              className="
                mt-4
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
                    Wallet สำหรับชำระ
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
                        Connect MetaMask เพื่อชำระค่าเรียนด้วย SKT
                      </p>

                      {walletStatus ===
                        "wrong-network" &&
                      walletAddress ? (
                        <button
                          type="button"
                          onClick={
                            onSwitchNetwork
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
                            onConnect
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

                        พร้อมชำระ
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
                        {walletAddress}
                      </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          text-slate-400
                        "
                      >
                        ยอดปัจจุบัน{" "}

                        <span
                          className="
                            font-semibold
                            text-white
                          "
                        >
                          {walletBalance} SKT
                        </span>
                      </p>
                    </>
                  )}

                  {walletMessage && (
                    <p
                      className="
                        mt-2
                        text-xs
                        text-slate-500
                      "
                    >
                      {walletMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* ======================================= */}
        {/* ERROR */}
        {/* ======================================= */}

        {error && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-3
              text-sm
              leading-6
              text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* ======================================= */}
        {/* SUCCESS */}
        {/* ======================================= */}

        {success && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-emerald-500/20
              bg-emerald-500/10
              px-4
              py-3
              text-sm
              leading-6
              text-emerald-300
            "
          >
            {success}
          </div>
        )}

        {/* ======================================= */}
        {/* PENDING PAYMENT */}
        {/* ======================================= */}

        {pendingTxHash &&
          !isEnrolled && (
            <div
              className="
                mt-4
                rounded-2xl
                border
                border-amber-500/20
                bg-amber-500/5
                p-4
              "
            >
              <p
                className="
                  text-sm
                  font-semibold
                  text-amber-300
                "
              >
                พบ Transaction ที่ชำระแล้ว
              </p>

              <p
                className="
                  mt-2
                  break-all
                  font-mono
                  text-xs
                  leading-5
                  text-slate-400
                "
              >
                {pendingTxHash}
              </p>

              <a
                href={`https://testnet.bscscan.com/tx/${pendingTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-1.5
                  text-xs
                  font-medium
                  text-violet-300
                  hover:text-violet-200
                "
              >
                ดูบน BscScan

                <ExternalLink
                  size={13}
                />
              </a>
            </div>
          )}

        {/* ======================================= */}
        {/* ACTION */}
        {/* ======================================= */}

        <div
          className="
            mt-6
          "
        >
          {enrollmentsLoading ? (
            <button
              type="button"
              disabled
              className="
                flex
                h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white/5
                text-sm
                font-semibold
                text-slate-400
              "
            >
              <Loader2
                size={17}
                className="
                  animate-spin
                "
              />

              กำลังตรวจสอบการสมัคร...
            </button>
          ) : isOwnSkill ? (
            <div
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-blue-500/20
                bg-blue-500/10
                px-4
                py-3
                text-sm
                font-semibold
                text-blue-300
              "
            >
              <UserRound
                size={17}
              />

              นี่คือทักษะของคุณ
            </div>
          ) : isEnrolled ? (
            <div
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-emerald-500/20
                bg-emerald-500/10
                px-4
                py-3
                text-sm
                font-semibold
                text-emerald-300
              "
            >
              <GraduationCap
                size={18}
              />

              สมัครเรียนแล้ว
            </div>
          ) : missingPayout ? (
            <button
              type="button"
              disabled
              className="
                h-12
                w-full
                rounded-xl
                bg-white/5
                text-sm
                font-semibold
                text-slate-500
              "
            >
              ยังไม่สามารถสมัคร Skill นี้ได้
            </button>
          ) : pendingTxHash ? (
            <button
              type="button"
              onClick={
                onRetry
              }
              disabled={
                enrolling
              }
              className="
                flex
                h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-amber-500
                font-semibold
                text-slate-950
                transition
                hover:bg-amber-400
                disabled:opacity-50
              "
            >
              {enrolling ? (
                <>
                  <Loader2
                    size={18}
                    className="
                      animate-spin
                    "
                  />

                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <RefreshCw
                    size={17}
                  />

                  ยืนยันการสมัครอีกครั้ง
                </>
              )}
            </button>
          ) : skill.price ===
            0 ? (
            <button
              type="button"
              onClick={
                onEnrollFree
              }
              disabled={
                enrolling
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
                disabled:opacity-50
              "
            >
              {enrolling ? (
                <>
                  <Loader2
                    size={18}
                    className="
                      animate-spin
                    "
                  />

                  กำลังสมัคร...
                </>
              ) : (
                <>
                  <GraduationCap
                    size={18}
                  />

                  สมัครเรียนฟรี
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={
                onEnrollPaid
              }
              disabled={
                enrolling ||
                !isConnected
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
              {enrolling ? (
                <>
                  <Loader2
                    size={18}
                    className="
                      animate-spin
                    "
                  />

                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <Coins
                    size={18}
                  />

                  สมัครเรียน{" "}
                  {skill.price.toLocaleString()}{" "}
                  SKT
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * INFO BOX
 * =========================================================
 */

function InfoBox({
  icon,
  label,
  value,
  valueClassName = "text-white",
}: {
  icon:
    React.ReactNode;

  label:
    string;

  value:
    string;

  valueClassName?:
    string;
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
          items-center
          gap-2
          text-xs
          text-slate-500
        "
      >
        {icon}

        {label}
      </div>

      <p
        className={`
          mt-2
          break-words
          font-semibold
          ${valueClassName}
        `}
      >
        {value}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * ERROR MESSAGE
 * =========================================================
 */

function getErrorMessage(
  error: unknown
) {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
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

function formatDateTime(
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