#!/usr/bin/env node
import{createHash}from"crypto";import{createClient}from"@supabase/supabase-js";
const NS="indb-visual-test-v1";var H=createHash;
function uid(s){var h=H("md5").update(NS+":"+s).digest("hex"),v=8+(parseInt(h[16],16)&3);return h.slice(0,8)+"-"+h.slice(8,12)+"-4"+h.slice(13,16)+"-"+v.toString().padStart(2,"0")+h.slice(17,19)+"-"+h.slice(19,31)}
function p(a){return a[Math.random()*a.length|0]}function pn(a,n){var d=new Set;while(d.size<n&&d.size<a.length)d.add(p(a));return[...d]}function r(a,b){return(Math.random()*(b-a+1)+a)|0}
const A=["Cansado","Numerowatt","Dubai","Tcharka","Robinet 10","Port Artisanal","Boulenoir","Centre Ville","Socogim","Tarhil","PK 55","Baghdad","Basra","Madrid","La Batterie"];
const PO=["تنظيف شاطئ نواذيبو صباح اليوم.","دورة تدريبية في الخياطة للنساء.","اجتماع لجنة الحي في كانسادو.","المكتبة البلدية استقبلت كتباً جديدة.","بطولة كرة القدم بين الأحياء.","حملة التطعيم للأطفال في مستشفى نواذيبو.","معرض الحرف التقليدية في ميناء الصيد.","ورشة توعية بيئية للشباب.","مبادرة غرس الأشجار على طول الشارع الرئيسي.","فرقة الموسيقى التقليدية تتدرب كل ثلاثاء.","جلسة قراءة للأطفال في المكتبة المركزية.","دورة معلوماتية للكبار في فضاء تشاركا.","توزيع القرطاسية على المدارس.","محاضرة عن تاريخ نواذيبو.","مسابقة سباحة للشباب.","ورشة مسرح للمراهقين.","جمع الملابس للعائلات المحتاجة.","إصلاح أعمدة الإنارة في حي البصرة.","سوق الكتاب المستعمل هذا الأحد.","يوم مفتوح في المكتبة الرقمية الجديدة."];
const ME=["أتذكر سوق السمك القديم عندما كنت طفلاً.","بناء المسجد الكبير في 1985.","كان والدي يعمل في الميناء.","مباريات كرة القدم على شاطئ البطارية.","محطة القطار القديمة.","ليالي الصيف في كانسادو.","جدتي كانت تحكي قصصاً.","أول سينما في نواذيبو.","عيد الاستقلال في 1990.","مدرسة نوميروات الابتدائية.","الأفراح التقليدية.","المنارة القديمة.","أول مرة رأيت فيها البحر.","عمي الصياد.","دروس العربية في مسجد الحي.","سوق كانسادو الأسبوعي.","رحلات الصيد مع الأصدقاء.","المكتبة البلدية.","كرنفال نواذيبو.","يوم وصول الكهرباء إلى حينا."];
const ID=["إنشاء مساحة خضراء عامة.","تنظيم سوق للمنتجات المحلية.","نظام للمشاركة في السيارات.","تطبيق للإبلاغ عن أعطال الإنارة.","برنامج إرشاد للشباب المقاولين.","بناء مسبح بلدي.","ألواح شمسية على المباني العامة.","مهرجان سنوي للثقافات.","ورش تكوين في المهن الرقمية.","جولات سياحية في نواذيبو.","شبكة مكتبات حية.","حملة تدوير النفايات.","نوافير ماء صالحة للشرب.","فضاء عمل مشترك.","دروس محو الأمية للكبار.","نقل مدرسي للتلاميذ.","حديقة مشتركة لكل حي.","برنامج تبادل ثقافي.","مسابقات رياضية بين الأحياء.","ملاعب رياضية اصطناعية."];
const FD=[{t:"دراجة أطفال",c:"other"},{t:"مجموعة كتب",c:"books"},{t:"طاولة خشبية",c:"furniture"},{t:"ملابس شتوية للأطفال",c:"clothes"},{t:"محفظة وقرطاسية مدرسية",c:"school_supplies"},{t:"أرز ومعكرونة",c:"food"},{t:"سرير فردي مع فراش",c:"furniture"},{t:"ألعاب ودمى",c:"other"},{t:"كرسي مكتب",c:"furniture"},{t:"معاطف وجواكت",c:"clothes"},{t:"كتب مدرسية",c:"books"},{t:"مصباح مكتب",c:"school_supplies"},{t:"عربة أطفال",c:"other"},{t:"قواميس فرنسي-عربي",c:"books"},{t:"طقم أطباق",c:"other"},{t:"قمصان وبناطيل رجالي",c:"clothes"},{t:"كتاب طبخ",c:"books"},{t:"رف كتب خشبي",c:"furniture"},{t:"كيس نوم",c:"other"},{t:"كرات قدم",c:"other"},{t:"سبورة للأطفال",c:"school_supplies"},{t:"مدفأة كهربائية",c:"other"},{t:"فستان تقليدي",c:"clothes"},{t:"موسوعة",c:"books"},{t:"مكتب كمبيوتر",c:"furniture"},{t:"حليب بودرة",c:"food"},{t:"سجادة صلاة",c:"other"},{t:"أحذية أطفال",c:"clothes"},{t:"دفاتر وأقلام",c:"school_supplies"},{t:"موقد غاز",c:"other"}];
const GM=["السلام عليكم، هل لا يزال متوفراً؟","مرحباً، أنا مهتم.","يمكنني المرور اليوم.","بارك الله فيك.","متى يمكنني الحضور؟","شكراً جزيلاً.","هل يمكنك الاحتفاظ به لي؟","Bonjour, c'est disponible ?","Merci beaucoup !","جزاك الله خيراً."];
const IM=["فكرة ممتازة! أنا مستعد.","متى نبدأ؟","لدي خبرة.","Je peux aider.","كم شخصاً نحتاج؟","أقترح اجتماعاً.","هذا ما تحتاجه المدينة.","Très bonne idée !","يمكنني توفير المواد.","أنا معك."];
const CM=["مبادرة رائعة!","بارك الله فيكم.","شكراً لمشاركتكم.","أنا معكم.","خبر رائع.","عمل ممتاز!","Très bien !","موفقون بإذن الله.","أتمنى نجاح هذا المشروع.","الله يبارك فيكم."];
const NT=[["comment","post"],["reaction","post"],["follow","profile"],["fadla_request","community_share"],["fadla_request_accepted","community_share"],["fadla_request_declined","community_share"],["fadla_message","community_share"],["idea_support","idea"],["idea_participate_request","idea"],["idea_participant_accepted","idea"],["idea_message","idea"],["idea_comment","idea"],["memory_comment","memory"]];
const NL=["علق على منشورك","تفاعل مع منشورك","بدأ متابعتك","طلب شيئاً في Gar3tak","قبل طلبك","رفض طلبك","أرسل رسالة","دعم فكرتك","يريد المشاركة","قبل مشاركتك","أرسل رسالة","علق على فكرتك","علق على ذكرى لك"];

