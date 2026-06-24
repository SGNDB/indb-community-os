#!/usr/bin/env node
/**
 * Visual Test Dataset Seed
 *
 * Creates 50 test users + content for visual review.
 * Uses deterministic UUIDs and identifiable email domain for safe cleanup.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/seed-visual-test.mjs
 *
 * To clean up afterward:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/cleanup-test-data.mjs
 */

import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

const CONFIG = {
  totalUsers: 50,
  totalPosts: 50,
  totalMemories: 50,
  totalIdeas: 50,
  totalFadla: 50,
  totalNotifications: 500,
  testPassword: "TestPass123!",
  authBatchSize: 10,
  authBatchDelayMs: 1000,
  dbBatchSize: 50,
  seedNamespace: "indb-visual-test-v1",
};

const FIRST_NAMES = [
  "Mohamed","Ahmed","Sidi","Aminetou","Mariem","Khadijetou",
  "Mamadou","Aissata","Fatou","Boubacar","Oumar","Samba",
  "Hawa","Aminata","Cheikh","Moussa","Salma","Bilal",
  "Yero","Adama","Ndeye","Maimouna","Seydou","Ibrahima",
  "Fatimetou","Aliou","Demba","Mariama","Assane","Kadiatou",
  "Mody","Ramatoulaye","Thierno","Aicha","Mamadou Lamine",
  "Mame","Diya","El Hadj","Mintou","Mamoudou","Souleymane",
  "Djibril","Haby","Moussa T.","Aby","Mariame","Ousmane",
  "Penda","Massa","Lalla",
];

const LAST_NAMES = [
  "Ould Salem","Mint Ahmed","Fall","Diallo","Ba","Sy",
  "Kane","Diop","Ndiaye","Sow","Tall","Camara","Cissé",
  "Traoré","Dieng","Niang","Thiam","Gueye","Bah","Sall",
  "Mahmoud","Ould Sidi","Mint Mohamed","Barry","Tounkara",
  "Tandia","Sakho","Samb","Faye","Mbaye",
];

const AREAS = [
  "Cansado","Numerowatt","Dubai","Tcharka","Robinet 10",
  "Port Artisanal","Boulenoir","Centre Ville","Socogim",
  "Tarhil","PK 55","Baghdad","Basra","Madrid","La Batterie",
];

const LANGUAGES = ["ar","fr","ff","snk","wo"];

const POST_CONTENT = [
  "Nettoyage du marché de Cansado aujourd'hui. Merci à tous les volontaires !",
  "Nouvelle formation en pâtisserie pour les jeunes au centre culturel de Numerowatt.",
  "Réunion du comité de quartier à Socogim jeudi prochain à 17h.",
  "La bibliothèque municipale a reçu un lot de nouveaux livres en arabe et en français.",
  "Tournoi de football inter-quartiers ce weekend au stade de Tcharka.",
  "Campagne de vaccination des enfants à l'hôpital de Nouadhibou cette semaine.",
  "Exposition d'artisanat local au port artisanal. Venez nombreux !",
  "Atelier de sensibilisation à l'environnement pour les jeunes à La Batterie.",
  "Initiative de plantation d'arbres le long du boulevard principal. Samedi matin.",
  "Le groupe de musique traditionnelle répète chaque mardi soir, ouvert à tous.",
  "Séance de lecture pour enfants à la médiathèque de Centre Ville mercredi.",
  "Formation en informatique pour adultes à l'espace numérique de Tcharka.",
  "Distribution de fournitures scolaires dans les écoles de Dubaï et Baghdad.",
  "Conférence sur l'histoire de Nouadhibou à la maison de la culture vendredi.",
  "Compétition de natation pour les jeunes à la piscine municipale de Cansado.",
  "Atelier de théâtre pour adolescents au centre culturel. Inscriptions ouvertes.",
  "Collecte de vêtements pour les familles nécessaires au quartier PK 55.",
  "Réparation des lampadaires dans le quartier de Basra. Travaux dès lundi.",
  "Foire aux livres d'occasion à la place publique de Centre Ville ce dimanche.",
  "Journée portes ouvertes à la nouvelle bibliothèque numérique de Nouadhibou.",
];

