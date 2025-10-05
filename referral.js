// --- Navigation helpers ---
function handleNavClick(el, page) {
  // Only for demonstration, actual SPA navigation would differ
  window.location.href = page;
}

function getUserKey(key) {
  const username = localStorage.getItem('currentUser');
  return username ? `${username}_${key}` : key;
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(page).classList.remove('hidden');
  if (page === 'register') displayReferralInfo();
}

function showTerms() {
      document.getElementById('termsPopup').style.display = 'block';
    }

    function hideTerms() {
      document.getElementById('termsPopup').style.display = 'none';
    }

function generateReferralCode(username) {
  return username + Math.floor(Math.random() * 10000);
}

// --- Registration with Referral Logic ---
function registerUser() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  let inviterCode = document.getElementById('inviterCode').value.trim();

  // If referral code is not entered, but there is a ref in URL/localStorage, use that
  if (!inviterCode) {
    inviterCode = localStorage.getItem('incomingRefCode') || '';
  }

  if (!username || !password) return alert("Please fill all required fields.");

  if (!localStorage.getItem(`user_${username}`)) {
    const user = {
      username: username,
      password: password,
      referralCode: generateReferralCode(username),
      invited: 0,
      referralEarnings: 0
    };

    // If this user is an invitee
    let newBalance = 0;
    if (inviterCode) {
      newBalance = 0.3; // Invitee gets $0.3

      // Find inviter and update their info
      let foundInviter = false;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_')) {
          const inviter = JSON.parse(localStorage.getItem(key));
          if (inviter.referralCode === inviterCode) {
            // Update invite count and earnings
            inviter.invited = (inviter.invited || 0) + 1;
            inviter.referralEarnings = (inviter.referralEarnings || 0) + 0.3;
            localStorage.setItem(key, JSON.stringify(inviter));
            // Add $0.3 to inviter's mining balance
            const inviterBalanceKey = `${inviter.username}_balance`;
            let inviterBalance = parseFloat(localStorage.getItem(inviterBalanceKey) || '0');
            inviterBalance += 0.3;
            localStorage.setItem(inviterBalanceKey, inviterBalance.toFixed(6));
            foundInviter = true;
          }
        }
      });
      // If the inviter code is invalid (not found), do not give bonus to either
      if (!foundInviter) {
        newBalance = 0;
      }
    }

    localStorage.setItem(`user_${username}`, JSON.stringify(user));
    localStorage.setItem(`${username}_balance`, newBalance.toFixed(6));
    localStorage.setItem('currentUser', username);
    // Remove incomingRefCode after registration to avoid re-using for next registration
    localStorage.removeItem('incomingRefCode');
    alert("Registration Successful, You can now login");
    showPage('login');
  } else {
    alert("Username already exists.");
  }
}

// --- Login Logic: Redirect to mine.html after successful login ---
function loginUser() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!username || !password) return alert("Please enter your credentials.");

  const userData = JSON.parse(localStorage.getItem(`user_${username}`));
  if (!userData || userData.password !== password) {
    return alert("Invalid username or password.");
  }

  localStorage.setItem('currentUser', username);
  // Redirect to mine.html after login
  window.location.href = "mine.html";
}

// --- User Position Logic ---
function getUserPosition(username) {
  // Gather all users
  let users = [];
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('user_')) {
      const user = JSON.parse(localStorage.getItem(key));
      users.push({
        username: user.username,
        invited: user.invited || 0
      });
    }
  });
  // Sort by invited count (descending), then by username for stability
  users.sort((a, b) => {
    if (b.invited === a.invited) {
      return a.username.localeCompare(b.username);
    }
    return b.invited - a.invited;
  });
  // Find current user's position
  let pos = users.findIndex(u => u.username === username);
  if (pos === -1) return "N/A";
  // Position starts from 5135th
  return (5135 + pos) + "th";
}

