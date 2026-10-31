"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Copy,
  Download,
  X,
} from "lucide-react";

type ReceiveTokenProps = {
  open: boolean;

  onClose: () => void;

  /*
   * Wallet ที่ผู้ใช้กด Connect
   * จาก Dashboard
   *
   * ไม่ใช้ Wallet จาก Database
   */
  connectedAddress: string;
};

export default function ReceiveToken({
  open,
  onClose,
  connectedAddress,
}: ReceiveTokenProps) {
  const [copied, setCopied] =
    useState(false);

  /*
   * Reset เมื่อเปิด Modal ใหม่
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setCopied(false);
  }, [open]);

  /*
   * กด ESC เพื่อปิด
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

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
  }, [open, onClose]);

  /*
   * Copy Wallet Address
   */
  async function copyAddress() {
    if (!connectedAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        connectedAddress
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Copy receive address error:",
        error
      );
    }
  }

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
          w-full
          max-w-lg
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

        <div
          className="
            relative
            z-10
            p-6
            md:p-7
          "
        >
          {/* Header */}
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
                <Download size={22} />
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
                  รับ SKT
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-10
                w-10
                shrink-0
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
              <X size={20} />
            </button>
          </div>

          {/* Description */}
          <p
            className="
              mt-5
              text-sm
              leading-6
              text-slate-400
            "
          >
            ใช้ Wallet Address ด้านล่างเพื่อรับ
            Skill Token (SKT) บน BNB Smart Chain
            Testnet
          </p>

          {/* Wallet Address */}
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-violet-500/20
              bg-violet-500/5
              p-5
            "
          >
            <p
              className="
                text-xs
                font-medium
                text-slate-400
              "
            >
              Wallet Address
            </p>

            <p
              className="
                mt-3
                break-all
                font-mono
                text-sm
                leading-6
                text-violet-200
              "
            >
              {connectedAddress}
            </p>

            <button
              type="button"
              onClick={copyAddress}
              className="
                mt-5
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
                py-3
                font-semibold
                text-violet-200
                transition
                hover:bg-violet-500/20
              "
            >
              {copied ? (
                <>
                  <Check
                    size={18}
                    className="
                      text-green-400
                    "
                  />

                  คัดลอก Address แล้ว
                </>
              ) : (
                <>
                  <Copy size={18} />

                  คัดลอก Wallet Address
                </>
              )}
            </button>
          </div>

          {/* Network */}
          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-4
              py-4
            "
          >
            <div>
              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                Network
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-200
                "
              >
                BNB Smart Chain Testnet
              </p>
            </div>

            <div
              className="
                rounded-full
                bg-yellow-500/10
                px-3
                py-1
                text-xs
                font-medium
                text-yellow-300
              "
            >
              Testnet
            </div>
          </div>

          {/* Warning */}
          <div
            className="
              mt-5
              rounded-2xl
              border
              border-yellow-500/15
              bg-yellow-500/5
              px-4
              py-4
            "
          >
            <p
              className="
                text-sm
                leading-6
                text-yellow-100/80
              "
            >
              ส่งเฉพาะ SKT บน BNB Smart Chain
              Testnet มาที่ Address นี้
            </p>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="
              mt-6
              w-full
              rounded-xl
              bg-gradient-to-r
              from-violet-600
              to-fuchsia-600
              px-5
              py-3.5
              font-bold
              text-white
              shadow-lg
              shadow-violet-950/30
              transition
              hover:brightness-110
            "
          >
            ปิด
          </button>

          <p
            className="
              mt-4
              text-center
              text-xs
              text-slate-500
            "
          >
            ยอด SKT จะอัปเดตจาก Blockchain
            หลัง Transaction ได้รับการยืนยัน
          </p>
        </div>
      </div>
    </div>
  );
}