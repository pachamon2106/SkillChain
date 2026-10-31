import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  Contract,
  Interface,
  JsonRpcProvider,
  isAddress,
  parseUnits,
} from "ethers";

import { prisma } from "@/lib/prisma";

import {
  SKT_ABI,
  SKT_ADDRESS,
} from "@/lib/token";

/*
 * =========================================================
 * CONFIG
 * =========================================================
 */

const BSC_TESTNET_CHAIN_ID =
  97;

/*
 * =========================================================
 * GET /api/enrollments
 * =========================================================
 *
 * โหลด Skill ที่ User ปัจจุบันสมัครเรียนแล้ว
 */
export async function GET() {
  try {
    /*
     * Session
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
     * Enrollment ของ User
     */
    const enrollments =
      await prisma.enrollment.findMany({
        where: {
          studentId:
            session.userId,
        },

        select: {
          id: true,

          status: true,

          paidAmount: true,

          paymentTxHash:
            true,

          createdAt: true,

          updatedAt: true,

          skill: {
            select: {
              id: true,

              title: true,

              description:
                true,

              price: true,

              payoutAddress:
                true,

              createdAt: true,

              owner: {
                select: {
                  id: true,

                  name: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    return NextResponse.json({
      success: true,

      enrollments,
    });
  } catch (error) {
    console.error(
      "Get Enrollments Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถโหลดรายการเรียนได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * POST /api/enrollments
 * =========================================================
 *
 * สมัครเรียน Skill
 *
 * BODY
 *
 * Skill ฟรี:
 *
 * {
 *   skillId: 1
 * }
 *
 * Skill มีราคา:
 *
 * {
 *   skillId: 2,
 *   txHash: "0x..."
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
     * SKILL ID
     * =====================================================
     */
    const skillId =
      Number(
        body.skillId
      );

    if (
      !Number.isInteger(
        skillId
      ) ||
      skillId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Skill ID ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * LOAD SKILL
     * =====================================================
     */
    const skill =
      await prisma.skill.findUnique({
        where: {
          id: skillId,
        },

        select: {
          id: true,

          title: true,

          price: true,

          payoutAddress:
            true,

          ownerId: true,

          owner: {
            select: {
              id: true,

              name: true,
            },
          },
        },
      });

    if (!skill) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่พบทักษะนี้",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =====================================================
     * ห้ามสมัคร Skill ของตัวเอง
     * =====================================================
     */
    if (
      skill.ownerId ===
      session.userId
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่สามารถสมัครเรียน Skill ของตัวเองได้",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * ALREADY ENROLLED
     * =====================================================
     */
    const existingEnrollment =
      await prisma.enrollment.findUnique({
        where: {
          skillId_studentId:
            {
              skillId:
                skill.id,

              studentId:
                session.userId,
            },
        },

        select: {
          id: true,

          status: true,
        },
      });

    if (
      existingEnrollment
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "คุณสมัครเรียน Skill นี้แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =====================================================
     * FREE SKILL
     * =====================================================
     */
    if (
      skill.price === 0
    ) {
      const enrollment =
        await prisma.enrollment.create({
          data: {
            skillId:
              skill.id,

            studentId:
              session.userId,

            status:
              "active",

            paidAmount:
              0,

            paymentTxHash:
              null,
          },

          select: {
            id: true,

            status: true,

            paidAmount: true,

            paymentTxHash:
              true,

            createdAt: true,

            skill: {
              select: {
                id: true,

                title: true,

                price: true,

                owner: {
                  select: {
                    id: true,

                    name: true,
                  },
                },
              },
            },
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "สมัครเรียนสำเร็จ",

          enrollment,
        },
        {
          status: 201,
        }
      );
    }

    /*
     * =====================================================
     * PAID SKILL
     * =====================================================
     *
     * ตั้งแต่ตรงนี้ลงไป
     * Skill ต้องมีราคา > 0
     */

    /*
     * Skill เก่าที่ไม่มี payoutAddress
     */
    if (
      !skill.payoutAddress
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Skill นี้ยังไม่มี Wallet สำหรับรับ SKT กรุณาให้ผู้สอนตั้งค่า Wallet ก่อน",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !isAddress(
        skill.payoutAddress
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Wallet รับ SKT ของ Skill นี้ไม่ถูกต้อง",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =====================================================
     * CONNECTED WALLET
     * =====================================================
     */
    const studentWallet =
      session
        .connectedWalletAddress;

    if (
      !studentWallet
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "กรุณา Connect MetaMask ก่อนสมัคร Skill ที่มีราคา",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isAddress(
        studentWallet
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Wallet ของผู้เรียนไม่ถูกต้อง กรุณา Connect MetaMask ใหม่",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ห้าม Wallet ผู้เรียน
     * เป็น Wallet รับเงินเดียวกัน
     */
    if (
      studentWallet
        .toLowerCase() ===
      skill.payoutAddress
        .toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Wallet ผู้เรียนและ Wallet รับ SKT ต้องไม่ใช่ Wallet เดียวกัน",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * TX HASH
     * =====================================================
     */
    const txHash =
      typeof body.txHash ===
      "string"
        ? body.txHash.trim()
        : "";

    if (
      !isTransactionHash(
        txHash
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Transaction Hash ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * TX HASH USED?
     * =====================================================
     *
     * paymentTxHash เป็น unique อยู่แล้ว
     *
     * แต่เช็กก่อนเพื่อให้ Error อ่านง่าย
     */
    const usedTransaction =
      await prisma.enrollment.findUnique({
        where: {
          paymentTxHash:
            txHash,
        },

        select: {
          id: true,
        },
      });

    if (
      usedTransaction
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Transaction นี้ถูกใช้สมัครเรียนไปแล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =====================================================
     * SERVER RPC
     * =====================================================
     */
    const rpcUrl =
      process.env
        .BSC_TESTNET_RPC_URL;

    if (!rpcUrl) {
      console.error(
        "BSC_TESTNET_RPC_URL is missing"
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Server ยังไม่ได้ตั้งค่า Blockchain RPC",
        },
        {
          status: 500,
        }
      );
    }

    const provider =
      new JsonRpcProvider(
        rpcUrl
      );

    /*
     * =====================================================
     * NETWORK
     * =====================================================
     */
    const network =
      await provider.getNetwork();

    if (
      Number(
        network.chainId
      ) !==
      BSC_TESTNET_CHAIN_ID
    ) {
      console.error(
        "Wrong RPC Network:",
        network.chainId
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Blockchain RPC ไม่ได้เชื่อม BNB Smart Chain Testnet",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================================
     * RECEIPT
     * =====================================================
     */
    const receipt =
      await provider
        .getTransactionReceipt(
          txHash
        );

    if (!receipt) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ยังไม่พบ Transaction บน Blockchain หรือ Transaction ยังไม่ถูกยืนยัน",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * status:
     *
     * 1 = success
     * 0 = reverted
     */
    if (
      receipt.status !==
      1
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Transaction ไม่สำเร็จบน Blockchain",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * TRANSACTION
     * =====================================================
     */
    const transaction =
      await provider
        .getTransaction(
          txHash
        );

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่พบข้อมูล Transaction",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ธุรกรรม transfer() ปกติ
     * ต้องส่งเข้า SKT Contract
     */
    if (
      !transaction.to ||
      transaction.to
        .toLowerCase() !==
        SKT_ADDRESS
          .toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Transaction นี้ไม่ได้ส่งเข้า SKT Contract",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Transaction sender
     * ต้องเป็น Wallet ผู้เรียน
     */
    if (
      transaction.from
        .toLowerCase() !==
      studentWallet
        .toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Wallet ที่ชำระ SKT ไม่ตรงกับ Wallet ที่ Connect อยู่",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * SKT CONTRACT
     * =====================================================
     */
    const token =
      new Contract(
        SKT_ADDRESS,
        SKT_ABI,
        provider
      );

    const decimals =
      await token.decimals();

    /*
     * ราคา Skill เป็น Int
     *
     * เช่น:
     *
     * skill.price = 20
     *
     * ถ้า decimals = 18
     *
     * expectedValue =
     * 20 * 10^18
     */
    const expectedValue =
      parseUnits(
        String(
          skill.price
        ),
        decimals
      );

    /*
     * =====================================================
     * PARSE TRANSFER EVENT
     * =====================================================
     */
    const tokenInterface =
      new Interface(
        SKT_ABI
      );

    let validTransferFound =
      false;

    for (
      const log
      of receipt.logs
    ) {
      /*
       * ต้องเป็น Event
       * จาก SKT Contract เท่านั้น
       */
      if (
        log.address
          .toLowerCase() !==
        SKT_ADDRESS
          .toLowerCase()
      ) {
        continue;
      }

      try {
        const parsed =
          tokenInterface.parseLog({
            topics:
              log.topics,

            data:
              log.data,
          });

        if (
          !parsed ||
          parsed.name !==
            "Transfer"
        ) {
          continue;
        }

        const from =
          String(
            parsed.args.from ??
              parsed.args[0]
          );

        const to =
          String(
            parsed.args.to ??
              parsed.args[1]
          );

        const value =
          parsed.args.value ??
          parsed.args[2];

        /*
         * ตรวจผู้ส่ง
         */
        const fromMatches =
          from.toLowerCase() ===
          studentWallet.toLowerCase();

        /*
         * ตรวจผู้รับ
         */
        const toMatches =
          to.toLowerCase() ===
          skill.payoutAddress
            .toLowerCase();

        /*
         * ตรวจจำนวน
         */
        const amountMatches =
          value ===
          expectedValue;

        if (
          fromMatches &&
          toMatches &&
          amountMatches
        ) {
          validTransferFound =
            true;

          break;
        }
      } catch {
        /*
         * Log นี้ไม่ใช่ Event
         * ใน SKT_ABI
         */
        continue;
      }
    }

    /*
     * =====================================================
     * PAYMENT INVALID
     * =====================================================
     */
    if (
      !validTransferFound
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่พบการโอน SKT ที่ตรงกับผู้เรียน ผู้รับ และราคา Skill ใน Transaction นี้",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * CREATE ENROLLMENT
     * =====================================================
     *
     * ถึงตรงนี้แปลว่า:
     *
     * - Transaction สำเร็จ
     * - Token ถูกต้อง
     * - Sender ถูกต้อง
     * - Recipient ถูกต้อง
     * - Amount ถูกต้อง
     */
    const enrollment =
      await prisma.enrollment.create({
        data: {
          skillId:
            skill.id,

          studentId:
            session.userId,

          status:
            "active",

          paidAmount:
            skill.price,

          paymentTxHash:
            txHash,
        },

        select: {
          id: true,

          status: true,

          paidAmount: true,

          paymentTxHash:
            true,

          createdAt: true,

          skill: {
            select: {
              id: true,

              title: true,

              price: true,

              payoutAddress:
                true,

              owner: {
                select: {
                  id: true,

                  name: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "ชำระ SKT และสมัครเรียนสำเร็จ",

        enrollment,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create Enrollment Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "เกิดข้อผิดพลาดในการสมัครเรียน",
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
   * Session หมดอายุ
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

/*
 * =========================================================
 * TX HASH VALIDATION
 * =========================================================
 */
function isTransactionHash(
  value: string
) {
  return /^0x[a-fA-F0-9]{64}$/.test(
    value
  );
}