const MEMORY_CONTENT = [
  "Je me souviens du vieux marché aux poissons quand j'étais enfant. L'odeur, les couleurs, les cris des marchands.",
  "La construction de la grande mosquée en 1985. Tout le quartier participait le weekend.",
  "Mon père travaillait au port. Il partait avant l'aube et rentrait fatigué mais souriant.",
  "Les matchs de football improvisés sur la plage de La Batterie dans les années 90.",
  "L'ancienne gare ferroviaire où arrivaient les trains chargés de minerai. Un spectacle quotidien.",
  "Les soirées d'été à Cansado où les voisins sortaient leurs chaises devant la maison.",
  "Ma grand-mère racontait des histoires du temps de la colonisation espagnole.",
  "Le premier cinéma de Nouadhibou. J'y ai vu mon premier film en 1998.",
  "La fête de l'indépendance en 1990. Les rues décorées aux couleurs nationales.",
  "L'école primaire de Numerowatt en 1995. Une seule salle pour trois niveaux.",
  "Les mariages traditionnels duraient trois jours. La musique ne s'arrêtait jamais.",
  "Le vieux phare de Nouadhibou guidait les bateaux. Visible de toute la ville la nuit.",
  "La première fois que j'ai vu la mer à La Batterie. J'avais 7 ans, émerveillé.",
  "Mon oncle pêcheur partait en mer des semaines. À son retour, tout le quartier festoyait.",
  "Les cours d'arabe à la mosquée du quartier après l'école. Le maître était strict mais juste.",
  "Le marché hebdomadaire de Cansado attirait les commerçants de toute la région.",
  "Les parties de pêche entre amis au petit matin, avant la chaleur du soleil.",
  "La bibliothèque municipale dans les années 80 était petite, mais pleine de savoir.",
  "Le carnaval annuel de Nouadhibou en 2005, explosion de couleurs et de musique.",
  "L'arrivée de l'électricité dans mon quartier en 1992. Les gens pleuraient de joie.",
];

const IDEA_CONTENT = [
  "Créer un espace vert public à Cansado avec des arbres, des bancs et une aire de jeux.",
  "Organiser un marché de producteurs locaux chaque samedi au Centre Ville.",
  "Système de covoiturage pour réduire le trafic et la pollution à Nouadhibou.",
  "Application mobile pour signaler les pannes d'éclairage public et problèmes de voirie.",
  "Programme de mentorat pour les jeunes entrepreneurs avec des experts locaux.",
  "Construire une piscine municipale avec des cours de natation gratuits.",
  "Panneaux solaires sur les bâtiments publics pour réduire la facture énergétique.",
  "Festival annuel de la culture pulaar, soninké et wolof à Nouadhibou.",
  "Ateliers de formation aux métiers du numérique pour les femmes.",
  "Visites guidées du patrimoine historique de Nouadhibou pour les touristes.",
  "Réseau de bibliothèques de quartier avec des livres dans les langues locales.",
  "Campagne de recyclage avec des points de collecte dans chaque quartier.",
  "Fontaines d'eau potable dans les espaces publics fréquentés.",
  "Espace de coworking pour les travailleurs indépendants et les startups.",
  "Cours d'alphabétisation pour adultes dans chaque quartier de Nouadhibou.",
  "Transport scolaire pour les élèves des zones éloignées.",
  "Jardin partagé dans chaque quartier pour cultiver des légumes.",
  "Programme d'échange culturel entre Nouadhibou et ses villes jumelées.",
  "Compétitions sportives inter-quartiers chaque mois avec des prix.",
  "Installation de terrains de sport synthétiques dans les quartiers qui n'en ont pas.",
];

