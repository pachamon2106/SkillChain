"use client";

import {
  ArrowDownLeft,
  BookOpen,
  Star,
  Coins,
} from "lucide-react";





const activities = [

  {
    icon: Coins,
    title:"ได้รับ Skill Token",
    detail:"+50 SKT จากการสอน",
    time:"10 นาทีที่แล้ว",
    type:"plus"
  },


  {
    icon: BookOpen,
    title:"จองคลาสสำเร็จ",
    detail:"English Conversation",
    time:"2 ชั่วโมงที่แล้ว",
    type:"normal"
  },


  {
    icon: Star,
    title:"ได้รับรีวิว 5 ดาว",
    detail:"จากผู้เรียน",
    time:"เมื่อวาน",
    type:"star"
  },


  {
    icon: ArrowDownLeft,
    title:"โอน SKT",
    detail:"-30 SKT",
    time:"2 วันที่แล้ว",
    type:"normal"
  },


];








export default function ActivityPanel(){


return (

<div

className="
rounded-3xl
border
border-white/10
bg-[#111a33]
p-6
"

>





<div

className="
flex
items-center
justify-between
mb-6
"

>


<h2

className="
text-xl
font-bold
"

>

กิจกรรมล่าสุด

</h2>


<button

className="
text-sm
text-violet-400
hover:text-violet-300
"

>

ดูทั้งหมด

</button>


</div>









<div

className="
space-y-5
"

>


{

activities.map((item,index)=>{


const Icon = item.icon;



return (

<div

key={index}

className="
flex
gap-4
items-start
"

>



<div

className="
flex
h-11
w-11
shrink-0
items-center
justify-center
rounded-2xl
bg-violet-500/20
text-violet-300
"

>

<Icon
size={20}
/>


</div>







<div

className="
flex-1
"

>


<div

className="
flex
justify-between
gap-3
"

>


<h3

className="
font-semibold
"

>

{item.title}

</h3>


<span

className={`
text-sm

${
item.type==="plus"
?
"text-green-400"
:
"text-slate-400"
}

`}

>

{item.detail}

</span>


</div>





<p

className="
mt-1
text-sm
text-slate-400
"

>

{item.time}

</p>



</div>







</div>


)


})


}



</div>






</div>


)


}