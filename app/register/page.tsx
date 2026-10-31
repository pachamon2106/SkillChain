"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  GraduationCap,
  BadgeDollarSign,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import HomeMotionCard from "@/components/HomeMotionCard";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError(
        "กรุณากรอกชื่อของคุณ"
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
      );

      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "รหัสผ่านทั้งสองช่องไม่ตรงกัน"
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: name.trim(),

              email:
                email
                  .trim()
                  .toLowerCase(),

              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "สมัครสมาชิกไม่สำเร็จ"
        );

        return;
      }

      setMessage(
        "สมัครสมาชิกสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ..."
      );

      window.setTimeout(() => {
        router.push("/");
      }, 900);
    } catch (err) {
      console.error(
        "Register error:",
        err
      );

      setError(
        "ไม่สามารถเชื่อมต่อกับระบบได้"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#030617]
        px-4
        py-5
        text-white
        md:px-8
        md:py-6
      "
    >
      <div
        className="
          mx-auto
          max-w-[1280px]
        "
      >
        {/* Logo */}
        <div
          className="
            mb-5
            flex
            items-center
          "
        >
          <Link
            href="/"
            className="
              text-2xl
              font-bold
              md:text-3xl
            "
          >
            Skill

            <span
              className="
                text-violet-500
              "
            >
              Chain
            </span>
          </Link>
        </div>

        {/* Glow Card */}
        <HomeMotionCard>
          <div
            className="
              grid
              min-h-[650px]
              md:grid-cols-[1.1fr_0.9fr]
            "
          >
            {/* LEFT */}
            <section
              className="
                relative
                overflow-hidden
                bg-gradient-to-br
                from-violet-900
                via-purple-800
                to-fuchsia-700
                px-8
                py-9
                md:px-10
                md:py-10
              "
            >
              {/* Background Glow */}
              <div
                className="
                  absolute
                  inset-0
                  opacity-25
                "
              >
                <div
                  className="
                    absolute
                    left-10
                    top-10
                    h-32
                    w-32
                    rounded-full
                    bg-fuchsia-400
                    blur-3xl
                  "
                />

                <div
                  className="
                    absolute
                    right-10
                    top-20
                    h-24
                    w-24
                    rounded-full
                    bg-white/10
                  "
                />

                <div
                  className="
                    absolute
                    bottom-10
                    left-16
                    h-52
                    w-52
                    rounded-full
                    border
                    border-white/10
                  "
                />
              </div>

              <div
                className="
                  relative
                  z-10
                  flex
                  h-full
                  flex-col
                  justify-between
                "
              >
                <div>
                  <div
                    className="
                      mb-5
                      inline-flex
                      rounded-full
                      border
                      border-white/20
                      bg-white/10
                      px-4
                      py-2
                      text-sm
                      text-violet-100
                    "
                  >
                    Skill Marketplace on Blockchain
                  </div>

                  <h1
                    className="
                      max-w-xl
                      text-4xl
                      font-bold
                      leading-tight
                      md:text-6xl
                    "
                  >
                    เริ่มต้นสร้าง

                    <br />

                    <span
                      className="
                        text-violet-100
                      "
                    >
                      คุณค่าจากทักษะ
                    </span>

                    <br />

                    ของคุณ
                  </h1>

                  <p
                    className="
                      mt-5
                      max-w-xl
                      text-base
                      leading-8
                      text-violet-100/90
                      md:text-lg
                    "
                  >
                    สมัครสมาชิกเพื่อเรียนรู้
                    สอน และแลกเปลี่ยนทักษะ

                    <br />

                    พร้อมใช้งาน Skill Token
                    (SKT) บน SkillChain
                  </p>

                  <div className="mt-7">
                    <Link
                      href="/"
                      className="
                        inline-flex
                        rounded-xl
                        border
                        border-white/30
                        bg-white/10
                        px-6
                        py-3
                        font-semibold
                        text-white
                        backdrop-blur
                        transition
                        hover:bg-white/20
                      "
                    >
                      กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                  </div>
                </div>

                {/* Features */}
                <div
                  className="
                    mt-8
                    grid
                    gap-4
                    md:grid-cols-3
                  "
                >
                  <FeatureCard
                    icon={
                      <GraduationCap
                        size={24}
                      />
                    }
                    title="เรียนรู้ทักษะ"
                    text="ค้นหาทักษะและคอร์สที่ใช่"
                  />

                  <FeatureCard
                    icon={
                      <BadgeDollarSign
                        size={24}
                      />
                    }
                    title="สอนและสร้างรายได้"
                    text="สร้างรายได้จากความรู้และประสบการณ์"
                  />

                  <FeatureCard
                    icon={
                      <ShieldCheck
                        size={24}
                      />
                    }
                    title="Blockchain"
                    text="โปร่งใส ปลอดภัย และตรวจสอบได้"
                  />
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section
              className="
                flex
                items-center
                justify-center
                bg-slate-100
                px-6
                py-10
                text-slate-900
                md:px-8
              "
            >
              <div
                className="
                  w-full
                  max-w-[430px]
                  rounded-[30px]
                  bg-white
                  px-8
                  py-8
                  shadow-[0_20px_70px_rgba(124,58,237,0.28)]
                  md:px-9
                "
              >
                {/* Header */}
                <div className="text-center">
                  <div
                    className="
                      mx-auto
                      mb-4
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-violet-100
                      text-violet-600
                    "
                  >
                    <UserRound
                      size={24}
                    />
                  </div>

                  <p
                    className="
                      text-[11px]
                      font-bold
                      tracking-[0.35em]
                      text-violet-500
                    "
                  >
                    NEW MEMBER
                  </p>

                  <h2
                    className="
                      mt-3
                      text-3xl
                      font-bold
                      text-slate-900
                    "
                  >
                    Create Account
                  </h2>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-500
                    "
                  >
                    สมัครสมาชิก SkillChain
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="
                    mt-7
                    space-y-4
                  "
                >
                  {/* Name */}
                  <div>
                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-slate-700
                      "
                    >
                      ชื่อ
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(
                        event
                      ) =>
                        setName(
                          event.target
                            .value
                        )
                      }
                      placeholder="ชื่อของคุณ"
                      required
                      autoComplete="name"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        py-3
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-violet-500
                        focus:ring-4
                        focus:ring-violet-500/10
                      "
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-slate-700
                      "
                    >
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(
                        event
                      ) =>
                        setEmail(
                          event.target
                            .value
                        )
                      }
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        py-3
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-violet-500
                        focus:ring-4
                        focus:ring-violet-500/10
                      "
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-slate-700
                      "
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          password
                        }
                        onChange={(
                          event
                        ) =>
                          setPassword(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="อย่างน้อย 8 ตัวอักษร"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-4
                          py-3
                          pr-12
                          text-slate-900
                          outline-none
                          transition
                          placeholder:text-slate-400
                          focus:border-violet-500
                          focus:ring-4
                          focus:ring-violet-500/10
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-400
                          transition
                          hover:text-violet-600
                        "
                      >
                        {showPassword ? (
                          <EyeOff
                            size={18}
                          />
                        ) : (
                          <Eye
                            size={18}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-slate-700
                      "
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          confirmPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setConfirmPassword(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-4
                          py-3
                          pr-12
                          text-slate-900
                          outline-none
                          transition
                          placeholder:text-slate-400
                          focus:border-violet-500
                          focus:ring-4
                          focus:ring-violet-500/10
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-slate-400
                          transition
                          hover:text-violet-600
                        "
                      >
                        {showConfirmPassword ? (
                          <EyeOff
                            size={18}
                          />
                        ) : (
                          <Eye
                            size={18}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        text-red-600
                      "
                    >
                      {error}
                    </div>
                  )}

                  {/* Success */}
                  {message && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-green-200
                        bg-green-50
                        px-4
                        py-3
                        text-sm
                        text-green-600
                      "
                    >
                      {message}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      bg-gradient-to-r
                      from-violet-600
                      to-fuchsia-500
                      px-4
                      py-3.5
                      font-semibold
                      text-white
                      shadow-lg
                      shadow-violet-500/20
                      transition
                      hover:brightness-110
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loading
                      ? "กำลังสมัครสมาชิก..."
                      : "สมัครสมาชิก"}
                  </button>
                </form>

                {/* Login Link */}
                <div
                  className="
                    mt-6
                    text-center
                    text-sm
                    text-slate-500
                  "
                >
                  มีบัญชีอยู่แล้ว?{" "}

                  <Link
                    href="/"
                    className="
                      font-semibold
                      text-violet-600
                      transition
                      hover:text-fuchsia-600
                    "
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </HomeMotionCard>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/15
        bg-white/10
        p-5
        backdrop-blur
        transition
        duration-200
        hover:bg-white/15
      "
    >
      <div
        className="
          mb-4
          flex
          justify-center
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            border
            border-white/20
            bg-white/10
            text-white
          "
        >
          {icon}
        </div>
      </div>

      <h3
        className="
          text-center
          text-base
          font-bold
          text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-2
          text-center
          text-sm
          leading-6
          text-violet-100/80
        "
      >
        {text}
      </p>
    </div>
  );
}