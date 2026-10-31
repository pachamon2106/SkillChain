import {
  Contract,
  formatUnits,
  isAddress,
} from "ethers";

import type {
  BrowserProvider,
} from "ethers";

import {
  SKT_ABI,
  SKT_ADDRESS,
} from "@/lib/token";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export type SktHistoryItem = {
  id: string;

  type:
    | "send"
    | "receive";

  from: string;

  to: string;

  amount: string;

  txHash: string;

  blockNumber: number;

  logIndex: number;

  timestamp: number | null;
};

export type SktHistoryResult = {
  items: SktHistoryItem[];

  latestBlock: number;

  scannedFromBlock: number;
};

/*
 * =========================================================
 * CONFIG
 * =========================================================
 */

const BSC_TESTNET_CHAIN_ID =
  97;

/*
 * เดิม 20,000 blocks สั้นเกินไป
 *
 * ขยายเป็น 500,000 blocks
 */
const MAX_LOOKBACK_BLOCKS =
  500_000;

/*
 * เริ่ม Query ช่วงละ 20,000 blocks
 *
 * ถ้า RPC รับไม่ไหว
 * ระบบจะ Split ช่วงลงเอง
 */
const PREFERRED_BLOCK_CHUNK =
  20_000;

const MIN_BLOCK_CHUNK =
  1_000;

const MAX_ITEMS =
  50;

/*
 * =========================================================
 * MAIN
 * =========================================================
 */
export async function getSktHistory({
  provider,
  walletAddress,
}: {
  provider: BrowserProvider;
  walletAddress: string;
}): Promise<SktHistoryResult> {
  /*
   * =======================================================
   * VALIDATE ADDRESS
   * =======================================================
   */
  if (
    !walletAddress ||
    !isAddress(walletAddress)
  ) {
    throw new Error(
      "INVALID_WALLET_ADDRESS"
    );
  }

  const normalizedWallet =
    walletAddress.toLowerCase();

  /*
   * =======================================================
   * NETWORK
   * =======================================================
   */
  const network =
    await provider.getNetwork();

  const chainId =
    Number(
      network.chainId
    );

  if (
    chainId !==
    BSC_TESTNET_CHAIN_ID
  ) {
    throw new Error(
      "WRONG_NETWORK"
    );
  }

  /*
   * =======================================================
   * CONTRACT
   * =======================================================
   */
  const contractCode =
    await provider.getCode(
      SKT_ADDRESS
    );

  if (
    contractCode === "0x"
  ) {
    throw new Error(
      "CONTRACT_NOT_FOUND"
    );
  }

  const token =
    new Contract(
      SKT_ADDRESS,
      SKT_ABI,
      provider
    );

  const decimals =
    await token.decimals();

  /*
   * =======================================================
   * FILTERS
   * =======================================================
   *
   * ใช้ Indexed Topic ของ Transfer
   *
   * ส่ง:
   * Transfer(wallet, ...)
   *
   * รับ:
   * Transfer(..., wallet)
   *
   * วิธีนี้ตรงกับของเดิม
   * ที่เคยใช้งานได้แน่นอน
   */
  const outgoingFilter =
    token.filters.Transfer(
      walletAddress,
      null
    );

  const incomingFilter =
    token.filters.Transfer(
      null,
      walletAddress
    );

  /*
   * =======================================================
   * BLOCK RANGE
   * =======================================================
   */
  const latestBlock =
    await provider.getBlockNumber();

  const earliestBlock =
    Math.max(
      0,

      latestBlock -
        MAX_LOOKBACK_BLOCKS +
        1
    );

  /*
   * =======================================================
   * RESULT MAP
   * =======================================================
   */
  const unique =
    new Map<
      string,
      SktHistoryItem
    >();

  /*
   * =======================================================
   * SCAN BLOCKCHAIN
   * =======================================================
   *
   * ใหม่ → เก่า
   */
  let toBlock =
    latestBlock;

  while (
    toBlock >=
      earliestBlock &&
    unique.size <
      MAX_ITEMS
  ) {
    const fromBlock =
      Math.max(
        earliestBlock,

        toBlock -
          PREFERRED_BLOCK_CHUNK +
          1
      );

    /*
     * =====================================================
     * OUTGOING
     * =====================================================
     *
     * ตั้งใจยิงแยกจาก incoming
     *
     * ไม่ Promise.all
     *
     * เพื่อลดโอกาส Public RPC
     * Rate Limit
     */
    const outgoingEvents =
      await queryEventsAdaptive({
        token,

        filter:
          outgoingFilter,

        fromBlock,

        toBlock,
      });

    /*
     * =====================================================
     * INCOMING
     * =====================================================
     */
    const incomingEvents =
      await queryEventsAdaptive({
        token,

        filter:
          incomingFilter,

        fromBlock,

        toBlock,
      });

    /*
     * =====================================================
     * OUTGOING → ITEM
     * =====================================================
     */
    for (
      const event
      of outgoingEvents
    ) {
      const item =
        eventToHistoryItem({
          event,

          decimals,

          normalizedWallet,
        });

      if (!item) {
        continue;
      }

      unique.set(
        item.id,
        item
      );
    }

    /*
     * =====================================================
     * INCOMING → ITEM
     * =====================================================
     */
    for (
      const event
      of incomingEvents
    ) {
      const item =
        eventToHistoryItem({
          event,

          decimals,

          normalizedWallet,
        });

      if (!item) {
        continue;
      }

      /*
       * ถ้าเป็น Self Transfer
       *
       * outgoing/incoming
       * จะเจอ Event เดียวกัน
       *
       * Map จะกันซ้ำให้
       */
      unique.set(
        item.id,
        item
      );
    }

    /*
     * ไปช่วงเก่ากว่า
     */
    toBlock =
      fromBlock - 1;
  }

  /*
   * =======================================================
   * SORT
   * =======================================================
   */
  let items =
    Array.from(
      unique.values()
    )
      .sort(
        (
          a,
          b
        ) => {
          if (
            b.blockNumber !==
            a.blockNumber
          ) {
            return (
              b.blockNumber -
              a.blockNumber
            );
          }

          return (
            b.logIndex -
            a.logIndex
          );
        }
      )
      .slice(
        0,
        MAX_ITEMS
      );

  /*
   * =======================================================
   * TIMESTAMPS
   * =======================================================
   */
  const uniqueBlocks =
    Array.from(
      new Set(
        items.map(
          (item) =>
            item.blockNumber
        )
      )
    );

  const timestamps =
    new Map<
      number,
      number
    >();

  await Promise.all(
    uniqueBlocks.map(
      async (
        blockNumber
      ) => {
        try {
          const block =
            await provider.getBlock(
              blockNumber
            );

          if (!block) {
            return;
          }

          timestamps.set(
            blockNumber,
            block.timestamp
          );
        } catch (error) {
          /*
           * Timestamp โหลดไม่ได้
           * ไม่ควรทำให้ History หาย
           */
          console.error(
            "Load block timestamp error:",
            error
          );
        }
      }
    )
  );

  items =
    items.map(
      (item) => ({
        ...item,

        timestamp:
          timestamps.get(
            item.blockNumber
          ) ?? null,
      })
    );

  return {
    items,

    latestBlock,

    scannedFromBlock:
      earliestBlock,
  };
}

