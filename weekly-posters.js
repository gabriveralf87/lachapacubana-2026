(()=>{
'use strict';
const SHEET_ID='1kuIwlCn_TmhdhG2Jv3Icc4I9IESxWwha4PZC-g171dI';
const POSTERS={
 2:{teams:['Estelares','Jaguares'],date:'2026-10-23',venue:'Palma Sola',src:'assets/jornada-2.svg'},
 3:{teams:['Vikings','Sharks'],date:'2026-10-30',venue:'GT Bray',src:'assets/jornada-3.svg'},
 4:{teams:['Brothers','Pitbulls'],date:'2026-11-06',venue:'Babe Ruth 1',src:'assets/jornada-4.svg'},
 5:{teams:['Jaguares','Vikings'],date:'2026-11-13',venue:'Palma Sola',src:'assets/jornada-5.svg'}
};
const normalize=v=>String(v??'').trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const clean=v=>{const name=normalize(v).replace(/^los /,'');return ({'sarasota sharks':'sharks','sarasota vikings':'vikings','vikingos':'vikings','sarasota vikingos':'vikings'})[name]||name};
function dateValue(v){
 const s=String(v??'');let m=s.match(/^Date\((\d+),(\d+),(\d+)\)$/);
 if(m)return m[1]+'-'+String(+m[2]+1).padStart(2,'0')+'-'+m[3].padStart(2,'0');
 m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 if(m)return m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0');
 return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
}
function localDate(now=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
 return p.year+'-'+p.month+'-'+p.day;
}
function monday(date){
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
 return d.toISOString().slice(0,10);
}
function parseCalendar(table){
 const rows=table.rows.map(r=>(r.c||[]).map(c=>c?c.v:''));
 const header=rows.find(r=>normalize(r[0])==='fecha');
 const labels=header||table.cols.map(c=>c.label);
 const index=(label,fallback)=>{const i=labels.findIndex(v=>normalize(v)===label);return i<0?fallback:i};
 const dateCol=index('fecha',0),typeCol=index('tipo',1),awayCol=index('equipo visitante',2),homeCol=index('equipo home',4),venueCol=index('sede',7),roundCol=index('jornada',8);
 return rows.map((r,order)=>({date:dateValue(r[dateCol]),type:normalize(r[typeCol]),teams:[String(r[awayCol]??'').trim(),String(r[homeCol]??'').trim()],venue:String(r[venueCol]??'').trim(),round:Number(r[roundCol]),order}))
 .filter(r=>r.date&&r.round&&(/oficial|torneo/.test(r.type))).sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
}
function choosePoster(calendar,today){
 const week=monday(today),groups=new Map();
 for(const row of calendar){if(!groups.has(row.round))groups.set(row.round,[]);groups.get(row.round).push(row)}
 for(const [round,rows] of groups){
  const selected=round===3?rows.find(r=>r.teams.map(clean).sort().join('|')==='sharks|vikings'):rows[0];
  if(!selected||monday(rows[0].date)!==week)continue;
  const art=POSTERS[round];if(!art)continue;
  // Only publish artwork approved for the calendar's featured matchup.
  if(selected.teams.map(clean).sort().join('|')!==art.teams.map(clean).sort().join('|'))continue;
  return {round,...art,date:selected.date,venue:selected.venue};
 }
 return null;
}
const fallback=Object.entries(POSTERS).map(([round,p],order)=>({...p,round:Number(round),order,type:'torneo oficial'}));
const promo=document.getElementById('opening-match-promo');
const img=promo.querySelector('img'),link=promo.querySelector('a');
const caption=document.getElementById('weekly-poster-caption');
let calendar=fallback;
function refresh(){
 const today=localDate();
 if(today<'2026-10-17'){
  promo.hidden=false;img.setAttribute('src','assets/estelares-sharks-opening.svg');
  img.setAttribute('alt','Estelares vs Sharks · 16 octubre · Babe Ruth. Ver calendario.');
  promo.setAttribute('aria-label','Estelares vs Sharks, 16 de octubre en Babe Ruth');
  link.setAttribute('aria-label','Ver calendario: Estelares vs Sharks');
  caption.hidden=true;return;
 }
 const selected=choosePoster(calendar,today);
 promo.hidden=!selected;
 if(!selected)return;
 const date=new Intl.DateTimeFormat('es-US',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(selected.date+'T12:00:00Z'));
 const text='Jornada '+selected.round+' · '+selected.teams.join(' vs ')+' · '+date+' · '+selected.venue;
 img.setAttribute('src',selected.src);img.setAttribute('alt',text+'. Ver calendario.');
 img.setAttribute('width','1672');img.setAttribute('height','941');
 promo.setAttribute('aria-label',text);link.setAttribute('aria-label','Ver calendario: '+text);
 caption.textContent=text;caption.hidden=false;
}
async function loadCalendar(){
 try{
  const url='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:json&sheet=Resultados';
  const response=await fetch(url);if(!response.ok)throw Error('Calendar unavailable');
  const text=await response.text(),json=JSON.parse(text.substring(text.indexOf('{'),text.lastIndexOf('}')+1));
  const rows=parseCalendar(json.table);if(!rows.length)throw Error('Empty calendar');
  calendar=rows;refresh();
 }catch{refresh()}
}
refresh();loadCalendar();
setInterval(refresh,30000);
setInterval(loadCalendar,300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadCalendar()});
})();
