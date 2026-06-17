// ===== AUTH & API HELPERS =====
const TOKEN = localStorage.getItem('cp_token');
if (!TOKEN) window.location.href = '/';

const API = (url, opts = {}) => {
  opts.headers = { ...opts.headers, 'Authorization': 'Bearer ' + TOKEN };
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(url, opts).then(r => { if (r.status === 401) { localStorage.clear(); window.location.href = '/'; } return r.json(); });
};

// ===== CURSOR =====
const cursor = document.getElementById('cursor'), ring = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
  setTimeout(() => { ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; }, 60);
});
document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%,-50%) scale(2)');
document.addEventListener('mouseup', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');

// ===== LOADING =====
let progress = 0;
const fill = document.getElementById('load-fill');
const loadInt = setInterval(() => {
  progress += Math.random() * 15;
  if (progress >= 100) { progress = 100; fill.style.width = '100%'; clearInterval(loadInt);
    setTimeout(() => { document.getElementById('loading').style.opacity = '0';
      setTimeout(() => { document.getElementById('loading').style.display = 'none'; document.getElementById('app').style.display = 'block'; initApp(); }, 800);
    }, 400);
  } fill.style.width = progress + '%';
}, 100);
for (let i = 0; i < 15; i++) { const p = document.createElement('div'); p.className = 'particle';
  p.style.cssText = `width:${Math.random()*6+2}px;height:${Math.random()*6+2}px;background:${Math.random()>0.5?'#7c3aed':'#f59e0b'};left:${Math.random()*100}%;animation-duration:${Math.random()*3+2}s;animation-delay:${Math.random()*2}s`;
  document.getElementById('loading').appendChild(p);
}

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-' + page); if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => { if (n.textContent.toLowerCase().includes(page.replace('-',' '))) n.classList.add('active'); });
  if (page === 'jobs') loadJobs(); if (page === 'courses') loadCourses();
  if (page === 'leaderboard') loadLeaderboard(); if (page === 'certificates') loadCerts();
  if (page === 'profile') loadProfile();
}

// ===== NOTIFICATIONS =====
function showNotif(msg, color = 'var(--purple3)') {
  const n = document.createElement('div'); n.className = 'notif-item';
  n.innerHTML = `<div class="notif-dot" style="background:${color}"></div>${msg}`;
  document.getElementById('notif').appendChild(n); setTimeout(() => n.remove(), 3500);
}

// ===== INIT =====
let userData = {};
async function initApp() {
  try {
    const data = await API('/api/profile');
    userData = data.user;
    updateUI(data.user, data.activities);
    showNotif('Welcome back, ' + data.user.name.split(' ')[0] + '! 👋', '#4ade80');
  } catch(e) { showNotif('Error loading profile', '#f87171'); }
  if (window.innerWidth <= 768) document.getElementById('menu-btn').style.display = 'block';
  window.addEventListener('resize', () => { document.getElementById('menu-btn').style.display = window.innerWidth <= 768 ? 'block' : 'none'; });
}

function getInitials(name) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

