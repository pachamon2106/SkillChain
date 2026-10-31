"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  BrowserProvider,
  Contract,
  formatUnits,
} from "ethers";

import {
  SKT_ABI,
  SKT_ADDRESS,
} from "@/lib/token";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

export const BSC_TESTNET_CHAIN_ID = 97;

export const BSC_TESTNET_CHAIN_HEX =
  "0x61";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export type WalletStatus =
  | "disconnected"
  | "connected"
  | "wrong-network"
  | "no-metamask"
  | "error";

type WalletContextValue = {
  address: string;

  balance: string;

  chainId: number | null;

  status: WalletStatus;

  message: string;

  connecting: boolean;

  refreshing: boolean;

  isConnected: boolean;

  formattedBalance: string;

  connectWallet: () => Promise<void>;

  switchToBscTestnet: () => Promise<void>;

  refreshBalance: () => Promise<void>;

  resetWallet: (
    message?: string
  ) => void;
};

/*
 * =========================================================
 * CONTEXT
 * =========================================================
 */

const WalletContext =
  createContext<
    WalletContextValue | undefined
  >(undefined);

/*
 * =========================================================
 * PROVIDER
 * =========================================================
 *
 * จุดสำคัญ:
 *
 * State อยู่ใน React Memory เท่านั้น
 *
 * ไม่เก็บ:
 * - localStorage
 * - sessionStorage
 * - Cookie
 * - Database เพื่อ Auto Connect
 *
 * เพราะฉะนั้น:
 *
 * เปลี่ยนหน้าผ่าน Next.js
 * → State ยังอยู่
 *
 * F5 / Refresh
 * → Provider สร้างใหม่
 * → State หาย
 * → ต้อง Connect ใหม่
 */
