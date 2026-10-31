"use client";

import {
  BookOpen,
  Users,
  Star,
  Trophy,
} from "lucide-react";



const stats = [

  {
    icon: BookOpen,
    title:"ทักษะของฉัน",
    value:"8",
    detail:"Skills"
  },


  {
    icon: Users,
    title:"ผู้เรียน",
    value:"128",
    detail:"Users"
  },


  {
    icon: Star,
    title:"คะแนนรีวิว",
    value:"4.9",
    detail:"Rating"
  },


  {
    icon: Trophy,
    title:"ระดับ",
    value:"Lv.3",
    detail:"Creator"
  },

];







export default function StatsCard(){



return (

<div
className="
grid
grid-cols-2
xl:grid-cols-4
gap-4
"
>


{

stats.map((item,index)=>{


const Icon = item.icon;



return (

<div

key={index}

className="
rounded-3xl
border
border-white/10
bg-[#111a33]
p-5
transition
hover:border-violet-500/50
hover:-translate-y-1
"

>


<div
className="
flex
items-center
justify-between
"
>


<div
className="
flex
h-12
w-12
items-center
justify-center
rounded-2xl
bg-violet-500/20
text-violet-300
"
>


<Icon
size={24}
strokeWidth={1.8}
/>


</div>


</div>







<div className="
mt-5
"
>


<p
className="
text-sm
text-slate-400
"
>

{item.title}

</p>




<div
className="
mt-1
flex
items-end
gap-2
"
>


<h3
className="
text-3xl
font-bold
"
>

{item.value}

</h3>


<span
className="
text-sm
text-violet-400
mb-1
"
>

{item.detail}

</span>


</div>



</div>






</div>


)


})


}



</div>


)


}