/*
 * =========================================================
 * EVENT → HISTORY ITEM
 * =========================================================
 */
function eventToHistoryItem({
  event,
  decimals,
  normalizedWallet,
}: {
  event: any;

  decimals: any;

  normalizedWallet: string;
}): SktHistoryItem | null {
  const args =
    event?.args;

  if (!args) {
    return null;
  }

  const from =
    String(
      args.from ??
        args[0] ??
        ""
    );

  const to =
    String(
      args.to ??
        args[1] ??
        ""
    );

  const value =
    args.value ??
    args[2];

  if (
    !from ||
    !to ||
    value === undefined
  ) {
    return null;
  }

  const txHash =
    String(
      event
        .transactionHash ??
        ""
    );

  if (!txHash) {
    return null;
  }

  const blockNumber =
    Number(
      event
        .blockNumber ??
        0
    );

  const logIndex =
    Number(
      event.index ??
        event.logIndex ??
        0
    );

  const fromLower =
    from.toLowerCase();

  const toLower =
    to.toLowerCase();

  /*
   * Safety check
   *
   * ถึงแม้ Filter Blockchain
   * จะกรองมาแล้ว
   * เราก็ตรวจอีกครั้ง
   */
  if (
    fromLower !==
      normalizedWallet &&
    toLower !==
      normalizedWallet
  ) {
    return null;
  }

  const isSend =
    fromLower ===
    normalizedWallet;

  const amount =
    formatUnits(
      value,
      decimals
    );

  const id =
    `${txHash}-${logIndex}`;

  return {
    id,

    type:
      isSend
        ? "send"
        : "receive",

    from,

    to,

    amount,

    txHash,

    blockNumber,

    logIndex,

    timestamp:
      null,
  };
}

/*
 * =========================================================
 * ADAPTIVE QUERY
 * =========================================================
 *
 * เช่น:
 *
 * Query 20,000 blocks
 *
 * ถ้า RPC ไม่รับ:
 *
 * 20,000
 * ↓
 * 10,000 + 10,000
 * ↓
 * 5,000 + 5,000
 *
 * ทำต่อจน RPC รับได้
 */
async function queryEventsAdaptive({
  token,
  filter,
  fromBlock,
  toBlock,
}: {
  token: Contract;

  filter: any;

  fromBlock: number;

  toBlock: number;
}): Promise<any[]> {
  try {
    const events =
      await token.queryFilter(
        filter,
        fromBlock,
        toBlock
      );

    return events as any[];
  } catch (error) {
    const blockCount =
      toBlock -
      fromBlock +
      1;

    /*
     * ช่วงเล็กแล้ว
     * ยัง Query ไม่ได้
     *
     * ส่ง Error จริงออกไป
     */
    if (
      blockCount <=
      MIN_BLOCK_CHUNK
    ) {
      throw error;
    }

    const middleBlock =
      Math.floor(
        (
          fromBlock +
          toBlock
        ) / 2
      );

    /*
     * ตั้งใจ Query ทีละฝั่ง
     *
     * ไม่ยิงพร้อมกัน
     * เพื่อถนอม Public RPC
     */
    const olderEvents =
      await queryEventsAdaptive({
        token,

        filter,

        fromBlock,

        toBlock:
          middleBlock,
      });

    const newerEvents =
      await queryEventsAdaptive({
        token,

        filter,

        fromBlock:
          middleBlock +
          1,

        toBlock,
      });

    return [
      ...olderEvents,
      ...newerEvents,
    ];
  }
}

/*
 * =========================================================
 * ERROR MESSAGE
 * =========================================================
 */
export function getSktHistoryErrorMessage(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    if (
      error.message ===
      "WRONG_NETWORK"
    ) {
      return "กรุณาเปลี่ยนเป็น BNB Smart Chain Testnet";
    }

    if (
      error.message ===
      "CONTRACT_NOT_FOUND"
    ) {
      return "ไม่พบ SKT Contract บน Network นี้";
    }

    if (
      error.message ===
      "INVALID_WALLET_ADDRESS"
    ) {
      return "Wallet Address ไม่ถูกต้อง";
    }
  }

  return "ไม่สามารถโหลดประวัติ SKT จาก Blockchain ได้";
}