import {
  NextRequest,
  NextResponse,
} from "next/server";

import { cookies } from "next/headers";
import { isAddress } from "ethers";

import { prisma } from "@/lib/prisma";

/*
 * =========================================================
 * POST /api/wallet-names
 * =========================================================
 *
 * รับ Wallet Address หลายตัว
 *
 * แล้วค้นหา:
 *
 * Wallet Address
 *      ↓
 * WalletDirectory
 *      ↓
 * User
 *      ↓
 * User.name
 *
 * สำคัญ:
 *
 * - ไม่อ่าน Wallet.balance
 * - ไม่อ่าน User.walletAddress
 * - ไม่อ่านชื่อจาก Session แล้ว
 * - Logout แล้วชื่อยังอยู่
 * - Blockchain ยังเป็นแหล่ง Balance / Transaction จริง
 */
export async function POST(
  request: NextRequest
) {
  try {
    /*
     * =====================================================
     * ต้อง Login ก่อนเรียก API
     * =====================================================
     */
    const currentSession =
      await getCurrentSession();

    if (!currentSession) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเข้าสู่ระบบ",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * =====================================================
     * Request Body
     * =====================================================
     */
    const body: unknown =
      await request.json();

    let rawAddresses:
      unknown[] = [];

    if (
      body &&
      typeof body ===
        "object" &&
      "addresses" in body
    ) {
      const value =
        (
          body as {
            addresses?: unknown;
          }
        ).addresses;

      if (
        Array.isArray(value)
      ) {
        rawAddresses =
          value;
      }
    }

    /*
     * =====================================================
     * Normalize Address
     * =====================================================
     */
    const addresses:
      string[] =
      Array.from(
        new Set<string>(
          rawAddresses
            .filter(
              (
                value: unknown
              ): value is string =>
                typeof value ===
                "string"
            )
            .map(
              (
                address: string
              ) =>
                address
                  .trim()
                  .toLowerCase()
            )
            .filter(
              (
                address: string
              ) =>
                isAddress(
                  address
                )
            )
        )
      );

    /*
     * ไม่มี Address
     */
    if (
      addresses.length ===
      0
    ) {
      return NextResponse.json({
        success: true,
        names: {},
      });
    }

    /*
     * จำกัดจำนวน Address
     */
    const limitedAddresses =
      addresses.slice(
        0,
        100
      );

    /*
     * =====================================================
     * อ่านจาก WalletDirectory
     * =====================================================
     */
    const entries =
      await prisma.walletDirectory.findMany({
        where: {
          address: {
            in: limitedAddresses,
          },
        },

        select: {
          address: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    /*
     * =====================================================
     * Address → User Name
     * =====================================================
     *
     * ตัวอย่าง:
     *
     * {
     *   "0xda8c...": "User 1",
     *   "0x30d1...": "User 2"
     * }
     */
    const names:
      Record<
        string,
        string
      > = {};

    for (
      const entry
      of entries
    ) {
      const address =
        entry.address
          .trim()
          .toLowerCase();

      /*
       * ถ้ามี Name
       * ใช้ Name
       *
       * ถ้าไม่มี
       * ใช้ Email แทน
       */
      const userName =
        entry.user.name
          ?.trim();

      const displayName =
        userName ||
        entry.user.email;

      names[address] =
        displayName;
    }

    return NextResponse.json({
      success: true,

      names,
    });
  } catch (error) {
    console.error(
      "Wallet names error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถค้นหาชื่อบัญชีของ Wallet ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * Current Login Session
 * =========================================================
 *
 * ใช้แค่ตรวจว่าคนเรียก API
 * Login อยู่หรือไม่
 *
 * ไม่ใช้ Session หา Wallet Name แล้ว
 */
async function getCurrentSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "skillchain_session"
    )?.value ?? null;

  if (!token) {
    return null;
  }

  const session =
    await prisma.session.findUnique({
      where: {
        token,
      },

      select: {
        id: true,
        expiresAt: true,
      },
    });

  if (!session) {
    return null;
  }

  /*
   * Session หมดอายุ
   */
  if (
    session.expiresAt.getTime() <=
    Date.now()
  ) {
    try {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      });
    } catch (error) {
      console.error(
        "Delete expired session error:",
        error
      );
    }

    return null;
  }

  return session;
}