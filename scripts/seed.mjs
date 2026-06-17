#!/usr/bin/env node
/**
 * INDB Community OS — Seed Script
 *
 * Generates 500 users, 2000 posts, 1000 comments, 500 memories,
 * 300 ideas, 300 Fadla items, 500 notifications, plus simulated activity.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=... && node scripts/seed.mjs
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME,
 *   SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
 */

import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomInt } from "crypto";

// ─── Configuration ───────────────────────────────────────────────────────────
const CONFIG = {
  totalUsers: 500,
  totalPosts: 2000,
  totalComments: 1000,
  totalMemories: 500,
  totalIdeas: 300,
  totalFadla: 300,
  totalNotifications: 500,
  testPassword: "TestPass123!",
  batchSize: 50,       // auth user creation batch + delay
  batchDelayMs: 2000,  // delay between auth batches
};

// ─── Env & Clients ───────────────────────────────────────────────────────────
function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const DB_CONFIG = {
  host: requireEnv("SUPABASE_DB_HOST"),
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? "postgres",
  user: requireEnv("SUPABASE_DB_USER"),
  password: requireEnv("SUPABASE_DB_PASSWORD"),
  ssl: { rejectUnauthorized: false },
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function query(sql, params = []) {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    await client.end();
  }
}

// ─── Data Generators ─────────────────────────────────────────────────────────
const FIRST_NAMES_AR = [
  "محمد","أحمد","عبد الله","سيدي","عمر","علي","عثمان","بلال","إبراهيم",
  "يحيى","الطالب","المصطفى","خالد","سالم","محفوظ","اعلي","سيد","ماء العينين",
  "عبد الفتاح","عبد الرحمن","الحسن","الحسين","يعقوب","إسماعيل","إسحاق",
  "مريم","فاطمة","خديجة","عائشة","آمنة","زينب","سكينة","حليمة",
  "رقية","أم كلثوم","سارة","نورا","مها","ليلى","سلمى","صفية","نعمه",
  "مولاي","الشيخ","الول","سيدي محمد","محمد فال","محمد الأمين",
];

const FIRST_NAMES_FR = [
  "Mohamed","Ahmed","Sidi","Oumar","Ali","Mamadou","Abdallahi","Cheikh",
  "Brahim","Yaya","Elhadj","Souleymane","Mokhtar","Demba","Moussa","Amadou",
  "Khadijetou","Mariem","Fatimetou","Aichetou","Zeinebou","Mouna","Aminetou",
  "Rougui","Salama","Nema","Hawa","Mariame","Fatou","Astou","Adama",
  "Ibrahim","Bilal","Thierno","Abdoulaye","Mamoudou","Hassane","Baba",
];

const LAST_NAMES = [
  "فال","ولد","الشيخ","عبد القادر","أحمد","محمد","سيدي","أحمد سالم",
  "أمم","أعمر","خطاري","العيد","يرب","بونه","الجيد","عبد الودود",
  "سليمان","بابه","حمود","لمين","محمد الأمين","سيد أعمر","سيد أحمد",
  "Fall","Ould","Cheikh","Elhadj","Ba","Diallo","Sy","Diop","Kane",
  "Ndiaye","Sow","Tall","Sall","Dieng","Mbaye","Cissé","Niang",
  "Thiam","Gueye","Faye","Ngom","Ndour","Lo","Ly","Camara","Bah",
];

const CITIES = [
  "انواذيبو","نواكشوط","روصو","أطار","شنقيط","وادان","تيشيت","ولاتة",
  "ألاك","كيفة","النعمة","تجكجة","بوتلميت","مقطع لحجار","سيلبابي","كيهيدي",
  "Nouadhibou","Nouakchott","Rosso","Atar","Chinguetti","Ouadane","Tichitt",
  "Oualata","Aleg","Kiffa","Néma","Tidjikja","Boutilimit","Kaédi",
];

const BIOS = [
  "مهتم بالثقافة والتراث الموريتاني",
  "مصور فوتوغرافي وأحب توثيق الحياة اليومية",
  "ناشط مجتمعي في مجال التعليم",
  "مهتم بالبيئة والتنمية المستدامة",
  "أكتب عن التراث والتاريخ",
  "Passionné par la culture mauritanienne",
  "Photographe et documentariste",
  "Actif dans le développement communautaire",
  "Passionné par l'environnement et le développement durable",
  "Écrivain et chercheur en histoire",
  "مطور ويب ومهتم بالتقنية",
  "فنان تشكيلي من انواذيبو",
  "صياد ومحب للبحر",
  "معلم متقاعد وشغوف بالقراءة",
  "Développeur web et passionné de technologie",
  "Artiste peintre de Nouadhibou",
  "Pêcheur passionné de la mer",
  "Enseignant retraité et passionné de lecture",
];

