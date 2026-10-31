"use client";

import {
  Star,
  ArrowRight,
  UserRound,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";





type Props = {

  title:string;

  category:string;

  creator:string;

  rating:string;

  price:string;

  icon:LucideIcon;

};







export default function MarketplaceSkillCard({

  title,

  category,

  creator,

  rating,

  price,

  icon:Icon,

}:Props){



return (

<div

className="
group
relative
overflow-hidden
rounded-[28px]
border
border-white/10
bg-[#111a33]
p-5
transition-all
duration-300
hover:-translate-y-2
hover:border-violet-500/50
hover:shadow-2xl
hover:shadow-violet-900/30
"

>







{/* Glow */}


<div

className="
absolute
right-0
top-0
h-32
w-32
rounded-full
bg-violet-500/20
blur-3xl
opacity-0
transition
group-hover:opacity-100
"

/>









{/* Icon */}


<div

className="
relative
flex
h-16
w-16
items-center
justify-center
rounded-2xl
border
border-white/10
bg-violet-500/20
text-violet-300
"

>

<Icon

size={30}

strokeWidth={1.8}

/>


</div>









{/* Category */}


<div

className="
mt-5
inline-flex
rounded-full
border
border-violet-400/20
bg-violet-500/10
px-3
py-1
text-xs
text-violet-300
"

>

{category}

</div>









{/* Title */}


<h3

className="
mt-4
text-xl
font-bold
"

>

{title}

</h3>









{/* Creator */}


<div

className="
mt-3
flex
items-center
gap-2
text-sm
text-slate-400
"

>

<UserRound

size={15}

/>


{creator}


</div>









{/* Rating + Price */}



<div

className="
mt-5
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

{rating}

</span>


</div>







<div

className="
font-bold
text-violet-400
"

>

{price} SKT/hr

</div>





</div>









{/* Button */}



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


);


}