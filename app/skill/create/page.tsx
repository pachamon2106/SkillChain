"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function CreateSkillPage() {


  const router = useRouter();


  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);





  async function createSkill() {


    try {


      setLoading(true);

      setMessage("");



      const res = await fetch(
        "/api/skills",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },


          body: JSON.stringify({

            title,

            description,

            price,

          }),

        }
      );



      const data = await res.json();




      if (data.success) {


        setMessage(
          "สร้าง Skill สำเร็จ 🎉"
        );


        setTitle("");
        setDescription("");
        setPrice("");



        setTimeout(() => {

          router.push("/marketplace");

        }, 1000);



      } else {


        setMessage(
          data.message
        );


      }





    } catch (error) {


      console.error(error);


      setMessage(
        "เกิดข้อผิดพลาด"
      );



    } finally {


      setLoading(false);


    }


  }






  return (


    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">


      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 w-[450px]">


        <h1 className="text-3xl font-bold mb-6">

          Create Skill

        </h1>





        <div className="space-y-4">



          <div>

            <label>
              ชื่อ Skill
            </label>


            <input

              className="w-full mt-1 p-3 rounded bg-slate-800"

              value={title}

              onChange={(e)=>
                setTitle(e.target.value)
              }

              placeholder="เช่น สอนภาษาอังกฤษ"

            />

          </div>






          <div>

            <label>
              รายละเอียด
            </label>


            <textarea

              className="w-full mt-1 p-3 rounded bg-slate-800"

              value={description}

              onChange={(e)=>
                setDescription(e.target.value)
              }

              placeholder="รายละเอียด Skill"

            />

          </div>






          <div>

            <label>
              ราคา (SKT)
            </label>


            <input

              type="number"

              className="w-full mt-1 p-3 rounded bg-slate-800"

              value={price}

              onChange={(e)=>
                setPrice(e.target.value)
              }

              placeholder="50"

            />


          </div>







          <button

            onClick={createSkill}

            disabled={loading}

            className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg mt-4"

          >

            {
              loading
              ? "กำลังสร้าง..."
              : "สร้าง Skill"
            }


          </button>






          {
            message && (

              <p className="text-green-400 mt-3">

                {message}

              </p>

            )
          }





        </div>


      </div>


    </main>


  );


}