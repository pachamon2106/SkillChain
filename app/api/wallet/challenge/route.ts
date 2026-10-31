import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getAddress } from "ethers";
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

    const body = await request.json();

    if (typeof body.address !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ Wallet Address",
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

    const nonce = crypto.randomBytes(32).toString("hex");

    const nonceExpires = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        walletNonce: nonce,
        walletNonceExpires: nonceExpires,
      },
    });

    const message = [
      "SkillChain Wallet Verification",
      "",
      `User ID: ${session.user.id}`,
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      "",
      "Sign this message to connect your wallet to SkillChain.",
      "This request will not trigger a blockchain transaction.",
    ].join("\n");

    return NextResponse.json({
      success: true,
      message,
      expiresAt: nonceExpires,
    });
  } catch (error) {
    console.error("Wallet challenge error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถสร้างคำขอยืนยัน Wallet ได้",
      },
      { status: 500 }
    );
  }
}