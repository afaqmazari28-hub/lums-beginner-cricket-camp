/* LUMS Beginner Camp
   Configure the two values below with your Supabase project details.
   Never put a Supabase service_role key in this file. Only use the anon/publishable key.
*/
const SUPABASE_URL = "https://qglxkwbcvpgshwdfnjxa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_U1wd_QPG0kR4C6TJPupk2g_uYsqSe9L";

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
const state = { members: [], fixtures: [], settings: {}, practice: {}, session: null };
const defaultSettings = {
  hero_title:"LUMS Beginner Camp", hero_subtitle:"CRICKET TEAM",
  hero_description:"Never played before? Perfect. Learn the game, build confidence and have fun together on the pitch.",
  about_text:"A welcoming space for LUMS students to learn cricket, develop skills and enjoy the game together.",
  about_extra:"Our focus is on the basics: batting, bowling, fielding and teamwork. Beginners are welcome, and everyone gets a chance to learn and play.",
  background_url:"", logo_url:"", overlay_color:"#072a63",
about_bg_color:"#f0f5f2",
about_heading_color:"#0b1f3a",
about_text_color:"#526477",
about_card_color:"#ffffff",
about_card_heading_color:"#0b1f3a",
about_accent_color:"#168447"
};
const defaultPractice = {days:"Monday, Wednesday, Friday",time:"5:00 PM – 6:30 PM",venue:"LUMS Cricket Ground",bring:"Sports shoes, water, positive attitude",equipment:"Equipment provided for beginners",frequency:3};

