#!/usr/bin/env node
/**
 * Visual Test - Interactions Seed
 *
 * Adds realistic activity between test users:
 * - Graatek accept/decline requests, discussions, completion workflows
 * - Idea participation requests, acceptances, discussions
 * - More post reactions and comments
 * - Notifications for all interactions
 *
 * Content is mostly Arabic with some French.
 *
 * Run AFTER seed-visual-test.mjs on the same database.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/seed-visual-interactions.mjs
 *
 * Cleanup: same cleanup-test-data.mjs script handles all test data.
 */

import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

const NS = "indb-visual-test-v1";
const TOTAL_USERS = 50;

function stableUuid(ns, id) {
  const h = createHash("md5").update(ns + ":" + id).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${(8+(parseInt(h[16],16)&3).toString())}${h.slice(17,20)}-${h.slice(20,32)}`;
}
function uid(i) { return stableUuid(NS, `user:${i}`); }
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }
function pickN(a, n) { const s=new Set(); while(s.size<n&&s.size<a.length) s.add(pick(a)); return [...s]; }
function rand(mx) { return Math.floor(Math.random()*mx); }
function ri(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

// ── Arabic content ──────────────────────────────────────────────────
const AR_POSTS = [
  "تنظيف شاطئ نواذيبو صباح اليوم. مشاركة رائعة من الشباب.",
  "دورة تدريبية في الخياطة للنساء في حي السلام. التسجيل مفتوح.",
  "اجتماع لجنة الحي في كانسادو يوم الخميس القادم الساعة 5 مساءً.",
  "المكتبة البلدية استقبلت مجموعة جديدة من الكتب العربية والفرنسية.",
  "بطولة كرة القدم بين الأحياء هذا الأسبوع في ملعب تشاركا.",
  "حملة التطعيم للأطفال في مستشفى نواذيبو هذه الأسبوع.",
  "معرض الحرف التقليدية في ميناء الصيد. تعالوا لاكتشاف أعمال حرفيينا.",
  "ورشة توعية بيئية للشباب على شاطئ البطارية.",
  "مبادرة غرس الأشجار على طول الشارع الرئيسي. الموعد صباح السبت.",
  "فرقة الموسيقى التقليدية تتدرب كل ثلاثاء مساءً. مرحب بالجميع.",
  "جلسة قراءة للأطفال في المكتبة المركزية يوم الأربعاء.",
  "دورة معلوماتية للكبار في فضاء تشاركا الرقمي.",
  "توزيع القرطاسية على المدارس في حي دبي وبغداد.",
  "محاضرة عن تاريخ نواذيبو في دار الثقافة يوم الجمعة.",
  "مسابقة سباحة للشباب في المسبح البلدي في كانسادو.",
  "ورشة مسرح للمراهقين في المركز الثقافي. التسجيل مازال مفتوحاً.",
  "جمع الملابس للعائلات المحتاجة في حي PK 55.",
  "إصلاح أعمدة الإنارة في حي البصرة. الأشغال تبدأ الإثنين.",
  "سوق الكتاب المستعمل في ساحة وسط المدينة هذا الأحد.",
  "يوم مفتوح في المكتبة الرقمية الجديدة في نواذيبو.",
];

const AR_MEMORIES = [
  "أتذكر سوق السمك القديم عندما كنت طفلاً. الرائحة والألوان وصراخ الباعة.",
  "بناء المسجد الكبير في 1985. كل الحي كان يشارك في نهاية الأسبوع.",
  "كان والدي يعمل في الميناء. يغادر قبل الفجر ويعود متعباً لكنه مبتسم.",
  "مباريات كرة القدم المرتجلة على شاطئ البطارية في التسعينات.",
  "محطة القطار القديمة حيث كانت القطارات المحملة بالخام تصل. مشهد يومي.",
  "ليالي الصيف في كانسادو حيث الجيران يخرجون كراسيهم أمام المنزل.",
  "جدتي كانت تحكي قصصاً عن زمن الاستعمار الإسباني.",
  "أول سينما في نواذيبو. شاهدت فيها أول فيلم في 1998.",
  "عيد الاستقلال في 1990. الشوارع مزينة بالألوان الوطنية.",
  "مدرسة نوميروات الابتدائية في 1995. فصل واحد لثلاثة مستويات.",
  "الأفراش التقليدية كانت تستمر ثلاثة أيام. الموسيقى لا تتوقف أبداً.",
  "المنارة القديمة في نواذيبو كانت ترشد السفن. كانت مرئية من كل المدينة ليلاً.",
  "أول مرة رأيت فيها البحر في البطارية. كان عمري 7 سنوات.",
  "عمي الصياد كان يبحر لأسابيع. عند عودته، كل الحي يحتفل.",
  "دروس العربية في مسجد الحي بعد المدرسة. الشيخ كان صارماً لكنه عادل.",
  "سوق كانسادو الأسبوعي كان يجذب التجار من كل المنطقة.",
  "رحلات الصيد مع الأصدقاء في الصباح الباكر قبل حر الشمس.",
  "المكتبة البلدية في الثمانينات كانت صغيرة لكنها مليئة بالعلم.",
  "كرنفال نواذيبو السنوي في 2005. ألوان وموسيقى في كل مكان.",
  "يوم وصول الكهرباء إلى حينا في 1992. الناس كانوا يبكون من الفرحة.",
];

const AR_IDEAS = [
  "إنشاء مساحة خضراء عامة في كانسادو بأشجار ومقاعد وملعب للأطفال.",
  "تنظيم سوق للمنتجات المحلية كل سبت في وسط المدينة.",
  "نظام للمشاركة في السيارات للحد من الازدحام والتلوث في نواذيبو.",
  "تطبيق للهاتف للإبلاغ عن أعطال الإنارة ومشاكل الطرقات.",
  "برنامج إرشاد للشباب المقاولين مع خبراء محليين.",
  "بناء مسبح بلدي مع دروس سباحة مجانية للشباب.",
  "ألواح شمسية على المباني العامة لتقليل فاتورة الطاقة.",
  "مهرجان سنوي للثقافة البولارية والسوننكية والولوفية في نواذيبو.",
  "ورش تكوين في المهن الرقمية للنساء.",
  "جولات سياحية في التراث التاريخي لنواذيبو.",
  "شبكة مكتبات حية بكتب باللغات المحلية.",
  "حملة تدوير النفايات بنقاط جمع في كل حي.",
  "نوافير ماء صالحة للشرب في الأماكن العامة المزدحمة.",
  "فضاء عمل مشترك للعمال المستقلين والشركات الناشئة.",
  "دروس محو الأمية للكبار في كل حي في نواذيبو.",
  "نقل مدرسي للتلاميذ في المناطق البعيدة.",
  "حديقة مشتركة في كل حي لزراعة الخضروات.",
  "برنامج تبادل ثقافي بين نواذيبو والمدن المتوأمة.",
  "مسابقات رياضية بين الأحياء كل شهر بجوائز.",
  "تركيب ملاعب رياضية اصطناعية في الأحياء التي لا تملكها.",
];

const AR_FADLA = [
  { t: "دراجة أطفال بحالة جيدة", c: "other" },
  { t: "مجموعة كتب بالعربية والفرنسية", c: "books" },
  { t: "طاولة خشبية للتبرع", c: "furniture" },
  { t: "ملابس شتوية للأطفال (3-5 سنوات)", c: "clothes" },
  { t: "محفظة وقرطاسية مدرسية", c: "school_supplies" },
  { t: "أرز ومعكرونة (غير مفتوحة)", c: "food" },
  { t: "سرير فردي مع فراش", c: "furniture" },
  { t: "ألعاب ودمى بحالة جيدة", c: "other" },
  { t: "كرسي مكتب قابل للطي", c: "furniture" },
  { t: "معاطف وجواكت للكبار (L-XL)", c: "clothes" },
  { t: "كتب مدرسية مستوى ابتدائي", c: "books" },
  { t: "مصباح مكتب وقرطاسية", c: "school_supplies" },
  { t: "عربة أطفال", c: "other" },
  { t: "قواميس فرنسي-عربي", c: "books" },
  { t: "طقم أطباق (12 قطعة)", c: "other" },
  { t: "قمصان وبناطيل رجالي (M)", c: "clothes" },
  { t: "كتاب طبخ ووصفات", c: "books" },
  { t: "رف كتب خشبي صغير", c: "furniture" },
  { t: "كيس نوم (جديد)", c: "other" },
  { t: "كرات قدم وكرة سلة", c: "other" },
  { t: "سبورة للأطفال", c: "school_supplies" },
  { t: "مدفأة كهربائية", c: "other" },
  { t: "فستان تقليدي (مقاس M)", c: "clothes" },
  { t: "موسوعة في 5 مجلدات", c: "books" },
  { t: "مكتب كمبيوتر", c: "furniture" },
  { t: "حليب بودرة (غير مفتوح)", c: "food" },
  { t: "سجادة صلاة (جديدة)", c: "other" },
  { t: "أحذية أطفال (مقاس 28-30)", c: "clothes" },
  { t: "دفاتر وأقلام (مجموعة)", c: "school_supplies" },
  { t: "موقد غاز (حالة جيدة)", c: "other" },
];

const MSG_GRAATEK = [
  "السلام عليكم، هل لا يزال متوفراً؟", "مرحباً، أنا مهتم بهذا.",
  "يمكنني المرور اليوم لأخذه.", "بارك الله فيك على المبادرة.",
  "أنا في حاجة إليه. متى يمكنني الحضور؟",
  "شكراً جزيلاً لك، سأتي غداً إن شاء الله.",
  "هل يمكنك الاحتفاظ به لي حتى نهاية الأسبوع؟",
  "Bonjour, je suis intéressé. C'est toujours disponible ?",
  "Merci beaucoup pour ce don !", "جزاك الله خيراً على هذا العطاء.",
];

const MSG_IDEA = [
  "فكرة ممتازة! أنا مستعد للمشاركة.", "متى سنبدأ العمل على هذا المشروع؟",
  "لدي خبرة في هذا المجال ويمكنني المساعدة.",
  "Je peux aider avec la partie technique.",
  "كم شخصاً نحتاج لبدء التنفيذ؟",
  "أقترح أن ننظم اجتماعاً أولاً لمناقشة التفاصيل.",
  "هذا بالضبط ما كانت تحتاجه المدينة.",
  "Très bonne idée ! Comptez sur moi.",
  "يمكنني توفير بعض المواد اللازمة.",
  "أنا معك في هذه المبادرة من البداية.",
];

const COMMENTS_AR = [
  "مبادرة رائعة!", "بارك الله فيكم على هذا العمل.", "شكراً لمشاركتكم.",
  "أنا معكم إن شاء الله.", "خبر رائع للمجتمع.",
  "نتمنى لكم التوفيق.", "عمل ممتاز، استمروا!",
  "Très bien ! Continuez comme ça.", "هذا جميل جداً.",
  "موفقون بإذن الله.", "فكرة ممتازة!", "نشكر كل من شارك في هذا العمل.",
  "إن شاء الله نكون في الموعد.", "الله يبارك فيكم.",
  "أتمنى نجاح هذا المشروع.",
];

const AREAS = ["Cansado","Numerowatt","Dubai","Tcharka","Robinet 10",
  "Port Artisanal","Boulenoir","Centre Ville","Socogim",
  "Tarhil","PK 55","Baghdad","Basra","Madrid","La Batterie"];

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log(`\n=== Visual Test - Interactions Seed ===`);
  console.log(`Target: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Gather existing test user IDs from profiles
  const testEmails = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    testEmails.push(`test.user${String(i).padStart(3,"0")}@indb-test.example.com`);
  }

  const userIds = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    userIds.push(uid(i));
  }

  const allEntityIds = [];
  let totalCreated = { posts: 0, comments: 0, reactions: 0, memories: 0, ideas: 0, fadla: 0,
    requests: 0, fadlaMessages: 0, ideaParticipants: 0, ideaMessages: 0, follows: 0, notifications: 0 };

  // ── 1. More posts (Arabic) ──
  console.log("● Adding Arabic posts + comments + reactions...");
  for (let i = 0; i < 50; i++) {
    const authorId = userIds[i % userIds.length];
    const content = AR_POSTS[i % AR_POSTS.length];
    const pid = stableUuid(NS, `post2:${i}`);
    await supabase.from("posts").upsert({
      id: pid,
      author_id: authorId,
      type: pick(["community","community","community","news","event"]),
      title: content.length > 60 ? content.slice(0,57)+"..." : content,
      content,
      language: pick(["ar","ar","ar","fr"]),
      status: "published",
      created_at: new Date(Date.now()-ri(0,30)*864e5).toISOString(),
    }, { onConflict: "id" });
    allEntityIds.push(pid);

    // Comments
    for (let c = 0; c < ri(0,5); c++) {
      await supabase.from("comments").upsert({
        id: stableUuid(NS, `comment2:${i}_${c}`),
        post_id: pid,
        author_id: pick(userIds),
        content: pick(COMMENTS_AR),
        status: "published",
      }, { onConflict: "id" });
      totalCreated.comments++;
    }

    // Reactions
    const rSeen = new Set();
    for (let r = 0; r < ri(0,10); r++) {
      const ruid = pick(userIds);
      const rk = `${pid}:${ruid}`;
      if (rSeen.has(rk)) continue;
      rSeen.add(rk);
      await supabase.from("post_reactions").upsert({
        id: stableUuid(NS, `reaction2:${i}_${r}`),
        post_id: pid,
        user_id: ruid,
        reaction_type: pick(["like","love","support","celebrate","insightful","sad"]),
      }, { onConflict: undefined });
      totalCreated.reactions++;
    }
  }
  totalCreated.posts += 50;
  console.log(`  +50 posts with comments and reactions`);

  // ── 2. More memories (Arabic) ──
  console.log("\n● Adding Arabic memories...");
  for (let i = 0; i < 50; i++) {
    const yr = ri(1960,2015);
    const mid = stableUuid(NS, `memory2:${i}`);
    await supabase.from("memories").upsert({
      id: mid,
      contributor_id: userIds[i % userIds.length],
      title: AR_MEMORIES[i % AR_MEMORIES.length].length > 60
        ? AR_MEMORIES[i % AR_MEMORIES.length].slice(0,57)+"..."
        : AR_MEMORIES[i % AR_MEMORIES.length],
      description: AR_MEMORIES[i % AR_MEMORIES.length],
      year: yr,
      decade: `${Math.floor(yr/10)*10}s`,
      location: pick(AREAS),
      verification_status: "approved",
      media_type: "image",
    }, { onConflict: "id" });
    allEntityIds.push(mid);
  }
  totalCreated.memories += 50;
  console.log(`  +50 memories`);

  // ── 3. More ideas (Arabic) ──
  console.log("\n● Adding Arabic ideas with participation flows...");
  for (let i = 0; i < 50; i++) {
    const iid = stableUuid(NS, `idea2:${i}`);
    await supabase.from("ideas").upsert({
      id: iid,
      author_id: userIds[i % userIds.length],
      title: AR_IDEAS[i % AR_IDEAS.length].length > 60
        ? AR_IDEAS[i % AR_IDEAS.length].slice(0,57)+"..."
        : AR_IDEAS[i % AR_IDEAS.length],
      description: AR_IDEAS[i % AR_IDEAS.length],
      status: pick(["published","interested","discussion","in_progress","completed"]),
    }, { onConflict: "id" });
    allEntityIds.push(iid);
    totalCreated.ideas++;

    // Supporters
    const sSeen = new Set();
    for (let s = 0; s < ri(1,8); s++) {
      const suid = pick(userIds);
      const sk = `${iid}:${suid}`;
      if (sSeen.has(sk)) continue;
      sSeen.add(sk);
      await supabase.from("idea_supporters").upsert({
        id: stableUuid(NS, `supp2:${i}_${s}`),
        idea_id: iid,
        user_id: suid,
      }, { onConflict: undefined });
      totalCreated.ideas++;
    }

    // Participation requests (some accepted)
    const pSeen = new Set();
    for (let p = 0; p < ri(0,4); p++) {
      const puser = pick(userIds);
      const pk = `${iid}:${puser}`;
      if (pSeen.has(pk)) continue;
      pSeen.add(pk);
      const pStatus = pick(["pending","accepted","declined"]);
      await supabase.from("idea_participants").upsert({
        id: stableUuid(NS, `part:${i}_${p}`),
        idea_id: iid,
        user_id: puser,
        status: pStatus,
        message: pick(["أرغب في المشاركة في هذا المشروع","لدي خبرة في هذا المجال","Je peux aider","أريد المساهمة"]),
      }, { onConflict: undefined });
      totalCreated.ideaParticipants++;

      // If accepted, add discussion messages
      if (pStatus === "accepted") {
        for (let m = 0; m < ri(1,4); m++) {
          await supabase.from("idea_messages").upsert({
            id: stableUuid(NS, `imsg:${i}_${p}_${m}`),
            idea_id: iid,
            sender_id: pick([userIds[i % userIds.length], puser]),
            message: pick(MSG_IDEA),
          }, { onConflict: "id" });
          totalCreated.ideaMessages++;
        }
      }
    }

    // Idea comments
    for (let c = 0; c < ri(0,5); c++) {
      await supabase.from("idea_comments").upsert({
        id: stableUuid(NS, `icmt:${i}_${c}`),
        idea_id: iid,
        author_id: pick(userIds),
        content: pick(COMMENTS_AR),
      }, { onConflict: "id" });
      totalCreated.comments++;
    }

    // Votes
    const vSeen = new Set();
    for (let v = 0; v < ri(1,10); v++) {
      const vuid = pick(userIds);
      const vk = `${iid}:${vuid}`;
      if (vSeen.has(vk)) continue;
      vSeen.add(vk);
      await supabase.from("idea_votes").upsert({
        id: stableUuid(NS, `vote2:${i}_${v}`),
        idea_id: iid,
        user_id: vuid,
      }, { onConflict: undefined });
    }
  }
  console.log(`  +50 ideas with supporters, participants, discussions, votes`);

  // ── 4. More Graatek items (Arabic) + full workflows ──
  console.log("\n● Adding Arabic Graatek items with full workflows...");
  for (let i = 0; i < 50; i++) {
    const item = AR_FADLA[i % AR_FADLA.length];
    const fid = stableUuid(NS, `fadla2:${i}`);
    const ownerId = userIds[i % userIds.length];
    await supabase.from("community_shares").upsert({
      id: fid,
      owner_id: ownerId,
      title: item.t,
      description: `${item.t} بحالة جيدة. للتبرع في ${pick(AREAS)}.`,
      category: item.c,
      condition: pick(["ممتاز","جيد جدا","حالة جيدة","مستعمل بحالة جيدة"]),
      location: pick(AREAS),
      quantity: 1,
      urgency_level: pick(["no_urgency","no_urgency","this_week","urgent"]),
      status: pick(["published","requested","reserved","collected","completed"]),
      images: "[]",
    }, { onConflict: "id" });
    allEntityIds.push(fid);
    totalCreated.fadla++;

    // Create requests for some items
    if (Math.random() > 0.4) {
      for (let r = 0; r < ri(1,3); r++) {
        const requester = pick(userIds.filter(u => u !== ownerId));
        const reqStatus = pick(["pending","accepted","declined"]);
        const reqId = stableUuid(NS, `req2:${i}_${r}`);
        await supabase.from("community_share_requests").upsert({
          id: reqId,
          share_id: fid,
          requester_id: requester,
          message: pick(MSG_GRAATEK),
          status: reqStatus,
        }, { onConflict: "id" });
        totalCreated.requests++;

        // Full workflow: accepted → discussion → completed
        if (reqStatus === "accepted") {
          // Discussion messages
          for (let m = 0; m < ri(1,5); m++) {
            await supabase.from("fadla_request_messages").upsert({
              id: stableUuid(NS, `fmsg:${i}_${r}_${m}`),
              share_id: fid,
              request_id: reqId,
              sender_id: pick([ownerId, requester]),
              message: pick(MSG_GRAATEK),
            }, { onConflict: "id" });
            totalCreated.fadlaMessages++;
          }

          // Complete some workflows
          if (Math.random() > 0.5) {
            const completedAt = new Date(Date.now()-ri(1,14)*864e5).toISOString();
            await supabase.from("community_shares").update({
              status: "completed",
              accepted_request_id: reqId,
              receiver_confirmed_at: completedAt,
              sender_confirmed_at: completedAt,
              completed_at: completedAt,
            }).eq("id", fid);
          }
        }
      }
    }
  }
  console.log(`  +50 Graatek items with requests, discussions, completions`);

  // ── 5. More follows between test users ──
  console.log("\n● Adding more follows...");
  let followCount = 0;
  const seenF = new Set();
  for (const fid of userIds) {
    const targets = pickN(userIds.filter(u => u !== fid), ri(3,15));
    for (const target of targets) {
      const k = `${fid}:${target}`;
      if (seenF.has(k)) continue;
      seenF.add(k);
      await supabase.from("user_follows").upsert({
        id: stableUuid(NS, `follow2:${followCount++}`),
        follower_id: fid,
        following_id: target,
      }, { onConflict: undefined });
    }
  }
  totalCreated.follows += followCount;
  console.log(`  +${followCount} follows`);

  // ── 6. Notifications for all interactions ──
  console.log("\n● Adding notifications...");
  const NOTIF_TYPES = [
    ["comment","post"],["reaction","post"],["follow","profile"],
    ["fadla_request","community_share"],["fadla_request_accepted","community_share"],
    ["fadla_request_declined","community_share"],["fadla_message","community_share"],
    ["idea_support","idea"],["idea_participate_request","idea"],
    ["idea_participant_accepted","idea"],["idea_message","idea"],
    ["idea_comment","idea"],["memory_comment","memory"],
  ];
  const TITLES_AR = [
    "علق على منشورك", "تفاعل مع منشورك", "بدأ متابعتك",
    "طلب منك شيئاً في Gar3tak", "قبل طلبك في Gar3tak",
    "رفض طلبك في Gar3tak", "أرسل لك رسالة في Gar3tak",
    "دعم فكرتك", "يريد المشاركة في مشروعك",
    "قبل مشاركتك في المشروع", "أرسل لك رسالة في المشروع",
    "علق على فكرتك", "علق على ذكرى لك",
  ];

  let ni = 0;
  for (let i = 0; i < 500; i++) {
    const typeIdx = ri(0, NOTIF_TYPES.length-1);
    const [ntype, etype] = NOTIF_TYPES[typeIdx];
    const actor = pick(userIds);
    let recipient = pick(userIds);
    while (recipient === actor) recipient = pick(userIds);
    const entity = allEntityIds.length > 0 ? pick(allEntityIds) : stableUuid(NS, `ent:${i}`);

    await supabase.from("notifications").upsert({
      id: stableUuid(NS, `notif2:${ni++}`),
      user_id: recipient,
      actor_id: actor,
      type: ntype,
      entity_type: etype,
      entity_id: entity,
      title: TITLES_AR[typeIdx],
      message: pick(COMMENTS_AR),
      read: Math.random() < 0.4,
      created_at: new Date(Date.now()-ri(0,30)*864e5).toISOString(),
    }, { onConflict: "id" });
  }
  totalCreated.notifications += 500;
  console.log(`  +500 notifications`);

  // ── Summary ──
  console.log(`\n=== Interactions Seed Complete ===`);
  console.log(`New data added:`);
  console.log(`  Posts:         50 (Arabic)`);
  console.log(`  Memories:      50 (Arabic)`);
  console.log(`  Ideas:         50 (Arabic)`);
  console.log(`  Graatek items: 50 (Arabic)`);
  console.log(`  Comments:      ${totalCreated.comments}`);
  console.log(`  Reactions:     ${totalCreated.reactions}`);
  console.log(`  Idea supporters/votes/participants`);
  console.log(`  Graatek requests + discussions + completions`);
  console.log(`  Follows:       +${totalCreated.follows}`);
  console.log(`  Notifications: +500 (Arabic)`);

  const totalAll = 50/*posts*/ + 50/*memories*/ + 50/*ideas*/ + 50/*fadla*/
    + totalCreated.comments + totalCreated.reactions
    + totalCreated.requests + totalCreated.fadlaMessages
    + totalCreated.ideaParticipants + totalCreated.ideaMessages
    + totalCreated.follows + totalCreated.notifications;
  console.log(`\nTotal records added: ~${totalAll}`);
  console.log(`\nLogin: test.user000@indb-test.example.com (password: TestPass123!)`);
  console.log(`Cleanup: node scripts/cleanup-test-data.mjs`);
}

function requireEnv(n) {
  const v = process.env[n];
  if (!v) { console.error(`Missing ${n}`); process.exit(1); }
  return v;
}

main().catch(e => { console.error("FAILED:", e); process.exit(1); });
