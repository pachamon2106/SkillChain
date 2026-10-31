import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/*
 * =========================================================
 * GET /api/lessons?skillId=1
 * =========================================================
 */
export async function GET(
  req: Request
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

    const url =
      new URL(req.url);

    const skillId =
      Number(
        url.searchParams.get(
          "skillId"
        )
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

    const skill =
      await prisma.skill.findUnique({
        where: {
          id: skillId,
        },

        select: {
          id: true,
          title: true,
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
            "ไม่พบ Skill นี้",
        },
        {
          status: 404,
        }
      );
    }

    const isOwner =
      skill.ownerId ===
      session.userId;

    let enrollment:
      | {
          id: number;
          status: string;
        }
      | null =
      null;

    if (!isOwner) {
      enrollment =
        await prisma.enrollment.findUnique({
          where: {
            skillId_studentId:
              {
                skillId,

                studentId:
                  session.userId,
              },
          },

          select: {
            id: true,
            status: true,
          },
        });

      if (!enrollment) {
        return NextResponse.json(
          {
            success: false,
            message:
              "คุณยังไม่ได้สมัครเรียน Skill นี้",
          },
          {
            status: 403,
          }
        );
      }

      if (
        enrollment.status !==
          "active" &&
        enrollment.status !==
          "completed"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Enrollment นี้ไม่มีสิทธิ์เข้าถึงบทเรียน",
          },
          {
            status: 403,
          }
        );
      }
    }

    const lessons =
      await prisma.lesson.findMany({
        where: {
          skillId,
        },

        select: {
          id: true,
          skillId: true,
          title: true,
          content: true,
          videoUrl: true,
          position: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          position:
            "asc",
        },
      });

    return NextResponse.json({
      success: true,

      skill: {
        id:
          skill.id,

        title:
          skill.title,

        owner:
          skill.owner,
      },

      access: {
        role:
          isOwner
            ? "owner"
            : "student",

        enrollmentId:
          enrollment?.id ??
          null,
      },

      lessons,
    });
  } catch (error) {
    console.error(
      "Get Lessons Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถโหลดบทเรียนได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * POST /api/lessons
 * =========================================================
 *
 * เพิ่มบทเรียน
 *
 * ถ้ามีนักเรียนที่เรียนครบแล้ว:
 *
 * completed -> active
 *
 * เพราะมีบทเรียนใหม่เพิ่มเข้ามา
 */
export async function POST(
  req: Request
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
            "กรุณากรอกชื่อบทเรียน",
        },
        {
          status: 400,
        }
      );
    }

    const content =
      typeof body.content ===
      "string"
        ? body.content.trim()
        : "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณากรอกเนื้อหาบทเรียน",
        },
        {
          status: 400,
        }
      );
    }

    const videoResult =
      validateVideoUrl(
        body.videoUrl
      );

    if (
      !videoResult.success
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            videoResult.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * SKILL
     * =====================================================
     */

    const skill =
      await prisma.skill.findUnique({
        where: {
          id: skillId,
        },

        select: {
          id: true,
          ownerId: true,
        },
      });

    if (!skill) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบ Skill นี้",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =====================================================
     * OWNER ONLY
     * =====================================================
     */

    if (
      skill.ownerId !==
      session.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "เฉพาะเจ้าของ Skill เท่านั้นที่สามารถเพิ่มบทเรียนได้",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * =====================================================
     * CREATE LESSON + REOPEN COMPLETED ENROLLMENTS
     * =====================================================
     */

    const result =
      await prisma.$transaction(
        async (
          tx
        ) => {
          /*
           * หาลำดับบทล่าสุด
           */
          const lastLesson =
            await tx.lesson.findFirst({
              where: {
                skillId,
              },

              select: {
                position:
                  true,
              },

              orderBy: {
                position:
                  "desc",
              },
            });

          const nextPosition =
            lastLesson
              ? lastLesson.position +
                1
              : 1;

          /*
           * สร้างบทเรียนใหม่
           */
          const lesson =
            await tx.lesson.create({
              data: {
                skillId,

                title,

                content,

                videoUrl:
                  videoResult.videoUrl,

                position:
                  nextPosition,
              },

              select: {
                id: true,
                skillId: true,
                title: true,
                content: true,
                videoUrl: true,
                position: true,
                createdAt: true,
                updatedAt: true,
              },
            });

          /*
           * =================================================
           * สำคัญ
           * =================================================
           *
           * นักเรียนที่เคยเรียนครบ
           * จะต้องกลับมาเป็น active
           *
           * ตัวอย่าง:
           *
           * เดิม:
           * 3 / 3 = 100%
           * completed
           *
           * เพิ่ม Lesson 4:
           * 3 / 4 = 75%
           * active
           */
          const reopened =
            await tx.enrollment.updateMany({
              where: {
                skillId,

                status:
                  "completed",
              },

              data: {
                status:
                  "active",
              },
            });

          return {
            lesson,

            reopenedCount:
              reopened.count,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          result.reopenedCount >
          0
            ? `เพิ่มบทที่ ${result.lesson.position} สำเร็จ และเปิดการเรียนต่อให้นักเรียน ${result.reopenedCount} คน`
            : `เพิ่มบทที่ ${result.lesson.position} สำเร็จแล้ว`,

        lesson:
          result.lesson,

        reopenedEnrollments:
          result.reopenedCount,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create Lesson Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการเพิ่มบทเรียน",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * PATCH /api/lessons
 *
 * action:
 *
 * - update
 * - move_up
 * - move_down
 * =========================================================
 */
export async function PATCH(
  req: Request
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

    const lessonId =
      Number(
        body.lessonId
      );

    if (
      !Number.isInteger(
        lessonId
      ) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lesson ID ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      typeof body.action ===
      "string"
        ? body.action.trim()
        : "update";

    if (
      action !== "update" &&
      action !== "move_up" &&
      action !== "move_down"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Action ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const lesson =
      await prisma.lesson.findUnique({
        where: {
          id:
            lessonId,
        },

        select: {
          id: true,

          skillId:
            true,

          title: true,

          content: true,

          videoUrl:
            true,

          position:
            true,

          skill: {
            select: {
              ownerId:
                true,
            },
          },
        },
      });

    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบบทเรียนนี้",
        },
        {
          status: 404,
        }
      );
    }

    if (
      lesson.skill.ownerId !==
      session.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "เฉพาะเจ้าของ Skill เท่านั้นที่สามารถแก้ไขบทเรียนได้",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * =====================================================
     * UPDATE
     * =====================================================
     */

    if (
      action ===
      "update"
    ) {
      const title =
        typeof body.title ===
        "string"
          ? body.title.trim()
          : "";

      const content =
        typeof body.content ===
        "string"
          ? body.content.trim()
          : "";

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message:
              "กรุณากรอกชื่อบทเรียน",
          },
          {
            status: 400,
          }
        );
      }

      if (!content) {
        return NextResponse.json(
          {
            success: false,
            message:
              "กรุณากรอกเนื้อหาบทเรียน",
          },
          {
            status: 400,
          }
        );
      }

      const videoResult =
        validateVideoUrl(
          body.videoUrl
        );

      if (
        !videoResult.success
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              videoResult.message,
          },
          {
            status: 400,
          }
        );
      }

      const updatedLesson =
        await prisma.lesson.update({
          where: {
            id:
              lesson.id,
          },

          data: {
            title,

            content,

            videoUrl:
              videoResult.videoUrl,
          },

          select: {
            id: true,
            skillId: true,
            title: true,
            content: true,
            videoUrl: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      return NextResponse.json({
        success: true,

        message:
          `แก้ไขบทที่ ${updatedLesson.position} สำเร็จแล้ว`,

        lesson:
          updatedLesson,
      });
    }

    /*
     * =====================================================
     * MOVE UP / DOWN
     * =====================================================
     */

    const targetPosition =
      action ===
      "move_up"
        ? lesson.position -
          1
        : lesson.position +
          1;

    if (
      targetPosition <=
      0
    ) {
      return NextResponse.json({
        success: true,

        message:
          "บทเรียนนี้อยู่บนสุดแล้ว",

        moved:
          false,
      });
    }

    const targetLesson =
      await prisma.lesson.findFirst({
        where: {
          skillId:
            lesson.skillId,

          position:
            targetPosition,
        },

        select: {
          id: true,
          position: true,
        },
      });

    if (!targetLesson) {
      return NextResponse.json({
        success: true,

        message:
          action ===
          "move_down"
            ? "บทเรียนนี้อยู่ล่างสุดแล้ว"
            : "ไม่มีบทเรียนก่อนหน้า",

        moved:
          false,
      });
    }

    /*
     * ใช้ 0 เป็นตำแหน่งชั่วคราว
     *
     * ป้องกันชน:
     * @@unique([skillId, position])
     */

    await prisma.$transaction(
      async (
        tx
      ) => {
        /*
         * current -> 0
         */
        await tx.lesson.update({
          where: {
            id:
              lesson.id,
          },

          data: {
            position:
              0,
          },
        });

        /*
         * target -> current position
         */
        await tx.lesson.update({
          where: {
            id:
              targetLesson.id,
          },

          data: {
            position:
              lesson.position,
          },
        });

        /*
         * current -> target position
         */
        await tx.lesson.update({
          where: {
            id:
              lesson.id,
          },

          data: {
            position:
              targetLesson.position,
          },
        });
      }
    );

    return NextResponse.json({
      success: true,

      message:
        action ===
        "move_up"
          ? "เลื่อนบทเรียนขึ้นแล้ว"
          : "เลื่อนบทเรียนลงแล้ว",

      moved:
        true,
    });
  } catch (error) {
    console.error(
      "Update Lesson Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการแก้ไขบทเรียน",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * DELETE /api/lessons
 * =========================================================
 *
 * ลบบทเรียน
 *
 * แล้วจัดลำดับใหม่
 */
export async function DELETE(
  req: Request
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

    const lessonId =
      Number(
        body.lessonId
      );

    if (
      !Number.isInteger(
        lessonId
      ) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lesson ID ไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const lesson =
      await prisma.lesson.findUnique({
        where: {
          id:
            lessonId,
        },

        select: {
          id: true,
          title: true,
          skillId: true,
          position: true,

          skill: {
            select: {
              ownerId:
                true,
            },
          },
        },
      });

    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบบทเรียนนี้",
        },
        {
          status: 404,
        }
      );
    }

    if (
      lesson.skill.ownerId !==
      session.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "เฉพาะเจ้าของ Skill เท่านั้นที่สามารถลบบทเรียนได้",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.$transaction(
      async (
        tx
      ) => {
        /*
         * =================================================
         * DELETE
         * =================================================
         *
         * LessonProgress
         * จะ Cascade Delete ตาม Schema
         */

        await tx.lesson.delete({
          where: {
            id:
              lesson.id,
          },
        });

        /*
         * =================================================
         * REORDER
         * =================================================
         */

        const laterLessons =
          await tx.lesson.findMany({
            where: {
              skillId:
                lesson.skillId,

              position: {
                gt:
                  lesson.position,
              },
            },

            select: {
              id: true,
              position: true,
            },

            orderBy: {
              position:
                "asc",
            },
          });

        for (
          const item of
          laterLessons
        ) {
          await tx.lesson.update({
            where: {
              id:
                item.id,
            },

            data: {
              position:
                item.position -
                1,
            },
          });
        }
      }
    );

    /*
     * =====================================================
     * RECALCULATE ENROLLMENT STATUS
     * =====================================================
     *
     * ตัวอย่าง:
     *
     * นักเรียน:
     * บท 1 ✅
     * บท 2 ✅
     * บท 3 ❌
     *
     * ถ้าผู้สอนลบบท 3
     *
     * เหลือ:
     * 2 / 2
     *
     * ระบบควรกลับเป็น completed
     */

    await syncEnrollmentStatuses(
      lesson.skillId
    );

    return NextResponse.json({
      success: true,

      message:
        `ลบ "${lesson.title}" สำเร็จแล้ว`,
    });
  } catch (error) {
    console.error(
      "Delete Lesson Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการลบบทเรียน",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * SYNC ENROLLMENT STATUS
 * =========================================================
 *
 * ใช้หลังลบบทเรียน
 *
 * เพื่อให้ Enrollment status
 * ตรงกับจำนวน Lesson จริง
 */
async function syncEnrollmentStatuses(
  skillId: number
) {
  /*
   * =======================================================
   * TOTAL LESSONS
   * =======================================================
   */

  const totalLessons =
    await prisma.lesson.count({
      where: {
        skillId,
      },
    });

  /*
   * ถ้าไม่มี Lesson เหลือ
   *
   * ไม่ถือว่าเรียนครบ
   * ให้ active ไว้ก่อน
   */
  if (
    totalLessons ===
    0
  ) {
    await prisma.enrollment.updateMany({
      where: {
        skillId,

        status: {
          in: [
            "active",
            "completed",
          ],
        },
      },

      data: {
        status:
          "active",
      },
    });

    return;
  }

  /*
   * =======================================================
   * ENROLLMENTS
   * =======================================================
   */

  const enrollments =
    await prisma.enrollment.findMany({
      where: {
        skillId,

        status: {
          in: [
            "active",
            "completed",
          ],
        },
      },

      select: {
        id: true,
        status: true,
      },
    });

  /*
   * =======================================================
   * CHECK EACH STUDENT
   * =======================================================
   */

  for (
    const enrollment of
    enrollments
  ) {
    const completedLessons =
      await prisma.lessonProgress.count({
        where: {
          enrollmentId:
            enrollment.id,

          status:
            "completed",

          lesson: {
            skillId,
          },
        },
      });

    const shouldBeCompleted =
      completedLessons ===
      totalLessons;

    const nextStatus =
      shouldBeCompleted
        ? "completed"
        : "active";

    if (
      enrollment.status !==
      nextStatus
    ) {
      await prisma.enrollment.update({
        where: {
          id:
            enrollment.id,
        },

        data: {
          status:
            nextStatus,
        },
      });
    }
  }
}

/*
 * =========================================================
 * VIDEO URL
 * =========================================================
 */
function validateVideoUrl(
  value: unknown
):
  | {
      success: true;

      videoUrl:
        | string
        | null;
    }
  | {
      success: false;

      message: string;
    } {
  const rawVideoUrl =
    typeof value ===
    "string"
      ? value.trim()
      : "";

  /*
   * ไม่มีวิดีโอ
   */
  if (!rawVideoUrl) {
    return {
      success: true,

      videoUrl:
        null,
    };
  }

  try {
    const parsedUrl =
      new URL(
        rawVideoUrl
      );

    if (
      parsedUrl.protocol !==
        "http:" &&
      parsedUrl.protocol !==
        "https:"
    ) {
      return {
        success: false,

        message:
          "Video URL ต้องเป็น http หรือ https",
      };
    }

    return {
      success: true,

      videoUrl:
        parsedUrl.toString(),
    };
  } catch {
    return {
      success: false,

      message:
        "Video URL ไม่ถูกต้อง",
    };
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