const POST_CONTENT = [
  "شهدت مدينة انواذيبو اليوم فعاليات ثقافية مميزة شارك فيها عدد كبير من السكان",
  "مبادرة تطوعية لتنظيف شاطئ المدينة بمشاركة الشباب",
  "قصة نجاح لشاب من انواذيبو استطاع تأسيس مشروعه الخاص",
  "La ville de Nouadhibou a accueilli aujourd'hui un événement culturel exceptionnel",
  "Initiative de bénévolat pour nettoyer la plage de la ville avec la participation des jeunes",
  "Histoire de réussite d'un jeune de Nouadhibou qui a créé sa propre entreprise",
  "ورشة عمل حول التربية البيئية في مدارس المدينة",
  "معرض للكتاب العربي والفرنسي في المكتبة المركزية",
  "مهرجان الرياضات البحرية في نسخته الثالثة",
  "حملة تشجير في الأحياء السكنية",
  "Atelier sur l'éducation environnementale dans les écoles de la ville",
  "Salon du livre arabe et français à la bibliothèque centrale",
  "Festival des sports nautiques en sa troisième édition",
  "Campagne de reboisement dans les quartiers résidentiels",
  "دورة تكوينية في مجال المقاولاتية للشباب",
  "ندوة حول التراث الثقافي الموريتاني",
  "مسابقة في الشعر الحساني",
  "افتتاح مركز جديد للتكوين المهني",
  "زيارة وفد من المنظمات الدولية إلى المدينة",
  "Formation en entrepreneuriat pour les jeunes",
  "Conférence sur le patrimoine culturel mauritanien",
  "Concours de poésie hassaniya",
  "Ouverture d'un nouveau centre de formation professionnelle",
  "Visite d'une délégation d'organisations internationales",
];

const MEMORY_TITLES = [
  "ذكريات الطفولة في انواذيبو",
  "أيام المدرسة القديمة",
  "سوق السمك في الثمانينات",
  "رحلات الصيد التقليدية",
  "Souvenirs d'enfance à Nouadhibou",
  "Les jours de l'ancienne école",
  "Le marché aux poissons dans les années 80",
  "Voyages de pêche traditionnelle",
  "الحي القديم وحكايات الجيران",
  "أول رحلة قطار إلى ازويرات",
  "سباق الهجن في المناسبات",
  "الأفراح التقليدية في المخيم",
  "Le vieux quartier et les histoires de voisins",
  "Premier voyage en train vers Zouérate",
  "Course de chameaux lors des fêtes",
  "Fêtes traditionnelles dans le campement",
  "ذكريات موسم الأمطار في البر",
  "أيام الخيمة والكساء التقليدي",
  "صناعة المراكب الخشبية",
  "Vagues de l'océan et souvenirs",
];

const IDEA_TITLES = [
  "مشروع مركز ثقافي للشباب",
  "مبادرة لتنظيف الشواطئ",
  "تطوير سوق السمك المحلي",
  "Projet de centre culturel pour les jeunes",
  "Initiative de nettoyage des plages",
  "Développement du marché local aux poissons",
  "منصة رقمية للتعليم عن بعد",
  "حملة للتوعية بمرض الملاريا",
  "تأسيس جمعية لحماية البيئة البحرية",
  "Plateforme numérique pour l'éducation à distance",
  "Campagne de sensibilisation au paludisme",
  "Création d'une association pour la protection du milieu marin",
  "مشروع إعادة تدوير النفايات",
  "مبادرة لدعم التعليم في المناطق النائية",
  "نادي رياضي للشباب في انواذيبو",
  "Projet de recyclage des déchets",
  "Initiative de soutien à l'éducation dans les zones reculées",
  "Club sportif pour les jeunes à Nouadhibou",
];

const FADLA_TITLES = [
  "كتاب التاريخ الموريتاني",
  "ملابس أطفال بحالة جيدة",
  "أدوات مدرسية",
  "Livre d'histoire mauritanienne",
  "Vêtements pour enfants en bon état",
  "Fournitures scolaires",
  "جهاز كمبيوتر محمول قديم",
  "دراجة هوائية للأطفال",
  "أثاث منزلي بحالة ممتازة",
  "Ordinateur portable ancien",
  "Vélo pour enfants",
  "Meubles de maison en excellent état",
  "كتب تعليمية بالعربية والفرنسية",
  "ملابس شتوية للأطفال",
  "ألعاب تعليمية",
  "Livres éducatifs en arabe et en français",
  "Vêtements d'hiver pour enfants",
  "Jeux éducatifs",
];

