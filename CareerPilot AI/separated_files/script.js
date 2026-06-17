
// CURSOR
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  setTimeout(() => {
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
  }, 60);
});
document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%,-50%) scale(2)');
document.addEventListener('mouseup', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');

// LOADING
let progress = 0;
const fill = document.getElementById('load-fill');
const loadInt = setInterval(() => {
  progress += Math.random() * 15;
  if (progress >= 100) {
    progress = 100;
    fill.style.width = '100%';
    clearInterval(loadInt);
    setTimeout(() => {
      document.getElementById('loading').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        initPage();
      }, 800);
    }, 400);
  }
  fill.style.width = progress + '%';
}, 100);

// PARTICLES in loading
for (let i = 0; i < 20; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `width:${Math.random()*6+2}px;height:${Math.random()*6+2}px;background:${Math.random()>0.5?'#7c3aed':'#f59e0b'};left:${Math.random()*100}%;animation-duration:${Math.random()*3+2}s;animation-delay:${Math.random()*2}s`;
  document.getElementById('loading').appendChild(p);
}

// NAVIGATION
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(page.toLowerCase().replace('-',' '))) n.classList.add('active');
  });
}
function showPage(p) { navigate(p); }
function logout() { showNotif('Logged out successfully','var(--gold2)'); }

// NOTIFICATIONS
function showNotif(msg, color = 'var(--purple3)', icon = '✓') {
  const n = document.createElement('div');
  n.className = 'notif-item';
  n.innerHTML = `<div class="notif-dot" style="background:${color}"></div>${msg}`;
  document.getElementById('notif').appendChild(n);
  setTimeout(() => n.remove(), 3500);
}

// INIT DATA
function initPage() {
  renderJobs();
  renderCourses();
  renderLeaderboard();
  renderCerts();
  initChat();
  showNotif('Welcome back, Arjun! 👋', '#4ade80');
  setTimeout(() => showNotif('New job matches found: 3 internships','var(--gold2)'), 2000);
}

// JOBS DATA
const jobsData = [
  {title:'Software Engineer Intern', company:'Google', location:'Bangalore', type:'Internship', salary:'₹60K/mo', skills:['Python','React','GCP'], match:95},
  {title:'Frontend Developer', company:'Razorpay', location:'Remote', type:'Full-Time', salary:'₹8–12 LPA', skills:['React','CSS','TypeScript'], match:88},
  {title:'ML Engineer Intern', company:'Microsoft', location:'Hyderabad', type:'Internship', salary:'₹50K/mo', skills:['Python','ML','TensorFlow'], match:82},
  {title:'Full Stack Developer', company:'Swiggy', location:'Bangalore', type:'Full-Time', salary:'₹10–15 LPA', skills:['Node.js','React','MongoDB'], match:91},
  {title:'Data Analyst', company:'Flipkart', location:'Mumbai', type:'Full-Time', salary:'₹6–9 LPA', skills:['SQL','Python','Tableau'], match:78},
  {title:'DevOps Intern', company:'Amazon', location:'Bangalore', type:'Internship', salary:'₹55K/mo', skills:['AWS','Docker','Linux'], match:85},
];

function renderJobs() {
  const grid = document.getElementById('jobs-grid');
  if (!grid) return;
  grid.innerHTML = jobsData.map(j => `
    <div class="job-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.5rem">
        <div class="job-title">${j.title}</div>
        <div class="badge badge-green" style="flex-shrink:0;margin-left:0.5rem">${j.match}% match</div>
      </div>
      <div class="job-co">🏢 ${j.company}</div>
      <div class="job-meta">
        <span class="badge badge-purple">📍 ${j.location}</span>
        <span class="badge badge-gold">${j.type}</span>
        <span style="font-size:0.75rem;color:var(--gold2)">💰 ${j.salary}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.7rem">${j.skills.map(s=>`<span class="keyword-found">${s}</span>`).join('')}</div>
      <button class="btn btn-primary" style="width:100%;margin-top:0.8rem;font-size:0.8rem" onclick="showNotif('Applied to ${j.title} at ${j.company}!','#4ade80')">Apply Now →</button>
    </div>
  `).join('');
}

