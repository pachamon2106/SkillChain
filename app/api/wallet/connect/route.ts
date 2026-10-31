import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAddress,
  verifyMessage,
} from "ethers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("skillchain_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อน",
        },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่",
        },
        { status: 401 }
      );
    }

    if (
      !session.walletNonce ||
      !session.walletNonceExpires
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบคำขอยืนยัน Wallet",
        },
        { status: 400 }
      );
    }

    if (session.walletNonceExpires < new Date()) {
      await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          walletNonce: null,
          walletNonceExpires: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "คำขอยืนยัน Wallet หมดอายุ กรุณาลองใหม่",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (
      typeof body.address !== "string" ||
      typeof body.signature !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูล Wallet ไม่ครบถ้วน",
        },
        { status: 400 }
      );
    }

    let walletAddress: string;

    try {
      walletAddress = getAddress(body.address);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Wallet Address ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const message = [
      "SkillChain Wallet Verification",
      "",
      `User ID: ${session.user.id}`,
      `Wallet: ${walletAddress}`,
      `Nonce: ${session.walletNonce}`,
      "",
      "Sign this message to connect your wallet to SkillChain.",
      "This request will not trigger a blockchain transaction.",
    ].join("\n");

    let recoveredAddress: string;

    try {
      recoveredAddress = getAddress(
        verifyMessage(message, body.signature)
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Signature ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (recoveredAddress !== walletAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "ผู้ลงนามไม่ตรงกับ Wallet ที่เลือก",
        },
        { status: 400 }
      );
    }

    const walletOwner = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (
      walletOwner &&
      walletOwner.id !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Wallet นี้ถูกเชื่อมกับบัญชีอื่นแล้ว",
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        walletAddress,
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
      },
    });

    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        walletNonce: null,
        walletNonceExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เชื่อม MetaMask สำเร็จ",
      user,
    });
  } catch (error) {
    console.error("Wallet connect error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเชื่อม Wallet",
      },
      { status: 500 }
    );
  }
}