const FADLA_CATEGORIES = ["food","clothes","books","school_supplies","furniture","tools","electronics","medical","household","other"];
const FADLA_CONDITIONS = ["new","like_new","good","fair"];

const URGENCY_LEVELS = ["urgent","this_week","no_urgency"];
const IDEA_STATUSES = ["published","interested","discussion","in_progress","completed","archived"];
const REACTION_TYPES = ["like","love","support","celebrate","insightful","sad"];
const POST_TYPES = ["community","news","memory","event","idea","project"];

/**
 * Pick a random element from an array.
 */
function pick(arr) {
  return arr[randomInt(arr.length)];
}

/**
 * Generate a deterministic-looking index suffix padded to 4 digits.
 */
function padIdx(i) {
  return String(i).padStart(4, "0");
}

/**
 * Mauritanian phone: +2223XXXXXXX or +2224XXXXXXX
 */
function genPhone(i) {
  const prefix = i < 250 ? "3" : "4";
  const suffix = String(i).padStart(7, "0");
  return `+222${prefix}${suffix}`;
}

/**
 * Synthetic email from phone.
 */
function toEmail(phone) {
  const digits = phone.slice(1);
  return `${digits}@phone.indb.local`;
}

/**
 * Generate a unique username from an index.
 */
function genUsername(i) {
  return `user_${padIdx(i)}`;
}

/**
 * Generate a realistic full name.
 */
function genName(i) {
  const useArabic = i % 2 === 0;
  const first = useArabic
    ? pick(FIRST_NAMES_AR)
    : pick(FIRST_NAMES_FR);
  const last = pick(LAST_NAMES);
  return `${first} ${last}`;
}

/**
 * Generate a profile row (once auth user is created).
 */
function genProfile(i, userId) {
  const phone = genPhone(i);
  return {
    id: userId,
    full_name: genName(i),
    username: genUsername(i),
    avatar_url: `https://i.pravatar.cc/300?u=${userId}`,
    cover_image_url: `https://picsum.photos/seed/${userId}/800/200`,
    bio: pick(BIOS),
    city: pick(CITIES),
    phone,
    phone_verified: true,
    role: i === 0 ? "admin" : "member",
    onboarding_completed: true,
    language_preference: i % 2 === 0 ? "ar" : "fr",
    created_at: new Date(Date.now() - randomInt(0, 90 * 86400000)).toISOString(),
  };
}

/**
 * Generate a post row.
 */
function genPost(i, userIds) {
  const authorId = pick(userIds);
  const daysAgo = randomInt(0, 60);
  const content = pick(POST_CONTENT);
  return {
    id: randomUUID(),
    author_id: authorId,
    type: pick(POST_TYPES),
    title: content.length > 50 ? content.slice(0, 50) + "..." : null,
    content,
    status: "published",
    likes_count: 0,
    comments_count: 0,
    saves_count: 0,
    shares_count: randomInt(0, 20),
    created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    updated_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  };
}

/**
 * Generate a comment row.
 */
function genComment(i, userIds, postIds) {
  return {
    id: randomUUID(),
    post_id: pick(postIds),
    author_id: pick(userIds),
    content: pick(POST_CONTENT),
    status: "published",
    created_at: new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString(),
  };
}

/**
 * Generate a memory row.
 */
function genMemory(i, userIds) {
  const contributorId = pick(userIds);
  const year = pick([1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020]);
  return {
    id: randomUUID(),
    contributor_id: contributorId,
    title: pick(MEMORY_TITLES),
    description: pick(POST_CONTENT),
    decade: `${Math.floor(year / 10) * 10}s`,
    year,
    location: pick(CITIES),
    category: pick(["port","railway","schools","families","culture","sport","market","beach","fishing","other"]),
    verification_status: "approved",
    tags: [],
    shares_count: randomInt(0, 10),
    reactions_count: 0,
    comments_count: 0,
    saves_count: 0,
    created_at: new Date(Date.now() - randomInt(0, 365) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - randomInt(0, 365) * 86400000).toISOString(),
  };
}

/**
 * Generate an idea row.
 */
