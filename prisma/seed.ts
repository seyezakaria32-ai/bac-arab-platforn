/**
 * بذر قاعدة البيانات بالمنهج الكامل للبرنامج + الباقات + حساب المسؤول.
 * التشغيل:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// tsx لا يحمّل ملف .env تلقائيًا خلافًا لـ Next.js
try {
  process.loadEnvFile(".env");
} catch {
  /* الملف غير موجود — نعتمد على متغيّرات البيئة الجاهزة */
}

const db = new PrismaClient();

type LessonSeed = {
  title: string;
  minutes: number;
  summary: string;
  objectives: string[];
  preview?: boolean;
  premium?: boolean;
};

type QuestionSeed = {
  type: "mcq" | "true_false" | "short" | "open" | "multi";
  prompt: string;
  points?: number;
  explanation?: string;
  options?: { text: string; correct?: boolean }[];
  accepted?: string[];
};

type ModuleSeed = {
  title: string;
  description: string;
  lessons: LessonSeed[];
  quiz: { title: string; passScore: number; questions: QuestionSeed[] };
};

type TrackSeed = {
  slug: string;
  title: string;
  description: string;
  color: string;
  modules: ModuleSeed[];
};

// ═══════════════════════════════ التاريخ ═══════════════════════════════

const historyTrack: TrackSeed = {
  slug: "history",
  title: "التاريخ",
  description:
    "منهجية الإنشاء التاريخي، التعليق على الوثائق، وفن بناء المقالة التاريخية.",
  color: "#005461",
  modules: [
    {
      title: "الوحدة 1: منهجية كتابة الإنشاء التاريخي",
      description:
        "من الفهم إلى التحرير: كيف تبني إنشاءً تاريخيًا متماسكًا يستحق أعلى نقطة.",
      lessons: [
        {
          title: "مدخل عام للفصل",
          minutes: 9,
          summary:
            "نظرة شاملة على محاور الوحدة وطريقة الاستفادة القصوى منها خلال أسابيع المراجعة.",
          objectives: [
            "التعرّف على خريطة الوحدة ومحاورها",
            "ضبط طريقة الدراسة المناسبة لكل درس",
          ],
          preview: true,
        },
        {
          title: "أهمية الإنشاء في الامتحانات",
          minutes: 12,
          summary:
            "وزن الإنشاء التاريخي في نقطة الامتحان الوطني ولماذا يصنع الفارق بين الطلبة.",
          objectives: [
            "إدراك وزن الإنشاء في سلّم التنقيط",
            "تحديد أولويات المراجعة بناءً على ذلك",
          ],
          preview: true,
        },
        {
          title: "مكونات الإنشاء (نظرة عامة)",
          minutes: 14,
          summary:
            "المقدمة، العرض، الخاتمة: وظيفة كل مكوّن وحجمه المتوازن داخل الورقة.",
          objectives: [
            "تمييز وظائف المكوّنات الثلاثة",
            "توزيع الوقت والمساحة بين المكوّنات",
          ],
        },
        {
          title: "المقدمة في الإنشاء التاريخي",
          minutes: 16,
          summary:
            "التمهيد، طرح الإشكالية، والإعلان عن التصميم — بصياغة سليمة بعيدًا عن الحشو.",
          objectives: [
            "بناء تمهيد مرتبط بالموضوع",
            "صياغة إشكالية دقيقة",
            "الإعلان عن التصميم دون كشف النتائج",
          ],
        },
        {
          title: "العرض في الإنشاء التاريخي",
          minutes: 18,
          summary:
            "تنظيم الأفكار في محاور، الربط بينها، وتوظيف المعطيات والأمثلة التاريخية.",
          objectives: [
            "تقسيم العرض إلى محاور متوازنة",
            "توظيف الشواهد والتواريخ بدقة",
            "استعمال روابط الانتقال بين الفقرات",
          ],
        },
        {
          title: "الخاتمة في الإنشاء التاريخي",
          minutes: 11,
          summary:
            "التركيب، الجواب عن الإشكالية، وفتح أفق جديد دون تكرار العرض.",
          objectives: ["صياغة تركيب موجز", "فتح أفق مرتبط بالموضوع"],
        },
        {
          title: "نماذج تطبيقية للمقدمات",
          minutes: 17,
          summary: "مقدمات جاهزة محلَّلة مع بيان مواطن القوة والضعف في كل نموذج.",
          objectives: ["تحليل مقدمات نموذجية", "استخراج قوالب قابلة للتوظيف"],
        },
        {
          title: "نموذج تطبيقي للعرض والخاتمة",
          minutes: 19,
          summary: "تحرير عرض وخاتمة كاملين خطوة بخطوة أمامك.",
          objectives: ["متابعة عملية التحرير مباشرة", "محاكاة النموذج في تمرين ذاتي"],
        },
        {
          title: "توصيات تقنية لجمالية الورقة",
          minutes: 10,
          summary:
            "الخط، الفقرات، الفراغات، وعلامات الترقيم: تفاصيل ترفع الانطباع الأول للمصحّح.",
          objectives: ["ضبط شكل الورقة", "تجنّب ما ينفّر المصحّح"],
        },
        {
          title: "أخطاء شائعة في الإنشاء يجب تجنبها",
          minutes: 13,
          summary: "أكثر عشرة أخطاء تكلّف الطالب نقاطًا، وكيف تتفاداها.",
          objectives: ["التعرّف على الأخطاء المتكرّرة", "بناء قائمة مراجعة ذاتية"],
        },
        {
          title: "تصحيح ورقة بكالوريا كاملة في الإنشاء التاريخي",
          minutes: 24,
          summary: "تصحيح مباشر لورقة امتحان حقيقية مع سلّم التنقيط.",
          objectives: ["فهم منطق التنقيط", "تقييم ورقتك بنفسك"],
        },
      ],
      quiz: {
        title: "اختبار الوحدة 1 — منهجية الإنشاء التاريخي",
        passScore: 70,
        questions: [
          {
            type: "mcq",
            prompt: "ما الوظيفة الأساسية للمقدمة في الإنشاء التاريخي؟",
            explanation:
              "المقدمة تمهّد وتطرح الإشكالية وتعلن التصميم، ولا تقدّم النتائج.",
            options: [
              { text: "التمهيد وطرح الإشكالية والإعلان عن التصميم", correct: true },
              { text: "تقديم خلاصة الموضوع ونتائجه" },
              { text: "سرد أكبر عدد من التواريخ والأحداث" },
              { text: "نقد آراء المؤرخين" },
            ],
          },
          {
            type: "true_false",
            prompt: "يجوز أن تتضمّن الخاتمة أفكارًا جديدة لم ترد في العرض.",
            explanation:
              "الخاتمة تركّب ما ورد في العرض وتجيب عن الإشكالية، ثم تفتح أفقًا فقط.",
            options: [{ text: "صحيح" }, { text: "خطأ", correct: true }],
          },
          {
            type: "mcq",
            prompt: "أي العناصر التالية لا يُعدّ من مكوّنات الإنشاء التاريخي؟",
            options: [
              { text: "المقدمة" },
              { text: "العرض" },
              { text: "المبيان القطاعي", correct: true },
              { text: "الخاتمة" },
            ],
          },
          {
            type: "multi",
            prompt: "اختر العناصر التي تجعل العرض متماسكًا (أكثر من إجابة):",
            options: [
              { text: "تقسيم واضح إلى محاور", correct: true },
              { text: "روابط انتقال بين الفقرات", correct: true },
              { text: "توظيف شواهد وتواريخ دقيقة", correct: true },
              { text: "تكرار الإشكالية في كل فقرة" },
            ],
          },
          {
            type: "short",
            prompt: "ما المصطلح الذي نطلقه على السؤال المركزي الذي يطرحه الإنشاء؟",
            accepted: ["الإشكالية", "الاشكالية", "الإشكال", "الاشكال"],
          },
          {
            type: "open",
            prompt:
              "اكتب مقدمة مختصرة (4 إلى 6 أسطر) لموضوع: «التحولات الاقتصادية في أوروبا خلال القرن 19».",
            points: 4,
          },
        ],
      },
    },
    {
      title: "الوحدة 2: التعليق على الوثائق التاريخية",
      description:
        "قراءة الوثيقة، تفكيكها، وبناء تعليق منهجي يجيب عن أسئلة الامتحان.",
      lessons: [
        {
          title: "تقديم عام للفصل",
          minutes: 8,
          summary: "ما الذي يميّز التعليق عن الإنشاء، ولماذا يخسر فيه كثير من الطلبة.",
          objectives: ["تمييز التعليق عن الإنشاء", "ضبط أهداف الوحدة"],
        },
        {
          title: "تعريف الوثيقة التاريخية",
          minutes: 11,
          summary: "أنواع الوثائق: نص، خطاب، معاهدة، صورة، إحصائيات — وخصائص كل نوع.",
          objectives: ["تصنيف الوثائق", "استخراج طبيعة الوثيقة ومصدرها"],
        },
        {
          title: "خطوات لازمة قبل التعليق على الوثيقة",
          minutes: 13,
          summary: "القراءة المتأنّية، تحديد الكلمات المفاتيح، ووضع الوثيقة في سياقها.",
          objectives: ["بناء عادة القراءة المنهجية", "تحديد السياق التاريخي"],
        },
        {
          title: "المنهجية العامة للتعليق على الوثيقة",
          minutes: 18,
          summary: "الخطوات الكاملة من التقديم إلى التقويم، بترتيب لا يتغيّر.",
          objectives: ["استيعاب خطوات التعليق", "تطبيقها على وثيقة نموذجية"],
        },
        {
          title: "طريقة كتابة المقدمة في حالة وثيقة واحدة",
          minutes: 14,
          summary: "التقديم المادي للوثيقة ثم طرح الإشكالية المناسبة.",
          objectives: ["تقديم الوثيقة ماديًا", "صياغة إشكالية من الوثيقة"],
        },
        {
          title: "طريقة كتابة المقدمة في حالة أكثر من وثيقة",
          minutes: 15,
          summary: "الجمع بين وثيقتين أو أكثر دون تكرار، وإبراز العلاقة بينهما.",
          objectives: ["تقديم مجموعة وثائق", "إبراز التكامل أو التعارض بينها"],
        },
        {
          title: "عناصر العرض والخاتمة في التعليق التاريخي",
          minutes: 16,
          summary: "التحليل، الشرح، الربط بالمعارف الخارجية، ثم التقويم النقدي.",
          objectives: ["تنظيم عرض التعليق", "صياغة تقويم نقدي للوثيقة"],
        },
        {
          title: "أنواع أسئلة التعليق التاريخي الشائعة في الامتحانات",
          minutes: 17,
          summary: "بنك الأسئلة المتكرّرة وطريقة الإجابة النموذجية عن كل نوع.",
          objectives: ["تصنيف أسئلة الامتحان", "امتلاك قالب إجابة لكل نوع"],
        },
      ],
      quiz: {
        title: "اختبار الوحدة 2 — التعليق على الوثائق التاريخية",
        passScore: 70,
        questions: [
          {
            type: "mcq",
            prompt: "ما المقصود بـ«التقديم المادي» للوثيقة؟",
            explanation:
              "التقديم المادي يشمل نوع الوثيقة وصاحبها ومصدرها وتاريخها وموضوعها.",
            options: [
              {
                text: "ذكر نوع الوثيقة وصاحبها ومصدرها وتاريخها وموضوعها",
                correct: true,
              },
              { text: "نقد مضمون الوثيقة" },
              { text: "تلخيص الوثيقة في سطر" },
              { text: "ذكر رأي المؤرخين في الوثيقة" },
            ],
          },
          {
            type: "true_false",
            prompt: "التعليق على الوثيقة يقتصر على إعادة صياغة ما ورد فيها.",
            explanation:
              "التعليق يتجاوز إعادة الصياغة إلى التحليل والربط بالمعارف والتقويم النقدي.",
            options: [{ text: "صحيح" }, { text: "خطأ", correct: true }],
          },
          {
            type: "multi",
            prompt: "ما الخطوات التي تسبق التعليق على الوثيقة؟",
            options: [
              { text: "القراءة المتأنّية للوثيقة", correct: true },
              { text: "تحديد الكلمات المفاتيح", correct: true },
              { text: "وضع الوثيقة في سياقها التاريخي", correct: true },
              { text: "حفظ الوثيقة عن ظهر قلب" },
            ],
          },
          {
            type: "mcq",
            prompt: "عند التعليق على أكثر من وثيقة، ما الأمر الأهم في المقدمة؟",
            options: [
              { text: "إبراز العلاقة بين الوثائق (تكامل أو تعارض)", correct: true },
              { text: "تقديم كل وثيقة في فقرة منفصلة طويلة" },
              { text: "اختيار وثيقة واحدة وإهمال الباقي" },
              { text: "البدء مباشرة بالتحليل" },
            ],
          },
          {
            type: "short",
            prompt: "ما اسم المرحلة الأخيرة في التعليق التي نُبدي فيها رأيًا نقديًا في الوثيقة؟",
            accepted: ["التقويم", "التقويم النقدي", "النقد"],
          },
        ],
      },
    },
    {
      title: "الوحدة 3: المقالة التاريخية – فن البناء والتحرير",
      description:
        "من المعطيات الخام إلى مقالة تاريخية مكتملة، مع فهم شبكة تصحيح الأستاذ.",
      lessons: [
        {
          title: "كيفية تحليل المعطيات وتحويلها إلى مقالة",
          minutes: 20,
          summary: "استخراج الأفكار من المعطيات وترتيبها في تصميم منطقي.",
          objectives: ["تحليل المعطيات", "بناء تصميم من الأفكار المستخرجة"],
        },
        {
          title: "منهجية الكتابة – تطبيق عملي",
          minutes: 22,
          summary: "تحرير مقالة كاملة أمامك من الصفحة البيضاء إلى النقطة الأخيرة.",
          objectives: ["متابعة تحرير مقالة كاملة", "محاكاة العملية بنفسك"],
        },
        {
          title: "شبكة التقويم: كيف يصحح الأستاذ ورقتك؟",
          minutes: 16,
          summary: "معايير التنقيط الرسمية وكيف توزَّع النقط على عناصر الورقة.",
          objectives: ["فهم شبكة التنقيط", "توجيه الكتابة نحو ما يُنقَّط فعلًا"],
        },
        {
          title: "تصحيح امتحان التاريخ كاملًا – نموذج تطبيقي",
          minutes: 26,
          summary: "امتحان بكالوريا كامل مع الإجابة النموذجية والتنقيط.",
          objectives: ["تطبيق شامل", "قياس مستواك قبل الامتحان"],
        },
      ],
      quiz: {
        title: "اختبار الوحدة 3 — المقالة التاريخية",
        passScore: 70,
        questions: [
          {
            type: "mcq",
            prompt: "أول خطوة عند تحويل المعطيات إلى مقالة تاريخية هي:",
            options: [
              { text: "تحليل المعطيات واستخراج الأفكار الأساسية", correct: true },
              { text: "كتابة الخاتمة أولًا" },
              { text: "حفظ التواريخ الواردة" },
              { text: "نسخ المعطيات كما هي" },
            ],
          },
          {
            type: "true_false",
            prompt: "معرفة شبكة التقويم تساعد الطالب على توجيه كتابته نحو ما يُنقَّط فعلًا.",
            options: [{ text: "صحيح", correct: true }, { text: "خطأ" }],
          },
          {
            type: "multi",
            prompt: "ما المعايير التي تحضر عادة في شبكة تنقيط المقالة التاريخية؟",
            options: [
              { text: "احترام المنهجية والتصميم", correct: true },
              { text: "دقّة المعلومات التاريخية", correct: true },
              { text: "سلامة اللغة وجمالية الورقة", correct: true },
              { text: "طول الورقة بعدد الصفحات" },
            ],
          },
          {
            type: "open",
            prompt:
              "انطلاقًا من معطيات درسٍ اخترتَه، اقترح تصميمًا من محورين لمقالة تاريخية مع عنوان لكل محور.",
            points: 4,
          },
        ],
      },
    },
  ],
};

