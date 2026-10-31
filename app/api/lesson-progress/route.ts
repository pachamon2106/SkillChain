import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/*
 * =========================================================
 * GET /api/lesson-progress?skillId=1
 * =========================================================
 *
 * โหลด:
 *
 * - ข้อมูลคอร์ส
 * - Enrollment
 * - Lessons
 * - LessonProgress
 * - Progress รวมของคอร์ส
 */
export async function GET(
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
     * SKILL ID
     * =====================================================
     */

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

    /*
     * =====================================================
     * ENROLLMENT
     * =====================================================
     */

    const enrollment =
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

          createdAt: true,

          skill: {
            select: {
              id: true,

              title: true,

              description:
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

    /*
     * =====================================================
     * LESSONS
     * =====================================================
     */

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

    /*
     * =====================================================
     * LESSON PROGRESS
     * =====================================================
     */

    const progresses =
      await prisma.lessonProgress.findMany({
        where: {
          enrollmentId:
            enrollment.id,

          lesson: {
            skillId,
          },
        },

        select: {
          id: true,

          lessonId: true,

          status: true,

          lastViewedAt:
            true,

          completedAt:
            true,
        },
      });

    /*
     * =====================================================
     * MAP PROGRESS
     * =====================================================
     */

    const progressMap =
      new Map(
        progresses.map(
          (
            progress
          ) => [
            progress.lessonId,
            progress,
          ]
        )
      );

    const lessonsWithProgress =
      lessons.map(
        (
          lesson
        ) => {
          const progress =
            progressMap.get(
              lesson.id
            );

          return {
            ...lesson,

            progress:
              progress
                ? {
                    id:
                      progress.id,

                    status:
                      progress.status,

                    lastViewedAt:
                      progress.lastViewedAt,

                    completedAt:
                      progress.completedAt,
                  }
                : {
                    id:
                      null,

                    status:
                      "not_started",

                    lastViewedAt:
                      null,

                    completedAt:
                      null,
                  },
          };
        }
      );

    /*
     * =====================================================
     * COURSE PROGRESS
     * =====================================================
     */

    const courseProgress =
      await calculateCourseProgress(
        enrollment.id,
        skillId
      );

    /*
     * =====================================================
     * SYNC ENROLLMENT STATUS
     * =====================================================
     *
     * ป้องกันสถานะค้าง
     *
     * เช่น:
     *
     * เคย 100%
     * แต่มีบทใหม่เพิ่ม
     *
     * completed -> active
     */

    const expectedStatus =
      courseProgress.totalLessons >
        0 &&
      courseProgress.completedLessons ===
        courseProgress.totalLessons
        ? "completed"
        : "active";

    if (
      enrollment.status !==
      expectedStatus
    ) {
      await prisma.enrollment.update({
        where: {
          id:
            enrollment.id,
        },

        data: {
          status:
            expectedStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,

      skill:
        enrollment.skill,

      enrollment: {
        id:
          enrollment.id,

        status:
          expectedStatus,

        createdAt:
          enrollment.createdAt,
      },

      courseProgress,

      lessons:
        lessonsWithProgress,
    });
  } catch (error) {
    console.error(
      "Get Lesson Progress Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถโหลดความคืบหน้าการเรียนได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * POST /api/lesson-progress
 * =========================================================
 *
 * BODY:
 *
 * {
 *   lessonId: 1,
 *   action: "start"
 * }
 *
 * หรือ
 *
 * {
 *   lessonId: 1,
 *   action: "complete"
 * }
 *
 * =========================================================
 *
 * สำคัญ:
 *
 * Backend จะตรวจบทก่อนหน้าด้วย
 *
 * ต่อให้ยิง API ตรง
 * ก็ไม่สามารถข้ามบทได้
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
     * LESSON ID
     * =====================================================
     */

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

    /*
     * =====================================================
     * ACTION
     * =====================================================
     */

    const action =
      typeof body.action ===
      "string"
        ? body.action.trim()
        : "";

    if (
      action !== "start" &&
      action !== "complete"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Action ต้องเป็น start หรือ complete",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * LESSON
     * =====================================================
     */

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

          position:
            true,
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

    /*
     * =====================================================
     * ENROLLMENT
     * =====================================================
     */

    const enrollment =
      await prisma.enrollment.findUnique({
        where: {
          skillId_studentId:
            {
              skillId:
                lesson.skillId,

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
            "Enrollment นี้ไม่มีสิทธิ์เรียน",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * =====================================================
     * SERVER-SIDE LESSON LOCK
     * =====================================================
     *
     * หาบททั้งหมดที่อยู่ก่อนหน้าบทปัจจุบัน
     *
     * ตัวอย่าง:
     *
     * Lesson 1 ✅
     * Lesson 2 ❌
     * Lesson 3 🔒
     *
     * ถ้ายิง API มาที่ Lesson 3
     *
     * Server จะเห็นว่า Lesson 2
     * ยังไม่ completed
     *
     * => 403
     */

    const previousLessons =
      await prisma.lesson.findMany({
        where: {
          skillId:
            lesson.skillId,

          position: {
            lt:
              lesson.position,
          },
        },

        select: {
          id: true,

          title: true,

          position:
            true,
        },

        orderBy: {
          position:
            "asc",
        },
      });

    /*
     * =====================================================
     * CHECK PREVIOUS PROGRESS
     * =====================================================
     */

    if (
      previousLessons.length >
      0
    ) {
      const previousLessonIds =
        previousLessons.map(
          (
            item
          ) =>
            item.id
        );

      const completedPrevious =
        await prisma.lessonProgress.findMany({
          where: {
            enrollmentId:
              enrollment.id,

            lessonId: {
              in:
                previousLessonIds,
            },

            status:
              "completed",
          },

          select: {
            lessonId:
              true,
          },
        });

      const completedIds =
        new Set(
          completedPrevious.map(
            (
              progress
            ) =>
              progress.lessonId
          )
        );

      /*
       * หาบทแรกที่ยังไม่จบ
       */
      const requiredLesson =
        previousLessons.find(
          (
            item
          ) =>
            !completedIds.has(
              item.id
            )
        );

      if (requiredLesson) {
        return NextResponse.json(
          {
            success: false,

            locked:
              true,

            message:
              `กรุณาเรียนบทที่ ${requiredLesson.position} "${requiredLesson.title}" ให้จบก่อน`,

            requiredLesson: {
              id:
                requiredLesson.id,

              title:
                requiredLesson.title,

              position:
                requiredLesson.position,
            },
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
     * =====================================================
     * EXISTING PROGRESS
     * =====================================================
     */

    const existingProgress =
      await prisma.lessonProgress.findUnique({
        where: {
          lessonId_enrollmentId:
            {
              lessonId:
                lesson.id,

              enrollmentId:
                enrollment.id,
            },
        },

        select: {
          id: true,

          status: true,

          completedAt:
            true,
        },
      });

    const now =
      new Date();

    /*
     * =====================================================
     * START
     * =====================================================
     */

    let progress;

    if (
      action ===
      "start"
    ) {
      /*
       * ถ้าเรียนจบแล้ว
       *
       * การเปิดดูซ้ำ
       * ห้ามเปลี่ยน completed
       * กลับเป็น in_progress
       */
      if (
        existingProgress?.status ===
        "completed"
      ) {
        progress =
          await prisma.lessonProgress.update({
            where: {
              lessonId_enrollmentId:
                {
                  lessonId:
                    lesson.id,

                  enrollmentId:
                    enrollment.id,
                },
            },

            data: {
              lastViewedAt:
                now,
            },

            select: {
              id: true,

              lessonId: true,

              enrollmentId:
                true,

              status: true,

              lastViewedAt:
                true,

              completedAt:
                true,

              createdAt:
                true,

              updatedAt:
                true,
            },
          });
      } else {
        progress =
          await prisma.lessonProgress.upsert({
            where: {
              lessonId_enrollmentId:
                {
                  lessonId:
                    lesson.id,

                  enrollmentId:
                    enrollment.id,
                },
            },

            update: {
              status:
                "in_progress",

              lastViewedAt:
                now,

              completedAt:
                null,
            },

            create: {
              lessonId:
                lesson.id,

              enrollmentId:
                enrollment.id,

              status:
                "in_progress",

              lastViewedAt:
                now,

              completedAt:
                null,
            },

            select: {
              id: true,

              lessonId: true,

              enrollmentId:
                true,

              status: true,

              lastViewedAt:
                true,

              completedAt:
                true,

              createdAt:
                true,

              updatedAt:
                true,
            },
          });
      }
    }

    /*
     * =====================================================
     * COMPLETE
     * =====================================================
     */

    else {
      progress =
        await prisma.lessonProgress.upsert({
          where: {
            lessonId_enrollmentId:
              {
                lessonId:
                  lesson.id,

                enrollmentId:
                  enrollment.id,
              },
          },

          update: {
            status:
              "completed",

            lastViewedAt:
              now,

            /*
             * ถ้าเคย completed แล้ว
             * ใช้ completedAt เดิม
             */
            completedAt:
              existingProgress?.completedAt ??
              now,
          },

          create: {
            lessonId:
              lesson.id,

            enrollmentId:
              enrollment.id,

            status:
              "completed",

            lastViewedAt:
              now,

            completedAt:
              now,
          },

          select: {
            id: true,

            lessonId: true,

            enrollmentId:
              true,

            status: true,

            lastViewedAt:
              true,

            completedAt:
              true,

            createdAt:
              true,

            updatedAt:
              true,
          },
        });
    }

    /*
     * =====================================================
     * COURSE PROGRESS
     * =====================================================
     */

    const courseProgress =
      await calculateCourseProgress(
        enrollment.id,
        lesson.skillId
      );

    /*
     * =====================================================
     * ENROLLMENT STATUS
     * =====================================================
     *
     * เรียนครบทั้งหมด:
     *
     * active -> completed
     *
     * ถ้ายังไม่ครบ:
     *
     * completed -> active
     *
     * เพื่อป้องกันสถานะค้าง
     */

    const enrollmentStatus =
      courseProgress.totalLessons >
        0 &&
      courseProgress.completedLessons ===
        courseProgress.totalLessons
        ? "completed"
        : "active";

    if (
      enrollment.status !==
      enrollmentStatus
    ) {
      await prisma.enrollment.update({
        where: {
          id:
            enrollment.id,
        },

        data: {
          status:
            enrollmentStatus,
        },
      });
    }

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return NextResponse.json({
      success: true,

      message:
        action ===
        "complete"
          ? courseProgress.percent ===
            100
            ? "เรียนครบทุกบทแล้ว"
            : `เรียนจบบทที่ ${lesson.position} แล้ว`
          : `เริ่มเรียนบทที่ ${lesson.position} แล้ว`,

      lesson: {
        id:
          lesson.id,

        title:
          lesson.title,

        position:
          lesson.position,
      },

      progress,

      courseProgress,

      enrollmentStatus,
    });
  } catch (error) {
    console.error(
      "Update Lesson Progress Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "เกิดข้อผิดพลาดในการบันทึกความคืบหน้า",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * CALCULATE COURSE PROGRESS
 * =========================================================
 */
async function calculateCourseProgress(
  enrollmentId: number,
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
   * =======================================================
   * COMPLETED LESSONS
   * =======================================================
   */

  const completedLessons =
    await prisma.lessonProgress.count({
      where: {
        enrollmentId,

        status:
          "completed",

        lesson: {
          skillId,
        },
      },
    });

  /*
   * =======================================================
   * PERCENT
   * =======================================================
   */

  const percent =
    totalLessons === 0
      ? 0
      : Math.round(
          (
            completedLessons /
            totalLessons
          ) *
            100
        );

  return {
    totalLessons,

    completedLessons,

    percent,
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