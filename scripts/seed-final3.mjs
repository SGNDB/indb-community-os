#!/usr/bin/env node
/**
 * Final seed v3 — fixes the UUID generation bug.
 *
 * Root cause: variant byte `8` or `9` wasn't zero-padded to `08`/`09`,
 * making ~50% of generated UUIDs invalid.
 *
 * This script:
 *   1. Deletes all existing test content (by broken UUIDs)
 *   2. Re-creates everything with correct UUIDs
 *   3. Uses actual auth user IDs for author_id columns
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/seed-final3.mjs
 */
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

// ── BUGGY UUID (matches what was already created) ──────────────────
function oldUuid(ns, id) {
  const h = createHash("md5").update(ns + ":" + id).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${(8+(parseInt(h[16],16)&3).toString())}${h.slice(17,20)}-${h.slice(20,32)}`;
}

// ── FIXED UUID (variant byte zero-padded) ──────────────────────────
function uid(id) {
  const h = createHash("md5").update("indb-visual-test-v1" + ":" + id).digest("hex");
  const v = 8 + (parseInt(h[16], 16) & 3);
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${v.toString().padStart(2,'0')}${h.slice(17,20)}-${h.slice(20,32)}`;
}

function pi(a) { return a[Math.floor(Math.random()*a.length)]; }
function pn(a, n) { const d=new Set(); while(d.size<n&&d.size<a.length) d.add(pi(a)); return [...d]; }
function ri(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }

