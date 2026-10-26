import re,urllib.parse as U
src='/home/claude/1same4.github.io/v2/index.html'
s=open(src,encoding='utf8').read()
T={
"🎙️ كلّمني بصوتك":"🎙️ Talk by voice","🎙️ دز بصمة":"🎙️ Send a voice note",
"🔴 يسجّل… 0:00 (اضغط المايك حتى ترسل)":"🔴 Recording… 0:00 (tap the mic to send)",
"🔴 يسجّل… ":"🔴 Recording… "," (اضغط المايك حتى ترسل)":" (tap the mic to send)",
"ما گدرت أفتح المايك. اسمح للموقع يستخدمه":"Could not open the mic. Please allow microphone access",
"[رسالة صوتية]":"[voice note]",
'Janabi AI · حلول واستشارات رقمية':'Janabi AI · Digital Solutions & Consulting',
'Janabi AI وكالة حلول رقمية ببغداد: مواقع وتطبيقات وأنظمة ووكلاء ذكيين، تصميم وإعلانات، واستشارات مشاريع. فكرتك تصير مشروع.':'Janabi AI is a digital solutions agency in Baghdad: websites, apps, systems and AI agents, brand design, and project consulting. Your idea, made real.',
'Janabi AI · فكرتك تصير مشروع':'Janabi AI · Your idea, made real',
'مواقع، أنظمة، وكلاء ذكيين، تصميم وإعلانات. جرّب نموذج محلك گدامك.':'Websites, systems, AI agents and design. Watch a demo of your business get built live.',
'حلول واستشارات رقمية':'Digital solutions & consulting',
'الأقسام':'Sections','جرّب گدامك':'Try it live','خدماتنا':'Services','احسب توفيرك':'Savings','أثرنا':'Our impact','تواصل':'Contact',
'تبديل الوضع':'Toggle theme','ابدأ مشروعك':'Start your project',
'Janabi AI · حلول واستشارات رقمية · بغداد':'Janabi AI · Digital solutions · Baghdad',
'فكرتك تصير':'Your idea becomes','مشروع شغّال':'a working business',
'حلول ذكية لـ':'Smart solutions for ','المطاعم والكوفيات':'restaurants & cafés','العيادات':'clinics','المتاجر':'shops','الشركات':'companies','المؤسسات':'institutions',
'نبني المواقع والأنظمة والوكلاء الأذكياء، نصمم هويتك، وندرس فكرتك قبل ما تصرف عليها. من فكرة على ورق، لمشروع يشتغل ويجيب زبائن.':'We build websites, systems and AI agents, design your brand, and study your idea before you spend on it. From an idea on paper to a business that brings customers.',
'مساعد Janabi AI · متصل هسه':'Janabi AI assistant · online now',
'اكتب رسالتك لسراج…':'Write to Siraj…','رسالتك لسراج':'Your message to Siraj','احچي ويا سراج بصوتك':'Talk to Siraj by voice','إرسال':'Send',
'جرّب بنفسك':'Try it yourself','اختار نوع شغلك، وشوف موقعك يتبنى':'Pick your business, watch your site get built',
'اكتب اسم شغلك واختار الستايل. خلال ثواني يتركب نموذج موقعك، ويطلع باركود باسمك. هذا مو فيديو، يتبنى هسه گدامك.':'Type your business name and pick a style. In seconds your demo site assembles itself, with a QR code in your name. Not a video: it is built live, right now.',
'نوع شغلك':'Your business','مطعم وكوفي':'Restaurant & café','عيادة':'Clinic','متجر':'Shop','شركة':'Company','مؤسسة':'Institution',
'اسم شغلك':'Business name','مثلاً: كوفي الياسمين':'e.g. Jasmine Café','الستايل':'Style','فخم':'Luxe','دافي':'Warm','حديث':'Fresh',
'كوفي الياسمين':'Jasmine Café','مثال':'Demo','قهوتك جاهزة':'Your coffee is ready','اطلب من طاولتك بالباركود':'Order from your table by QR','احجز طاولة':'Book a table',
'هلا بيك! آني المساعد الذكي، شتحب أحجزلك؟':'Hi! I am your smart assistant. What can I book for you?',
'باركود النموذج':'Demo QR code','باركود طاولة رقم 1':'Table 1 QR code',
'نرسم الهيكل':'Sketch the layout','نلوّن بهويتك':'Apply your colors','نحط المنيو والخدمات':'Add menu & services','زر الحجز والطلب':'Booking & order button','المساعد الذكي يرحّب':'AI assistant says hi',
'صوّر الباركود بتلفونك ✦ يفتحلك واتساب Janabi AI ويا اسم محلك.':'Scan the QR with your phone ✦ it opens Janabi AI on WhatsApp with your business name.',
'الأصناف والأسعار مثال للتوضيح.':'Items and prices are examples only.',
'ثلاث خدمات. كل وحدة تخلص شغل حقيقي':'Three services. Each one gets real work done',
'أي شي يخص الإنترنت نشتغله: نسمع فكرتك، ندرسها، ونسلّمك شي يشتغل.':'Anything online, we build it: we listen, we study, and we deliver something that works.',
'مواقع وأنظمة ووكلاء أذكياء':'Websites, systems & AI agents','شغلك يشتغل أونلاين ليل ونهار، حتى وأنت نايم.':'Your business works online day and night, even while you sleep.',
'موقع وتطبيق باسمك':'A website and app in your name','منيو بالباركود وحجوزات':'QR menu and bookings','وكيل ذكي يرد على زبائنك':'An AI agent that answers your customers',
'النموذج الخام':'Master template','قيد البناء':'In progress','جرّبه گدامك':'Try it live',
'هوية وتصميم':'Brand & design','هوية وحدة تخلي الناس تتذكرك من أول نظرة.':'One identity people remember at first sight.',
'شعار وكارت':'Logo and business card','لافتة، واجهة، وديكور':'Signage, storefront and interior','ريلز إعلانية بالذكاء الاصطناعي':'AI-made ad reels','اطلب هويتك':'Get your brand',
'استشارات ودراسة مشاريع':'Consulting & project studies','نحسب فكرتك قبل ما تصرف عليها دينار.':'We run the numbers before you spend a dinar.',
'الكلفة والربح وأسوأ احتمال':'Cost, profit and worst case','تجربة بأقل كلفة':'A low-cost first test','خطة تمشي عليها خطوة بخطوة':'A step-by-step plan',
'نموذج دراسة':'Sample study','عندي فكرة مشروع وأريد رأيكم بيها':'I have a project idea and want your opinion','اسأل سراج عن فكرتك':'Ask Siraj about your idea',
'شكد يوفرلك النظام الذكي؟':'How much can a smart system save you?',
'حرّك المسطرة وشوف الرقم. الحساب تقريبي، حتى تعرف هل الفكرة تستاهل لشغلك.':'Move the sliders and see the number. A rough estimate, so you know if it is worth it for your business.',
'كم ساعة باليوم تروح على الرسائل والحجوزات؟':'Hours a day spent on messages and bookings',
'راتب موظف الاستقبال بالشهر (ألف دينار)':'Receptionist monthly salary (thousand IQD)','كلفة النظام لمرة وحدة (ألف دينار، مثال)':'One-time system cost (thousand IQD, example)',
'وقتك الضايع يسوى كل شهر تقريباً':'Your lost time is worth about this every month','ألف دينار':'thousand IQD','شهور ويرجع راس مالك':'months to pay for itself','مليون دينار توفير بالسنة':'million IQD saved per year',
'تقدير على أساس دوام 8 ساعات. مو وعد، الرقم الحقيقي نحسبه وياك.':'Based on an 8-hour workday. Not a promise: we work out the real number with you.',
'نماذج شغلنا':'Our work','لكل نوع شغل، نموذج احترافي':'A professional template for every kind of business',
'نبني نموذج قوي لكل قطاع، وبعدين نفصّله على هوية كل زبون. النماذج تنزل هنا وحدة وحدة.':'We build one strong template per sector, then tailor it to each client. Samples land here one by one.',
'نظام الكوفي الذكي':'Smart café system','منيو بالباركود، حجز طاولة، طلب للواتساب.':'QR menu, table booking, orders to WhatsApp.','قريباً':'Soon',
'حجز مواعيد، وتذكير للمراجع.':'Appointments and patient reminders.','مطعم':'Restaurant','منيو بالصور وطلبات توصيل.':'Photo menu and delivery orders.',
'شركة ومؤسسة':'Company & institution','موقع رسمي، استمارات، ولوحة أرقام.':'Official site, forms and a live dashboard.',
'طريقة الشغل':'How we work','أربع خطوات، بلا تعقيد':'Four steps, no fuss',
'نسمع فكرتك':'We listen','رسالة واتساب أو مكالمة قصيرة تكفي.':'A WhatsApp message or a short call is enough.',
'نموذج أول':'First draft','تشوف الاتجاه قبل الدفع الكامل.':'You see the direction before full payment.',
'نعدّل سوا':'We refine together','لحد ما يطابق اللي اتفقنا عليه.':'Until it matches what we agreed.',
'تسليم وفحص':'Delivery & testing','رابط شغّال، ومعاه تقرير فحص السرعة.':'A live link, with a speed test report.',
'المؤسس':'Founder','خبرة من الميدان، مو من الكتب':'Experience from the field, not from books',
'علي الجنابي':'Ali Al-Janabi','مؤسس Janabi AI':'Founder of Janabi AI',
'بديت من مطبعة ببغداد، وبعدها السفر والسياحة، وأسست شركتي الخاصة. تعلمت شلون أفهم الزبون وأحل مشكلته على الأرض. اليوم أحول هالخبرة لحلول رقمية بالذكاء الاصطناعي، أسرع وبكلفة أقل.':'I started in a print shop in Baghdad, moved into travel and tourism, and founded my own company. I learned to understand customers and solve their problems on the ground. Today I turn that experience into AI-powered digital solutions, faster and at lower cost.',
'إدارة مطبعة':'Running a print shop','بديت مصمم، وصرت أدير مطبعة كاملة: تصميم، طباعة، ولافتات.':'Started as a designer, ended up running the whole press: design, printing and signage.',
'سفر وسياحة':'Travel & tourism','مندوب سياحة وقائد رحلات. تعلمت أتعامل ويا الناس وأحل مشاكلهم على الأرض.':'Travel representative and tour leader. Learned to handle people and fix problems on the ground.',
'شركتي الخاصة':'My own company','أسست شركة سفر وسياحة، وتعلمت شلون تمشي شركة من الصفر.':'Founded a travel company and learned to run a business from zero.',
'اليوم أحول كل هالخبرة لحلول رقمية بالذكاء الاصطناعي.':'Today I turn all of it into AI-powered digital solutions.',
'نعلّم الشباب أدوات الذكاء الاصطناعي ببلاش':'We teach young people AI tools for free',
'ونسوي منهم قادة يعلّمون غيرهم. واللي يثبت نفسه، يشتغل ويانا.':'And grow them into leaders who teach others. Those who prove themselves work with us.',
'المبادرة الخضراء':'Green Initiative','شباب يستخدمون الذكاء الاصطناعي لأفكار تخدم بيئتهم. كل شاب نسويه قائد، وكل قائد يصنع قادة.':'Young people using AI for ideas that serve their environment. Every youth becomes a leader, and every leader makes more.',
'دروس مجانية':'Free lessons','دروس قصيرة وبسيطة: شلون تتكلم ويا الذكاء الاصطناعي، وسيرتك الذاتية بعشر دقايق.':'Short, simple lessons: how to talk to AI, and your CV in ten minutes.',
'خبّرني أول ما تنزل ←':'Notify me →','كون شريكنا':'Partner with us',
'جهة داعمة، شركة، أو صانع محتوى؟ ترعى ورشة، توفر أدوات، أو تفتح فرصة تدريب.':'A funder, company or creator? Sponsor a workshop, provide tools, or open a training opportunity.',
'تواصل ويانا ←':'Get in touch →','شباب تدربوا':'Youth trained','ورش مجانية':'Free workshops','مشاريع شبابية':'Youth projects',
'ليش Janabi AI':'Why Janabi AI','أرقام تحچي عنا':'Numbers that speak for us',
'سرعة مفحوصة':'Tested speed','موقعنا ياخذ 96 من 100 بفحص Google. ونسلّمك نفس الفحص ويا كل موقع نبنيه.':'Our site scores 96/100 on Google\'s test, and every site we build ships with the same report.',
'مساعد ما ينام':'An assistant that never sleeps','سراج يرد على زبائنك بأي وقت، حتى وأنت نايم.':'Siraj answers your customers any time, even while you sleep.',
'خبرة من الميدان':'Field experience','طباعة، سياحة، وشركة خاصة. واليوم كل هالخبرة بالذكاء الاصطناعي.':'Print, tourism and our own company. Now all of it powered by AI.',
'عندك فكرة؟ خلّينا نبنيها.':'Got an idea? Let\'s build it.','اكتبلنا بسطرين شنو تحتاج، ونرد عليك بنفس اليوم.':'Tell us in two lines what you need. We reply the same day.',
'راسلنا على واتساب':'Message us on WhatsApp','أريد أبدي مشروع، شنو تحتاج تعرف مني؟':'I want to start a project. What do you need to know from me?','اسأل سراج':'Ask Siraj',
'واتساب':'WhatsApp','رد سريع، كتابة أو صوت':'Quick reply, text or voice','الإيميل':'Email','للشركات والعروض الرسمية':'For companies and formal offers','إنستغرام':'Instagram','شوف شغلنا يومياً':'See our daily work',
'انسخ رقم الهاتف':'Copy phone number','بغداد، العراق':'Baghdad, Iraq','· علي الجنابي · بغداد':'· Ali Al-Janabi · Baghdad',
'نعلّم شباب العراق الذكاء الاصطناعي ببلاش':'Teaching Iraqi youth AI for free','إغلاق':'Close',
'صار خلل، جرّب مرة ثانية':'Something went wrong, please try again','ماكو اتصال هسه. جرّب بعد شوية، أو احچي ويا علي بالواتساب.':'No connection right now. Try again shortly, or message us on WhatsApp.',
'📞 كلّمني بصوتك':'📞 Talk by voice','💬 واتساب':'💬 WhatsApp',
'أهلاً، نورتنا 👋\\nأنا سراج، مساعد Janabi AI.\\nتحب نتكلم كتابة، أو بصوتك؟':'Welcome 👋\\nI\'m Siraj, the Janabi AI assistant.\\nWould you like to chat by text, or by voice?',
'✨ جرّب نموذج لشغلك':'✨ Try a demo for your business','🧩 شوف خدماتنا':'🧩 See our services','💡 عندي فكرة':'💡 I have an idea',
'عندي فكرة مشروع وأريد أعرف منين أبدي':'I have a project idea and want to know where to start',
'طلبك جاهز بدقيقة':'Your order, ready in a minute','منيو بالباركود، وحجز طاولة':'QR menu and table booking','هلا بيك! تحب أحجزلك طاولة لو تطلب توصيل؟':'Hi! Book a table or order delivery?',
'سبانش لاتيه':'Spanish latte','V60 إثيوبي':'Ethiopian V60','مسگوف عراقي':'Iraqi masgouf','كيكة تمر':'Date cake',
'مثلاً: متجر نور للعطور':'e.g. Noor Perfumes','تسوّق من بيتك':'Shop from home','اطلب، والطلب يوصلك للباب':'Order, and it comes to your door','اطلب بالواتساب':'Order on WhatsApp','هلا بيك! شنو تدور عليه اليوم؟':'Hi! What are you looking for today?',
'عطر مسائي':'Evening perfume','ساعة كلاسيك':'Classic watch','حقيبة جلد':'Leather bag','توصيل داخل بغداد':'Delivery in Baghdad',
'مثلاً: منتدى شباب بغداد':'e.g. Baghdad Youth Center','خدماتنا أقرب لك':'Our services, closer to you','استمارات، مواعيد، وأخبار':'Forms, appointments and news','قدّم طلبك أونلاين':'Apply online','هلا بيك! شنو المعاملة اللي تحتاجها؟':'Hi! Which service do you need?',
'التسجيل بالورش':'Workshop sign-up','مفتوح':'Open','حجز موعد':'Book a visit','أونلاين':'Online','استمارة متابعة':'Follow-up form','دقيقة وحدة':'One minute','آخر الأخبار':'Latest news','يومياً':'Daily',
'مثلاً: عيادة د. سارة':'e.g. Dr. Sara Clinic','موعدك بدقيقة':'Your appointment in a minute','احجز من تلفونك، بلا انتظار':'Book from your phone, no waiting','احجز موعد':'Book appointment','هلا بيك! أي يوم يناسبك للموعد؟':'Hi! Which day suits you?',
'كشفية':'Check-up','تنظيف أسنان':'Teeth cleaning','تبييض':'Whitening','استشارة أونلاين':'Online consultation',
'مثلاً: شركة الرافدين للتجارة':'e.g. Rafidain Trading Co.','شريكك الموثوق':'Your trusted partner','خدماتنا، عروضنا، وتواصل مباشر':'Our services, offers and direct contact','اطلب عرض سعر':'Request a quote','هلا بيك! شنو الخدمة اللي تحتاجها؟':'Hi! Which service do you need?',
'استشارة أولى':'First consultation','مجانية':'Free','عرض سعر':'Quote','خلال يوم':'Within a day','تنفيذ':'Delivery','حسب الاتفاق':'As agreed','دعم فني':'Support','24 ساعة':'24 hours',
'مثلاً: ':'e.g. ','هلا بيك!':'Hi!','هلا بيك بـ':'Welcome to ','أريد نموذج مثل ':'I want a demo like ','باركود ':'QR · ','تم النسخ ✓':'Copied ✓',
'سراج':'Siraj','ك':'J',
}
for k in sorted(T,key=len,reverse=True):
  s=s.replace(k,T[k])