// COURSES DATA
const coursesData = [
  {title:'Data Structures & Algorithms', provider:'LeetCode', duration:'8 weeks', level:'Intermediate', free:true, tags:['DSA','Python','Problem Solving'], score_boost:'+12'},
  {title:'System Design Fundamentals', provider:'Grokking', duration:'6 weeks', level:'Advanced', free:false, tags:['Architecture','Scalability'], score_boost:'+10'},
  {title:'Machine Learning A-Z', provider:'Coursera', duration:'12 weeks', level:'Beginner', free:false, tags:['ML','Python','AI'], score_boost:'+15'},
  {title:'AWS Cloud Practitioner', provider:'AWS', duration:'4 weeks', level:'Beginner', free:false, tags:['Cloud','AWS','DevOps'], score_boost:'+8'},
  {title:'Full Stack React & Node', provider:'Udemy', duration:'10 weeks', level:'Intermediate', free:false, tags:['React','Node','MongoDB'], score_boost:'+11'},
  {title:'SQL Mastery', provider:'Mode Analytics', duration:'3 weeks', level:'Beginner', free:true, tags:['SQL','Database','Analytics'], score_boost:'+6'},
];

function renderCourses() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = coursesData.map(c => `
    <div class="card" style="transition:all 0.25s;cursor:pointer" onmouseover="this.style.borderColor='rgba(124,58,237,0.4)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem">
        <span class="badge ${c.free ? 'badge-green' : 'badge-purple'}">${c.free ? '🆓 Free' : '💎 Paid'}</span>
        <span style="font-size:0.75rem;color:var(--gold2);font-weight:600">${c.score_boost} score</span>
      </div>
      <div style="font-family:'Syne',sans-serif;font-size:0.92rem;font-weight:600;margin-bottom:0.2rem">${c.title}</div>
      <div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.5rem">${c.provider} · ${c.duration} · ${c.level}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.8rem">${c.tags.map(t=>`<span class="badge badge-purple">${t}</span>`).join('')}</div>
      <button class="btn btn-outline" style="width:100%;font-size:0.8rem" onclick="showNotif('Enrolled in ${c.title}!','var(--purple3)')">Enroll Now</button>
    </div>
  `).join('');
}

// LEADERBOARD
const lbData = [
  {name:'Sneha Kapoor', branch:'CSE', score:96, pct:'99th'},
  {name:'Rahul Mehta', branch:'IT', score:92, pct:'97th'},
  {name:'Priya Singh', branch:'AI/ML', score:89, pct:'95th'},
  {name:'Arjun Kumar', branch:'CSE', score:78, pct:'84th', isYou:true},
  {name:'Vikram Nair', branch:'ECE', score:74, pct:'78th'},
  {name:'Ananya Roy', branch:'CSE', score:71, pct:'72nd'},
  {name:'Dev Sharma', branch:'IT', score:68, pct:'65th'},
];

function renderLeaderboard() {
  const el = document.getElementById('lb-list');
  if (!el) return;
  el.innerHTML = lbData.map((u, i) => `
    <div class="lb-row" style="${u.isYou ? 'border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.05)' : ''}">
      <div class="lb-rank rank-${i+1}" style="${i>2?'color:var(--text3)':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
      <div class="avatar" style="width:34px;height:34px;font-size:0.75rem;flex-shrink:0">${u.name.split(' ').map(n=>n[0]).join('')}</div>
      <div style="flex:1"><div style="font-size:0.88rem;font-weight:${u.isYou?'600':'400'}">${u.name}${u.isYou?' <span style="color:var(--gold2);font-size:0.72rem">(You)</span>':''}</div><div style="font-size:0.75rem;color:var(--text3)">${u.branch}</div></div>
      <div style="text-align:right"><div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:${i===0?'var(--gold2)':i<3?'var(--purple3)':'var(--text)'}">${u.score}</div><div style="font-size:0.72rem;color:var(--text3)">${u.pct}</div></div>
    </div>
  `).join('');
}

// CERTIFICATES
const certsData = [
  {name:'AWS Cloud Practitioner', issuer:'Amazon Web Services', skills:['Cloud','AWS','S3','EC2'], marks:'87%', date:'Jan 2025'},
  {name:'Python for Data Science', issuer:'IBM · Coursera', skills:['Python','Pandas','NumPy','ML'], marks:'92%', date:'Nov 2024'},
  {name:'React Development', issuer:'Meta · Coursera', skills:['React','JavaScript','Hooks'], marks:'88%', date:'Sep 2024'},
  {name:'Google Analytics', issuer:'Google', skills:['Analytics','Data','SEO'], marks:'90%', date:'Jul 2024'},
];

