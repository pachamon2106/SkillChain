"use client";

import {
  Search,
  Palette,
  Code2,
  Languages,
  BriefcaseBusiness,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";





type Category = {

  name:string;

  icon:LucideIcon;

};






const categories:Category[] = [

  {
    name:"ทั้งหมด",
    icon:Search,
  },


  {
    name:"Design",
    icon:Palette,
  },


  {
    name:"Programming",
    icon:Code2,
  },


  {
    name:"ภาษา",
    icon:Languages,
  },


  {
    name:"ธุรกิจ",
    icon:BriefcaseBusiness,
  },

];








type Props = {

  active:string;

  setActive:(value:string)=>void;

};









export default function CategoryFilter({

  active,

  setActive,

}:Props){





return (

<div

className="
flex
flex-wrap
gap-3
"

>





{

categories.map((item)=>{


const Icon=item.icon;


const selected =
active === item.name;





return (

<button

key={item.name}

onClick={()=>setActive(item.name)}


className={`
flex
items-center
gap-2
rounded-full
px-5
py-2.5
text-sm
transition
border

${
selected

?

"bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30"

:

"bg-[#111a33] border-white/10 text-slate-300 hover:border-violet-500/50 hover:text-white"

}

`}

>



<Icon

size={16}

strokeWidth={1.8}

/>



{item.name}



</button>


)


})


}




</div>


);


}