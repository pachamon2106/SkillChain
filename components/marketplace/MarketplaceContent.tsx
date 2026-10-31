"use client";

import {
  useState
} from "react";


import {
  Search,
  Palette,
  Code2,
  Languages,
  BriefcaseBusiness,
  Wallet,
} from "lucide-react";


import Sidebar from "@/components/dashboard/Sidebar";

import MarketplaceSkillCard 
from "@/components/marketplace/MarketplaceSkillCard";

import CategoryFilter 
from "@/components/marketplace/CategoryFilter";





type Props = {

  isLoggedIn:boolean;

};








const skills = [

  {
    title:"Photoshop Basic",
    category:"Design",
    creator:"Skill Creator",
    rating:"4.8",
    price:"80",
    icon:Palette,
  },


  {
    title:"Python สำหรับมือใหม่",
    category:"Programming",
    creator:"Skill Creator",
    rating:"4.7",
    price:"70",
    icon:Code2,
  },


  {
    title:"English Conversation",
    category:"ภาษา",
    creator:"Skill Creator",
    rating:"4.9",
    price:"50",
    icon:Languages,
  },


  {
    title:"การตลาดออนไลน์",
    category:"ธุรกิจ",
    creator:"Skill Creator",
    rating:"4.9",
    price:"60",
    icon:BriefcaseBusiness,
  },

];









export default function MarketplaceContent({

  isLoggedIn,

}:Props){



const [activeCategory,setActiveCategory] =

useState("ทั้งหมด");





const filteredSkills =

activeCategory === "ทั้งหมด"

?

skills

:

skills.filter(

(skill)=>

skill.category === activeCategory

);







return (

<main

className="
h-screen
overflow-hidden
bg-[#050816]
text-white
flex
"

>









{/* Sidebar */}

<div

className="
h-screen
shrink-0
"

>

<Sidebar />

</div>















{/* Content */}


<section

className="
flex-1
overflow-y-auto
px-6
py-5
"

>









{/* Header */}


<div

className="
flex
justify-between
items-center
mb-8
"

>



<h1

className="
text-2xl
font-bold
"

>

Skill

<span className="text-violet-500">

Chain

</span>


</h1>












{/* Wallet only login */}


{

isLoggedIn && (


<div

className="
flex
items-center
gap-3
"

>



<div

className="
rounded-full
bg-[#111a33]
border
border-white/10
px-5
py-3
text-sm
text-green-400
"

>

● Wallet Connected

</div>







<div

className="
rounded-full
bg-[#111a33]
border
border-white/10
px-5
py-3
flex
items-center
gap-2
"

>


<Wallet size={16}/>


350 SKT


</div>



</div>


)

}



</div>














{/* Hero */}


<div

className="
relative
overflow-hidden
rounded-[32px]
border
border-white/10
bg-gradient-to-br
from-violet-900
via-purple-800
to-fuchsia-700
p-10
mb-8
"

>



<div

className="
absolute
right-10
top-10
h-48
w-48
rounded-full
bg-white/10
blur-3xl
"

/>







<div

className="
relative
z-10
"

>


<p

className="
text-sm
text-violet-200
mb-3
"

>

Skill Marketplace

</p>







<h2

className="
text-4xl
font-bold
max-w-xl
leading-tight
"

>

ค้นหาทักษะ

<br/>

ที่เปลี่ยนเป็นมูลค่า

<span

className="
text-violet-200
"

>

บน Blockchain

</span>


</h2>







<p

className="
mt-4
text-violet-100
"

>

เรียนรู้จากผู้เชี่ยวชาญ
และรับ Skill Token

</p>





</div>





</div>













{/* Search */}


<div

className="
flex
items-center
gap-3
bg-[#111a33]
border
border-white/10
rounded-2xl
px-5
py-4
mb-6
"

>



<Search

className="text-slate-400"

/>





<input

placeholder="
ค้นหาทักษะ เช่น Photoshop, Python, ภาษาอังกฤษ...
"

className="
bg-transparent
outline-none
w-full
text-white
placeholder:text-slate-500
"

/>



</div>














{/* Category */}


<CategoryFilter

active={activeCategory}

setActive={setActiveCategory}

/>












<h2

className="
text-2xl
font-bold
mt-8
mb-5
"

>

ทักษะยอดนิยม

</h2>













<div

className="
grid
xl:grid-cols-4
lg:grid-cols-3
md:grid-cols-2
gap-5
"

>


{

filteredSkills.map((skill)=>(


<MarketplaceSkillCard

key={skill.title}

{...skill}


/>


))


}



</div>









</section>







</main>


);


}