"use client";

import {
  Star,
  ArrowRight,
} from "lucide-react";





type Props = {

  title:string;

  price:string;

};







export default function SkillCard({

  title,

  price,

}:Props){



return (

<div

className="
group
overflow-hidden
rounded-3xl
border
border-white/10
bg-[#111a33]
transition
duration-300
hover:-translate-y-2
hover:border-violet-500/50
"

>





{/* Image Area */}

<div

className="
relative
h-40
overflow-hidden
bg-gradient-to-br
from-violet-600
via-purple-600
to-blue-600
"

>


<div

className="
absolute
inset-0
bg-gradient-to-t
from-black/50
to-transparent
"

/>



<div

className="
absolute
bottom-4
left-4
rounded-full
bg-white/10
px-3
py-1
text-xs
text-white
backdrop-blur
"

>

Skill Class

</div>



</div>








{/* Content */}

<div className="p-5">



<h3

className="
text-lg
font-bold
"

>

{title}

</h3>





<p

className="
mt-2
text-sm
text-slate-400
"

>

โดย Skill Creator

</p>









<div

className="
mt-4
flex
items-center
justify-between
"

>



<div

className="
flex
items-center
gap-1
text-yellow-400
"

>

<Star
size={16}
fill="currentColor"
/>


<span

className="
text-sm
text-white
"

>

4.9

</span>


</div>





<div

className="
font-bold
text-violet-400
"

>

{price}

</div>





</div>









<button

className="
mt-5
flex
w-full
items-center
justify-center
gap-2
rounded-xl
bg-violet-600
py-3
font-semibold
transition
hover:bg-violet-500
"

>

ดูรายละเอียด

<ArrowRight size={17}/>


</button>






</div>







</div>


)


}