const FADLA_ITEMS = [
  { title: "Vélo d'enfant en bon état", cat: "other" },
  { title: "Lot de livres en français et arabe", cat: "books" },
  { title: "Table en bois à donner", cat: "furniture" },
  { title: "Vêtements d'hiver pour enfant (3-5 ans)", cat: "clothes" },
  { title: "Cartable et fournitures scolaires", cat: "school_supplies" },
  { title: "Riz et pâtes non entamés", cat: "food" },
  { title: "Lit une place avec matelas", cat: "furniture" },
  { title: "Jouets et peluches en bon état", cat: "other" },
  { title: "Chaise de bureau pliante", cat: "furniture" },
  { title: "Manteaux et vestes pour adulte (L-XL)", cat: "clothes" },
  { title: "Manuels scolaires niveau primaire", cat: "books" },
  { title: "Lampe de bureau et fournitures", cat: "school_supplies" },
  { title: "Poussette pour bébé", cat: "other" },
  { title: "Dictionnaires français-arabe", cat: "books" },
  { title: "Service de vaisselle (12 pièces)", cat: "other" },
  { title: "Chemises et pantalons homme (M)", cat: "clothes" },
  { title: "Livre de cuisine et recettes", cat: "books" },
  { title: "Petite étagère en bois", cat: "furniture" },
  { title: "Sac de couchage neuf", cat: "other" },
  { title: "Ballons de football et basketball", cat: "other" },
  { title: "Tableau pour enfants", cat: "school_supplies" },
  { title: "Radiateur d'appoint", cat: "other" },
  { title: "Robe traditionnelle taille M", cat: "clothes" },
  { title: "Encyclopédie en 5 volumes", cat: "books" },
  { title: "Bureau d'ordinateur", cat: "furniture" },
  { title: "Lait en poudre boîtes non ouvertes", cat: "food" },
  { title: "Tapis de prière neuf", cat: "other" },
  { title: "Chaussures enfant pointure 28-30", cat: "clothes" },
  { title: "Cahiers et stylos (lot)", cat: "school_supplies" },
  { title: "Cuisinière à gaz (bon état)", cat: "other" },
  { title: "Romans en français (lot de 10)", cat: "books" },
  { title: "Petite table basse", cat: "furniture" },
  { title: "Écharpes et bonnets neufs", cat: "clothes" },
  { title: "Atlas géographique", cat: "books" },
  { title: "Fournitures de peinture", cat: "school_supplies" },
  { title: "Sacs de voyage (2)", cat: "other" },
  { title: "Bible et livres religieux", cat: "books" },
  { title: "Fauteuil relax", cat: "furniture" },
  { title: "Chemises femme (S-M)", cat: "clothes" },
  { title: "Calculatrice scientifique", cat: "school_supplies" },
  { title: "Machine à coudre manuelle", cat: "other" },
  { title: "Contes pour enfants (lot)", cat: "books" },
  { title: "Commode en bois (3 tiroirs)", cat: "furniture" },
  { title: "Chaussures de sport pointure 42", cat: "clothes" },
  { title: "Tableau blanc et marqueurs", cat: "school_supplies" },
  { title: "Parapluie et imperméables", cat: "other" },
  { title: "Poésie arabe classique (recueil)", cat: "books" },
  { title: "Lit superposé démonté", cat: "furniture" },
  { title: "Costume traditionnel complet (L)", cat: "clothes" },
  { title: "Kit de géométrie complet", cat: "school_supplies" },
];

const REACTION_TYPES = ["like","love","support","celebrate","insightful","sad"];
const NOTIF_TYPES = [
  ["comment","post"],["reaction","post"],["follow","profile"],
  ["fadla_request","community_share"],["fadla_request_accepted","community_share"],
  ["fadla_request_declined","community_share"],["fadla_message","community_share"],
  ["idea_support","idea"],["idea_participate_request","idea"],["idea_message","idea"],
];

const COMMENT_TEXTS = [
  "Très belle initiative !","Merci de partager cela.","Bravo à tous !",
  "Je serai présent inchallah.","Excellente nouvelle !","On en avait besoin.",
  "Je participerai avec plaisir.","Super idée !","C'est vraiment utile.",
  "Comptez sur moi !","Je peux apporter mon aide.","Très intéressant, merci.",
  "Mes enfants vont adorer.","Bonne chance pour ce projet !","Félicitations !",
];

