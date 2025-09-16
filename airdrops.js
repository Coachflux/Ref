    function getUserKey(key) {
      const username = localStorage.getItem('currentUser');
      return username ? `${username}_${key}` : key;
    }

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
      const inviterCode = document.getElementById('inviterCode').value.trim();

      if (!username || !password) return alert("Please fill all required fields.");

      if (!localStorage.getItem(`user_${username}`)) {
        const user = {
          username: username,
          password: password,
          referralCode: generateReferralCode(username),
          invited: 0
        };
        localStorage.setItem(`user_${username}`, JSON.stringify(user));

        const newBalanceKey = `${username}_balance`;
        let newBalance = 0;
        if (inviterCode) {
          newBalance = 0.3; // Invitee gets $0.3
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('user_')) {
              const inviter = JSON.parse(localStorage.getItem(key));
              if (inviter.referralCode === inviterCode) {
                inviter.invited = (inviter.invited || 0) + 1;
                localStorage.setItem(key, JSON.stringify(inviter));
                const inviterBalanceKey = `${inviter.username}_balance`;
                let inviterBalance = parseFloat(localStorage.getItem(inviterBalanceKey) || '0');
                inviterBalance += 0.3; // Inviter gets $0.3
                localStorage.setItem(inviterBalanceKey, inviterBalance.toFixed(6));
              }
            }
          });
        }
        localStorage.setItem(newBalanceKey, newBalance.toFixed(6));

        localStorage.setItem('currentUser', username);
        showPage('referral');
      } else {
        alert("Username already exists.");
      }
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
      document.getElementById('referralLink').innerText = `${location.origin}?ref=${userData.referralCode}`;
      const invited = userData.invited || 0;
      document.getElementById('referralCount').innerText = invited > 0 ? invited : 'No invitee yet';
      const earnings = invited * 0.3;
      document.getElementById('referralEarnings').innerText = '$' + earnings.toFixed(2);

      // Update mining balance with referral earnings
      const balanceKey = `${username}_balance`;
      let currentBalance = parseFloat(localStorage.getItem(balanceKey) || '0');
      currentBalance += earnings; // Add referral earnings to balance
      localStorage.setItem(balanceKey, currentBalance.toFixed(6));
    }

    function logout() {
      localStorage.removeItem('currentUser');
      showPage('login');
    }

    function copyText(id) {
      const text = document.getElementById(id).innerText;
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }

    window.onload = () => {
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

      function get(key){ return localStorage.getItem(getUserKey(key)); }
      function set(key, val){ localStorage.setItem(getUserKey(key), val); }
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
        if (balanceEl) balanceEl.textContent = '$' + val.toFixed(2);
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
        if (rankEl) rankEl.textContent='Rank: '+name;
        if (rankBar) rankBar.style.width=pct+'%';
        if (rankDetails) rankDetails.innerHTML = next
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
          if (countdownEl) countdownEl.textContent = '00:00:00';
          if (minedEl) minedEl.textContent = '+1.72800';
          const finalBalance = base + 1.728;
          setBalance(finalBalance);
          set('balance', finalBalance);
          localStorage.removeItem(getUserKey('startTime'));
          localStorage.removeItem(getUserKey('baseBalance'));
          saveDay();
          applyBonus();
          updateRankUI();
          return;
        }

        const earned = (elapsed / 1000) * RATE;
        const currentBalance = base + earned;
        if (minedEl) minedEl.textContent = '+' + earned.toFixed(5);
        setBalance(currentBalance);

        const hours = String(Math.floor(remain / (3600 * 1000))).padStart(2, '0');
        const mins = String(Math.floor((remain % (3600 * 1000)) / 60000)).padStart(2, '0');
        const secs = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
        if (countdownEl) countdownEl.textContent = `${hours}:${mins}:${secs}`;
      }

      window.startMining = function(){
        if(get('startTime')) return;
        if (sound) sound.play();
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
        if (minedDates) minedDates.innerHTML=html;
        if (calendar) calendar.style.display = calendar.style.display==='block'? 'none':'block';
      };

      if (rankEl) {
        rankEl.addEventListener('click',()=>{
          if (rankDetails) rankDetails.style.display = rankDetails.style.display==='block'?'none':'block';
        });
      }

      window.onload = function(){
        updateRankUI();
        const bal = getBalance();
        setBalance(bal);
        if(get('startTime')){
          timer = setInterval(tick, 1000);
          if (sound) sound.play();
        }
      };
    })();

// Withdraw logic //
    function toggleWithdraw() {
      const withdrawal = document.getElementById('withdrawal');
      withdrawal.style.display = withdrawal.style.display === 'block' ? 'none' : 'block';
    }

    function submitWithdraw() {
      const wallet = document.getElementById('wallet');
      const amount = document.getElementById('amount');
      const popup = document.getElementById('processingPopup');
      const loader = document.getElementById('loader');
      const errorMsg = document.getElementById('errorMsg');

      if (!wallet.value || !amount.value) {
        alert('Fill in details');
        return;
      }

      const val = parseFloat(amount.value.replace('$',''));
      const bal = parseFloat(localStorage.getItem('balance') || '0');

      if (val > bal) {
        amount.classList.add('invalid');
        amount.value = 'Invalid Amount';
        setTimeout(() => {
          amount.value = '';
        }, 2000);
        return;
      }

      loader.style.display = 'block';
      setTimeout(() => {
        loader.style.display = 'none';
        popup.style.display = 'block';
        setTimeout(() => {
          errorMsg.textContent = "🚫 Your transaction cannot be processed now. You must reach Supreme rank.";
        }, 45000);
      }, 5000);
    }

    function closePopup() {
      document.getElementById('processingPopup').style.display = 'none';
      document.getElementById('errorMsg').textContent = '';
    }

    // Dark Mode Toggle
    document.getElementById('darkModeToggle').onclick = function() {
      document.body.classList.toggle('dark-mode');
    };
