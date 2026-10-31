"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Copy,
  Download,
  History,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";

import SendToken from "@/components/SendToken";
import ReceiveToken from "@/components/ReceiveToken";
import TokenHistory from "@/components/TokenHistory";

import {
  useWallet,
} from "@/components/wallet/WalletProvider";

/*
 * =========================================================
 * DASHBOARD WALLET CARD
 * =========================================================
 *
 * Wallet State ทั้งหมดมาจาก WalletProvider
 *
 * ไม่มี:
 * - walletAddress จาก Database
 * - walletBalance จาก Database
 * - Wallet state แยกของหน้านี้
 *
 * ทำให้:
 *
 * Dashboard
 * Wallet
 * Transactions
 *
 * สามารถใช้ Wallet Connection เดียวกันได้
 */
export default function WalletCard() {
  const {
    address,
    status,
    message,
    connecting,
    refreshing,
    isConnected,
    formattedBalance,
    connectWallet,
    switchToBscTestnet,
    refreshBalance,
  } = useWallet();

  /*
   * =========================================================
   * LOCAL UI STATE
   * =========================================================
   *
   * พวก Modal ไม่จำเป็นต้องแชร์ทั้งเว็บ
   */
  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    sendOpen,
    setSendOpen,
  ] = useState(false);

  const [
    receiveOpen,
    setReceiveOpen,
  ] = useState(false);

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  /*
   * =========================================================
   * CLOSE MODALS
   * =========================================================
   */
  const closeAllModals =
    useCallback(() => {
      setSendOpen(false);
      setReceiveOpen(false);
      setHistoryOpen(false);
    }, []);

  /*
   * =========================================================
   * WALLET หลุด / Account เปลี่ยน
   * =========================================================
   *
   * Provider จะ Reset Wallet
   *
   * Component นี้มีหน้าที่
   * ปิด Modal เท่านั้น
   */
  useEffect(() => {
    if (
      isConnected
    ) {
      return;
    }

    closeAllModals();

    setCopied(false);
  }, [
    isConnected,
    closeAllModals,
  ]);

  /*
   * =========================================================
   * COPY ADDRESS
   * =========================================================
   */
  async function copyWallet() {
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        address
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1500
      );
    } catch (error) {
      console.error(
        "Copy wallet error:",
        error
      );
    }
  }

  /*
   * =========================================================
   * STATUS BADGE
   * =========================================================
   */
  function renderStatusBadge() {
    if (
      status ===
      "connected"
    ) {
      return (
        <StatusBadge
          text="Connected"
          className="
            bg-green-500/20
            text-green-400
          "
        />
      );
    }

    if (
      status ===
      "wrong-network"
    ) {
      return (
        <StatusBadge
          text="Wrong Network"
          className="
            bg-yellow-500/20
            text-yellow-300
          "
        />
      );
    }

    if (
      status ===
        "error" ||
      status ===
        "no-metamask"
    ) {
      return (
        <StatusBadge
          text="Error"
          className="
            bg-red-500/20
            text-red-300
          "
        />
      );
    }

    return (
      <StatusBadge
        text="Not Connected"
        className="
          bg-slate-500/20
          text-slate-300
        "
      />
    );
  }

  return (
    <>
      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-gradient-to-br
          from-[#151b45]
          to-[#080b20]
          p-6
        "
      >
        {/* Glow */}
        <div
          className="
            pointer-events-none
            absolute
            right-0
            top-0
            h-40
            w-40
            rounded-full
            bg-violet-600/30
            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
          "
        >
          {/* ===================================== */}
          {/* HEADER */}
          {/* ===================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
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
                  bg-violet-500/20
                  text-violet-300
                "
              >
                <Wallet />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    text-slate-400
                  "
                >
                  Skill Wallet
                </p>

                <h3
                  className="
                    text-lg
                    font-bold
                  "
                >
                  My Wallet
                </h3>
              </div>
            </div>

            {renderStatusBadge()}
          </div>

          {/* ===================================== */}
          {/* BALANCE */}
          {/* ===================================== */}

          <div className="mt-8">
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <p
                className="
                  text-sm
                  text-slate-400
                "
              >
                SKT Balance
              </p>

              {address && (
                <button
                  type="button"
                  onClick={
                    refreshBalance
                  }
                  disabled={
                    refreshing
                  }
                  title="รีเฟรชยอด SKT"
                  className="
                    text-slate-400
                    transition
                    hover:text-white
                    disabled:opacity-50
                  "
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              )}
            </div>

            <div
              className="
                mt-2
                flex
                items-end
                gap-2
              "
            >
              <h2
                className="
                  text-4xl
                  font-bold
                "
              >
                {isConnected
                  ? formattedBalance
                  : "--"}
              </h2>

              <span
                className="
                  mb-1
                  text-xl
                  font-semibold
                  text-violet-400
                "
              >
                SKT
              </span>
            </div>

            <p
              className={`
                mt-2
                text-sm

                ${
                  status ===
                  "connected"
                    ? "text-green-400"
                    : status ===
                        "wrong-network"
                      ? "text-yellow-300"
                      : status ===
                            "error" ||
                          status ===
                            "no-metamask"
                        ? "text-red-300"
                        : "text-slate-400"
                }
              `}
            >
              {message}
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
              "
            >
              ยอด SKT อ่านจาก Blockchain โดยตรง
            </p>
          </div>

          {/* ===================================== */}
          {/* CONNECT */}
          {/* ===================================== */}

          {!address && (
            <button
              type="button"
              onClick={
                connectWallet
              }
              disabled={
                connecting
              }
              className="
                mt-6
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-violet-600
                to-fuchsia-600
                px-5
                py-3
                font-semibold
                text-white
                shadow-lg
                shadow-violet-900/20
                transition
                hover:brightness-110
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {connecting
                ? "กำลังเปิด MetaMask..."
                : "Connect MetaMask"}
            </button>
          )}

          {/* ===================================== */}
          {/* WRONG NETWORK */}
          {/* ===================================== */}

          {address &&
            status ===
              "wrong-network" && (
              <button
                type="button"
                onClick={
                  switchToBscTestnet
                }
                disabled={
                  connecting
                }
                className="
                  mt-6
                  w-full
                  rounded-2xl
                  bg-yellow-500
                  px-5
                  py-3
                  font-semibold
                  text-black
                  transition
                  hover:bg-yellow-400
                  disabled:opacity-60
                "
              >
                {connecting
                  ? "กำลังเปลี่ยน Network..."
                  : "เปลี่ยนเป็น BNB Testnet"}
              </button>
            )}

          {/* ===================================== */}
          {/* ADDRESS */}
          {/* ===================================== */}

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-4
            "
          >
            <p
              className="
                mb-2
                text-xs
                text-slate-400
              "
            >
              Wallet Address
            </p>

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <p
                className="
                  min-w-0
                  truncate
                  text-xs
                  text-slate-300
                "
              >
                {address ||
                  "ยังไม่ได้เชื่อม Wallet"}
              </p>

              {address && (
                <button
                  type="button"
                  onClick={
                    copyWallet
                  }
                  title="คัดลอก Wallet Address"
                  className="
                    shrink-0
                    text-slate-400
                    transition
                    hover:text-white
                  "
                >
                  <Copy
                    size={16}
                  />
                </button>
              )}
            </div>

            {copied && (
              <p
                className="
                  mt-2
                  text-xs
                  text-green-400
                "
              >
                คัดลอก Address แล้ว
              </p>
            )}

            {address && (
              <p
                className="
                  mt-2
                  text-xs
                  text-slate-500
                "
              >
                {address.slice(
                  0,
                  8
                )}
                ...
                {address.slice(
                  -6
                )}
              </p>
            )}
          </div>

          {/* ===================================== */}
          {/* ACTIONS */}
          {/* ===================================== */}

          <div
            className="
              mt-6
              grid
              grid-cols-3
              gap-3
            "
          >
            <ActionButton
              icon={
                <Send
                  size={18}
                />
              }
              text="ส่ง"
              disabled={
                !isConnected
              }
              onClick={() => {
                closeAllModals();

                setSendOpen(
                  true
                );
              }}
            />

            <ActionButton
              icon={
                <Download
                  size={18}
                />
              }
              text="รับ"
              disabled={
                !isConnected
              }
              onClick={() => {
                closeAllModals();

                setReceiveOpen(
                  true
                );
              }}
            />

            <ActionButton
              icon={
                <History
                  size={18}
                />
              }
              text="ประวัติ"
              disabled={
                !isConnected
              }
              onClick={() => {
                closeAllModals();

                setHistoryOpen(
                  true
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEND */}
      {/* ========================================= */}

      <SendToken
        open={
          sendOpen
        }
        connectedAddress={
          address
        }
        onClose={() =>
          setSendOpen(false)
        }
      />

      {/* ========================================= */}
      {/* RECEIVE */}
      {/* ========================================= */}

      <ReceiveToken
        open={
          receiveOpen
        }
        connectedAddress={
          address
        }
        onClose={() =>
          setReceiveOpen(false)
        }
      />

      {/* ========================================= */}
      {/* HISTORY */}
      {/* ========================================= */}

      <TokenHistory
        open={
          historyOpen
        }
        connectedAddress={
          address
        }
        onClose={() =>
          setHistoryOpen(false)
        }
      />
    </>
  );
}

/*
 * =========================================================
 * STATUS BADGE
 * =========================================================
 */
function StatusBadge({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <div
      className={`
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        ${className}
      `}
    >
      {text}
    </div>
  );
}

/*
 * =========================================================
 * ACTION BUTTON
 * =========================================================
 */
function ActionButton({
  icon,
  text,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  text: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-2
        rounded-2xl
        border
        border-white/10
        bg-white/5
        py-3
        text-sm
        text-slate-300
        transition
        hover:bg-violet-500/20
        hover:text-white
        disabled:cursor-not-allowed
        disabled:opacity-40
        disabled:hover:bg-white/5
        disabled:hover:text-slate-300
      "
    >
      {icon}

      {text}
    </button>
  );
}