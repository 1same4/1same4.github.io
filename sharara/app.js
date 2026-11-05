(function () {
  "use strict";

  const STORAGE_KEY = "sharara_app_v3";

  // 1. طبقة التخزين المنفصلة (loadData / saveData) لتهيئتها للمزامنة السحابية مستقبلاً
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      return Object.assign(getDefaultState(), JSON.parse(raw));
    } catch (e) {
      return getDefaultState();
    }
  }

  function saveData(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  const DEFAULT_HABITS = [
    { id: "h1", text: "قراءة صباحية (30 دقيقة)", done: false },
    { id: "h2", text: "تعلم كلمة انكليزي جديدة", done: false },
    { id: "h3", text: "تمرين رياضي خفيف", done: false },
    { id: "h4", text: "ترتيب اولويات الشغل", done: false }
  ];

  // 8 شارات محترفة تحسب من الحالة الفعلية وليس من عداد وهمي
  const BADGES_DEF = [
    { id: "b1", icon: "🌱", name: "شرارة أولى", desc: "أنجز أول مهمة", check: (s) => {
      if (s.mainGoal.done) return true;
      if (s.tasks.some(t => t.done)) return true;
      if (s.habits.some(h => h.done)) return true;
      return s.history.length > 0;
    }},
    { id: "b2", icon: "⭐", name: "يوم متكامل", desc: "أغلق يومه بنسبة 100%", check: (s) => s.last100 || s.history.some(h => h.percent === 100) },
    { id: "b3", icon: "🔥", name: "مستمر 3 أيام", desc: "ستريك 3 أيام متتالية", check: (s) => s.streak >= 3 },
    { id: "b4", icon: "⚡", name: "بطل الأسبوع", desc: "ستريك 7 أيام متتالية", check: (s) => s.streak >= 7 },
    { id: "b5", icon: "👑", name: "شهر من الالتزام", desc: "ستريك 30 يوم متتالي", check: (s) => s.streak >= 30 },
    { id: "b6", icon: "🛡️", name: "محترف شرارة", desc: "أغلق يومه 5 مرات بالسجل", check: (s) => s.history.length >= 5 },
    { id: "b7", icon: "🏆", name: "سيد الاستمرارية", desc: "أغلق يومه 10 مرات بالسجل", check: (s) => s.history.length >= 10 },
    { id: "b8", icon: "🔄", name: "عادة وستريك", desc: "أنجز عادة اليوم وحافظ على ستريك يومين", check: (s) => s.habits.some(h => h.done) && s.streak >= 2 }
  ];

  // 40+ رسالة تحفيزية موزعة حسب الوقت والتقدم والستريك (بلا تشكيل، ك بدل گ، ج بدل چ)
  const MOTIVATIONS = {
    morning: {
      zero: [
        "الصباح بلش، والشرارة تبدي بهدف واحد واضح. شنو ببالك تخلص اليوم؟",
        "يا هلا بالصبح والنشاط! اختار هدفك الأهم وكبل ابلش بي.",
        "قعدت الصبح وبداية يوم جديد. شنو الشغلة اللي تخلي يومك ناجح؟",
        "الصبح هو وكت التركيز الذهبي. ابدأ بأول خطوة ولا تؤجلها.",
        "نور الله صبحتك. خل نبدي بخطوة وحدة ثابتة تفتح بيها يومك."
      ],
      under50: [
        "بداية طيبة كلش بالصباح. استمر بهدوء وركز على مهامك.",
        "خطوات أولى زينة. كمل على أهم مهمة ولا تخلي التشتت ياخذ وقتك.",
        "صباح النشاط، مشيت طريق حلو، كمل الباقي بنفس الهدوء.",
        "بداية يوم موفقة. ركز على إنجاز مهمتك الأساسية هسة.",
        "الصبح بركة، وخطواتك الصباحية هي اللي تقفل يومك بنجاح."
      ],
      over50: [
        "أكلت نص شغلك من الصبح! عاش إيدك، استمر.",
        "ما ضل هواي وتقفل أهم شغلات الصباح. بطل والله.",
        "إنجازات الصباح تريح الباقي من اليوم. كمل الباقي بقوة.",
        "وضعك ممتاز اليوم من الصبح. شد حيلك للخطوة الأخيرة.",
        "ماشاء الله، تركيزك عالي اليوم. خلص الباقي وارتاح."
      ],
      full: [
        "قفلت كل شغل الصبح من وقت! أنت بطل حقيقي اليوم.",
        "إنجاز 100% من الصبح؟ عاشت إيدك، استمتع بباقي يومك.",
        "خلصت كل شي بوقت قياسي. يومك مثالي بكل معنى الكلمة.",
        "ما ضل شي بالليستة، كفيت ووفيت من الصبح.",
        "يوم متكامل من الصبح. ارتاح وافتخر بهذا الإنجاز."
      ]
    },
    afternoon: {
      zero: [
        "ظهرية مباركة. لسة وقتك بيدك، ابلش بهدفك الأهم وهز الروتين.",
        "وكت الظهر يحتاج شوية تركيز إضافي. شنو مكانه بقائمتك اليوم؟",
        "النص الثاني من النهار يبدي من هنا. خل نرجع للملعب.",
        "الوقت ما فات، ابلش بمهمة وحدة واكسر الجمود.",
        "ظهر سعيد. رتب أولوياتك واقفل الظهر بإنجاز."
      ],
      under50: [
        "نص النهار مشى وإنت ممسك بزمام الأمور. استمر.",
        "بداية زينة للظهرية، كمل المهام المتبقية بلا عجلة.",
        "الجهد اللي بذلته حلو، كمل الباقي حتى ترتاح بالليل.",
        "خطوة ورا خطوة تقربك لهدفك اليوم. واصل.",
        "الظهر وكت التحدي الحقيقي، وإنت قدها."
      ],
      over50: [
        "عاش إيدك، الظهرية صارت أحلى بإنجازاتك المتسلسلة.",
        "اكثر من نصف الطريق خلص. ما بقى شي وتختم القائمة.",
        "جهد متميز هذا اليوم. استمر بنفس الوتيرة.",
        "الوضع تحت السيطرة وبقوة. كمل خطوتين وتخلص.",
        "إنجاز يرفع الرأس اليوم. شد حيلك للختام."
      ],
      full: [
        "ختمت كل شغلك بالظهر! بطل والله.",
        "ما بقى شي بالليستة، يومك خلص بنجاح مبهر.",
        "أنجزت كل مهامك وعاداتك. استمتع بباقي نهارك.",
        "إنجاز كامل ومرتب. عاشت إيدك.",
        "قفلت اليوم كله من الظهر. هنيالك."
      ]
    },
    evening: {
      zero: [
        "المساء هادئ، بس لسة بيدك تسوي شي يغير يومك.",
        "حتى لو تأخر الوقت، خطوة وحدة أحسن من الصفر.",
        "اكتسح التشتت هسه واكتب هدفك الأهم لبكرى.",
        "سهرة سعيدة. خل نقفل اليوم بشغلة بسيطة تفيدك.",
        "الليل وكت المراجعة الهادئة، ابدأ بخطوة خفيفة."
      ],
      under50: [
        "سحبت اليوم لنهايته بشكل زين. كمل الباقي واقفل برتاح.",
        "إنجازات ليلية خفيفة تقفل بها يومك بشكل مرتب.",
        "ما بقى شي وتخلص، شد حيلك وخلص اللي بيدك.",
        "المساء وكت تصفية الأفكار وإنجاز المتبقي.",
        "خطوات أخيرة وتختم يومك وأنت مرتاح البال."
      ],
      over50: [
        "ختامها مسك! إنجاز كبير اليوم وقريب تخلص الباقي.",
        "السهرة أحلى وأنت منجز أكثر من نصف شغلك.",
        "ما بقى شي على الختام. خلص وتونس بسهرتك.",
        "تركيز ليلي ممتاز. عاشت إيدك.",
        "يومك كان مثمر ومرتب. خلص المتبقي ونام مرتاح."
      ],
      full: [
        "قفلت يومك وأنت منجز 100%. نام وراس مرتاح.",
        "يوم مثالي من الصبح للليل. هنيالك بهذا الالتزام.",
        "ختمت كل مهامك قبل ما يخلص اليوم. بطل.",
        "إنجاز كامل بالليل. تصبح على خير وإنجاز جديد.",
        "أبدعت اليوم بكل جدارة. ارتاح وهنيالك."
      ]
    },
    streaks: {
      s3: "ستريك 3 أيام متتالية! بدأت تبتني العادة الحقيقية عندك.",
      s7: "صارلك أسبوع كامل تلتزم يومياً! إنت بطل شرارة الحقيقي.",
      s30: "شهر كامل من الالتزام المستمر! إنجاز عظيم يغير حياتك.",
      reset: "فاتك أمس وما سجلت، مو مشكلة ابد.. ابلش اليوم من جديد واصنع شرارتك."
    }
  };

  function getDefaultState() {
    return {
      theme: "light",
      streak: 0,
      lastCompletedDate: "",
      last100: false,
      mainGoal: { text: "", done: false },
      tasks: [],
      habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
      review: { win: "", tomorrow: "" },
      history: []
    };
  }

  let state = loadData();

  // عناصر الصفحة
  const htmlEl = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const streakCount = document.getElementById("streakCount");
  const greetingHeading = document.getElementById("greetingHeading");
  const todayDateEl = document.getElementById("todayDate");
  const progressPercent = document.getElementById("ringPercent");
  const ringFill = document.getElementById("ringFill");
  const smartMotivation = document.getElementById("smartMotivation");
  const weeklyGrid = document.getElementById("weeklyGrid");

  const mainGoalCheck = document.getElementById("mainGoalCheck");
  const mainGoalInput = document.getElementById("mainGoalInput");

  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskPriorityCheck = document.getElementById("taskPriorityCheck");
  const taskList = document.getElementById("taskList");
  const tasksCounter = document.getElementById("tasksCounter");
  const emptyTasksMsg = document.getElementById("emptyTasksMsg");

  const habitList = document.getElementById("habitList");
  const habitForm = document.getElementById("habitForm");
  const habitInput = document.getElementById("habitInput");
  const habitsCounter = document.getElementById("habitsCounter");

  const badgesContainer = document.getElementById("badgesContainer");

  const reviewWin = document.getElementById("reviewWin");
  const reviewTomorrow = document.getElementById("reviewTomorrow");

  const saveDayBtn = document.getElementById("saveDayBtn");
  const shareCardBtn = document.getElementById("shareCardBtn");
  const newDayBtn = document.getElementById("newDayBtn");
  const actionFeedback = document.getElementById("actionFeedback");

  const historyList = document.getElementById("historyList");
  const emptyHistoryMsg = document.getElementById("emptyHistoryMsg");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const installBtn = document.getElementById("installBtn");
  const installGuide = document.getElementById("installGuide");
  const closeGuide = document.getElementById("closeGuide");

  // PWA Install Prompt
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-flex";
  });

  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") installBtn.style.display = "none";
      deferredPrompt = null;
    } else {
      installGuide.style.display = "block";
    }
  });

  closeGuide.addEventListener("click", () => {
    installGuide.style.display = "none";
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  function formatTodayArabic() {
    try {
      return new Intl.DateTimeFormat("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date());
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  }

  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // محرك اختيار الرسائل العشوائية بدون تكرار متتالي
  let lastMsgIndex = -1, lastBucket = "", lastMsg = "";
  function getSmartMotivation(percent) {
    const hour = new Date().getHours();
    let timeKey = "morning";
    if (hour >= 12 && hour < 17) timeKey = "afternoon";
    else if (hour >= 17) timeKey = "evening";

    let levelKey = "zero";
    if (percent > 0 && percent < 50) levelKey = "under50";
    else if (percent >= 50 && percent < 100) levelKey = "over50";
    else if (percent === 100) levelKey = "full";

    // فحص الستريك أو إذا فات يوم
    if (state.lastCompletedDate) {
      const lastDate = new Date(state.lastCompletedDate);
      const todayDate = new Date(getTodayKey());
      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        return MOTIVATIONS.streaks.reset;
      }
      if (state.streak === 3 && percent === 0) return MOTIVATIONS.streaks.s3;
      if (state.streak === 7 && percent === 0) return MOTIVATIONS.streaks.s7;
      if (state.streak === 30 && percent === 0) return MOTIVATIONS.streaks.s30;
    }

    const bucket = timeKey + "|" + levelKey;
    if (bucket === lastBucket && lastMsg) return lastMsg;
    const arr = MOTIVATIONS[timeKey][levelKey];
    let idx;
    do {
      idx = Math.floor(Math.random() * arr.length);
    } while (idx === lastMsgIndex && arr.length > 1);
    lastMsgIndex = idx; lastBucket = bucket; lastMsg = arr[idx];
    return arr[idx];
  }

  function applyTheme() {
    htmlEl.setAttribute("data-theme", state.theme);
    themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
  }

  function calculateProgress() {
    let total = 0, done = 0;
    if (state.mainGoal.text.trim() !== "") {
      total += 2;
      if (state.mainGoal.done) done += 2;
    }
    state.tasks.forEach(t => { total += 1; if (t.done) done += 1; });
    state.habits.forEach(h => { total += 1; if (h.done) done += 1; });

    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    progressPercent.textContent = percent + "%";
    
    // حساب حفرة الـ SVG Ring (circumference = 2 * PI * 38 ≈ 238.76)
    const offset = 238.76 - (238.76 * percent) / 100;
    ringFill.style.strokeDashoffset = offset;

    smartMotivation.textContent = getSmartMotivation(percent);
    return percent;
  }

  // التقدم الأسبوعي المرئي (آخر 7 أيام)
  function renderWeeklyProgress() {
    weeklyGrid.textContent = "";
    const daysNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const dayName = daysNames[d.getDay()];

      const found = state.history.find(h => h.rawDate === key);
      const isCompleted = found && found.percent >= 50;

      const col = document.createElement("div");
      col.className = "day-col";
      
      const spanName = document.createElement("span");
      spanName.className = "day-name";
      spanName.textContent = dayName;

      const spanDot = document.createElement("span");
      spanDot.className = "day-dot" + (isCompleted ? " completed" : "");

      col.appendChild(spanName);
      col.appendChild(spanDot);
      weeklyGrid.appendChild(col);
    }
  }

  // الشارات الاحترافية الـ 8 (تحسب من الحالة الفعلية)
  function renderBadges() {
    badgesContainer.textContent = "";
    BADGES_DEF.forEach(b => {
      const unlocked = b.check(state);
      const item = document.createElement("div");
      item.className = "badge-item" + (unlocked ? " unlocked" : "");

      const iconSpan = document.createElement("span");
      iconSpan.className = "badge-icon";
      iconSpan.textContent = b.icon;

      const nameSpan = document.createElement("span");
      nameSpan.className = "badge-name";
      nameSpan.textContent = b.name;

      item.appendChild(iconSpan);
      item.appendChild(nameSpan);
      badgesContainer.appendChild(item);
    });
  }

  function renderTasks() {
    taskList.textContent = "";
    const sorted = state.tasks.slice().sort((a, b) => (a.priority === b.priority ? 0 : a.priority ? -1 : 1));
    let doneCount = 0;

    sorted.forEach(task => {
      if (task.done) doneCount++;
      const li = document.createElement("li");
      li.className = "list-item" + (task.priority ? " is-priority" : "");

      const left = document.createElement("div");
      left.className = "item-left";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "custom-check";
      chk.checked = task.done;
      chk.onchange = () => {
        task.done = chk.checked;
        saveData(state);
        renderAll();
      };

      const span = document.createElement("span");
      span.className = "item-text" + (task.done ? " done" : "");
      span.textContent = task.text; // 6. منع innerHTML تماماً بالمهام

      left.appendChild(chk);
      left.appendChild(span);

      if (task.priority) {
        const tag = document.createElement("span");
        tag.className = "priority-tag";
        tag.textContent = "أهم 3";
        left.appendChild(tag);
      }

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete-btn";
      del.textContent = "✕";
      del.onclick = () => {
        state.tasks = state.tasks.filter(item => item.id !== task.id);
        saveData(state);
        renderAll();
      };

      li.appendChild(left);
      li.appendChild(del);
      taskList.appendChild(li);
    });

    tasksCounter.textContent = doneCount + " / " + state.tasks.length;
    emptyTasksMsg.style.display = state.tasks.length === 0 ? "block" : "none";
  }

  function renderHabits() {
    habitList.textContent = "";
    let doneCount = 0;
    state.habits.forEach(h => {
      if (h.done) doneCount++;
      const li = document.createElement("li");
      li.className = "list-item";

      const left = document.createElement("div");
      left.className = "item-left";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "custom-check";
      chk.checked = h.done;
      chk.onchange = () => {
        h.done = chk.checked;
        saveData(state);
        renderAll();
      };

      const span = document.createElement("span");
      span.className = "item-text" + (h.done ? " done" : "");
      span.textContent = h.text; // حماية بـ textContent

      left.appendChild(chk);
      left.appendChild(span);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete-btn";
      del.textContent = "✕";
      del.onclick = () => {
        state.habits = state.habits.filter(item => item.id !== h.id);
        saveData(state);
        renderAll();
      };

      li.appendChild(left);
      li.appendChild(del);
      habitList.appendChild(li);
    });
    habitsCounter.textContent = doneCount + " / " + state.habits.length;
  }

  function renderHistory() {
    historyList.textContent = "";
    emptyHistoryMsg.style.display = state.history.length === 0 ? "block" : "none";
    
    state.history.slice(0, 10).forEach(entry => {
      const box = document.createElement("div");
      box.className = "history-item";

      const head = document.createElement("div");
      head.className = "history-head";
      const s1 = document.createElement("span"); s1.textContent = entry.date;
      const s2 = document.createElement("span"); s2.textContent = "الإنجاز: " + entry.percent + "%";
      head.appendChild(s1); head.appendChild(s2);

      const pGoal = document.createElement("p");
      const b1 = document.createElement("b"); b1.textContent = "الهدف: ";
      pGoal.appendChild(b1);
      pGoal.append(entry.goal || "—");

      const pWin = document.createElement("p");
      const b2 = document.createElement("b"); b2.textContent = "أفضل إنجاز: ";
      pWin.appendChild(b2);
      pWin.append(entry.win || "—");

      const pTom = document.createElement("p");
      const b3 = document.createElement("b"); b3.textContent = "خطوة الغد: ";
      pTom.appendChild(b3);
      pTom.append(entry.tomorrow || "—");

      box.appendChild(head);
      box.appendChild(pGoal);
      box.appendChild(pWin);
      box.appendChild(pTom);
      historyList.appendChild(box);
    });
  }

  function showFeedback(msg) {
    actionFeedback.textContent = msg;
    setTimeout(() => { if (actionFeedback.textContent === msg) actionFeedback.textContent = ""; }, 3500);
  }

  function renderAll() {
    applyTheme();
    todayDateEl.textContent = formatTodayArabic();
    streakCount.textContent = String(state.streak || 0);

    mainGoalInput.value = state.mainGoal.text;
    mainGoalCheck.checked = state.mainGoal.done;
    if (state.mainGoal.done) mainGoalInput.classList.add("completed-text");
    else mainGoalInput.classList.remove("completed-text");

    reviewWin.value = state.review.win || "";
    reviewTomorrow.value = state.review.tomorrow || "";

    renderTasks();
    renderHabits();
    renderWeeklyProgress();
    renderBadges();
    renderHistory();
    calculateProgress();
  }

  // أحداث الصفحة
  themeToggle.onclick = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveData(state);
    applyTheme();
  };

  mainGoalInput.oninput = () => { state.mainGoal.text = mainGoalInput.value; saveData(state); calculateProgress(); };
  mainGoalCheck.onchange = () => {
    state.mainGoal.done = mainGoalCheck.checked;
    saveData(state);
    renderAll();
  };

  taskForm.onsubmit = (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    state.tasks.push({ id: "t_" + Date.now(), text, priority: taskPriorityCheck.checked, done: false });
    taskInput.value = "";
    saveData(state);
    renderAll();
  };

  habitForm.onsubmit = (e) => {
    e.preventDefault();
    const text = habitInput.value.trim();
    if (!text) return;
    state.habits.push({ id: "h_" + Date.now(), text, done: false });
    habitInput.value = "";
    saveData(state);
    renderAll();
  };

  [reviewWin, reviewTomorrow].forEach(el => {
    el.oninput = () => { state.review.win = reviewWin.value; state.review.tomorrow = reviewTomorrow.value; saveData(state); };
  });

  // 4. الحفظ الذكي للستريك (فحص الفرق الزمني بدقة + استبدال سجل نفس التاريخ)
  saveDayBtn.onclick = () => {
    const percent = calculateProgress();
    const todayKey = getTodayKey();

    if (percent === 0) {
      showFeedback("ما كمّلت شي اليوم لحد هسه. شطب مهمة او عادة وبعدين اقفل يومك.");
      return;
    }

    if (state.lastCompletedDate) {
      const lastDate = new Date(state.lastCompletedDate);
      const todayDate = new Date(todayKey);
      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        state.streak = (state.streak || 0) + 1;
      } else if (diffDays > 1) {
        state.streak = 1;
      }
      // إذا كان نفس اليوم (diffDays === 0) لا نزيد الستريك تكراراً
    } else {
      state.streak = 1;
    }

    state.lastCompletedDate = todayKey;
    if (percent === 100) state.last100 = true;

    // استبدال سجل نفس التاريخ بدلاً من تكراره
    const existingIndex = state.history.findIndex(h => h.rawDate === todayKey);
    const newEntry = {
      rawDate: todayKey,
      date: formatTodayArabic(),
      percent,
      goal: state.mainGoal.text.trim(),
      win: state.review.win.trim(),
      tomorrow: state.review.tomorrow.trim()
    };

    if (existingIndex >= 0) {
      state.history[existingIndex] = newEntry;
    } else {
      state.history.unshift(newEntry);
    }

    saveData(state);
    renderAll();
    showFeedback("تم حفظ إنجاز اليوم وتحديث الستريك بنجاح.");
  };

  // توليد بطاقة إنجاز بصرية (Canvas)
  const shareModal = document.getElementById("shareModal");
  const closeShareModal = document.getElementById("closeShareModal");
  const shareCanvas = document.getElementById("shareCanvas");

  shareCardBtn.onclick = () => {
    const ctx = shareCanvas.getContext("2d");
    const percent = calculateProgress();

    ctx.fillStyle = "#0F1D4A";
    ctx.fillRect(0, 0, 600, 600);

    ctx.strokeStyle = "#E2A43A";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 560);

    ctx.fillStyle = "#F7F3EA";
    ctx.font = "bold 26px 'Cairo', system-ui";
    ctx.textAlign = "right";
    ctx.fillText("إنجاز اليوم — شرارة", 540, 75);

    ctx.fillStyle = "#E2A43A";
    ctx.font = "16px 'Cairo', system-ui";
    ctx.fillText(formatTodayArabic(), 540, 105);

    ctx.fillStyle = "rgba(226, 164, 58, 0.15)";
    ctx.beginPath();
    ctx.arc(300, 260, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#E2A43A";
    ctx.font = "bold 44px 'Cairo', system-ui";
    ctx.textAlign = "center";
    ctx.fillText(percent + "%", 300, 275);

    ctx.fillStyle = "#C5C9D6";
    ctx.font = "16px 'Cairo', system-ui";
    ctx.fillText("نسبة إنجاز المهام والعادات", 300, 315);

    ctx.textAlign = "right";
    ctx.fillStyle = "#F7F3EA";
    ctx.font = "bold 18px 'Cairo', system-ui";
    ctx.fillText("الهدف الأساسي:", 540, 380);

    ctx.fillStyle = "#C5C9D6";
    ctx.font = "16px 'Cairo', system-ui";
    ctx.fillText(state.mainGoal.text ? (state.mainGoal.text.slice(0, 45) + (state.mainGoal.text.length > 45 ? "..." : "")) : "لم يتم تحديد هدف", 540, 410);

    ctx.fillStyle = "#E2A43A";
    ctx.font = "bold 16px 'Cairo', system-ui";
    ctx.textAlign = "center";
    ctx.fillText("تابعني على انستغرام: @1SAME4", 300, 500);

    ctx.fillStyle = "#9A6409";
    ctx.font = "14px 'Cairo', system-ui";
    ctx.fillText("Janabi AI — من عائلة النور", 300, 530);

    document.getElementById("downloadCardBtn").href = shareCanvas.toDataURL("image/png");
    shareModal.style.display = "flex";
  };

  closeShareModal.onclick = () => { shareModal.style.display = "none"; };

  newDayBtn.onclick = () => {
    state.mainGoal = { text: state.review.tomorrow.trim(), done: false };
    state.tasks = state.tasks.filter(t => !t.done);
    state.habits.forEach(h => { h.done = false; });
    state.review = { win: "", tomorrow: "" };
    saveData(state);
    renderAll();
    showFeedback("يوم جديد سعيد! تم نقل خطوة الغد لتكون هدفك اليوم.");
  };

  clearHistoryBtn.onclick = () => { state.history = []; saveData(state); renderHistory(); showFeedback("تم مسح السجل."); };

  renderAll();
})();

