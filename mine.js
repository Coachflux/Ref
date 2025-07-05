
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
      ? `Progress: ${days} / 30<br>Next: ${next} in ${rem} days`
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
      alert('🎉 Congratulations, your hard work is paying off.');
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

  
const clickSound = document.getElementById("clickSound");

  function handleNavClick(el, url) {
    clickSound.play();
    el.classList.add("animate-click");
    setTimeout(() => {
      window.location.href = url;
    }, 3000);
  }

  // Handle back button (Android)
  window.addEventListener("popstate", () => {
    history.back();
  });

  
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
    const r=rankDetails.style;
    r.display = r.display==='block'?'none':'block';
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
