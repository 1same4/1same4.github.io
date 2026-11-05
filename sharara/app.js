// app.js — شرارة (Janabi AI)
// المنطق المتكامل لتطبيق شرارة مع الحفاظ الصارم على اصلاحات دودي:
// 1. الستريك (فرق يوم واحد يزيد، اكثر يرجع 1 عند النشاط، ويوم 0% ما ينحفظ بالسجل).
// 2. سجل واحد لكل يوم (منع تكرار نفس التاريخ في history).
// 3. استخدام textContent و createElement فقط بنص المستخدم وكل عناصر الواجهة (ممنوع innerHTML نهائيا).
// 4. قوائم المهام والعادات تبدأ فاضية تماما بلا قوالب تلقائية، مع امكانية الاضافة والتعديل والحذف.
// 5. مؤقت تركيز قابل للتعديل يحسب على الوقت الفعلي (Date.now()) حتى لو انطفت الشاشة.
// 6. احتفال حقيقي عند 100% (شرارات/كونفيتي، صوت خفيف مع كتم بالاعدادات، اهتزاز، وصعود لاعلى الصفحة).
// 7. بطاقة مشاركة ستوري انستغرام 1080×1920 ومشاركة مباشرة بملف الصورة (navigator.share files).

(function () {
  "use strict";

  const STORAGE_KEY = "sharara_app_v3";

  // القوالب الجاهزة (تشتغل فقط لما المستخدم يضغط عليها باختياره)
  const TEMPLATES = {
    student: {
      name: "طالب امتحانات",
      mainGoal: "مراجعة فصل اساسي وحل اسئلة وزارية او فصلية",
      tasks: [
        "قراءة وتلخيص محاضرة اليوم بتركيز",
        "حل تمرينات او اسئلة الفصل السابق",
        "مراجعة الملاحظات الصعبة لمدة 20 دقيقة"
      ],
      habits: [
        "شرب كلاص مي اول ما اكعد",
        "دراسة بدون تلفون واشعارات",
        "استراحة مشي 15 دقيقة لتجديد النشاط",
        "نوم من وكت قبل الساعة 11 بالليل"
      ]
    },
    employee: {
      name: "موظف",
      mainGoal: "انجاز المهمة الاهم بالدوام قبل الظهر",
      tasks: [
        "ترتيب اولويات الشغل بأول ربع ساعة",
        "انهاء المعاملات او الايميلات المتأخرة",
        "تطوير مهارة مهنية لمدة 20 دقيقة بعد الدوام"
      ],
      habits: [
        "ريوك متوازن قبل الطلعة للدوام",
        "شرب المي بانتظام على المكتب",
        "مشي خفيف بعد الرجعة للبيت",
        "قراءة 10 صفحات بالليل"
      ]
    },
    freelancer: {
      name: "فريلانسر",
      mainGoal: "تسليم مرحلة اساسية من مشروع الزبون الحالي",
      tasks: [
        "جلسة شغل عميق بدون مقاطعة على المشروع",
        "متابعة رسائل وعروض الزبائن بوقت محدد",
        "تحديث معرض الاعمال او تعلم اداة جديدة"
      ],
      habits: [
        "تحديد ساعات بداية ونهاية الشغل",
        "تمارين تمدد للظهر والرقبة كل ساعة",
        "شرب مي كافي وتقليل الكهوة بالليل",
        "ترتيب مكتب الشغل نهاية اليوم"
      ]
    },
    athlete: {
      name: "رياضي",
      mainGoal: "اكمال تمرين اليوم بأداء صحيح وتركيز عالي",
      tasks: [
        "تحضير وجبة غنية بالبروتين والخضرة بعد التمرين",
        "اداء تمارين الاحماء والاطالة كاملة",
        "انجاز المهمة الدراسية او العملية لليوم"
      ],
      habits: [
        "شرب مي كافي قبل وخلال التمرين",
        "اكل بيت نظيف وتجنب المشروبات الغازية",
        "مشي 20 دقيقة بالهوا الطلق",
        "نوم عميق بالليل لاستشفاء العضلات"
      ]
    },
    weekend: {
      name: "يوم عطلة",
      mainGoal: "تجديد الطاقة وترتيب خطة الاسبوع الجاي بهدوء",
      tasks: [
        "كعدة صافية ويا الاهل او الاصدقاء",
        "ترتيب الغرفة والملابس والمكتب للاسبوع الجديد",
        "كتابة اهم 3 اهداف للاسبوع القادم"
      ],
      habits: [
        "تقليل استخدام التلفون والسوشيال ميديا",
        "مشي هادئ بالهوا الطلق",
        "قراءة فصل من كتاب مفيد",
        "نوم مريح من وكت"
      ]
    }
  };

  // 12 شارة انجاز بشروط حقيقية تطابق الوصف وبأيقونات SVG موحدة
  const BADGES_DEF = [
    {
      id: "b1",
      name: "الشرارة الاولى",
      desc: "اكملت اول مهمة او عادة الك بالتطبيق",
      svgType: "flame",
      check: (s) => Boolean((s.mainGoal && s.mainGoal.done) || (s.tasks || []).some((t) => t.done) || (s.habits || []).some((h) => h.done) || (s.history || []).length > 0)
    },
    {
      id: "b2",
      name: "اليوم المتكامل",
      desc: "وصلت لنسبة انجاز 100% بيومك",
      svgType: "star",
      check: (s) => Boolean(s.last100 || calculateTodayPercent(s) === 100 || (s.history || []).some((h) => Number(h.percent) === 100))
    },
    {
      id: "b3",
      name: "شعلة 3 ايام",
      desc: "حافظت على ستريك 3 ايام متتالية",
      svgType: "bolt",
      check: (s) => Number(s.streak || 0) >= 3
    },
    {
      id: "b4",
      name: "اسبوع من النور",
      desc: "حافظت على ستريك 7 ايام متتالية",
      svgType: "shield",
      check: (s) => Number(s.streak || 0) >= 7
    },
    {
      id: "b5",
      name: "نصف شهر ثابت",
      desc: "حافظت على ستريك 14 يوم متتالي",
      svgType: "crown",
      check: (s) => Number(s.streak || 0) >= 14
    },
    {
      id: "b6",
      name: "سيد الشهر",
      desc: "حافظت على ستريك 30 يوم متتالي",
      svgType: "trophy",
      check: (s) => Number(s.streak || 0) >= 30
    },
    {
      id: "b7",
      name: "اول جلسة تركيز",
      desc: "اكملت 25 دقيقة تركيز بالمؤقت",
      svgType: "clock",
      check: (s) => getTotalFocusMinutes(s) >= 25
    },
    {
      id: "b8",
      name: "غواص التركيز",
      desc: "جمعت 100 دقيقة تركيز او اكثر",
      svgType: "target",
      check: (s) => getTotalFocusMinutes(s) >= 100
    },
    {
      id: "b9",
      name: "قناص الاهداف",
      desc: "انجزت الهدف الرئيسي لليوم",
      svgType: "compass",
      check: (s) => Boolean((s.mainGoal && s.mainGoal.done) || (s.history || []).some((h) => h.goalDone))
    },
    {
      id: "b10",
      name: "باني العادات",
      desc: "اكملت كل عاداتك اليومية بيوم واحد",
      svgType: "check",
      check: (s) => Boolean(Array.isArray(s.habits) && s.habits.length > 0 && s.habits.every((h) => h.done))
    },
    {
      id: "b11",
      name: "محاسب نفسه",
      desc: "كتبت مراجعة الليل او قيمت يومك",
      svgType: "book",
      check: (s) => Boolean(s.reflection && (s.reflection.win || s.reflection.learn || s.reflection.grateful || s.reflection.tomorrow || Number(s.reflection.rating || 0) > 0))
    },
    {
      id: "b12",
      name: "عشرة ايام مضيئة",
      desc: "سجلت انجاز فعلي في 10 ايام مختلفة بالسجل",
      svgType: "medal",
      check: (s) => Array.isArray(s.history) && s.history.filter((h) => Number(h.percent) > 0).length >= 10
    }
  ];

  // ادوات التاريخ المحلي بصيغة YYYY-MM-DD
  function getLocalDateStr(dateObj) {
    const d = dateObj || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function diffDaysBetween(dateStrA, dateStrB) {
    if (!dateStrA || !dateStrB) return null;
    const partsA = String(dateStrA).split("-").map(Number);
    const partsB = String(dateStrB).split("-").map(Number);
    if (partsA.length !== 3 || partsB.length !== 3) return null;
    const utcA = Date.UTC(partsA[0], partsA[1] - 1, partsA[2]);
    const utcB = Date.UTC(partsB[0], partsB[1] - 1, partsB[2]);
    return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
  }

  // الحالة الافتراضية: قوائم المهام والعادات تبدأ فاضية تماما []
  function getDefaultState() {
    const today = getLocalDateStr();
    return {
      theme: "dark",
      currentDate: today,
      firstStartDate: today,
      streak: 0,
      lastActiveDate: null,
      missedDaysCount: 0,
      profile: {
        name: "",
        bigGoal: "study",
        wakeTime: "07:00",
        onboarded: false
      },
      settings: {
        soundMuted: false,
        focusDuration: 25,
        breakDuration: 5,
        installDismissed: false
      },
      mainGoal: { text: "", done: false },
      tasks: [],
      habits: [],
      reflection: { win: "", learn: "", grateful: "", tomorrow: "", rating: 0 },
      focusTodayMinutes: 0,
      focusSessionsCount: 0,
      history: [],
      badgesUnlocked: [],
      last100: false,
      celebratedTodayDate: null,
      quoteIdx: 0,
      foodTipIdx: 0,
      mentalTipIdx: 0,
      updatedAt: Date.now()
    };
  }

  function sanitizeHistory(historyList) {
    if (!Array.isArray(historyList)) return [];
    const map = new Map();
    historyList.forEach((item) => {
      if (!item || !item.date) return;
      const pct = Number(item.percent || 0);
      // يوم 0% ما ينحفظ ابدا بالسجل
      if (pct <= 0) return;
      const existing = map.get(item.date);
      if (!existing || pct >= Number(existing.percent || 0)) {
        map.set(item.date, {
          date: String(item.date),
          percent: Math.min(100, Math.max(1, Math.round(pct))),
          goalDone: Boolean(item.goalDone || (existing && existing.goalDone)),
          focusMinutes: Math.max(Number(item.focusMinutes || 0), Number(existing ? existing.focusMinutes || 0 : 0)),
          habitsDone: Math.max(Number(item.habitsDone || 0), Number(existing ? existing.habitsDone || 0 : 0)),
          tasksDone: Math.max(Number(item.tasksDone || 0), Number(existing ? existing.tasksDone || 0 : 0)),
          rating: Math.max(Number(item.rating || 0), Number(existing ? existing.rating || 0 : 0))
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      const def = getDefaultState();
      const merged = Object.assign({}, def, parsed);
      merged.profile = Object.assign({}, def.profile, parsed.profile || {});
      merged.settings = Object.assign({}, def.settings, parsed.settings || {});
      merged.mainGoal = Object.assign({ text: "", done: false }, parsed.mainGoal || {});
      merged.reflection = Object.assign({ win: "", learn: "", grateful: "", tomorrow: "", rating: 0 }, parsed.reflection || {});
      merged.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      merged.habits = Array.isArray(parsed.habits) ? parsed.habits : [];
      merged.history = sanitizeHistory(parsed.history);
      if (!merged.firstStartDate) merged.firstStartDate = merged.currentDate || getLocalDateStr();
      return merged;
    } catch (e) {
      return getDefaultState();
    }
  }

  function saveData(s) {
    s.updatedAt = Date.now();
    s.history = sanitizeHistory(s.history);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {}
    if (window.ShararaFirebase && typeof window.ShararaFirebase.syncState === "function") {
      window.ShararaFirebase.syncState(s);
    }
  }

  function calculateTodayPercent(s) {
    let total = 0;
    let done = 0;
    if (s.mainGoal && s.mainGoal.text) {
      total += 2;
      if (s.mainGoal.done) done += 2;
    }
    if (Array.isArray(s.tasks)) {
      s.tasks.forEach((t) => {
        total += 1;
        if (t.done) done += 1;
      });
    }
    if (Array.isArray(s.habits)) {
      s.habits.forEach((h) => {
        total += 1;
        if (h.done) done += 1;
      });
    }
    if (total === 0) return 0;
    const pct = Math.round((done / total) * 100);
    if (pct === 100) s.last100 = true;
    return pct;
  }

  // تحديث سجل اليوم الواحد (سجل واحد لكل يوم فقط، ويوم 0% ما ينحفظ)
  function upsertDayInHistory(s, dateStr, pct) {
    if (!dateStr) return;
    if (!Array.isArray(s.history)) s.history = [];
    s.history = s.history.filter((item) => item && item.date !== dateStr);
    if (pct > 0) {
      s.history.unshift({
        date: dateStr,
        percent: pct,
        goalDone: Boolean(s.mainGoal && s.mainGoal.done),
        focusMinutes: Number(s.focusTodayMinutes || 0),
        habitsDone: Array.isArray(s.habits) ? s.habits.filter((h) => h.done).length : 0,
        tasksDone: Array.isArray(s.tasks) ? s.tasks.filter((t) => t.done).length : 0,
        rating: Number((s.reflection && s.reflection.rating) || 0)
      });
    }
    s.history = sanitizeHistory(s.history);
  }

  // فحص انتقال اليوم وحساب الستريك والغياب
  function checkDayRollover(s, targetTodayStr) {
    const today = targetTodayStr || getLocalDateStr();
    if (s.currentDate !== today) {
      const prevPct = calculateTodayPercent(s);
      if (prevPct > 0) {
        upsertDayInHistory(s, s.currentDate, prevPct);
      } else {
        s.history = (s.history || []).filter((h) => h.date !== s.currentDate);
      }

      if (s.lastActiveDate) {
        const diff = diffDaysBetween(s.lastActiveDate, today);
        if (diff !== null && diff > 1) {
          s.missedDaysCount = diff - 1;
          s.streak = 0;
        } else {
          s.missedDaysCount = 0;
        }
      }

      const nextGoalText = (s.reflection && s.reflection.tomorrow) ? s.reflection.tomorrow.trim() : "";

      s.currentDate = today;
      s.mainGoal = { text: nextGoalText, done: false };
      if (Array.isArray(s.tasks)) s.tasks.forEach((t) => { t.done = false; });
      if (Array.isArray(s.habits)) s.habits.forEach((h) => { h.done = false; });
      s.reflection = { win: "", learn: "", grateful: "", tomorrow: "", rating: 0 };
      s.focusTodayMinutes = 0;
      s.last100 = false;
      s.celebratedTodayDate = null;
      saveData(s);
    }
  }

  // احتفال حقيقي عند الوصول لـ 100% (شرارات/كونفيتي، صوت خفيف، اهتزاز، وصعود لاعلى الصفحة)
  function playCelebrationChime(isFullCelebration) {
    if (state.settings && state.settings.soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = isFullCelebration ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.11 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.11 + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.11);
        osc.stop(ctx.currentTime + idx * 0.11 + 0.44);
      });
    } catch (e) {}
  }

  function spawnConfettiSparks() {
    const container = document.getElementById("confettiContainer");
    if (!container) return;
    clearElement(container);

    for (let i = 0; i < 36; i++) {
      const p = document.createElement("div");
      const isCream = i % 3 === 0;
      const isDiamond = i % 2 === 0;
      p.className = "spark-particle" + (isCream ? " cream" : "") + (isDiamond ? " diamond" : "");
      p.style.left = Math.round(Math.random() * 96 + 2) + "%";
      p.style.top = "-12px";
      p.style.animationDelay = (Math.random() * 0.55).toFixed(2) + "s";
      const dx = Math.round((Math.random() - 0.5) * 180) + "px";
      p.style.setProperty("--dx", dx);
      container.appendChild(p);
    }

    setTimeout(() => {
      clearElement(container);
    }, 3000);
  }

  function trigger100PercentCelebration() {
    const today = state.currentDate || getLocalDateStr();
    if (state.celebratedTodayDate === today) return;
    state.celebratedTodayDate = today;

    // 1. صعود الصفحة لفوق لرسالة «اكتملت شعلتك اليوم»
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      window.scrollTo(0, 0);
    }

    // 2. حركة كبيرة للشعلة وتوهج البطاقة
    const stage = document.getElementById("flameStage");
    const heroCard = document.getElementById("heroFlameCard");
    if (stage) {
      stage.classList.remove("celebrate");
      void stage.offsetWidth;
      stage.classList.add("celebrate");
    }
    if (heroCard) {
      heroCard.classList.add("celebration-glow");
    }

    // 3. شرارات وكونفيتي ذهبي
    spawnConfettiSparks();

    // 4. صوت احتفال خفيف (يحترم زر الكتم بالاعدادات)
    playCelebrationChime(true);

    // 5. اهتزاز خفيف بالجوال اذا مدعوم
    try {
      if (navigator.vibrate) {
        navigator.vibrate([80, 50, 120]);
      }
    } catch (e) {}

    showToast("اكتملت شعلتك اليوم 100%! عاشت ايدك");
  }

  // تسجيل نشاط المستخدم اليوم (الستريك: فرق يوم واحد يزيد، اكثر يرجع 1)
  function markActiveToday(s, explicitTodayStr) {
    const activeState = s || state;
    const today = explicitTodayStr || activeState.currentDate || getLocalDateStr();
    const pct = calculateTodayPercent(activeState);
    const hasRef = Boolean(activeState.reflection && (activeState.reflection.win || activeState.reflection.tomorrow || Number(activeState.reflection.rating || 0) > 0));

    if (pct <= 0 && Number(activeState.focusTodayMinutes || 0) <= 0 && !hasRef) {
      activeState.history = (activeState.history || []).filter((h) => h.date !== today);
      return;
    }

    if (activeState.lastActiveDate !== today) {
      const diff = activeState.lastActiveDate ? diffDaysBetween(activeState.lastActiveDate, today) : null;
      if (diff === 1) {
        activeState.streak = Number(activeState.streak || 0) + 1;
      } else {
        activeState.streak = 1;
      }
      activeState.lastActiveDate = today;
      activeState.missedDaysCount = 0;
      showToast("عاشت ايدك! انحسب يومك باستمرارية شرارة");
    }

    if (pct > 0) {
      upsertDayInHistory(activeState, today, pct);
    }

    if (pct === 100 && activeState === state) {
      trigger100PercentCelebration();
    }

    checkBadges(activeState);
  }

  function getTotalFocusMinutes(s) {
    const activeState = s || state;
    const histFocus = (activeState.history || []).reduce((acc, item) => {
      if (item.date === activeState.currentDate) return acc;
      return acc + Number(item.focusMinutes || 0);
    }, 0);
    return histFocus + Number(activeState.focusTodayMinutes || 0);
  }

  function getWeekFocusMinutes(s) {
    const activeState = s || state;
    const today = activeState.currentDate || getLocalDateStr();
    let sum = Number(activeState.focusTodayMinutes || 0);
    (activeState.history || []).forEach((item) => {
      if (!item || item.date === today) return;
      const d = diffDaysBetween(item.date, today);
      if (d !== null && d >= 1 && d < 7) {
        sum += Number(item.focusMinutes || 0);
      }
    });
    return sum;
  }

  function getDayNumberSinceStart(s) {
    const activeState = s || state;
    const start = activeState.firstStartDate || activeState.currentDate;
    const diff = diffDaysBetween(start, activeState.currentDate);
    return diff !== null && diff >= 0 ? diff + 1 : 1;
  }

  // الحالة العامة للتطبيق
  let state = loadData();
  checkDayRollover(state);

  // متغيرات مؤقت التركيز المعتمد على الوقت الفعلي (Date.now())
  let timerInterval = null;
  let timerRunning = false;
  let timerMode = "focus"; // "focus" | "break"
  let timerEndTime = null;
  let timerSecondsLeft = Number((state.settings && state.settings.focusDuration) || 25) * 60;

  // متغير تعديل المهمة او العادة
  let editingItemTarget = null; // { type: 'task' | 'habit', id: string }

  // متغير تثبيت PWA (beforeinstallprompt)
  let deferredInstallPrompt = null;

  // متغير وضع المصادقة
  let authMode = "login";

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach((k) => el.setAttribute(k, attrs[k]));
    return el;
  }

  function buildBadgeSvg(type) {
    const svg = createSvgElement("svg", {
      viewBox: "0 0 24 24",
      width: "22",
      height: "22",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    if (type === "flame") {
      svg.appendChild(createSvgElement("path", { d: "M12 2C17 9 17 14 12 19C7 14 7 9 12 2Z", fill: "currentColor" }));
    } else if (type === "star") {
      svg.appendChild(createSvgElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }));
    } else if (type === "bolt") {
      svg.appendChild(createSvgElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }));
    } else if (type === "shield") {
      svg.appendChild(createSvgElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }));
    } else if (type === "crown") {
      svg.appendChild(createSvgElement("polygon", { points: "2 18 5 7 9 12 12 5 15 12 19 7 22 18 2 18" }));
    } else if (type === "trophy") {
      svg.appendChild(createSvgElement("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }));
      svg.appendChild(createSvgElement("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }));
      svg.appendChild(createSvgElement("path", { d: "M4 22h16" }));
      svg.appendChild(createSvgElement("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" }));
    } else if (type === "clock") {
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "9" }));
      svg.appendChild(createSvgElement("polyline", { points: "12 7 12 12 15 15" }));
    } else if (type === "target") {
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "10" }));
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "6" }));
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "2" }));
    } else if (type === "compass") {
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "10" }));
      svg.appendChild(createSvgElement("polygon", { points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" }));
    } else if (type === "check") {
      svg.appendChild(createSvgElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }));
      svg.appendChild(createSvgElement("polyline", { points: "22 4 12 14.01 9 11.01" }));
    } else if (type === "book") {
      svg.appendChild(createSvgElement("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }));
      svg.appendChild(createSvgElement("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" }));
    } else {
      svg.appendChild(createSvgElement("circle", { cx: "12", cy: "8", r: "6" }));
      svg.appendChild(createSvgElement("path", { d: "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" }));
    }
    return svg;
  }

  function clearElement(el) {
    if (!el) return;
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  // تهيئة التطبيق عند تحميل الصفحة
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initTimerDurations();
    checkOnboardingState();
    detectAndHighlightDayMoment();
    initInstallBanner();
    renderAll();
    setupEvents();
    hideLoadingScreen();
  });

  function hideLoadingScreen() {
    const loader = document.getElementById("loadingScreen");
    if (loader) {
      setTimeout(() => {
        loader.classList.add("fade-out");
      }, 260);
    }
  }

  function initTheme() {
    const theme = state.theme || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon();
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    updateThemeIcon();
    saveData(state);
    renderStoryCanvas();
  }

  function updateThemeIcon() {
    const moon = document.getElementById("themeIconMoon");
    const sun = document.getElementById("themeIconSun");
    if (!moon || !sun) return;
    if (state.theme === "dark") {
      moon.classList.add("hidden");
      sun.classList.remove("hidden");
    } else {
      sun.classList.add("hidden");
      moon.classList.remove("hidden");
    }
  }

  // فحص شاشات البداية الثلاث (بدون تنزيل اي قوالب تلقائيا)
  function checkOnboardingState() {
    const modal = document.getElementById("onboardingModal");
    if (!modal) return;
    if (!state.profile || !state.profile.onboarded) {
      openOnboardingModal();
    }
  }

  function openOnboardingModal() {
    const modal = document.getElementById("onboardingModal");
    if (!modal) return;
    document.getElementById("onboardNameInput").value = (state.profile && state.profile.name) || "";
    document.getElementById("onboardWakeInput").value = (state.profile && state.profile.wakeTime) || "07:00";
    showOnboardStep(1);
    modal.classList.remove("hidden");
  }

  function showOnboardStep(stepNum) {
    [1, 2, 3].forEach((n) => {
      const scr = document.getElementById("onboardScreen" + n);
      const dot = document.getElementById("onboardStepDot" + n);
      if (scr) scr.classList.toggle("hidden", n !== stepNum);
      if (dot) dot.classList.toggle("active", n <= stepNum);
    });
  }

  // بانر تثبيت التطبيق (beforeinstallprompt للاندرويد + شرح للايفون)
  function isIosDevice() {
    const ua = window.navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }

  function isStandaloneMode() {
    return Boolean(
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true
    );
  }

  function initInstallBanner() {
    const banner = document.getElementById("installAppBanner");
    const hintText = document.getElementById("installHintText");
    if (!banner) return;

    if (isStandaloneMode() || (state.settings && state.settings.installDismissed)) {
      banner.classList.add("hidden");
      return;
    }

    if (isIosDevice()) {
      if (hintText) {
        hintText.textContent = "للايفون: اضغط مشاركة بالمتصفح ثم «اضافة للشاشة الرئيسية».";
      }
      banner.classList.remove("hidden");
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (!(state.settings && state.settings.installDismissed) && !isStandaloneMode()) {
        banner.classList.remove("hidden");
      }
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      state.settings.installDismissed = true;
      saveData(state);
      banner.classList.add("hidden");
      showToast("عاشت ايدك! نزل تطبيق شرارة على جهازك");
    });
  }

  // تحديد لحظة اليوم حسب الساعة (الصبح، النهار، الليل)
  function getDayMomentByHour() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "morning";
    if (hour >= 12 && hour < 19) return "day";
    return "night";
  }

  function detectAndHighlightDayMoment() {
    const moment = getDayMomentByHour();
    setMomentUI(moment, false);
  }

  function setMomentUI(moment, scrollToSection) {
    const tabs = document.querySelectorAll(".moment-tab");
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.moment === moment);
    });

    const badge = document.getElementById("currentMomentBadge");
    const heading = document.getElementById("currentMomentHeading");
    if (moment === "morning") {
      if (badge) badge.textContent = "لحظة الصبح";
      if (heading) heading.textContent = "اكتب هدفك ومهامك وعاداتك بيدك";
      if (scrollToSection) {
        const el = document.getElementById("mainGoalSection");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else if (moment === "day") {
      if (badge) badge.textContent = "لحظة النهار";
      if (heading) heading.textContent = "وكت التركيز العميق وانجاز المهام";
      if (scrollToSection) {
        const el = document.getElementById("focusTimerSection");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      if (badge) badge.textContent = "لحظة الليل";
      if (heading) heading.textContent = "مراجعة اليوم وتقييمه وكتابة خطوة باجر";
      if (scrollToSection) {
        const el = document.getElementById("nightReviewSection");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  // دوال العرض الشامل
  function renderAll() {
    renderLivingFlameAndStats();
    renderHeartToHeart();
    renderMainGoal();
    renderTasks();
    renderHabits();
    renderFocusSection();
    renderReflectionAndRating();
    renderQuoteAndTips(false);
    renderDashboardAndHeatmap();
    renderBadges();
    renderHistory();
    renderSettingsState();
    renderStoryCanvas();
  }

  // 1. عرض الشعلة الحية والعداد والستريك ورسالة التحفيز الذكية
  function renderLivingFlameAndStats() {
    const pct = calculateTodayPercent(state);
    const dayNum = getDayNumberSinceStart(state);
    const userName = (state.profile && state.profile.name) ? state.profile.name : "صديق شرارة";

    const dayBadge = document.getElementById("dayCounterBadge");
    if (dayBadge) dayBadge.textContent = String(dayNum);

    const greeting = document.getElementById("userGreetingName");
    if (greeting) greeting.textContent = "هلا " + userName;

    const streakEl = document.getElementById("streakValue");
    if (streakEl) streakEl.textContent = String(state.streak || 0);

    const pctEl = document.getElementById("todayPercent");
    if (pctEl) pctEl.textContent = pct + "%";

    const focusTodayEl = document.getElementById("focusTodayValue");
    if (focusTodayEl) focusTodayEl.textContent = String(Number(state.focusTodayMinutes || 0));

    const totalItems = (state.tasks ? state.tasks.length : 0) + (state.habits ? state.habits.length : 0) + (state.mainGoal && state.mainGoal.text ? 1 : 0);
    const doneItems = (state.tasks ? state.tasks.filter((t) => t.done).length : 0) + (state.habits ? state.habits.filter((h) => h.done).length : 0) + (state.mainGoal && state.mainGoal.done ? 1 : 0);
    const tasksStatEl = document.getElementById("tasksDoneStat");
    if (tasksStatEl) tasksStatEl.textContent = `${doneItems} / ${totalItems}`;

    const badgesCountEl = document.getElementById("badgesCount");
    if (badgesCountEl) badgesCountEl.textContent = `${(state.badgesUnlocked || []).length} / ${BADGES_DEF.length}`;

    // حلقة التقدم المحيطة بالشعلة
    const ringCircle = document.getElementById("todayRingCircle");
    if (ringCircle) {
      const circumference = 578;
      const offset = circumference - (pct / 100) * circumference;
      ringCircle.setAttribute("stroke-dashoffset", String(Math.max(0, Math.round(offset))));
    }

    // حجم وتوهج الشعلة حسب النسبة
    const flameStage = document.getElementById("flameStage");
    const flameGroup = document.getElementById("flameVectorGroup");
    const heroCard = document.getElementById("heroFlameCard");
    let level = "0";
    let scale = 3.0;
    let flameTitle = "الشعلة خافتة هسه، اكتب اول مهمة واشعلها";

    if (pct === 0) {
      level = "0";
      scale = 3.0;
      flameTitle = totalItems === 0
        ? "الشعلة هادئة، اكتب هدفك او اول مهمة الك اليوم"
        : "الشعلة خافتة هسه، خطوة وحدة بسيطة تشعلها";
    } else if (pct > 0 && pct < 50) {
      level = "1";
      scale = 4.1;
      flameTitle = "بدت الشرارة تضوي، استمر بخطواتك الهادئة";
    } else if (pct >= 50 && pct < 100) {
      level = "2";
      scale = 5.0;
      flameTitle = "شعلتك قوية وواضحة، قربت تكمل يومك";
    } else {
      level = "3";
      scale = 5.9;
      flameTitle = "اكتملت شعلتك اليوم";
    }

    if (flameStage) flameStage.setAttribute("data-level", level);
    if (heroCard) heroCard.classList.toggle("celebration-glow", pct === 100);
    if (flameGroup) {
      flameGroup.setAttribute("transform", `translate(110, 126) scale(${scale}) translate(-10, -10)`);
    }
    const flameTitleEl = document.getElementById("flameStateTitle");
    if (flameTitleEl) flameTitleEl.textContent = flameTitle;

    // رسالة الغياب والرجعة
    const comebackBanner = document.getElementById("comebackBanner");
    if (comebackBanner) {
      if (Number(state.missedDaysCount || 0) >= 1 && pct === 0) {
        comebackBanner.classList.remove("hidden");
      } else {
        comebackBanner.classList.add("hidden");
      }
    }

    // اختيار رسالة تحفيز ذكية
    const smartMotEl = document.getElementById("smartMotivationText");
    if (smartMotEl) {
      smartMotEl.textContent = pickContextualMotivation(pct);
    }
  }

  function pickContextualMotivation(pct) {
    const list = window.SHARARA_MOTIVATIONS || [];
    if (!list.length) return "ابدأ بخطوة صغيرة اليوم، والاستمرارية تتكفل بالباقي.";

    const moment = getDayMomentByHour();
    const isComeback = Number(state.missedDaysCount || 0) >= 1 && pct < 50;
    const isHighStreak = Number(state.streak || 0) >= 3;

    let progKey = "zero";
    if (pct === 100) progKey = "complete";
    else if (pct >= 60) progKey = "high";
    else if (pct > 0) progKey = "partial";

    let candidates = list.filter((m) => {
      if (isComeback) return Boolean(m.comeback);
      if (progKey === "complete") return m.progress === "complete";
      const timeMatch = m.time === moment || m.time === "any";
      const progMatch = m.progress === progKey || m.progress === "any";
      const streakMatch = isHighStreak ? (m.streak === "high" || m.streak === "any") : (m.streak === "any");
      return timeMatch && progMatch && streakMatch && !m.comeback;
    });

    if (!candidates.length) candidates = list;
    const daySeed = (state.currentDate || "").split("-").reduce((a, b) => a + Number(b || 0), 0) + pct;
    return candidates[daySeed % candidates.length].text;
  }

  // 2. بطاقة «من القلب للقلب» (كلام دافئ من علي لصاحبه يتغير كل يوم وحسب التقدم، وعند 100% احتفال)
  function renderHeartToHeart() {
    const textEl = document.getElementById("heartToHeartText");
    const actionBtn = document.getElementById("smartAdvisorActionBtn");
    if (!textEl || !actionBtn) return;

    actionBtn.classList.add("hidden");
    actionBtn.onclick = null;

    const h2h = window.SHARARA_HEART_TO_HEART || {};
    const pct = calculateTodayPercent(state);
    const moment = getDayMomentByHour();
    const tasksCount = (state.tasks || []).length;
    const daySeed = getDayNumberSinceStart(state) + (state.currentDate || "").split("-").reduce((a, b) => a + Number(b || 0), 0);

    const pickFrom = (arr, fallback) => {
      if (!Array.isArray(arr) || arr.length === 0) return fallback;
      return arr[(daySeed + pct) % arr.length];
    };

    if (pct === 100) {
      textEl.textContent = pickFrom(
        h2h.celebration_100,
        "كفو منك والله! قفلت يومك مية بالمية وشعلتك اليوم تضوي من بعيد. ارتاح هسه وافرح بانجازك."
      );
      return;
    }

    if (tasksCount > 5) {
      textEl.textContent = pickFrom(
        h2h.too_many_tasks,
        "اشوفك كاتب مهام هواي اليوم. نصيحة من اخوك: اختار اهم 3 مهام بس وركز عليهن حتى تخلصهن وتفرح بيهن."
      );
      actionBtn.textContent = "ابقي اول 3";
      actionBtn.classList.remove("hidden");
      actionBtn.onclick = () => {
        state.tasks = state.tasks.slice(0, 3);
        saveData(state);
        renderAll();
        showToast("بقينا اهم 3 مهام لليوم");
      };
      return;
    }

    if (Number(state.missedDaysCount || 0) >= 1 && pct === 0) {
      textEl.textContent = pickFrom(
        h2h.comeback,
        "هلا برجعتك خوية. المهم الرجعة مو الغياب، اختار شغلة خفيفة اليوم وخل نشعلها من جديد."
      );
      return;
    }

    let bucketKey = "morning_zero";
    if (moment === "morning") {
      bucketKey = pct === 0 ? "morning_zero" : "morning_partial";
    } else if (moment === "day") {
      bucketKey = pct === 0 ? "day_zero" : (pct >= 65 ? "day_high" : "day_partial");
    } else {
      bucketKey = pct === 0 ? "night_zero" : (pct >= 65 ? "night_high" : "night_partial");
    }

    textEl.textContent = pickFrom(
      h2h[bucketKey],
      "امشي بخطوة ثابتة وهادئة اليوم، ترى الاستمرارية البسيطة تغلب الحماس المؤقت."
    );
  }

  // 3. الهدف الرئيسي
  function renderMainGoal() {
    const display = document.getElementById("mainGoalDisplay");
    const inputRow = document.getElementById("mainGoalInputRow");
    const label = document.getElementById("mainGoalText");
    const checkbox = document.getElementById("mainGoalCheckbox");

    if (state.mainGoal && state.mainGoal.text) {
      inputRow.classList.add("hidden");
      display.classList.remove("hidden");
      label.textContent = state.mainGoal.text;
      checkbox.checked = Boolean(state.mainGoal.done);
    } else {
      inputRow.classList.remove("hidden");
      display.classList.add("hidden");
    }
  }

  // نافذة تعديل مهمة او عادة
  function openEditItemModal(type, item) {
    editingItemTarget = { type, id: item.id };
    const modal = document.getElementById("editItemModal");
    const title = document.getElementById("editItemModalTitle");
    const input = document.getElementById("editItemInput");
    if (title) title.textContent = type === "task" ? "تعديل المهمة" : "تعديل العادة";
    if (input) input.value = item.text || "";
    if (modal) modal.classList.remove("hidden");
    if (input) input.focus();
  }

  // 4. المهام اليومية (تبدأ فاضية، ويستطيع المستخدم اضافة وتعديل وحذف المهام)
  function renderTasks() {
    const list = document.getElementById("taskList");
    const counter = document.getElementById("tasksCounter");
    const tooManyBanner = document.getElementById("tooManyTasksBanner");
    if (!list || !counter) return;

    clearElement(list);

    const tasks = state.tasks || [];
    const doneCount = tasks.filter((t) => t.done).length;
    counter.textContent = `${doneCount} / ${tasks.length}`;

    if (tooManyBanner) {
      tooManyBanner.classList.toggle("hidden", tasks.length <= 5);
    }

    if (tasks.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-list-hint";
      emptyLi.textContent = "قائمة مهامك فاضية هسه. اكتب اول مهمة الك بالخانة الفوك واضغط اضافة.";
      list.appendChild(emptyLi);
      return;
    }

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "checklist-item" + (task.done ? " done" : "");

      const left = document.createElement("div");
      left.className = "item-left";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "custom-checkbox";
      cb.checked = Boolean(task.done);
      cb.dataset.id = task.id;
      cb.dataset.type = "task";

      const span = document.createElement("span");
      span.className = "item-text";
      span.textContent = task.text;

      left.appendChild(cb);
      left.appendChild(span);

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const focusBtn = document.createElement("button");
      focusBtn.type = "button";
      focusBtn.className = "btn-icon-subtle";
      focusBtn.title = "شغل مؤقت التركيز على هذه المهمة";
      focusBtn.textContent = "⏱";
      focusBtn.addEventListener("click", () => {
        selectTaskForTimer(task.id);
      });

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-icon-subtle";
      editBtn.title = "تعديل المهمة";
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => {
        openEditItemModal("task", task);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-btn";
      delBtn.dataset.id = task.id;
      delBtn.dataset.type = "task";
      delBtn.title = "حذف المهمة";
      delBtn.textContent = "✕";

      actions.appendChild(focusBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  // 5. العادات اليومية (تبدأ فاضية، ويستطيع المستخدم اضافة وتعديل وحذف العادات)
  function renderHabits() {
    const list = document.getElementById("habitList");
    const counter = document.getElementById("habitsCounter");
    if (!list || !counter) return;

    clearElement(list);

    const habits = state.habits || [];
    const doneCount = habits.filter((h) => h.done).length;
    counter.textContent = `${doneCount} / ${habits.length}`;

    if (habits.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-list-hint";
      emptyLi.textContent = "ماكو عادات مضافة بعد. اكتب عادتك اليومية بالخانة الفوك واضغط اضافة.";
      list.appendChild(emptyLi);
      return;
    }

    habits.forEach((habit) => {
      const li = document.createElement("li");
      li.className = "checklist-item" + (habit.done ? " done" : "");

      const left = document.createElement("div");
      left.className = "item-left";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "custom-checkbox";
      cb.checked = Boolean(habit.done);
      cb.dataset.id = habit.id;
      cb.dataset.type = "habit";

      const span = document.createElement("span");
      span.className = "item-text";
      span.textContent = habit.text;

      left.appendChild(cb);
      left.appendChild(span);

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-icon-subtle";
      editBtn.title = "تعديل العادة";
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", () => {
        openEditItemModal("habit", habit);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-btn";
      delBtn.dataset.id = habit.id;
      delBtn.dataset.type = "habit";
      delBtn.title = "حذف العادة";
      delBtn.textContent = "✕";

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  // 6. مؤقت التركيز المعتمد على الوقت الفعلي (Date.now())
  function initTimerDurations() {
    const fIn = document.getElementById("focusDurationInput");
    const bIn = document.getElementById("breakDurationInput");
    const fMin = Math.max(1, Math.min(180, Number((state.settings && state.settings.focusDuration) || 25)));
    const bMin = Math.max(1, Math.min(60, Number((state.settings && state.settings.breakDuration) || 5)));
    if (fIn) fIn.value = String(fMin);
    if (bIn) bIn.value = String(bMin);
    timerSecondsLeft = fMin * 60;
    const clock = document.getElementById("timerClockDisplay");
    if (clock) clock.textContent = formatClock(timerSecondsLeft);
  }

  function getConfiguredMinutes(mode) {
    if (mode === "break") {
      return Math.max(1, Math.min(60, Number((state.settings && state.settings.breakDuration) || 5)));
    }
    return Math.max(1, Math.min(180, Number((state.settings && state.settings.focusDuration) || 25)));
  }

  function renderFocusSection() {
    const select = document.getElementById("focusTaskSelect");
    const weekBadge = document.getElementById("focusWeekBadge");
    if (weekBadge) {
      weekBadge.textContent = "الاسبوع: " + getWeekFocusMinutes(state) + " د";
    }
    if (!select) return;

    const currentVal = select.value;
    clearElement(select);

    if (state.mainGoal && state.mainGoal.text) {
      const optMain = document.createElement("option");
      optMain.value = "main_goal";
      optMain.textContent = "الهدف الرئيسي: " + state.mainGoal.text;
      select.appendChild(optMain);
    }

    (state.tasks || []).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = "مهمة: " + t.text;
      select.appendChild(opt);
    });

    const optGeneral = document.createElement("option");
    optGeneral.value = "general_focus";
    optGeneral.textContent = "جلسة تركيز عامة";
    select.appendChild(optGeneral);

    if (currentVal && Array.from(select.options).some((o) => o.value === currentVal)) {
      select.value = currentVal;
    }
    updateTimerDisplayLabel();
  }

  function selectTaskForTimer(taskId) {
    const select = document.getElementById("focusTaskSelect");
    if (select) {
      select.value = taskId;
      updateTimerDisplayLabel();
    }
    const sec = document.getElementById("focusTimerSection");
    if (sec) sec.scrollIntoView({ behavior: "smooth" });
  }

  function updateTimerDisplayLabel() {
    const select = document.getElementById("focusTaskSelect");
    const label = document.getElementById("timerActiveTaskLabel");
    if (!select || !label) return;
    const selectedOpt = select.options[select.selectedIndex];
    label.textContent = selectedOpt ? selectedOpt.textContent : "جلسة تركيز هادئة";
  }

  function formatClock(sec) {
    const cleanSec = Math.max(0, Math.round(sec));
    const m = String(Math.floor(cleanSec / 60)).padStart(2, "0");
    const s = String(cleanSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function syncTimerFromWallClock() {
    if (!timerRunning || !timerEndTime) return;
    const remainingMs = timerEndTime - Date.now();
    if (remainingMs <= 0) {
      timerSecondsLeft = 0;
      const clock = document.getElementById("timerClockDisplay");
      if (clock) clock.textContent = "00:00";
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning = false;
      timerEndTime = null;
      onTimerFinished();
    } else {
      timerSecondsLeft = Math.ceil(remainingMs / 1000);
      const clock = document.getElementById("timerClockDisplay");
      if (clock) clock.textContent = formatClock(timerSecondsLeft);
    }
  }

  function toggleTimerStartPause() {
    const btn = document.getElementById("timerStartPauseBtn");
    if (timerRunning) {
      syncTimerFromWallClock();
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning = false;
      timerEndTime = null;
      if (btn) btn.textContent = "تشغيل";
      return;
    }

    timerRunning = true;
    timerEndTime = Date.now() + timerSecondsLeft * 1000;
    if (btn) btn.textContent = "ايقاف";

    timerInterval = setInterval(syncTimerFromWallClock, 500);
  }

  function resetTimer(mode) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerRunning = false;
    timerEndTime = null;
    timerMode = mode || timerMode;
    timerSecondsLeft = getConfiguredMinutes(timerMode) * 60;

    const clock = document.getElementById("timerClockDisplay");
    if (clock) clock.textContent = formatClock(timerSecondsLeft);

    const btn = document.getElementById("timerStartPauseBtn");
    if (btn) btn.textContent = "تشغيل";

    const fBtn = document.getElementById("timerModeFocusBtn");
    const bBtn = document.getElementById("timerModeBreakBtn");
    if (fBtn) fBtn.classList.toggle("active", timerMode === "focus");
    if (bBtn) bBtn.classList.toggle("active", timerMode === "break");
  }

  function onTimerFinished() {
    playCelebrationChime(false);
    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {}

    if (timerMode === "focus") {
      const addedMins = getConfiguredMinutes("focus");
      state.focusTodayMinutes = Number(state.focusTodayMinutes || 0) + addedMins;
      state.focusSessionsCount = Number(state.focusSessionsCount || 0) + 1;
      markActiveToday(state);
      saveData(state);
      renderAll();
      showToast(`كملت ${addedMins} دقيقة تركيز صافي! وكت الاستراحة`);
      resetTimer("break");
    } else {
      showToast("خلصت الاستراحة، جاهز لجلسة تركيز جديدة");
      resetTimer("focus");
    }
  }

  // 7. مراجعة الليل وتقييم اليوم (من 1 الى 5 شعلات)
  function renderReflectionAndRating() {
    const r = state.reflection || {};
    const w = document.getElementById("refWin");
    const l = document.getElementById("refLearn");
    const g = document.getElementById("refGrateful");
    const t = document.getElementById("refTomorrow");
    if (w) w.value = r.win || "";
    if (l) l.value = r.learn || "";
    if (g) g.value = r.grateful || "";
    if (t) t.value = r.tomorrow || "";

    const ratingVal = Number(r.rating || 0);
    const btns = document.querySelectorAll(".rating-flame-btn");
    btns.forEach((btn) => {
      const bVal = Number(btn.dataset.rating || 0);
      btn.classList.toggle("active", bVal <= ratingVal && ratingVal > 0);
    });

    const lbl = document.getElementById("dayRatingValueLabel");
    if (lbl) {
      lbl.textContent = ratingVal > 0 ? `${ratingVal} / 5` : "لم يقيم بعد";
    }
  }

  // 8. حكمة اليوم (مع جمل كلام من علي وحركة تبديل ناعمة) والنصائح
  function renderQuoteAndTips(animateQuote) {
    const quotes = window.SHARARA_QUOTES || [];
    const foodTips = window.SHARARA_FOOD_TIPS || [];
    const mentalTips = window.SHARARA_MENTAL_TIPS || [];

    const updateQuoteDom = () => {
      if (quotes.length > 0) {
        const q = quotes[Number(state.quoteIdx || 0) % quotes.length];
        const qText = document.getElementById("quoteText");
        const qAuthor = document.getElementById("quoteAuthor");
        const qTag = document.getElementById("quoteTag");
        if (qText) qText.textContent = "«" + q.text + "»";
        if (qAuthor) {
          qAuthor.textContent = q.author ? "— " + q.author : "حكمة عراقية · شرارة";
        }
        if (qTag) {
          qTag.textContent = "حكمة اليوم";
        }
      }
    };

    const wrap = document.getElementById("quoteAnimatedWrap");
    if (animateQuote && wrap) {
      wrap.classList.add("switching");
      setTimeout(() => {
        updateQuoteDom();
        wrap.classList.remove("switching");
      }, 180);
    } else {
      updateQuoteDom();
    }

    if (foodTips.length > 0) {
      const fText = document.getElementById("foodTipText");
      if (fText) fText.textContent = foodTips[Number(state.foodTipIdx || 0) % foodTips.length];
    }

    if (mentalTips.length > 0) {
      const mText = document.getElementById("mentalTipText");
      if (mText) mText.textContent = mentalTips[Number(state.mentalTipIdx || 0) % mentalTips.length];
    }
  }

  // 9. لوحة التقدم، الاسبوع 7 ايام، خريطة 30 يوم، والتقرير الاسبوعي
  function renderDashboardAndHeatmap() {
    const totalFocusBadge = document.getElementById("totalFocusSummaryBadge");
    if (totalFocusBadge) {
      totalFocusBadge.textContent = "مجموع التركيز: " + getTotalFocusMinutes(state) + " د";
    }

    const todayStr = state.currentDate || getLocalDateStr();
    const todayPct = calculateTodayPercent(state);
    const historyMap = new Map();
    (state.history || []).forEach((h) => {
      if (h && h.date) historyMap.set(h.date, h);
    });
    if (todayPct > 0) {
      historyMap.set(todayStr, {
        date: todayStr,
        percent: todayPct,
        focusMinutes: Number(state.focusTodayMinutes || 0),
        rating: Number((state.reflection && state.reflection.rating) || 0)
      });
    }

    const weekGrid = document.getElementById("weekBarsGrid");
    if (weekGrid) {
      clearElement(weekGrid);
      const dayNamesAr = ["احد", "اثنين", "ثلاثاء", "اربعاء", "خميس", "جمعة", "سبت"];
      let activeDaysLast7 = 0;
      let sumPctLast7 = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = getLocalDateStr(d);
        const rec = historyMap.get(dStr);
        const pct = rec ? Number(rec.percent || 0) : (i === 0 ? todayPct : 0);
        if (pct > 0) {
          activeDaysLast7 += 1;
          sumPctLast7 += pct;
        }

        const col = document.createElement("div");
        col.className = "week-bar-col";

        const track = document.createElement("div");
        track.className = "week-bar-track";
        track.title = `${dStr}: ${pct}%`;

        const fill = document.createElement("div");
        fill.className = "week-bar-fill";
        fill.style.height = `${Math.max(6, pct)}%`;

        const lbl = document.createElement("span");
        lbl.className = "week-bar-label";
        lbl.textContent = i === 0 ? "اليوم" : dayNamesAr[d.getDay()];

        track.appendChild(fill);
        col.appendChild(track);
        col.appendChild(lbl);
        weekGrid.appendChild(col);
      }

      const isFriday = new Date().getDay() === 5;
      const reportTitle = document.getElementById("weeklyReportTitle");
      const reportSummary = document.getElementById("weeklyReportSummaryText");
      const avgPct = activeDaysLast7 > 0 ? Math.round(sumPctLast7 / activeDaysLast7) : 0;
      const weekFocus = getWeekFocusMinutes(state);

      if (reportTitle) {
        reportTitle.textContent = isFriday ? "تقرير الجمعة الاسبوعي جاهز" : "ملخص اداء الاسبوع الحالي";
      }
      if (reportSummary) {
        reportSummary.textContent = `التزمت في ${activeDaysLast7} من اخر 7 ايام بمعدل انجاز ${avgPct}%، وجمعت ${weekFocus} دقيقة تركيز صافي.`;
      }
    }

    const heatmapGrid = document.getElementById("heatmap30Grid");
    if (heatmapGrid) {
      clearElement(heatmapGrid);
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = getLocalDateStr(d);
        const rec = historyMap.get(dStr);
        const pct = rec ? Number(rec.percent || 0) : (i === 0 ? todayPct : 0);

        const cell = document.createElement("div");
        let lvlClass = "";
        if (pct >= 90) lvlClass = " lvl-3";
        else if (pct >= 50) lvlClass = " lvl-2";
        else if (pct > 0) lvlClass = " lvl-1";

        cell.className = "heatmap-cell num-font" + lvlClass;
        cell.title = `${dStr}: ${pct}%`;
        cell.textContent = String(d.getDate());
        heatmapGrid.appendChild(cell);
      }
    }
  }

  // 10. الشارات الـ 12
  function checkBadges(s) {
    const activeState = s || state;
    if (!Array.isArray(activeState.badgesUnlocked)) activeState.badgesUnlocked = [];
    let newlyUnlocked = false;

    BADGES_DEF.forEach((b) => {
      if (!activeState.badgesUnlocked.includes(b.id)) {
        if (b.check(activeState)) {
          activeState.badgesUnlocked.push(b.id);
          newlyUnlocked = true;
          showToast("فتحت شارة جديدة: " + b.name);
        }
      }
    });

    if (newlyUnlocked) {
      const stage = document.getElementById("flameStage");
      if (stage) {
        stage.classList.remove("celebrate");
        void stage.offsetWidth;
        stage.classList.add("celebrate");
      }
    }
  }

  function renderBadges() {
    const grid = document.getElementById("badgesGrid");
    if (!grid) return;
    clearElement(grid);

    BADGES_DEF.forEach((b) => {
      const isUnlocked = (state.badgesUnlocked || []).includes(b.id);
      const card = document.createElement("div");
      card.className = "badge-card" + (isUnlocked ? " unlocked" : "");

      const iconWrap = document.createElement("div");
      iconWrap.className = "badge-svg-wrap";
      iconWrap.appendChild(buildBadgeSvg(b.svgType));

      const title = document.createElement("div");
      title.className = "badge-title";
      title.textContent = b.name;

      const desc = document.createElement("div");
      desc.className = "badge-desc";
      desc.textContent = b.desc;

      card.appendChild(iconWrap);
      card.appendChild(title);
      card.appendChild(desc);
      grid.appendChild(card);
    });
  }

  // 11. سجل الايام المحفوظة (مع عرض تقييم اليوم ان وجد)
  function renderHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;
    clearElement(container);

    const validHistory = sanitizeHistory(state.history);
    if (validHistory.length === 0) {
      const emptyP = document.createElement("p");
      emptyP.className = "history-stats";
      emptyP.style.textAlign = "center";
      emptyP.textContent = "ماكو سجل ايام محفوظ بعد. اول انجاز اليوم ينحفظ هنا.";
      container.appendChild(emptyP);
      return;
    }

    validHistory.slice(0, 10).forEach((item) => {
      const row = document.createElement("div");
      row.className = "history-item";

      const dateSpan = document.createElement("span");
      dateSpan.className = "history-date num-font";
      dateSpan.textContent = item.date;

      const ratingTxt = Number(item.rating || 0) > 0 ? ` · تقييم ${item.rating}/5` : "";
      const statsSpan = document.createElement("span");
      statsSpan.className = "history-stats";
      statsSpan.textContent = `انجاز ${item.percent}% · تركيز ${Number(item.focusMinutes || 0)} د${ratingTxt}`;

      const badgeSpan = document.createElement("span");
      badgeSpan.className = "history-badge";
      badgeSpan.textContent = Number(item.percent) === 100 ? "يوم مكتمل" : "مستمر";

      row.appendChild(dateSpan);
      row.appendChild(statsSpan);
      row.appendChild(badgeSpan);
      container.appendChild(row);
    });
  }

  function renderSettingsState() {
    const muteBtn = document.getElementById("toggleSoundMuteBtn");
    if (muteBtn) {
      const isMuted = Boolean(state.settings && state.settings.soundMuted);
      muteBtn.textContent = isMuted ? "مكتوم" : "مفعل";
    }
  }

  // 12. رسم بطاقة «شارك انجازك» بقياس ستوري انستغرام الكامل 1080×1920
  // عليها: الشعلة بحالة اليوم، النسبة «أكملت X% من يومي»، اليوم رقم كم، الاقتباس مرتب بالوسط بلا زوائد، وتحت: janabiai.com/sharara و #شرارة
  function wrapCanvasLines(ctx, text, maxWidth) {
    const words = String(text || "").split(" ");
    const lines = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function renderStoryCanvas() {
    const canvas = document.getElementById("storyCanvas");
    if (!canvas || typeof canvas.getContext !== "function") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    const pct = calculateTodayPercent(state);
    const dayNum = getDayNumberSinceStart(state);

    // خلفية كحلية متدرجة فخمة (#0F1D4A -> #12225A)
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0F1D4A");
    bgGrad.addColorStop(0.5, "#12225A");
    bgGrad.addColorStop(1, "#0B1536");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // توهج ذهبي ناعم خلف الشعلة
    const auraRadius = pct === 0 ? 250 : (pct < 100 ? 380 : 480);
    const auraGrad = ctx.createRadialGradient(W / 2, 560, 20, W / 2, 560, auraRadius);
    auraGrad.addColorStop(0, pct === 0 ? "rgba(226, 164, 58, 0.2)" : "rgba(226, 164, 58, 0.45)");
    auraGrad.addColorStop(1, "rgba(15, 29, 74, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(W / 2, 560, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // اطار زجاجي ذهبي رفيع
    ctx.strokeStyle = "rgba(226, 164, 58, 0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(56, 56, W - 112, H - 112);

    // اليوم رقم كم بالاعلى
    ctx.textAlign = "center";
    ctx.fillStyle = "#E2A43A";
    ctx.font = "700 44px 'Alexandria', sans-serif";
    ctx.fillText(`اليوم ${dayNum}`, W / 2, 210);

    // الشعلة بحالة اليوم بالوسط الاعلى
    ctx.save();
    const flameScale = pct === 0 ? 11.0 : (pct < 50 ? 13.5 : (pct < 100 ? 15.5 : 17.5));
    ctx.translate(W / 2 - 10 * flameScale, 550 - 10 * flameScale);
    ctx.scale(flameScale, flameScale);

    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.bezierCurveTo(15, 8, 15, 13, 10, 17);
    ctx.bezierCurveTo(5, 13, 5, 8, 10, 1);
    ctx.closePath();
    ctx.fillStyle = pct === 0 ? "rgba(226, 164, 58, 0.45)" : "#E2A43A";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, 6.2);
    ctx.bezierCurveTo(12.8, 10.2, 12.8, 13.4, 10, 15.8);
    ctx.bezierCurveTo(7.2, 13.4, 7.2, 10.2, 10, 6.2);
    ctx.closePath();
    ctx.fillStyle = "#9A6409";
    ctx.fill();
    ctx.restore();

    // النسبة: «أكملت X% من يومي»
    ctx.fillStyle = "#F7F3EA";
    ctx.font = "800 72px 'Alexandria', sans-serif";
    ctx.fillText(`أكملت ${pct}% من يومي`, W / 2, 860);

    // فاصل ذهبي رفيع بالوسط
    ctx.strokeStyle = "rgba(226, 164, 58, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 140, 960);
    ctx.lineTo(W / 2 + 140, 960);
    ctx.stroke();

    // الاقتباس مرتب بالوسط بلا زوائد
    const quotes = window.SHARARA_QUOTES || [];
    const qObj = quotes.length ? quotes[Number(state.quoteIdx || 0) % quotes.length] : { text: "الخطوة الصغيرة اليوم تصنع باجر الجبير.", author: "" };
    ctx.fillStyle = "#F7F3EA";
    ctx.font = "600 44px 'IBM Plex Sans Arabic', 'Alexandria', sans-serif";
    const lines = wrapCanvasLines(ctx, `«${qObj.text}»`, W - 220);
    let lineY = 1100;
    lines.slice(0, 4).forEach((ln) => {
      ctx.fillText(ln, W / 2, lineY);
      lineY += 70;
    });

    // الفوتر السفلي: #شرارة و janabiai.com/sharara
    ctx.fillStyle = "#E2A43A";
    ctx.font = "800 46px 'Alexandria', sans-serif";
    ctx.fillText("#شرارة", W / 2, 1660);

    ctx.fillStyle = "#AEB8D6";
    ctx.font = "700 36px 'Space Grotesk', sans-serif";
    ctx.fillText("janabiai.com/sharara", W / 2, 1735);
  }

  function downloadStoryImage() {
    renderStoryCanvas();
    const canvas = document.getElementById("storyCanvas");
    if (!canvas) return;
    const filename = `sharara-day-${getDayNumberSinceStart(state)}.png`;

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        showToast("تم حفظ صورة الستوري (1080×1920) بجهازك");
      }, "image/png");
    } else {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast("تم حفظ صورة الستوري (1080×1920) بجهازك");
      } catch (e) {
        showToast("تعذر حفظ الصورة على هذا المتصفح");
      }
    }
  }

  // زر المشاركة يستخدم navigator.share مع ملف الصورة (files) حتى تنفتح على انستغرام مباشرة، واذا الجهاز ما يدعم ينزلها كصورة
  function shareStoryCard() {
    renderStoryCanvas();
    const canvas = document.getElementById("storyCanvas");
    if (!canvas) return;

    const pct = calculateTodayPercent(state);
    const filename = `sharara-day-${getDayNumberSinceStart(state)}.png`;
    const shareText = `أكملت ${pct}% من يومي على شرارة · اليوم ${getDayNumberSinceStart(state)} #شرارة https://janabiai.com/sharara`;

    if (canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          downloadStoryImage();
          return;
        }
        try {
          const file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            await navigator.share({
              files: [file],
              title: "شرارة | Janabi AI",
              text: shareText
            });
            return;
          }
        } catch (err) {
          if (err && err.name === "AbortError") return;
        }
        // اذا الجهاز او المتصفح ما يدعم مشاركة ملف الصورة، ننزلها كصورة مباشرة
        downloadStoryImage();
      }, "image/png");
    } else {
      downloadStoryImage();
    }
  }

  // تصدير واسترجاع البيانات كملف JSON داخل الاعدادات
  function exportDataAsJson() {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sharara-backup-${state.currentDate || getLocalDateStr()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showToast("تم تنزيل نسخة احتياطية من بياناتك");
    } catch (e) {
      showToast("تعذر تصدير الملف");
    }
  }

  function importDataFromJsonFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target.result || "{}"));
        if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
        const def = getDefaultState();
        state = Object.assign({}, def, parsed);
        state.profile = Object.assign({}, def.profile, parsed.profile || {});
        state.settings = Object.assign({}, def.settings, parsed.settings || {});
        state.history = sanitizeHistory(parsed.history);
        saveData(state);
        initTimerDurations();
        renderAll();
        showToast("تم استرجاع بياناتك بنجاح!");
      } catch (err) {
        showToast("ملف غير صالح، تأكد من اختيار ملف شرارة الصحيح");
      }
    };
    reader.readAsText(file);
  }

  // ربط جميع الازرار والاحداث
  function setupEvents() {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        const sec = document.getElementById("shareCardSection");
        if (sec) sec.scrollIntoView({ behavior: "smooth" });
      });
    }

    // متابعة الوقت الفعلي للمؤقت عند رجوع الصفحة للواجهة بعد انطفاء الشاشة
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && timerRunning) {
        syncTimerFromWallClock();
      }
    });

    // بانر تثبيت التطبيق (نزل التطبيق)
    const installBtn = document.getElementById("installActionBtn");
    const dismissInstallBtn = document.getElementById("dismissInstallBtn");
    const iosModal = document.getElementById("iosInstallModal");
    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          try {
            const choice = await deferredInstallPrompt.userChoice;
            if (choice && choice.outcome === "dismissed") {
              state.settings.installDismissed = true;
              saveData(state);
              document.getElementById("installAppBanner").classList.add("hidden");
            }
          } catch (e) {}
          deferredInstallPrompt = null;
        } else if (isIosDevice() && iosModal) {
          iosModal.classList.remove("hidden");
        } else {
          showToast("من قائمة المتصفح اختار «اضافة الى الشاشة الرئيسية»");
        }
      });
    }
    if (dismissInstallBtn) {
      dismissInstallBtn.addEventListener("click", () => {
        state.settings.installDismissed = true;
        saveData(state);
        document.getElementById("installAppBanner").classList.add("hidden");
      });
    }
    const closeIosBtn = document.getElementById("closeIosInstallModalBtn");
    const gotItIosBtn = document.getElementById("gotItIosBtn");
    if (closeIosBtn) closeIosBtn.addEventListener("click", () => iosModal.classList.add("hidden"));
    if (gotItIosBtn) gotItIosBtn.addEventListener("click", () => iosModal.classList.add("hidden"));

    // احداث شاشات البداية الثلاث (بدون تنزيل اي قوالب تلقائيا)
    const next1 = document.getElementById("onboardNext1Btn");
    if (next1) {
      next1.addEventListener("click", () => {
        const nameVal = document.getElementById("onboardNameInput").value.trim();
        state.profile.name = nameVal || "صديق شرارة";
        showOnboardStep(2);
      });
    }

    const goalsGrid = document.getElementById("onboardGoalsGrid");
    if (goalsGrid) {
      goalsGrid.addEventListener("click", (e) => {
        const btn = e.target.closest(".goal-choice-btn");
        if (!btn) return;
        document.querySelectorAll(".goal-choice-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.profile.bigGoal = btn.dataset.goal || "study";
      });
    }

    const back2 = document.getElementById("onboardBack2Btn");
    if (back2) back2.addEventListener("click", () => showOnboardStep(1));

    const next2 = document.getElementById("onboardNext2Btn");
    if (next2) next2.addEventListener("click", () => showOnboardStep(3));

    const back3 = document.getElementById("onboardBack3Btn");
    if (back3) back3.addEventListener("click", () => showOnboardStep(2));

    const finishOnboard = document.getElementById("onboardFinishBtn");
    if (finishOnboard) {
      finishOnboard.addEventListener("click", () => {
        const wakeVal = document.getElementById("onboardWakeInput").value || "07:00";
        state.profile.wakeTime = wakeVal;
        state.profile.onboarded = true;
        // القوائم تبقى كما هي (فاضية باول دخول) ولا ينزل اي قالب تلقائيا
        saveData(state);
        document.getElementById("onboardingModal").classList.add("hidden");
        renderAll();
        showToast("نورت شرارة! اكتب اول مهمة الك اليوم");
      });
    }

    // نافذة الاعدادات
    const settingsModal = document.getElementById("settingsModal");
    const openSettingsBtn = document.getElementById("openSettingsModalBtn");
    const closeSettingsBtn = document.getElementById("closeSettingsModalBtn");
    if (openSettingsBtn && settingsModal) {
      openSettingsBtn.addEventListener("click", () => {
        renderSettingsState();
        settingsModal.classList.remove("hidden");
      });
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
    }

    const toggleMuteBtn = document.getElementById("toggleSoundMuteBtn");
    if (toggleMuteBtn) {
      toggleMuteBtn.addEventListener("click", () => {
        state.settings.soundMuted = !Boolean(state.settings.soundMuted);
        saveData(state);
        renderSettingsState();
        showToast(state.settings.soundMuted ? "تم كتم صوت الاحتفال والتنبيه" : "تم تفعيل الصوت");
      });
    }

    const editOnboardBtn = document.getElementById("editOnboardingBtn");
    if (editOnboardBtn) {
      editOnboardBtn.addEventListener("click", () => {
        if (settingsModal) settingsModal.classList.add("hidden");
        openOnboardingModal();
      });
    }

    // نافذة تعديل المهمة او العادة
    const editItemModal = document.getElementById("editItemModal");
    const closeEditItemBtn = document.getElementById("closeEditItemModalBtn");
    const cancelEditItemBtn = document.getElementById("cancelEditItemBtn");
    const editItemForm = document.getElementById("editItemForm");
    if (closeEditItemBtn) closeEditItemBtn.addEventListener("click", () => editItemModal.classList.add("hidden"));
    if (cancelEditItemBtn) cancelEditItemBtn.addEventListener("click", () => editItemModal.classList.add("hidden"));
    if (editItemForm) {
      editItemForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = document.getElementById("editItemInput").value.trim();
        if (!val || !editingItemTarget) return;
        const list = editingItemTarget.type === "task" ? state.tasks : state.habits;
        const found = (list || []).find((x) => x.id === editingItemTarget.id);
        if (found) {
          found.text = val;
          saveData(state);
          renderAll();
          showToast("تم حفظ التعديل");
        }
        editItemModal.classList.add("hidden");
        editingItemTarget = null;
      });
    }

    // لحظات اليوم الثلاث والقوالب الاختيارية
    document.querySelectorAll(".moment-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        setMomentUI(tab.dataset.moment, true);
      });
    });

    const openTemplatesBtn = document.getElementById("openTemplatesBtn");
    if (openTemplatesBtn) {
      openTemplatesBtn.addEventListener("click", () => {
        const drawer = document.getElementById("templatesDrawer");
        if (drawer) drawer.classList.toggle("hidden");
      });
    }

    document.querySelectorAll(".template-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const key = chip.dataset.template;
        const tpl = TEMPLATES[key];
        if (!tpl) return;
        state.mainGoal = { text: tpl.mainGoal, done: false };
        state.tasks = tpl.tasks.map((txt, idx) => ({ id: "t_tpl_" + idx + "_" + Date.now(), text: txt, done: false }));
        state.habits = tpl.habits.map((txt, idx) => ({ id: "h_tpl_" + idx + "_" + Date.now(), text: txt, done: false }));
        saveData(state);
        renderAll();
        showToast("نزل قالب «" + tpl.name + "» وتكدر تعدل عليه براحتك");
      });
    });

    // الهدف الرئيسي
    document.getElementById("setMainGoalBtn").addEventListener("click", () => {
      const input = document.getElementById("mainGoalInput");
      const val = input.value.trim();
      if (val) {
        state.mainGoal = { text: val, done: false };
        saveData(state);
        renderAll();
      }
    });

    document.getElementById("editMainGoalBtn").addEventListener("click", () => {
      document.getElementById("mainGoalInput").value = state.mainGoal.text || "";
      state.mainGoal = { text: "", done: false };
      saveData(state);
      renderAll();
    });

    document.getElementById("focusMainGoalBtn").addEventListener("click", () => {
      selectTaskForTimer("main_goal");
    });

    document.getElementById("mainGoalCheckbox").addEventListener("change", (e) => {
      state.mainGoal.done = Boolean(e.target.checked);
      markActiveToday(state);
      saveData(state);
      renderAll();
    });

    // اضافة المهام والعادات
    document.getElementById("addTaskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("taskInput");
      const val = input.value.trim();
      if (val) {
        state.tasks.push({ id: "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000), text: val, done: false });
        input.value = "";
        saveData(state);
        renderAll();
      }
    });

    const keepTop3Btn = document.getElementById("keepTop3TasksBtn");
    if (keepTop3Btn) {
      keepTop3Btn.addEventListener("click", () => {
        state.tasks = state.tasks.slice(0, 3);
        saveData(state);
        renderAll();
        showToast("بقينا اهم 3 مهام لليوم");
      });
    }

    document.getElementById("addHabitForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("habitInput");
      const val = input.value.trim();
      if (val) {
        state.habits.push({ id: "h_" + Date.now() + "_" + Math.floor(Math.random() * 1000), text: val, done: false });
        input.value = "";
        saveData(state);
        renderAll();
      }
    });

    // تفويض احداث الصح والحذف للمهام والعادات
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-type]");
      if (!target) return;
      const type = target.dataset.type;
      const id = target.dataset.id;

      if (target.tagName === "INPUT" && target.type === "checkbox") {
        const list = type === "task" ? state.tasks : state.habits;
        const item = list.find((x) => x.id === id);
        if (item) {
          item.done = Boolean(target.checked);
          markActiveToday(state);
          saveData(state);
          renderAll();
        }
      } else if (target.classList.contains("delete-btn")) {
        if (type === "task") state.tasks = state.tasks.filter((x) => x.id !== id);
        if (type === "habit") state.habits = state.habits.filter((x) => x.id !== id);
        markActiveToday(state);
        saveData(state);
        renderAll();
      }
    });

    // مؤقت التركيز القابل للتعديل
    document.getElementById("focusTaskSelect").addEventListener("change", updateTimerDisplayLabel);
    document.getElementById("timerStartPauseBtn").addEventListener("click", toggleTimerStartPause);
    document.getElementById("timerResetBtn").addEventListener("click", () => resetTimer(timerMode));
    document.getElementById("timerModeFocusBtn").addEventListener("click", () => resetTimer("focus"));
    document.getElementById("timerModeBreakBtn").addEventListener("click", () => resetTimer("break"));

    const fDurIn = document.getElementById("focusDurationInput");
    const bDurIn = document.getElementById("breakDurationInput");
    if (fDurIn) {
      fDurIn.addEventListener("change", () => {
        const v = Math.max(1, Math.min(180, Number(fDurIn.value || 25)));
        fDurIn.value = String(v);
        state.settings.focusDuration = v;
        saveData(state);
        if (!timerRunning && timerMode === "focus") {
          resetTimer("focus");
        }
      });
    }
    if (bDurIn) {
      bDurIn.addEventListener("change", () => {
        const v = Math.max(1, Math.min(60, Number(bDurIn.value || 5)));
        bDurIn.value = String(v);
        state.settings.breakDuration = v;
        saveData(state);
        if (!timerRunning && timerMode === "break") {
          resetTimer("break");
        }
      });
    }

    // تقييم اليوم (1-5 شعلات) بمراجعة الليل
    const ratingRow = document.getElementById("dayRatingFlames");
    if (ratingRow) {
      ratingRow.addEventListener("click", (e) => {
        const btn = e.target.closest(".rating-flame-btn");
        if (!btn) return;
        const val = Number(btn.dataset.rating || 0);
        if (!state.reflection) state.reflection = { win: "", learn: "", grateful: "", tomorrow: "", rating: 0 };
        state.reflection.rating = val;
        markActiveToday(state);
        saveData(state);
        renderAll();
      });
    }

    // حفظ مراجعة الليل
    document.getElementById("saveReflectionBtn").addEventListener("click", () => {
      state.reflection = {
        win: document.getElementById("refWin").value.trim(),
        learn: document.getElementById("refLearn").value.trim(),
        grateful: document.getElementById("refGrateful").value.trim(),
        tomorrow: document.getElementById("refTomorrow").value.trim(),
        rating: Number((state.reflection && state.reflection.rating) || 0)
      };
      markActiveToday(state);
      saveData(state);
      renderAll();
      showToast("انحفظت مراجعة وتقييم اليوم");
    });

    // تبديل حكمة اليوم بحركة ناعمة والنصائح
    document.getElementById("newQuoteBtn").addEventListener("click", () => {
      state.quoteIdx = Number(state.quoteIdx || 0) + 1;
      saveData(state);
      renderQuoteAndTips(true);
      renderStoryCanvas();
    });

    document.getElementById("nextFoodTipBtn").addEventListener("click", () => {
      state.foodTipIdx = Number(state.foodTipIdx || 0) + 1;
      saveData(state);
      renderQuoteAndTips(false);
    });

    document.getElementById("nextMentalTipBtn").addEventListener("click", () => {
      state.mentalTipIdx = Number(state.mentalTipIdx || 0) + 1;
      saveData(state);
      renderQuoteAndTips(false);
    });

    // بطاقة شارك انجازك (1080×1920)
    document.getElementById("downloadStoryBtn").addEventListener("click", downloadStoryImage);
    document.getElementById("shareStoryApiBtn").addEventListener("click", shareStoryCard);

    // تصدير واسترجاع البيانات JSON داخل الاعدادات
    document.getElementById("exportJsonBtn").addEventListener("click", exportDataAsJson);
    document.getElementById("importJsonInput").addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        importDataFromJsonFile(e.target.files[0]);
        e.target.value = "";
      }
    });

    // حساب المستخدم والمزامنة السحابية
    const authModal = document.getElementById("authModal");
    const authFeedback = document.getElementById("authFeedbackMsg");
    document.getElementById("openAuthModalBtn").addEventListener("click", () => {
      if (authFeedback) authFeedback.textContent = "";
      authModal.classList.remove("hidden");
    });
    document.getElementById("closeAuthModalBtn").addEventListener("click", () => {
      authModal.classList.add("hidden");
    });

    document.getElementById("tabLoginBtn").addEventListener("click", () => {
      authMode = "login";
      document.getElementById("tabLoginBtn").classList.add("active");
      document.getElementById("tabRegisterBtn").classList.remove("active");
      document.getElementById("authNameFieldWrap").classList.add("hidden");
      document.getElementById("authSubmitBtn").textContent = "دخول";
    });

    document.getElementById("tabRegisterBtn").addEventListener("click", () => {
      authMode = "register";
      document.getElementById("tabRegisterBtn").classList.add("active");
      document.getElementById("tabLoginBtn").classList.remove("active");
      document.getElementById("authNameFieldWrap").classList.remove("hidden");
      document.getElementById("authSubmitBtn").textContent = "انشاء حساب وحفظ البيانات";
    });

    document.getElementById("authForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!window.ShararaFirebase) return;
      const name = document.getElementById("authNameInput").value.trim();
      const email = document.getElementById("authEmailInput").value.trim();
      const pass = document.getElementById("authPasswordInput").value;
      authFeedback.textContent = "جاري الاتصال...";

      const res = authMode === "register"
        ? await window.ShararaFirebase.registerEmail(name || state.profile.name, email, pass)
        : await window.ShararaFirebase.loginEmail(email, pass);

      if (res.ok) {
        authFeedback.textContent = "تم تسجيل الدخول ومزامنة بياناتك بنجاح!";
        setTimeout(() => authModal.classList.add("hidden"), 900);
      } else {
        authFeedback.textContent = res.error;
      }
    });

    document.getElementById("googleSignInBtn").addEventListener("click", async () => {
      if (!window.ShararaFirebase) return;
      authFeedback.textContent = "جاري فتح تسجيل الدخول بحساب Google...";
      const res = await window.ShararaFirebase.loginGoogle();
      if (res.ok) {
        authFeedback.textContent = "تم الدخول بحساب Google ومزامنة شغلك!";
        setTimeout(() => authModal.classList.add("hidden"), 900);
      } else {
        authFeedback.textContent = res.error;
      }
    });

    document.getElementById("forgotPasswordBtn").addEventListener("click", async () => {
      if (!window.ShararaFirebase) return;
      const email = document.getElementById("authEmailInput").value.trim();
      const res = await window.ShararaFirebase.resetPassword(email);
      authFeedback.textContent = res.ok
        ? "ارسلنا رابط استعادة كلمة السر لبريدك الالكتروني."
        : res.error;
    });

    document.getElementById("syncNowBtn").addEventListener("click", async () => {
      if (!window.ShararaFirebase) return;
      authFeedback.textContent = "جاري مزامنة البيانات...";
      const ok = await window.ShararaFirebase.forceSyncNow(state);
      authFeedback.textContent = ok ? "تزامنت بياناتك ويا السحابة بنجاح!" : "تعذرت المزامنة حاليا، تأكد من النت.";
    });

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      if (!window.ShararaFirebase) return;
      await window.ShararaFirebase.logout();
      authFeedback.textContent = "تم تسجيل الخروج. بياناتك باقية على جهازك.";
    });

    // مسح الحساب والبيانات
    const delModal = document.getElementById("deleteConfirmModal");
    const openDeleteConfirm = () => {
      authModal.classList.add("hidden");
      if (settingsModal) settingsModal.classList.add("hidden");
      delModal.classList.remove("hidden");
    };
    document.getElementById("deleteAllFromHomeBtn").addEventListener("click", openDeleteConfirm);
    document.getElementById("deleteAccountModalBtn").addEventListener("click", openDeleteConfirm);
    document.getElementById("cancelDeleteModalBtn").addEventListener("click", () => {
      delModal.classList.add("hidden");
    });
    document.getElementById("confirmDeleteModalBtn").addEventListener("click", async () => {
      if (window.ShararaFirebase && typeof window.ShararaFirebase.deleteAccountAndData === "function") {
        await window.ShararaFirebase.deleteAccountAndData();
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      state = getDefaultState();
      delModal.classList.add("hidden");
      renderAll();
      openOnboardingModal();
      showToast("تم مسح الحساب والبيانات بالكامل");
    });
  }

  // نظام التنبيهات الهادئة Toast (باستخدام textContent فقط)
  function showToast(msg) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // واجهة برمجية لربط Firebase والاختبارات الآلية
  window.ShararaApp = {
    getState: () => state,
    applySyncedState: (syncedObj) => {
      if (!syncedObj) return;
      const def = getDefaultState();
      state = Object.assign({}, def, syncedObj);
      state.profile = Object.assign({}, def.profile, syncedObj.profile || {});
      state.settings = Object.assign({}, def.settings, syncedObj.settings || {});
      state.history = sanitizeHistory(state.history);
      saveData(state);
      initTimerDurations();
      renderAll();
    },
    setProfileName: (nameStr) => {
      if (!state.profile) state.profile = getDefaultState().profile;
      state.profile.name = String(nameStr || "").trim();
      saveData(state);
      renderAll();
    },
    onAuthChanged: (user) => {
      const label = document.getElementById("headerAccountLabel");
      const outView = document.getElementById("authLoggedOutView");
      const inView = document.getElementById("authLoggedInView");
      const emailEl = document.getElementById("accountUserEmail");

      if (user) {
        if (label) label.textContent = user.displayName || (state.profile && state.profile.name) || "حسابي";
        if (outView) outView.classList.add("hidden");
        if (inView) inView.classList.remove("hidden");
        if (emailEl) emailEl.textContent = user.email || "";
      } else {
        if (label) label.textContent = "حفظ شغلك";
        if (outView) outView.classList.remove("hidden");
        if (inView) inView.classList.add("hidden");
      }
    },
    _testHelpers: {
      calculateTodayPercent,
      checkDayRollover,
      markActiveToday,
      upsertDayInHistory,
      sanitizeHistory,
      diffDaysBetween,
      BADGES_DEF,
      syncTimerFromWallClock,
      setTimerEndTimeForTest: (msFromNow) => {
        timerRunning = true;
        timerEndTime = Date.now() + msFromNow;
      },
      getTimerSecondsLeft: () => timerSecondsLeft
    }
  };
})();
