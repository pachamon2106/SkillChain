"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";


export default function HomeLogin() {

  const router = useRouter();


  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");





  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setError("");



    if (!email || !password) {

      setError("กรุณากรอก Email และ Password");

      return;

    }



    try {

      setLoading(true);



      const res = await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );



      const data = await res.json();




      if (!res.ok) {

        setError(
          data.message ||
          "เข้าสู่ระบบไม่สำเร็จ"
        );

        return;

      }



      router.push("/account");

      router.refresh();



    } catch (error) {


      setError(
        "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );


    } finally {


      setLoading(false);


    }

  }









  return (

    <div className="relative w-full max-w-md">



      {/* Glow Effect */}

      <div
        className="
        absolute
        -inset-2
        rounded-[36px]
        bg-gradient-to-r
        from-violet-500/40
        via-fuchsia-500/30
        to-violet-600/40
        blur-2xl
        "
      />


      <div
        className="
        absolute
        -inset-1
        rounded-[34px]
        border
        border-violet-400/20
        bg-violet-500/10
        blur-sm
        "
      />







      {/* Login Card */}

      <div
        className="
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-white/70
        bg-white
        p-8
        shadow-2xl
        shadow-violet-300/40
        font-brand
        "
      >





        {/* Header */}

        <div className="mb-8 text-center">


          <div
            className="
            text-xs
            font-bold
            tracking-[0.3em]
            text-violet-500
            "
          >
            USER ACCESS
          </div>



          <h3
            className="
            mt-4
            text-3xl
            font-bold
            text-slate-900
            "
          >
            Welcome Back
          </h3>



          <p
            className="
            mt-2
            text-sm
            text-slate-500
            "
          >
            เข้าสู่ SkillChain Platform
          </p>


        </div>








        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >



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

              onChange={(e)=>
                setEmail(e.target.value)
              }

              placeholder="name@example.com"

              className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-3
              text-slate-900
              placeholder:text-slate-400
              outline-none
              transition
              focus:border-violet-500
              focus:bg-white
              focus:ring-4
              focus:ring-violet-100
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


                value={password}


                onChange={(e)=>
                  setPassword(e.target.value)
                }


                placeholder="Enter your password"


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
                placeholder:text-slate-400
                outline-none
                transition
                focus:border-violet-500
                focus:bg-white
                focus:ring-4
                focus:ring-violet-100
                "

              />







              <button

                type="button"

                onClick={() =>
                  setShowPassword(!showPassword)
                }


                className="
                absolute
                right-3
                top-1/2
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                text-slate-400
                transition
                hover:bg-violet-50
                hover:text-violet-600
                "

              >


                {
                  showPassword

                  ?

                  <EyeOff
                    size={18}
                    strokeWidth={1.8}
                  />

                  :

                  <Eye
                    size={18}
                    strokeWidth={1.8}
                  />

                }


              </button>


            </div>


          </div>









          {
            error && (

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

            )
          }









          <button

            type="submit"

            disabled={loading}


            className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-500
            py-3.5
            font-semibold
            text-white
            shadow-lg
            shadow-violet-200
            transition
            hover:from-violet-500
            hover:to-fuchsia-500
            disabled:opacity-60
            "

          >


            {
              loading
              ?
              "กำลังเข้าสู่ระบบ..."
              :
              "เข้าสู่ระบบ"
            }


          </button>



        </form>








        <div
          className="
          mt-6
          text-center
          text-sm
          text-slate-500
          "
        >

          ยังไม่มีบัญชี?


          <Link

            href="/register"

            className="
            ml-2
            font-semibold
            text-violet-600
            hover:text-violet-500
            "

          >

            สมัครสมาชิก

          </Link>


        </div>




      </div>


    </div>

  );

}