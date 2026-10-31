import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/*
 * =========================================================
 * GET /api/profile
 * =========================================================
 *
 * โหลดข้อมูล Account ที่กำลัง Login
 *
 * หมายเหตุ:
 * - Account = SkillChain User
 * - ไม่ผูก MetaMask เป็นเจ้าของ Account ถาวร
 */
export async function GET() {
  try {
    /*
     * =====================================================
     * SESSION
     * =====================================================
     */
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
     * =====================================================
     * USER
     * =====================================================
     */
    const user =
      await prisma.user.findUnique({
        where: {
          id:
            session.userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบบัญชีผู้ใช้งาน",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      user,
    });
  } catch (error) {
    console.error(
      "Get Profile Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * PATCH /api/profile
 * =========================================================
 *
 * BODY:
 *
 * {
 *   name: "ชื่อผู้ใช้",
 *   email: "email@example.com"
 * }
 *
 * ใช้แก้:
 * - ชื่อ
 * - อีเมล
 */
export async function PATCH(
  req: Request
) {
  try {
    /*
     * =====================================================
     * SESSION
     * =====================================================
     */
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
     * =====================================================
     * BODY
     * =====================================================
     */
    const body =
      await req
        .json()
        .catch(
          () => null
        );

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ข้อมูลไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * NAME
     * =====================================================
     */
    const name =
      typeof body.name ===
      "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณากรอกชื่อผู้ใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    if (
      name.length >
      100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ชื่อผู้ใช้งานยาวเกินไป",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * EMAIL
     * =====================================================
     */
    const email =
      typeof body.email ===
      "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณากรอกอีเมล",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email.length >
      191
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "อีเมลยาวเกินไป",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ตรวจรูปแบบ Email เบื้องต้น
     */
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รูปแบบอีเมลไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * CURRENT USER
     * =====================================================
     */
    const currentUser =
      await prisma.user.findUnique({
        where: {
          id:
            session.userId,
        },

        select: {
          id: true,
          email: true,
        },
      });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบบัญชีผู้ใช้งาน",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =====================================================
     * EMAIL UNIQUE
     * =====================================================
     *
     * ถ้าเปลี่ยนอีเมล
     * ต้องตรวจว่า Email ใหม่
     * ไม่ได้ถูกใช้โดย Account อื่น
     */
    if (
      currentUser.email
        .toLowerCase() !==
      email
    ) {
      const existingEmail =
        await prisma.user.findUnique({
          where: {
            email,
          },

          select: {
            id: true,
          },
        });

      if (
        existingEmail &&
        existingEmail.id !==
          currentUser.id
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */
    const updatedUser =
      await prisma.user.update({
        where: {
          id:
            session.userId,
        },

        data: {
          name,
          email,
        },

        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    /*
     * =====================================================
     * WALLET DIRECTORY NAME SYNC
     * =====================================================
     *
     * WalletDirectory ใช้สำหรับ:
     * address -> ชื่อ SkillChain User ล่าสุด
     *
     * ถ้าผู้ใช้เปลี่ยนชื่อ
     * รายชื่อที่แสดงในประวัติ Wallet
     * ควรเปลี่ยนตามชื่อใหม่ด้วย
     *
     * ไม่ได้เป็นการผูก Wallet
     * กับ Account แบบถาวร
     */
    await prisma.walletDirectory.updateMany({
      where: {
        userId:
          session.userId,
      },

      data: {
        /*
         * WalletDirectory ไม่มี field name
         *
         * relation ไปที่ User อยู่แล้ว
         * จึงไม่ต้องบันทึกชื่อซ้ำ
         */
        updatedAt:
          new Date(),
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "บันทึกข้อมูลโปรไฟล์สำเร็จแล้ว",

      user:
        updatedUser,
    });
  } catch (error) {
    console.error(
      "Update Profile Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการบันทึกโปรไฟล์",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * CURRENT SESSION
 * =========================================================
 */
async function getCurrentSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "skillchain_session"
    )?.value;

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
      },
    });

  if (!session) {
    return null;
  }

  /*
   * =======================================================
   * SESSION EXPIRED
   * =======================================================
   */
  if (
    session.expiresAt <=
    new Date()
  ) {
    await prisma.session
      .delete({
        where: {
          id:
            session.id,
        },
      })
      .catch(
        () => null
      );

    return null;
  }

  return session;
}