async function main(){
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
console.log("\n=== Seed v4 (fixed UUID) ===\n");

const{data:ad}=await sb.auth.admin.listUsers();const uids=[];
for(let i=0;i<50;i++){const e=`22246${String(i).padStart(6,'0')}@phone.indb.local`;const u=ad.users.find(x=>x.email===e);uids.push(u?u.id:`f${i}`);}
console.log("  "+uids.length+" users\n");

async function up(t,r){let ok=0;for(const x of r){try{const{error}=await sb.from(t).upsert(x,{onConflict:"id"});if(!error)ok++}catch(e){}}
return ok}

let c={po:0,co:0,re:0,me:0,id:0,su:0,vo:0,pa:0,im:0,ic:0,fd:0,rq:0,fm:0,fo:0,no:0};

// POSTS
const posts=[];for(let i=0;i<50;i++){const x=PO[i%PO.length];posts.push({id:uid("p:"+i),author_id:uids[i%uids.length],type:p(["community","community","news","event"]),title:x,content:x+" تفاصيل إضافية عن المبادرة في "+p(A)+".",language:p(["ar","ar","ar","fr"]),status:"published",created_at:new Date(Date.now()-r(0,30)*864e5).toISOString()})}
c.po=await up("posts",posts);
const cmts=[];for(let i=0;i<50;i++){const pid=uid("p:"+i);for(let j=0;j<r(0,5);j++)cmts.push({id:uid("c:"+i+"_"+j),post_id:pid,author_id:p(uids),content:p(CM),status:"published"})}
c.co=await up("comments",cmts);console.log("  posts: "+c.po+", comments: "+c.co);

// MEMORIES
for(let i=0;i<50;i++){const yr=r(1960,2015);const x=ME[i%ME.length];try{await sb.from("memories").upsert({id:uid("m:"+i),contributor_id:uids[i%uids.length],title:x,description:x+ " ("+yr+")",year:yr,decade:Math.floor(yr/10)*10+"s",location:p(A),verification_status:"approved",media_type:"image"},{onConflict:"id"});c.me++}catch(e){}}
console.log("  memories: "+c.me);

// IDEAS
for(let i=0;i<50;i++){const iid=uid("i:"+i);const x=ID[i%ID.length];try{await sb.from("ideas").upsert({id:iid,author_id:uids[i%uids.length],title:x,description:x+" مقترح مقدم من أحد أفراد المجتمع.",status:p(["published","interested","discussion","in_progress","completed"])},{onConflict:"id"});c.id++}catch(e){continue}
const ss=new Set();for(let j=0;j<r(1,8);j++){const su=p(uids);const sk=iid+":"+su;if(ss.has(sk))continue;ss.add(sk);try{await sb.from("idea_supporters").upsert({id:uid("s:"+i+"_"+j),idea_id:iid,user_id:su},{onConflict:undefined});c.su++}catch(e){}}
const ps=new Set();for(let j=0;j<r(0,4);j++){const pu=p(uids);const pk=iid+":"+pu;if(ps.has(pk))continue;ps.add(pk);const st=p(["pending","accepted","declined"]);try{await sb.from("idea_participants").upsert({id:uid("pa:"+i+"_"+j),idea_id:iid,user_id:pu,status:st,message:p(["أرغب في المشاركة","لدي خبرة","Je peux aider","أريد المساهمة"])},{onConflict:undefined});c.pa++}catch(e){}if(st==="accepted"){for(let k=0;k<r(1,3);k++){try{await sb.from("idea_messages").upsert({id:uid("im:"+i+"_"+j+"_"+k),idea_id:iid,sender_id:p([uids[i%uids.length],pu]),message:p(IM)},{onConflict:"id"});c.im++}catch(e){}}}}
for(let j=0;j<r(0,5);j++){try{await sb.from("idea_comments").upsert({id:uid("ic:"+i+"_"+j),idea_id:iid,author_id:p(uids),content:p(CM)},{onConflict:"id"});c.ic++}catch(e){}}
const vs=new Set();for(let j=0;j<r(1,10);j++){const vu=p(uids);const vk=iid+":"+vu;if(vs.has(vk))continue;vs.add(vk);try{await sb.from("idea_votes").upsert({id:uid("v:"+i+"_"+j),idea_id:iid,user_id:vu},{onConflict:undefined});c.vo++}catch(e){}}}
console.log("  ideas: "+c.id+" (sup:"+c.su+" vo:"+c.vo+" pa:"+c.pa+" msgs:"+c.im+" cmts:"+c.ic+")");

// GRAATEK
for(let i=0;i<50;i++){const it=FD[i%FD.length];const fid=uid("f:"+i);const oid=uids[i%uids.length];try{const{error}=await sb.from("community_shares").upsert({id:fid,owner_id:oid,title:it.t,description:it.t+" - للتبرع في "+p(A),category:it.c,condition:p(["ممتاز","جيد جدا","جيد"]),location:p(A),quantity:1,urgency_level:p(["no_urgency","this_week","urgent"]),status:p(["published","requested","reserved","collected","completed"]),images:"[]"},{onConflict:"id"});if(!error)c.fd++}catch(e){}
if(Math.random()>0.4){for(let j=0;j<r(1,2);j++){const rq=p(uids.filter(x=>x!==oid));const rs=p(["pending","accepted","declined"]);const rid=uid("r:"+i+"_"+j);try{await sb.from("community_share_requests").upsert({id:rid,share_id:fid,requester_id:rq,message:p(GM),status:rs},{onConflict:"id"});c.rq++}catch(e){}if(rs==="accepted"){for(let k=0;k<r(1,3);k++){try{await sb.from("fadla_request_messages").upsert({id:uid("fm:"+i+"_"+j+"_"+k),share_id:fid,request_id:rid,sender_id:p([oid,rq]),message:p(GM)},{onConflict:"id"});c.fm++}catch(e){}}if(Math.random()>0.5){try{await sb.from("community_shares").update({status:"completed",accepted_request_id:rid,receiver_confirmed_at:new Date().toISOString(),sender_confirmed_at:new Date().toISOString(),completed_at:new Date().toISOString()}).eq("id",fid)}catch(e){}}}}}}
console.log("  graatek: "+c.fd+" (req:"+c.rq+" msgs:"+c.fm+")");

// FOLLOWS
let fc=0;const fs=new Set();for(const id of uids){const tg=pn(uids.filter(x=>x!==id),r(5,20));for(const t of tg){const k=id+":"+t;if(fs.has(k))continue;fs.add(k);try{await sb.from("user_follows").upsert({id:uid("fw:"+(fc++)),follower_id:id,following_id:t},{onConflict:undefined});c.fo++}catch(e){}}}
console.log("  follows: "+c.fo);

// NOTIFICATIONS
const eids=[];for(let i=0;i<50;i++){eids.push(uid("p:"+i));eids.push(uid("i:"+i));eids.push(uid("f:"+i));eids.push(uid("m:"+i))}
for(let i=0;i<500;i++){const ti=r(0,NT.length-1);const[nt,et]=NT[ti];const a=p(uids);let rr=p(uids);while(rr===a)rr=p(uids);try{await sb.from("notifications").upsert({id:uid("n:"+i),user_id:rr,actor_id:a,type:nt,entity_type:et,entity_id:p(eids),title:NL[ti],message:p(CM),read:Math.random()<0.4,created_at:new Date(Date.now()-r(0,30)*864e5).toISOString()},{onConflict:"id"});c.no++}catch(e){}}
console.log("  notifications: "+c.no);

console.log("\n=== Complete: "+Object.values(c).reduce((a,b)=>a+b,0)+" records ===");
console.log("Login: 46000000 / TestPass123!");
}
main().catch(e=>{console.error("FAILED:",e);process.exit(1)});
