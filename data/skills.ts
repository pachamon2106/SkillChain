export type Skill = {
  id: string;
  title: string;
  description: string;
  teacher: string;
  category: string;
  price: number;
  rating: number;
  icon: string;
  teacherWallet: string;
};

export const skills: Skill[] = [
  {
    id: "english-conversation",
    title: "English Conversation",
    description:
      "ฝึกภาษาอังกฤษที่ใช้ในชีวิตจริง เหมาะสำหรับผู้เริ่มต้น",
    teacher: "พี่มายด์",
    category: "ภาษา",
    price: 50,
    rating: 4.9,
    icon: "🇬🇧",

    // เปลี่ยนเป็น MetaMask Account 2 ของคุณ
    teacherWallet:
      "0x30d1045996B4c0ad1BEa2A28AFa25296F8754bCF",
  },

  {
    id: "photoshop-basic",
    title: "Photoshop Basic",
    description:
      "เรียน Photoshop ตั้งแต่พื้นฐานจนสามารถใช้งานจริงได้",
    teacher: "พี่ต้น",
    category: "Design",
    price: 80,
    rating: 4.8,
    icon: "🎨",
    teacherWallet:
      "0xc5Cc3E0eeAA55ca6aac87e4f8bC5c37ACFc86914",
  },

  {
    id: "python-beginner",
    title: "Python สำหรับมือใหม่",
    description:
      "เรียนเขียนโปรแกรม Python ตั้งแต่ศูนย์",
    teacher: "New",
    category: "Programming",
    price: 70,
    rating: 4.7,
    icon: "🐍",
    teacherWallet:
      "0x85A680a424Cb65028c31142F8F29b4ae70eF2B02",
  },

  {
    id: "online-marketing",
    title: "การตลาดออนไลน์",
    description:
      "เรียนรู้การสร้างแบรนด์และทำการตลาดบน Social Media",
    teacher: "พี่ฟิล์ม",
    category: "ธุรกิจ",
    price: 60,
    rating: 4.9,
    icon: "📈",
    teacherWallet:
      "0x85A680a424Cb65028c31142F8F29b4ae70eF2B02",
  },
];