function genIdea(i, userIds, categoryIds) {
  const authorId = pick(userIds);
  return {
    id: randomUUID(),
    author_id: authorId,
    title: pick(IDEA_TITLES),
    description: pick(POST_CONTENT),
    category_id: pick(categoryIds),
    status: pick(IDEA_STATUSES),
    votes_count: 0,
    shares_count: 0,
    supporters_count: 0,
    participants_count: 0,
    created_at: new Date(Date.now() - randomInt(0, 60) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - randomInt(0, 60) * 86400000).toISOString(),
  };
}

/**
 * Generate a Fadla (community share) item row.
 */
function genFadla(i, userIds) {
  const ownerId = pick(userIds);
  const statuses = ["published","published","published","published","requested","reserved","completed","completed"];
  const status = pick(statuses);
  return {
    id: randomUUID(),
    owner_id: ownerId,
    title: pick(FADLA_TITLES),
    description: pick(POST_CONTENT),
    category: pick(FADLA_CATEGORIES),
    condition: pick(FADLA_CONDITIONS),
    location: pick(CITIES),
    quantity: randomInt(1, 5),
    urgency_level: pick(URGENCY_LEVELS),
    status,
    images: "[]",
    shares_count: randomInt(0, 10),
    created_at: new Date(Date.now() - randomInt(0, 45) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - randomInt(0, 45) * 86400000).toISOString(),
  };
}

/**
 * Generate a notification row.
 */
function genNotification(i, userIds) {
  const userId = pick(userIds);
  const actorId = pick(userIds.filter((id) => id !== userId));
  const types = [
    "post_reaction","post_comment","fadla_request","fadla_request_accepted",
    "fadla_request_declined","idea_comment","idea_support","idea_participate_request",
    "idea_participant_accepted","idea_message","idea_status_change",
    "memory_reaction","memory_comment","new_follower",
  ];
  const type = pick(types);
  return {
    id: randomUUID(),
    user_id: userId,
    actor_id: actorId,
    type,
    title: `إشعار ${type}`,
    message: pick(POST_CONTENT),
    read: Math.random() < 0.4,
    metadata: JSON.stringify({}),
    created_at: new Date(Date.now() - randomInt(0, 14) * 86400000).toISOString(),
  };
}

/**
 * Generate a reaction row.
 */
function genReaction(postId, userIds) {
  return {
    post_id: postId,
    user_id: pick(userIds),
    reaction_type: pick(REACTION_TYPES),
  };
}

/**
 * Generate an idea vote row.
 */
function genIdeaVote(ideaId, userIds) {
  return {
    idea_id: ideaId,
    user_id: pick(userIds),
  };
}

/**
 * Generate an idea supporter row.
 */
function genIdeaSupporter(ideaId, userId) {
  return {
    idea_id: ideaId,
    user_id: userId,
  };
}

/**
 * Generate a Fadla request row.
 */
function genFadlaRequest(shareId, requesterId) {
  return {
    id: randomUUID(),
    share_id: shareId,
    requester_id: requesterId,
    message: pick(POST_CONTENT),
    status: "accepted",
    created_at: new Date(Date.now() - randomInt(0, 14) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - randomInt(0, 14) * 86400000).toISOString(),
  };
}

/**
 * Generate a Fadla message row.
 */
function genFadlaMessage(shareId, requestId, senderId) {
  return {
    id: randomUUID(),
    share_id: shareId,
    request_id: requestId,
    sender_id: senderId,
    message: pick(POST_CONTENT),
    created_at: new Date(Date.now() - randomInt(0, 7) * 86400000).toISOString(),
  };
}

/**
 * Generate an idea message row.
 */
function genIdeaMessage(ideaId, senderId) {
  return {
    id: randomUUID(),
    idea_id: ideaId,
    sender_id: senderId,
    message: pick(POST_CONTENT),
    created_at: new Date(Date.now() - randomInt(0, 7) * 86400000).toISOString(),
  };
}

/**
 * Generate an idea participant row.
 */
function genIdeaParticipant(ideaId, userId) {
  return {
    id: randomUUID(),
    idea_id: ideaId,
    user_id: userId,
    status: "accepted",
    created_at: new Date(Date.now() - randomInt(0, 14) * 86400000).toISOString(),
  };
}

// ─── Batch Insert Helpers ────────────────────────────────────────────────────

function toPgInsert(table, columns, rows) {
  if (rows.length === 0) return null;
  const colList = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = rows.map((_, ri) =>
    `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(", ")})`
  ).join(", ");
  const values = rows.flatMap((r) => columns.map((c) => r[c] ?? null));
  return { text: `INSERT INTO "${table}" (${colList}) VALUES ${placeholders} ON CONFLICT DO NOTHING`, values };
}