function renderCerts() {
  const list = document.getElementById('cert-list');
  if (!list) return;
  list.innerHTML = certsData.map((c,i) => `
    <div class="card" style="margin-bottom:0.7rem;cursor:pointer;transition:all 0.2s" onclick="showCertPreview(${i})" onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;align-items:center;gap:0.8rem">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(245,158,11,0.15));border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem">🎓</div>
        <div style="flex:1">
          <div style="font-size:0.85rem;font-weight:500">${c.name}</div>
          <div style="font-size:0.75rem;color:var(--text3)">${c.issuer} · ${c.date}</div>
        </div>
        <div class="badge badge-gold">${c.marks}</div>
      </div>
    </div>
  `).join('');
}

function showCertPreview(i) {
  const c = certsData[i];
  document.getElementById('cert-preview').style.display = 'block';
  document.getElementById('cert-data').innerHTML = `
    <div style="padding:0.8rem;background:rgba(124,58,237,0.08);border-radius:8px;margin-bottom:0.8rem">
      <div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.3rem">CERTIFICATE NAME</div>
      <div style="font-size:0.9rem;font-weight:500">${c.name}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.8rem">
      <div style="padding:0.6rem;background:rgba(245,158,11,0.08);border-radius:8px">
        <div style="font-size:0.7rem;color:var(--text3)">MARKS</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--gold2)">${c.marks}</div>
      </div>
      <div style="padding:0.6rem;background:rgba(74,222,128,0.08);border-radius:8px">
        <div style="font-size:0.7rem;color:var(--text3)">ISSUED</div>
        <div style="font-size:0.85rem;font-weight:500;color:#4ade80">${c.date}</div>
      </div>
    </div>
    <div style="font-size:0.75rem;color:var(--text3);margin-bottom:0.4rem">EXTRACTED SKILLS</div>
    <div style="display:flex;flex-wrap:wrap;gap:0.4rem">${c.skills.map(s=>`<span class="badge badge-purple">✓ ${s}</span>`).join('')}</div>
    <div style="margin-top:0.8rem;padding:0.6rem;background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;font-size:0.8rem;color:#4ade80">
      🤖 AI Analysis: ${parseFloat(c.marks)>=90 ? 'Excellent score! Eligible for premium job recommendations.' : 'Good performance. Improve to 90%+ for premium placements.'}
    </div>
  `;
}

function simulateCertUpload() {
  showNotif('🎓 Analyzing certificate with AI...', 'var(--purple3)');
  setTimeout(() => { showNotif('✓ Certificate extracted: Skills detected!', '#4ade80'); showCertPreview(0); }, 1500);
}

function simulateResumeUpload() {
  document.getElementById('resume-zone').innerHTML = '<div class="upload-icon">⏳</div><div style="font-size:0.9rem">Scanning with AI ATS Engine...</div>';
  showNotif('Analyzing resume...', 'var(--gold2)');
  setTimeout(() => {
    document.getElementById('ats-results').style.display = 'block';
    document.getElementById('missing-kw').innerHTML = ['Docker','Kubernetes','CI/CD','System Design','REST API','GraphQL','Redis'].map(k=>`<span class="keyword-pill keyword-missing">✗ ${k}</span>`).join('') + ['React','Python','Node.js','SQL','Git','AWS'].map(k=>`<span class="keyword-pill keyword-found">✓ ${k}</span>`).join('');
    document.getElementById('ats-improvements').innerHTML = ['<li>Add quantifiable achievements (e.g., "Improved performance by 30%")</li>','<li>Include more technical keywords: Docker, CI/CD, System Design</li>','<li>Add a professional summary at the top</li>','<li>Use action verbs: Developed, Optimized, Implemented</li>','<li>Mention project links (GitHub, deployment URLs)</li>'].join('');
    document.getElementById('resume-zone').innerHTML = '<div class="upload-icon">✅</div><div style="font-size:0.9rem;color:#4ade80">Resume_Arjun_Kumar.pdf</div>';
    showNotif('ATS Score: 72/100 · 5 improvements suggested', '#4ade80');
  }, 2000);
}