// --- Display Referral Info ---
function displayReferralInfo() {
  const username = localStorage.getItem('currentUser');
  if (!username) return showPage('login');

  const userData = JSON.parse(localStorage.getItem(`user_${username}`));
  document.getElementById('displayUsername').innerText = userData.username;
  document.getElementById('referralCode').innerText = userData.referralCode;
  // Referral link now points to index.html for inviting
  document.getElementById('referralLink').innerText =
    `${location.origin}${location.pathname.replace(/referral\.html$/, "index.html")}?ref=${userData.referralCode}`;
  const invited = userData.invited || 0;
  document.getElementById('referralCount').innerText = invited > 0 ? invited : 'No invitee yet';
  let earnings = userData.referralEarnings !== undefined ? userData.referralEarnings : (invited * 0.3);
  document.getElementById('referralEarnings').innerText = '$' + (earnings).toFixed(2);

  // Show user position
  let position = getUserPosition(username);
  let positionEl = document.getElementById('userPosition');
  if (!positionEl) {
    positionEl = document.createElement('p');
    positionEl.id = 'userPosition';
    document.querySelector('.card').appendChild(positionEl);
  }
  positionEl.innerHTML = `<strong>Your Position:</strong> <span>${position}</span>`;
}

// --- Logout ---
function logout() {
  localStorage.removeItem('currentUser');
  showPage('login');
}

// --- Copy helpers ---
function copyText(id) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(() => alert("Referral link copied!"));
}
function copyCode() {
  const code = document.getElementById('referralCode').innerText;
  navigator.clipboard.writeText(code).then(() => alert("Referral code copied!"));
}

// --- Web Share API or fallback for referral sharing ---
function shareReferral() {
  const username = localStorage.getItem('currentUser');
  if (!username) return;
  const userData = JSON.parse(localStorage.getItem(`user_${username}`));
  const code = userData.referralCode;
  // Link should go to index.html for registration
  const link = `${location.origin}${location.pathname.replace(/referral\.html$/, "index.html")}?ref=${code}`;
  const shareTitle = "NHCoin Mining & Referral Program";
  const shareText = `Earn free USDT with NHCoin! Register with my referral code: **${code}** and we both get $0.3 instantly. Start mining USDT together!\n\nRegister here: ${link}\n\nNHCoin — Earn by mining and inviting!`;
  const shareUrl = link;
  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: `Earn free USDT with NHCoin! Register with my referral code: ${code} and we both get $0.3 instantly. Start mining with me!\n\n${link}`,
      url: shareUrl
    });
  } else {
    // Fallback: show a dialog with preformatted text for user to copy
    const temp = document.createElement("textarea");
    temp.value = `NHCoin Mining & Referral Program\n\nRegister and mine USDT for free!\n\nMy Referral Code: ${code}\nReferral Link: ${link}\n\nEarn $0.3 instantly for both of us when you join with my code!`;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    alert("Referral message copied! Share it on any platform.");
  }
}

// --- Onload logic: handle referral code from URL, show correct page ---
window.onload = () => {
  // Set incomingRefCode if ?ref= is in URL
  const refCode = new URLSearchParams(window.location.search).get('ref');
  if (refCode) {
    localStorage.setItem('incomingRefCode', refCode);
  }
  const user = localStorage.getItem('currentUser');
  if (user) {
    showPage('referral');
  } else {
    showPage('login');
  }
}

