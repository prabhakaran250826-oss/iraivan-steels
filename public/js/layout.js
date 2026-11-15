/* Pure layout + geometry maths (no 3D library needed), used by builder.js */
var Layout=(function(){
const D=9.6,BD=4.8,FH=3.15,WH=3.0,P=0.3,EXT=0.23,INT=0.115,BW=0.235,BH=0.0825;
const AREA={hall:20,dining:12,kitchen:10,bedroom:13,bathroom:5,pooja:4,lounge:16,stair:7};
const NAME={hall:'Hall',dining:'Dining',kitchen:'Kitchen',bedroom:'Bedroom',bathroom:'Bathroom',pooja:'Pooja room',lounge:'Family lounge',stair:'Staircase'};
const mk=(t,n)=>Array.from({length:n},(_,i)=>({t:t,n:i+1,cnt:n}));
function plan(cfg){
 const R=cfg.rooms,F=cfg.floors,hall=mk('hall',R.hall),bed=mk('bedroom',R.bedroom),bath=mk('bathroom',R.bathroom),din=mk('dining',R.dining),kit=mk('kitchen',R.kitchen),poo=mk('pooja',R.pooja);let Ls;
 if(F==1)Ls=[hall.concat(din,kit,poo,bed,bath)];
 else{const ub=Math.ceil(bed.length/2),ubt=Math.floor(bath.length/2);
  Ls=[hall.slice(0,1).concat(din,kit,poo,bed.slice(ub),bath.slice(ubt)),hall.slice(1).concat(bed.slice(0,ub),bath.slice(0,ubt))];
  if(!Ls[0].length)Ls[0]=[{t:'hall',n:1,cnt:1}];if(!Ls[1].length)Ls[1]=[{t:'lounge',n:1,cnt:1}]}
 const pri={hall:0,dining:1,kitchen:2},sum=a=>a.reduce((x,r)=>x+AREA[r.t],0);
 const bandsAll=Ls.map(list=>{
  const fr=list.filter(r=>pri[r.t]!==undefined).sort((a,b)=>pri[a.t]-pri[b.t]),rest=list.filter(r=>pri[r.t]===undefined),bk=[];
  if(F==2)bk.push({t:'stair',n:1,cnt:1,fixed:2.6});
  rest.forEach(r=>{(sum(fr)<=sum(bk)?fr:bk).push(r)});
  if(bk.length&&bk.every(r=>r.fixed))bk.push({t:'lounge',n:2,cnt:2});            // stair alone in a band: add a lounge beside it
  return [fr,bk]});
 let need=0;
 bandsAll.forEach(bs=>{const bl=bs.filter(b=>b.length),dep=bl.length==1?D:BD;bl.forEach(b=>{need=Math.max(need,b.reduce((x,r)=>x+(r.fixed||Math.max(AREA[r.t]/dep,2.1)),0))})});
 const W=Math.min(18,Math.max(8.5,Math.ceil(need*2)/2));
 const floors=bandsAll.map((bs,f)=>{
  const bl=bs.filter(b=>b.length),dep=bl.length==1?D:BD,out=[];
  bl.forEach((b,bi)=>{let z0,z1;if(bl.length==1){z0=-D/2;z1=D/2}else if(b===bs[0]){z0=0;z1=BD}else{z0=-BD;z1=0}
   const fx=b.reduce((x,r)=>x+(r.fixed||0),0),raw=b.map(r=>r.fixed||Math.max(AREA[r.t]/dep,2.1)),vr=raw.reduce((x,w,i)=>b[i].fixed?x:x+w,0),k=(W-fx)/vr;let x=-W/2;
   b.forEach((r,i)=>{const w=r.fixed||raw[i]*k;out.push(Object.assign({},r,{f:f,band:bi,x0:x,x1:x+w,z0:z0,z1:z1,id:f+'-'+r.t+r.n,label:NAME[r.t]+(r.cnt>1?' '+r.n:'')}));x+=w})});
  return out});
 return {W:W,D:D,F:F,floors:floors}}
function walls(pl){
 const W=pl.W,e=EXT/2;
 return pl.floors.map((rooms,f)=>{
  const S=[];
  const seg=(x0,z0,x1,z1,t,ext,side)=>{const s={x0:x0,z0:z0,x1:x1,z1:z1,t:t,ext:ext,f:f,side:side,open:[],L:Math.hypot(x1-x0,z1-z0)};S.push(s);return s};
  const op=(s,c,w,y0,y1,kind)=>s.open.push({c:c,w:w,y0:y0,y1:y1,kind:kind});
  const fr=seg(-W/2-e,D/2,W/2+e,D/2,EXT,true,'front'),bk=seg(-W/2-e,-D/2,W/2+e,-D/2,EXT,true,'back'),lf=seg(-W/2,-D/2+e,-W/2,D/2-e,EXT,true,'left'),rt=seg(W/2,-D/2+e,W/2,D/2-e,EXT,true,'right');
  const bands={};rooms.forEach(r=>{(bands[r.band]=bands[r.band]||[]).push(r)});
  const bl=Object.keys(bands).map(k=>bands[k]);
  bl.forEach(b=>{b.forEach((r,i)=>{if(i>0){const s=seg(r.x0,r.z0,r.x0,r.z1,INT,false,'int');op(s,(r.z1-r.z0)/2,.9,0,2.1,'door')}})});
  if(bl.length==2){const s=seg(-W/2,0,W/2,0,INT,false,'int');const a=bl[0][0],b=bl[1][0];op(s,Math.min(a.x1-a.x0,b.x1-b.x0)/2,.9,0,2.1,'door')}
  const main=f==0?(rooms.find(r=>Math.abs(r.z1-D/2)<1e-6&&r.t=='hall')||rooms.find(r=>Math.abs(r.z1-D/2)<1e-6)):null;
  rooms.forEach(r=>{
   const cx=(r.x0+r.x1)/2,zc=(r.z0+r.z1)/2,rw=r.x1-r.x0;
   let w=Math.min(1.5,rw-.9),y0=1.0,y1=2.2;if(r.t=='bathroom'){w=Math.min(.7,w);y0=1.5}if(r.t=='pooja'){w=Math.min(.6,w);y0=1.3;y1=2.0}if(r.t=='stair'){w=Math.min(.9,w);y0=.9;y1=2.6}
   const tf=Math.abs(r.z1-D/2)<1e-6,tb=Math.abs(r.z0+D/2)<1e-6;
   if(r===main)op(fr,cx+W/2+e,1.1,0,2.2,'main');else if(tf&&w>.4)op(fr,cx+W/2+e,w,y0,y1,'window');
   if(tb&&w>.4)op(bk,cx+W/2+e,w,y0,y1,'window');
   const sw=Math.min(1.2,r.t=='bathroom'?.7:1.2,r.z1-r.z0-.9);
   if(Math.abs(r.x0+W/2)<1e-6&&r.t!='stair')op(lf,zc+D/2-e,sw,y0,y1,'window');
   if(Math.abs(r.x1-W/2)<1e-6&&r.t!='stair')op(rt,zc+D/2-e,sw,y0,y1,'window')});
  return S})}
function bricks(segs){
 const A=[];
 segs.forEach(s=>{const dx=(s.x1-s.x0)/s.L,dz=(s.z1-s.z0)/s.L,rot=Math.abs(dx)>.5?0:Math.PI/2,y0=P+s.f*FH;
  const op=s.open.map(o=>[o.c-o.w/2-.012,o.c+o.w/2+.012,y0+o.y0-.01,y0+o.y1+.01]);
  for(let c=0;c<36;c++){const yb=y0+c*BH,off=(c%2)*BW/2;
   for(let u0=-off;u0<s.L-.02;u0+=BW){const a=Math.max(0,u0),b=Math.min(s.L,u0+BW);if(b-a<.04)continue;
    let hit=false;for(let i=0;i<op.length;i++){const o=op[i];if(a<o[1]&&b>o[0]&&yb<o[3]&&yb+BH>o[2]){hit=true;break}}
    if(hit)continue;const m=(a+b)/2;A.push([s.x0+dx*m,yb+BH/2,s.z0+dz*m,rot,b-a,s.t,yb])}}});
 A.sort((p,q)=>p[6]-q[6]);return A}
function pieces(s){
 const o=s.open.slice().sort((a,b)=>a.c-b.c),R=[];let cur=0;
 o.forEach(q=>{const u0=q.c-q.w/2,u1=q.c+q.w/2;if(u0>cur+.01)R.push({u0:cur,u1:u0,y0:0,y1:WH});if(q.y0>0)R.push({u0:u0,u1:u1,y0:0,y1:q.y0});R.push({u0:u0,u1:u1,y0:q.y1,y1:WH});cur=u1});
 if(s.L>cur+.01)R.push({u0:cur,u1:s.L,y0:0,y1:WH});return R}
function slabPieces(pl,f){
 const W=pl.W,ov=.23,top=f==pl.F-1,y=P+f*FH+WH,X0=-W/2-ov,X1=W/2+ov,Z0=-D/2-ov,Z1=D/2+ov;
 if(top||pl.F==1)return [[X0,X1,Z0,Z1,y]];
 const st=pl.floors[0].find(r=>r.t=='stair'),hz0=st.z0+.9;
 return [[X0,st.x0,Z0,Z1,y],[st.x1,X1,Z0,Z1,y],[st.x0,st.x1,st.z1,Z1,y],[st.x0,st.x1,Z0,hz0,y]]}
function columnPts(pl){
 const W=pl.W,e=EXT/2,xs={},pts=[];
 pl.floors[0].forEach(r=>{xs[r.x0.toFixed(2)]=r.x0;xs[r.x1.toFixed(2)]=r.x1});
 Object.keys(xs).forEach(k=>{[-D/2,D/2].forEach(z=>pts.push([xs[k],z]))});
 [-D/4,D/4].forEach(z=>{pts.push([-W/2,z]);pts.push([W/2,z])});return pts}
function estimate(pl,cfg,bc,doors,wins,plasterArea){
 const W=pl.W,F=pl.F,per=2*(W+D);
 let slabA=0;for(let f=0;f<F;f++)slabA+=slabPieces(pl,f).reduce((a,p)=>a+(p[1]-p[0])*(p[3]-p[2]),0);
 const cols=columnPts(pl).length,conc=per*.36+W*D*.1+cols*.09*(P+F*FH)+slabA*.15,roomA=pl.floors.reduce((a,fl)=>a+fl.filter(r=>r.t!='stair').reduce((x,r)=>x+(r.x1-r.x0)*(r.z1-r.z0),0),0);
 const o={'Bricks':Math.round(bc/10)*10,'Cement (50 kg bags)':Math.round(conc*7.5+bc/1000*7+plasterArea*.15),'Steel (kg)':Math.round(conc*80/10)*10,'Sand (tons)':+(conc*.7+bc/1000*1.2+plasterArea*.02).toFixed(1),'Aggregate (tons)':+(conc*1.4).toFixed(1),'Paint (litres)':Math.round(plasterArea/6),'Floor finish (m²)':Math.round(roomA*1.08),'Doors':doors,'Windows':wins};
 if(cfg.roof=='tile'){const a=Math.PI*28/180,sl=(D/2+.5)/Math.cos(a);o['Roof tiles']=Math.round(2*sl*(W+1)*11/10)*10}
 return o}
return {plan:plan,walls:walls,bricks:bricks,pieces:pieces,slabPieces:slabPieces,columnPts:columnPts,estimate:estimate,D:D,BD:BD,FH:FH,WH:WH,P:P,BH:BH,EXT:EXT,INT:INT,NAME:NAME}
})();
if(typeof module!=='undefined')module.exports=Layout;