async function batchInsert(table, columns, rows, label = "") {
  if (rows.length === 0) return;
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const stmt = toPgInsert(table, columns, chunk);
    if (!stmt) continue;
    try {
      await query(stmt.text, stmt.values);
    } catch (err) {
      console.error(`  [FAIL] ${label} batch ${i / batchSize}: ${err.message.slice(0, 200)}`);
      throw err;
    }
    process.stdout.write(".");
  }
  console.log(` ${rows.length} ${label}`);
}

// ─── Step 1: Create Auth Users ───────────────────────────────────────────────

async function createAuthUsers(count) {
  console.log(`\n=== Step 1: Creating ${count} auth users ===`);
  const created = [];
  const batchSize = CONFIG.batchSize;

  for (let batchStart = 0; batchStart < count; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, count);
    const promises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      const phone = genPhone(i);
      const email = toEmail(phone);
      const name = genName(i);
      const username = genUsername(i);
      promises.push(
        supabase.auth.admin.createUser({
          email,
          password: CONFIG.testPassword,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            full_name: name,
            username,
            phone,
            avatar_url: `https://i.pravatar.cc/300?u=user_${padIdx(i)}`,
          },
        }).then(({ data, error }) => {
          if (error) {
            console.error(`  [ERR] User ${i} (${email}): ${error.message}`);
            return null;
          }
          return { index: i, userId: data.user.id, email, phone, name };
        })
      );
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r) created.push(r);
    }
    process.stdout.write(`  Batch ${batchStart / batchSize + 1}/${Math.ceil(count / batchSize)}: ${results.filter(Boolean).length} users created\n`);
    if (batchEnd < count) {
      await new Promise((r) => setTimeout(r, CONFIG.batchDelayMs));
    }
  }
  console.log(`  [DONE] ${created.length} auth users created`);
  return created;
}

// ─── Step 2: Update Profiles ────────────────────────────────────────────────

async function updateProfiles(users) {
  console.log(`\n=== Step 2: Updating ${users.length} profiles ===`);
  const rows = users.map((u) => genProfile(u.index, u.userId));
  const columns = [
    "id","full_name","username","avatar_url","cover_image_url","bio","city",
    "phone","phone_verified","role","onboarding_completed","language_preference","created_at",
  ];
  await batchInsert("profiles", columns, rows, "profiles");
}

// ─── Step 3: Create Posts ────────────────────────────────────────────────────

async function createPosts(count, userIds) {
  console.log(`\n=== Step 3: Creating ${count} posts ===`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(genPost(i, userIds));
  }
  const columns = [
    "id","author_id","type","title","content","status",
    "likes_count","comments_count","saves_count","shares_count","created_at","updated_at",
  ];
  await batchInsert("posts", columns, rows, "posts");
  return rows.map((r) => r.id);
}

// ─── Step 4: Create Comments ─────────────────────────────────────────────────

async function createComments(count, userIds, postIds) {
  console.log(`\n=== Step 4: Creating ${count} comments ===`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(genComment(i, userIds, postIds));
  }
  const columns = [
    "id","post_id","author_id","content","status","created_at","updated_at",
  ];
  await batchInsert("comments", columns, rows, "comments");
}

// ─── Step 5: Create Memories ─────────────────────────────────────────────────

async function createMemories(count, userIds) {
  console.log(`\n=== Step 5: Creating ${count} memories ===`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(genMemory(i, userIds));
  }
  const columns = [
    "id","contributor_id","title","description","decade","year","location","category",
    "verification_status","tags","shares_count","reactions_count","comments_count",
    "saves_count","created_at","updated_at",
  ];
  await batchInsert("memories", columns, rows, "memories");
  return rows.map((r) => r.id);
}

// ─── Step 6: Create Ideas ────────────────────────────────────────────────────

async function createIdeas(count, userIds, categoryIds) {
  console.log(`\n=== Step 6: Creating ${count} ideas ===`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(genIdea(i, userIds, categoryIds));
  }
  const columns = [
    "id","author_id","title","description","category_id","status",
    "votes_count","shares_count","supporters_count","participants_count",
    "created_at","updated_at",
  ];
  await batchInsert("ideas", columns, rows, "ideas");
  return rows.map((r) => r.id);
}

// ─── Step 7: Create Fadla Items ──────────────────────────────────────────────