/* Mining and rank logic (unchanged from your original) */
// ... you can leave the mining script as is ...
  (function(){
      const DURATION = 86400000, RATE = 0.00002;
      let timer = null;
      const balanceEl = document.getElementById('balance'),
            countdownEl = document.getElementById('countdown'),
            minedEl = document.getElementById('mined'),
            rankEl = document.getElementById('rank'),
            rankBar = document.getElementById('rankProgress'),
            rankDetails = document.getElementById('rankDetails'),
            minedDates = document.getElementById('minedDates'),
            calendar = document.getElementById('calendarPopup'),
            sound = document.getElementById('miningSound');

      function get(key){ return localStorage.getItem(key); }
      function set(key, val){ localStorage.setItem(key, val); }
      function today(){ return new Date().toISOString().split('T')[0]; }

      function getBalance(){
        const stored = parseFloat(get('balance') || '0');
        const start = parseInt(get('startTime'));
        if (!start) return stored;
        const now = Date.now(), elapsed = Math.min(DURATION, now - start);
        const earned = (elapsed / 1000) * RATE;
        return parseFloat((parseFloat(get('baseBalance') || '0') + earned).toFixed(6));
      }

      function setBalance(val){
        set('balance', val.toFixed(6));
        balanceEl.textContent = '$' + val.toFixed(2);
      }

      function getDays(){ return JSON.parse(get('days') || '[]'); }
      function saveDay(){
        const d = getDays(), t = today();
        if (!d.includes(t)){ d.push(t); set('days', JSON.stringify(d)); }
      }

      function updateRankUI(){
        const days = getDays().length;
        let name='Starter', pct=days/30*100, next='Pioneer', rem=30-days;
        if(days>=90){name='Supreme';pct=100;next=null;}
        else if(days>=60){name='Elite';pct=(days-60)/30*100;rem=90-days;next='Supreme';}
        else if(days>=30){name='Pioneer';pct=(days-30)/30*100;rem=60-days;next='Elite';}
        rankEl.textContent='Rank: '+name;
        rankBar.style.width=pct+'%';
        rankDetails.innerHTML = next
          ? `Progress: ${days} days<br>Next: ${next} in ${rem} days`
          : `🎉 Top rank! (${days} days)`;
      }

      function applyBonus(){
        const arr=getDays(), dates=[];
        let bonus=0, streak=0;
        for(let i=0;i<7;i++){
          const d=new Date();d.setDate(d.getDate()-i);
          dates.push(d.toISOString().split('T')[0]);
        }
        dates.forEach(d=>{
          if(arr.includes(d)){
            streak++;
            if(streak===2)bonus+=0.05;
            if(streak===5)bonus+=0.5;
          } else streak=0;
        });
        if(bonus){
          alert('🎉 Bonus earned!');
          setBalance(getBalance()+bonus);
          set('baseBalance', getBalance());
        }
      }

      function tick(){
        const start = parseInt(get('startTime'));
        const base = parseFloat(get('baseBalance') || '0');
        const now = Date.now();
        const elapsed = now - start;
        const remain = Math.max(0, DURATION - elapsed);

        if (remain <= 0) {
          clearInterval(timer);
          countdownEl.textContent = '00:00:00';
          minedEl.textContent = '+1.72800';
          const finalBalance = base + 1.728;
          setBalance(finalBalance);
          set('balance', finalBalance);
          localStorage.removeItem('startTime');
          localStorage.removeItem('baseBalance');
          saveDay();
          applyBonus();
          updateRankUI();
          return;
        }

        const earned = (elapsed / 1000) * RATE;
        const currentBalance = base + earned;
        minedEl.textContent = '+' + earned.toFixed(5);
        setBalance(currentBalance);

        const hours = String(Math.floor(remain / (3600 * 1000))).padStart(2, '0');
        const mins = String(Math.floor((remain % (3600 * 1000)) / 60000)).padStart(2, '0');
        const secs = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
        countdownEl.textContent = `${hours}:${mins}:${secs}`;
      }

      window.startMining = function(){
        if(get('startTime')) return;
        sound.play();
        const now = Date.now();
        const currentBalance = getBalance();
        set('startTime', now);
        set('baseBalance', currentBalance);
        timer = setInterval(tick,1000);
      };

      window.toggleCalendar = function(){
        const arr=getDays(), t=today();
        let html='';
        for(let i=0;i<30;i++){
          const d=new Date(); d.setDate(d.getDate()-i);
          const ds=d.toISOString().split('T')[0];
          html += `<div>${ds} ${arr.includes(ds)?'✅':'<span class="missed">❌</span>'}</div>`;
        }
        minedDates.innerHTML=html;
        calendar.style.display = calendar.style.display==='block'? 'none':'block';
      };

      rankEl.addEventListener('click',()=>{
        rankDetails.style.display = rankDetails.style.display==='block'?'none':'block';
      });

      window.onload = function(){
        updateRankUI();
        const bal = getBalance();
        setBalance(bal);
        if(get('startTime')){
          timer = setInterval(tick, 1000);
          sound.play();
        }
      };
    })();
