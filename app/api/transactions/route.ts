import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";


export async function GET(){

  try{


    const cookieStore = await cookies();


    const token =
      cookieStore.get("skillchain_session")?.value;



    if(!token){

      return NextResponse.json(
        {
          success:false,
          message:"กรุณาเข้าสู่ระบบ"
        },
        {
          status:401
        }
      );

    }




    const session =
      await prisma.session.findUnique({

        where:{
          token
        },

        include:{
          user:{
            include:{
              wallet:true
            }
          }
        }

      });




    if(!session?.user.wallet){

      return NextResponse.json(
        {
          success:false,
          message:"ไม่พบ Wallet"
        },
        {
          status:404
        }
      );

    }





    const transactions =
      await prisma.transaction.findMany({

        where:{
          walletId:
          session.user.wallet.id
        },

        orderBy:{
          createdAt:"desc"
        }

      });





    return NextResponse.json({

      success:true,

      transactions

    });



  }catch(error){


    console.error(error);


    return NextResponse.json(
      {
        success:false,
        message:"เกิดข้อผิดพลาด"
      },
      {
        status:500
      }
    );


  }

}