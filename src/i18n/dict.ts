/**
 * Translations for ZimSmartMeter.
 *
 * Design: a flat key → per-language string map. No i18n library — the app
 * is small enough that a typed dictionary beats 40 kB of machinery, and
 * TypeScript then guarantees every key exists in English (the fallback).
 * Missing translations fall back to English rather than showing a key,
 * so a partially translated screen degrades gracefully.
 *
 * Shona (chiShona) and Ndebele (isiNdebele) strings are written for a
 * Zimbabwean audience; Chinese is Simplified (简体中文). Community review
 * from native speakers is welcome — see CONTRIBUTING notes in the README.
 */

export const languages = {
  en: "English",
  sn: "chiShona",
  nd: "isiNdebele",
  zh: "中文",
} as const;

export type Lang = keyof typeof languages;

type Entry = Record<Lang, string>;

export const dict = {
  // ── brand / chrome ────────────────────────────────────────
  "nav.dashboard": {
    en: "Dashboard", sn: "Dashboard", nd: "Ideshibhodi", zh: "仪表板",
  },
  "nav.askNoby": {
    en: "Ask Noby", sn: "Bvunza Noby", nd: "Buza uNoby", zh: "问 Noby",
  },
  "nav.simulator": {
    en: "Simulator", sn: "Simulator", nd: "Isimulator", zh: "模拟器",
  },
  "nav.activity": {
    en: "Activity", sn: "Zvakaitika", nd: "Okwenzakeleyo", zh: "活动记录",
  },
  "nav.signOut": {
    en: "Sign out", sn: "Buda", nd: "Phuma", zh: "退出登录",
  },
  "nav.menu": { en: "Menu", sn: "Menyu", nd: "Imenyu", zh: "菜单" },
  "chrome.demo": { en: "demo", sn: "demo", nd: "demo", zh: "演示" },
  "chrome.offline": {
    en: "offline · last known data",
    sn: "hapana net · data yekupedzisira",
    nd: "akulantanethi · idatha yakuqala",
    zh: "离线 · 最近数据",
  },
  "chrome.disclaimer": {
    en: "Independent proof-of-concept. Not affiliated with ZESA. All meters and payments are simulated demo data.",
    sn: "Chirongwa chakazvimirira. Hachina hukama neZESA. Mamita nemari zvese ndezvekuedza chete.",
    nd: "Uhlelo oluzimeleyo. Aluhlangani leZESA. Wonke amamitha lezimali ziyidatha yokulinga.",
    zh: "独立概念验证项目，与 ZESA 无关联。所有电表和付款均为模拟演示数据。",
  },

  // ── landing: hero ─────────────────────────────────────────
  "landing.eyebrow": {
    en: "Magetsi · prepaid electricity · demo",
    sn: "Magetsi · anobhadharwa mberi · demo",
    nd: "Ugesi · okhokhelwa phambili · demo",
    zh: "预付费电力 · 演示",
  },
  "landing.headline": {
    en: "Power, credited the moment you pay.",
    sn: "Magetsi anopinda ipapo paunobhadhara.",
    nd: "Ugesi ungena khonapho nxa ukhokha.",
    zh: "付款瞬间，电力即刻到账。",
  },
  "landing.sub": {
    en: "ZimSmartMeter is an independent Zimbabwean proof-of-concept: a verified payment becomes meter credit automatically — no 20-digit token to type. Balance, usage and history, live on any phone.",
    sn: "ZimSmartMeter chirongwa chekuedza chekuZimbabwe: mari yabhadharwa inoshanduka ichizova magetsi pameter yako pasina kunyora token yemanhamba makumi maviri. Mari yasara, kushandiswa, nenhoroondo — zvese pafoni yako.",
    nd: "ZimSmartMeter luhlelo lokulinga lwaseZimbabwe: imali ekhokhelweyo iphenduka ibe ngugesi emitheni ngokwayo — akudingeki ubhale ithokheni yamadijithi angu-20. Ibhalansi, ukusetshenziswa lomlando — konke efonini yakho.",
    zh: "ZimSmartMeter 是一个独立的津巴布韦概念验证项目：付款经验证后自动转为电表余额——无需输入 20 位充值码。余额、用量与记录，尽在手机。",
  },
  "landing.signIn": {
    en: "Sign in with phone",
    sn: "Pinda nefoni yako",
    nd: "Ngena ngefoni yakho",
    zh: "手机登录",
  },
  "landing.viewSource": {
    en: "View the source", sn: "Ona kodhi", nd: "Bona ikhodi", zh: "查看源码",
  },
  "landing.demoNote": {
    en: "Demo phone numbers with fixed codes — no real SMS needed. Open source, built in Zimbabwe.",
    sn: "Nhamba dzekuedza dzine makodhi akagadzikana — hapana SMS chaiyo. Kodhi yakavhurika, yakavakwa muZimbabwe.",
    nd: "Izinombolo zokulinga ezilamakhodi amiswayo — akudingeki i-SMS yangempela. Ikhodi evulekileyo, yakhiwe eZimbabwe.",
    zh: "演示手机号使用固定验证码，无需真实短信。开源项目，津巴布韦制造。",
  },
  "landing.animCaption": {
    en: "One payment event, verified exactly once — watch the duplicate bounce — then credited straight to the meter. No 20-digit token.",
    sn: "Kubhadhara kumwe chete, kunoongororwa kamwe chete — ona kupeta kuchidzoserwa — kwozopinda pameter. Pasina token.",
    nd: "Ukukhokha okukodwa, okuqinisekiswa kanye kuphela — bona okuphindwe kabili kubuyiselwa — besekufakwa emitheni. Akulathokheni.",
    zh: "一次付款事件，恰好验证一次——看重复请求被弹回——随后直接入账电表。无需充值码。",
  },

  // ── landing: sections ─────────────────────────────────────
  "landing.howEyebrow": {
    en: "How it works", sn: "Zvinoshanda sei", nd: "Kusebenza njani", zh: "运作方式",
  },
  "landing.howTitle": {
    en: "Three steps. One transaction. Zero double credits.",
    sn: "Matanho matatu. Kutengeserana kumwe. Hapana kupeta.",
    nd: "Izinyathelo ezintathu. Ukuthenga kunye. Akulakuphindwa.",
    zh: "三个步骤，一笔交易，零重复入账。",
  },
  "landing.step1": { en: "Pay", sn: "Bhadhara", nd: "Khokha", zh: "付款" },
  "landing.step1b": {
    en: "Choose your meter and an amount — $10 to $100 — priced by a configurable tariff.",
    sn: "Sarudza meter yako nemari — $10 kusvika $100 — inoenderana netariff.",
    nd: "Khetha imitha yakho lemali — $10 kuya ku-$100 — ngokwentengo emisiweyo.",
    zh: "选择电表和金额（10–100 美元），按可配置电价计算。",
  },
  "landing.step2": { en: "Verify", sn: "Ongorora", nd: "Qinisekisa", zh: "验证" },
  "landing.step2b": {
    en: "The payment is checked once, and only once. A duplicate event can never credit twice — the database guarantees it.",
    sn: "Kubhadhara kunoongororwa kamwe chete. Kupeta hakugoni kupinza magetsi kaviri — database inovimbisa izvozvo.",
    nd: "Ukukhokha kuhlolwa kanye kuphela. Okuphindiweyo akungeke kufake ugesi kabili — idathabheyisi iyakuqinisekisa.",
    zh: "付款仅核验一次。重复事件绝不会二次入账——由数据库保证。",
  },
  "landing.step3": { en: "Credit", sn: "Pinza magetsi", nd: "Faka ugesi", zh: "入账" },
  "landing.step3b": {
    en: "Units land on the meter automatically. Balance and history update live on your phone.",
    sn: "Mayuniti anopinda pameter oga. Bhalansi nenhoroondo zvinogadziriswa pafoni yako.",
    nd: "Amayunithi angena emitheni ngokwawo. Ibhalansi lomlando kuvuselelwa efonini yakho.",
    zh: "电量自动到达电表，余额与记录在手机上实时更新。",
  },
  "landing.featuresEyebrow": {
    en: "Features", sn: "Zvinokwanisika", nd: "Izinto ezenzekayo", zh: "功能",
  },
  "landing.featuresTitle": {
    en: "Built like a national utility app should be.",
    sn: "Yakavakwa sekafanira app yemagetsi yenyika.",
    nd: "Yakhiwe njengoba i-app kagesi yelizwe kumele ibe njalo.",
    zh: "按国家级公用事业应用的标准打造。",
  },
  "landing.techEyebrow": {
    en: "Technology", sn: "Tekinoroji", nd: "Ubuchwepheshe", zh: "技术",
  },
  "landing.techTitle": {
    en: "Engineered in the open.",
    sn: "Yakavakwa pachena.",
    nd: "Yakhiwe obala.",
    zh: "开放式工程实践。",
  },
  "landing.techBody": {
    en: "Every architectural decision — idempotency, row-level security, the registry emulation, the MQTT topic design — is documented in the repository and built in reviewable stages.",
    sn: "Sarudzo dzese dzekuvaka — idempotency, chengetedzo yemitsara, registry, uye MQTT — zvakanyorwa muripositori uye zvakavakwa nhanho nhanho.",
    nd: "Zonke izinqumo zokwakha — idempotency, ukuvikeleka kwemizila, i-registry, le-MQTT — kubhaliwe ku-repository njalo kwakhiwa ngezigaba.",
    zh: "每一项架构决策——幂等性、行级安全、注册表模拟、MQTT 主题设计——均记录在仓库中，并分阶段可审阅地实现。",
  },
  "landing.disclaimerEyebrow": {
    en: "Independent demo", sn: "Demo yakazvimirira", nd: "Idemo ezimeleyo", zh: "独立演示",
  },
  "landing.builtBy": {
    en: "Designed & built by", sn: "Yakagadzirwa na", nd: "Yakhiwe ngu", zh: "设计与开发：",
  },

  // ── auth ──────────────────────────────────────────────────
  "login.title": { en: "Sign in", sn: "Pinda", nd: "Ngena", zh: "登录" },
  "login.sub": {
    en: "We send a one-time code to your phone.",
    sn: "Tinotumira kodhi yenguva imwe pafoni yako.",
    nd: "Sithumela ikhodi yesikhathi esisodwa efonini yakho.",
    zh: "我们会向您的手机发送一次性验证码。",
  },
  "login.phone": { en: "Phone number", sn: "Nhamba yefoni", nd: "Inombolo yefoni", zh: "手机号码" },
  "login.send": { en: "Send code", sn: "Tumira kodhi", nd: "Thumela ikhodi", zh: "发送验证码" },
  "login.sending": { en: "Sending…", sn: "Kutumira…", nd: "Iyathumela…", zh: "发送中…" },
  "login.codeTitle": { en: "Enter the code", sn: "Isa kodhi", nd: "Faka ikhodi", zh: "输入验证码" },
  "login.verify": {
    en: "Verify & sign in", sn: "Simbisa upinde", nd: "Qinisekisa ungene", zh: "验证并登录",
  },
  "login.changeNumber": {
    en: "Change number", sn: "Chinja nhamba", nd: "Guqula inombolo", zh: "更换号码",
  },
  "login.demoAccess": {
    en: "Demo access · no SMS needed",
    sn: "Kuedza · hapana SMS inodiwa",
    nd: "Ukulinga · akudingeki i-SMS",
    zh: "演示登录 · 无需短信",
  },

  // ── dashboard ─────────────────────────────────────────────
  "dash.title": { en: "Your meters", sn: "Mamita ako", nd: "Amamitha akho", zh: "我的电表" },
  "dash.connectMeter": {
    en: "+ Connect a meter", sn: "+ Batanidza meter", nd: "+ Xhuma imitha", zh: "+ 绑定电表",
  },
  "dash.noMeters": {
    en: "No meters yet", sn: "Hapana meter parizvino", nd: "Awukho amamitha okwakhathesi", zh: "暂无电表",
  },
  "dash.demoMeter": {
    en: "Create my demo meter",
    sn: "Ndipe meter yekuedza",
    nd: "Ngenzela imitha yokulinga",
    zh: "创建演示电表",
  },
  "dash.connectExisting": {
    en: "Connect existing meter",
    sn: "Batanidza meter yaunayo",
    nd: "Xhuma imitha olayo",
    zh: "绑定现有电表",
  },
  "dash.consumption": {
    en: "Daily consumption",
    sn: "Kushandiswa kwezuva",
    nd: "Ukusetshenziswa kwansuku",
    zh: "每日用电量",
  },
  "dash.recentActivity": {
    en: "Recent activity", sn: "Zvichangobva kuitika", nd: "Okwenzeke muva", zh: "最近活动",
  },
  "dash.viewAll": { en: "View all", sn: "Ona zvese", nd: "Bona konke", zh: "查看全部" },
  "dash.balance": { en: "Balance", sn: "Yasara", nd: "Ibhalansi", zh: "余额" },
  "dash.buy": {
    en: "Buy electricity", sn: "Tenga magetsi", nd: "Thenga ugesi", zh: "购买电力",
  },

  // ── buy wizard ────────────────────────────────────────────
  "buy.amountTitle": {
    en: "Buy electricity", sn: "Tenga magetsi", nd: "Thenga ugesi", zh: "购买电力",
  },
  "buy.amountLabel": {
    en: "Amount (min $5)", sn: "Mari (padiki $5)", nd: "Imali (okulancane $5)", zh: "金额（最低 5 美元）",
  },
  "buy.continue": { en: "Continue", sn: "Enderera", nd: "Qhubeka", zh: "继续" },
  "buy.cancel": { en: "Cancel", sn: "Kanzura", nd: "Khansela", zh: "取消" },
  "buy.methodTitle": {
    en: "How will you pay?",
    sn: "Uchabhadhara sei?",
    nd: "Uzakhokha njani?",
    zh: "选择付款方式",
  },
  "buy.confirmTitle": {
    en: "Confirm purchase", sn: "Simbisa kutenga", nd: "Qinisekisa ukuthenga", zh: "确认购买",
  },
  "buy.youReceive": {
    en: "You receive", sn: "Unowana", nd: "Uzathola", zh: "您将获得",
  },
  "buy.done": { en: "Done", sn: "Zvapera", nd: "Sekuqedile", zh: "完成" },
  "buy.credited": {
    en: "Power credited", sn: "Magetsi apinda", nd: "Ugesi ufakiwe", zh: "电力已入账",
  },
  "buy.newBalance": {
    en: "New balance", sn: "Bhalansi itsva", nd: "Ibhalansi entsha", zh: "新余额",
  },

  // ── agent ─────────────────────────────────────────────────
  "agent.title": { en: "Agent Noby", sn: "Agent Noby", nd: "Agent Noby", zh: "Noby 智能助手" },
  "agent.runCheck": {
    en: "run check now", sn: "tarisa izvozvi", nd: "hlola khathesi", zh: "立即检查",
  },
  "agent.quiet": {
    en: "Watching your meters every few minutes — nothing needs you right now. Proposals and alerts land here.",
    sn: "Ndiri kutarisa mamita ako maminetsi ega ega — hapana chaunodiwa parizvino. Zvirevo nenyevero zvinouya pano.",
    nd: "Ngiqaphele amamitha akho njalo ngemizuzu — akulalutho olukudingayo khathesi. Iziphakamiso lezexwayiso zizafika lapha.",
    zh: "每隔几分钟监测您的电表——目前无需处理。建议与提醒将显示在此。",
  },
  "agent.dismiss": { en: "Dismiss", sn: "Bvisa", nd: "Susa", zh: "忽略" },

  // ── assistant ─────────────────────────────────────────────
  "chat.title": {
    en: "Noby · Energy Agent",
    sn: "Noby · Mubatsiri wemagetsi",
    nd: "Noby · Umsizi kagesi",
    zh: "Noby · 能源助手",
  },
  "chat.sub": {
    en: "Answers come only from your meter's data. Estimates are labelled.",
    sn: "Mhinduro dzinobva pane data yemeter yako chete. Fungidziro dzinoratidzwa.",
    nd: "Izimpendulo zivela kwidatha yemitha yakho kuphela. Izilinganiso ziyakhonjwa.",
    zh: "回答仅基于您电表的数据。估算值会明确标注。",
  },
  "chat.newChat": { en: "new chat", sn: "hurukuro itsva", nd: "ingxoxo entsha", zh: "新对话" },
  "chat.ask": { en: "Ask", sn: "Bvunza", nd: "Buza", zh: "提问" },
  "chat.placeholder": {
    en: "How long will my balance last?",
    sn: "Bhalansi yangu ichagara kwenguva yakareba sei?",
    nd: "Ibhalansi yami izahlala isikhathi esingakanani?",
    zh: "我的余额还能用多久？",
  },
  "chat.thinking": {
    en: "checking your data…",
    sn: "kutarisa data yako…",
    nd: "kuhlola idatha yakho…",
    zh: "正在查询您的数据…",
  },
} satisfies Record<string, Entry>;

export type TKey = keyof typeof dict;
