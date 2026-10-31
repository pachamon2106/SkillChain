import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  prisma,
} from "@/lib/prisma";

/*
 * =========================================================
 * GET /api/messages
 * =========================================================
 *
 * รองรับ 3 แบบ
 *
 * 1. GET /api/messages
 *    -> รายการห้องสนทนา
 *
 * 2. GET /api/messages?conversationId=1
 *    -> โหลดข้อความในห้อง
 *
 * 3. GET /api/messages?mode=users&q=test
 *    -> ค้นหาผู้ใช้เพื่อเริ่มแชต
 */
export async function GET(
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

    const userId =
      session.userId;

    const searchParams =
      request.nextUrl.searchParams;

    const mode =
      searchParams.get(
        "mode"
      );

    const conversationIdRaw =
      searchParams.get(
        "conversationId"
      );

    /*
     * =====================================================
     * SEARCH USERS
     * =====================================================
     */
    if (
      mode ===
      "users"
    ) {
      const q =
        (
          searchParams.get(
            "q"
          ) ??
          ""
        ).trim();

      const users =
        await prisma.user.findMany({
          where: {
            id: {
              not:
                userId,
            },

            ...(q
              ? {
                  OR: [
                    {
                      name: {
                        contains:
                          q,
                      },
                    },
                    {
                      email: {
                        contains:
                          q,
                      },
                    },
                  ],
                }
              : {}),
          },

          select: {
            id: true,
            name: true,
            email: true,
          },

          orderBy: [
            {
              name:
                "asc",
            },
            {
              id:
                "asc",
            },
          ],

          take:
            20,
        });

      /*
       * หาห้องเดิม
       * ถ้าเคยคุยกันแล้ว
       */
      const conversations =
        await prisma.conversation.findMany({
          where: {
            OR: [
              {
                user1Id:
                  userId,
              },
              {
                user2Id:
                  userId,
              },
            ],
          },

          select: {
            id: true,
            user1Id: true,
            user2Id: true,
          },
        });

      const conversationByUserId =
        new Map<
          number,
          number
        >();

      for (
        const conversation
        of conversations
      ) {
        const otherUserId =
          conversation.user1Id ===
          userId
            ? conversation.user2Id
            : conversation.user1Id;

        conversationByUserId.set(
          otherUserId,
          conversation.id
        );
      }

      return NextResponse.json({
        success: true,

        users:
          users.map(
            (
              user
            ) => ({
              ...user,

              conversationId:
                conversationByUserId.get(
                  user.id
                ) ??
                null,
            })
          ),
      });
    }

    /*
     * =====================================================
     * LOAD ONE CONVERSATION
     * =====================================================
     */
    if (
      conversationIdRaw
    ) {
      const conversationId =
        Number(
          conversationIdRaw
        );

      if (
        !Number.isInteger(
          conversationId
        ) ||
        conversationId <=
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "conversationId ไม่ถูกต้อง",
          },
          {
            status: 400,
          }
        );
      }

      const conversation =
        await prisma.conversation.findFirst({
          where: {
            id:
              conversationId,

            OR: [
              {
                user1Id:
                  userId,
              },
              {
                user2Id:
                  userId,
              },
            ],
          },

          select: {
            id: true,
            user1Id: true,
            user2Id: true,
            createdAt: true,
            updatedAt: true,

            user1: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            user2: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      if (
        !conversation
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่พบห้องสนทนา",
          },
          {
            status: 404,
          }
        );
      }

      /*
       * โหลด 100 ข้อความล่าสุด
       */
      const messagesDesc =
        await prisma.message.findMany({
          where: {
            conversationId:
              conversation.id,
          },

          select: {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            readAt: true,
            createdAt: true,

            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: [
            {
              createdAt:
                "desc",
            },
            {
              id:
                "desc",
            },
          ],

          take:
            100,
        });

      /*
       * กลับลำดับ
       * เก่า -> ใหม่
       */
      const messages =
        messagesDesc.reverse();

      const otherUser =
        conversation.user1Id ===
        userId
          ? conversation.user2
          : conversation.user1;

      const unreadCount =
        await prisma.message.count({
          where: {
            conversationId:
              conversation.id,

            senderId: {
              not:
                userId,
            },

            readAt:
              null,
          },
        });

      return NextResponse.json({
        success: true,

        conversation: {
          id:
            conversation.id,

          otherUser,

          unreadCount,

          createdAt:
            conversation.createdAt,

          updatedAt:
            conversation.updatedAt,
        },

        messages,
      });
    }

    /*
     * =====================================================
     * CONVERSATION LIST
     * =====================================================
     */

    const conversations =
      await prisma.conversation.findMany({
        where: {
          OR: [
            {
              user1Id:
                userId,
            },
            {
              user2Id:
                userId,
            },
          ],
        },

        select: {
          id: true,

          user1Id:
            true,

          user2Id:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          user1: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          user2: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          messages: {
            select: {
              id: true,
              senderId: true,
              content: true,
              readAt: true,
              createdAt: true,
            },

            orderBy: [
              {
                createdAt:
                  "desc",
              },
              {
                id:
                  "desc",
              },
            ],

            take:
              1,
          },
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      });

    /*
     * ดึง Unread จริง
     */
    const unreadMessages =
      await prisma.message.findMany({
        where: {
          senderId: {
            not:
              userId,
          },

          readAt:
            null,

          conversation: {
            OR: [
              {
                user1Id:
                  userId,
              },
              {
                user2Id:
                  userId,
              },
            ],
          },
        },

        select: {
          conversationId:
            true,
        },
      });

    const unreadByConversation =
      new Map<
        number,
        number
      >();

    for (
      const message
      of unreadMessages
    ) {
      unreadByConversation.set(
        message.conversationId,
        (
          unreadByConversation.get(
            message.conversationId
          ) ??
          0
        ) +
          1
      );
    }

    const totalUnread =
      unreadMessages.length;

    const items =
      conversations.map(
        (
          conversation
        ) => {
          const otherUser =
            conversation.user1Id ===
            userId
              ? conversation.user2
              : conversation.user1;

          const lastMessage =
            conversation.messages[
              0
            ] ??
            null;

          return {
            id:
              conversation.id,

            otherUser,

            lastMessage,

            unreadCount:
              unreadByConversation.get(
                conversation.id
              ) ??
              0,

            createdAt:
              conversation.createdAt,

            updatedAt:
              conversation.updatedAt,
          };
        }
      );

    return NextResponse.json({
      success: true,

      conversations:
        items,

      totalUnread,
    });
  } catch (error) {
    console.error(
      "GET messages error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถโหลดข้อความได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * POST /api/messages
 * =========================================================
 *
 * action = open
 *
 * เปิดหรือสร้างห้องสนทนา
 *
 * {
 *   action: "open",
 *   userId: 2
 * }
 *
 * ---------------------------------------------------------
 *
 * action = send
 *
 * ส่งข้อความ
 *
 * แบบมีห้องอยู่แล้ว:
 *
 * {
 *   action: "send",
 *   conversationId: 1,
 *   content: "สวัสดี"
 * }
 *
 * หรือส่งหาผู้ใช้โดยตรง:
 *
 * {
 *   action: "send",
 *   userId: 2,
 *   content: "สวัสดี"
 * }
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

    const currentUserId =
      session.userId;

    const body =
      await request
        .json()
        .catch(
          () => null
        );

    if (
      !body ||
      typeof body !==
        "object"
    ) {
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

    const action =
      typeof body.action ===
      "string"
        ? body.action
        : "";

    /*
     * =====================================================
     * OPEN CONVERSATION
     * =====================================================
     */
    if (
      action ===
      "open"
    ) {
      const otherUserId =
        Number(
          body.userId
        );

      if (
        !Number.isInteger(
          otherUserId
        ) ||
        otherUserId <=
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ผู้ใช้ไม่ถูกต้อง",
          },
          {
            status: 400,
          }
        );
      }

      if (
        otherUserId ===
        currentUserId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถสร้างห้องสนทนากับตัวเองได้",
          },
          {
            status: 400,
          }
        );
      }

      const otherUser =
        await prisma.user.findUnique({
          where: {
            id:
              otherUserId,
          },

          select: {
            id: true,
            name: true,
            email: true,
          },
        });

      if (
        !otherUser
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่พบผู้ใช้งาน",
          },
          {
            status: 404,
          }
        );
      }

      const {
        user1Id,
        user2Id,
      } =
        normalizeUserPair(
          currentUserId,
          otherUserId
        );

      const conversation =
        await prisma.conversation.upsert({
          where: {
            user1Id_user2Id: {
              user1Id,
              user2Id,
            },
          },

          update: {},

          create: {
            user1Id,
            user2Id,
          },

          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      return NextResponse.json({
        success: true,

        conversation: {
          ...conversation,

          otherUser,
        },
      });
    }

    /*
     * =====================================================
     * SEND MESSAGE
     * =====================================================
     */
    if (
      action ===
      "send"
    ) {
      const content =
        typeof body.content ===
        "string"
          ? body.content.trim()
          : "";

      if (
        !content
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "กรุณาพิมพ์ข้อความ",
          },
          {
            status: 400,
          }
        );
      }

      if (
        content.length >
        5000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ข้อความยาวเกิน 5,000 ตัวอักษร",
          },
          {
            status: 400,
          }
        );
      }

      let conversationId:
        number;

      /*
       * ---------------------------------------------------
       * SEND ด้วย conversationId
       * ---------------------------------------------------
       */
      if (
        body.conversationId !==
          undefined &&
        body.conversationId !==
          null
      ) {
        const parsedConversationId =
          Number(
            body.conversationId
          );

        if (
          !Number.isInteger(
            parsedConversationId
          ) ||
          parsedConversationId <=
            0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "conversationId ไม่ถูกต้อง",
            },
            {
              status: 400,
            }
          );
        }

        const conversation =
          await prisma.conversation.findFirst({
            where: {
              id:
                parsedConversationId,

              OR: [
                {
                  user1Id:
                    currentUserId,
                },
                {
                  user2Id:
                    currentUserId,
                },
              ],
            },

            select: {
              id: true,
            },
          });

        if (
          !conversation
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "ไม่พบห้องสนทนา",
            },
            {
              status: 404,
            }
          );
        }

        conversationId =
          conversation.id;
      } else {
        /*
         * -------------------------------------------------
         * SEND ด้วย userId
         * -------------------------------------------------
         */

        const otherUserId =
          Number(
            body.userId
          );

        if (
          !Number.isInteger(
            otherUserId
          ) ||
          otherUserId <=
            0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "ผู้รับไม่ถูกต้อง",
            },
            {
              status: 400,
            }
          );
        }

        if (
          otherUserId ===
          currentUserId
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "ไม่สามารถส่งข้อความหาตัวเองได้",
            },
            {
              status: 400,
            }
          );
        }

        const receiver =
          await prisma.user.findUnique({
            where: {
              id:
                otherUserId,
            },

            select: {
              id: true,
            },
          });

        if (
          !receiver
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "ไม่พบผู้รับข้อความ",
            },
            {
              status: 404,
            }
          );
        }

        const {
          user1Id,
          user2Id,
        } =
          normalizeUserPair(
            currentUserId,
            otherUserId
          );

        const conversation =
          await prisma.conversation.upsert({
            where: {
              user1Id_user2Id: {
                user1Id,
                user2Id,
              },
            },

            update: {},

            create: {
              user1Id,
              user2Id,
            },

            select: {
              id: true,
            },
          });

        conversationId =
          conversation.id;
      }

      /*
       * ===================================================
       * CREATE MESSAGE
       * ===================================================
       *
       * สร้าง Message
       * +
       * อัปเดต updatedAt ของ Conversation
       */
      const [
        message,
      ] =
        await prisma.$transaction([
          prisma.message.create({
            data: {
              conversationId,

              senderId:
                currentUserId,

              content,
            },

            select: {
              id: true,
              conversationId: true,
              senderId: true,
              content: true,
              readAt: true,
              createdAt: true,

              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),

          prisma.conversation.update({
            where: {
              id:
                conversationId,
            },

            data: {
              updatedAt:
                new Date(),
            },
          }),
        ]);

      return NextResponse.json({
        success: true,

        conversationId,

        message,
      });
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "action ไม่ถูกต้อง",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "POST messages error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถดำเนินการกับข้อความได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * PATCH /api/messages
 * =========================================================
 *
 * Mark Messages as Read
 *
 * {
 *   conversationId: 1
 * }
 */
export async function PATCH(
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

    const userId =
      session.userId;

    const body =
      await request
        .json()
        .catch(
          () => null
        );

    const conversationId =
      Number(
        body?.conversationId
      );

    if (
      !Number.isInteger(
        conversationId
      ) ||
      conversationId <=
        0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "conversationId ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ตรวจสิทธิ์ก่อน
     */
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id:
            conversationId,

          OR: [
            {
              user1Id:
                userId,
            },
            {
              user2Id:
                userId,
            },
          ],
        },

        select: {
          id: true,
        },
      });

    if (
      !conversation
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่พบห้องสนทนา",
        },
        {
          status: 404,
        }
      );
    }

    const now =
      new Date();

    /*
     * อ่านเฉพาะข้อความ
     * ที่คนอื่นส่งมา
     *
     * ห้าม Mark ข้อความของตัวเอง
     */
    const result =
      await prisma.message.updateMany({
        where: {
          conversationId,

          senderId: {
            not:
              userId,
          },

          readAt:
            null,
        },

        data: {
          readAt:
            now,
        },
      });

    /*
     * นับ Unread ทั้งระบบใหม่
     */
    const totalUnread =
      await prisma.message.count({
        where: {
          senderId: {
            not:
              userId,
          },

          readAt:
            null,

          conversation: {
            OR: [
              {
                user1Id:
                  userId,
              },
              {
                user2Id:
                  userId,
              },
            ],
          },
        },
      });

    return NextResponse.json({
      success: true,

      markedAsRead:
        result.count,

      totalUnread,
    });
  } catch (error) {
    console.error(
      "PATCH messages error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถอัปเดตสถานะข้อความได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * NORMALIZE USER PAIR
 * =========================================================
 *
 * User ID น้อยกว่า
 * จะอยู่ user1Id เสมอ
 *
 * ทำให้ User คู่เดิม
 * มี Conversation เดียว
 */
function normalizeUserPair(
  firstUserId: number,
  secondUserId: number
) {
  if (
    firstUserId <
    secondUserId
  ) {
    return {
      user1Id:
        firstUserId,

      user2Id:
        secondUserId,
    };
  }

  return {
    user1Id:
      secondUserId,

    user2Id:
      firstUserId,
  };
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