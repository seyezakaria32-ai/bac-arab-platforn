import { BRAND } from "@/lib/constants";

/**
 * أنواع أقسام الصفحة الرئيسية: حقول كل نوع ومحتواه الافتراضي.
 *
 * ملف مشترك بين الخادم والمتصفّح (لا قاعدة بيانات هنا): نموذج التحرير في
 * لوحة الإدارة يُبنى من الحقول نفسها التي يتحقّق منها الخادم عند الحفظ، ويرسم
 * بها الموقع. إضافة نوع قسم جديد = إضافته هنا وإضافة مكوّن عرضه، بلا نموذج
 * تحرير جديد.
 *
 * المحتوى الافتراضي للأقسام الأصلية مطابق حرفيًا لما كانت تعرضه الصفحة قبل
 * أن تصير قابلة للتحرير — فلا يتغيّر شيء عند النشر حتى يعدّل المدير.
 */

/* ───────────────────────────── الحقول ───────────────────────────── */

export type FieldDef =
  | { kind: "text"; name: string; label: string; placeholder?: string; hint?: string; max?: number }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; hint?: string; rows?: number; max?: number }
  | { kind: "link"; name: string; label: string; hint?: string }
  | { kind: "image"; name: string; label: string; hint?: string; aspect?: string }
  | { kind: "select"; name: string; label: string; hint?: string; options: { value: string; label: string }[] }
  | { kind: "icon"; name: string; label: string }
  | {
      kind: "list";
      name: string;
      label: string;
      itemLabel: string;
      hint?: string;
      fields: FieldDef[];
      min?: number;
      max?: number;
    };

export type SectionValues = Record<string, unknown>;

/** ما يظهر على الموقع حول القسم: لون خلفيته وهامشه السفلي — لتنسيق ما يوضع بعده */
export type Surface = "cream" | "white" | "brand";
export type BottomSpace = "lg" | "md" | "none";