function updateUI(u, activities) {
  const initials = getInitials(u.name);
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = u.name;
  document.getElementById('sidebar-role').textContent = (u.branch || '—') + ' · ' + (u.year || '—');
  document.getElementById('sidebar-score').textContent = u.careerScore;
  document.getElementById('topbar-name').textContent = u.name.split(' ')[0];
  document.getElementById('topbar-score').textContent = '🔥 ' + u.careerScore + '/100 Score';
  document.getElementById('topbar-avatar').textContent = initials;
  // Dashboard
  document.getElementById('dash-score').textContent = u.careerScore;
  document.getElementById('dash-score-bar').style.width = u.careerScore + '%';
  document.getElementById('dash-profile').textContent = u.profileCompletion + '%';
  document.getElementById('dash-profile-bar').style.width = u.profileCompletion + '%';
  document.getElementById('dash-pct').textContent = u.testPercentile > 0 ? u.testPercentile + 'th' : '--';
  document.getElementById('dash-pct-bar').style.width = (u.testPercentile || 0) + '%';
  document.getElementById('dash-certs').textContent = u.certsCount || 0;
  document.getElementById('dash-certs-bar').style.width = Math.min((u.certsCount || 0) * 25, 100) + '%';
  // Conditional Actions based on score
  const acts = [];
  if (u.testPercentile === 0) acts.push({icon:'📝',t:'Take Aptitude Test',d:'Boost your percentile',p:'aptitude'});
  if (u.certsCount < 3) acts.push({icon:'🎓',t:'Upload Certificates',d:'+5 score per cert',p:'certificates'});
  if (u.resumeAtsScore === 0) acts.push({icon:'📄',t:'Scan Your Resume',d:'Get ATS analysis',p:'resume'});
  if (u.careerScore >= 85) {
    acts.push({icon:'💼',t:'View Job Matches',d:'You qualify! Score 85+',p:'jobs'});
  } else {
    acts.push({icon:'📚',t:'Take Courses',d:`Need ${85 - u.careerScore} more points for jobs`,p:'courses'});
  }
  document.getElementById('dash-actions').innerHTML = acts.map(a => `<div onclick="navigate('${a.p}')" style="padding:0.9rem;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:10px;cursor:pointer"><div style="font-size:1.1rem;margin-bottom:0.4rem">${a.icon}</div><div style="font-size:0.85rem;font-weight:500;margin-bottom:0.2rem">${a.t}</div><div style="font-size:0.75rem;color:var(--text3)">${a.d}</div></div>`).join('');
  // Activities
  if (activities && activities.length > 0) {
    document.getElementById('activities').innerHTML = activities.map(a => `<div style="display:flex;gap:0.8rem;align-items:flex-start;padding:0.7rem 0;border-bottom:1px solid var(--border)"><div style="width:34px;height:34px;border-radius:8px;background:rgba(124,58,237,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem">${a.icon||'⚡'}</div><div><div style="font-size:0.85rem;font-weight:500">${a.title}</div><div style="font-size:0.75rem;color:var(--text3)">${a.description} · ${timeAgo(a.createdAt)}</div></div></div>`).join('');
  } else { document.getElementById('activities').innerHTML = '<div style="color:var(--text3);font-size:0.85rem;padding:1rem 0">No recent activity. Start by taking a test or uploading certificates!</div>'; }
}

function timeAgo(d) { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s/60) + 'm ago'; if (s < 86400) return Math.floor(s/3600) + 'h ago'; return Math.floor(s/86400) + 'd ago'; }