// ═══════════════════════════════ الجغرافيا ═══════════════════════════════

const geographyTrack: TrackSeed = {
  slug: "geography",
  title: "الجغرافيا",
  description:
    "المقالة الجغرافية، إنجاز المبيانات وقراءتها، ومنهجية التعليق الجغرافي.",
  color: "#00B7B5",
  modules: [
    {
      title: "الوحدة 1: تقنيات كتابة المقالة الجغرافية",
      description: "بناء مقالة جغرافية دقيقة بلغة المادة ومصطلحاتها.",
      lessons: [
        {
          title: "تقديم الفصل وتعريف المقالة الجغرافية",
          minutes: 10,
          summary: "ما الذي يميّز المقالة الجغرافية عن نظيرتها التاريخية.",
          objectives: ["تعريف المقالة الجغرافية", "تحديد خصائصها"],
        },
        {
          title: "بناء المقدمة في المقالة الجغرافية",
          minutes: 14,
          summary: "التمهيد المجالي، طرح الإشكالية، والإعلان عن التصميم.",
          objectives: ["صياغة تمهيد مجالي", "طرح إشكالية جغرافية"],
        },
        {
          title: "العرض في المقالة الجغرافية",
          minutes: 18,
          summary: "توظيف المعطيات الرقمية والمصطلحات المجالية داخل العرض.",
          objectives: ["تنظيم العرض", "توظيف الأرقام والمصطلحات بدقّة"],
        },
        {
          title: "الخاتمة في المقالة الجغرافية",
          minutes: 11,
          summary: "التركيب والجواب عن الإشكالية مع فتح أفق مجالي.",
          objectives: ["صياغة خاتمة جغرافية", "تفادي التكرار"],
        },
        {
          title: "نصائح إضافية للتميز في المقالة الجغرافية",
          minutes: 12,
          summary: "تفاصيل صغيرة ترفع النقطة: المصطلح، الرقم، والمثال المجالي.",
          objectives: ["بناء رصيد مصطلحي", "توظيف الأمثلة المجالية"],
        },
        {
          title: "نموذج تصحيح امتحان البكالوريا في المقالة الجغرافية",
          minutes: 24,
          summary: "تصحيح مقالة جغرافية من امتحان وطني مع سلّم التنقيط.",
          objectives: ["فهم التنقيط", "تقييم مستواك"],
        },
      ],
      quiz: {
        title: "اختبار الوحدة 1 — المقالة الجغرافية",
        passScore: 70,
        questions: [
          {
            type: "mcq",
            prompt: "ما الذي يميّز المقالة الجغرافية أساسًا؟",
            options: [
              { text: "توظيف المعطيات الرقمية والمصطلحات المجالية", correct: true },
              { text: "الاعتماد على السرد الزمني للأحداث" },
              { text: "الاقتصار على آراء الجغرافيين" },
              { text: "استعمال التواريخ الدقيقة" },
            ],
          },
          {
            type: "true_false",
            prompt: "الخاتمة في المقالة الجغرافية يجب أن تجيب عن الإشكالية المطروحة في المقدمة.",
            options: [{ text: "صحيح", correct: true }, { text: "خطأ" }],
          },
          {
            type: "multi",
            prompt: "ما العناصر التي ترفع نقطة المقالة الجغرافية؟",
            options: [
              { text: "استعمال المصطلح الجغرافي الدقيق", correct: true },
              { text: "توظيف الأرقام والنسب", correct: true },
              { text: "إعطاء أمثلة مجالية ملموسة", correct: true },
              { text: "الإكثار من العبارات الإنشائية العامة" },
            ],
          },
          {
            type: "short",
            prompt: "ما اسم الجزء الذي نطرح فيه الإشكالية ونعلن التصميم؟",
            accepted: ["المقدمة", "المقدّمة"],
          },
        ],
      },
    },
    {
      title: "الوحدة 2: قراءة وإنجاز المبيانات",
      description:
        "أهم وحدة تقنية في الجغرافيا: اختيار المبيان المناسب ورسمه بدقّة.",
      lessons: [
        {
          title: "تقديم الفصل: قراءة وإنجاز المبيانات",
          minutes: 9,
          summary: "خريطة الوحدة والأدوات التي ستحتاجها للرسم.",
          objectives: ["ضبط محاور الوحدة", "تجهيز أدوات الرسم"],
        },
        {
          title: "تعريف المبيان ودوره في الجغرافيا",
          minutes: 11,
          summary: "لماذا يُطلب المبيان في الامتحان وما الذي يقيسه المصحّح فيه.",
          objectives: ["تعريف المبيان", "فهم وظيفته في الامتحان"],
        },
        {
          title: "أنواع المبيانات: متى أختار المبيان المناسب؟",
          minutes: 16,
          summary: "قاعدة الاختيار: نسب مئوية، تطوّر زمني، أو مقارنة بين عناصر.",
          objectives: ["تصنيف أنواع المبيانات", "اختيار النوع المناسب للمعطيات"],
        },
        {
          title: "خطوات الإنجاز التقنية",
          minutes: 15,
          summary: "من حساب المعطيات إلى وضع العنوان والمفتاح.",
          objectives: ["ترتيب خطوات الإنجاز", "تفادي القفز على خطوة"],
        },
        {
          title: "أساسيات المبيان وعناصر الجودة",
          minutes: 13,
          summary: "العنوان، المفتاح، السلّم، المحاور، ودقّة الرسم.",
          objectives: ["ضبط عناصر المبيان الإلزامية", "تقييم جودة مبيانك"],
        },
        {
          title: "طريقة رسم المبيان القطاعي الدائري – تطبيقي",
          minutes: 18,
          summary: "تحويل النسب إلى درجات ورسم الدائرة خطوة بخطوة.",
          objectives: ["حساب الدرجات من النسب", "رسم المبيان القطاعي"],
        },
        {
          title: "طريقة رسم المبيان نصف الدائري – تطبيقي",
          minutes: 14,
          summary: "قاعدة 180 درجة والفروق عن المبيان الدائري الكامل.",
          objectives: ["حساب الدرجات على 180", "إنجاز نصف دائرة دقيقة"],
        },
        {
          title: "طريقة رسم المبيان بالأعمدة – تطبيقي",
          minutes: 16,
          summary: "بناء المحاور، اختيار السلّم، ورسم الأعمدة بتساوٍ.",
          objectives: ["ضبط السلّم", "رسم أعمدة متساوية العرض"],
        },
        {
          title: "طريقة رسم المبيان بالمنحنى – تطبيقي",
          minutes: 15,
          summary: "تمثيل التطوّر الزمني بمنحنى واضح وصحيح.",
          objectives: ["تحديد النقاط", "وصل المنحنى بدقّة"],
        },
        {
          title: "طريقة رسم مبيان بالأعمدة المتلاصقة",
          minutes: 14,
          summary: "مقارنة أكثر من متغيّر في نفس المبيان.",
          objectives: ["تنظيم المجموعات", "بناء مفتاح واضح"],
        },
        {
          title: "تطبيق مبيان الدائرة من امتحانات البكالوريا",
          minutes: 17,
          summary: "تمرين حقيقي من امتحان وطني مع التصحيح.",
          objectives: ["تطبيق مباشر", "مقارنة إنجازك بالنموذج"],
        },
        {
          title: "طريقة رسم مبيان المنحنى بخطين",
          minutes: 16,
          summary: "منحنيان في مبيان واحد: السلّم المزدوج والمفتاح.",
          objectives: ["إدارة سلّمين", "تمييز المنحنيين"],
        },
        {
          title: "تطبيق رسم الأعمدة من امتحان البكالوريا",
          minutes: 18,
          summary: "تمرين أعمدة من امتحان وطني مع التنقيط.",
          objectives: ["تطبيق مباشر", "تفادي أخطاء السلّم"],
        },
        {
          title: "تطبيق رسم المنحنى من امتحان البكالوريا",
          minutes: 18,
          summary: "تمرين منحنى من امتحان وطني مع التصحيح المفصّل.",
          objectives: ["تطبيق مباشر", "ضبط الدقّة في التمثيل"],
        },
      ],
      quiz: {
        title: "اختبار الوحدة 2 — المبيانات",
        passScore: 70,
        questions: [
          {
            type: "mcq",
            prompt: "معطيات في شكل نسب مئوية مجموعها 100% — ما المبيان الأنسب؟",
            explanation: "النسب المئوية التي يكتمل مجموعها تُمثَّل بمبيان قطاعي دائري.",
            options: [
              { text: "المبيان القطاعي الدائري", correct: true },
              { text: "المنحنى" },
              { text: "الأعمدة المتلاصقة" },
              { text: "المبيان بالنقط" },
            ],
          },
          {
            type: "mcq",
            prompt: "لتمثيل تطوّر ظاهرة عبر سنوات متتالية، نختار:",
            options: [
              { text: "المنحنى", correct: true },
              { text: "المبيان القطاعي" },
              { text: "المبيان نصف الدائري" },
              { text: "الخريطة" },
            ],
          },
          {
            type: "short",
            prompt: "نسبة 25% كم تقابلها من الدرجات في المبيان القطاعي الدائري؟",
            explanation: "25 × 3.6 = 90 درجة.",
            accepted: ["90", "٩٠", "90 درجة", "90°"],
          },
          {
            type: "short",
            prompt: "بكم نضرب النسبة المئوية للحصول على الدرجات في المبيان نصف الدائري؟",
            explanation: "180 ÷ 100 = 1.8",
            accepted: ["1.8", "1,8", "١.٨"],
          },
          {
            type: "multi",
            prompt: "ما العناصر الإلزامية في أي مبيان؟",
            options: [
              { text: "العنوان", correct: true },
              { text: "المفتاح", correct: true },
              { text: "السلّم / تدريج المحاور", correct: true },
              { text: "توقيع الطالب" },
            ],
          },
          {
            type: "true_false",
            prompt: "يمكن إنجاز مبيان بالأعمدة دون تحديد سلّم للمحور العمودي.",
            explanation: "السلّم إلزامي، وبدونه يفقد المبيان دقّته ونقطته.",
            options: [{ text: "صحيح" }, { text: "خطأ", correct: true }],
          },
        ],
      },
    },
    {
      title: "الوحدة 3: منهجية التعليق في الجغرافيا",
      description:
        "التعليق على المبيان والوثائق الجغرافية بمصطلحات دقيقة ومنهجية واضحة.",
      lessons: [
        {
          title: "تقديم الفصل: منهجية التعليق في الجغرافيا",
          minutes: 9,
          summary: "الفرق بين قراءة المبيان والتعليق عليه.",
          objectives: ["تمييز القراءة عن التعليق", "ضبط محاور الوحدة"],
        },
        {
          title: "خطوات التعليق على الرسم البياني",
          minutes: 16,
          summary: "التقديم، الوصف، التفسير، ثم الاستنتاج.",
          objectives: ["ترتيب خطوات التعليق", "تطبيقها على مبيان"],
        },
        {
          title: "بنك المصطلحات في التعليق على المبيان",
          minutes: 14,
          summary: "معجم جاهز: ارتفاع، تراجع، استقرار، تذبذب، نمو مطّرد…",
          objectives: ["بناء رصيد مصطلحي", "توظيف المصطلح المناسب للحركة"],
          premium: true,
        },
        {
          title: "نموذج تطبيقي في التعليق على المبيان",
          minutes: 18,
          summary: "تعليق كامل على مبيان حقيقي خطوة بخطوة.",
          objectives: ["متابعة نموذج مكتمل", "محاكاته"],
        },
        {
          title: "منهجية التعليق على الوثائق الجغرافية",
          minutes: 17,
          summary: "الخرائط، الصور، والجداول: كيف تعلّق على كل نوع.",
          objectives: ["تصنيف الوثائق الجغرافية", "قالب تعليق لكل نوع"],
        },
        {
          title: "أخطاء قاتلة يجب تجنبها في التعليق الجغرافي",
          minutes: 13,
          summary: "الأخطاء التي تُسقط النقطة رغم صحّة المضمون.",
          objectives: ["التعرّف على الأخطاء القاتلة", "بناء قائمة مراجعة"],
        },
        {
          title: "تصحيح امتحان البكالوريا في التعليق الجغرافي",
          minutes: 22,
          summary: "تصحيح مفصّل لتمرين تعليق من امتحان وطني.",
          objectives: ["فهم التنقيط", "تصحيح أخطائك"],
        },
        {
          title: "نموذج تصحيح امتحان البكالوريا في التعليق الجغرافي",
          minutes: 20,
          summary: "نموذج إجابة كامل جاهز للمحاكاة قبل الامتحان.",
          objectives: ["امتلاك نموذج مرجعي", "الاستعداد النهائي"],
        },
      ],
      quiz: {
        title: "اختبار الوحدة 3 — التعليق الجغرافي",
        passScore: 70,
        questions: [
          {
            type: "mcq",
            prompt: "ما الترتيب الصحيح لخطوات التعليق على مبيان؟",
            options: [
              { text: "التقديم ← الوصف ← التفسير ← الاستنتاج", correct: true },
              { text: "التفسير ← التقديم ← الوصف ← الاستنتاج" },
              { text: "الوصف ← الاستنتاج ← التقديم ← التفسير" },
              { text: "الاستنتاج ← التفسير ← الوصف ← التقديم" },
            ],
          },
          {
            type: "true_false",
            prompt: "قراءة المبيان والتعليق عليه عمليتان مترادفتان تمامًا.",
            explanation:
              "القراءة وصف للمعطيات، أما التعليق فيضيف التفسير والربط والاستنتاج.",
            options: [{ text: "صحيح" }, { text: "خطأ", correct: true }],
          },
          {
            type: "short",
            prompt:
              "ما المصطلح المناسب لوصف منحنى يرتفع ثم ينخفض ثم يرتفع بشكل متكرّر؟",
            accepted: ["تذبذب", "التذبذب", "متذبذب", "تذبذب مستمر"],
          },
          {
            type: "multi",
            prompt: "ما الأخطاء التي تُفقد الطالب نقطة التعليق الجغرافي؟",
            options: [
              { text: "الاكتفاء بإعادة الأرقام دون تفسير", correct: true },
              { text: "إهمال الاستنتاج", correct: true },
              { text: "استعمال مصطلحات غير دقيقة", correct: true },
              { text: "استعمال مصطلحات جغرافية دقيقة" },
            ],
          },
          {
            type: "open",
            prompt:
              "علّق في خمسة أسطر على مبيان يُظهر تراجع نسبة الساكنة القروية من 60% إلى 35% خلال ثلاثين سنة.",
            points: 4,
          },
        ],
      },
    },
  ],
};

