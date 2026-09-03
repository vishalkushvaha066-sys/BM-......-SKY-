const SOURCES=[
  "https://raw.githubusercontent.com/starexxx/FFItems/74c2af66d691776c2452bd72ca0388ba52d7c5fb/assets/itemData.json",
  "https://raw.githubusercontent.com/iamaanahmad/FreeFireItems/main/data/ItemData.json"
];
const ICON_BASE="https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/";
const $=id=>document.getElementById(id);
let items=[],filtered=[],category="all",shown=48;
const text=v=>v==null?"":String(v).trim();
function normalize(x){
  if(Array.isArray(x)) return x;
  if(!x||typeof x!=="object") return [];
  if(Array.isArray(x.results)) return x.results;
  if(Array.isArray(x.items)) return x.items;
  if(Array.isArray(x.data)) return x.data;
  return Object.values(x).filter(v=>v&&typeof v==="object"&&!Array.isArray(v));
}
function getId(i){return text(i.itemID||i.itemId||i.itemID2||i["2"])}
function getIcon(i){return text(i.icon||i.iconName||i.IconName||i.iconID||i.iconId||i["1"])}
function getName(i){return text(i.name||i.description||i["3"]||"Unknown Item")}
function getType(i){return text(i.type||i.itemType||i.collectionType||i["6"])}
function getCollection(i){return text(i.collectionType||i.collection||i.collection_type||"")}
function isSkill(i){return /character skill|skill ability|ability icon/i.test(text(i.type)+" "+text(i.itemType)+" "+getName(i)+" "+text(i.description))}

// These items must NEVER enter the three allowed categories.
function isExcluded(i){
  const hay=[getName(i),getType(i),getCollection(i),getIcon(i),text(i.description),text(i.description2)].join(" ").toLowerCase();
  return /optional[_ -]?bundle|emote\s*(crate|box)|loot\s*(box|crate)|lootbox|lootcrate|choice\s*crate|\bcrate\b|\bbox\b|\bbackpack\b|\bbackpack\s*skin\b|\brucksack\b|bag\s*skin|\bbag\b|gamebag|vehicle\s*skin|\bvehicle\b|sports\s*car|roadster|monster\s*truck|jeep|motorcycle|motorbike|scooter|car\s*skin|truck\s*skin|boat\s*skin|aircraft\s*skin|skyboard|skywings|parachute/.test(hay);
}

function validRecord(i){
  const id=getId(i), icon=getIcon(i);
  return /^\d{6,12}$/.test(id) && /^Icon_/i.test(icon) && !isSkill(i) && !isExcluded(i);
}

function catOf(i){
  if(!validRecord(i)) return "other";
  const t=(getType(i)+" "+getCollection(i)).toLowerCase().replace(/[_-]/g," ");
  const icon=getIcon(i).toLowerCase();

  // Keep the existing emote classification behavior, but never allow emote crates/boxes.
  if(/\bemote\b|super emote|arrival animation|final shots/.test(t) || /^icon_emote_/i.test(icon)) return "emote";

  // Real weapon skins only. Do not include weapon crates, fist/grenade/gloo/other gear.
  if(/\bweapon\s*skins?\b/.test(t) || /collectiontype\s*weapon\s*skin/.test(t)) return "weapon";

  // Outfit bundles only. Optional/choice crates have already been excluded above.
  if(/\bbundle\b/.test(t) && !/optional|choice|crate|loot|box|vehicle|weapon|emote|bag|backpack/.test(t)){
    // A bundle must represent a player-wearable outfit, not a crate/container.
    const outfitHints=(getName(i)+" "+text(i.description)+" "+getIcon(i)).toLowerCase();
    if(/outfit|costume|set|fashion|bundle/.test(outfitHints)) return "bundle";
  }

  return "other";
}

function unique(list){
  const m=new Map();
  for(const i of list){
    if(!validRecord(i)) continue;
    const cat=catOf(i);
    if(cat==="other") continue;
    const id=getId(i);
    if(!m.has(id)) m.set(id,i);
  }
  return [...m.values()];
}

