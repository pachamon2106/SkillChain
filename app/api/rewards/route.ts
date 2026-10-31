import {
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
 * TYPES
 * =========================================================
 */

type Mission = {
  id: string;
  title: string;
  description: string;
  type:
    | "learning"
    | "teaching"
    | "blockchain";

  progress: number;
  target: number;

  points: number;

  completed: boolean;

  progressPercent: number;
};

type Badge = {
  id: string;
  title: string;
  description: string;

  unlocked: boolean;

  requirement: string;
};

/*
 * =========================================================
 * GET /api/rewards
 * =========================================================
 *
 * ใช้ข้อมูลจริงจาก Database:
 *
 * - Enrollment
 * - Enrollment.status
 * - Enrollment.paidAmount
 * - LessonProgress
 * - Skill
 * - Lesson
 *
 * ไม่มี Fake Progress
 * ไม่มีการสุ่มแต้ม
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

          createdAt:
            true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ไม่พบข้อมูลผู้ใช้งาน",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =====================================================
     * REAL USER STATS
     * =====================================================
     */

    const [
      enrollmentCount,
      completedCourseCount,
      paidEnrollmentCount,
      completedLessonCount,
      createdSkillCount,
      createdLessonCount,
    ] =
      await Promise.all([
        /*
         * สมัครเรียนทั้งหมด
         */
        prisma.enrollment.count({
          where: {
            studentId:
              user.id,
          },
        }),

        /*
         * เรียนจบ Course
         *
         * Enrollment.status
         * ถูก Sync จาก Lesson Progress
         */
        prisma.enrollment.count({
          where: {
            studentId:
              user.id,

            status:
              "completed",
          },
        }),

        /*
         * เคยสมัคร Course
         * ที่ชำระ SKT จริง
         */
        prisma.enrollment.count({
          where: {
            studentId:
              user.id,

            paidAmount: {
              gt: 0,
            },
          },
        }),

        /*
         * จำนวนบทเรียนที่เรียนจบ
         */
        prisma.lessonProgress.count({
          where: {
            status:
              "completed",

            enrollment: {
              studentId:
                user.id,
            },
          },
        }),

        /*
         * Skill ที่ผู้ใช้สร้าง
         */
        prisma.skill.count({
          where: {
            ownerId:
              user.id,
          },
        }),

        /*
         * Lesson ที่ผู้ใช้สร้าง
         *
         * นับผ่าน Skill
         * ที่เป็นเจ้าของ
         */
        prisma.lesson.count({
          where: {
            skill: {
              ownerId:
                user.id,
            },
          },
        }),
      ]);

    /*
     * =====================================================
     * MISSIONS
     * =====================================================
     */

    const missions: Mission[] = [
      /*
       * ===================================================
       * LEARNING
       * ===================================================
       */

      createMission({
        id:
          "first-enrollment",

        title:
          "ก้าวแรกของการเรียนรู้",

        description:
          "สมัครเรียน Skill แรกของคุณ",

        type:
          "learning",

        progress:
          enrollmentCount,

        target:
          1,

        points:
          100,
      }),

      createMission({
        id:
          "first-lesson",

        title:
          "บทเรียนแรกสำเร็จ",

        description:
          "เรียนจบบทเรียนแรกใน SkillChain",

        type:
          "learning",

        progress:
          completedLessonCount,

        target:
          1,

        points:
          100,
      }),

      createMission({
        id:
          "five-lessons",

        title:
          "นักเรียนขยัน",

        description:
          "เรียนจบบทเรียนทั้งหมด 5 บท",

        type:
          "learning",

        progress:
          completedLessonCount,

        target:
          5,

        points:
          250,
      }),

      createMission({
        id:
          "first-course-complete",

        title:
          "พิชิต Skill แรก",

        description:
          "เรียน Skill ให้จบครบทุกบทครั้งแรก",

        type:
          "learning",

        progress:
          completedCourseCount,

        target:
          1,

        points:
          500,
      }),

      /*
       * ===================================================
       * TEACHING
       * ===================================================
       */

      createMission({
        id:
          "first-skill-created",

        title:
          "เริ่มต้นเป็นผู้สอน",

        description:
          "สร้าง Skill แรกของคุณ",

        type:
          "teaching",

        progress:
          createdSkillCount,

        target:
          1,

        points:
          200,
      }),

      createMission({
        id:
          "three-lessons-created",

        title:
          "สร้างเนื้อหาให้ผู้เรียน",

        description:
          "สร้างบทเรียนรวมทั้งหมด 3 บท",

        type:
          "teaching",

        progress:
          createdLessonCount,

        target:
          3,

        points:
          300,
      }),

      /*
       * ===================================================
       * BLOCKCHAIN
       * ===================================================
       */

      createMission({
        id:
          "first-paid-enrollment",

        title:
          "SKT Explorer",

        description:
          "สมัครเรียน Skill แบบชำระด้วย SKT ครั้งแรก",

        type:
          "blockchain",

        progress:
          paidEnrollmentCount,

        target:
          1,

        points:
          150,
      }),
    ];

    /*
     * =====================================================
     * POINTS
     * =====================================================
     *
     * ตอนนี้ Point เป็น Reward Score
     * ที่คำนวณจาก Mission ที่สำเร็จจริง
     *
     * ยังไม่ได้ Mint Token
     * และไม่เกี่ยวกับยอด SKT
     */

    const earnedPoints =
      missions.reduce(
        (
          total,
          mission
        ) => {
          if (
            mission.completed
          ) {
            return (
              total +
              mission.points
            );
          }

          return total;
        },
        0
      );

    const totalAvailablePoints =
      missions.reduce(
        (
          total,
          mission
        ) =>
          total +
          mission.points,
        0
      );

    const completedMissionCount =
      missions.filter(
        (
          mission
        ) =>
          mission.completed
      ).length;

    /*
     * =====================================================
     * BADGES
     * =====================================================
     *
     * Badge ใช้ข้อมูลจริงเหมือน Mission
     */

    const badges: Badge[] = [
      {
        id:
          "learner",

        title:
          "Learner",

        description:
          "เริ่มต้นเส้นทางการเรียนรู้บน SkillChain",

        unlocked:
          enrollmentCount >=
          1,

        requirement:
          "สมัครเรียนอย่างน้อย 1 Skill",
      },

      {
        id:
          "lesson-finisher",

        title:
          "Lesson Finisher",

        description:
          "เรียนจบบทเรียนแรกสำเร็จ",

        unlocked:
          completedLessonCount >=
          1,

        requirement:
          "เรียนจบบทเรียนอย่างน้อย 1 บท",
      },

      {
        id:
          "course-finisher",

        title:
          "Course Finisher",

        description:
          "พิชิต Skill จนครบทุกบท",

        unlocked:
          completedCourseCount >=
          1,

        requirement:
          "เรียนจบอย่างน้อย 1 Skill",
      },

      {
        id:
          "creator",

        title:
          "Skill Creator",

        description:
          "แบ่งปันความรู้ให้กับชุมชน SkillChain",

        unlocked:
          createdSkillCount >=
          1,

        requirement:
          "สร้าง Skill อย่างน้อย 1 Skill",
      },

      {
        id:
          "teacher",

        title:
          "Knowledge Builder",

        description:
          "สร้างเนื้อหาการเรียนรู้ให้ผู้เรียน",

        unlocked:
          createdLessonCount >=
          3,

        requirement:
          "สร้างบทเรียนรวมอย่างน้อย 3 บท",
      },

      {
        id:
          "skt-explorer",

        title:
          "SKT Explorer",

        description:
          "ใช้งาน SKT เพื่อเข้าถึงการเรียนรู้บน Blockchain",

        unlocked:
          paidEnrollmentCount >=
          1,

        requirement:
          "สมัครเรียนแบบชำระ SKT อย่างน้อย 1 ครั้ง",
      },
    ];

    const unlockedBadgeCount =
      badges.filter(
        (
          badge
        ) =>
          badge.unlocked
      ).length;

    /*
     * =====================================================
     * LEVEL
     * =====================================================
     */

    const level =
      calculateLevel(
        earnedPoints
      );

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return NextResponse.json({
      success: true,

      user: {
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,
      },

      /*
       * สถิติจริง
       */
      stats: {
        enrollmentCount,

        completedCourseCount,

        completedLessonCount,

        paidEnrollmentCount,

        createdSkillCount,

        createdLessonCount,
      },

      /*
       * Mission
       */
      missions,

      /*
       * Reward Summary
       */
      rewards: {
        earnedPoints,

        totalAvailablePoints,

        completedMissionCount,

        totalMissionCount:
          missions.length,

        unlockedBadgeCount,

        totalBadgeCount:
          badges.length,
      },

      /*
       * Badge
       */
      badges,

      /*
       * Level
       */
      level,
    });
  } catch (error) {
    console.error(
      "Rewards API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "ไม่สามารถโหลดข้อมูลรางวัลและภารกิจได้",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * CREATE MISSION
 * =========================================================
 */

function createMission({
  id,
  title,
  description,
  type,
  progress,
  target,
  points,
}: {
  id: string;

  title: string;

  description: string;

  type:
    | "learning"
    | "teaching"
    | "blockchain";

  progress: number;

  target: number;

  points: number;
}): Mission {
  /*
   * Progress ที่แสดง
   * ไม่ให้เกิน Target
   */
  const safeProgress =
    Math.min(
      Math.max(
        progress,
        0
      ),
      target
    );

  const completed =
    progress >=
    target;

  const progressPercent =
    target >
    0
      ? Math.min(
          100,
          Math.round(
            (
              safeProgress /
              target
            ) *
              100
          )
        )
      : 0;

  return {
    id,

    title,

    description,

    type,

    progress:
      safeProgress,

    target,

    points,

    completed,

    progressPercent,
  };
}

/*
 * =========================================================
 * LEVEL
 * =========================================================
 */

function calculateLevel(
  points: number
) {
  /*
   * =======================================================
   * LEVEL 5
   * =======================================================
   */

  if (
    points >=
    1200
  ) {
    return {
      level:
        5,

      name:
        "Skill Master",

      currentPoints:
        points,

      nextLevelPoints:
        null,

      progressPercent:
        100,
    };
  }

  /*
   * =======================================================
   * LEVEL 4
   * =======================================================
   */

  if (
    points >=
    800
  ) {
    return {
      level:
        4,

      name:
        "Achiever",

      currentPoints:
        points,

      nextLevelPoints:
        1200,

      progressPercent:
        calculateLevelProgress(
          points,
          800,
          1200
        ),
    };
  }

  /*
   * =======================================================
   * LEVEL 3
   * =======================================================
   */

  if (
    points >=
    500
  ) {
    return {
      level:
        3,

      name:
        "Builder",

      currentPoints:
        points,

      nextLevelPoints:
        800,

      progressPercent:
        calculateLevelProgress(
          points,
          500,
          800
        ),
    };
  }

  /*
   * =======================================================
   * LEVEL 2
   * =======================================================
   */

  if (
    points >=
    200
  ) {
    return {
      level:
        2,

      name:
        "Explorer",

      currentPoints:
        points,

      nextLevelPoints:
        500,

      progressPercent:
        calculateLevelProgress(
          points,
          200,
          500
        ),
    };
  }

  /*
   * =======================================================
   * LEVEL 1
   * =======================================================
   */

  return {
    level:
      1,

    name:
      "Newcomer",

    currentPoints:
      points,

    nextLevelPoints:
      200,

    progressPercent:
      calculateLevelProgress(
        points,
        0,
        200
      ),
  };
}

/*
 * =========================================================
 * LEVEL PROGRESS
 * =========================================================
 */

function calculateLevelProgress(
  points: number,
  minimum: number,
  next: number
) {
  const range =
    next -
    minimum;

  if (
    range <=
    0
  ) {
    return 100;
  }

  const current =
    points -
    minimum;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          current /
          range
        ) *
          100
      )
    )
  );
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

        expiresAt:
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