
    function showPage(page) {
      document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
      document.getElementById(page).classList.remove('hidden');
      if (page === 'referral') {
        displayReferralInfo();
      }
    }

    function generateReferralCode(username) {
      return username + Math.floor(Math.random() * 10000);
    }

    function registerUser() {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      let inviterCode = document.getElementById('inviterCode').value.trim();
      const incomingRefCode = localStorage.getItem('incomingRefCode');

      if (!inviterCode && incomingRefCode) {
        inviterCode = incomingRefCode;
      }

      if (!username || !password) return alert("Please fill all required fields.");

      if (localStorage.getItem(`user_${username}`)) {
        return alert("Username already exists.");
      }

      const user = {
        username: username,
        password: password,
        referralCode: generateReferralCode(username),
        invited: 0
      };
      localStorage.setItem(`user_${username}`, JSON.stringify(user));

      if (inviterCode) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('user_')) {
            const inviter = JSON.parse(localStorage.getItem(key));
            if (inviter.referralCode === inviterCode) {
              inviter.invited = (inviter.invited || 0) + 1;
              localStorage.setItem(key, JSON.stringify(inviter));
              console.log(`Updated inviter ${inviter.username} referral count to ${inviter.invited}`);
            }
          }
        });
      }

      localStorage.setItem('currentUser', username);
      localStorage.removeItem('incomingRefCode'); // Clear after use
      showPage('referral');
    }

    function loginUser() {
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!username || !password) return alert("Please enter your credentials.");

      const userData = JSON.parse(localStorage.getItem(`user_${username}`));
      if (!userData || userData.password !== password) {
        return alert("Invalid username or password.");
      }

      localStorage.setItem('currentUser', username);
      showPage('referral');
    }

    function displayReferralInfo() {
      const username = localStorage.getItem('currentUser');
      if (!username) return showPage('login');

      const userData = JSON.parse(localStorage.getItem(`user_${username}`));
      document.getElementById('displayUsername').innerText = userData.username;
      document.getElementById('referralCode').innerText = userData.referralCode;
      const referralLink = `https://coachflux.github.io/Ref/index.html?ref=${userData.referralCode}`;
      document.getElementById('referralLink').innerText = referralLink;
      document.getElementById('referralCount').innerText = userData.invited || 0;
    }

    function logout() {
      localStorage.removeItem('currentUser');
      showPage('login');
    }

    function copyText(id) {
      const linkEl = document.getElementById(id);
      const text = linkEl.innerText;
      const shareMessage = `Earn by Mining and Referring!\n\nJoin NHCoin and start earning USDT by mining daily and inviting friends. Get instant bonuses!\n\nDescription: Earn daily by mining and referring friends. Get bonuses instantly!\n\nImage: https://yourdomain.com/referral.png\n\nYour exclusive referral link: ${text}\n\nClick here to join and start mining: ${text}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareMessage).then(() => {
          alert("Referral share message copied to clipboard! Paste it on social media to share with friends.");
        }).catch(() => {
          prompt("Copy this share message:", shareMessage);
        });
      } else {
        prompt("Copy this share message:", shareMessage);
      }
    }

    window.onload = () => {
      const refCode = new URLSearchParams(window.location.search).get('ref');
      if (refCode) {
        localStorage.setItem('incomingRefCode', refCode);
      }

      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        showPage('referral');
      } else {
        if (refCode) {
          showPage('register');
          document.getElementById('inviterCode').value = refCode;
        } else {
          showPage('login');
        }
      }

      // Initialize mining UI
      updateRankUI();
      const bal = getBalance();
      setBalance(bal);
      if (get('startTime')) {
        timer = setInterval(tick, 1000);
        // sound.play(); // Uncomment if sound is added
      }
    };

    // Mining script
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
        // sound.play(); // Add sound if needed
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

      // For bottom nav, simple navigation
      window.handleNavClick = function(el, url) {
        window.location.href = url;
      };
    })();
        