// ===== JOBS =====
async function loadJobs() {
  const type = document.getElementById('filter-type').value;
  const loc = document.getElementById('filter-location').value;
  const res = await API(`/api/jobs?type=${encodeURIComponent(type)}&location=${encodeURIComponent(loc)}`);
  if (!res.eligible) {
    document.getElementById('jobs-subtitle').textContent = '';
    document.getElementById('jobs-grid').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem"><div style="font-size:3rem;margin-bottom:1rem">🔒</div><div style="font-family:'Syne',sans-serif;font-size:1.2rem;margin-bottom:0.5rem">Career Score Too Low</div><div style="color:var(--text2);font-size:0.9rem;margin-bottom:1rem;max-width:400px;margin-left:auto;margin-right:auto">${res.message}</div><div style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;background:linear-gradient(135deg,var(--purple2),var(--gold2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem">${res.score} / 85</div><div class="progress-wrap" style="max-width:300px;margin:0 auto"><div class="progress-fill" style="width:${Math.round(res.score/85*100)}%"></div></div><button class="btn btn-gold" style="margin-top:1.5rem" onclick="navigate('courses')">📚 Take Courses to Improve</button></div>`;
    return;
  }
  document.getElementById('jobs-subtitle').textContent = `AI-matched opportunities · Career Score: ${res.score}/100`;
  document.getElementById('jobs-grid').innerHTML = res.jobs.map(j => `<div class="job-card"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.5rem"><div class="job-title">${j.title}</div><div class="badge badge-green" style="flex-shrink:0;margin-left:0.5rem">${j.match}% match</div></div><div class="job-co">🏢 ${j.company}</div><div class="job-meta"><span class="badge badge-purple">📍 ${j.location}</span><span class="badge badge-gold">${j.type}</span><span style="font-size:0.75rem;color:var(--gold2)">💰 ${j.salary}</span></div><div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.7rem">${j.skills.map(s=>'<span class="keyword-found">'+s+'</span>').join('')}</div><button class="btn btn-primary" style="width:100%;margin-top:0.8rem;font-size:0.8rem" onclick="applyJob(${j.id},'${j.title}','${j.company}')">Apply Now →</button></div>`).join('');
}
async function applyJob(id, title, company) { await API('/api/jobs/apply/' + id, { method: 'POST' }); showNotif(`Applied to ${title} at ${company}!`, '#4ade80'); }

// ===== COURSES =====
async function loadCourses() {
  document.getElementById('courses-grid').innerHTML = '<div style="color:var(--text3);padding:2rem;text-align:center"><span class="spinner"></span> Loading AI-recommended courses...</div>';
  const res = await API('/api/courses');
  const courses = res.courses || res;
  if (!courses.length) { document.getElementById('courses-grid').innerHTML = '<div style="color:var(--text3);padding:2rem;text-align:center">No courses found. Try updating your profile skills.</div>'; return; }
  document.getElementById('courses-grid').innerHTML = courses.map(c => `<div class="card" style="transition:all 0.25s;cursor:pointer" onmouseover="this.style.borderColor='rgba(124,58,237,0.4)'" onmouseout="this.style.borderColor='var(--border)'"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem"><span class="badge ${c.free?'badge-green':'badge-purple'}">${c.free?'🆓 Free':'💎 Paid'}</span><span style="font-size:0.75rem;color:var(--gold2);font-weight:600">+${c.score_boost} score</span></div><div style="font-family:'Syne',sans-serif;font-size:0.92rem;font-weight:600;margin-bottom:0.2rem">${c.title}</div><div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.3rem">${c.provider} · ${c.duration} · ${c.level}</div>${c.description?'<div style="font-size:0.78rem;color:var(--text2);margin-bottom:0.5rem">'+c.description+'</div>':''}<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.8rem">${(c.tags||[]).map(t=>'<span class="badge badge-purple">'+t+'</span>').join('')}</div>${c.url?'<a href="'+c.url+'" target="_blank" class="btn btn-outline" style="width:100%;font-size:0.8rem;text-decoration:none;text-align:center;display:block">Open Course ↗</a>':'<button class="btn btn-outline" style="width:100%;font-size:0.8rem" onclick="enrollCourse('+(c.id||0)+',\''+((c.title||'').replace(/'/g,"\\'"))+'\')">Enroll Now</button>'}</div>`).join('');
}
async function enrollCourse(id, title) { await API('/api/courses/enroll/' + id, { method: 'POST', body: { title } }); showNotif('Enrolled in ' + title + '!', 'var(--purple3)'); }

// ===== LEADERBOARD =====
async function loadLeaderboard() {
  const lb = await API('/api/leaderboard');
  document.getElementById('lb-list').innerHTML = lb.map((u, i) => `<div class="lb-row" style="${u.isYou?'border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.05)':''}"><div class="lb-rank rank-${u.rank}" style="${u.rank>3?'color:var(--text3)':''}">${u.rank===1?'🥇':u.rank===2?'🥈':u.rank===3?'🥉':'#'+u.rank}</div><div class="avatar" style="width:34px;height:34px;font-size:0.75rem;flex-shrink:0">${u.initials}</div><div style="flex:1"><div style="font-size:0.88rem;font-weight:${u.isYou?'600':'400'}">${u.name}${u.isYou?' <span style="color:var(--gold2);font-size:0.72rem">(You)</span>':''}</div><div style="font-size:0.75rem;color:var(--text3)">${u.branch}</div></div><div style="text-align:right"><div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:${u.rank===1?'var(--gold2)':u.rank<=3?'var(--purple3)':'var(--text)'}">${u.score}</div><div style="font-size:0.72rem;color:var(--text3)">${u.percentile}</div></div></div>`).join('');
}

// ===== RESUME =====
async function uploadResume() {
  const file = document.getElementById('resume-file').files[0]; if (!file) return;
  document.getElementById('resume-zone').innerHTML = '<div class="upload-icon">⏳</div><div style="font-size:0.9rem"><span class="spinner"></span>Scanning with AI ATS Engine...</div>';
  showNotif('Analyzing resume with AI...', 'var(--gold2)');
  const fd = new FormData(); fd.append('resume', file);
  try {
    const data = await API('/api/resume/analyze', { method: 'POST', body: fd, headers: { 'Authorization': 'Bearer ' + TOKEN } });
    document.getElementById('ats-results').style.display = 'block';
    document.getElementById('ats-score').textContent = data.atsScore + '/100';
    document.getElementById('ats-bar-fill').style.width = data.atsScore + '%';
    document.getElementById('ats-summary').textContent = data.summary || '';
    document.getElementById('missing-kw').innerHTML = (data.missingKeywords||[]).map(k=>'<span class="keyword-pill keyword-missing">✗ '+k+'</span>').join('') + (data.foundKeywords||[]).map(k=>'<span class="keyword-pill keyword-found">✓ '+k+'</span>').join('');
    document.getElementById('ats-improvements').innerHTML = (data.improvements||[]).map(t=>'<li>'+t+'</li>').join('');
    document.getElementById('resume-zone').innerHTML = '<div class="upload-icon">✅</div><div style="font-size:0.9rem;color:#4ade80">'+file.name+'</div>';
    showNotif('ATS Score: ' + data.atsScore + '/100', '#4ade80');
    refreshDashboard();
  } catch(e) { showNotif('Error analyzing resume', '#f87171'); document.getElementById('resume-zone').innerHTML = '<div class="upload-icon">📄</div><div>Try again</div>'; }
}

// ===== CERTIFICATES =====
async function loadCerts() {
  const certs = await API('/api/certificates');
  const list = document.getElementById('cert-list');
  if (certs.length === 0) { list.innerHTML = '<div style="color:var(--text3);font-size:0.85rem;padding:1rem 0">No certificates uploaded yet.</div>'; return; }
  list.innerHTML = certs.map((c,i) => `<div class="card" style="margin-bottom:0.7rem;cursor:pointer;transition:all 0.2s" onclick='showCertDetail(${JSON.stringify(c).replace(/'/g,"&#39;")})' onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'" onmouseout="this.style.borderColor='var(--border)'"><div style="display:flex;align-items:center;gap:0.8rem"><div style="width:40px;height:40px;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(245,158,11,0.15));border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem">🎓</div><div style="flex:1"><div style="font-size:0.85rem;font-weight:500">${c.name}</div><div style="font-size:0.75rem;color:var(--text3)">${c.issuer} · ${c.date||'N/A'}</div></div><div class="badge badge-gold">${c.marks}</div></div></div>`).join('');
}

function showCertDetail(c) {
  document.getElementById('cert-preview').style.display = 'block';
  document.getElementById('cert-data').innerHTML = `<div style="padding:0.8rem;background:rgba(124,58,237,0.08);border-radius:8px;margin-bottom:0.8rem"><div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.3rem">CERTIFICATE</div><div style="font-size:0.9rem;font-weight:500">${c.name}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.8rem"><div style="padding:0.6rem;background:rgba(245,158,11,0.08);border-radius:8px"><div style="font-size:0.7rem;color:var(--text3)">MARKS</div><div style="font-size:1.1rem;font-weight:700;color:var(--gold2)">${c.marks}</div></div><div style="padding:0.6rem;background:rgba(74,222,128,0.08);border-radius:8px"><div style="font-size:0.7rem;color:var(--text3)">ISSUER</div><div style="font-size:0.85rem;font-weight:500;color:#4ade80">${c.issuer}</div></div></div><div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.4rem">EXTRACTED SKILLS</div><div style="display:flex;flex-wrap:wrap;gap:0.4rem">${(c.skills||[]).map(s=>'<span class="badge badge-purple">✓ '+s+'</span>').join('')}</div>${c.aiAnalysis?'<div style="margin-top:0.8rem;padding:0.6rem;background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;font-size:0.8rem;color:#4ade80">🤖 '+c.aiAnalysis+'</div>':''}`;
}

async function uploadCert() {
  const name = document.getElementById('cert-name').value.trim(); if (!name) { showNotif('Certificate name is required', '#f87171'); return; }
  showNotif('🎓 Analyzing certificate with AI...', 'var(--purple3)');
  const fd = new FormData();
  fd.append('certName', name);
  fd.append('issuer', document.getElementById('cert-issuer').value);
  fd.append('marks', document.getElementById('cert-marks').value);
  fd.append('date', document.getElementById('cert-date').value);
  const file = document.getElementById('cert-file').files[0]; if (file) fd.append('certificate', file);
  try {
    const data = await API('/api/certificates/upload', { method: 'POST', body: fd, headers: { 'Authorization': 'Bearer ' + TOKEN } });
    showNotif('✓ Certificate uploaded! ' + (data.newSkills||[]).length + ' new skills extracted', '#4ade80');
    document.getElementById('cert-upload-form').reset();
    showCertDetail(data.certificate); loadCerts(); refreshDashboard();
  } catch(e) { showNotif('Error uploading certificate', '#f87171'); }
}

// ===== PROFILE =====
async function loadProfile() {
  const data = await API('/api/profile'); const u = data.user; userData = u;
  document.getElementById('profile-avatar').textContent = getInitials(u.name);
  document.getElementById('profile-name').textContent = u.name;
  document.getElementById('profile-email').textContent = u.email;
  document.getElementById('profile-badges').innerHTML = `${u.branch?'<span class="badge badge-gold">'+u.branch+'</span>':''}${u.year?'<span class="badge badge-purple">'+u.year+'</span>':''}`;
  document.getElementById('edit-name').value = u.name; document.getElementById('edit-branch').value = u.branch||'';
  document.getElementById('edit-year').value = u.year||''; document.getElementById('edit-cgpa').value = u.cgpa||'';
  document.getElementById('edit-skills').value = (u.skills||[]).join(', ');
  document.getElementById('prof-completion').textContent = u.profileCompletion + '%';
  document.getElementById('prof-comp-bar').style.width = u.profileCompletion + '%';
  document.getElementById('prof-score').textContent = u.careerScore + '/100';
  document.getElementById('prof-score-bar').style.width = u.careerScore + '%';
  document.getElementById('profile-skills').innerHTML = (u.skills||[]).map(s=>'<span class="badge badge-purple">'+s+'</span>').join('') || '<span style="color:var(--text3);font-size:0.82rem">No skills added yet</span>';
}

async function saveProfile() {
  const skills = document.getElementById('edit-skills').value.split(',').map(s=>s.trim()).filter(Boolean);
  const data = await API('/api/profile', { method: 'PUT', body: { name: document.getElementById('edit-name').value, branch: document.getElementById('edit-branch').value, year: document.getElementById('edit-year').value, cgpa: document.getElementById('edit-cgpa').value, skills } });
  if (data.user) { showNotif('Profile updated successfully!', '#4ade80'); userData = data.user; refreshDashboard(); loadProfile(); }
}

async function refreshDashboard() {
  const data = await API('/api/profile'); userData = data.user; updateUI(data.user, data.activities);
}

// ===== APTITUDE TEST =====
let testQuestions = [], testKey = '', currentQ = 0, answers = [], timerSec = 30*60, timerInt, testStart;

async function startTest() {
  showNotif('Fetching questions from API...', 'var(--gold2)');
  try {
    const data = await API('/api/aptitude/questions');
    if (data.error) { showNotif(data.error, '#f87171'); return; }
    testQuestions = data.questions; testKey = data._key;
    answers = new Array(testQuestions.length).fill(-1); testStart = Date.now(); timerSec = 30*60; currentQ = 0;
    document.getElementById('test-start').style.display = 'none';
    document.getElementById('test-active').style.display = 'block';
    renderQ();
    timerInt = setInterval(() => {
      timerSec--; const m = Math.floor(timerSec/60), s = timerSec%60;
      document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      document.getElementById('timer-display').style.color = timerSec < 300 ? '#f87171' : 'var(--gold2)';
      if (timerSec <= 0) submitTest();
    }, 1000);
  } catch(e) { showNotif('Failed to load questions. Try again.', '#f87171'); }
}

function renderQ() {
  const q = testQuestions[currentQ];
  document.getElementById('q-num').textContent = currentQ + 1;
  document.getElementById('test-section').textContent = q.section;
  document.getElementById('test-progress').style.width = ((currentQ+1)/testQuestions.length*100) + '%';
  document.getElementById('q-container').innerHTML = `<div class="question-card"><div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.6rem">${q.section}</div><div style="font-size:0.92rem;font-weight:500;margin-bottom:1rem;line-height:1.5">${currentQ+1}. ${q.question}</div>${q.options.map((o,i)=>`<div class="option ${answers[currentQ]===i?'selected':''}" onclick="selectOpt(${i})">${String.fromCharCode(65+i)}. ${o}</div>`).join('')}</div>`;
  document.getElementById('btn-prev').disabled = currentQ === 0;
  document.getElementById('btn-next').style.display = currentQ < testQuestions.length-1 ? 'inline-flex' : 'none';
  document.getElementById('btn-submit').style.display = currentQ === testQuestions.length-1 ? 'inline-flex' : 'none';
}
function selectOpt(i) { answers[currentQ] = i; renderQ(); }
function nextQ() { if (currentQ < testQuestions.length-1) { currentQ++; renderQ(); } }
function prevQ() { if (currentQ > 0) { currentQ--; renderQ(); } }

async function submitTest() {
  clearInterval(timerInt);
  const elapsed = Math.floor((Date.now() - testStart) / 60000);
  document.getElementById('test-active').style.display = 'none';
  showNotif('Submitting test...', 'var(--gold2)');
  const sections = [...new Set(testQuestions.map(q => q.section))];
  const data = await API('/api/aptitude/submit', { method: 'POST', body: { answers, _key: testKey, timeTaken: Math.min(elapsed, 30), sections } });
  document.getElementById('test-results').style.display = 'block';
  document.getElementById('res-score').textContent = data.score + '/' + data.totalQuestions;
  document.getElementById('res-pct').textContent = data.percentile + 'th';
  document.getElementById('res-time').textContent = data.timeTaken + ' min';
  document.getElementById('perf-breakdown').innerHTML = (data.sectionBreakdown||[]).map(s => `<div style="margin-bottom:0.8rem"><div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px"><span>${s.section}</span><span style="color:var(--gold2)">${s.correct}/${s.total} (${s.percentage}%)</span></div><div class="progress-wrap"><div class="progress-fill" style="width:${s.percentage}%"></div></div></div>`).join('');
  showNotif(`Test submitted! Score: ${data.score}/${data.totalQuestions} · ${data.percentile}th percentile`, '#4ade80');
  refreshDashboard();
}
function resetTest() { document.getElementById('test-results').style.display = 'none'; document.getElementById('test-start').style.display = 'block'; }

// ===== CHAT (NOVA AI) =====
let chatHistory = [];
function toggleChat() { document.getElementById('chat-win').classList.toggle('open'); if (!document.getElementById('chat-msgs').children.length) addMsg('bot', "Hi! I'm NOVA — your AI Career Advisor 🚀\n\nAsk me anything about careers, skills, interview prep, or salary expectations!"); }
function addMsg(role, text) { const msgs = document.getElementById('chat-msgs'); const d = document.createElement('div'); d.className = 'msg ' + role; d.textContent = text; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; }

async function sendChatMsg() {
  const inp = document.getElementById('chat-in'); const msg = inp.value.trim(); if (!msg) return; inp.value = '';
  addMsg('user', msg); chatHistory.push({ role: 'user', content: msg });
  const typing = document.createElement('div'); typing.className = 'msg bot typing'; typing.textContent = 'NOVA is thinking...';
  document.getElementById('chat-msgs').appendChild(typing);
  document.getElementById('chat-msgs').scrollTop = document.getElementById('chat-msgs').scrollHeight;
  try {
    const data = await API('/api/chat', { method: 'POST', body: { message: msg, history: chatHistory.slice(-10) } });
    typing.remove(); addMsg('bot', data.response); chatHistory.push({ role: 'assistant', content: data.response });
  } catch(e) { typing.remove(); addMsg('bot', 'Sorry, I encountered an error. Please try again.'); }
}

// ===== LOGOUT =====
function logout() { localStorage.clear(); window.location.href = '/'; }
