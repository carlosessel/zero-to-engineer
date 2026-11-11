// Interactive demos, ported from the two prototype pages (see legacy/).
// The drawing code is unchanged. The only differences are that every event
// listener is attached through on(), which does nothing when the element is
// not on the current page, and that each demo starts only if its markup exists.
// Phase 3 of PLAN.md rewrites these as separate, tested, accessible components.
/* eslint-disable */
// @ts-nocheck
export function initDemos(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function on(sel,ev,fn){var e=$(sel);if(e)e.addEventListener(ev,fn)}
function cv(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||"#888"}

/* gradient descent */
var gd={w:-4,hist:[-4]};
function gdDraw(){
  var c=$("#gdC"); if(!c)return; var x=c.getContext("2d"),W=c.width,H=c.height;
  x.clearRect(0,0,W,H);
  var xmin=-6,xmax=12,ymax=90, px=function(w){return (w-xmin)/(xmax-xmin)*W}, py=function(l){return H-20-(l/ymax)*(H-40)}, f=function(w){return (w-3)*(w-3)};
  x.strokeStyle=cv("--line");x.lineWidth=1;x.beginPath();x.moveTo(0,py(0));x.lineTo(W,py(0));x.stroke();
  x.strokeStyle=cv("--ink");x.lineWidth=2.5;x.beginPath();
  for(var i=0;i<=200;i++){var w=xmin+(xmax-xmin)*i/200;var X=px(w),Y=py(f(w));if(i)x.lineTo(X,Y);else x.moveTo(X,Y);}x.stroke();
  x.strokeStyle=cv("--gold");x.lineWidth=1.5;x.beginPath();
  gd.hist.forEach(function(w,i){var X=px(w),Y=py(Math.min(f(w),ymax*1.2));if(i)x.lineTo(X,Y);else x.moveTo(X,Y);});x.stroke();
  x.fillStyle=cv("--gold");gd.hist.forEach(function(w){x.beginPath();x.arc(px(w),py(Math.min(f(w),ymax*1.2)),3.5,0,7);x.fill();});
  x.fillStyle=cv("--accent");x.beginPath();x.arc(px(gd.w),py(Math.min(f(gd.w),ymax*1.2)),8,0,7);x.fill();
  x.fillStyle=cv("--muted");x.font="14px sans-serif";x.fillText("weight",W-56,py(0)+16);x.fillText("loss",8,18);
  var loss=f(gd.w), msg="step "+(gd.hist.length-1)+"   weight = "+gd.w.toFixed(3)+"   loss = "+(loss>1e6?loss.toExponential(2):loss.toFixed(4));
  if(Math.abs(gd.w)>50)msg+="   diverged: the steps are too big";
  else if(loss<1e-4&&gd.hist.length>1)msg+="   converged";
  $("#gdRead").textContent=msg;
}
function gdStep(){if(Math.abs(gd.w)>1e6)return;var lr=parseFloat($("#gdLr").value);gd.w=gd.w-lr*2*(gd.w-3);gd.hist.push(gd.w);}
on("#gdLr","input",function(){$("#gdLrV").textContent=parseFloat(this.value).toFixed(2)});
on("#gdStep","click",function(){gdStep();gdDraw()});
on("#gdRun","click",function(){for(var i=0;i<20;i++)gdStep();gdDraw()});
on("#gdReset","click",function(){gd={w:-4,hist:[-4]};gdDraw()});

/* polynomial fit */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var pf=(function(){var r=rng(7),g=function(){return (r()+r()+r()-1.5)*0.5},tr=[],te=[],truth=function(x){return Math.sin(2.6*x)};
  for(var i=0;i<10;i++){var x=-0.95+1.9*i/9;tr.push([x,truth(x)+g()]);}
  for(var j=0;j<30;j++){var x2=-0.9+1.8*r();te.push([x2,truth(x2)+g()]);}
  return {tr:tr,te:te};})();
function solve(A,b){var n=b.length,i,j,k;for(i=0;i<n;i++){var m=i;for(k=i+1;k<n;k++)if(Math.abs(A[k][i])>Math.abs(A[m][i]))m=k;var t=A[i];A[i]=A[m];A[m]=t;var tb=b[i];b[i]=b[m];b[m]=tb;
    if(Math.abs(A[i][i])<1e-14)continue;for(k=i+1;k<n;k++){var f=A[k][i]/A[i][i];for(j=i;j<n;j++)A[k][j]-=f*A[i][j];b[k]-=f*b[i];}}
  var x=new Array(n).fill(0);for(i=n-1;i>=0;i--){var s=b[i];for(j=i+1;j<n;j++)s-=A[i][j]*x[j];x[i]=Math.abs(A[i][i])<1e-14?0:s/A[i][i];}return x;}
function pfFit(d){var n=d+1,A=[],b=new Array(n).fill(0),i,j;for(i=0;i<n;i++){A.push(new Array(n).fill(0));}
  pf.tr.forEach(function(p){var pw=[];for(i=0;i<n;i++)pw.push(Math.pow(p[0],i));for(i=0;i<n;i++){b[i]+=pw[i]*p[1];for(j=0;j<n;j++)A[i][j]+=pw[i]*pw[j];}});
  for(i=0;i<n;i++)A[i][i]+=1e-10;return solve(A,b);}
function pfEval(c,x){var s=0;for(var i=c.length-1;i>=0;i--)s=s*x+c[i];return s;}
function pfDraw(){
  var c=$("#pfC"); if(!c)return; var x=c.getContext("2d"),W=c.width,H=c.height,d=parseInt($("#pfD").value,10),co=pfFit(d);
  var px=function(v){return (v+1.05)/2.1*W},py=function(v){return H/2-v*(H/4.4)};
  x.clearRect(0,0,W,H);
  x.save();x.beginPath();x.rect(0,0,W,H);x.clip();
  x.strokeStyle=cv("--accent");x.lineWidth=3;x.beginPath();
  for(var i=0;i<=300;i++){var v=-1.05+2.1*i/300,Y=py(Math.max(-6,Math.min(6,pfEval(co,v))));if(i)x.lineTo(px(v),Y);else x.moveTo(px(v),Y);}x.stroke();x.restore();
  x.strokeStyle=cv("--muted");x.lineWidth=2;pf.te.forEach(function(p){x.beginPath();x.arc(px(p[0]),py(p[1]),5,0,7);x.stroke();});
  x.fillStyle=cv("--ink");pf.tr.forEach(function(p){x.beginPath();x.arc(px(p[0]),py(p[1]),6,0,7);x.fill();});
  var mse=function(a){return a.reduce(function(s,p){var e=pfEval(co,p[0])-p[1];return s+e*e},0)/a.length};
  var a=mse(pf.tr),b=mse(pf.te);
  $("#pfDV").textContent=d;
  $("#pfRead").textContent="training error = "+a.toFixed(3)+"   error on new data = "+b.toFixed(3)+(d<=1?"   (underfitting)":d>=7?"   (overfitting)":"");
}
on("#pfD","input",pfDraw);

/* temperature */
var TP=[["mat",5.0],["sofa",4.2],["floor",3.8],["roof",2.5],["moon",0.5]], tpSamples=[];
function tpProbs(){var T=parseFloat($("#tpT").value),e=TP.map(function(t){return Math.exp(t[1]/T)}),s=e.reduce(function(a,b){return a+b},0);return e.map(function(v){return v/s});}
function tpDraw(){var p=tpProbs(),box=$("#tpBars");box.textContent="";$("#tpTV").textContent=parseFloat($("#tpT").value).toFixed(1);
  TP.forEach(function(t,i){var r=document.createElement("div"),a=document.createElement("span"),w=document.createElement("span"),bar=document.createElement("i"),c=document.createElement("span");
    a.textContent=t[0];bar.style.width=(p[i]*100)+"%";w.appendChild(bar);c.className="read";c.textContent=(p[i]*100).toFixed(1)+"%";r.appendChild(a);r.appendChild(w);r.appendChild(c);box.appendChild(r);});}
on("#tpT","input",function(){tpSamples=[];$("#tpRead").textContent="Samples will appear here.";tpDraw()});
on("#tpS","click",function(){var p=tpProbs(),r=Math.random(),acc=0,pickd=TP[TP.length-1][0];for(var i=0;i<p.length;i++){acc+=p[i];if(r<acc){pickd=TP[i][0];break;}}
  tpSamples.push(pickd);if(tpSamples.length>24)tpSamples.shift();$("#tpRead").textContent="The cat sat on the… "+tpSamples.join(", ");});

/* tokenizer */
function tkRun(){var t=$("#tkIn").value,m=t.match(/\s?[A-Za-z\u00C0-\u024F]+|\s?\d+|\s?[^\sA-Za-z\u00C0-\u024F\d]|\s+/g)||[],out=[];
  m.forEach(function(w){var core=w.replace(/^\s/,"");if(/^[A-Za-z\u00C0-\u024F]+$/.test(core)&&core.length>7){var lead=w.length-core.length,first=w.slice(0,lead+4);out.push(first);var rest=w.slice(lead+4);while(rest.length>4){out.push(rest.slice(0,3));rest=rest.slice(3);}if(rest)out.push(rest);}
    else if(/^\d+$/.test(core)&&core.length>3){var s=w;while(s.length>3){out.push(s.slice(0,3));s=s.slice(3);}if(s)out.push(s);}
    else out.push(w);});
  var box=$("#tkOut");box.textContent="";out.forEach(function(k){var s=document.createElement("span");s.textContent=k;box.appendChild(s);});
  $("#tkRead").textContent=out.length+" tokens (toy estimate) for "+t.length+" characters"+(out.length?", about "+(t.length/out.length).toFixed(1)+" characters per token":"");}
on("#tkIn","input",tkRun);

/* retrieval */
var DOCS=["Refunds are available within 30 days of purchase if you have your receipt.","Standard delivery takes three to five working days. Express delivery arrives the next day.","Our shop is open Monday to Saturday from 9am to 6pm and closed on Sunday.","You can reset your password from the login page by choosing forgot password.","We accept mobile money, bank cards and cash payment on delivery.","Our refund policy does not cover items damaged after delivery."];
var STOP={the:1,a:1,an:1,of:1,to:1,is:1,are:1,and:1,or:1,on:1,in:1,if:1,you:1,your:1,i:1,my:1,can:1,do:1,we:1,our:1,from:1,by:1,for:1,how:1,what:1,get:1,have:1,it:1,be:1,not:1,does:1};
function bag(t){var o={};(t.toLowerCase().match(/[a-z0-9]+/g)||[]).forEach(function(w){if(STOP[w])return;if(w.length>3&&w.slice(-1)==="s")w=w.slice(0,-1);o[w]=(o[w]||0)+1;});return o;}
function cosBag(a,b){var d=0,na=0,nb=0,k;for(k in a){na+=a[k]*a[k];if(b[k])d+=a[k]*b[k];}for(k in b)nb+=b[k]*b[k];return na&&nb?d/Math.sqrt(na*nb):0;}
function rgRun(){var q=bag($("#rgQ").value),res=DOCS.map(function(d){return [d,cosBag(q,bag(d))]}).sort(function(a,b){return b[1]-a[1]}),box=$("#rgOut");box.textContent="";
  res.forEach(function(r){var row=document.createElement("div");row.style.gridTemplateColumns="1fr 90px 44px";var t=document.createElement("span"),w=document.createElement("span"),bar=document.createElement("i"),s=document.createElement("span");
    t.textContent=r[0];bar.style.width=(r[1]*100)+"%";if(!r[1])bar.style.opacity=".25";w.appendChild(bar);s.className="read";s.textContent=r[1].toFixed(2);row.appendChild(t);row.appendChild(w);row.appendChild(s);box.appendChild(row);});}
on("#rgQ","input",rgRun);

/* cost */
function ccRun(){var v=function(id){var n=parseFloat($(id).value);return isFinite(n)&&n>0?n:0},day=v("#ccR")*(v("#ccI")*v("#ccPI")+v("#ccO")*v("#ccPO"))/1e6,inShare=v("#ccI")*v("#ccPI"),tot=inShare+v("#ccO")*v("#ccPO");
  $("#ccRead").textContent="about $"+day.toFixed(2)+" per day, $"+(day*30).toFixed(0)+" per month"+(tot?"   ("+Math.round(100*inShare/tot)+"% of it is input tokens)":"");}
["#ccR","#ccI","#ccO","#ccPI","#ccPO"].forEach(function(id){on(id,"input",ccRun)});
function axes(x,W,H,px,py,xr,yr){x.strokeStyle=cv("--line");x.lineWidth=1;for(var g=-xr;g<=xr;g++){x.beginPath();x.moveTo(px(g),0);x.lineTo(px(g),H);x.stroke();}for(var k=-yr;k<=yr;k++){x.beginPath();x.moveTo(0,py(k));x.lineTo(W,py(k));x.stroke();}
  x.strokeStyle=cv("--muted");x.lineWidth=1.5;x.beginPath();x.moveTo(0,py(0));x.lineTo(W,py(0));x.moveTo(px(0),0);x.lineTo(px(0),H);x.stroke();}
function lnDraw(){var c=$("#lnC");if(!c)return;var x=c.getContext("2d"),W=c.width,H=c.height,m=parseFloat($("#lnM").value),b=parseFloat($("#lnB").value);
  var px=function(v){return W/2+v*(W/20)},py=function(v){return H/2-v*(H/16)};x.clearRect(0,0,W,H);axes(x,W,H,px,py,10,8);
  x.strokeStyle=cv("--accent");x.lineWidth=3;x.beginPath();x.moveTo(px(-10),py(-10*m+b));x.lineTo(px(10),py(10*m+b));x.stroke();
  x.fillStyle=cv("--gold");x.beginPath();x.arc(px(0),py(b),6,0,7);x.fill();
  $("#lnRead").textContent="y = "+m.toFixed(1)+"x + "+b.toFixed(1)+"     when x = 2, y = "+(2*m+b).toFixed(1)+"     each step right changes y by "+m.toFixed(1);}
function arrow(x,x0,y0,x1,y1,col){x.strokeStyle=col;x.fillStyle=col;x.lineWidth=3.5;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();var a=Math.atan2(y1-y0,x1-x0);x.beginPath();x.moveTo(x1,y1);x.lineTo(x1-13*Math.cos(a-0.4),y1-13*Math.sin(a-0.4));x.lineTo(x1-13*Math.cos(a+0.4),y1-13*Math.sin(a+0.4));x.closePath();x.fill();}
function vcDraw(){var c=$("#vcC");if(!c)return;var x=c.getContext("2d"),W=c.width,H=c.height,ang=parseFloat($("#vcA").value)*Math.PI/180,L=parseFloat($("#vcL").value);
  var a=[3,0],b=[L*Math.cos(ang),L*Math.sin(ang)],u=H/10,px=function(v){return W/2+v*u},py=function(v){return H/2-v*u};x.clearRect(0,0,W,H);axes(x,W,H,px,py,10,5);
  arrow(x,px(0),py(0),px(a[0]),py(a[1]),cv("--ink"));arrow(x,px(0),py(0),px(b[0]),py(b[1]),cv("--accent"));
  x.font="15px sans-serif";x.fillStyle=cv("--ink");x.fillText("A",px(a[0])+8,py(a[1])+18);x.fillStyle=cv("--accent");x.fillText("B",px(b[0])+8,py(b[1])-8);
  var d=a[0]*b[0]+a[1]*b[1],cs=d/(3*L);if(Math.abs(d)<1e-9)d=0;if(Math.abs(cs)<1e-9)cs=0;
  $("#vcRead").textContent="A = [3.0, 0.0]   B = ["+b[0].toFixed(1)+", "+b[1].toFixed(1)+"]   dot product = "+d.toFixed(2)+"   cosine similarity = "+cs.toFixed(2);}
function tgDraw(){var c=$("#tgC");if(!c)return;var x=c.getContext("2d"),W=c.width,H=c.height,x0=parseFloat($("#tgX").value),f=function(v){return v*v*v/4-2*v},df=function(v){return 0.75*v*v-2};
  var px=function(v){return W/2+v*(W/8)},py=function(v){return H/2-v*(H/12)};x.clearRect(0,0,W,H);axes(x,W,H,px,py,4,6);
  x.strokeStyle=cv("--ink");x.lineWidth=2.5;x.beginPath();for(var i=0;i<=200;i++){var v=-4+8*i/200;if(i)x.lineTo(px(v),py(f(v)));else x.moveTo(px(v),py(f(v)));}x.stroke();
  var s=df(x0),y0=f(x0);x.strokeStyle=cv("--gold");x.lineWidth=3;x.beginPath();x.moveTo(px(x0-1.5),py(y0-1.5*s));x.lineTo(px(x0+1.5),py(y0+1.5*s));x.stroke();
  x.fillStyle=cv("--accent");x.beginPath();x.arc(px(x0),py(y0),7,0,7);x.fill();
  $("#tgRead").textContent="x = "+x0.toFixed(2)+"   height = "+y0.toFixed(2)+"   slope = "+s.toFixed(2)+(Math.abs(s)<0.12?"   flat: a peak or a valley":s>0?"   going uphill":"   going downhill");}
var cn={h:0,n:0};
function cnDraw(){var box=$("#cnBars");if(!box)return;box.textContent="";var t=cn.n-cn.h;[["Heads",cn.h],["Tails",t]].forEach(function(r){var row=document.createElement("div"),a=document.createElement("span"),w=document.createElement("span"),bar=document.createElement("i"),c=document.createElement("span");
    a.textContent=r[0];bar.style.width=(cn.n?100*r[1]/cn.n:0)+"%";w.appendChild(bar);c.className="read";c.textContent=cn.n?(100*r[1]/cn.n).toFixed(1)+"%":"";row.appendChild(a);row.appendChild(w);row.appendChild(c);box.appendChild(row);});
  $("#cnRead").textContent=cn.n?cn.n.toLocaleString()+" flips, "+cn.h.toLocaleString()+" heads. Distance from 50%: "+Math.abs(100*cn.h/cn.n-50).toFixed(1)+" points":"No flips yet.";}
["#lnM","#lnB"].forEach(function(i){on(i,"input",lnDraw)});
["#vcA","#vcL"].forEach(function(i){on(i,"input",vcDraw)});
on("#tgX","input",tgDraw);
$$("[data-flip]").forEach(function(b){b.addEventListener("click",function(){var k=parseInt(b.dataset.flip,10);for(var i=0;i<k;i++){if(Math.random()<0.5)cn.h++;cn.n++;}cnDraw();});});
on("#cnReset","click",function(){cn={h:0,n:0};cnDraw()});
function fmt(v){return v>=1e15?v.toExponential(1):Math.round(v).toLocaleString()}
function boDraw(){var box=$("#boBars");if(!box)return;var n=Math.max(1,Math.round(Math.pow(10,parseFloat($("#boN").value)))),lg=Math.max(1,Math.log2(n));
  $("#boNV").textContent=n.toLocaleString()+" items (bars use a compressed scale)";box.textContent="";
  [["O(1)",1],["O(log n)",lg],["O(n)",n],["O(n log n)",n*lg],["O(n²)",n*n]].forEach(function(r){var row=document.createElement("div"),a=document.createElement("span"),w=document.createElement("span"),bar=document.createElement("i"),c=document.createElement("span");
    row.style.gridTemplateColumns="90px 1fr 150px";a.textContent=r[0];bar.style.width=Math.max(1,100*Math.log10(r[1]+1)/12.1)+"%";w.appendChild(bar);c.className="read";c.textContent=fmt(r[1])+(r[1]<2?" step":" steps");row.appendChild(a);row.appendChild(w);row.appendChild(c);box.appendChild(row);});}
on("#boN","input",boDraw);
var BS=[3,8,12,17,21,26,30,34,39,45,52,58,63,71,80],bs;
function bsNew(){bs={t:BS[Math.floor(Math.random()*BS.length)],lo:0,hi:BS.length-1,mid:-1,found:false,steps:0};bsDraw();}
function bsDraw(){var row=$("#bsRow");if(!row)return;row.textContent="";BS.forEach(function(v,i){var s=document.createElement("span");s.textContent=String(v);s.style.background="var(--sunk)";s.style.minWidth="2.4em";s.style.textAlign="center";
    if(i<bs.lo||i>bs.hi)s.style.opacity=".28";if(i===bs.mid){s.style.outline="3px solid var(--accent)";}if(bs.found&&i===bs.mid){s.style.background="var(--good-bg)";s.style.outline="3px solid var(--good)";}row.appendChild(s);});
  var m="Target: "+bs.t+".  ";
  if(bs.steps===0)m+="Press Step to check the middle item.";
  else if(bs.found)m+="Found in "+bs.steps+(bs.steps===1?" step":" steps")+". Checking one by one from the left would have taken "+(BS.indexOf(bs.t)+1)+".";
  else m+="Checked "+BS[bs.mid]+": target is "+(bs.t>BS[bs.mid]?"larger, so discard the left part.":"smaller, so discard the right part.");
  $("#bsRead").textContent=m;}
on("#bsStep","click",function(){if(bs.found)return;
  if(bs.mid>=0){if(bs.t>BS[bs.mid])bs.lo=bs.mid+1;else bs.hi=bs.mid-1;}
  bs.mid=Math.floor((bs.lo+bs.hi)/2);bs.steps++;if(BS[bs.mid]===bs.t)bs.found=true;bsDraw();});
on("#bsNew","click",bsNew);
function redrawAll(){gdDraw();pfDraw();lnDraw();vcDraw();tgDraw();}
if($("#tpBars"))tpDraw();
if($("#tkIn"))tkRun();
if($("#rgQ"))rgRun();
if($("#ccR"))ccRun();
if($("#cnBars"))cnDraw();
if($("#boBars"))boDraw();
if($("#bsRow"))bsNew();
redrawAll();
try{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",redrawAll);}catch(e){}
try{new MutationObserver(redrawAll).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});}catch(e){}
}
