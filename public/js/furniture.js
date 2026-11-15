/* Procedural furniture catalogue (units: metres, front faces +z, origin at floor centre of the footprint) */
const Furn=(function(){
const cm={},mat=c=>cm[c]||(cm[c]=new THREE.MeshLambertMaterial({color:c})),glow=new THREE.MeshBasicMaterial({color:0xffe2a8});
const M=c=>c==='glow'?glow:mat(c);
function bx(g,w,h,d,x,y,z,c){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(x,y+h/2,z);g.add(m);return m}
function cy(g,r,h,x,y,z,c,r2){const m=new THREE.Mesh(new THREE.CylinderGeometry(r2===undefined?r:r2,r,h,18),M(c));m.position.set(x,y+h/2,z);g.add(m);return m}
function sp(g,r,x,y,z,c){const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),M(c));m.position.set(x,y,z);g.add(m);return m}
function legs(g,w,d,h,x,z,c){[-1,1].forEach(a=>[-1,1].forEach(b=>bx(g,.05,h,.05,x+a*(w/2-.05),0,z+b*(d/2-.05),c)))}
const I=[
{id:'sofa',name:'Sofa',rooms:['hall','lounge'],w:2,d:.9,anchor:'S',build:g=>{bx(g,2,.4,.9,0,0,0,0x3d5a80);bx(g,2,.5,.22,0,.4,-.34,0x35507a);bx(g,.2,.3,.9,-.9,.4,0,0x35507a);bx(g,.2,.3,.9,.9,.4,0,0x35507a);for(let i=-1;i<=1;i++)bx(g,.52,.16,.62,i*.55,.4,.1,0x4c6d98)}},
{id:'tv',name:'TV and unit',rooms:['hall','lounge'],w:1.6,d:.4,anchor:'N',build:g=>{bx(g,1.6,.45,.4,0,0,0,0x5a4636);bx(g,1.2,.7,.04,0,.6,-.05,0x111418);bx(g,.3,.1,.15,0,.45,-.05,0x222222)}},
{id:'coffee',name:'Coffee table',rooms:['hall','lounge'],w:1,d:.6,anchor:'C',build:g=>{bx(g,1,.05,.6,0,.38,0,0x8a6a4a);legs(g,1,.6,.38,0,0,0x5a432e)}},
{id:'rug',name:'Rug',rooms:['hall','lounge','bedroom'],w:2.2,d:1.5,anchor:'C',build:g=>{bx(g,2.2,.012,1.5,0,0,0,0xc9b8a0);bx(g,1.9,.014,1.2,0,0,0,0xb89f84)}},
{id:'plant',name:'Plant',rooms:['hall','lounge','dining','pooja'],w:.5,d:.5,anchor:'NE',build:g=>{cy(g,.17,.3,0,0,0,0x8a5a3c,.13);sp(g,.28,0,.62,0,0x4d7a3c);sp(g,.2,.1,.88,.05,0x5d8c48)}},
{id:'lamp',name:'Floor lamp',rooms:['hall','lounge','bedroom'],w:.4,d:.4,anchor:'SE',build:g=>{cy(g,.15,.03,0,0,0,0x2d2d2d);cy(g,.015,1.45,0,.03,0,0x2d2d2d);cy(g,.17,.28,0,1.45,0,'glow',.1)}},
{id:'bed',name:'Double bed',rooms:['bedroom'],w:1.7,d:2.1,anchor:'N',build:g=>{bx(g,1.7,.3,2.1,0,0,0,0x6b4a33);bx(g,1.6,.22,1.95,0,.3,.05,0xf2efe9);bx(g,1.8,.95,.08,0,0,-1.02,0x5a3d29);[-1,1].forEach(a=>bx(g,.6,.1,.35,a*.4,.52,-.75,0xffffff));bx(g,1.62,.06,1.1,0,.52,.4,0x1d4e89)}},
{id:'wardrobe',name:'Wardrobe',rooms:['bedroom'],w:1.5,d:.6,anchor:'W',build:g=>{bx(g,1.5,2.1,.6,0,0,0,0x8a6a4a);bx(g,.02,2,.01,0,.05,.305,0x5a432e);bx(g,.03,.3,.03,-.08,1,.32,0xd4d4d4);bx(g,.03,.3,.03,.08,1,.32,0xd4d4d4)}},
{id:'side',name:'Bedside table',rooms:['bedroom'],w:.45,d:.4,anchor:'NE',build:g=>{bx(g,.45,.5,.4,0,0,0,0x8a6a4a);cy(g,.05,.2,0,.5,0,0x333333);cy(g,.11,.15,0,.7,0,'glow',.07)}},
{id:'desk',name:'Study desk',rooms:['bedroom'],w:1.2,d:.6,anchor:'SW',build:g=>{bx(g,1.2,.04,.6,0,.72,0,0xb08a63);legs(g,1.2,.6,.72,0,0,0x5a432e);bx(g,.5,.3,.03,0,.9,-.15,0x151515);bx(g,.1,.12,.1,0,.76,-.15,0x151515);bx(g,.4,.04,.4,0,.45,.55,0x444444);bx(g,.4,.45,.04,0,.45,.73,0x444444)}},
{id:'counter',name:'Kitchen counter',rooms:['kitchen'],w:2.6,d:.6,anchor:'NW',build:g=>{bx(g,2.6,.85,.6,0,0,0,0xe8e4dc);bx(g,2.64,.04,.64,0,.85,0,0x2f3438);bx(g,2.6,.7,.35,0,1.5,-.12,0xd7d2c8);bx(g,.6,.02,.4,-.6,.89,0,0x9aa3a9);cy(g,.015,.2,-.6,.89,-.2,0xaaaaaa);[-1,1].forEach(a=>cy(g,.1,.012,.55+a*.0,.89,a*.12,0x111111));bx(g,.01,.6,.01,0,.12,.31,0xc8c8c8)}},
{id:'fridge',name:'Refrigerator',rooms:['kitchen'],w:.7,d:.7,anchor:'NE',build:g=>{bx(g,.7,1.8,.7,0,0,0,0xc9ced2);bx(g,.02,.5,.03,.28,1,.36,0x777777);bx(g,.69,.01,.01,0,1.15,.36,0x8c9196)}},
{id:'dining',name:'Dining table and chairs',rooms:['dining'],w:2.4,d:1.7,anchor:'C',build:g=>{bx(g,1.6,.05,.9,0,.72,0,0x8a6a4a);legs(g,1.6,.9,.72,0,0,0x5a432e);[[-.45,.7,0],[.45,.7,0],[-.45,-.7,Math.PI],[.45,-.7,Math.PI]].forEach(c=>{const h=new THREE.Group();bx(h,.42,.04,.42,0,.44,0,0xb08a63);bx(h,.42,.45,.04,0,.46,.2,0xb08a63);legs(h,.42,.42,.44,0,0,0x5a432e);h.position.set(c[0],0,c[1]);h.rotation.y=c[2];g.add(h)})}},
{id:'sideboard',name:'Sideboard',rooms:['dining','hall'],w:1.4,d:.45,anchor:'S',build:g=>{bx(g,1.4,.85,.45,0,0,0,0xb08a63);bx(g,.01,.7,.01,0,.08,.23,0x5a432e);bx(g,1.2,.15,.1,0,.85,0,0xd9d2c4)}},
{id:'pendant',name:'Pendant light',rooms:['dining'],w:.5,d:.5,anchor:'C',build:g=>{cy(g,.008,.9,0,2.1,0,0x222222);cy(g,.28,.14,0,1.98,0,'glow',.08)}},
{id:'wc',name:'Toilet',rooms:['bathroom'],w:.4,d:.7,anchor:'NW',build:g=>{bx(g,.38,.4,.5,0,0,.05,0xffffff);bx(g,.38,.45,.18,0,.4,-.27,0xf4f4f4);cy(g,.18,.03,0,.4,.05,0xf0f0f0)}},
{id:'basin',name:'Wash basin',rooms:['bathroom'],w:.6,d:.5,anchor:'NE',build:g=>{bx(g,.6,.8,.45,0,0,0,0xe8e4dc);bx(g,.5,.1,.38,0,.8,0,0xffffff);cy(g,.012,.2,0,.9,-.15,0xaaaaaa);bx(g,.5,.7,.02,0,1.2,-.24,0x9fc3d8)}},
{id:'shower',name:'Shower',rooms:['bathroom'],w:.95,d:.95,anchor:'SW',build:g=>{bx(g,.95,.06,.95,0,0,0,0xd9dde0);const p=bx(g,.02,2,.95,.47,.06,0,0x9fc3d8);p.material=new THREE.MeshLambertMaterial({color:0x9fc3d8,transparent:true,opacity:.4});cy(g,.01,.3,-.4,1.8,-.4,0xaaaaaa);cy(g,.08,.03,-.4,2.05,-.3,0xaaaaaa)}},
{id:'pooja',name:'Pooja shelf',rooms:['pooja'],w:1,d:.5,anchor:'N',build:g=>{bx(g,1,.9,.5,0,0,0,0x7a5236);bx(g,.9,.8,.3,0,.9,-.1,0x8a6a4a);bx(g,.9,.03,.3,0,1.3,-.1,0x5a3d29);cy(g,.06,.2,0,.93,-.05,0xd4a73a,.03);sp(g,.05,0,1.18,-.05,0xd4a73a);[-1,1].forEach(a=>cy(g,.04,.04,a*.3,.9,.1,'glow',.025))}},
{id:'light',name:'Ceiling light',rooms:['hall','lounge','bedroom','kitchen','dining','bathroom','pooja'],w:.1,d:.1,anchor:'C',light:true,build:g=>{cy(g,.2,.05,0,2.93,0,'glow',.2)}}];
return {items:I,forRoom:t=>I.filter(i=>i.rooms.indexOf(t)>=0),byId:id=>I.find(i=>i.id===id),bx:bx,cy:cy,mat:mat}
})();