// APTITUDE TEST
const questions = [
  {q:'A train 150m long passes a pole in 12 seconds. What is its speed?', opts:['12.5 m/s','14.5 m/s','15.5 m/s','10 m/s'], ans:0, sec:'Quantitative'},
  {q:'If 20% of a number is 50, what is 40% of that number?', opts:['80','100','120','90'], ans:1, sec:'Quantitative'},
  {q:'What comes next: 2, 4, 8, 16, __', opts:['24','32','28','20'], ans:1, sec:'Quantitative'},
  {q:'A is 2 years older than B who is twice as old as C. If A+B+C=27, how old is B?', opts:['8','10','12','14'], ans:1, sec:'Quantitative'},
  {q:'Look at this series: 36, 34, 30, 28, 24, ... What comes next?', opts:['20','22','23','26'], ans:1, sec:'Quantitative'},
  {q:'All cats are animals. All dogs are animals. Which is definitely true?', opts:['All cats are dogs','Some animals are cats','All animals are cats','Cats are dogs'], ans:1, sec:'Logical'},
  {q:'If MANGO is coded as OCPIQ, how is APPLE coded?', opts:['CRNNG','CRNNF','CQMNE','DSOOH'], ans:0, sec:'Logical'},
  {q:'Find the odd one out: Rose, Lotus, Marigold, Jasmine, Mango', opts:['Rose','Lotus','Mango','Jasmine'], ans:2, sec:'Logical'},
  {q:'A is to B as C is to D means:', opts:['A=C and B=D','Ratio A:B = Ratio C:D','A+B=C+D','All of the above'], ans:1, sec:'Logical'},
  {q:'Complete: Book is to Library as Painting is to ___', opts:['Canvas','Gallery','Artist','Museum'], ans:1, sec:'Logical'},
  {q:'Choose the word closest in meaning to EPHEMERAL:', opts:['Eternal','Temporary','Strong','Ancient'], ans:1, sec:'Verbal'},
  {q:'Antonym of BENEVOLENT:', opts:['Kind','Generous','Malevolent','Friendly'], ans:2, sec:'Verbal'},
  {q:'Fill in the blank: The manager was __ with the team\'s performance.', opts:['Satisfied','Satisfy','Satisfying','Satisfaction'], ans:0, sec:'Verbal'},
  {q:'Choose the correctly spelled word:', opts:['Accomodation','Accommodation','Acommodation','Accommodaton'], ans:1, sec:'Verbal'},
  {q:'Rearrange: [was / He / player / a / good]', opts:['He was a good player','He good was player a','Good player he was a','Was he a good player'], ans:0, sec:'Verbal'},
];

let currentQ = 0, answers = [], timerSec = 30*60, timerInt, testStart;

function startTest() {
  document.getElementById('test-start').style.display = 'none';
  document.getElementById('test-active').style.display = 'block';
  answers = new Array(questions.length).fill(-1);
  testStart = Date.now();
  timerSec = 30 * 60;
  currentQ = 0;
  renderQ();
  timerInt = setInterval(() => {
    timerSec--;
    const m = Math.floor(timerSec / 60);
    const s = timerSec % 60;
    document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    document.getElementById('timer-display').style.color = timerSec < 300 ? '#f87171' : 'var(--gold2)';
    if (timerSec <= 0) submitTest();
  }, 1000);
}

function renderQ() {
  const q = questions[currentQ];
  document.getElementById('q-num').textContent = currentQ + 1;
  document.getElementById('test-section').textContent = q.sec;
  document.getElementById('test-progress').style.width = ((currentQ+1)/questions.length*100) + '%';
  document.getElementById('q-container').innerHTML = `
    <div class="question-card">
      <div style="font-size:0.78rem;color:var(--text3);margin-bottom:0.6rem">${q.sec}</div>
      <div style="font-size:0.92rem;font-weight:500;margin-bottom:1rem;line-height:1.5">${currentQ+1}. ${q.q}</div>
      ${q.opts.map((o,i) => `<div class="option ${answers[currentQ]===i?'selected':''}" onclick="selectOpt(${i})">${String.fromCharCode(65+i)}. ${o}</div>`).join('')}
    </div>
  `;
  document.getElementById('btn-prev').disabled = currentQ === 0;
  document.getElementById('btn-next').style.display = currentQ < questions.length - 1 ? 'inline-flex' : 'none';
  document.getElementById('btn-submit').style.display = currentQ === questions.length - 1 ? 'inline-flex' : 'none';
}

