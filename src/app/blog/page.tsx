import React from "react";
import Link from "next/link";

export const metadata = {
  title: "บทความ & คัมภีร์ความรู้ไพ่ทาโรต์ | Tarot Wisdom Blog",
  description: "รวมบทความแนะนำการอ่านไพ่ทาโรต์ จิตวิทยาเบื้องหลัง และศาสตร์แห่งสัญลักษณ์ 1909",
};

export default function BlogPage() {
  const articles = [
    {
      id: "rider-waite-history",
      title: "ต้นกำเนิดไพ่ทาโรต์ 1909 Rider-Waite-Smith ที่โลกหลงรัก",
      category: "ประวัติศาสตร์",
      readTime: "5 นาที",
      summary: "สำรวจเรื่องราวเบื้องหลังของ Arthur Edward Waite และ Pamela Colman Smith ผู้วาดสำรับไพ่ที่ทรงอิทธิพลที่สุดในโลก",
    },
    {
      id: "how-to-ask-questions",
      title: "วิธีตั้งคำถามกับไพ่ทาโรต์ให้ได้คำตอบที่ชัดเจนและเปลี่ยนชีวิต",
      category: "เทคนิคการดูดวง",
      readTime: "4 นาที",
      summary: "คำถามที่ดีจะนำไปสู่คำตอบที่ทรงพลัง หลีกเลี่ยงคำถามปิด และเปิดรับคำแนะนำเพื่อสร้างอนาคตด้วยตนเอง",
    },
    {
      id: "major-arcana-journey",
      title: "The Fool's Journey: การเดินทางแห่งชีวิตผ่านไพ่ชุดใหญ่ 22 ใบ",
      category: "ปรัชญาและจิตวิทยา",
      readTime: "7 นาที",
      summary: "เข้าใจสัญลักษณ์ของจิตใต้สำนึกมนุษย์ ผ่านลำดับขั้นการเติบโตจาก The Fool สู่ The World",
    },
  ];

  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#9c93b8]">Tarot Wisdom & Insights</span>
        </div>

        <div className="text-center space-y-2 py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24] text-[11px] text-[#e5c07b]">
            <span>✦</span> Sacred Knowledge <span>✦</span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold">
            คัมภีร์ความรู้ไพ่ทาโรต์
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto">
            บทความเจาะลึกศาสตร์ไพ่ทาโรต์ สัญลักษณ์วิทยา และจิตวิทยาเพื่อพัฒนาตนเอง
          </p>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 p-5 sm:p-6 space-y-2 hover:border-[#ffd700]/60 transition-all hover:scale-[1.01] shadow-xl"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#e5c07b]">
                <span className="px-2 py-0.5 rounded bg-[#e5c07b]/15 border border-[#e5c07b]/30">
                  {article.category}
                </span>
                <span className="text-[#9c93b8]">✦ เวลาอ่าน {article.readTime}</span>
              </div>
              <h2 className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold">
                {article.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#9c93b8] leading-relaxed">
                {article.summary}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