export default function WalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    address,
    setAddress,
  ] = useState("");

  const [
    balance,
    setBalance,
  ] = useState("0");

  const [
    chainId,
    setChainId,
  ] =
    useState<number | null>(
      null
    );

  const [
    status,
    setStatus,
  ] =
    useState<WalletStatus>(
      "disconnected"
    );

  const [
    message,
    setMessage,
  ] = useState(
    "ยังไม่ได้เชื่อม MetaMask"
  );

  const [
    connecting,
    setConnecting,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  /*
   * =========================================================
   * RESET
   * =========================================================
   *
   * ใช้เมื่อ:
   *
   * - MetaMask Account เปลี่ยน
   * - Logout
   * - เปลี่ยน Login User
   *
   * Refresh Browser
   * ไม่ต้องเรียกเอง
   * เพราะ React State หายเองอยู่แล้ว
   */
  const resetWallet =
    useCallback(
      (
        resetMessage =
          "ยังไม่ได้เชื่อม MetaMask"
      ) => {
        setAddress("");

        setBalance("0");

        setChainId(null);

        setStatus(
          "disconnected"
        );

        setMessage(
          resetMessage
        );

        setConnecting(false);

        setRefreshing(false);
      },
      []
    );

  /*
   * =========================================================
   * SYNC SKILLCHAIN
   * =========================================================
   *
   * ใช้สำหรับ:
   *
   * Session.connectedWalletAddress
   * WalletDirectory
   *
   * ไม่ใช้:
   *
   * - Balance
   * - Transaction
   *
   * Balance / Transaction
   * มาจาก Blockchain เท่านั้น
   */
  const syncWalletToSkillChain =
    useCallback(
      async (
        walletAddress: string
      ) => {
        try {
          const response =
            await fetch(
              "/api/session-wallet",
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
                    address:
                      walletAddress,
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
              "Sync wallet failed:",
              data
            );

            return false;
          }

          return true;
        } catch (error) {
          console.error(
            "Sync wallet error:",
            error
          );

          return false;
        }
      },
      []
    );

  /*
   * =========================================================
   * LOAD WALLET DATA
   * =========================================================
   *
   * รับ Address ที่เราอนุญาตแล้ว
   * จากการกด Connect
   *
   * แล้วอ่าน:
   *
   * Network
   * Balance
   *
   * จาก MetaMask / Blockchain
   */
  const loadWalletData =
    useCallback(
      async (
        walletAddress: string,
        syncDirectory = false
      ) => {
        const ethereum =
          (window as any)
            .ethereum;

        if (!ethereum) {
          setAddress("");

          setBalance("0");

          setChainId(null);

          setStatus(
            "no-metamask"
          );

          setMessage(
            "ไม่พบ MetaMask ใน Browser"
          );

          return false;
        }

        try {
          /*
           * ตรวจ Account ปัจจุบัน
           *
           * สำคัญ:
           * ถ้า Account เปลี่ยน
           * ห้ามตาม Account ใหม่อัตโนมัติ
           */
          const accounts =
            (await ethereum.request({
              method:
                "eth_accounts",
            })) as string[];

          if (
            !accounts ||
            accounts.length ===
              0
          ) {
            resetWallet(
              "MetaMask ไม่ได้เชื่อม Account อยู่ กรุณา Connect ใหม่"
            );

            return false;
          }

          const currentAccount =
            accounts[0];

          if (
            currentAccount.toLowerCase() !==
            walletAddress.toLowerCase()
          ) {
            resetWallet(
              "MetaMask Account เปลี่ยน กรุณา Connect ใหม่"
            );

            return false;
          }

          const provider =
            new BrowserProvider(
              ethereum
            );

          /*
           * Network
           */
          const network =
            await provider.getNetwork();

          const currentChainId =
            Number(
              network.chainId
            );

          setAddress(
            walletAddress
          );

          setChainId(
            currentChainId
          );

          /*
           * Wrong Network
           */
          if (
            currentChainId !==
            BSC_TESTNET_CHAIN_ID
          ) {
            setBalance("0");

            setStatus(
              "wrong-network"
            );

            setMessage(
              "กรุณาเปลี่ยนเป็น BNB Smart Chain Testnet"
            );

            return false;
          }

          /*
           * ตรวจ Contract
           */
          const contractCode =
            await provider.getCode(
              SKT_ADDRESS
            );

          if (
            contractCode ===
            "0x"
          ) {
            setBalance("0");

            setStatus(
              "error"
            );

            setMessage(
              "ไม่พบ SKT Contract บน Network นี้"
            );

            return false;
          }

          /*
           * SKT Contract
           */
          const token =
            new Contract(
              SKT_ADDRESS,
              SKT_ABI,
              provider
            );

          /*
           * Balance จริง
           * จาก Blockchain
           */
          const [
            rawBalance,
            decimals,
          ] =
            await Promise.all([
              token.balanceOf(
                walletAddress
              ),

              token.decimals(),
            ]);

          const formatted =
            formatUnits(
              rawBalance,
              decimals
            );

          setBalance(
            formatted
          );

          setStatus(
            "connected"
          );

          setMessage(
            "เชื่อมต่อ MetaMask แล้ว"
          );

          /*
           * Sync Directory
           *
           * ทำหลัง Wallet ใช้งานได้
           */
          if (
            syncDirectory
          ) {
            const synced =
              await syncWalletToSkillChain(
                walletAddress
              );

            if (!synced) {
              setMessage(
                "เชื่อมต่อ MetaMask แล้ว แต่ยังซิงก์ข้อมูลกับ SkillChain ไม่สำเร็จ"
              );
            }
          }

          return true;
        } catch (error) {
          console.error(
            "Load wallet data error:",
            error
          );

          setBalance("0");

          setStatus(
            "error"
          );

          setMessage(
            "เกิดข้อผิดพลาดในการอ่าน Wallet"
          );

          return false;
        }
      },
      [
        resetWallet,
        syncWalletToSkillChain,
      ]
    );

  /*
   * =========================================================
   * CONNECT METAMASK
   * =========================================================
   *
   * ต้องเกิดจาก User กดปุ่ม Connect เท่านั้น
   *
   * Provider จะไม่เรียก function นี้เอง
   */
  const connectWallet =
    useCallback(async () => {
      const ethereum =
        (window as any)
          .ethereum;

      if (!ethereum) {
        setStatus(
          "no-metamask"
        );

        setMessage(
          "กรุณาติดตั้ง MetaMask ก่อน"
        );

        return;
      }

      try {
        setConnecting(true);

        /*
         * เปิด Permission / Account Selector
         *
         * ทำให้ผู้ใช้เลือก Account
         * ด้วยตัวเองทุกครั้งที่กด Connect
         */
        try {
          await ethereum.request({
            method:
              "wallet_requestPermissions",

            params: [
              {
                eth_accounts:
                  {},
              },
            ],
          });
        } catch (
          permissionError: any
        ) {
          /*
           * Provider บางตัว
           * ไม่รองรับ
           * wallet_requestPermissions
           */
          if (
            permissionError?.code ===
            -32601
          ) {
            await ethereum.request({
              method:
                "eth_requestAccounts",
            });
          } else {
            throw permissionError;
          }
        }

        /*
         * อ่าน Account หลัง User เลือก
         */
        const accounts =
          (await ethereum.request({
            method:
              "eth_accounts",
          })) as string[];

        if (
          !accounts ||
          accounts.length ===
            0
        ) {
          resetWallet(
            "ไม่พบ MetaMask Account"
          );

          return;
        }

        const selectedAddress =
          accounts[0];

        /*
         * หลัง Connect สำเร็จ
         * ค่อย Sync SkillChain
         */
        await loadWalletData(
          selectedAddress,
          true
        );
      } catch (error: any) {
        console.error(
          "Connect wallet error:",
          error
        );

        /*
         * User Cancel
         */
        if (
          error?.code === 4001
        ) {
          resetWallet(
            "ยกเลิกการเชื่อมต่อ MetaMask"
          );

          return;
        }

        /*
         * Request ค้าง
         */
        if (
          error?.code ===
          -32002
        ) {
          setStatus(
            "disconnected"
          );

          setMessage(
            "มีคำขอ MetaMask รออยู่ กรุณาเปิด MetaMask เพื่อตรวจสอบ"
          );

          return;
        }

        resetWallet(
          "ไม่สามารถเชื่อมต่อ MetaMask ได้"
        );

        setStatus(
          "error"
        );
      } finally {
        setConnecting(false);
      }
    }, [
      loadWalletData,
      resetWallet,
    ]);

  /*
   * =========================================================
   * SWITCH NETWORK
   * =========================================================
   */
  const switchToBscTestnet =
    useCallback(async () => {
      const ethereum =
        (window as any)
          .ethereum;

      if (
        !ethereum ||
        !address
      ) {
        return;
      }

      try {
        setConnecting(true);

        try {
          await ethereum.request({
            method:
              "wallet_switchEthereumChain",

            params: [
              {
                chainId:
                  BSC_TESTNET_CHAIN_HEX,
              },
            ],
          });
        } catch (
          switchError: any
        ) {
          /*
           * Network ยังไม่มี
           * ใน MetaMask
           */
          if (
            switchError?.code !==
            4902
          ) {
            throw switchError;
          }

          await ethereum.request({
            method:
              "wallet_addEthereumChain",

            params: [
              {
                chainId:
                  BSC_TESTNET_CHAIN_HEX,

                chainName:
                  "BNB Smart Chain Testnet",

                nativeCurrency:
                  {
                    name:
                      "BNB",

                    symbol:
                      "tBNB",

                    decimals:
                      18,
                  },

                rpcUrls: [
                  "https://data-seed-prebsc-1-s1.bnbchain.org:8545/",
                ],

                blockExplorerUrls: [
                  "https://testnet.bscscan.com",
                ],
              },
            ],
          });
        }

        /*
         * Network เปลี่ยน
         * แต่ Account ต้องเป็นตัวเดิม
         */
        await loadWalletData(
          address,
          true
        );
      } catch (error) {
        console.error(
          "Switch network error:",
          error
        );

        setStatus(
          "error"
        );

        setMessage(
          "ไม่สามารถเปลี่ยน Network ได้"
        );
      } finally {
        setConnecting(false);
      }
    }, [
      address,
      loadWalletData,
    ]);

  /*
   * =========================================================
   * REFRESH BALANCE
   * =========================================================
   */
  const refreshBalance =
    useCallback(async () => {
      if (!address) {
        return;
      }

      try {
        setRefreshing(true);

        /*
         * ถ้า Account ถูกเปลี่ยน
         * loadWalletData จะ Reset
         */
        await loadWalletData(
          address,
          false
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      address,
      loadWalletData,
    ]);

  /*
   * =========================================================
   * METAMASK EVENTS
   * =========================================================
   *
   * สำคัญมาก:
   *
   * accountsChanged
   * → ไม่ตาม Account ใหม่
   * → Reset ทันที
   * → User ต้อง Connect ใหม่
   */
  useEffect(() => {
    if (!address) {
      return;
    }

    const ethereum =
      (window as any)
        .ethereum;

    if (!ethereum) {
      return;
    }

    const handleAccountsChanged =
      () => {
        resetWallet(
          "MetaMask Account เปลี่ยน กรุณา Connect ใหม่"
        );
      };

    /*
     * Network เปลี่ยนได้
     * โดยยังใช้ Account เดิม
     */
    const handleChainChanged =
      () => {
        void loadWalletData(
          address,
          false
        );
      };

    /*
     * Token Transfer สำเร็จ
     */
    const handleBalanceChanged =
      () => {
        void loadWalletData(
          address,
          false
        );
      };

    ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    window.addEventListener(
      "sktBalanceChanged",
      handleBalanceChanged
    );

    return () => {
      ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );

      ethereum.removeListener?.(
        "chainChanged",
        handleChainChanged
      );

      window.removeEventListener(
        "sktBalanceChanged",
        handleBalanceChanged
      );
    };
  }, [
    address,
    loadWalletData,
    resetWallet,
  ]);

  /*
   * =========================================================
   * COMPUTED
   * =========================================================
   */
  const isConnected =
    status ===
      "connected" &&
    Boolean(address) &&
    chainId ===
      BSC_TESTNET_CHAIN_ID;

  const formattedBalance =
    useMemo(() => {
      const number =
        Number(balance);

      if (
        !Number.isFinite(
          number
        )
      ) {
        return "0";
      }

      return number.toLocaleString(
        "en-US",
        {
          maximumFractionDigits:
            4,
        }
      );
    }, [balance]);

  /*
   * =========================================================
   * VALUE
   * =========================================================
   */
  const value =
    useMemo<
      WalletContextValue
    >(
      () => ({
        address,

        balance,

        chainId,

        status,

        message,

        connecting,

        refreshing,

        isConnected,

        formattedBalance,

        connectWallet,

        switchToBscTestnet,

        refreshBalance,

        resetWallet,
      }),
      [
        address,
        balance,
        chainId,
        status,
        message,
        connecting,
        refreshing,
        isConnected,
        formattedBalance,
        connectWallet,
        switchToBscTestnet,
        refreshBalance,
        resetWallet,
      ]
    );

  return (
    <WalletContext.Provider
      value={value}
    >
      {children}
    </WalletContext.Provider>
  );
}

/*
 * =========================================================
 * HOOK
 * =========================================================
 */
export function useWallet() {
  const context =
    useContext(
      WalletContext
    );

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider"
    );
  }

  return context;
}