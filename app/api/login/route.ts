import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ตรวจว่ากรอกข้อมูลครบไหม
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกอีเมลและรหัสผ่าน",
        },
        { status: 400 }
      );
    }

    // หา User จาก Email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // ไม่พบ User
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    // ตรวจ Password
    const passwordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    // สร้าง Session Token แบบสุ่ม
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Session อายุ 7 วัน
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // บันทึก Session ลงฐานข้อมูล
    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });

    // เก็บ Session ใน HttpOnly Cookie
    response.cookies.set({
      name: "skillchain_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      },
      { status: 500 }
    );
  }
}