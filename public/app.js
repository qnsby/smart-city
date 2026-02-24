const S={token:localStorage.getItem('smartcity_token')||'',user:JSON.parse(localStorage.getItem('smartcity_user')||'null')};
const $=id=>document.getElementById(id);
const E={loginForm:$('loginForm'),loginName:$('loginName'),loginPassword:$('loginPassword'),logoutBtn:$('logoutBtn'),authOut:$('authOut'),ticketForm:$('ticketForm'),h3Filter:$('h3Filter'),loadTicketsBtn:$('loadTicketsBtn'),ticketsTable:$('ticketsTable'),ticketId:$('ticketId'),getTicketBtn:$('getTicketBtn'),getAuditBtn:$('getAuditBtn'),statusSelect:$('statusSelect'),updateStatusBtn:$('updateStatusBtn'),ticketOut:$('ticketOut'),auditOut:$('auditOut'),analyticsDate:$('analyticsDate'),loadH3Btn:$('loadH3Btn'),loadTopBtn:$('loadTopBtn'),analyticsTable:$('analyticsTable')};

function saveAuth(){
  if(S.token)localStorage.setItem('smartcity_token',S.token); else localStorage.removeItem('smartcity_token');
  if(S.user)localStorage.setItem('smartcity_user',JSON.stringify(S.user)); else localStorage.removeItem('smartcity_user');
  E.authOut.textContent=S.token?JSON.stringify({user:S.user,token_preview:S.token.slice(0,18)+'...'},null,2):'Not authenticated';
}

async function api(url,opt={}){
  const headers={...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})};
  if(S.token) headers.Authorization='Bearer '+S.token;
  const res=await fetch(url,{...opt,headers});
  const txt=await res.text(); let data; try{data=txt?JSON.parse(txt):null;}catch{data={raw:txt};}
  if(!res.ok){const e=new Error(data?.error||('HTTP '+res.status)); e.status=res.status; e.data=data; throw e;}
  return data;
}

function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function show(node,v){node.textContent=v?JSON.stringify(v,null,2):'';}
function showErr(node,e){const payload={error:e.message,status:e.status||null,details:e.data||null}; if(node.classList.contains('tableWrap')) node.innerHTML='<pre class="out err">'+esc(JSON.stringify(payload,null,2))+'</pre>'; else node.textContent=JSON.stringify(payload,null,2);}
function fmtDate(v){return v?new Date(v).toLocaleString():'';}

function renderTable(node,rows,cols){
  if(!rows?.length){node.innerHTML='<p class="muted">No data</p>';return;}
  node.innerHTML='<table><thead><tr>'+cols.map(c=>'<th>'+c.label+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(c.value(r))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
}

async function login(name,password){const d=await api('/auth/login',{method:'POST',body:JSON.stringify({name,password})}); S.token=d.token; S.user=d.user; saveAuth(); await loadTickets();}
async function loadTickets(){ if(!S.token){E.ticketsTable.innerHTML='<p class="muted">Login required</p>'; return;} const h3=E.h3Filter.value.trim(); const d=await api(h3?'/tickets/getAll?h3='+encodeURIComponent(h3):'/tickets/getAll'); renderTable(E.ticketsTable,d.items||[],[{label:'ID',value:r=>r.id},{label:'Title',value:r=>r.title},{label:'Category',value:r=>r.category},{label:'Status',value:r=>r.status},{label:'H3',value:r=>r.h3_index},{label:'Team',value:r=>r.assigned_team||'-'},{label:'Created',value:r=>fmtDate(r.created_at)}]); }
async function createTicket(){ const fd=new FormData(E.ticketForm); const payload={title:String(fd.get('title')||''),category:String(fd.get('category')||''),description:String(fd.get('description')||''),latitude:Number(fd.get('latitude')),longitude:Number(fd.get('longitude'))}; const d=await api('/tickets/create',{method:'POST',body:JSON.stringify(payload)}); E.ticketId.value=d.id; show(E.ticketOut,d); await loadTickets(); }
async function getTicket(){ const id=E.ticketId.value.trim(); if(!id) throw new Error('Ticket ID required'); const d=await api('/tickets/get/'+encodeURIComponent(id)); show(E.ticketOut,d); }
async function getAudit(){ const id=E.ticketId.value.trim(); if(!id) throw new Error('Ticket ID required'); const d=await api('/tickets/audit/'+encodeURIComponent(id)); show(E.auditOut,d); }
async function updateStatus(){ const id=E.ticketId.value.trim(); if(!id) throw new Error('Ticket ID required'); const d=await api('/tickets/update/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({status:E.statusSelect.value})}); show(E.ticketOut,d); await loadTickets(); }
async function loadAnalytics(kind){ const q=E.analyticsDate.value?('?date='+encodeURIComponent(E.analyticsDate.value)):''; const d=await api((kind==='top'?'/analytics/top-cells':'/analytics/h3')+q); renderTable(E.analyticsTable,d.items||[],[{label:'H3 Index',value:r=>r.h3_index},{label:'Ticket Count',value:r=>r.ticket_count}]); }

async function guard(fn,out){ try{ await fn(); } catch(e){ showErr(out,e); } }

function bind(){
  E.loginForm.addEventListener('submit',e=>{e.preventDefault(); guard(()=>login(E.loginName.value.trim(),E.loginPassword.value),E.authOut);});
  E.logoutBtn.addEventListener('click',()=>{S.token='';S.user=null;saveAuth();E.ticketsTable.innerHTML='<p class="muted">Login required</p>';E.analyticsTable.innerHTML='';show(E.ticketOut,null);show(E.auditOut,null);});
  document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>{const [n,p]=(b.dataset.demo||'|').split('|');E.loginName.value=n;E.loginPassword.value=p;}));
  E.ticketForm.addEventListener('submit',e=>{e.preventDefault(); guard(createTicket,E.ticketOut);});
  E.loadTicketsBtn.addEventListener('click',()=>guard(loadTickets,E.ticketsTable));
  E.getTicketBtn.addEventListener('click',()=>guard(getTicket,E.ticketOut));
  E.getAuditBtn.addEventListener('click',()=>guard(getAudit,E.auditOut));
  E.updateStatusBtn.addEventListener('click',()=>guard(updateStatus,E.ticketOut));
  E.loadH3Btn.addEventListener('click',()=>guard(()=>loadAnalytics('h3'),E.analyticsTable));
  E.loadTopBtn.addEventListener('click',()=>guard(()=>loadAnalytics('top'),E.analyticsTable));
}

function init(){ E.analyticsDate.value=new Date().toISOString().slice(0,10); saveAuth(); bind(); if(S.token) guard(loadTickets,E.ticketsTable); else E.ticketsTable.innerHTML='<p class="muted">Login required</p>'; }
init();