// ── Helpers ─────────────────────────────────────────────────────────
function stableUuid(ns, id) {
  const h = createHash("md5").update(ns + ":" + id).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${(8+(parseInt(h[16],16)&3).toString())}${h.slice(17,20)}-${h.slice(20,32)}`;
}
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }
function pickN(a, n) { const s=new Set(); while(s.size<n&&s.size<a.length) s.add(pick(a)); return [...s]; }
function rand(mx) { return Math.floor(Math.random()*mx); }
function ri(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

function uid(i) { return stableUuid(CONFIG.seedNamespace, `user:${i}`); }
function email(i) { return `test.user${String(i).padStart(3,"0")}@indb-test.example.com`; }
function phone(i) { return `+22246${String(i).padStart(6,"0")}`; }

// Synthetic email derived from phone, used by the app's phone-auth login flow
function syntheticEmail(i) { return `22246${String(i).padStart(6,"0")}@phone.indb.local`; }

function makeUsername(firstName, i) {
  return firstName.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"") + (100+i);
}

const uidMap = new Map();

async function main() {
  const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log(`\n=== Visual Test Dataset Seed ===`);
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Users: ${CONFIG.totalUsers}, Posts: ${CONFIG.totalPosts}`);
  console.log(`Memories: ${CONFIG.totalMemories}, Ideas: ${CONFIG.totalIdeas}`);
  console.log(`Graatek: ${CONFIG.totalFadla}, Notifications: ${CONFIG.totalNotifications}\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Step 1: Create auth users + profiles ──
  console.log("● Step 1/5: Creating test users...");
  for (let i = 0; i < CONFIG.totalUsers; i++) {
    const em = email(i);
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const username = makeUsername(firstName, i);
    const userUid = uid(i);

    const { data, error } = await supabase.auth.admin.createUser({
      email: syntheticEmail(i),
      password: CONFIG.testPassword,
      email_confirm: true,
      phone: phone(i),
      phone_confirm: true,
      user_metadata: { full_name: fullName, is_test: true },
    });

    if (error) {
      if (error.message.includes("already exists")) {
        const { data: existing } = await supabase.auth.admin.getUserByEmail(em);
        if (existing?.user) {
          uidMap.set(i, existing.user.id);
          console.log(`  ${i+1}/${CONFIG.totalUsers} exists: ${fullName}`);
        }
      } else {
        console.error(`  FAIL user ${i+1}: ${error.message}`);
      }
    } else if (data?.user) {
      uidMap.set(i, data.user.id);
      console.log(`  ${i+1}/${CONFIG.totalUsers} created: ${fullName}`);
    }

    // Create profile
    if (uidMap.has(i)) {
      const pid = uidMap.get(i);
      const profile = {
        id: pid,
        full_name: fullName,
        username,
        bio: `Habitant de ${pick(AREAS)}. ${pick(["Passionné par ma ville.","Membre actif de la communauté.","Amoureux de Nouadhibou."])}`,
        city: pick(AREAS),
        hometown: pick(AREAS),
        language_preference: pick(LANGUAGES),
        languages_spoken: JSON.stringify(pickN(LANGUAGES, ri(1,3))),
        role: pick(["member","member","member","contributor","contributor"]),
        contribution_score: ri(0,500),
        onboarding_completed: true,
      };
      await supabase.from("profiles").upsert(profile, { onConflict: "id" });
    }

    if ((i+1) % CONFIG.authBatchSize === 0) {
      await new Promise(r => setTimeout(r, CONFIG.authBatchDelayMs));
    }
  }

  const userIds = [...uidMap.values()];
  console.log(`  Profiles ready: ${userIds.length}\n`);

  // ── Step 2: Posts, comments, reactions ──
  console.log("● Step 2/5: Creating posts, comments, reactions...");

  const posts = [];
  for (let i = 0; i < CONFIG.totalPosts; i++) {
    const authorId = userIds[i % userIds.length];
    const content = POST_CONTENT[i % POST_CONTENT.length];
    posts.push({
      id: stableUuid(CONFIG.seedNamespace, `post:${i}`),
      author_id: authorId,
      type: pick(["community","community","community","news","event"]),
      title: content.length > 60 ? content.slice(0,57)+"..." : content,
      content,
      language: pick(LANGUAGES),
      status: "published",
      created_at: new Date(Date.now()-ri(0,30)*864e5).toISOString(),
    });
  }
  for (const p of posts) await supabase.from("posts").upsert(p, { onConflict: "id" });
  console.log(`  ${posts.length} posts`);

  // Comments
  let ci = 0;
  const comments = [];
  for (const post of posts) {
    for (let c = 0; c < ri(0,4); c++) {
      comments.push({
        id: stableUuid(CONFIG.seedNamespace, `comment:${ci++}`),
        post_id: post.id,
        author_id: pick(userIds),
        content: pick(COMMENT_TEXTS),
        status: "published",
      });
    }
  }
  for (const c of comments) await supabase.from("comments").upsert(c, { onConflict: "id" });
  console.log(`  ${comments.length} comments`);

  // Reactions
  let ri2 = 0;
  const reactions = [];
  const seenR = new Set();
  for (const post of posts) {
    for (let r = 0; r < ri(0,8); r++) {
      const uid = pick(userIds);
      const k = `${post.id}:${uid}`;
      if (seenR.has(k)) continue;
      seenR.add(k);
      reactions.push({
        id: stableUuid(CONFIG.seedNamespace, `reaction:${ri2++}`),
        post_id: post.id,
        user_id: uid,
        reaction_type: pick(REACTION_TYPES),
      });
    }
  }
  for (const r of reactions) {
    await supabase.from("post_reactions").upsert(r, { onConflict: undefined });
  }
  console.log(`  ${reactions.length} reactions\n`);

  // ── Step 3: Memories ──
  console.log("● Step 3/5: Creating memories...");
  const memories = [];
  for (let i = 0; i < CONFIG.totalMemories; i++) {
    const yr = ri(1960,2010);
    memories.push({
      id: stableUuid(CONFIG.seedNamespace, `memory:${i}`),
      contributor_id: userIds[i % userIds.length],
      title: (MEMORY_CONTENT[i % MEMORY_CONTENT.length]).length > 60
        ? (MEMORY_CONTENT[i % MEMORY_CONTENT.length]).slice(0,57)+"..."
        : MEMORY_CONTENT[i % MEMORY_CONTENT.length],
      description: MEMORY_CONTENT[i % MEMORY_CONTENT.length],
      year: yr,
      decade: `${Math.floor(yr/10)*10}s`,
      location: pick(AREAS),
      verification_status: "approved",
      media_type: "image",
    });
  }
  for (const m of memories) await supabase.from("memories").upsert(m, { onConflict: "id" });
  console.log(`  ${memories.length} memories\n`);

  // ── Step 4: Ideas with votes, supporters ──
  console.log("● Step 4/5: Creating ideas...");
  const ideas = [];
  for (let i = 0; i < CONFIG.totalIdeas; i++) {
    ideas.push({
      id: stableUuid(CONFIG.seedNamespace, `idea:${i}`),
      author_id: userIds[i % userIds.length],
      title: (IDEA_CONTENT[i % IDEA_CONTENT.length]).length > 60
        ? (IDEA_CONTENT[i % IDEA_CONTENT.length]).slice(0,57)+"..."
        : IDEA_CONTENT[i % IDEA_CONTENT.length],
      description: IDEA_CONTENT[i % IDEA_CONTENT.length],
      status: pick(["published","interested","discussion","in_progress","completed"]),
    });
  }
  for (const idea of ideas) await supabase.from("ideas").upsert(idea, { onConflict: "id" });
  console.log(`  ${ideas.length} ideas`);

  // Votes
  let vi = 0;
  const votes = [];
  const seenV = new Set();
  for (const idea of ideas) {
    for (let v = 0; v < ri(0,8); v++) {
      const u = pick(userIds);
      const k = `${idea.id}:${u}`;
      if (seenV.has(k)) continue;
      seenV.add(k);
      votes.push({ id: stableUuid(CONFIG.seedNamespace, `vote:${vi++}`), idea_id: idea.id, user_id: u });
    }
  }
  for (const v of votes) await supabase.from("idea_votes").upsert(v, { onConflict: undefined });
  console.log(`  ${votes.length} votes`);

  // Supporters
  let si = 0;
  const supporters = [];
  const seenSup = new Set();
  for (const idea of ideas) {
    for (let s = 0; s < ri(0,6); s++) {
      const u = pick(userIds);
      const k = `${idea.id}:${u}`;
      if (seenSup.has(k)) continue;
      seenSup.add(k);
      supporters.push({ id: stableUuid(CONFIG.seedNamespace, `supp:${si++}`), idea_id: idea.id, user_id: u });
    }
  }
  for (const s of supporters) await supabase.from("idea_supporters").upsert(s, { onConflict: undefined });
  console.log(`  ${supporters.length} supporters\n`);

  // ── Step 5: Graatek items + requests + follows + notifications ──
  console.log("● Step 5/5: Creating Graatek, follows, notifications...");

  // Graatek items
  const fadlaItems = [];
  for (let i = 0; i < CONFIG.totalFadla; i++) {
    const item = FADLA_ITEMS[i % FADLA_ITEMS.length];
    fadlaItems.push({
      id: stableUuid(CONFIG.seedNamespace, `fadla:${i}`),
      owner_id: userIds[i % userIds.length],
      title: item.title,
      description: `${item.title} en bon état. À donner à ${pick(AREAS)}.`,
      category: item.cat,
      condition: pick(["Comme neuf","Bon état","État correct","Usé mais fonctionnel"]),
      location: pick(AREAS),
      quantity: 1,
      urgency_level: pick(["no_urgency","no_urgency","this_week","urgent"]),
      status: pick(["published","requested","reserved","collected","completed"]),
      images: "[]",
    });
  }
  for (const f of fadlaItems) await supabase.from("community_shares").upsert(f, { onConflict: "id" });
  console.log(`  ${fadlaItems.length} Graatek items`);

  // Share requests
  let reqi = 0;
  const requests = [];
  const seenReq = new Set();
  for (const item of fadlaItems) {
    if (Math.random() > 0.6) continue;
    for (let r = 0; r < ri(1,3); r++) {
      const requester = pick(userIds);
      if (requester === item.owner_id) continue;
      const k = `${item.id}:${requester}`;
      if (seenReq.has(k)) continue;
      seenReq.add(k);
      requests.push({
        id: stableUuid(CONFIG.seedNamespace, `req:${reqi++}`),
        share_id: item.id,
        requester_id: requester,
        message: pick(["Je peux passer le prendre aujourd'hui.","Est-ce disponible ?","Je suis intéressé.","Je peux venir ce weekend."]),
        status: pick(["pending","pending","accepted","declined"]),
      });
    }
  }
  for (const r of requests) await supabase.from("community_share_requests").upsert(r, { onConflict: "id" });
  console.log(`  ${requests.length} requests`);

  // Follows
  let fi = 0;
  const follows = [];
  const seenF = new Set();
  for (const fid of userIds) {
    const targets = pickN(userIds.filter(uid2 => uid2 !== fid), ri(2,10));
    for (const target of targets) {
      const k = `${fid}:${target}`;
      if (seenF.has(k)) continue;
      seenF.add(k);
      follows.push({
        id: stableUuid(CONFIG.seedNamespace, `follow:${fi++}`),
        follower_id: fid,
        following_id: target,
      });
    }
  }
  for (const f of follows) {
    await supabase.from("user_follows").upsert(f, { onConflict: undefined });
  }
  console.log(`  ${follows.length} follows`);

  // Notifications
  let ni = 0;
  const notifs = [];
  const entities = [...posts, ...memories, ...ideas, ...fadlaItems];
  for (let i = 0; i < CONFIG.totalNotifications; i++) {
    const [ntype, etype] = pick(NOTIF_TYPES);
    const actor = pick(userIds);
    let recipient = pick(userIds);
    while (recipient === actor) recipient = pick(userIds);
    const entity = pick(entities);
    notifs.push({
      id: stableUuid(CONFIG.seedNamespace, `notif:${ni++}`),
      user_id: recipient,
      actor_id: actor,
      type: ntype,
      entity_type: etype,
      entity_id: entity?.id || stableUuid(CONFIG.seedNamespace, `notif_e:${i}`),
      title: `Nouveau: ${ntype}`,
      message: pick(COMMENT_TEXTS),
      read: Math.random() < 0.4,
      created_at: new Date(Date.now()-ri(0,30)*864e5).toISOString(),
    });
  }
  for (const n of notifs) await supabase.from("notifications").upsert(n, { onConflict: "id" });
  console.log(`  ${notifs.length} notifications\n`);

  // ── Summary ──
  console.log(`=== Done! ===`);
  console.log(`Users: ${userIds.length}`);
  console.log(`Posts: ${posts.length} | Comments: ${comments.length} | Reactions: ${reactions.length}`);
  console.log(`Memories: ${memories.length}`);
  console.log(`Ideas: ${ideas.length} | Votes: ${votes.length} | Supporters: ${supporters.length}`);
  console.log(`Graatek: ${fadlaItems.length} | Requests: ${requests.length}`);
  console.log(`Follows: ${follows.length} | Notifications: ${notifs.length}`);
  console.log(`\nLogin: any test.user000@indb-test.example.com ... test.user049@indb-test.example.com`);
  console.log(`Password: ${CONFIG.testPassword}`);
  console.log(`\nCleanup: node scripts/cleanup-test-data.mjs`);
}

function requireEnv(n) {
  const v = process.env[n];
  if (!v) { console.error(`Missing ${n}`); process.exit(1); }
  return v;
}

main().catch(e => { console.error("FAILED:", e); process.exit(1); });