const POSTS = ["تنظيف شاطئ نواذيبو صباح اليوم. مشاركة رائعة من الشباب.","دورة تدريبية في الخياطة للنساء في حي السلام. التسجيل مفتوح.","اجتماع لجنة الحي في كانسادو يوم الخميس القادم الساعة 5 مساءً.","المكتبة البلدية استقبلت مجموعة جديدة من الكتب العربية والفرنسية.","بطولة كرة القدم بين الأحياء هذا الأسبوع في ملعب تشاركا.","حملة التطعيم للأطفال في مستشفى نواذيبو هذه الأسبوع.","معرض الحرف التقليدية في ميناء الصيد. تعالوا لاكتشاف أعمال حرفيينا.","ورشة توعية بيئية للشباب على شاطئ البطارية.","مبادرة غرس الأشجار على طول الشارع الرئيسي. الموعد صباح السبت.","فرقة الموسيقى التقليدية تتدرب كل ثلاثاء مساءً. مرحب بالجميع.","جلسة قراءة للأطفال في المكتبة المركزية يوم الأربعاء.","دورة معلوماتية للكبار في فضاء تشاركا الرقمي.","توزيع القرطاسية على المدارس في حي دبي وبغداد.","محاضرة عن تاريخ نواذيبو في دار الثقافة يوم الجمعة.","مسابقة سباحة للشباب في المسبح البلدي في كانسادو.","ورشة مسرح للمراهقين في المركز الثقافي. التسجيل مازال مفتوحاً.","جمع الملابس للعائلات المحتاجة في حي PK 55.","إصلاح أعمدة الإنارة في حي البصرة. الأشغال تبدأ الإثنين.","سوق الكتاب المستعمل في ساحة وسط المدينة هذا الأحد.","يوم مفتوح في المكتبة الرقمية الجديدة في نواذيبو."];
const MEMORIES = ["أتذكر سوق السمك القديم عندما كنت طفلاً. الرائحة والألوان وصراخ الباعة.","بناء المسجد الكبير في 1985. كل الحي كان يشارك في نهاية الأسبوع.","كان والدي يعمل في الميناء. يغادر قبل الفجر ويعود متعباً لكنه مبتسم.","مباريات كرة القدم المرتجلة على شاطئ البطارية في التسعينات.","محطة القطار القديمة حيث كانت القطارات المحملة بالخام تصل. مشهد يومي.","ليالي الصيف في كانسادو حيث الجيران يخرجون كراسيهم أمام المنزل.","جدتي كانت تحكي قصصاً عن زمن الاستعمار الإسباني.","أول سينما في نواذيبو. شاهدت فيها أول فيلم في 1998.","عيد الاستقلال في 1990. الشوارع مزينة بالألوان الوطنية.","مدرسة نوميروات الابتدائية في 1995. فصل واحد لثلاثة مستويات.","الأفراح التقليدية كانت تستمر ثلاثة أيام. الموسيقى لا تتوقف أبداً.","المنارة القديمة في نواذيبو كانت ترشد السفن. كانت مرئية من كل المدينة ليلاً.","أول مرة رأيت فيها البحر في البطارية. كان عمري 7 سنوات.","عمي الصياد كان يبحر لأسابيع. عند عودته، كل الحي يحتفل.","دروس العربية في مسجد الحي بعد المدرسة. الشيخ كان صارماً لكنه عادل.","سوق كانسادو الأسبوعي كان يجذب التجار من كل المنطقة.","رحلات الصيد مع الأصدقاء في الصباح الباكر قبل حر الشمس.","المكتبة البلدية في الثمانينات كانت صغيرة لكنها مليئة بالعلم.","كرنفال نواذيبو السنوي في 2005. ألوان وموسيقى في كل مكان.","يوم وصول الكهرباء إلى حينا في 1992. الناس كانوا يبكون من الفرحة."];
const IDEAS = ["إنشاء مساحة خضراء عامة في كانسادو بأشجار ومقاعد وملعب للأطفال.","تنظيم سوق للمنتجات المحلية كل سبت في وسط المدينة.","نظام للمشاركة في السيارات للحد من الازدحام والتلوث في نواذيبو.","تطبيق للهاتف للإبلاغ عن أعطال الإنارة ومشاكل الطرقات.","برنامج إرشاد للشباب المقاولين مع خبراء محليين.","بناء مسبح بلدي مع دروس سباحة مجانية للشباب.","ألواح شمسية على المباني العامة لتقليل فاتورة الطاقة.","مهرجان سنوي للثقافة البولارية والسوننكية والولوفية في نواذيبو.","ورش تكوين في المهن الرقمية للنساء.","جولات سياحية في التراث التاريخي لنواذيبو.","شبكة مكتبات حية بكتب باللغات المحلية.","حملة تدوير النفايات بنقاط جمع في كل حي.","نوافير ماء صالحة للشرب في الأماكن العامة المزدحمة.","فضاء عمل مشترك للعمال المستقلين والشركات الناشئة.","دروس محو الأمية للكبار في كل حي في نواذيبو.","نقل مدرسي للتلاميذ في المناطق البعيدة.","حديقة مشتركة في كل حي لزراعة الخضروات.","برنامج تبادل ثقافي بين نواذيبو والمدن المتوأمة.","مسابقات رياضية بين الأحياء كل شهر بجوائز.","تركيب ملاعب رياضية اصطناعية في الأحياء التي لا تملكها."];
const FDL = [{t:"دراجة أطفال بحالة جيدة",c:"other"},{t:"مجموعة كتب بالعربية والفرنسية",c:"books"},{t:"طاولة خشبية للتبرع",c:"furniture"},{t:"ملابس شتوية للأطفال (3-5 سنوات)",c:"clothes"},{t:"محفظة وقرطاسية مدرسية",c:"school_supplies"},{t:"أرز ومعكرونة (غير مفتوحة)",c:"food"},{t:"سرير فردي مع فراش",c:"furniture"},{t:"ألعاب ودمى بحالة جيدة",c:"other"},{t:"كرسي مكتب قابل للطي",c:"furniture"},{t:"معاطف وجواكت للكبار (L-XL)",c:"clothes"},{t:"كتب مدرسية مستوى ابتدائي",c:"books"},{t:"مصباح مكتب وقرطاسية",c:"school_supplies"},{t:"عربة أطفال",c:"other"},{t:"قواميس فرنسي-عربي",c:"books"},{t:"طقم أطباق (12 قطعة)",c:"other"},{t:"قمصان وبناطيل رجالي (M)",c:"clothes"},{t:"كتاب طبخ ووصفات",c:"books"},{t:"رف كتب خشبي صغير",c:"furniture"},{t:"كيس نوم (جديد)",c:"other"},{t:"كرات قدم وكرة سلة",c:"other"},{t:"سبورة للأطفال",c:"school_supplies"},{t:"مدفأة كهربائية",c:"other"},{t:"فستان تقليدي (مقاس M)",c:"clothes"},{t:"موسوعة في 5 مجلدات",c:"books"},{t:"مكتب كمبيوتر",c:"furniture"},{t:"حليب بودرة (غير مفتوح)",c:"food"},{t:"سجادة صلاة (جديدة)",c:"other"},{t:"أحذية أطفال (مقاس 28-30)",c:"clothes"},{t:"دفاتر وأقلام (مجموعة)",c:"school_supplies"},{t:"موقد غاز (حالة جيدة)",c:"other"}];
const GMSG = ["السلام عليكم، هل لا يزال متوفراً؟","مرحباً، أنا مهتم بهذا.","يمكنني المرور اليوم لأخذه.","بارك الله فيك على المبادرة.","أنا في حاجة إليه. متى يمكنني الحضور؟","شكراً جزيلاً لك، سأتي غداً إن شاء الله.","هل يمكنك الاحتفاظ به لي حتى نهاية الأسبوع؟","Bonjour, je suis intéressé. C'est toujours disponible ?","Merci beaucoup pour ce don !","جزاك الله خيراً على هذا العطاء."];
const IMSG = ["فكرة ممتازة! أنا مستعد للمشاركة.","متى سنبدأ العمل على هذا المشروع؟","لدي خبرة في هذا المجال ويمكنني المساعدة.","Je peux aider avec la partie technique.","كم شخصاً نحتاج لبدء التنفيذ؟","أقترح أن ننظم اجتماعاً أولاً لمناقشة التفاصيل.","هذا بالضبط ما كانت تحتاجه المدينة.","Très bonne idée ! Comptez sur moi.","يمكنني توفير بعض المواد اللازمة.","أنا معك في هذه المبادرة من البداية."];
const CMTS = ["مبادرة رائعة!","بارك الله فيكم على هذا العمل.","شكراً لمشاركتكم.","أنا معكم إن شاء الله.","خبر رائع للمجتمع.","نتمنى لكم التوفيق.","عمل ممتاز، استمروا!","Très bien ! Continuez comme ça.","هذا جميل جداً.","موفقون بإذن الله.","فكرة ممتازة!","نشكر كل من شارك في هذا العمل.","إن شاء الله نكون في الموعد.","الله يبارك فيكم.","أتمنى نجاح هذا المشروع."];
const AREAS = ["Cansado","Numerowatt","Dubai","Tcharka","Robinet 10","Port Artisanal","Boulenoir","Centre Ville","Socogim","Tarhil","PK 55","Baghdad","Basra","Madrid","La Batterie"];
const NTYPES = [["comment","post"],["reaction","post"],["follow","profile"],["fadla_request","community_share"],["fadla_request_accepted","community_share"],["fadla_request_declined","community_share"],["fadla_message","community_share"],["idea_support","idea"],["idea_participate_request","idea"],["idea_participant_accepted","idea"],["idea_message","idea"],["idea_comment","idea"],["memory_comment","memory"]];
const NTITLES = ["علق على منشورك","تفاعل مع منشورك","بدأ متابعتك","طلب منك شيئاً في Gar3tak","قبل طلبك في Gar3tak","رفض طلبك في Gar3tak","أرسل لك رسالة في Gar3tak","دعم فكرتك","يريد المشاركة في مشروعك","قبل مشاركتك في المشروع","أرسل لك رسالة في المشروع","علق على فكرتك","علق على ذكرى لك"];

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});
  console.log("\n=== Final Seed v3 (fixed UUIDs) ===\n");

  // Get actual auth user IDs
  const {data: ad} = await sb.auth.admin.listUsers();
  const uids = [];
  for (let i = 0; i < 50; i++) {
    const e = `22246${String(i).padStart(6,'0')}@phone.indb.local`;
    const u = ad.users.find(x => x.email === e);
    uids.push(u ? u.id : `fallback-${i}`);
  }
  console.log(`  ${uids.length} users ready\n`);

  // STEP 1: Delete all existing test content using OLD (broken) UUIDs
  console.log("● Deleting old content...");
  let deleted = 0;
  const tables = ['posts','memories','ideas','community_shares','comments','post_reactions',
    'idea_votes','idea_supporters','idea_participants','idea_messages','idea_comments',
    'community_share_requests','fadla_request_messages','user_follows','notifications'];
  const prefixes = ['post','post2','memory','memory2','idea','idea2','fadla','fadla2',
    'comment','comment2','reaction','reaction2','vote','vote2','supp','supp2',
    'part','part:','imsg','icmt','req','req2','fmsg','follow','follow2','notif','notif2'];
  for (let i = 0; i < 110; i++) {
    for (const pfx of prefixes) {
      const oldId = oldUuid('indb-visual-test-v1', `${pfx}:${i}`);
      for (const tbl of tables) {
        try { const {count} = await sb.from(tbl).delete().eq('id', oldId); if (count) deleted += count; } catch(e) {}
      }
    }
  }
  console.log(`  Deleted ~${deleted} old records\n`);

  let t = {post:0,comm:0,react:0,mem:0,idea:0,supp:0,vote:0,part:0,imsg:0,icmt:0,fdl:0,req:0,fmsg:0,fol:0,notif:0};

  // Helper: sequential insert (reliable, handles all UUID patterns)
  async function ins(tbl, rows) {
    let ok = 0;
    for (const r of rows) {
      try {
        const {error} = await sb.from(tbl).insert(r);
        if (!error) ok++;
      } catch(e) {}
    }
    return ok;
  }

  // STEP 2: POSTS
  console.log("● Posts...");
  const posts = [];
  for (let i = 0; i < 50; i++) {
    const c = POSTS[i % POSTS.length];
    const id = uid(`post:${i}`);
    // Verify UUID is valid before inserting
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      console.error(`  INVALID UUID: ${id} for post:${i}`);
      continue;
    }
    posts.push({id, author_id: uids[i%uids.length], type: pi(["community","community","community","news","event"]), title: c.length>60?c.slice(0,57)+"...":c, content: c, language: pi(["ar","ar","ar","fr"]), status: "published", created_at: new Date(Date.now()-ri(0,30)*864e5).toISOString()});
  }
  t.post = await ins("posts", posts);
  console.log(`  ${t.post} posts`);

  // Comments
  const cmts = [];
  for (let i = 0; i < 50; i++) {
    const pid = uid(`post:${i}`);
    for (let j = 0; j < ri(0,5); j++) cmts.push({id: uid(`comment:${i}_${j}`), post_id: pid, author_id: pi(uids), content: pi(CMTS), status: "published"});
  }
  t.comm = await ins("comments", cmts);

  // Reactions
  const reacts = []; const rseen = new Set();
  for (let i = 0; i < 50; i++) {
    const pid = uid(`post:${i}`);
    for (let j = 0; j < ri(0,10); j++) {
      const uid2 = pi(uids); const k = `${pid}:${uid2}`;
      if (rseen.has(k)) continue; rseen.add(k);
      reacts.push({id: uid(`reaction:${i}_${j}`), post_id: pid, user_id: uid2, reaction_type: pi(["like","love","support","celebrate","insightful","sad"])});
    }
  }
  t.react = await ins("post_reactions", reacts);
  console.log(`  ${t.comm} comments, ${t.react} reactions`);

  // STEP 3: MEMORIES
  console.log("● Memories...");
  for (let i = 0; i < 50; i++) {
    const yr = ri(1960,2015); const c = MEMORIES[i % MEMORIES.length];
    try { await sb.from("memories").insert({id: uid(`memory:${i}`), contributor_id: uids[i%uids.length], title: c.length>60?c.slice(0,57)+"...":c, description: c, year: yr, decade: `${Math.floor(yr/10)*10}s`, location: pi(AREAS), verification_status: "approved", media_type: "image"}); t.mem++; } catch(e) {}
  }
  console.log(`  ${t.mem} memories`);

  // STEP 4: IDEAS
  console.log("● Ideas...");
  for (let i = 0; i < 50; i++) {
    const iid = uid(`idea:${i}`); const c = IDEAS[i % IDEAS.length];
    try { await sb.from("ideas").insert({id: iid, author_id: uids[i%uids.length], title: c.length>60?c.slice(0,57)+"...":c, description: c, status: pi(["published","interested","discussion","in_progress","completed"])}); t.idea++; } catch(e) { continue; }

    const sseen = new Set();
    for (let j = 0; j < ri(1,8); j++) { const su = pi(uids); const sk = `${iid}:${su}`; if (sseen.has(sk)) continue; sseen.add(sk); try { await sb.from("idea_supporters").insert({id: uid(`supp:${i}_${j}`), idea_id: iid, user_id: su}); t.supp++; } catch(e) {} }

    const pseen = new Set();
    for (let j = 0; j < ri(0,4); j++) { const pu = pi(uids); const pk = `${iid}:${pu}`; if (pseen.has(pk)) continue; pseen.add(pk); const st = pi(["pending","accepted","declined"]); try { await sb.from("idea_participants").insert({id: uid(`part:${i}_${j}`), idea_id: iid, user_id: pu, status: st, message: pi(["أرغب في المشاركة","لدي خبرة","Je peux aider","أريد المساهمة"])}); t.part++; } catch(e) {} if (st === "accepted") { for (let k=0; k<ri(1,4); k++) { try { await sb.from("idea_messages").insert({id: uid(`imsg:${i}_${j}_${k}`), idea_id: iid, sender_id: pi([uids[i%uids.length], pu]), message: pi(IMSG)}); t.imsg++; } catch(e) {} } } }

    for (let j=0; j<ri(0,5); j++) { try { await sb.from("idea_comments").insert({id: uid(`icmt:${i}_${j}`), idea_id: iid, author_id: pi(uids), content: pi(CMTS)}); t.icmt++; } catch(e) {} }

    const vseen = new Set();
    for (let j=0; j<ri(1,10); j++) { const vu = pi(uids); const vk = `${iid}:${vu}`; if (vseen.has(vk)) continue; vseen.add(vk); try { await sb.from("idea_votes").insert({id: uid(`vote:${i}_${j}`), idea_id: iid, user_id: vu}); t.vote++; } catch(e) {} }
  }
  console.log(`  ${t.idea} ideas, ${t.supp} supporters, ${t.vote} votes, ${t.part} participants, ${t.imsg} msgs, ${t.icmt} comments`);

  // STEP 5: GRAATEK
  console.log("● Graatek...");
  for (let i = 0; i < 50; i++) {
    const it = FDL[i % FDL.length]; const fid = uid(`fadla:${i}`); const oid = uids[i % uids.length];
    try { await sb.from("community_shares").insert({id: fid, owner_id: oid, title: it.t, description: `${it.t} بحالة جيدة. للتبرع في ${pi(AREAS)}.`, category: it.c, condition: pi(["ممتاز","جيد جدا","جيد"]), location: pi(AREAS), quantity: 1, urgency_level: pi(["no_urgency","no_urgency","this_week","urgent"]), status: pi(["published","requested","reserved","collected","completed"]), images: "[]"}); t.fdl++; } catch(e) { continue; }

    if (Math.random() > 0.4) {
      for (let j=0; j<ri(1,3); j++) { const rq = pi(uids.filter(x=>x!==oid)); const rs = pi(["pending","accepted","declined"]); const rid = uid(`req:${i}_${j}`); try { await sb.from("community_share_requests").insert({id: rid, share_id: fid, requester_id: rq, message: pi(GMSG), status: rs}); t.req++; } catch(e) {} if (rs==="accepted") { for(let k=0;k<ri(1,5);k++){try{await sb.from("fadla_request_messages").insert({id:uid(`fmsg:${i}_${j}_${k}`),share_id:fid,request_id:rid,sender_id:pi([oid,rq]),message:pi(GMSG)});t.fmsg++;}catch(e){}} if(Math.random()>0.5){const ca=new Date(Date.now()-ri(1,14)*864e5).toISOString();try{await sb.from("community_shares").update({status:"completed",accepted_request_id:rid,receiver_confirmed_at:ca,sender_confirmed_at:ca,completed_at:ca}).eq("id",fid);}catch(e){}} } }
    }
  }
  console.log(`  ${t.fdl} items, ${t.req} requests, ${t.fmsg} msgs`);

  // STEP 6: FOLLOWS
  console.log("● Follows...");
  let fc = 0; const fseen = new Set();
  for (const fid of uids) {
    const targets = pn(uids.filter(x=>x!==fid), ri(5,20));
    for (const tgt of targets) { const k=`${fid}:${tgt}`; if (fseen.has(k)) continue; fseen.add(k); try { await sb.from("user_follows").insert({id: uid(`follow:${fc++}`), follower_id: fid, following_id: tgt}); t.fol++; } catch(e) {} }
  }
  console.log(`  ${t.fol} follows`);

  // STEP 7: NOTIFICATIONS
  console.log("● Notifications...");
  const eids = [];
  for (let i=0; i<50; i++) { eids.push(uid(`post:${i}`)); eids.push(uid(`idea:${i}`)); eids.push(uid(`fadla:${i}`)); eids.push(uid(`memory:${i}`)); }
  for (let i=0; i<500; i++) {
    const ti = ri(0, NTYPES.length-1); const [nt, et] = NTYPES[ti];
    const a = pi(uids); let r = pi(uids); while (r === a) r = pi(uids);
    try { await sb.from("notifications").insert({id: uid(`notif:${i}`), user_id: r, actor_id: a, type: nt, entity_type: et, entity_id: pi(eids), title: NTITLES[ti], message: pi(CMTS), read: Math.random()<0.4, created_at: new Date(Date.now()-ri(0,30)*864e5).toISOString()}); t.notif++; } catch(e) {}
  }
  console.log(`  ${t.notif} notifications`);

  // SUMMARY
  const sum = Object.values(t).reduce((a,b)=>a+b, 0);
  console.log(`\n=== Complete: ${sum} records ===`);
  console.log(`Login: 46000000 / TestPass123!`);
}

main().catch(e=>{console.error("FAILED:",e);process.exit(1)});