async function createFadlaItems(count, userIds) {
  console.log(`\n=== Step 7: Creating ${count} Fadla items ===`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(genFadla(i, userIds));
  }
  const columns = [
    "id","owner_id","title","description","category","condition","location",
    "quantity","urgency_level","status","images","shares_count","created_at","updated_at",
  ];
  await batchInsert("community_shares", columns, rows, "Fadla items");
  return rows.map((r) => r.id);
}

// ─── Step 8: Create Notifications ────────────────────────────────────────────

async function createNotifications(count, userIds) {
  console.log(`\n=== Step 8: Creating ${count} notifications ===`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(genNotification(i, userIds));
  }
  const columns = [
    "id","user_id","actor_id","type","title","message","read","metadata","created_at",
  ];
  await batchInsert("notifications", columns, rows, "notifications");
}

// ─── Step 9: Simulate Reactions ──────────────────────────────────────────────

async function simulateReactions(postIds, allUserIds) {
  console.log(`\n=== Step 9: Simulating reactions on posts ===`);
  const seen = new Set();
  const rows = [];
  for (const postId of postIds) {
    const numReactions = randomInt(0, 10);
    for (let r = 0; r < numReactions; r++) {
      const userId = pick(allUserIds);
      const key = `${postId}:${userId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(genReaction(postId, [userId]));
    }
  }
  const columns = ["post_id","user_id","reaction_type"];
  await batchInsert("post_reactions", columns, rows, "reactions");

  // Update likes_count on posts
  console.log("  Updating post likes_count...");
  for (const postId of postIds) {
    const { rows: counts } = await query(
      `SELECT COUNT(*)::int as cnt FROM "post_reactions" WHERE "post_id" = $1`,
      [postId]
    );
    if (counts[0].cnt > 0) {
      await query(
        `UPDATE "posts" SET "likes_count" = $1 WHERE "id" = $2`,
        [counts[0].cnt, postId]
      );
    }
  }
  console.log(`  Updated likes_count for ${postIds.length} posts`);
}

// ─── Step 10: Simulate Idea Votes & Supporters ──────────────────────────────

async function simulateIdeaActivity(ideaIds, allUserIds) {
  console.log(`\n=== Step 10: Simulating idea votes & supporters ===`);

  // Votes
  const voteSeen = new Set();
  const voteRows = [];
  for (const ideaId of ideaIds) {
    const numVotes = randomInt(0, 25);
    for (let v = 0; v < numVotes; v++) {
      const userId = pick(allUserIds);
      const key = `${ideaId}:${userId}`;
      if (voteSeen.has(key)) continue;
      voteSeen.add(key);
      voteRows.push({ idea_id: ideaId, user_id: userId });
    }
  }
  const columns = ["idea_id","user_id"];
  await batchInsert("idea_votes", columns, voteRows, "idea votes");

  // Supporters
  const supSeen = new Set();
  const supRows = [];
  for (const ideaId of ideaIds) {
    const numSupport = randomInt(0, 15);
    for (let s = 0; s < numSupport; s++) {
      const userId = pick(allUserIds);
      const key = `${ideaId}:${userId}`;
      if (supSeen.has(key)) continue;
      supSeen.add(key);
      supRows.push({ idea_id: ideaId, user_id: userId });
    }
  }
  await batchInsert("idea_supporters", ["idea_id","user_id"], supRows, "idea supporters");

  // Update counts
  console.log("  Updating idea aggregates...");
  for (const ideaId of ideaIds) {
    const [{ rows: vc }] = await Promise.all([
      query(`SELECT COUNT(*)::int as cnt FROM "idea_votes" WHERE "idea_id" = $1`, [ideaId]),
    ]);
    const [{ rows: sc }] = await Promise.all([
      query(`SELECT COUNT(*)::int as cnt FROM "idea_supporters" WHERE "idea_id" = $1`, [ideaId]),
    ]);
    await query(
      `UPDATE "ideas" SET "votes_count" = $1, "supporters_count" = $2 WHERE "id" = $3`,
      [vc[0].cnt, sc[0].cnt, ideaId]
    );
  }
}

// ─── Step 11: Simulate Fadla Workflows ──────────────────────────────────────

async function simulateFadlaWorkflow(fadlaIds, allUserIds) {
  console.log(`\n=== Step 11: Simulating Fadla workflows ===`);

  const fadlaWithOwner = await query(
    `SELECT "id", "owner_id" FROM "community_shares" WHERE "id" = ANY($1)`,
    [fadlaIds]
  );
  const items = fadlaWithOwner.rows;

  let requestsCreated = 0;
  let messagesCreated = 0;

  for (const item of items) {
    if (Math.random() > 0.4) continue; // 60% get requests
    const requesterId = pick(allUserIds.filter((id) => id !== item.owner_id));
    if (!requesterId) continue;

    const request = genFadlaRequest(item.id, requesterId);
    await batchInsert("community_share_requests",
      ["id","share_id","requester_id","message","status","created_at","updated_at"],
      [request], "Fadla requests"
    );
    requestsCreated++;

    // Update share to accepted/reserved
    const acceptance = Math.random() < 0.6; // 60% get accepted
    if (acceptance) {
      await query(
        `UPDATE "community_shares" SET "status" = 'reserved', "accepted_request_id" = $1, "updated_at" = NOW() WHERE "id" = $2`,
        [request.id, item.id]
      );

      // Simulate some discussions
      const numMessages = randomInt(0, 6);
      for (let m = 0; m < numMessages; m++) {
        const senderId = Math.random() < 0.5 ? item.owner_id : requesterId;
        const msg = genFadlaMessage(item.id, request.id, senderId);
        await batchInsert("fadla_request_messages",
          ["id","share_id","request_id","sender_id","message","created_at"],
          [msg], "Fadla messages"
        );
        messagesCreated++;

        // Small delay to get unique created_at
        await new Promise((r) => setTimeout(r, 5));
      }

      // Simulate some completions
      if (numMessages > 2 && Math.random() < 0.5) {
        await query(
          `UPDATE "community_shares" SET "receiver_confirmed_at" = NOW(), "sender_confirmed_at" = NOW(), "status" = 'completed', "completed_at" = NOW(), "updated_at" = NOW() WHERE "id" = $1`,
          [item.id]
        );
      }
    }
  }
  console.log(`  ${requestsCreated} Fadla requests, ${messagesCreated} messages`);
}

// ─── Step 12: Simulate Idea Discussions ──────────────────────────────────────

async function simulateIdeaDiscussions(ideaIds, allUserIds) {
  console.log(`\n=== Step 12: Simulating idea discussions ===`);

  let participantsCreated = 0;
  let messagesCreated = 0;

  // Get idea + author info
  const ideaRows = await query(`SELECT "id", "author_id" FROM "ideas"`, []);
  const ideas = ideaRows.rows;

  for (const idea of ideas) {
    // 40% of ideas get participants
    if (Math.random() > 0.4) continue;

    const numParticipants = randomInt(1, 4);
    const addedUserIds = new Set();
    for (let p = 0; p < numParticipants; p++) {
      const userId = pick(allUserIds.filter((id) => id !== idea.author_id && !addedUserIds.has(id)));
      if (!userId) continue;
      addedUserIds.add(userId);

      const participant = genIdeaParticipant(idea.id, userId);
      await batchInsert("idea_participants",
        ["id","idea_id","user_id","status","created_at"],
        [participant], "idea participants"
      );
      participantsCreated++;
    }

    // Update participants_count
    await query(
      `UPDATE "ideas" SET "participants_count" = $1 WHERE "id" = $2`,
      [addedUserIds.size, idea.id]
    );

    // Simulate discussion messages
    if (addedUserIds.size > 0) {
      const numMessages = randomInt(0, 8);
      const discussants = [idea.author_id, ...Array.from(addedUserIds)];
      for (let m = 0; m < numMessages; m++) {
        const senderId = pick(discussants);
        const msg = genIdeaMessage(idea.id, senderId);
        await batchInsert("idea_messages",
          ["id","idea_id","sender_id","message","created_at"],
          [msg], "idea messages"
        );
        messagesCreated++;
        await new Promise((r) => setTimeout(r, 5));
      }
    }

    // 30% of discussed ideas get status progression
    if (addedUserIds.size > 0 && Math.random() < 0.3) {
      const statuses = ["interested","discussion","in_progress","completed"];
      const newStatus = statuses[randomInt(0, statuses.length)];
      await query(
        `UPDATE "ideas" SET "status" = $1, "updated_at" = NOW() WHERE "id" = $2`,
        [newStatus, idea.id]
      );
    }
  }
  console.log(`  ${participantsCreated} participants, ${messagesCreated} messages`);
}

// ─── Step 13: Simulate Follows ──────────────────────────────────────────────

async function simulateFollows(allUserIds) {
  console.log(`\n=== Step 13: Simulating user follows ===`);
  const seen = new Set();
  const rows = [];

  // Each user follows 3-15 random users
  for (const userId of allUserIds) {
    const numFollows = randomInt(3, 15);
    for (let f = 0; f < numFollows; f++) {
      const targetId = pick(allUserIds.filter((id) => id !== userId));
      if (!targetId) continue;
      const key = `${userId}:${targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ follower_id: userId, following_id: targetId });
    }
  }

  const columns = ["follower_id","following_id"];
  await batchInsert("user_follows", columns, rows, "follows");
}

