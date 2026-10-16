import { ago } from "./clock";
import type { AccountId, AppNotification } from "./types";

export const notifications: Record<AccountId, AppNotification[]> = {
  mathanet: [
    { id: "n1", kind: "message", text: { en: "Hessa wants to order 3 machboos trays for Thursday", ar: "حصة تريد طلب ٣ صواني مجبوس يوم الخميس" }, at: ago(0, 0.2), read: false, href: "/engagement" },
    { id: "n2", kind: "comment", text: { en: "Noura asked about the price of the machboos tray", ar: "نورة سألت عن سعر صينية المجبوس" }, at: ago(0, 0.4), read: false, href: "/engagement" },
    { id: "n3", kind: "recommendation", text: { en: "New recommendation: post a Reel on Wednesday at 9 PM", ar: "توصية جديدة: انشر ريلز يوم الأربعاء الساعة ٩ مساءً" }, at: ago(0, 13), read: false, href: "/insights" },
    { id: "n4", kind: "published", text: { en: "Your post was published and is doing 24% better than usual", ar: "تم نشر منشورك وأداؤه أفضل من المعتاد بـ٢٤٪" }, at: ago(1, 2), read: true, href: "/insights" },
    { id: "n5", kind: "competitor", text: { en: "@umm_salem_kitchen posted a Reel that's getting attention", ar: "@umm_salem_kitchen نشرت ريلز يحقق تفاعلاً عالياً" }, at: ago(1, 6), read: true, href: "/competitors" },
    { id: "n6", kind: "report", text: { en: "Your weekly report is ready", ar: "تقريرك الأسبوعي جاهز" }, at: ago(2, 1), read: true, href: "/insights" },
  ],
  qahwa: [
    { id: "n1", kind: "message", text: { en: "Bader wants to book the café for 30 people on Saturday", ar: "بدر يريد حجز المقهى لـ٣٠ شخصاً يوم السبت" }, at: ago(0, 0.3), read: false, href: "/engagement" },
    { id: "n2", kind: "comment", text: { en: "Lulwa asked if the saffron latte comes iced", ar: "لولوة سألت إذا لاتيه الزعفران متوفر بارد" }, at: ago(0, 0.6), read: false, href: "/engagement" },
    { id: "n3", kind: "recommendation", text: { en: "Reach is down 4.2%: see what to do", ar: "الوصول انخفض ٤٫٢٪: اعرف ماذا تفعل" }, at: ago(0, 13), read: false, href: "/insights" },
    { id: "n4", kind: "competitor", text: { en: "@matcha_house_kw gained 600 followers this week", ar: "@matcha_house_kw كسب ٦٠٠ متابع هذا الأسبوع" }, at: ago(1, 3), read: true, href: "/competitors" },
    { id: "n5", kind: "report", text: { en: "Your weekly report is ready", ar: "تقريرك الأسبوعي جاهز" }, at: ago(2, 1), read: true, href: "/insights" },
  ],
  tannour: [
    { id: "n1", kind: "message", text: { en: "Nasser ordered 50 croissants for Monday", ar: "ناصر طلب ٥٠ كرواسون يوم الاثنين" }, at: ago(0, 0.25), read: false, href: "/engagement" },
    { id: "n2", kind: "comment", text: { en: "Maha asked about a birthday cake for Sunday", ar: "مها سألت عن كيكة عيد ميلاد يوم الأحد" }, at: ago(0, 0.5), read: false, href: "/engagement" },
    { id: "n3", kind: "recommendation", text: { en: "Reconnect Instagram within 3 days", ar: "أعد ربط إنستغرام خلال ٣ أيام" }, at: ago(0, 4), read: false, href: "/profile" },
    { id: "n4", kind: "scheduled", text: { en: "A post is scheduled for tomorrow at 8:30 PM", ar: "منشور مجدول غداً الساعة ٨:٣٠ مساءً" }, at: ago(0, 9), read: false, href: "/" },
    { id: "n5", kind: "published", text: { en: "Your cake carousel reached 9,800 people", ar: "كاروسيل الكيك وصل إلى ٩٬٨٠٠ شخص" }, at: ago(1, 4), read: true, href: "/insights" },
    { id: "n6", kind: "report", text: { en: "Your weekly report is ready", ar: "تقريرك الأسبوعي جاهز" }, at: ago(2, 1), read: true, href: "/insights" },
  ],
};
