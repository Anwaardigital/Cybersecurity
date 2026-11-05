/* CyberSec Hub — learning progress tracker.
   Everything is stored ONLY in the visitor's own browser (localStorage).
   Nothing is sent to any server. Clearing browser data erases progress.
   See privacy.html ("Learning Progress, Leaderboard & Certificates"). */
(function(){
'use strict';
var KEY='hubProgressV1';
var GUIDE_POINTS=10;
var MISSION_POINTS={'mission-1':100,'mission-2':300,'mission-3':400,'mission-4':300,'mission-5':200};
var TOTAL_GUIDES=68;
var TOTAL_MISSIONS=5;

function load(){
  try{
    var raw=localStorage.getItem(KEY);
    if(!raw) return {guides:{},missions:{},name:''};
    var d=JSON.parse(raw);
    if(!d||typeof d!=='object') return {guides:{},missions:{},name:''};
    d.guides=d.guides||{};
    d.missions=d.missions||{};
    d.name=typeof d.name==='string'?d.name:'';
    return d;
  }catch(e){ return {guides:{},missions:{},name:''}; }
}
function save(d){
  try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){}
}
function guideCount(d){ return Object.keys(d.guides).length; }
function missionCount(d){ return Object.keys(d.missions).length; }
function points(d){
  var p=guideCount(d)*GUIDE_POINTS, k;
  for(k in d.missions){ if(Object.prototype.hasOwnProperty.call(d.missions,k)){ p+=MISSION_POINTS[k]||0; } }
  return p;
}
function rank(p){
  if(p>=1000) return 'Elite Guardian';
  if(p>=600) return 'Guardian';
  if(p>=300) return 'Defender';
  if(p>=100) return 'Learner';
  if(p>0) return 'Rookie';
  return 'Newcomer';
}
function isGuideDone(d,slug){ return !!d.guides[slug]; }
function isMissionDone(d,slug){ return !!d.missions[slug]; }
function completeGuide(slug,title){
  var d=load();
  var isNew=!d.guides[slug];
  d.guides[slug]={title:title||slug,date:new Date().toISOString().slice(0,10)};
  save(d);
  return isNew;
}
function completeMission(slug){
  var d=load();
  var isNew=!d.missions[slug];
  d.missions[slug]={date:new Date().toISOString().slice(0,10)};
  save(d);
  return isNew;
}
function setName(name){
  var d=load();
  d.name=(name||'').trim().slice(0,60);
  save(d);
  return d.name;
}
function reset(){
  try{ localStorage.removeItem(KEY); }catch(e){}
}

/* --- guide page "Mark as complete" box --- */
function renderGuideBox(){
  var boxes=document.querySelectorAll('.progress-box');
  if(!boxes.length) return;
  var d=load();
  boxes.forEach(function(box){
    var slug=box.getAttribute('data-guide');
    var btn=box.querySelector('.hub-complete-btn');
    var done=box.querySelector('.hub-complete-done');
    if(!slug||!btn||!done) return;
    if(isGuideDone(d,slug)){ btn.style.display='none'; done.style.display=''; }
    btn.addEventListener('click',function(){
      var title=box.getAttribute('data-title')||document.title;
      completeGuide(slug,title);
      btn.style.display='none';
      done.style.display='';
      renderWidget();
    });
  });
}

/* --- homepage progress widget --- */
function renderWidget(){
  var w=document.getElementById('hubProgressWidget');
  if(!w) return;
  var d=load();
  var g=guideCount(d), m=missionCount(d), p=points(d);
  var pct=TOTAL_GUIDES?Math.round(g/TOTAL_GUIDES*100):0;
  var base=w.getAttribute('data-base')||'';
  var L={
    title:w.getAttribute('data-label-title')||'Your Learning Progress',
    guides:w.getAttribute('data-label-guides')||'guides completed',
    missions:w.getAttribute('data-label-missions')||'missions completed',
    points:w.getAttribute('data-label-points')||'points',
    rank:w.getAttribute('data-label-rank')||'Rank',
    start:w.getAttribute('data-label-start')||'Mark any guide as complete to start tracking — your progress is saved in your browser only, never sent anywhere.',
    view:w.getAttribute('data-label-view')||'View leaderboard',
    cert:w.getAttribute('data-label-cert')||'Get your certificate',
    paths:w.getAttribute('data-label-paths')||'Continue a learning path'
  };
  w.innerHTML=
    '<h3>'+L.title+'</h3>'+
    '<p class="hub-progress-line"><strong>'+g+' / '+TOTAL_GUIDES+'</strong> '+L.guides+' &nbsp;·&nbsp; <strong>'+m+' / '+TOTAL_MISSIONS+'</strong> '+L.missions+' &nbsp;·&nbsp; <strong>'+p+'</strong> '+L.points+' &nbsp;·&nbsp; '+L.rank+': <strong>'+rank(p)+'</strong></p>'+
    '<div class="pbar" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><div class="pbar-fill" style="width:'+pct+'%"></div></div>'+
    (g===0&&m===0?'<p class="hub-progress-note">'+L.start+'</p>':'')+
    '<p class="hub-progress-links"><a href="'+base+'leaderboard.html">'+L.view+' →</a> &nbsp;·&nbsp; <a href="'+base+'certificate.html">'+L.cert+' →</a> &nbsp;·&nbsp; <a href="'+base+'learning-path.html">'+L.paths+' →</a></p>';
}

function init(){
  renderGuideBox();
  renderWidget();
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}

window.HubProgress={
  load:load, save:save, points:points, rank:rank,
  guideCount:guideCount, missionCount:missionCount,
  isGuideDone:isGuideDone, isMissionDone:isMissionDone,
  completeGuide:completeGuide, completeMission:completeMission,
  setName:setName, reset:reset,
  TOTAL_GUIDES:TOTAL_GUIDES, TOTAL_MISSIONS:TOTAL_MISSIONS,
  GUIDE_POINTS:GUIDE_POINTS, MISSION_POINTS:MISSION_POINTS,
  renderWidget:renderWidget, renderGuideBox:renderGuideBox
};
})();