// ─── Step 14: Simulate Comment Updates (counts) ─────────────────────────────

async function updateCommentCounts() {
  console.log(`\n=== Step 14: Updating comment counts on posts ===`);
  await query(`
    UPDATE "posts" p
    SET "comments_count" = COALESCE((
      SELECT COUNT(*)::int FROM "comments" c
      WHERE c."post_id" = p."id" AND c."status" = 'published'
    ), 0)
  `);
  console.log("  Done.");
}

// ─── Verify Data ─────────────────────────────────────────────────────────────

async function verifyData() {
  console.log(`\n=== Verify: Checking table counts ===`);
  const tables = [
    "profiles","posts","comments","memories","ideas","community_shares",
    "notifications","post_reactions","idea_votes","idea_supporters",
    "idea_participants","idea_messages","community_share_requests",
    "fadla_request_messages","user_follows",
  ];
  for (const table of tables) {
    const { rows } = await query(`SELECT COUNT(*)::int as cnt FROM "${table}"`);
    console.log(`  ${table}: ${rows[0].cnt}`);
  }
}

// ─── Summary File ────────────────────────────────────────────────────────────

async function writeSummary(users) {
  const summary = {
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    users: {
      total: users.length,
      sampleCredentials: {
        email: toEmail(genPhone(1)),
        password: CONFIG.testPassword,
      },
      adminLogin: {
        email: toEmail(genPhone(0)),
        password: CONFIG.testPassword,
        note: "User 0 is seeded as admin role",
      },
    },
    tables: {},
  };

  const tables = [
    "profiles","posts","comments","memories","ideas","community_shares",
    "notifications","post_reactions","idea_votes","idea_supporters",
    "community_share_requests","fadla_request_messages","idea_participants",
    "idea_messages","user_follows",
  ];
  for (const table of tables) {
    const { rows } = await query(`SELECT COUNT(*)::int as cnt FROM "${table}"`);
    summary.tables[table] = rows[0].cnt;
  }

  const outPath = new URL("../seed-summary.json", import.meta.url).pathname;
  const fs = await import("fs");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nSummary written to seed-summary.json`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        INDB Community OS — Test Data Generator               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`Target: ${CONFIG.totalUsers} users, ${CONFIG.totalPosts} posts, ${CONFIG.totalComments} comments`);
  console.log(`        ${CONFIG.totalMemories} memories, ${CONFIG.totalIdeas} ideas, ${CONFIG.totalFadla} Fadla items`);
  console.log(`        ${CONFIG.totalNotifications} notifications`);

  const startTime = Date.now();

  try {
    // 1. Create auth users
    const users = await createAuthUsers(CONFIG.totalUsers);
    const userIds = users.map((u) => u.userId);

    // 2. Update profiles
    await updateProfiles(users);

    // 3. Get category IDs
    const { rows: catRows } = await query(`SELECT "id" FROM "categories" ORDER BY "id"`);
    const categoryIds = catRows.length > 0 ? catRows.map((r) => r.id) : [1];

    // 4. Create content
    const postIds = await createPosts(CONFIG.totalPosts, userIds);
    await createComments(CONFIG.totalComments, userIds, postIds);
    await createMemories(CONFIG.totalMemories, userIds);
    const ideaIds = await createIdeas(CONFIG.totalIdeas, userIds, categoryIds);
    const fadlaIds = await createFadlaItems(CONFIG.totalFadla, userIds);
    await createNotifications(CONFIG.totalNotifications, userIds);

    // 5. Simulate activity
    await simulateReactions(postIds, userIds);
    await simulateIdeaActivity(ideaIds, userIds);
    await simulateFadlaWorkflow(fadlaIds, userIds);
    await simulateIdeaDiscussions(ideaIds, userIds);
    await simulateFollows(userIds);
    await updateCommentCounts();

    // 6. Verify
    await verifyData();
    await writeSummary(users);

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✓ Seed completed in ${elapsed} minutes`);
    console.log(`  Sample login: ${toEmail(genPhone(1))} / ${CONFIG.testPassword}`);
    console.log(`  Admin login:  ${toEmail(genPhone(0))} / ${CONFIG.testPassword}`);

  } catch (err) {
    console.error("\n✗ Seed failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