// ═══════════════════════════════ التنفيذ ═══════════════════════════════

function slugify(prefix: string, i: number) {
  return `${prefix}-${String(i).padStart(2, "0")}`;
}

/**
 * القيم الافتراضية للتطوير وحده. على خادم حقيقي نرفض البذر بلا كلمة مرور
 * صريحة: كلمة "Admin@2026" مكتوبة في المستودع، وحساب مسؤول بها على موقع
 * منشور بابٌ مفتوح لكلّ من اطّلع على الكود.
 */
const isProduction = process.env.NODE_ENV === "production";

async function main() {
  // الفحص قبل أيّ كتابة: البذر يحذف المسارات والدروس ثمّ يعيد بناءها،
  // فالتوقّف في منتصفه يترك القاعدة ناقصة بلا حساب مسؤول.
  if (isProduction && !process.env.ADMIN_PASSWORD) {
    console.error(
      "\n❌ ADMIN_PASSWORD غير مضبوط على خادم الإنتاج.\n" +
        "   أضفه في متغيّرات الاستضافة (كلمة مرور قويّة جديدة) ثمّ أعد تشغيل البذر.\n",
    );
    process.exit(1);
  }

  console.log("🌱 بدء بذر قاعدة البيانات…");

  // ── الباقات ──
  const startPlan = await db.plan.upsert({
    where: { code: "START" },
    update: {},
    create: {
      code: "START",
      name: "START",
      tagline: "الانطلاقة الصحيحة",
      description:
        "كل ما تحتاجه لإتقان منهجية التاريخ والجغرافيا خطوة بخطوة.",
      priceCents: 750000, // 7,500 XOF — سعر الإطلاق
      comparePriceCents: 1000000, // 10,000 XOF
      currency: "XOF",
      durationDays: 0, // الوصول حتى نهاية موسم البكالوريا (access.seasonEnd)
      order: 1,
      badge: "سعر الإطلاق",
      features: JSON.stringify([
        { label: "الوصول إلى كامل الدروس المسجّلة", included: true },
        { label: "مشاهدة الفيديوهات بجودة عالية", included: true },
        { label: "متابعة التقدّم درسًا بدرس", included: true },
        { label: "الانتقال المنظّم بين الدروس", included: true },
        { label: "اختبارات الوحدات الست", included: true },
        { label: "ملفات وموارد الدروس الأساسية", included: true },
        { label: "إثبات إتمام البرنامج", included: true },
        { label: "تمارين وتصحيحات إضافية", included: false },
        { label: "نماذج امتحانات حصرية", included: false },
        { label: "تصحيح أعمالك من الأستاذ", included: false },
        { label: "مساحة دعم ومتابعة خاصة", included: false },
      ]),
      capabilities: JSON.stringify({
        lessons: true,
        quizzes: true,
        certificate: true,
        premiumResources: false,
        extraExams: false,
        assignmentReview: false,
        prioritySupport: false,
      }),
    },
  });

  const premiumPlan = await db.plan.upsert({
    where: { code: "PREMIUM_ELITE" },
    update: {},
    create: {
      code: "PREMIUM_ELITE",
      name: "PREMIUM ELITE",
      tagline: "للطلبة الجادّين الذين يستهدفون التميّز",
      description:
        "كل مزايا START، إضافة إلى متابعة شخصية وموارد حصرية ونماذج امتحانات إضافية.",
      priceCents: 2500000, // 25,000 XOF
      comparePriceCents: 3000000, // 30,000 XOF
      currency: "XOF",
      durationDays: 0, // الوصول حتى نهاية موسم البكالوريا (access.seasonEnd)
      order: 2,
      badge: "الأكثر اختيارًا",
      isHighlighted: true,
      features: JSON.stringify([
        { label: "كل ما في باقة START", included: true },
        { label: "تمارين وتصحيحات إضافية", included: true },
        { label: "نماذج امتحانات حصرية", included: true },
        { label: "موارد وملفات حصرية (بنك المصطلحات…)", included: true },
        { label: "اختبارات متقدّمة بأسئلة تطبيقية", included: true },
        { label: "تصحيح أعمالك من الأستاذ", included: true },
        { label: "مساحة دعم ومتابعة خاصة", included: true },
        { label: "أولوية في الإجابة عن الأسئلة", included: true },
      ]),
      capabilities: JSON.stringify({
        lessons: true,
        quizzes: true,
        certificate: true,
        premiumResources: true,
        extraExams: true,
        assignmentReview: true,
        prioritySupport: true,
      }),
    },
  });

  console.log(`  ✓ الباقات: ${startPlan.code}، ${premiumPlan.code}`);

  // ── البرنامج ──
  const course = await db.course.upsert({
    where: { slug: "manhajiyat-tarikh-jughrafiya" },
    update: {},
    create: {
      slug: "manhajiyat-tarikh-jughrafiya",
      title: "الدليل الشامل لمنهجية الإجابة في التاريخ والجغرافيا",
      subtitle: "برنامج تدريبي مسجّل لطلبة البكالوريا — ابدأ متى شئت",
      description:
        "برنامج تدريبي مسجّل بالفيديو، تبدأه فور التسجيل وتتقدّم فيه بالوتيرة التي تناسبك، يأخذ بيدك من الصفر إلى إتقان منهجية الإجابة في مادتي التاريخ والجغرافيا: الإنشاء التاريخي، التعليق على الوثائق، المقالة الجغرافية، وإنجاز المبيانات وقراءتها.",
      instructor: "الأستاذ زكريا سي",
      durationText: "بإيقاعك — حوالي شهرين",
      isPublished: true,
    },
  });
  console.log(`  ✓ البرنامج: ${course.title}`);

  // نظّف الشجرة القديمة حتى تكون البذرة قابلة لإعادة التشغيل
  await db.track.deleteMany({ where: { courseId: course.id } });

  const tracks = [historyTrack, geographyTrack];
  let lessonTotal = 0;

  for (const [ti, trackSeed] of tracks.entries()) {
    const track = await db.track.create({
      data: {
        courseId: course.id,
        slug: trackSeed.slug,
        title: trackSeed.title,
        description: trackSeed.description,
        color: trackSeed.color,
        order: ti,
      },
    });

    for (const [mi, modSeed] of trackSeed.modules.entries()) {
      const mod = await db.module.create({
        data: {
          trackId: track.id,
          title: modSeed.title,
          description: modSeed.description,
          order: mi,
        },
      });

      for (const [li, lesson] of modSeed.lessons.entries()) {
        const created = await db.lesson.create({
          data: {
            moduleId: mod.id,
            title: lesson.title,
            slug: slugify(`${trackSeed.slug}-${mi + 1}`, li + 1),
            order: li,
            contentType: "video",
            videoProvider: "youtube",
            videoUrl: "",
            durationMinutes: lesson.minutes,
            summary: lesson.summary,
            objectives: JSON.stringify(lesson.objectives),
            content: `<p>${lesson.summary}</p><p>تابع الفيديو بتركيز، ثم أنجز التمرين المرفق قبل الانتقال إلى الدرس التالي.</p>`,
            exercise:
              li % 3 === 0
                ? "طبّق ما ورد في الدرس على موضوع من اختيارك، ثم قارن عملك بالنموذج المرفق."
                : null,
            requiredPlan: lesson.premium ? "premium" : "start",
            isFreePreview: Boolean(lesson.preview),
          },
        });
        lessonTotal += 1;

        // مورد افتراضي لكل درس
        await db.lessonResource.create({
          data: {
            lessonId: created.id,
            title: `ملخّص الدرس — ${lesson.title}.pdf`,
            type: "pdf",
            url: "/uploads/placeholder.pdf",
            sizeLabel: "PDF",
            order: 0,
            requiredPlan: "start",
          },
        });
        if (lesson.premium || li === modSeed.lessons.length - 1) {
          await db.lessonResource.create({
            data: {
              lessonId: created.id,
              title: "تمارين إضافية مع التصحيح (حصري PREMIUM).pdf",
              type: "pdf",
              url: "/uploads/placeholder.pdf",
              sizeLabel: "PDF",
              order: 1,
              requiredPlan: "premium",
            },
          });
        }
      }

      // ── اختبار الوحدة ──
      const quiz = await db.quiz.create({
        data: {
          moduleId: mod.id,
          title: modSeed.quiz.title,
          description:
            "اختبار قصير للتأكد من استيعابك لدروس الوحدة قبل الانتقال إلى الوحدة التالية.",
          passScore: modSeed.quiz.passScore,
          maxAttempts: 0,
          timeLimitMinutes: 0,
        },
      });

      for (const [qi, q] of modSeed.quiz.questions.entries()) {
        const question = await db.question.create({
          data: {
            quizId: quiz.id,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            points: q.points ?? 1,
            order: qi,
            acceptedAnswers: q.accepted ? JSON.stringify(q.accepted) : null,
          },
        });
        if (q.options?.length) {
          await db.option.createMany({
            data: q.options.map((o, oi) => ({
              questionId: question.id,
              text: o.text,
              isCorrect: Boolean(o.correct),
              order: oi,
            })),
          });
        }
      }
    }
    console.log(`  ✓ المسار: ${trackSeed.title} (${trackSeed.modules.length} وحدات)`);
  }

  console.log(`  ✓ مجموع الدروس: ${lessonTotal}`);

  // ── حساب المسؤول ──
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@bacarabe.sn";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@2026";
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME ?? "الأستاذ زكريا سي",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "admin",
    },
  });
  // لا نطبع كلمة مرور الإنتاج: سجلّات الاستضافة تُحفَظ وتُشارَك
  console.log(
    isProduction
      ? `  ✓ المسؤول: ${adminEmail} (كلمة المرور من ADMIN_PASSWORD)`
      : `  ✓ المسؤول: ${adminEmail} / ${adminPassword}`,
  );

  // ── طالب تجريبي باشتراك نشِط ──
  // كلمة مروره معروفة في الكود، فلا يُنشأ على الإنتاج إلا بطلب صريح
  if (!isProduction || process.env.SEED_DEMO === "1") {
    const demo = await db.user.upsert({
      where: { email: "student@bacarabe.sn" },
      update: {},
      create: {
        email: "student@bacarabe.sn",
        name: "أمينة ديوب",
        phone: "+221770000000",
        passwordHash: await bcrypt.hash("Student@2026", 12),
        role: "student",
      },
    });
    await db.subscription.upsert({
      where: { userId_courseId: { userId: demo.id, courseId: course.id } },
      update: { status: "active", planId: premiumPlan.id, startedAt: new Date() },
      create: {
        userId: demo.id,
        courseId: course.id,
        planId: premiumPlan.id,
        status: "active",
        startedAt: new Date(),
      },
    });
    console.log("  ✓ طالب تجريبي: student@bacarabe.sn / Student@2026");
  } else {
    console.log("  — تُخطّي الطالب التجريبي (إنتاج)");
  }

  // ── الإعدادات الافتراضية ──
  const settings: [string, unknown, string][] = [
    ["learning.sequential", true, "learning"],
    ["learning.sequentialAcrossTracks", true, "learning"],
    ["learning.requireQuizToAdvance", true, "learning"],
    ["quiz.defaultPassScore", 70, "quiz"],
    ["certificate.enabled", true, "certificate"],
    ["site.whatsapp", "+212632092292", "site"],
  ];
  for (const [key, value, group] of settings) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value), group },
    });
  }

  console.log("✅ تمّ البذر بنجاح.");
}

main()
  .catch((e) => {
    console.error("❌ فشل البذر:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
