import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";


async function main() {


  const loginEmail =
    "test@example.com";


  const loginPassword =
    "Test123456";



  const passwordHash =
    await bcrypt.hash(
      loginPassword,
      12
    );



  const user =
    await prisma.user.upsert({

      where: {

        email: loginEmail,

      },


      update: {

        name: "Test User",

        passwordHash,

      },


      create: {

        name: "Test User",

        email: loginEmail,

        passwordHash,

      },


    });



  console.log("");

  console.log("================================");

  console.log(
    "SkillChain User พร้อมใช้งาน"
  );

  console.log("================================");


  console.log("");

  console.log("Email:");

  console.log(
    user.email
  );


  console.log("");

  console.log("Password:");

  console.log(
    loginPassword
  );


  console.log("");

  console.log("User ID:");

  console.log(
    user.id
  );


  console.log("");

  console.log(
    "Wallet จะเชื่อมผ่าน MetaMask ภายหลัง"
  );


  console.log("");

  console.log("================================");

  console.log("");



}



main()


.catch((error)=>{


  console.error(
    "Create user error:",
    error
  );


  process.exitCode = 1;


})


.finally(async()=>{


  await prisma.$disconnect();


});