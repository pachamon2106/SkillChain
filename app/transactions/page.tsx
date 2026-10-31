"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  BrowserProvider,
} from "ethers";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  UserRound,
  Wallet2,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";

import {
  useWallet,
} from "@/components/wallet/WalletProvider";

import {
  getSktHistory,
  getSktHistoryErrorMessage,
  type SktHistoryItem,
} from "@/lib/sktHistory";

type User = {
  id: number;
  name: string | null;
  email: string;
};

type WalletNames =
  Record<string, string>;

export default function TransactionsPage() {
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
   * TRANSACTIONS
   * =========================================================
   */
  const [
    transactions,
    setTransactions,
  ] =
    useState<
      SktHistoryItem[]
    >([]);

  const [
    walletNames,
    setWalletNames,
  ] =
    useState<WalletNames>(
      {}
    );

  const [
    transactionLoading,
    setTransactionLoading,
  ] =
    useState(false);

  const [
    transactionError,
    setTransactionError,
  ] =
    useState("");

  /*
   * =========================================================
   * REQUEST SEQUENCE
   * =========================================================
   *
   * ป้องกัน Request เก่า
   * กลับมาทับ Request ใหม่
   *
   * เช่น:
   *
   * เข้า Transactions
   * ↓
   * Request A
   *
   * เกิด Effect ใหม่
   * ↓
   * Request B
   *
   * ถ้า A ช้ากว่า B
   * เราจะไม่ให้ A เขียน State ทับ B
   */
  const historyRequestRef =
    useRef(0);

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
   * LOGOUT
   * =========================================================
   */
  async function logout() {
    /*
     * invalidate history request
     */
    historyRequestRef.current +=
      1;

    resetWallet(
      "ออกจากระบบแล้ว กรุณา Connect Wallet ใหม่"
    );

    setTransactions([]);
    setWalletNames({});

    try {
      await fetch(
        "/api/logout",
        {
          method: "POST",

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
   * FETCH WALLET NAMES
   * =========================================================
   *
   * Function นี้ไม่ setState เอง
   *
   * คืน names กลับไปให้
   * loadTransactions เป็นคน set
   *
   * เพื่อกัน Request เก่า
   * มาเขียนชื่อทับ Request ใหม่
   */
  const fetchWalletNames =
    useCallback(
      async (
        items:
          SktHistoryItem[]
      ): Promise<WalletNames> => {
        try {
          const addresses =
            Array.from(
              new Set(
                items.map(
                  (item) =>
                    (
                      item.type ===
                      "send"
                        ? item.to
                        : item.from
                    ).toLowerCase()
                )
              )
            );

          if (
            addresses.length ===
            0
          ) {
            return {};
          }

          const response =
            await fetch(
              "/api/wallet-names",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                credentials:
                  "include",

                body:
                  JSON.stringify({
                    addresses,
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
            console.error(
              "Load wallet names failed:",
              data
            );

            return {};
          }

          const rawNames:
            Record<
              string,
              unknown
            > =
            data?.names &&
            typeof data.names ===
              "object"
              ? data.names
              : {};

          const names:
            WalletNames = {};

          for (
            const [
              walletAddress,
              accountName,
            ] of Object.entries(
              rawNames
            )
          ) {
            if (
              typeof accountName !==
              "string"
            ) {
              continue;
            }

            names[
              walletAddress.toLowerCase()
            ] =
              accountName;
          }

          return names;
        } catch (error) {
          console.error(
            "Load wallet names error:",
            error
          );

          return {};
        }
      },
      []
    );

  /*
   * =========================================================
   * LOAD TRANSACTIONS
   * =========================================================
   */
  const loadTransactions =
    useCallback(
      async (
        walletAddress: string
      ) => {
        const ethereum =
          (window as any)
            .ethereum;

        if (!ethereum) {
          setTransactionError(
            "ไม่พบ MetaMask ใน Browser"
          );

          return;
        }

        /*
         * Request ID ใหม่
         */
        const requestId =
          ++historyRequestRef.current;

        try {
          setTransactionLoading(
            true
          );

          setTransactionError(
            ""
          );

          /*
           * =================================================
           * ACCOUNT CHECK
           * =================================================
           */
          const accounts =
            (await ethereum.request({
              method:
                "eth_accounts",
            })) as string[];

          /*
           * Request นี้ไม่ใช่ตัวล่าสุดแล้ว
           */
          if (
            requestId !==
            historyRequestRef.current
          ) {
            return;
          }

          if (
            !accounts ||
            accounts.length ===
              0
          ) {
            setTransactionError(
              "MetaMask ไม่ได้เชื่อม Account อยู่ กรุณา Connect ใหม่"
            );

            return;
          }

          const currentAccount =
            accounts[0];

          if (
            currentAccount.toLowerCase() !==
            walletAddress.toLowerCase()
          ) {
            setTransactionError(
              "Account ใน MetaMask เปลี่ยนไปแล้ว กรุณา Connect Wallet ใหม่"
            );

            return;
          }

          /*
           * =================================================
           * PROVIDER
           * =================================================
           */
          const provider =
            new BrowserProvider(
              ethereum
            );

          /*
           * =================================================
           * HISTORY
           * =================================================
           *
           * ใช้ตัวเดียวกับ Modal
           */
          let result =
            await getSktHistory({
              provider,

              walletAddress,
            });

          /*
           * Request เก่า
           * ห้ามเขียน State
           */
          if (
            requestId !==
            historyRequestRef.current
          ) {
            return;
          }

          /*
           * =================================================
           * EMPTY RETRY
           * =================================================
           *
           * ถ้าโหลดอัตโนมัติทันทีหลังเปลี่ยนหน้า
           * แล้ว Public RPC คืน 0
           *
           * รอ 900ms
           * แล้วลองอีกครั้ง 1 รอบ
           *
           * ไม่ Loop ไม่จำกัด
           */
          if (
            result.items.length ===
            0
          ) {
            await wait(
              900
            );

            if (
              requestId !==
              historyRequestRef.current
            ) {
              return;
            }

            result =
              await getSktHistory({
                provider,

                walletAddress,
              });
          }

          /*
           * ยังเป็น Request ล่าสุดไหม
           */
          if (
            requestId !==
            historyRequestRef.current
          ) {
            return;
          }

          /*
           * =================================================
           * TRANSACTIONS
           * =================================================
           */
          setTransactions(
            result.items
          );

          /*
           * =================================================
           * WALLET NAMES
           * =================================================
           */
          const names =
            await fetchWalletNames(
              result.items
            );

          if (
            requestId !==
            historyRequestRef.current
          ) {
            return;
          }

          setWalletNames(
            names
          );
        } catch (error) {
          /*
           * Error จาก Request เก่า
           * ไม่ต้องแสดง
           */
          if (
            requestId !==
            historyRequestRef.current
          ) {
            return;
          }

          console.error(
            "Load transactions error:",
            error
          );

          setTransactionError(
            getSktHistoryErrorMessage(
              error
            )
          );
        } finally {
          /*
           * Request ล่าสุดเท่านั้น
           * ที่มีสิทธิ์ปิด Loading
           */
          if (
            requestId ===
            historyRequestRef.current
          ) {
            setTransactionLoading(
              false
            );
          }
        }
      },
      [
        fetchWalletNames,
      ]
    );

  /*
   * =========================================================
   * AUTO LOAD
   * =========================================================
   *
   * จุดที่แก้สำคัญ:
   *
   * เดิมเข้า Page แล้ว Query ทันที
   *
   * รอบนี้รอ 700ms
   * ให้:
   *
   * - Route เปลี่ยนเสร็จ
   * - WalletProvider settle
   * - MetaMask provider settle
   *
   * ก่อน Query
   */
  useEffect(() => {
    /*
     * Wallet หลุด
     */
    if (
      !isConnected ||
      !address
    ) {
      /*
       * invalidate request เก่า
       */
      historyRequestRef.current +=
        1;

      setTransactions(
        []
      );

      setWalletNames(
        {}
      );

      setTransactionError(
        ""
      );

      setTransactionLoading(
        false
      );

      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadTransactions(
            address
          );
        },
        700
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    address,
    isConnected,
    loadTransactions,
  ]);

  /*
   * =========================================================
   * BALANCE CHANGED
   * =========================================================
   */
  useEffect(() => {
    if (
      !isConnected ||
      !address
    ) {
      return;
    }

    const handleBalanceChanged =
      () => {
        void loadTransactions(
          address
        );
      };

    window.addEventListener(
      "sktBalanceChanged",
      handleBalanceChanged
    );

    return () => {
      window.removeEventListener(
        "sktBalanceChanged",
        handleBalanceChanged
      );
    };
  }, [
    address,
    isConnected,
    loadTransactions,
  ]);

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
        Loading...
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
   * STATS
   * =========================================================
   */
  const totalReceived =
    transactions
      .filter(
        (item) =>
          item.type ===
          "receive"
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.amount
          ),
        0
      );

  const totalSent =
    transactions
      .filter(
        (item) =>
          item.type ===
          "send"
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.amount
          ),
        0
      );

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
      {/* Sidebar */}
      <aside
        className="
          h-screen
          shrink-0
          overflow-hidden
        "
      >
        <Sidebar />
      </aside>

      {/* Main */}
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
              Blockchain Activity
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              ธุรกรรม
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              ประวัติการรับ–ส่ง Skill Token ของคุณ
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
        {/* WALLET BAR */}
        {/* ======================================= */}

        <div
          className="
            mb-6
            rounded-[28px]
            border
            border-white/10
            bg-gradient-to-r
            from-[#171f4b]
            via-[#24245f]
            to-[#34246d]
            p-5
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-4
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
                  bg-violet-500/20
                  text-violet-300
                "
              >
                <Wallet2
                  size={22}
                />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  Wallet
                </p>

                <p
                  className="
                    mt-1
                    font-mono
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  {address
                    ? shortenAddress(
                        address
                      )
                    : "ยังไม่ได้เชื่อม Wallet"}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  {message}
                </p>
              </div>
            </div>

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
                  rounded-full
                  bg-yellow-300
                  px-5
                  py-2.5
                  font-semibold
                  text-slate-900
                  transition
                  hover:bg-yellow-200
                  disabled:opacity-60
                "
              >
                เปลี่ยนเป็น BNB Testnet
              </button>
            ) : !isConnected ? (
              <button
                type="button"
                onClick={
                  connectWallet
                }
                disabled={
                  connecting
                }
                className="
                  rounded-full
                  bg-white
                  px-5
                  py-2.5
                  font-semibold
                  text-violet-700
                  transition
                  hover:bg-violet-50
                  disabled:opacity-60
                "
              >
                {connecting
                  ? "กำลังเปิด MetaMask..."
                  : "Connect MetaMask"}
              </button>
            ) : (
              <div
                className="
                  rounded-full
                  bg-emerald-500/15
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-emerald-300
                "
              >
                Connected
              </div>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* STATS */}
        {/* ======================================= */}

        <div
          className="
            mb-6
            grid
            gap-5
            md:grid-cols-4
          "
        >
          <StatCard
            title="ยอดปัจจุบัน"
            value={
              isConnected
                ? `${formattedBalance} SKT`
                : "-- SKT"
            }
            icon={
              <Wallet2
                size={20}
              />
            }
          />

          <StatCard
            title="รับทั้งหมด"
            value={
              isConnected
                ? `+${formatNumber(
                    totalReceived
                  )} SKT`
                : "-- SKT"
            }
            icon={
              <ArrowDownLeft
                size={20}
              />
            }
            iconClass="
              bg-emerald-500/15
              text-emerald-400
            "
          />

          <StatCard
            title="ส่งทั้งหมด"
            value={
              isConnected
                ? `-${formatNumber(
                    totalSent
                  )} SKT`
                : "-- SKT"
            }
            icon={
              <ArrowUpRight
                size={20}
              />
            }
            iconClass="
              bg-fuchsia-500/15
              text-fuchsia-300
            "
          />

          <StatCard
            title="จำนวนรายการ"
            value={
              isConnected
                ? transactions.length.toString()
                : "--"
            }
            icon={
              <History
                size={20}
              />
            }
          />
        </div>

        {/* ======================================= */}
        {/* HISTORY */}
        {/* ======================================= */}

        <div
          className="
            rounded-[32px]
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
                Transaction History
              </p>

              <h2
                className="
                  mt-1
                  text-2xl
                  font-bold
                "
              >
                ประวัติธุรกรรม SKT
              </h2>
            </div>

            <button
              type="button"
              disabled={
                !isConnected ||
                transactionLoading
              }
              onClick={() => {
                if (
                  address
                ) {
                  void loadTransactions(
                    address
                  );
                }
              }}
              className="
                inline-flex
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
                  transactionLoading
                    ? "animate-spin"
                    : ""
                }
              />

              รีเฟรช
            </button>
          </div>

          {/* Not Connected */}
          {!isConnected &&
            !transactionLoading && (
              <div
                className="
                  flex
                  min-h-[320px]
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
                  <Wallet2
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
                  Connect Wallet ก่อน
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >
                  เลือก MetaMask Account เพื่อดูประวัติธุรกรรม
                </p>
              </div>
            )}

          {/* Loading */}
          {isConnected &&
            transactionLoading && (
              <div
                className="
                  flex
                  min-h-[320px]
                  flex-col
                  items-center
                  justify-center
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
                  กำลังค้นหาประวัติจาก Blockchain...
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-600
                  "
                >
                  กำลังค้นย้อนหลัง Transfer Event ของ SKT
                </p>
              </div>
            )}

          {/* Error */}
          {!transactionLoading &&
            transactionError && (
              <div
                className="
                  rounded-2xl
                  border
                  border-red-500/20
                  bg-red-500/10
                  p-4
                  text-sm
                  text-red-300
                "
              >
                {transactionError}
              </div>
            )}

          {/* Empty */}
          {isConnected &&
            !transactionLoading &&
            !transactionError &&
            transactions.length ===
              0 && (
              <div
                className="
                  flex
                  min-h-[320px]
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                <History
                  size={30}
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
                  ยังไม่พบธุรกรรม
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >
                  Wallet นี้ยังไม่มี Transfer Event ของ SKT
                </p>
              </div>
            )}

          {/* List */}
          {!transactionLoading &&
            !transactionError &&
            transactions.length >
              0 && (
              <div
                className="
                  space-y-3
                "
              >
                {transactions.map(
                  (item) => (
                    <TransactionRow
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      walletNames={
                        walletNames
                      }
                    />
                  )
                )}
              </div>
            )}

          <div
            className="
              mt-6
              border-t
              border-white/5
              pt-4
              text-center
              text-xs
              text-slate-500
            "
          >
            ธุรกรรมมาจาก Transfer Event ของ SKT Contract โดยตรง • ชื่อบัญชีมาจาก SkillChain Wallet Directory
          </div>
        </div>
      </section>
    </main>
  );
}

/*
 * =========================================================
 * TRANSACTION ROW
 * =========================================================
 */
function TransactionRow({
  item,
  walletNames,
}: {
  item:
    SktHistoryItem;

  walletNames:
    WalletNames;
}) {
  const isSend =
    item.type ===
    "send";

  const counterparty =
    isSend
      ? item.to
      : item.from;

  const accountName =
    walletNames[
      counterparty.toLowerCase()
    ] ?? null;

  return (
    <div
      className="
        flex
        flex-col
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-4
        transition
        hover:bg-white/[0.05]
        md:flex-row
        md:items-center
        md:justify-between
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >
        <div
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl

            ${
              isSend
                ? "bg-fuchsia-500/15 text-fuchsia-300"
                : "bg-emerald-500/15 text-emerald-400"
            }
          `}
        >
          {isSend ? (
            <ArrowUpRight
              size={21}
            />
          ) : (
            <ArrowDownLeft
              size={21}
            />
          )}
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              font-semibold
              text-white
            "
          >
            {isSend
              ? "ส่ง SKT"
              : "รับ SKT"}
          </p>

          <div
            className="
              mt-1
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                text-xs
                text-slate-500
              "
            >
              {isSend
                ? "ไปยัง"
                : "จาก"}
            </span>

            <span
              className="
                text-sm
                font-semibold
                text-slate-200
              "
            >
              {accountName ||
                shortenAddress(
                  counterparty
                )}
            </span>

            {accountName && (
              <span
                className="
                  rounded-full
                  bg-violet-500/10
                  px-2
                  py-0.5
                  text-[10px]
                  font-semibold
                  text-violet-300
                "
              >
                SkillChain
              </span>
            )}
          </div>

          <p
            className="
              mt-1
              font-mono
              text-xs
              text-slate-500
            "
          >
            {shortenAddress(
              counterparty
            )}
          </p>
        </div>
      </div>

      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          gap-6
          md:justify-end
        "
      >
        <div
          className="
            text-right
          "
        >
          <p
            className={`
              font-bold

              ${
                isSend
                  ? "text-fuchsia-300"
                  : "text-emerald-400"
              }
            `}
          >
            {isSend
              ? "-"
              : "+"}

            {formatDisplayAmount(
              item.amount
            )}{" "}
            SKT
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-500
            "
          >
            {item.timestamp
              ? formatTimestamp(
                  item.timestamp
                )
              : `Block ${item.blockNumber.toLocaleString()}`}
          </p>
        </div>

        <a
          href={`https://testnet.bscscan.com/tx/${item.txHash}`}
          target="_blank"
          rel="noreferrer"
          title="ดูบน BscScan"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-white/10
            bg-white/5
            text-violet-300
            transition
            hover:bg-violet-500/10
            hover:text-violet-200
          "
        >
          <ExternalLink
            size={16}
          />
        </a>
      </div>
    </div>
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
  icon,
  iconClass = `
    bg-violet-500/15
    text-violet-300
  `,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClass?: string;
}) {
  return (
    <div
      className="
        rounded-[26px]
        border
        border-white/10
        bg-[#101734]
        p-5
      "
    >
      <div
        className={`
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl

          ${iconClass}
        `}
      >
        {icon}
      </div>

      <p
        className="
          mt-4
          text-sm
          text-slate-400
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          text-xl
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
 * HELPERS
 * =========================================================
 */
function shortenAddress(
  address: string
) {
  if (
    address.length <= 20
  ) {
    return address;
  }

  return `${address.slice(
    0,
    10
  )}...${address.slice(-8)}`;
}

function formatDisplayAmount(
  amount: string
) {
  const number =
    Number(amount);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return amount;
  }

  return number.toLocaleString(
    "en-US",
    {
      maximumFractionDigits:
        4,
    }
  );
}

function formatNumber(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  return value.toLocaleString(
    "en-US",
    {
      maximumFractionDigits:
        4,
    }
  );
}

function formatTimestamp(
  timestamp: number
) {
  return new Date(
    timestamp * 1000
  ).toLocaleString(
    "th-TH",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

/*
 * =========================================================
 * WAIT
 * =========================================================
 */
function wait(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}