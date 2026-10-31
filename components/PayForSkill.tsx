"use client";

import { useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
} from "ethers";

import {
  SKT_ADDRESS,
  SKT_ABI,
} from "@/lib/token";

type Props = {
  skillName: string;
  price: number;
  teacherWallet: string;
};

export default function PayForSkill({
  skillName,
  price,
  teacherWallet,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  async function payForSkill() {
    setMessage("");
    setTxHash("");

    if (!window.ethereum) {
      alert("กรุณาติดตั้ง MetaMask ก่อน");
      return;
    }

    try {
      setLoading(true);

      const provider = new BrowserProvider(
        window.ethereum as any
      );

      const network = await provider.getNetwork();

      if (Number(network.chainId) !== 97) {
        setMessage(
          "กรุณาเปลี่ยน Network เป็น BNB Smart Chain Testnet"
        );
        return;
      }

      await provider.send(
        "eth_requestAccounts",
        []
      );

      const signer =
        await provider.getSigner();

      const studentWallet =
        await signer.getAddress();

      const token = new Contract(
        SKT_ADDRESS,
        SKT_ABI,
        signer
      );

      const decimals =
        await token.decimals();

      const rawBalance =
        await token.balanceOf(
          studentWallet
        );

      const currentBalance =
        Number(
          formatUnits(
            rawBalance,
            decimals
          )
        );

      if (currentBalance < price) {
        setMessage(
          `SKT ไม่เพียงพอ คุณมี ${currentBalance.toLocaleString()} SKT`
        );
        return;
      }

      const paymentAmount =
        parseUnits(
          price.toString(),
          decimals
        );

      setMessage(
        "กรุณายืนยัน Transaction ใน MetaMask..."
      );

      const tx =
        await token.transfer(
          teacherWallet,
          paymentAmount
        );

      setTxHash(tx.hash);

      setMessage(
        "กำลังรอ Blockchain ยืนยัน Transaction..."
      );

      await tx.wait();

      setMessage(
        `จอง "${skillName}" สำเร็จ จ่าย ${price} SKT แล้ว ✅`
      );

      window.dispatchEvent(
        new Event("sktBalanceChanged")
      );
    } catch (error: any) {
      console.error(
        "Payment Error:",
        error
      );

      if (
        error?.code === 4001 ||
        error?.code === "ACTION_REJECTED"
      ) {
        setMessage(
          "คุณยกเลิก Transaction"
        );
      } else {
        setMessage(
          "Transaction ไม่สำเร็จ กรุณาลองใหม่"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">

      <button
        onClick={payForSkill}
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
      >
        {loading
          ? "กำลังทำรายการ..."
          : `จองคลาส ${price} SKT`}
      </button>

      {message && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-sm text-slate-300">
            {message}
          </p>
        </div>
      )}

      {txHash && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="font-semibold text-green-400">
            Transaction Hash
          </p>

          <p className="mt-2 break-all text-xs text-slate-400">
            {txHash}
          </p>
        </div>
      )}

    </div>
  );
}