"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import {
  BrowserProvider,
} from "ethers";

import {
  getSktHistory,
  getSktHistoryErrorMessage,
  type SktHistoryItem,
} from "@/lib/sktHistory";

type TokenHistoryProps = {
  open: boolean;
  onClose: () => void;
  connectedAddress: string;
};

type WalletNames =
  Record<string, string>;

export default function TokenHistory({
  open,
  onClose,
  connectedAddress,
}: TokenHistoryProps) {
  const [
    items,
    setItems,
  ] = useState<
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
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * =========================================================
   * LOAD WALLET NAMES
   * =========================================================
   *
   * Address คู่กรณี
   * ↓
   * WalletDirectory
   * ↓
   * User name
   *
   * ชื่อเป็นข้อมูลเสริมเท่านั้น
   *
   * ถ้าชื่อโหลดไม่ได้
   * Transaction Blockchain
   * ยังต้องแสดงได้
   */
  const loadWalletNames =
    useCallback(
      async (
        historyItems:
          SktHistoryItem[]
      ) => {
        try {
          const addresses =
            Array.from(
              new Set(
                historyItems.map(
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
            setWalletNames(
              {}
            );

            return;
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

            setWalletNames(
              {}
            );

            return;
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
              address,
              name,
            ] of Object.entries(
              rawNames
            )
          ) {
            if (
              typeof name !==
              "string"
            ) {
              continue;
            }

            names[
              address.toLowerCase()
            ] = name;
          }

          setWalletNames(
            names
          );
        } catch (
          nameError
        ) {
          console.error(
            "Load wallet names error:",
            nameError
          );

          setWalletNames(
            {}
          );
        }
      },
      []
    );

  /*
   * =========================================================
   * LOAD SKT HISTORY
   * =========================================================
   *
   * ตัว Component นี้
   * ไม่ Scan Blockchain เองแล้ว
   *
   * ใช้:
   *
   * lib/sktHistory.ts
   *
   * เป็นตัวกลาง
   */
  const loadHistory =
    useCallback(async () => {
      setError("");

      setItems([]);

      setWalletNames({});

      /*
       * Wallet Provider
       * ยังไม่ได้ Connect
       */
      if (
        !connectedAddress
      ) {
        setError(
          "กรุณา Connect MetaMask ก่อนดูประวัติ"
        );

        return;
      }

      /*
       * MetaMask
       */
      if (
        !window.ethereum
      ) {
        setError(
          "ไม่พบ MetaMask ใน Browser"
        );

        return;
      }

      try {
        setLoading(true);

        const provider =
          new BrowserProvider(
            window.ethereum as any
          );

        /*
         * =====================================================
         * CHECK METAMASK ACCOUNT
         * =====================================================
         *
         * สำคัญ:
         *
         * ถ้า User เปลี่ยน MetaMask Account
         * แต่ WalletProvider ยังไม่ทัน Reset
         *
         * ห้ามอ่าน History ของ Account ใหม่
         * โดยอัตโนมัติ
         */
        const accounts =
          (await window.ethereum.request({
            method:
              "eth_accounts",
          })) as string[];

        if (
          !accounts ||
          accounts.length ===
            0
        ) {
          setError(
            "MetaMask ไม่ได้เชื่อม Account อยู่ กรุณา Connect ใหม่"
          );

          return;
        }

        const currentAccount =
          accounts[0];

        if (
          currentAccount.toLowerCase() !==
          connectedAddress.toLowerCase()
        ) {
          setError(
            "Account ใน MetaMask เปลี่ยนไปแล้ว กรุณา Connect Wallet ใหม่"
          );

          return;
        }

        /*
         * =====================================================
         * BLOCKCHAIN HISTORY
         * =====================================================
         *
         * ใช้ตัวกลางใหม่
         *
         * ค้นย้อนหลังได้ไกลกว่าเดิม
         */
        const result =
          await getSktHistory({
            provider,
            walletAddress:
              connectedAddress,
          });

        setItems(
          result.items
        );

        /*
         * ชื่อคู่กรณี
         *
         * โหลดหลังจากได้
         * Blockchain Transaction แล้ว
         */
        await loadWalletNames(
          result.items
        );
      } catch (
        historyError
      ) {
        console.error(
          "Load SKT history error:",
          historyError
        );

        setError(
          getSktHistoryErrorMessage(
            historyError
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      connectedAddress,
      loadWalletNames,
    ]);

  /*
   * =========================================================
   * OPEN MODAL
   * =========================================================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    void loadHistory();
  }, [
    open,
    loadHistory,
  ]);

  /*
   * =========================================================
   * SKT BALANCE CHANGED
   * =========================================================
   *
   * ถ้า Send Token สำเร็จ
   * และ Modal เปิดอยู่
   *
   * โหลด History ใหม่
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleBalanceChanged =
      () => {
        void loadHistory();
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
    open,
    loadHistory,
  ]);

  /*
   * =========================================================
   * ESC
   * =========================================================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

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
    >
      <div
        className="
          relative
          flex
          max-h-[85vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-[28px]
          border
          border-violet-500/20
          bg-[#0b1028]
          shadow-2xl
          shadow-violet-950/60
        "
      >
        {/* Glow */}
        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-56
            w-56
            rounded-full
            bg-violet-600/20
            blur-3xl
          "
        />

        {/* ======================================= */}
        {/* HEADER */}
        {/* ======================================= */}

        <div
          className="
            relative
            z-10
            flex
            items-center
            justify-between
            gap-4
            border-b
            border-white/10
            px-6
            py-5
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
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-violet-500/15
                text-violet-300
              "
            >
              <History
                size={22}
              />
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-violet-400
                "
              >
                SkillChain Wallet
              </p>

              <h2
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-white
                "
              >
                ประวัติ SKT
              </h2>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                void loadHistory()
              }
              disabled={
                loading
              }
              title="รีเฟรชประวัติ"
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
                text-slate-400
                transition
                hover:bg-white/10
                hover:text-white
                disabled:opacity-40
              "
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <button
              type="button"
              onClick={
                onClose
              }
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
                text-slate-400
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              <X
                size={20}
              />
            </button>
          </div>
        </div>

        {/* ======================================= */}
        {/* WALLET */}
        {/* ======================================= */}

        <div
          className="
            relative
            z-10
            border-b
            border-white/10
            px-6
            py-4
          "
        >
          <p
            className="
              text-xs
              text-slate-500
            "
          >
            Wallet ที่กำลังเชื่อม
          </p>

          <p
            className="
              mt-1
              truncate
              font-mono
              text-sm
              text-violet-200
            "
          >
            {connectedAddress}
          </p>
        </div>

        {/* ======================================= */}
        {/* CONTENT */}
        {/* ======================================= */}

        <div
          className="
            relative
            z-10
            flex-1
            overflow-y-auto
            px-6
            py-5
          "
        >
          {/* Loading */}
          {loading && (
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
                ครั้งแรกอาจใช้เวลานานขึ้นเล็กน้อย เนื่องจากกำลังค้นย้อนหลัง
              </p>
            </div>
          )}

          {/* Error */}
          {!loading &&
            error && (
              <div
                className="
                  rounded-2xl
                  border
                  border-red-500/20
                  bg-red-500/10
                  px-4
                  py-4
                  text-sm
                  leading-6
                  text-red-300
                "
              >
                {error}
              </div>
            )}

          {/* Empty */}
          {!loading &&
            !error &&
            items.length ===
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
                  <History
                    size={28}
                  />
                </div>

                <h3
                  className="
                    mt-5
                    text-lg
                    font-semibold
                    text-white
                  "
                >
                  ยังไม่พบประวัติ SKT
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                  "
                >
                  ยังไม่พบ Transfer Event ของ Wallet นี้
                </p>
              </div>
            )}

          {/* List */}
          {!loading &&
            !error &&
            items.length >
              0 && (
              <div
                className="
                  space-y-3
                "
              >
                {items.map(
                  (item) => (
                    <HistoryRow
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
        </div>

        {/* ======================================= */}
        {/* FOOTER */}
        {/* ======================================= */}

        <div
          className="
            relative
            z-10
            border-t
            border-white/10
            px-6
            py-4
          "
        >
          <p
            className="
              text-center
              text-xs
              leading-5
              text-slate-500
            "
          >
            Transaction มาจาก Blockchain โดยตรง • ชื่อบัญชีมาจาก SkillChain Wallet Directory
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * HISTORY ROW
 * =========================================================
 */
function HistoryRow({
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

  const numericAmount =
    Number(
      item.amount
    );

  const formattedAmount =
    Number.isFinite(
      numericAmount
    )
      ? numericAmount.toLocaleString(
          undefined,
          {
            maximumFractionDigits:
              4,
          }
        )
      : item.amount;

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
          items-start
          gap-3
        "
      >
        {/* Icon */}
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
              isSend
                ? "bg-fuchsia-500/10 text-fuchsia-300"
                : "bg-green-500/10 text-green-300"
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
            flex-1
          "
        >
          {/* Title + Amount */}
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div>
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

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                {isSend
                  ? "ไปยัง"
                  : "จาก"}
              </p>
            </div>

            <p
              className={`
                shrink-0
                font-bold

                ${
                  isSend
                    ? "text-fuchsia-300"
                    : "text-green-300"
                }
              `}
            >
              {isSend
                ? "-"
                : "+"}

              {formattedAmount} SKT
            </p>
          </div>

          {/* Account */}
          <div
            className="
              mt-3
              rounded-xl
              border
              border-white/5
              bg-black/10
              p-3
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
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-violet-500/15
                  text-violet-300
                "
              >
                <UserRound
                  size={17}
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
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >
                  บัญชี SkillChain
                </p>

                <p
                  className={`
                    mt-0.5
                    truncate
                    text-sm
                    font-semibold

                    ${
                      accountName
                        ? "text-white"
                        : "text-slate-400"
                    }
                  `}
                >
                  {accountName ||
                    "ไม่พบชื่อบัญชี"}
                </p>

                <p
                  className="
                    mt-1
                    truncate
                    font-mono
                    text-xs
                    text-slate-500
                  "
                >
                  {shortAddress(
                    counterparty
                  )}
                </p>
              </div>

              {accountName && (
                <div
                  className="
                    shrink-0
                    rounded-full
                    bg-violet-500/10
                    px-2
                    py-1
                    text-[10px]
                    font-semibold
                    text-violet-300
                  "
                >
                  SkillChain
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              justify-between
              gap-2
            "
          >
            <p
              className="
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

            <a
              href={`https://testnet.bscscan.com/tx/${item.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                items-center
                gap-1
                text-xs
                font-medium
                text-violet-300
                hover:text-violet-200
              "
            >
              BscScan

              <ExternalLink
                size={13}
              />
            </a>
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
    address.length <= 18
  ) {
    return address;
  }

  return `${address.slice(
    0,
    10
  )}...${address.slice(-8)}`;
}

/*
 * =========================================================
 * TIMESTAMP
 * =========================================================
 */
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