import {
  NextRequest,
  NextResponse,
} from "next/server";

import { cookies } from "next/headers";
import { isAddress } from "ethers";

import { prisma } from "@/lib/prisma";

/*
 * =========================================================
 * GET
 * =========================================================
 *
 * ดูว่า Session ปัจจุบันกำลัง Connect
 * Wallet ไหนอยู่
 */
export async function GET() {
  try {
    const session =
      await getCurrentSession();

    if (!session) {
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

    return NextResponse.json({
      success: true,

      walletAddress:
        session.connectedWalletAddress,
    });
  } catch (error) {
    console.error(
      "Get session wallet error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถตรวจสอบ Wallet ของ Session ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * POST
 * =========================================================
 *
 * เมื่อ User กด Connect MetaMask:
 *
 * 1. บันทึก Address ลง Session ปัจจุบัน
 *
 * 2. บันทึก Address → User
 *    ลง WalletDirectory
 *
 * WalletDirectory ใช้สำหรับแสดงชื่อเท่านั้น
 *
 * Balance / Transaction
 * ยังคงอ่าน Blockchain
 */
export async function POST(
  request: NextRequest
) {
  try {
    const session =
      await getCurrentSession();

    if (!session) {
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
     * Request Body
     */
    const body:
      unknown =
      await request.json();

    let rawAddress = "";

    if (
      body &&
      typeof body ===
        "object" &&
      "address" in body
    ) {
      const value =
        (
          body as {
            address?: unknown;
          }
        ).address;

      if (
        typeof value ===
        "string"
      ) {
        rawAddress =
          value.trim();
      }
    }

    /*
     * ตรวจ Address
     */
    if (
      !rawAddress ||
      !isAddress(
        rawAddress
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Wallet Address ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ใช้ lowercase
     * เพื่อเทียบ Address ง่าย
     */
    const normalizedAddress =
      rawAddress.toLowerCase();

    /*
     * =======================================================
     * Transaction
     * =======================================================
     *
     * ทำทุกอย่างพร้อมกัน:
     *
     * 1. เอา Wallet นี้ออกจาก Session อื่น
     * 2. ผูกกับ Session ปัจจุบัน
     * 3. Upsert WalletDirectory
     */
    await prisma.$transaction(
      async (tx) => {
        /*
         * ===================================================
         * 1. ล้าง Mapping Session เก่า
         * ===================================================
         */
        await tx.session.updateMany({
          where: {
            connectedWalletAddress:
              normalizedAddress,

            id: {
              not: session.id,
            },
          },

          data: {
            connectedWalletAddress:
              null,
          },
        });

        /*
         * ===================================================
         * 2. Session ปัจจุบัน
         * ===================================================
         */
        await tx.session.update({
          where: {
            id: session.id,
          },

          data: {
            connectedWalletAddress:
              normalizedAddress,
          },
        });

        /*
         * ===================================================
         * 3. Wallet Directory
         * ===================================================
         *
         * Address เดิมมีอยู่แล้ว:
         * → เปลี่ยน userId เป็น User ล่าสุดที่ Connect
         *
         * Address ใหม่:
         * → สร้างรายการใหม่
         */
        await tx.walletDirectory.upsert({
          where: {
            address:
              normalizedAddress,
          },

          update: {
            userId:
              session.userId,
          },

          create: {
            address:
              normalizedAddress,

            userId:
              session.userId,
          },
        });
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "บันทึก Wallet และ Wallet Directory แล้ว",

      walletAddress:
        normalizedAddress,
    });
  } catch (error) {
    console.error(
      "Save session wallet error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถบันทึก Wallet ของ Session ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 *
 * ล้างเฉพาะ Wallet จาก Session
 *
 * สำคัญ:
 *
 * ไม่ลบ WalletDirectory
 *
 * เพราะเราต้องการให้ Logout แล้ว
 * History ยังสามารถแสดงชื่อได้
 */
export async function DELETE() {
  try {
    const session =
      await getCurrentSession();

    if (!session) {
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

    await prisma.session.update({
      where: {
        id: session.id,
      },

      data: {
        connectedWalletAddress:
          null,

        walletNonce:
          null,

        walletNonceExpires:
          null,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "ยกเลิก Wallet ของ Session แล้ว",
    });
  } catch (error) {
    console.error(
      "Delete session wallet error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถยกเลิก Wallet ของ Session ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * Current Session
 * =========================================================
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

        userId: true,

        expiresAt: true,

        connectedWalletAddress:
          true,
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