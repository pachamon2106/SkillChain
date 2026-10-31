import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("skillchain_session")?.value;


    if (token) {
      await prisma.session.deleteMany({
        where: {
          token,
        },
      });
    }


    const response = NextResponse.json({
      success: true,
      message: "ออกจากระบบสำเร็จ",
    });


    response.cookies.delete(
      "skillchain_session"
    );


    return response;


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถออกจากระบบได้",
      },
      {
        status: 500,
      }
    );
  }
}