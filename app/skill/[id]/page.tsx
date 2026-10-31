import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import WalletButton from "@/components/WalletButton";
import PayForSkill from "@/components/PayForSkill";

import {
  skills,
} from "@/data/skills";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SkillDetail({
  params,
}: Props) {
  const { id } =
    await params;

  const skill =
    skills.find(
      (item) =>
        item.id === id
    );

  if (!skill) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#030617] text-white">

      <nav className="flex items-center justify-between border-b border-slate-800 px-8 py-5">

        <Link
          href="/"
          className="text-2xl font-bold"
        >
          Skill
          <span className="text-violet-500">
            Chain
          </span>
        </Link>

        <WalletButton />

      </nav>

      <section className="mx-auto max-w-5xl px-6 py-16">

        <Link
          href="/marketplace"
          className="text-sm text-violet-400"
        >
          ← กลับ Marketplace
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2">

          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-9xl">
            {skill.icon}
          </div>

          <div>

            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm text-violet-400">
              {skill.category}
            </span>

            <h1 className="mt-5 text-4xl font-bold">
              {skill.title}
            </h1>

            <p className="mt-3 text-slate-400">
              ผู้สอน: {skill.teacher}
            </p>

            <p className="mt-3 text-yellow-400">
              ★ {skill.rating}
            </p>

            <p className="mt-7 leading-7 text-slate-300">
              {skill.description}
            </p>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <p className="text-sm text-slate-400">
                ค่าเรียน
              </p>

              <div className="mt-2">

                <span className="text-4xl font-bold text-violet-400">
                  {skill.price}
                </span>

                <span className="ml-2 text-slate-400">
                  SKT / ชั่วโมง
                </span>

              </div>

            </div>

            <PayForSkill
              skillName={
                skill.title
              }
              price={
                skill.price
              }
              teacherWallet={
                skill.teacherWallet
              }
            />

          </div>

        </div>

      </section>

    </main>
  );
}