function message(id,text,error=false){const el=$(id);if(!el)return;el.textContent=text;el.classList.toggle("error",error)}
function initials(name=""){return name.trim().split(/\s+/).map(x=>x[0]||"").join("").slice(0,2).toUpperCase()||"?"}
function safeText(value){return String(value??"")}
function escapeHtml(s){return safeText(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function setBusy(button,busy,label){if(!button)return;if(busy){button.dataset.oldText=button.textContent;button.disabled=true;button.textContent=label||"Please wait…"}else{button.disabled=false;button.textContent=button.dataset.oldText||button.textContent}}
function requireDb(){if(!db){alert("Connect Supabase first. Follow SETUP.md and add your project URL and anon key in app.js.");return false}return true}

async function loadPublicData(){
  if(!requireDb())return;
  const [members,fixtures,settings,practice]=await Promise.all([
    db.from("members").select("id,name,role,photo_url,created_at").order("created_at",{ascending:true}),
    db.from("fixtures").select("*").order("match_date",{ascending:true}),
    db.from("site_settings").select("value").eq("key","main").maybeSingle(),
    db.from("site_settings").select("value").eq("key","practice").maybeSingle()
  ]);
  for(const r of [members,fixtures,settings,practice])if(r.error)console.error(r.error);
  state.members=members.data||[];state.fixtures=fixtures.data||[];
  state.settings={...defaultSettings,...(settings.data?.value||{})};
  state.practice={...defaultPractice,...(practice.data?.value||{})};
  renderSite();renderFixtures();renderSquad();
}
function renderSite(){
  const s=state.settings,p=state.practice;
  $("heroTitle").textContent=s.hero_title;$("heroSubtitle").textContent=s.hero_subtitle;
  $("heroDescription").textContent=s.hero_description;$("aboutText").textContent=s.about_text;$("aboutExtra").textContent=s.about_extra;
  $("practiceDetails").innerHTML=[
    ["Days",p.days],["Time",p.time],["Venue",p.venue],["Bring",p.bring],["Equipment",p.equipment]
  ].map(([k,v])=>`<li><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</li>`).join("");
  $("practiceCount").textContent=p.frequency??3;
  $("memberCount").textContent=state.members.length;
  $("matchCount").textContent=state.fixtures.length;
  if(s.background_url)document.documentElement.style.setProperty("--hero-image",`url("${s.background_url}")`);
  else document.documentElement.style.setProperty("--hero-image","none");
  document.documentElement.style.setProperty("--hero-overlay",s.overlay_color||"#072a63");
  document.documentElement.style.setProperty("--about-bg",s.about_bg_color||"#f0f5f2");
document.documentElement.style.setProperty("--about-heading",s.about_heading_color||"#0b1f3a");
document.documentElement.style.setProperty("--about-text",s.about_text_color||"#526477");
document.documentElement.style.setProperty("--about-card",s.about_card_color||"#ffffff");
document.documentElement.style.setProperty("--about-card-heading",s.about_card_heading_color||"#0b1f3a");
document.documentElement.style.setProperty("--about-accent",s.about_accent_color||"#168447");
  if(s.logo_url){$("brandLogo").src=s.logo_url;$("heroLogo").src=s.logo_url}
  document.title=s.hero_title||"LUMS Beginner Cricket Camp";
}
function renderFixtures(){
  const root=$("fixtureList");
  if(!state.fixtures.length){root.innerHTML='<p class="muted">No fixtures have been added yet.</p>';return}
  root.innerHTML=state.fixtures.map(f=>{
    const d=new Date(`${f.match_date}T00:00:00`);
    const day=d.toLocaleDateString("en",{day:"2-digit"}),mon=d.toLocaleDateString("en",{month:"short"}).toUpperCase();
    const cls=f.status==="Completed"?"completed":(["Cancelled","Postponed"].includes(f.status)?f.status.toLowerCase():"");
    return `<article class="fixture-card"><div class="fixture-date"><strong>${day}</strong>${mon}</div><div><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml([f.venue,f.match_time,f.result].filter(Boolean).join(" · "))}</p></div><span class="status ${cls}">${escapeHtml(f.status)}</span></article>`
  }).join("");
}
function renderSquad(){
  $("squadGrid").innerHTML=state.members.length?state.members.map(m=>`<article class="player-card">
    ${m.photo_url?`<img class="player-photo" src="${escapeHtml(m.photo_url)}" alt="${escapeHtml(m.name)}">`:`<div class="player-photo">${escapeHtml(initials(m.name))}</div>`}
    <h3>${escapeHtml(m.name)}</h3><span class="role-pill">${escapeHtml(m.role||"Camp member")}</span></article>`).join(""):'<p class="muted">No squad members yet. Be the first to register.</p>';
}
async function uploadImage(file,bucket,folder){
  if(!file)return null;
  if(!file.type.startsWith("image/"))throw new Error("Please choose an image file.");
  if(file.size>5*1024*1024)throw new Error("Image must be 5 MB or smaller.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=`${folder}/${crypto.randomUUID()}.${ext}`;
  const {error}=await db.storage.from(bucket).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
  if(error)throw error;
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

$("joinForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireDb())return;
  const button=e.submitter;setBusy(button,true,"Submitting…");message("joinMessage","");
  try{
    const name=$("fullName").value.trim(),lums_id=$("lumsId").value.trim(),email=$("email").value.trim(),role=$("role").value,file=$("memberPhoto").files[0];
    if(name.length<2)throw new Error("Please enter your full name.");
    if(!lums_id)throw new Error("Please enter your LUMS ID.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Please enter a valid email.");
    const photo_url=file?await uploadImage(file,"member-photos","members"):"";
    const {error:registrationError}=await db.rpc("register_camp_member",{
      p_name:name,p_role:role,p_photo_url:photo_url,p_lums_id:lums_id,p_email:email
    });
    if(registrationError)throw registrationError;
    e.target.reset();message("joinMessage","Thank you! Your registration has been received.");
    await loadPublicData();
  }catch(err){message("joinMessage",err.message||"Registration could not be submitted.",true)}
  finally{setBusy(button,false)}
});

$("menuBtn").onclick=()=>$("navLinks").classList.toggle("open");
$("navLinks").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("navLinks").classList.remove("open")));
$("year").textContent=new Date().getFullYear();

const adminDialog=$("adminDialog"),memberEditDialog=$("memberEditDialog");
$("openAdmin").onclick=()=>{adminDialog.showModal();refreshAuthUI()};
$("closeAdmin").onclick=()=>adminDialog.close();
$("closeMemberEdit").onclick=()=>memberEditDialog.close();
$("adminLoginForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireDb())return;const btn=e.submitter;setBusy(btn,true,"Signing in…");
  const {data,error}=await db.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});
  if(error)message("loginMessage",error.message,true);
  else{state.session=data.session;message("loginMessage","");await refreshAuthUI()}
  setBusy(btn,false);
});
async function refreshAuthUI(){
  if(!db)return;
  const {data}=await db.auth.getSession();state.session=data.session;
  const signed=!!state.session;
  $("adminLoginPanel").hidden=signed;$("adminPanel").hidden=!signed;
  if(signed){$("adminIdentity").textContent=state.session.user.email;await loadAdminData()}
}
$("logoutBtn").onclick=async()=>{await db.auth.signOut();state.session=null;refreshAuthUI()};
db?.auth.onAuthStateChange((_event,session)=>{state.session=session;refreshAuthUI()});

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));
  document.querySelectorAll(".tab-panel").forEach(x=>x.hidden=x.id!==btn.dataset.tab);
});
async function loadAdminData(){
  const {data:admin,error:adminErr}=await db.from("admin_users").select("user_id").eq("user_id",state.session.user.id).maybeSingle();
  if(adminErr||!admin){await db.auth.signOut();message("loginMessage","This account is not authorised as an administrator.",true);return}
  await loadPublicData();populateAdminForms();renderAdminLists();
}
function populateAdminForms(){
  const s=state.settings,p=state.practice;
  $("settingHeroTitle").value=s.hero_title;$("settingHeroSubtitle").value=s.hero_subtitle;$("settingHeroDescription").value=s.hero_description;
  $("settingAboutText").value=s.about_text;$("settingAboutExtra").value=s.about_extra;$("overlayColor").value=s.overlay_color||"#072a63";
  $("aboutBgColor").value=s.about_bg_color||"#f0f5f2";
$("aboutHeadingColor").value=s.about_heading_color||"#0b1f3a";
$("aboutTextColor").value=s.about_text_color||"#526477";
$("aboutCardColor").value=s.about_card_color||"#ffffff";
$("aboutCardHeadingColor").value=s.about_card_heading_color||"#0b1f3a";
$("aboutAccentColor").value=s.about_accent_color||"#168447";
  $("practiceDays").value=p.days;$("practiceTime").value=p.time;$("practiceVenue").value=p.venue;$("practiceBring").value=p.bring;
  $("practiceEquipment").value=p.equipment;$("practiceFrequency").value=p.frequency;
}
function renderAdminLists(){
  $("adminFixtureList").innerHTML=state.fixtures.map(f=>`<div class="admin-row"><div><b>${escapeHtml(f.title)}</b><small>${escapeHtml(f.match_date)} · ${escapeHtml(f.status)}</small></div><div class="admin-row-actions"><button data-edit-fixture="${f.id}">Edit</button><button class="danger" data-delete-fixture="${f.id}">Delete</button></div></div>`).join("")||'<p class="muted">No fixtures yet.</p>';
  $("adminSquadList").innerHTML=state.members.map(m=>`<div class="admin-row"><div class="admin-row-main">${m.photo_url?`<img src="${escapeHtml(m.photo_url)}" alt="">`:`<div class="player-photo">${escapeHtml(initials(m.name))}</div>`}<div><b>${escapeHtml(m.name)}</b><small>${escapeHtml(m.role||"")} · ${escapeHtml(m.id)}</small></div></div><div class="admin-row-actions"><button data-edit-member="${m.id}">Edit</button><button class="danger" data-delete-member="${m.id}">Delete</button></div></div>`).join("")||'<p class="muted">No squad members yet.</p>';
  $("adminFixtureList").querySelectorAll("[data-edit-fixture]").forEach(b=>b.onclick=()=>editFixture(b.dataset.editFixture));
  $("adminFixtureList").querySelectorAll("[data-delete-fixture]").forEach(b=>b.onclick=()=>deleteFixture(b.dataset.deleteFixture));
  $("adminSquadList").querySelectorAll("[data-edit-member]").forEach(b=>b.onclick=()=>editMember(b.dataset.editMember));
  $("adminSquadList").querySelectorAll("[data-delete-member]").forEach(b=>b.onclick=()=>deleteMember(b.dataset.deleteMember));
}
async function saveSetting(key,value){const {error}=await db.from("site_settings").upsert({key,value},{onConflict:"key"});if(error)throw error}
$("siteForm").addEventListener("submit",async e=>{
  e.preventDefault();const btn=e.submitter;setBusy(btn,true,"Saving…");
  try{
    const s={...state.settings,hero_title:$("settingHeroTitle").value.trim(),hero_subtitle:$("settingHeroSubtitle").value.trim(),
      hero_description:$("settingHeroDescription").value.trim(),about_text:$("settingAboutText").value.trim(),
about_extra:$("settingAboutExtra").value.trim(),
overlay_color:$("overlayColor").value,
about_bg_color:$("aboutBgColor").value,
about_heading_color:$("aboutHeadingColor").value,
about_text_color:$("aboutTextColor").value,
about_card_color:$("aboutCardColor").value,
about_card_heading_color:$("aboutCardHeadingColor").value,
about_accent_color:$("aboutAccentColor").value};
    const bg=$("backgroundUpload").files[0],logo=$("logoUpload").files[0];
    if(bg)s.background_url=await uploadImage(bg,"site-assets","backgrounds");
    if(logo)s.logo_url=await uploadImage(logo,"site-assets","logos");
    await saveSetting("main",s);state.settings=s;renderSite();message("siteMessage","Website content and appearance saved.");
  }catch(err){message("siteMessage",err.message,true)}finally{setBusy(btn,false)}
});
$("practiceForm").addEventListener("submit",async e=>{
  e.preventDefault();const btn=e.submitter;setBusy(btn,true,"Saving…");
  try{const p={days:$("practiceDays").value.trim(),time:$("practiceTime").value.trim(),venue:$("practiceVenue").value.trim(),bring:$("practiceBring").value.trim(),equipment:$("practiceEquipment").value.trim(),frequency:Number($("practiceFrequency").value)||0};
    await saveSetting("practice",p);state.practice=p;renderSite();message("practiceMessage","Practice details updated.");
  }catch(err){message("practiceMessage",err.message,true)}finally{setBusy(btn,false)}
});
function clearFixtureForm(){ $("fixtureForm").reset();$("fixtureId").value="";message("fixtureMessage","")}
$("clearFixture").onclick=clearFixtureForm;
function editFixture(id){const f=state.fixtures.find(x=>x.id===id);if(!f)return;$("fixtureId").value=f.id;$("fixtureTitle").value=f.title;$("fixtureDate").value=f.match_date;$("fixtureTime").value=f.match_time||"";$("fixtureVenue").value=f.venue||"";$("fixtureResult").value=f.result||"";$("fixtureStatus").value=f.status}
$("fixtureForm").addEventListener("submit",async e=>{
  e.preventDefault();const btn=e.submitter;setBusy(btn,true,"Saving…");
  try{const row={title:$("fixtureTitle").value.trim(),match_date:$("fixtureDate").value,match_time:$("fixtureTime").value.trim(),venue:$("fixtureVenue").value.trim(),result:$("fixtureResult").value.trim(),status:$("fixtureStatus").value};
    const id=$("fixtureId").value;const res=id?await db.from("fixtures").update(row).eq("id",id):await db.from("fixtures").insert(row);
    if(res.error)throw res.error;clearFixtureForm();await loadPublicData();renderAdminLists();message("fixtureMessage","Fixture saved.");
  }catch(err){message("fixtureMessage",err.message,true)}finally{setBusy(btn,false)}
});
async function deleteFixture(id){if(!confirm("Delete this fixture?"))return;const {error}=await db.from("fixtures").delete().eq("id",id);if(error)alert(error.message);else{await loadPublicData();renderAdminLists()}}
function editMember(id){const m=state.members.find(x=>x.id===id);if(!m)return;$("editMemberId").value=m.id;$("editMemberName").value=m.name;$("editMemberRole").value=m.role||"Beginner / not sure";$("editMemberPhoto").value="";memberEditDialog.showModal()}
$("memberEditForm").addEventListener("submit",async e=>{
  e.preventDefault();const btn=e.submitter;setBusy(btn,true,"Saving…");
  try{const id=$("editMemberId").value,row={name:$("editMemberName").value.trim(),role:$("editMemberRole").value};const f=$("editMemberPhoto").files[0];if(f)row.photo_url=await uploadImage(f,"member-photos","members");
    const {error}=await db.from("members").update(row).eq("id",id);if(error)throw error;memberEditDialog.close();await loadPublicData();renderAdminLists();message("memberEditMessage","Member updated.");
  }catch(err){message("memberEditMessage",err.message,true)}finally{setBusy(btn,false)}
});
async function deleteMember(id){if(!confirm("Delete this squad member and their private registration record?"))return;const {error}=await db.from("members").delete().eq("id",id);if(error)alert(error.message);else{await loadPublicData();renderAdminLists()}}
$("exportCsv").onclick=async()=>{
  const {data,error}=await db.from("member_private").select("lums_id,email,member_id");
  if(error){alert(error.message);return}
  const map=new Map(state.members.map(m=>[m.id,m]));const rows=[["Name","LUMS ID","Email","Role"],...data.map(x=>{const m=map.get(x.member_id)||{};return[m.name||"",x.lums_id,x.email,m.role||""]})];
  const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="lums-beginner-camp-squad.csv";a.click();URL.revokeObjectURL(url);
};

if(configured)loadPublicData().catch(err=>console.error(err));
else console.warn("Supabase is not configured. See SETUP.md.");