s=s.replace('<html lang="ar" dir="rtl">','<html lang="en" dir="ltr">')
s=s.replace("'هلا بيك!','","'Hi!','")
s=s.replace("d.bot.replace('Hi!','Welcome to '+n+'!')","d.bot.replace('Hi!','Welcome to '+n+'!')")
s=s.replace('<meta property="og:locale" content="ar_IQ">','<meta property="og:locale" content="en_US">')
s=s.replace('<meta property="og:url" content="https://janabiai.com/">','<meta property="og:url" content="https://janabiai.com/en/">')
s=s.replace('<link rel="alternate" hreflang="en" href="https://janabiai.com/en/">','<link rel="alternate" hreflang="ar" href="https://janabiai.com/"><link rel="canonical" href="https://janabiai.com/en/">')
s=s.replace('<a class="ibtn" href="/v2/en.html" id="en" lang="en" aria-label="EN English">EN</a>','<a class="ibtn" href="/" id="en" lang="ar" aria-label="ع العربية" style="font-family:var(--f-d)">ع</a>')
s=s.replace("$('en').onclick=function(){try{localStorage.setItem('lang','en')}catch(e){}};","$('en').onclick=function(){try{localStorage.setItem('lang','ar')}catch(e){}};")
s=re.sub(r'<script>try\{var L=localStorage.getItem\("lang"\);if\(L==="en"\)location.replace\("/en/"\);','<script>try{',s)
s=s.replace(".fab{position:fixed;left:18px;",".fab{position:fixed;right:18px;").replace(".sheet-in{position:absolute;left:16px;",".sheet-in{position:absolute;right:16px;").replace(".sheet-x{position:absolute;top:10px;left:10px;",".sheet-x{position:absolute;top:10px;right:10px;")
s=s.replace("var core=n.replace(/^(كوفي|كافيه|مطعم|عيادة|شركة|متجر|منتدى|مؤسسة|دائرة|د\\.)\\s*/,'').replace(/^ال/,'');","var core=n.replace(/^(Dr\\.|The)\\s*/i,'');")
s=s.replace("'/new/?embed=1'","'/new/?embed=1&lang=en'")
# WhatsApp prefilled english
s=re.sub(r'https://wa.me/9647715110011\?text=%D9%87%D9%84%D8%A7%20Janabi[^"]*','https://wa.me/9647715110011?text='+U.quote("Hi Janabi AI, I have an idea and want to start"),s)
s=re.sub(r'https://wa.me/9647715110011\?text=%D9%87%D9%84%D8%A7%20%D8%B9%D9%84%D9%8A[^"]*','https://wa.me/9647715110011?text='+U.quote("Hi, notify me when the free lessons launch"),s)
s=s.replace('.word small{','.word small{font-family:var(--f-b);')
left=[l for l in re.findall(r'[؀-ۿ][^<>"\n]{0,40}',re.sub(r'var qrcode=.*?\n','',s,flags=re.S))]
print('arabic left:',left[:20])
open('/home/claude/1same4.github.io/v2/en.html','w',encoding='utf8').write(s)
