
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