export const ICON_KEYS = [
  "clock", "users", "target", "award", "book", "map", "document", "playCircle",
  "pieChart", "chart", "sparkle", "shield", "check", "checkCircle", "wallet",
  "download", "whatsapp", "lock", "settings",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export const BOLD_HINT = "ضع الكلمة بين نجمتين **هكذا** لتظهر بخطّ عريض.";
export const COUNTS_HINT = "يمكنك كتابة {lessons} و{modules} و{hours} فتُستبدل بعدد الدروس والوحدات والساعات.";

/* ───────────────────────────── الأنواع ───────────────────────────── */

export const SECTION_TYPES = [
  "hero", "features", "video", "about", "learn", "curriculum", "steps", "plans", "faq", "final",
  "text", "textImage", "cards", "testimonials", "videoEmbed",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export type SectionTypeDef = {
  type: SectionType;
  label: string;
  description: string;
  icon: IconKey;
  /** يمكن إضافته أكثر من مرّة */
  multiple: boolean;
  fields: FieldDef[];
  defaults: SectionValues;
  /** الخلفية: ثابتة، أو من حقل background للأقسام الجديدة */
  surface: Surface | "fromData";
  bottom: BottomSpace;
  /** ما يُعرض فوق الحقول في المحرّر — مصدر المحتوى إن لم يكن هنا */
  editorNote?: string;
};

const menuField: FieldDef = {
  kind: "text",
  name: "menuLabel",
  label: "اسمه في القائمة العلوية",
  hint: "اتركه فارغًا كي لا يظهر في القائمة العلوية ولا في روابط أسفل الصفحة.",
  max: 30,
};

const backgroundField: FieldDef = {
  kind: "select",
  name: "background",
  label: "لون خلفية القسم",
  options: [
    { value: "cream", label: "كريمي (لون الصفحة)" },
    { value: "white", label: "أبيض" },
    { value: "brand", label: "فيروزي داكن (لون الهوية)" },
  ],
};

const heading = (defaults: { eyebrow?: string; title?: string; description?: string }): FieldDef[] => [
  { kind: "text", name: "eyebrow", label: "الشارة الصغيرة فوق العنوان", hint: "اتركها فارغة لإخفائها.", max: 50 },
  { kind: "text", name: "title", label: "العنوان", max: 140 },
  ...(defaults.description !== undefined
    ? [{ kind: "textarea", name: "description", label: "الوصف تحت العنوان", rows: 2, max: 400 } as FieldDef]
    : []),
];

const paragraphs: FieldDef = {
  kind: "list",
  name: "paragraphs",
  label: "الفقرات",
  itemLabel: "فقرة",
  hint: BOLD_HINT,
  min: 1,
  max: 8,
  fields: [{ kind: "textarea", name: "text", label: "نصّ الفقرة", rows: 4, max: 2000 }],
};

const buttonFields = (prefix: string, label: string): FieldDef[] => [
  { kind: "text", name: `${prefix}Label`, label: `نصّ ${label}`, hint: "اتركه فارغًا لإخفاء الزرّ.", max: 40 },
  { kind: "link", name: `${prefix}Link`, label: `رابط ${label}` },
];

const trackColor: FieldDef = {
  kind: "select",
  name: "color",
  label: "لون الشريط",
  options: [
    { value: "ink", label: "داكن" },
    { value: "brand", label: "فيروزي" },
    { value: "gold", label: "ذهبي" },
  ],
};

const iconCard: FieldDef[] = [
  { kind: "icon", name: "icon", label: "الأيقونة" },
  { kind: "text", name: "title", label: "العنوان", max: 80 },
  { kind: "textarea", name: "text", label: "النصّ", rows: 2, max: 300 },
];

export const SECTION_DEFS: Record<SectionType, SectionTypeDef> = {
  /* ═════════════════════ الأقسام الأصلية ═════════════════════ */
  hero: {
    type: "hero",
    label: "الواجهة الأولى",
    description: "أعلى الصفحة: العنوان الرئيسي، الوصف، زرّا البداية، الأرقام، وبطاقة الأستاذ.",
    icon: "sparkle",
    multiple: false,
    surface: "brand",
    bottom: "none",
    fields: [
      { kind: "text", name: "badge", label: "الشارة أعلى العنوان", max: 80 },
      { kind: "text", name: "title", label: "العنوان الرئيسي", max: 120 },
      { kind: "text", name: "highlight", label: "السطر الملوّن تحت العنوان", max: 120 },
      { kind: "textarea", name: "description", label: "الوصف", rows: 5, hint: BOLD_HINT, max: 1200 },
      ...buttonFields("primary", "الزرّ الأوّل"),
      ...buttonFields("secondary", "الزرّ الثاني"),
      {
        kind: "select",
        name: "showStats",
        label: "الأرقام (الدروس، الوحدات، الساعات)",
        options: [
          { value: "yes", label: "تظهر" },
          { value: "no", label: "مخفية" },
        ],
      },
      { kind: "text", name: "statLessons", label: "تسمية عدد الدروس", max: 30 },
      { kind: "text", name: "statModules", label: "تسمية عدد الوحدات", max: 30 },
      { kind: "text", name: "statHours", label: "تسمية عدد الساعات", max: 30 },
      { kind: "image", name: "image", label: "صورة البطاقة", aspect: "760 / 426", hint: "عرضية ≈ 16:9. احذفها لإخفاء البطاقة كلّها." },
      { kind: "text", name: "imageAlt", label: "وصف الصورة", max: 120 },
      {
        kind: "list",
        name: "bio",
        label: "أسطر التعريف تحت الصورة",
        itemLabel: "سطر",
        max: 6,
        fields: [{ kind: "text", name: "text", label: "السطر", max: 120 }],
      },
      menuField,
    ],
    defaults: {
      badge: "التسجيل مفتوح · ابدأ فورًا وتعلّم بإيقاعك",
      title: BRAND.programTitle,
      highlight: BRAND.programSubtitle,
      description:
        "برنامج تدريبي مسجّل بالفيديو لطلبة البكالوريا، تبدأه متى شئت ويأخذ بيدك خطوة بخطوة لإتقان **منهجية الإجابة** في التاريخ والجغرافيا: الإنشاء التاريخي، التعليق على الوثائق، المقالة الجغرافية، وإنجاز المبيانات وقراءتها — حتى تدخل الامتحان وأنت تعرف تمامًا ما ينتظره منك المصحّح.",
      primaryLabel: "ابدأ البرنامج",
      primaryLink: "#plans",
      secondaryLabel: "اكتشف البرنامج",
      secondaryLink: "#curriculum",
      showStats: "yes",
      statLessons: "درسًا مسجّلًا",
      statModules: "وحدات تدريبية",
      statHours: "ساعة تكوين",
      image: "/brand/instructor.png",
      imageAlt: `${BRAND.instructor} — المدرّس في البرنامج`,
      bio: BRAND.instructorBio.map((text) => ({ text })),
      menuLabel: "",
    },
  },

  features: {
    type: "features",
    label: "شريط المزايا",
    description: "بطاقات قصيرة تحت الواجهة الأولى مباشرة.",
    icon: "checkCircle",
    multiple: false,
    surface: "cream",
    bottom: "none",
    fields: [
      {
        kind: "list",
        name: "items",
        label: "المزايا",
        itemLabel: "ميزة",
        min: 1,
        max: 8,
        fields: [
          { kind: "icon", name: "icon", label: "الأيقونة" },
          { kind: "text", name: "title", label: "العنوان", max: 60 },
          { kind: "text", name: "text", label: "الوصف", max: 120 },
        ],
      },
      menuField,
    ],
    defaults: {
      items: [
        { icon: "clock", title: "بإيقاعك الخاص", text: "ابدأ متى شئت، وتعلّم في أي وقت" },
        { icon: "users", title: "طلبة البكالوريا", text: "محتوى مُفصَّل على الامتحان الوطني" },
        { icon: "target", title: "تدرّج إجباري", text: "درس بعد درس، بلا قفز فوق الأساسيات" },
        { icon: "award", title: "إثبات إتمام", text: "شهادة عند إكمال البرنامج" },
      ],
      menuLabel: "",
    },
  },

  video: {
    type: "video",
    label: "الفيديو التعريفي",
    description: "فيديو تقدّم فيه نفسك والبرنامج. لا يظهر ما دام رابط الفيديو فارغًا.",
    icon: "playCircle",
    multiple: false,
    surface: "cream",
    bottom: "none",
    editorNote: "الفيديو نفسه (الرابط أو الملف المرفوع، العنوان، الوصف، صورة الغلاف) يُضبط من النموذج أعلاه.",
    fields: [
      { kind: "text", name: "badge", label: "الشارة فوق العنوان", max: 50 },
      ...buttonFields("cta", "الزرّ تحت الفيديو"),
      menuField,
    ],
    defaults: {
      badge: "فيديو تعريفي",
      ctaLabel: "سجّل الآن وابدأ الدرس الأول",
      ctaLink: "#plans",
      menuLabel: "",
    },
  },

  about: {
    type: "about",
    label: "عن البرنامج",
    description: "تعريف بالبرنامج في فقرات، وبطاقات معلومات قصيرة، وبجانبها سلايدر الملصقات.",
    icon: "book",
    multiple: false,
    surface: "cream",
    bottom: "lg",
    editorNote: "الصور بجانب النصّ سلايدر يُدار من صفحة «السلايدر».",
    fields: [
      ...heading({}),
      paragraphs,
      {
        kind: "list",
        name: "facts",
        label: "بطاقات المعلومات",
        itemLabel: "بطاقة",
        max: 8,
        fields: [
          { kind: "text", name: "label", label: "التسمية", max: 40 },
          { kind: "text", name: "value", label: "القيمة", max: 60 },
        ],
      },
      menuField,
    ],
    defaults: {
      eyebrow: "عن البرنامج",
      title: "ابدأ اليوم، وتعلّم بالوتيرة التي تناسبك",
      paragraphs: [
        {
          text: "معظم الطلبة لا يخسرون النقط لأنهم لا يعرفون الدروس، بل لأنهم لا يعرفون **كيف يكتبون** ما يعرفونه. هذا البرنامج مبنيّ على هذه الملاحظة بالضبط: تدريب عملي على منهجية الإجابة، لا حفظًا إضافيًا للمقرّر.",
        },
        {
          text: "البرنامج مسجّل بالكامل ومتاح لك **فور التسجيل**: لا دفعات ولا مواعيد ثابتة، تدخل متى شئت وتتقدّم بالوتيرة التي تناسب برنامج مراجعتك — وحدة تلو الأخرى، ودرسًا بعد درس، مع تمارين تطبيقية واختبار في نهاية كل وحدة. ولمن يريد خطة واضحة، يُنجَز البرنامج في حوالي **شهرين** بمعدّل درس يوميًا تقريبًا.",
        },
        {
          text: "كل درس يأتي مع فيديو شرح، ملخّص مكتوب، أهداف واضحة، وملفات مرفقة — وتُحفظ نقطة توقّفك تلقائيًا حتى تعود إليها متى شئت.",
        },
      ],
      facts: [
        { label: "بداية الدراسة", value: "فور التسجيل" },
        { label: "مدّة الوصول", value: "طوال موسم البكالوريا" },
        { label: "الوتيرة المقترحة", value: BRAND.duration },
        { label: "الفئة المستهدفة", value: BRAND.audience },
      ],
      menuLabel: "عن البرنامج",
    },
  },

  learn: {
    type: "learn",
    label: "ماذا ستتعلّم؟",
    description: "المساران (التاريخ والجغرافيا) وما يتعلّمه الطالب في كلّ منهما.",
    icon: "map",
    multiple: false,
    surface: "white",
    bottom: "lg",
    fields: [
      ...heading({ description: "" }),
      {
        kind: "list",
        name: "tracks",
        label: "المسارات",
        itemLabel: "مسار",
        min: 1,
        max: 4,
        fields: [
          { kind: "text", name: "title", label: "عنوان المسار", max: 60 },
          { kind: "icon", name: "icon", label: "أيقونة المسار" },
          trackColor,
          {
            kind: "list",
            name: "items",
            label: "المحاور",
            itemLabel: "محور",
            max: 10,
            fields: iconCard,
          },
        ],
      },
      menuField,
    ],
    defaults: {
      eyebrow: "ماذا ستتعلّم؟",
      title: "مساران متكاملان: التاريخ والجغرافيا",
      description:
        "ستة محاور كبرى تغطّي كل ما يُطلب منك في ورقة الامتحان، من أول سطر في المقدمة إلى آخر خط في المبيان.",
      tracks: [
        {
          title: "أولًا: التاريخ",
          icon: "book",
          color: "ink",
          items: [
            { icon: "document", title: "منهجية كتابة الإنشاء التاريخي", text: "المقدمة، العرض، الخاتمة — ببناء متماسك وأخطاء شائعة تتفاداها." },
            { icon: "playCircle", title: "التعليق على الوثائق التاريخية", text: "من تقديم الوثيقة إلى التقويم النقدي، مع وثيقة واحدة أو عدّة وثائق." },
            { icon: "award", title: "المقالة التاريخية: فن البناء والتحرير", text: "تحويل المعطيات إلى مقالة، وفهم شبكة التقويم التي يصحّح بها الأستاذ." },
          ],
        },
        {
          title: "ثانيًا: الجغرافيا",
          icon: "map",
          color: "brand",
          items: [
            { icon: "document", title: "تقنيات كتابة المقالة الجغرافية", text: "لغة المادة ومصطلحاتها، والمعطيات الرقمية في مكانها الصحيح." },
            { icon: "pieChart", title: "قراءة وإنجاز المبيانات", text: "الدائري، نصف الدائري، الأعمدة، المنحنى — رسمًا دقيقًا خطوة بخطوة." },
            { icon: "chart", title: "منهجية التعليق في الجغرافيا", text: "وصف، تفسير، استنتاج — مع بنك مصطلحات جاهز للتوظيف." },
          ],
        },
      ],
      menuLabel: "ماذا ستتعلّم؟",
    },
  },

  curriculum: {
    type: "curriculum",
    label: "محتوى البرنامج",
    description: "كل الوحدات والدروس — تُقرأ من «المحتوى» في لوحة الإدارة.",
    icon: "document",
    multiple: false,
    surface: "cream",
    bottom: "lg",
    editorNote: "الوحدات والدروس نفسها تُضاف وتُعدَّل من صفحة «المحتوى».",
    fields: [
      ...heading({ description: "" }),
      { kind: "text", name: "emptyText", label: "النصّ حين لا توجد دروس بعد", max: 120 },
      menuField,
    ],
    defaults: {
      eyebrow: "المنهج الدراسي",
      title: "محتوى البرنامج كاملًا أمامك",
      description: "اطّلع على كل وحدة ودرس قبل أن تسجّل. لا شيء مخفيّ — تعرف بالضبط ما الذي ستحصل عليه.",
      emptyText: "لم تُضَف الدروس بعد.",
      menuLabel: "المنهج",
    },
  },

  steps: {
    type: "steps",
    label: "خطوات مرقّمة",
    description: "خطوات متتالية بأرقام، مثل «كيف يعمل البرنامج؟».",
    icon: "target",
    multiple: true,
    surface: "white",
    bottom: "lg",
    fields: [
      ...heading({ description: "" }),
      {
        kind: "list",
        name: "items",
        label: "الخطوات",
        itemLabel: "خطوة",
        min: 1,
        max: 8,
        fields: [
          { kind: "text", name: "title", label: "العنوان", max: 60 },
          { kind: "textarea", name: "text", label: "الشرح", rows: 2, max: 300 },
        ],
      },
      menuField,
    ],
    defaults: {
      eyebrow: "كيف يعمل البرنامج؟",
      title: "مسار واضح من التسجيل إلى الشهادة",
      description: "نظام تدرّج إجباري يمنعك من القفز فوق الأساسيات — وهذا بالضبط ما يصنع الفرق.",
      items: [
        { title: "سجّل واختر باقتك", text: "أنشئ حسابك، اختر START أو PREMIUM ELITE، وادفع بالطريقة المناسبة لك." },
        { title: "ادخل لوحتك", text: "يُفعَّل البرنامج تلقائيًا بعد تأكيد الدفع، وتبدأ من الدرس الأول." },
        { title: "درسًا بعد درس", text: "شاهد، طبّق، ثم اضغط «إتمام الدرس» ليُفتح لك الدرس التالي." },
        { title: "اختبر ثم تقدّم", text: "في نهاية كل وحدة اختبار قصير؛ باجتيازه تُفتح الوحدة التالية." },
      ],
      menuLabel: "",
    },
  },

  plans: {
    type: "plans",
    label: "الباقات",
    description: "بطاقات الباقات وأسعارها — تُقرأ من «الباقات» في لوحة الإدارة.",
    icon: "wallet",
    multiple: false,
    surface: "cream",
    bottom: "lg",
    editorNote: "أسماء الباقات وأسعارها ومزاياها تُعدَّل من صفحة «الباقات».",
    fields: [
      ...heading({ description: "" }),
      { kind: "text", name: "subscribeLabel", label: "نصّ زرّ الاشتراك", max: 30 },
      { kind: "text", name: "oneTimeNote", label: "السطر تحت السعر (دفعة واحدة)", max: 100 },
      { kind: "text", name: "monthlyNote", label: "السطر تحت السعر (اشتراك شهري)", max: 100 },
      { kind: "text", name: "note", label: "الملاحظة أسفل الباقات", max: 200 },
      menuField,
    ],
    defaults: {
      eyebrow: "الباقات",
      title: "اختر ما يناسب جدّيتك",
      description: "الباقتان تفتحان لك البرنامج كاملًا. الفرق في المرافقة والموارد الإضافية.",
      subscribeLabel: "اشترك الآن",
      oneTimeNote: "دفعة واحدة · وصول طوال موسم البكالوريا",
      monthlyNote: "اشتراك شهري · جدّده متى شئت، وتقدّمك محفوظ",
      note: "لا يُفتح محتوى البرنامج قبل تأكيد عملية الدفع — حسابك ومعلوماتك محميّة.",
      menuLabel: "الباقات",
    },
  },

  faq: {
    type: "faq",
    label: "أسئلة وأجوبة",
    description: "أسئلة تنفتح أجوبتها عند النقر.",
    icon: "document",
    multiple: true,
    surface: "white",
    bottom: "lg",
    fields: [
      ...heading({}),
      {
        kind: "list",
        name: "items",
        label: "الأسئلة",
        itemLabel: "سؤال",
        min: 1,
        max: 40,
        fields: [
          { kind: "text", name: "q", label: "السؤال", max: 200 },
          { kind: "textarea", name: "a", label: "الجواب", rows: 4, max: 2000 },
        ],
      },
      menuField,
    ],
    defaults: {
      eyebrow: "أسئلة شائعة",
      title: "كل ما قد يدور في ذهنك",
      items: [
        { q: "متى أبدأ؟ وكم يستغرق البرنامج؟", a: "تبدأ فور تفعيل حسابك، في أي يوم وأي ساعة — لا توجد دفعات ولا مواعيد ثابتة. الدروس مسجّلة ومتاحة لك طوال موسم البكالوريا، فتتقدّم بالوتيرة التي تناسب برنامج مراجعتك. ولمن يريد خطة واضحة: يُنجَز البرنامج في حوالي شهرين بمعدّل درس يوميًا تقريبًا." },
        { q: "هل أستطيع فتح كل الدروس مباشرة بعد التسجيل؟", a: "لا. البرنامج يعتمد التدرّج الإجباري: تُفتح لك الدروس واحدًا تلو الآخر بعد إتمام السابق، وفي نهاية كل وحدة تجتاز اختبارًا قصيرًا قبل فتح الوحدة التالية. هذا النظام مقصود، لأنه يمنع القفز فوق الأساسيات ويضمن ترسيخ المنهجية." },
        { q: "ماذا يحدث إذا خرجت من المنصّة ثم عدت لاحقًا؟", a: "يُحفظ تقدّمك تلقائيًا في حسابك. عند عودتك تجد زر «متابعة التعلّم» يعيدك مباشرة إلى الدرس الذي توقّفت عنده." },
        { q: "هل الدفع مرّة واحدة؟ وإلى متى يبقى وصولي؟", a: "نعم، تدفع مرّة واحدة فقط، ويبقى وصولك مفتوحًا طوال موسم البكالوريا حتى نهاية الامتحانات. بعدها يُقفل الوصول، لكن تقدّمك ونتائج اختباراتك تبقى محفوظة إن اشتركت في موسم لاحق." },
        { q: "ما الفرق بين باقة START وباقة PREMIUM ELITE؟", a: "باقة START تمنحك كامل الدروس المسجّلة واختبارات الوحدات وملفات الدروس الأساسية وإثبات إتمام البرنامج. أمّا PREMIUM ELITE فتضيف تمارين وتصحيحات إضافية، نماذج امتحانات حصرية، موارد وملفات خاصة، اختبارات أكثر تقدّمًا، تصحيح أعمالك، ومساحة دعم ومتابعة خاصة." },
        { q: "ماذا لو لم أنجح في اختبار الوحدة؟", a: "لا مشكلة إطلاقًا. تظهر لك رسالة تدعوك إلى مراجعة الدروس، ويمكنك إعادة المحاولة. الهدف من الاختبار هو التأكد من استيعابك، وليس إقصاؤك." },
        { q: "كيف أدفع رسوم التسجيل؟", a: "يمكنك الدفع عبر Wave أو Orange Money أو بطاقة بنكية. وإن اخترت التحويل اليدوي، ترفع صورة الإيصال ويُفعَّل حسابك بعد التحقّق. لا يُفتح المحتوى قبل تأكيد الدفع." },
        { q: "هل أحصل على شهادة في نهاية البرنامج؟", a: "نعم، بعد إتمام جميع الدروس واجتياز اختبارات الوحدات تحصل على إثبات إتمام البرنامج في صفحة حسابك." },
      ],
      menuLabel: "أسئلة شائعة",
    },
  },

  final: {
    type: "final",
    label: "نداء ختامي",
    description: "صندوق ملوّن بعنوان قويّ وزرّين يدعو الزائر إلى التسجيل.",
    icon: "award",
    multiple: true,
    surface: "cream",
    bottom: "md",
    fields: [
      { kind: "text", name: "badge", label: "الشارة", hint: "اتركها فارغة لإخفائها.", max: 50 },
      { kind: "text", name: "title", label: "العنوان", max: 120 },
      { kind: "textarea", name: "text", label: "النصّ", rows: 3, hint: `${BOLD_HINT} ${COUNTS_HINT}`, max: 600 },
      ...buttonFields("primary", "الزرّ الأوّل"),
      ...buttonFields("secondary", "الزرّ الثاني"),
      menuField,
    ],
    defaults: {
      badge: "التسجيل مفتوح",
      title: "الامتحان لن ينتظرك. ابدأ اليوم.",
      text: "{lessons} درسًا مصمَّمة خصّيصًا لترفع نقطتك في التاريخ والجغرافيا — بمنهجية واضحة وتدرّج منظّم.",
      primaryLabel: "سجّل الآن",
      primaryLink: "#plans",
      secondaryLabel: "لديّ حساب بالفعل",
      secondaryLink: "/login",
      menuLabel: "",
    },
  },

  /* ═════════════════════ أقسام جديدة ═════════════════════ */
  text: {
    type: "text",
    label: "نصّ",
    description: "عنوان وفقرات — لرسالة، أو إعلان، أو شرح.",
    icon: "document",
    multiple: true,
    surface: "fromData",
    bottom: "lg",
    fields: [
      ...heading({}),
      paragraphs,
      {
        kind: "select",
        name: "align",
        label: "محاذاة النصّ",
        options: [
          { value: "center", label: "في المنتصف" },
          { value: "start", label: "من اليمين" },
        ],
      },
      backgroundField,
      menuField,
    ],
    defaults: {
      eyebrow: "",
      title: "عنوان القسم",
      paragraphs: [{ text: "اكتب هنا نصّ القسم. ضع الكلمات المهمّة بين نجمتين **هكذا** لتظهر بخطّ عريض." }],
      align: "center",
      background: "cream",
      menuLabel: "",
    },
  },

  textImage: {
    type: "textImage",
    label: "نصّ وصورة",
    description: "صورة بجانب عنوان وفقرات، مع زرّ اختياري.",
    icon: "playCircle",
    multiple: true,
    surface: "fromData",
    bottom: "lg",
    fields: [
      ...heading({}),
      paragraphs,
      { kind: "image", name: "image", label: "الصورة", hint: "تظهر كاملة دون قصّ." },
      { kind: "text", name: "imageAlt", label: "وصف الصورة", max: 120 },
      {
        kind: "select",
        name: "imageSide",
        label: "مكان الصورة على الحاسوب",
        options: [
          { value: "end", label: "يسار النصّ" },
          { value: "start", label: "يمين النصّ" },
        ],
      },
      ...buttonFields("button", "الزرّ"),
      backgroundField,
      menuField,
    ],
    defaults: {
      eyebrow: "",
      title: "عنوان القسم",
      paragraphs: [{ text: "اكتب هنا نصّ القسم." }],
      image: "/brand/poster-program.jpg",
      imageAlt: "",
      imageSide: "end",
      buttonLabel: "",
      buttonLink: "",
      background: "cream",
      menuLabel: "",
    },
  },

  cards: {
    type: "cards",
    label: "بطاقات",
    description: "شبكة بطاقات بأيقونة وعنوان ونصّ — لمزايا أو خدمات أو أرقام.",
    icon: "checkCircle",
    multiple: true,
    surface: "fromData",
    bottom: "lg",
    fields: [
      ...heading({ description: "" }),
      {
        kind: "select",
        name: "columns",
        label: "عدد البطاقات في السطر (على الحاسوب)",
        options: [
          { value: "2", label: "بطاقتان" },
          { value: "3", label: "ثلاث بطاقات" },
          { value: "4", label: "أربع بطاقات" },
        ],
      },
      {
        kind: "list",
        name: "items",
        label: "البطاقات",
        itemLabel: "بطاقة",
        min: 1,
        max: 12,
        fields: iconCard,
      },
      backgroundField,
      menuField,
    ],
    defaults: {
      eyebrow: "",
      title: "عنوان القسم",
      description: "",
      columns: "3",
      items: [
        { icon: "target", title: "عنوان البطاقة", text: "نصّ قصير يشرح الفكرة." },
        { icon: "award", title: "عنوان البطاقة", text: "نصّ قصير يشرح الفكرة." },
        { icon: "clock", title: "عنوان البطاقة", text: "نصّ قصير يشرح الفكرة." },
      ],
      background: "white",
      menuLabel: "",
    },
  },

  testimonials: {
    type: "testimonials",
    label: "آراء الطلبة",
    description: "شهادات طلبتك بأسمائهم وصورهم (اختيارية).",
    icon: "users",
    multiple: true,
    surface: "fromData",
    bottom: "lg",
    fields: [
      ...heading({}),
      {
        kind: "list",
        name: "items",
        label: "الآراء",
        itemLabel: "رأي",
        min: 1,
        max: 12,
        fields: [
          { kind: "textarea", name: "quote", label: "ما قاله الطالب", rows: 3, max: 600 },
          { kind: "text", name: "name", label: "الاسم", max: 60 },
          { kind: "text", name: "role", label: "الصفة", placeholder: "مثال: طالب بكالوريا 2026", max: 60 },
          { kind: "image", name: "photo", label: "الصورة (اختيارية)", aspect: "1 / 1" },
        ],
      },
      backgroundField,
      menuField,
    ],
    defaults: {
      eyebrow: "آراء الطلبة",
      title: "ماذا يقول طلبتنا؟",
      items: [
        { quote: "اكتب هنا رأي أحد طلبتك كما قاله.", name: "اسم الطالب", role: "طالب بكالوريا", photo: "" },
        { quote: "اكتب هنا رأي طالب آخر.", name: "اسم الطالب", role: "طالبة بكالوريا", photo: "" },
      ],
      background: "cream",
      menuLabel: "",
    },
  },

  videoEmbed: {
    type: "videoEmbed",
    label: "فيديو",
    description: "فيديو من يوتيوب أو فيميو مع عنوان ووصف.",
    icon: "playCircle",
    multiple: true,
    surface: "fromData",
    bottom: "lg",
    fields: [
      ...heading({ description: "" }),
      { kind: "link", name: "url", label: "رابط الفيديو", hint: "ألصق رابط يوتيوب أو فيميو كاملًا. لا يظهر القسم ما دام الرابط فارغًا." },
      backgroundField,
      menuField,
    ],
    defaults: {
      eyebrow: "",
      title: "عنوان الفيديو",
      description: "",
      url: "",
      background: "cream",
      menuLabel: "",
    },
  },
};

/** الترتيب الأصلي للصفحة الرئيسية — يُنشأ عند أوّل تشغيل */
export const DEFAULT_LAYOUT: SectionType[] = [
  "hero", "features", "video", "about", "learn", "curriculum", "steps", "plans", "faq", "final",
];

/** القيم الكاملة لقسم: المحفوظ فوق الافتراضي (حقل ناقص = قيمته الافتراضية) */
export function mergeValues(type: SectionType, data: SectionValues | null | undefined): SectionValues {
  return { ...SECTION_DEFS[type].defaults, ...(data ?? {}) };
}

export const isSectionType = (t: string): t is SectionType =>
  (SECTION_TYPES as readonly string[]).includes(t);

/** اسم القسم في لوحة الإدارة وفي قوائم أماكن السلايدر والأزرار */
export function sectionName(type: SectionType, values: SectionValues): string {
  const def = SECTION_DEFS[type];
  if (!def.multiple) return def.label;
  const title = typeof values.title === "string" ? values.title.trim() : "";
  return title ? `${def.label}: ${title}` : def.label;
}

export function surfaceOf(type: SectionType, values: SectionValues): Surface {
  const s = SECTION_DEFS[type].surface;
  if (s !== "fromData") return s;
  const bg = values.background;
  return bg === "white" || bg === "brand" ? bg : "cream";
}

/**
 * معرّفات روابط الأقسام الأصلية (#about، #plans…) — ثابتة لأن أزرارًا وروابط
 * كثيرة تشير إليها. الأقسام المضافة تأخذ معرّفًا من رقمها.
 */
const ORIGINAL_ANCHORS: Record<SectionType, string> = {
  hero: "top",
  features: "features",
  video: "video",
  about: "about",
  learn: "learn",
  curriculum: "curriculum",
  steps: "how",
  plans: "plans",
  faq: "faq",
  final: "join",
  text: "text",
  textImage: "text-image",
  cards: "cards",
  testimonials: "testimonials",
  videoEmbed: "watch",
};

/** isOriginal: القسم من الترتيب الأصلي أو نوع لا يتكرّر (له مفتاح ثابت) */
export function anchorOf(type: SectionType, id: string, isOriginal: boolean): string {
  return isOriginal ? ORIGINAL_ANCHORS[type] : `s-${id.slice(-6)}`;
}