function selectOpt(i) {
  answers[currentQ] = i;
  renderQ();
}
function nextQ() { if (currentQ < questions.length - 1) { currentQ++; renderQ(); } }
function prevQ() { if (currentQ > 0) { currentQ--; renderQ(); } }

function submitTest() {
  clearInterval(timerInt);
  const elapsed = Math.floor((Date.now() - testStart) / 60000);
  const correct = answers.filter((a, i) => a === questions[i].ans).length;
  const pct = Math.round(50 + (correct / questions.length) * 50);
  document.getElementById('test-active').style.display = 'none';
  document.getElementById('test-results').style.display = 'block';
  document.getElementById('res-score').textContent = `${correct}/15`;
  document.getElementById('res-pct').textContent = pct + 'th';
  document.getElementById('res-time').textContent = Math.min(elapsed, 30) + ' min';
  const sections = ['Quantitative', 'Logical', 'Verbal'];
  document.getElementById('perf-breakdown').innerHTML = sections.map(sec => {
    const qs = questions.filter(q => q.sec === sec);
    const idx = questions.reduce((acc,q,i) => { if(q.sec===sec) acc.push(i); return acc; }, []);
    const cor = idx.filter(i => answers[i] === questions[i].ans).length;
    const pct = Math.round((cor / qs.length) * 100);
    return `<div style="margin-bottom:0.8rem">
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px"><span>${sec}</span><span style="color:var(--gold2)">${cor}/${qs.length} (${pct}%)</span></div>
      <div class="progress-wrap"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
  showNotif(`Test submitted! Score: ${correct}/15 · ${pct}th percentile`, '#4ade80');
}

function resetTest() {
  document.getElementById('test-results').style.display = 'none';
  document.getElementById('test-start').style.display = 'block';
}

// CHAT (NOVA AI)
let chatStep = 0, chatCtx = {};

function initChat() {
  addMsg('bot', "Hi! I'm NOVA — your AI Career Advisor 🚀\n\nI'll guide you to the perfect career path. Let's start!\n\nWhat's your current education level?");
  showOpts(['10th', '12th', 'Diploma', 'Graduate']);
}

function toggleChat() {
  const win = document.getElementById('chat-win');
  win.classList.toggle('open');
}

function addMsg(role, text) {
  const msgs = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showOpts(opts) {
  const area = document.getElementById('chat-options-area');
  area.innerHTML = opts.map(o => `<button class="chat-opt" onclick="selectOpt2('${o}')">${o}</button>`).join('');
}

function clearOpts() { document.getElementById('chat-options-area').innerHTML = ''; }

function selectOpt2(opt) {
  addMsg('user', opt);
  clearOpts();
  chatCtx[chatStep] = opt;

  setTimeout(() => {
    if (chatStep === 0) {
      if (opt === '12th') {
        addMsg('bot', 'What stream are you in?');
        showOpts(['Science', 'Commerce', 'Arts']);
      } else if (opt === 'Graduate' || opt === 'Diploma') {
        addMsg('bot', 'Which field are you in?');
        showOpts(['Engineering', 'BCA/BSc', 'Commerce', 'Arts/Humanities']);
      } else {
        addMsg('bot', 'Great! For 10th students, focus on building foundational skills. I recommend:\n\n📚 Python Basics\n🔢 Math & Logic\n💻 Computer Fundamentals\n\nWant to explore a specific subject?');
        showOpts(['Programming', 'Science', 'Mathematics', 'Start Over']);
      }
    } else if (chatStep === 1 && chatCtx[0] === '12th') {
      if (opt === 'Science') {
        addMsg('bot', 'Which degree are you pursuing / planning?');
        showOpts(['BCA', 'BSc Computer Science', 'Engineering', 'BSc Physics/Maths']);
      } else {
        addMsg('bot', `For ${opt} stream, here are your best career paths:\n\n${opt === 'Commerce' ? '📊 CA/CMA\n💹 Finance & Banking\n📈 MBA\n🛒 E-Commerce' : '🎨 Design & Media\n📢 Marketing\n📝 Content & Journalism\n🧑‍💼 HR & Management'}\n\nWould you like detailed info on any path?`);
        showOpts(['Career Paths', 'Required Skills', 'Salary Info', 'Start Over']);
      }
    } else if (chatStep === 2 && chatCtx[1] === 'Science') {
      if (opt === 'Engineering') {
        addMsg('bot', 'Which engineering branch?');
        showOpts(['CSE', 'IT', 'AI/ML', 'Mechanical', 'Civil', 'ECE']);
      } else {
        addMsg('bot', 'Great choice! For ' + opt + ', recommended paths:\n\n💻 Software Development\n📊 Data Science\n🔐 Cybersecurity\n☁️ Cloud Computing\n\nYour target skills: Python, Data Structures, SQL, Cloud platforms');
        showOpts(['View Job Roles', 'Skill Roadmap', 'Start Over']);
      }
    } else if (chatStep === 3) {
      const salaries = {CSE:'₹6–25 LPA', IT:'₹5–20 LPA', 'AI/ML':'₹8–30 LPA', Mechanical:'₹4–15 LPA', Civil:'₹3–12 LPA', ECE:'₹5–18 LPA'};
      const roles = {CSE:['Software Engineer','Full Stack Dev','DevOps','Data Scientist'], IT:['Network Engineer','System Admin','Cloud Architect'], 'AI/ML':['ML Engineer','Data Scientist','AI Researcher','NLP Engineer']};
      addMsg('bot', `🎯 Career Path for ${opt} Engineering:\n\n📋 Top Job Roles:\n${(roles[opt] || ['Software Engineer','Technical Lead']).map(r=>'• '+r).join('\n')}\n\n💰 Salary Range: ${salaries[opt] || '₹5–20 LPA'}\n\n🔑 Key Skills:\n• Data Structures & Algorithms\n• ${opt === 'AI/ML' ? 'Python, TensorFlow, PyTorch' : 'Programming Languages'}\n• System Design\n• Communication`);
      showOpts(['View Courses', 'Job Listings', 'Ask a Question', 'Start Over']);
    } else {
      if (opt === 'Start Over') { chatStep = -1; setTimeout(() => { addMsg('bot', "Let's start fresh! What's your education level?"); showOpts(['10th', '12th', 'Diploma', 'Graduate']); }, 300); }
      else if (opt === 'View Courses') { toggleChat(); navigate('courses'); }
      else if (opt === 'Job Listings') { toggleChat(); navigate('jobs'); }
      else { addMsg('bot', "Great! You can explore the Jobs section for live listings, or ask me any specific question below."); showOpts(['View Jobs', 'Start Over']); }
    }
    chatStep++;
  }, 600);
}

function sendUserMsg() {
  const inp = document.getElementById('chat-in');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  addMsg('user', msg);
  clearOpts();
  setTimeout(() => {
    const responses = {
      'salary': '💰 Salary varies by role and company. For freshers in India:\n• Software Engineer: ₹3–8 LPA\n• Data Scientist: ₹6–15 LPA\n• ML Engineer: ₹8–20 LPA\n• Product Manager: ₹12–25 LPA',
      'skills': '🔑 Top skills in demand (2025):\n• AI/ML & Prompt Engineering\n• Cloud (AWS/Azure/GCP)\n• Full Stack (React + Node)\n• Data Science & Analytics\n• DevOps & CI/CD',
      'resume': '📄 Resume Tips:\n• Keep it to 1 page\n• Use action verbs\n• Add quantifiable results\n• Include GitHub/portfolio links\n• Use ATS-friendly format',
    };
    const key = Object.keys(responses).find(k => msg.toLowerCase().includes(k));
    addMsg('bot', key ? responses[key] : `That's a great question about "${msg}"! Based on current industry trends, I'd recommend focusing on building practical projects and getting certified. Would you like me to suggest specific resources for this? 🤖`);
    showOpts(['Learn More', 'View Courses', 'Back to Guide']);
  }, 800);
}

// Mobile menu
if (window.innerWidth <= 768) {
  document.getElementById('menu-btn').style.display = 'block';
}
window.addEventListener('resize', () => {
  document.getElementById('menu-btn').style.display = window.innerWidth <= 768 ? 'block' : 'none';
});

