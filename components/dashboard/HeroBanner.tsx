"use client";

import {
  ArrowRight,
  Play,
} from "lucide-react";



export default function HeroBanner(){


return (

<section
className="
relative
overflow-hidden
rounded-3xl
border
border-white/10
bg-gradient-to-br
from-[#12183d]
via-[#17104a]
to-[#050816]
p-8
min-h-[300px]
"
>





{/* Glow Background */}

<div
className="
absolute
right-0
top-0
h-80
w-80
rounded-full
bg-violet-600/30
blur-[100px]
"
/>



<div
className="
absolute
right-32
bottom-0
h-48
w-48
rounded-full
bg-blue-500/20
blur-[80px]
"
/>






{/* Grid Effect */}

<div
className="
absolute
inset-0
opacity-[0.08]
"
style={{
backgroundImage:
"linear-gradient(#ffffff 1px, transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)",
backgroundSize:"40px 40px"
}}
/>









<div className="
relative
z-10
max-w-xl
">





<div
className="
inline-flex
rounded-full
border
border-violet-400/30
bg-violet-500/20
px-4
py-2
text-xs
text-violet-200
mb-6
"
>

Skill Marketplace on Blockchain

</div>







<h1
className="
text-4xl
md:text-5xl
font-bold
leading-tight
"
>


เปลี่ยนทักษะของคุณ

<br/>


ให้มีมูลค่า

<span className="
text-violet-500
">

บน Blockchain

</span>


</h1>







<p
className="
mt-5
text-lg
text-slate-300
"
>

เรียน สอน แลกเปลี่ยน
สร้างอนาคตไปด้วยกัน

</p>









<div
className="
mt-8
flex
gap-4
"
>



<button
className="
flex
items-center
gap-2
rounded-full
bg-violet-600
px-6
py-3
font-bold
hover:bg-violet-500
transition
"
>

เริ่มค้นหาทักษะ

<ArrowRight size={18}/>

</button>







<button
className="
flex
items-center
gap-2
rounded-full
border
border-white/20
px-6
py-3
text-slate-200
hover:bg-white/10
transition
"
>


ดูวิธีใช้งาน

<Play size={16}/>


</button>





</div>






</div>









{/* Right Illustration Placeholder */}

<div
className="
absolute
right-8
bottom-0
hidden
md:block
"
>


<div
className="
w-56
h-56
rounded-t-full
bg-gradient-to-t
from-violet-600/30
to-transparent
flex
items-center
justify-center
"
>


<div
className="
w-28
h-28
rounded-3xl
border
border-violet-400/40
bg-white/5
backdrop-blur-xl
flex
items-center
justify-center
text-5xl
"
>

⛓️

</div>



</div>



</div>






</section>


)


}