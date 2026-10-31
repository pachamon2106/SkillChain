"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  BrowserProvider,
  Contract,
  formatUnits,
  isAddress,
  parseUnits,
} from "ethers";

import {
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Send,
  X,
} from "lucide-react";

import {
  SKT_ADDRESS,
  SKT_ABI,
} from "@/lib/token";

type SendTokenProps = {
  open: boolean;

  onClose: () => void;

  /*
   * Address ที่ผู้ใช้กด Connect
   * จาก WalletCard ใน Dashboard
   *
   * ไม่อ่านจาก Database
   */
  connectedAddress: string;
};

export default function SendToken({
  open,
  onClose,
  connectedAddress,
}: SendTokenProps) {
  const [recipient, setRecipient] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      | "info"
      | "error"
      | "success"
    >("info");

  const [txHash, setTxHash] =
    useState("");

  /*
   * =========================================================
   * Reset เมื่อเปิด Modal ใหม่
   * =========================================================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setRecipient("");
    setAmount("");
    setMessage("");
    setTxHash("");
    setMessageType("info");
  }, [open]);

  /*
   * =========================================================
   * กด ESC เพื่อปิด
   * =========================================================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !loading
      ) {
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
  }, [
    open,
    loading,
    onClose,
  ]);

  /*
   * =========================================================
   * ส่ง SKT
   * =========================================================
   */
  async function sendToken() {
    setMessage("");
    setTxHash("");
    setMessageType("info");

    /*
     * ต้อง Connect ผ่าน Dashboard ก่อน
     */
    if (!connectedAddress) {
      setMessageType("error");

      setMessage(
        "กรุณา Connect MetaMask จาก Dashboard ก่อน"
      );

      return;
    }

    /*
     * ตรวจ MetaMask
     */
    if (!window.ethereum) {
      setMessageType("error");

      setMessage(
        "ไม่พบ MetaMask ใน Browser"
      );

      return;
    }

    const cleanRecipient =
      recipient.trim();

    const cleanAmount =
      amount.trim();

    /*
     * ตรวจ Address ปลายทาง
     */
    if (!isAddress(cleanRecipient)) {
      setMessageType("error");

      setMessage(
        "Wallet Address ปลายทางไม่ถูกต้อง"
      );

      return;
    }

    /*
     * ป้องกันส่งเข้ากระเป๋าตัวเองโดยไม่ตั้งใจ
     */
    if (
      cleanRecipient.toLowerCase() ===
      connectedAddress.toLowerCase()
    ) {
      setMessageType("error");

      setMessage(
        "Wallet ปลายทางเป็นกระเป๋าเดียวกับ Wallet ที่กำลังเชื่อมอยู่"
      );

      return;
    }

    /*
     * ตรวจจำนวน
     */
    const numericAmount =
      Number(cleanAmount);

    if (
      !cleanAmount ||
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setMessageType("error");

      setMessage(
        "กรุณาระบุจำนวน SKT ที่ต้องการส่ง"
      );

      return;
    }

    try {
      setLoading(true);

      /*
       * =====================================================
       * Provider
       * =====================================================
       */
      const provider =
        new BrowserProvider(
          window.ethereum as any
        );

      /*
       * =====================================================
       * ตรวจ Network
       * =====================================================
       *
       * BNB Smart Chain Testnet
       * Chain ID = 97
       */
      const network =
        await provider.getNetwork();

      const currentChainId =
        Number(network.chainId);

      if (currentChainId !== 97) {
        setMessageType("error");

        setMessage(
          "กรุณาเปลี่ยน MetaMask เป็น BNB Smart Chain Testnet"
        );

        return;
      }

      /*
       * =====================================================
       * ตรวจ Account ปัจจุบัน
       * =====================================================
       *
       * สำคัญ:
       *
       * Wallet ที่กำลังจะส่ง
       * ต้องเป็น Wallet เดียวกับที่
       * Connect ใน Dashboard
       */
      const accounts =
        (await provider.send(
          "eth_accounts",
          []
        )) as string[];

      if (
        !accounts ||
        accounts.length === 0
      ) {
        setMessageType("error");

        setMessage(
          "MetaMask ไม่ได้เชื่อม Account อยู่ กรุณา Connect ใหม่จาก Dashboard"
        );

        return;
      }

      const currentMetaMaskAddress =
        accounts[0];

      if (
        currentMetaMaskAddress.toLowerCase() !==
        connectedAddress.toLowerCase()
      ) {
        setMessageType("error");

        setMessage(
          "Account ใน MetaMask เปลี่ยนไปแล้ว กรุณาปิดหน้าต่างนี้และ Connect Wallet ใหม่"
        );

        return;
      }

      /*
       * =====================================================
       * ตรวจ SKT Contract
       * =====================================================
       */
      const contractCode =
        await provider.getCode(
          SKT_ADDRESS
        );

      if (contractCode === "0x") {
        setMessageType("error");

        setMessage(
          "ไม่พบ SKT Contract บน Network นี้"
        );

        return;
      }

      /*
       * =====================================================
       * Signer
       * =====================================================
       */
      const signer =
        await provider.getSigner();

      const signerAddress =
        await signer.getAddress();

      if (
        signerAddress.toLowerCase() !==
        connectedAddress.toLowerCase()
      ) {
        setMessageType("error");

        setMessage(
          "Wallet ที่กำลัง Sign ไม่ตรงกับ Wallet ที่ Connect ใน Dashboard"
        );

        return;
      }

      /*
       * =====================================================
       * Contract
       * =====================================================
       */
      const token = new Contract(
        SKT_ADDRESS,
        SKT_ABI,
        signer
      );

      const decimals =
        await token.decimals();

      /*
       * แปลงจำนวน SKT
       * เป็นหน่วยของ Contract
       */
      let tokenAmount: bigint;

      try {
        tokenAmount = parseUnits(
          cleanAmount,
          decimals
        );
      } catch {
        setMessageType("error");

        setMessage(
          "จำนวน SKT ไม่ถูกต้อง หรือมีทศนิยมมากเกินไป"
        );

        return;
      }

      /*
       * =====================================================
       * ตรวจ Balance จริงจาก Blockchain
       * =====================================================
       */
      const rawBalance =
        await token.balanceOf(
          connectedAddress
        );

      if (
        rawBalance < tokenAmount
      ) {
        const currentBalance =
          formatUnits(
            rawBalance,
            decimals
          );

        setMessageType("error");

        setMessage(
          `ยอด SKT ไม่เพียงพอ ขณะนี้มี ${Number(
            currentBalance
          ).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 4,
            }
          )} SKT`
        );

        return;
      }

      /*
       * =====================================================
       * เปิด MetaMask ให้ Confirm Transaction
       * =====================================================
       */
      setMessageType("info");

      setMessage(
        "กรุณาตรวจสอบและยืนยัน Transaction ใน MetaMask"
      );

      const tx =
        await token.transfer(
          cleanRecipient,
          tokenAmount
        );

      /*
       * Transaction ถูกส่งแล้ว
       */
      setMessage(
        "ส่ง Transaction แล้ว กำลังรอ Blockchain ยืนยัน..."
      );

      /*
       * =====================================================
       * รอ Transaction สำเร็จ
       * =====================================================
       */
      await tx.wait();

      setTxHash(tx.hash);

      setMessageType("success");

      setMessage(
        `ส่ง ${cleanAmount} SKT สำเร็จ`
      );

      /*
       * ล้าง Form
       */
      setRecipient("");
      setAmount("");

      /*
       * =====================================================
       * แจ้ง WalletCard ให้ Refresh Balance
       * =====================================================
       */
      window.dispatchEvent(
        new Event(
          "sktBalanceChanged"
        )
      );
    } catch (error: any) {
      console.error(
        "Send SKT error:",
        error
      );

      /*
       * ผู้ใช้กด Reject
       */
      if (
        error?.code === 4001 ||
        error?.code ===
        "ACTION_REJECTED"
      ) {
        setMessageType("error");

        setMessage(
          "ยกเลิก Transaction ใน MetaMask"
        );

        return;
      }

      /*
       * Transaction Failed
       */
      if (
        error?.code ===
        "CALL_EXCEPTION"
      ) {
        setMessageType("error");

        setMessage(
          "Transaction ไม่สำเร็จ กรุณาตรวจสอบยอด SKT และค่า Gas"
        );

        return;
      }

      setMessageType("error");

      setMessage(
        "ไม่สามารถส่ง SKT ได้ กรุณาลองใหม่"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ไม่เปิด Modal
   */
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
      {/* Modal */}
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
                <Send size={22} />
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
                  ส่ง SKT
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
                disabled:opacity-40
              "
            >
              <X size={20} />
            </button>
          </div>

          {/* Connected Wallet */}
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-green-500/20
              bg-green-500/5
              px-4
              py-3
            "
          >
            <p
              className="
                text-xs
                text-slate-400
              "
            >
              ส่งจาก Wallet
            </p>

            <p
              className="
                mt-1
                truncate
                font-mono
                text-sm
                text-green-300
              "
            >
              {connectedAddress}
            </p>
          </div>

          {/* Form */}
          <div
            className="
              mt-6
              space-y-5
            "
          >
            {/* Recipient */}
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
                Wallet Address ปลายทาง
              </label>

              <input
                type="text"
                value={recipient}
                onChange={(event) =>
                  setRecipient(
                    event.target.value
                  )
                }
                disabled={loading}
                placeholder="0x..."
                autoComplete="off"
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-[#05091c]
                  px-4
                  py-3.5
                  font-mono
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-600
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                  disabled:opacity-60
                "
              />
            </div>

            {/* Amount */}
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
                จำนวน SKT
              </label>

              <div
                className="
                  relative
                "
              >
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="0"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-[#05091c]
                    px-4
                    py-3.5
                    pr-16
                    text-white
                    outline-none
                    transition
                    placeholder:text-slate-600
                    focus:border-violet-500
                    focus:ring-4
                    focus:ring-violet-500/10
                    disabled:opacity-60
                  "
                />

                <span
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-sm
                    font-semibold
                    text-violet-400
                  "
                >
                  SKT
                </span>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`
                  rounded-xl
                  border
                  px-4
                  py-3
                  text-sm

                  ${messageType ===
                    "success"
                    ? `
                        border-green-500/20
                        bg-green-500/10
                        text-green-300
                      `
                    : messageType ===
                      "error"
                      ? `
                          border-red-500/20
                          bg-red-500/10
                          text-red-300
                        `
                      : `
                          border-violet-500/20
                          bg-violet-500/10
                          text-violet-200
                        `
                  }
                `}
              >
                <div
                  className="
                    flex
                    items-start
                    gap-2
                  "
                >
                  {messageType ===
                    "success" && (
                      <CheckCircle2
                        size={18}
                        className="
                        mt-0.5
                        shrink-0
                      "
                      />
                    )}

                  {loading &&
                    messageType ===
                    "info" && (
                      <Loader2
                        size={18}
                        className="
                          mt-0.5
                          shrink-0
                          animate-spin
                        "
                      />
                    )}

                  <span>
                    {message}
                  </span>
                </div>
              </div>
            )}

            {/* Transaction */}
            {txHash && (
              <div
                className="
                  rounded-xl
                  border
                  border-green-500/20
                  bg-green-500/5
                  p-4
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
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-green-400
                    "
                  >
                    Transaction สำเร็จ
                  </p>

                  <a
                    href={`https://testnet.bscscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      flex
                      items-center
                      gap-1
                      text-xs
                      text-violet-300
                      transition
                      hover:text-violet-200
                    "
                  >
                    BscScan

                    <ArrowUpRight
                      size={14}
                    />
                  </a>
                </div>

                <p
                  className="
                    mt-2
                    break-all
                    font-mono
                    text-xs
                    text-slate-500
                  "
                >
                  {txHash}
                </p>
              </div>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={sendToken}
              disabled={loading}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
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
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="
                      animate-spin
                    "
                  />

                  กำลังทำรายการ...
                </>
              ) : (
                <>
                  <Send size={18} />

                  ส่ง SKT
                </>
              )}
            </button>

            <p
              className="
                text-center
                text-xs
                leading-5
                text-slate-500
              "
            >
              Transaction จะถูกยืนยันผ่าน
              MetaMask และบันทึกบน BNB Smart
              Chain Testnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}