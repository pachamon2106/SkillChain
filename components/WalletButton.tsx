"use client";

import { useEffect, useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatUnits,
} from "ethers";

import {
  SKT_ADDRESS,
  SKT_ABI,
} from "@/lib/token";

export default function WalletButton() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadWallet() {
    if (!window.ethereum) {
      setStatus("ไม่พบ MetaMask");
      return;
    }

    try {
      const provider = new BrowserProvider(
        window.ethereum as any
      );

      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      setChainId(currentChainId);

      const accounts = await provider.send(
        "eth_accounts",
        []
      );

      if (accounts.length === 0) {
        setAddress("");
        setBalance("0");
        return;
      }

      const walletAddress = accounts[0];

      setAddress(walletAddress);

      if (currentChainId !== 97) {
        setStatus("Wrong Network");
        setBalance("0");
        return;
      }

      const code = await provider.getCode(
        SKT_ADDRESS
      );

      if (code === "0x") {
        setStatus("ไม่พบ SKT Contract");
        setBalance("0");
        return;
      }

      const token = new Contract(
        SKT_ADDRESS,
        SKT_ABI,
        provider
      );

      const rawBalance =
        await token.balanceOf(walletAddress);

      const decimals =
        await token.decimals();

      const formattedBalance =
        formatUnits(
          rawBalance,
          decimals
        );

      setBalance(formattedBalance);
      setStatus("Connected");
    } catch (error) {
      console.error("Wallet Error:", error);

      setStatus("เกิดข้อผิดพลาด");
      setBalance("0");
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("กรุณาติดตั้ง MetaMask");
      return;
    }

    try {
      setLoading(true);

      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      await loadWallet();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function switchToBscTestnet() {
    if (!window.ethereum) {
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0x61",
          },
        ],
      });

      await loadWallet();
    } catch (error) {
      console.error(
        "เปลี่ยน Network ไม่สำเร็จ:",
        error
      );
    }
  }

  useEffect(() => {
    loadWallet();

    if (!window.ethereum) {
      return;
    }

    const handleChange = () => {
      loadWallet();
    };

    window.ethereum.on(
      "accountsChanged",
      handleChange
    );

    window.ethereum.on(
      "chainChanged",
      handleChange
    );

    window.addEventListener(
      "sktBalanceChanged",
      handleChange
    );

    return () => {
      window.ethereum?.removeListener(
        "accountsChanged",
        handleChange
      );

      window.ethereum?.removeListener(
        "chainChanged",
        handleChange
      );

      window.removeEventListener(
        "sktBalanceChanged",
        handleChange
      );
    };
  }, []);

  if (!address) {
    return (
      <button
        onClick={connectWallet}
        disabled={loading}
        className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white"
      >
        {loading
          ? "กำลังเชื่อมต่อ..."
          : "Connect Wallet"}
      </button>
    );
  }

  if (chainId !== 97) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-yellow-400">
            Wrong Network
          </p>

          <button
            onClick={switchToBscTestnet}
            className="mt-1 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-bold text-black"
          >
            เปลี่ยนเป็น BSC Testnet
          </button>
        </div>

        <div className="rounded-xl border border-violet-500/50 px-4 py-3 text-violet-300">
          {address.slice(0, 6)}
          ...
          {address.slice(-4)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-slate-400">
          Wallet connected
        </p>

        <p className="text-sm font-semibold text-green-400">
          ● {status}
        </p>

        <p className="text-xs text-violet-300">
          {Number(balance).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 4,
            }
          )}{" "}
          SKT
        </p>
      </div>

      <div className="rounded-xl border border-violet-500/50 bg-violet-500/10 px-5 py-3 font-semibold text-violet-300">
        {address.slice(0, 6)}
        ...
        {address.slice(-4)}
      </div>
    </div>
  );
}