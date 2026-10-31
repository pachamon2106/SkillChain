import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  isAddress,
} from "ethers";

import {
  prisma,
} from "@/lib/prisma";

/*
 * =========================================================
 * GET /api/skills
 * =========================================================
 *
 * รองรับ:
 *
 * /api/skills
 *
 * /api/skills?q=css
 *
 * /api/skills?category=Programming
 *
 * /api/skills?q=css&category=Programming
 */
export async function GET(
  req: Request
) {
  try {
    const url =
      new URL(
        req.url
      );

    /*
     * =====================================================
     * SEARCH
     * =====================================================
     */

    const q =
      url.searchParams
        .get("q")
        ?.trim() ??
      "";

    /*
     * =====================================================
     * CATEGORY
     * =====================================================
     */

    const rawCategory =
      url.searchParams
        .get(
          "category"
        )
        ?.trim() ??
      "";

    /*
     * all = ไม่กรอง
     */
    const category =
      rawCategory &&
      rawCategory.toLowerCase() !==
        "all"
        ? rawCategory
        : "";

    /*
     * =====================================================
     * WHERE
     * =====================================================
     */

    const skills =
      await prisma.skill.findMany({
        where: {
          /*
           * Search title / description
           */
          ...(q
            ? {
                OR: [
                  {
                    title: {
                      contains:
                        q,
                    },
                  },

                  {
                    description: {
                      contains:
                        q,
                    },
                  },
                ],
              }
            : {}),

          /*
           * Category
           */
          ...(category
            ? {
                category,
              }
            : {}),
        },

        select: {
          id: true,

          title: true,

          description:
            true,

          price: true,

          category: true,

          payoutAddress:
            true,

          createdAt:
            true,

          owner: {
            select: {
              id: true,

              name: true,
            },
          },

          _count: {
            select: {
              enrollments:
                true,

              lessons:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    /*
     * =====================================================
     * CATEGORY LIST
     * =====================================================
     *
     * ดึงหมวดหมู่ที่มีอยู่จริงใน DB
     *
     * จะเอาไปใช้ทำ Filter
     * และหน้า Categories ได้
     */

    const categoryRows =
      await prisma.skill.findMany({
        where: {
          category: {
            not:
              null,
          },
        },

        select: {
          category:
            true,
        },

        distinct: [
          "category",
        ],

        orderBy: {
          category:
            "asc",
        },
      });

    const categories =
      categoryRows
        .map(
          (
            item
          ) =>
            item.category
              ?.trim()
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(
              value
            )
        );

    return NextResponse.json({
      success: true,

      skills,

      categories,

      filters: {
        q,

        category:
          category ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "Get Skills Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถโหลดรายการทักษะได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * POST /api/skills
 * =========================================================
 *
 * สร้าง Skill ใหม่
 *
 * BODY:
 *
 * {
 *   title: "...",
 *   description: "...",
 *   price: 20,
 *   category: "Programming",
 *   payoutAddress: "0x..."
 * }
 */
export async function POST(
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
     * TITLE
     * =====================================================
     */

    const title =
      typeof body.title ===
      "string"
        ? body.title.trim()
        : "";

    if (!title) {
      return NextResponse.json(
        {
          success: false,

          message:
            "กรุณากรอกชื่อทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    if (
      title.length >
      150
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ชื่อทักษะยาวเกินไป",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * DESCRIPTION
     * =====================================================
     */

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    if (!description) {
      return NextResponse.json(
        {
          success: false,

          message:
            "กรุณากรอกรายละเอียดทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * PRICE
     * =====================================================
     */

    const price =
      Number(
        body.price
      );

    if (
      !Number.isInteger(
        price
      ) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ราคา SKT ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * CATEGORY
     * =====================================================
     */

    const category =
      typeof body.category ===
      "string"
        ? body.category.trim()
        : "";

    if (
      category.length >
      80
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ชื่อหมวดหมู่ยาวเกินไป",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ถ้าไม่กรอกหมวดหมู่
     * เก็บเป็น null
     */
    const normalizedCategory =
      category ||
      null;

    /*
     * =====================================================
     * PAYOUT ADDRESS
     * =====================================================
     *
     * Skill ฟรี:
     *
     * payoutAddress = null
     *
     *
     * Skill เสียเงิน:
     *
     * ต้อง:
     * - Connect MetaMask
     * - payoutAddress ถูกต้อง
     * - payoutAddress ต้องตรงกับ Wallet
     *   ที่เชื่อมอยู่ใน Session ปัจจุบัน
     */

    let payoutAddress:
      | string
      | null =
      null;

    if (
      price >
      0
    ) {
      const submittedAddress =
        typeof body.payoutAddress ===
        "string"
          ? body.payoutAddress.trim()
          : "";

      if (
        !submittedAddress
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "ทักษะที่มีราคา ต้องเชื่อม Wallet สำหรับรับ SKT",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ตรวจ Ethereum Address
       */
      if (
        !isAddress(
          submittedAddress
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Wallet Address สำหรับรับ SKT ไม่ถูกต้อง",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Session ต้องมี Wallet
       */
      if (
        !session.connectedWalletAddress
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "กรุณา Connect MetaMask ก่อนสร้างทักษะที่มีราคา",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ตรวจ Wallet ใน Session
       */
      if (
        !isAddress(
          session.connectedWalletAddress
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Wallet ที่เชื่อมอยู่ใน Session ไม่ถูกต้อง กรุณา Connect ใหม่",
          },
          {
            status: 400,
          }
        );
      }

      const normalizedSubmittedAddress =
        submittedAddress
          .toLowerCase();

      const normalizedSessionAddress =
        session
          .connectedWalletAddress
          .toLowerCase();

      /*
       * Wallet ที่ส่งมาจาก Frontend
       * ต้องเป็น Wallet เดียวกับ
       * Wallet ที่เชื่อมอยู่จริง
       */
      if (
        normalizedSubmittedAddress !==
        normalizedSessionAddress
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Wallet รับ SKT ไม่ตรงกับ Wallet ที่กำลังเชื่อมอยู่ กรุณา Connect ใหม่",
          },
          {
            status: 400,
          }
        );
      }

      payoutAddress =
        normalizedSubmittedAddress;
    }

    /*
     * =====================================================
     * CREATE
     * =====================================================
     */

    const skill =
      await prisma.skill.create({
        data: {
          title,

          description,

          price,

          category:
            normalizedCategory,

          payoutAddress,

          ownerId:
            session.userId,
        },

        select: {
          id: true,

          title: true,

          description:
            true,

          price: true,

          category: true,

          payoutAddress:
            true,

          createdAt:
            true,

          owner: {
            select: {
              id: true,

              name: true,
            },
          },

          _count: {
            select: {
              enrollments:
                true,

              lessons:
                true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "สร้างทักษะสำเร็จแล้ว",

        skill,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create Skill Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "เกิดข้อผิดพลาดในการสร้างทักษะ",
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

        connectedWalletAddress:
          true,
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