async function getJson(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function load(){
  for(const url of SOURCES){
    try{
      const data=unique(normalize(await getJson(url)));
      if(data.length){items=data;break}
    }catch(e){}
  }
  if(!items.length){
    $("status").textContent="Data could not be loaded. Refresh and check internet.";
    $("grid").innerHTML='<div class="empty">Item data unavailable.</div>';
    return;
  }
  apply();
}
function apply(){
  const q=text($("search").value).toLowerCase();
  const exactEmote=/^emotes?$/.test(q);
  filtered=items.filter(i=>{
    const cat=catOf(i);
    if(exactEmote)return cat==="emote";
    if(category!=="all"&&cat!==category)return false;
    if(!q)return true;
    const hay=[getName(i),getId(i),getIcon(i),getType(i),getCollection(i),text(i.description),text(i.description2)].join(" ").toLowerCase();
    return hay.includes(q);
  });
  shown=48;render();
}
function imageUrl(i){return ICON_BASE+encodeURIComponent(getId(i))+".png"}
function card(i){
  const el=document.createElement("article");el.className="card";
  const id=getId(i),icon=getIcon(i),name=getName(i);
  el.innerHTML=`<div class="pic"><img loading="lazy" alt=""><span class="fallback" style="display:none">🔥</span></div><div class="info"><div class="name"></div><div class="type"></div><div class="idrow"><b>ITEM ID:</b> <span class="itemid"></span></div><div class="idrow"><b>ICON ID:</b> <span class="iconid"></span></div><div class="actions"><button class="copyItem" type="button">COPY ITEM ID</button><button class="copyIcon" type="button">COPY ICON ID</button><button class="both" type="button">COPY BOTH • CRAFTLAND</button></div></div>`;
  el.querySelector(".name").textContent=name;el.querySelector(".type").textContent=getType(i)||catOf(i);el.querySelector(".itemid").textContent=id;el.querySelector(".iconid").textContent=icon;
  const image=el.querySelector("img"),fallback=el.querySelector(".fallback");
  image.src=imageUrl(i);
  image.onerror=()=>{image.removeAttribute("src");image.style.display="none";fallback.style.display="inline"};
  el.querySelector(".pic").onclick=()=>openModal(i);
  el.querySelector(".copyItem").onclick=()=>copyText(id,"ITEM ID COPIED");el.querySelector(".copyIcon").onclick=()=>copyText(icon,"ICON ID COPIED");el.querySelector(".both").onclick=()=>copyText(`Item ID: ${id}\nIcon ID: ${icon}`,"BOTH COPIED");
  return el;
}
function render(){
  const list=filtered.slice(0,shown);$("grid").innerHTML="";
  if(!list.length)$("grid").innerHTML='<div class="empty">No matching verified items found.</div>';
  else{const f=document.createDocumentFragment();list.forEach(i=>f.appendChild(card(i)));$("grid").appendChild(f)}
  $("status").textContent=`${filtered.length.toLocaleString()} verified records • ${Math.min(shown,filtered.length)} shown`;
  $("loadMore").style.display=shown<filtered.length?"block":"none";
}
function openModal(i){
  $("detailName").textContent=getName(i);$("detailType").textContent=getType(i)||catOf(i);$("detailId").textContent=getId(i);$("detailIcon").textContent=getIcon(i);
  const img=$("detailImg"),fb=$("detailFallback");img.style.display="block";fb.style.display="none";img.src=imageUrl(i);img.onerror=()=>{img.style.display="none";fb.style.display="inline"};
  $("modal").classList.add("open");$("modal").setAttribute("aria-hidden","false");
  $("copyItem").onclick=()=>copyText(getId(i),"ITEM ID COPIED");$("copyIcon").onclick=()=>copyText(getIcon(i),"ICON ID COPIED");$("copyBoth").onclick=()=>copyText(`Item ID: ${getId(i)}\nIcon ID: ${getIcon(i)}`,"BOTH COPIED");
}
function closeModal(){$("modal").classList.remove("open");$("modal").setAttribute("aria-hidden","true")}
async function copyText(v,msg){try{await navigator.clipboard.writeText(v)}catch(e){const t=document.createElement("textarea");t.value=v;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove()}const old=$("status").textContent;$("status").textContent=msg;setTimeout(()=>$("status").textContent=old,900)}
$("search").addEventListener("input",apply);$("clearSearch").onclick=()=>{$("search").value="";apply()};$("cats").addEventListener("click",e=>{const b=e.target.closest("button[data-cat]");if(!b)return;document.querySelectorAll("#cats button").forEach(x=>x.classList.remove("active"));b.classList.add("active");category=b.dataset.cat;apply()});$("loadMore").onclick=()=>{shown+=48;render()};
$("modalX").onclick=closeModal;$("modalClose").onclick=closeModal;$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
load();
