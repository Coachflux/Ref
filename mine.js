  <!-- Firebase SDK scripts -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  <script>
    // CHANGE THIS to your Firebase project's config (get from Firebase Console > Project settings > Web app)
    var firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
      // measurementId: "G-XXXXXXXX", // Optional
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Toggle between forms
    function toggleForms(form) {
      document.getElementById('register-form').style.display = (form==='register') ? '' : 'none';
      document.getElementById('login-form').style.display = (form==='login') ? '' : 'none';
      document.getElementById('register-message').innerHTML = '';
      document.getElementById('login-message').innerHTML = '';
    }

    // Registration with Firebase and username save
    document.getElementById('register-form').addEventListener('submit', function(e){
      e.preventDefault();
      const email = document.getElementById('reg-email').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const password = document.getElementById('reg-password').value;
      const password2 = document.getElementById('reg-password2').value;
      const terms = document.getElementById('reg-terms').checked;
      const msg = document.getElementById('register-message');
      let errors = [];
      if(!email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/)) errors.push("Enter a valid email.");
      if(!username.match(/^[a-zA-Z0-9_]{3,16}$/)) errors.push("Username must be 3-16 characters (letters, numbers, underscores).");
      if(password.length < 6) errors.push("Password must be at least 6 characters.");
      if(password !== password2) errors.push("Passwords do not match.");
      if(!terms) errors.push("You must accept the terms and conditions.");
      if(errors.length){ msg.innerHTML = '<div class="error">'+errors.join('<br>')+'</div>'; return; }
      // Check if username already exists
      db.collection("usernames").doc(username.toLowerCase()).get().then((docSnap) => {
        if(docSnap.exists){
          msg.innerHTML = '<div class="error">Username already taken.</div>';
          return;
        }
        // Create user
        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            // Set display name
            userCredential.user.updateProfile({ displayName: username });
            // Store username->email mapping in Firestore
            db.collection("usernames").doc(username.toLowerCase()).set({
              uid: userCredential.user.uid,
              email: email
            });
            msg.innerHTML = '<div class="success">Registration successful! You can now log in.</div>';
            setTimeout(()=>{ toggleForms('login'); }, 1400);
          })
          .catch((error) => {
            msg.innerHTML = '<div class="error">'+error.message+'</div>';
          });
      }).catch((error) => {
        msg.innerHTML = '<div class="error">'+error.message+'</div>';
      });
    });

    // Login with Firebase (by email OR username)
    document.getElementById('login-form').addEventListener('submit', function(e){
      e.preventDefault();
      const id = document.getElementById('login-identifier').value.trim();
      const pw = document.getElementById('login-password').value;
      const msg = document.getElementById('login-message');
      if(!id || !pw){
        msg.innerHTML = '<div class="error">All fields are required.</div>';
        return;
      }
      // If @ in id, treat as email; else lookup username
      if(id.includes('@')){
        auth.signInWithEmailAndPassword(id, pw)
          .then(() => {
            msg.innerHTML = '<div class="success">Login successful. Welcome back!</div>';
            // Redirect to mine.html after successful login
            setTimeout(() => {
              window.location.href = 'mine.html';
            }, 1000); // Delay to show success message
          })
          .catch((error) => {
            msg.innerHTML = '<div class="error">'+error.message+'</div>';
          });
      } else {
        // Username: lookup email in Firestore
        db.collection("usernames").doc(id.toLowerCase()).get().then((docSnap)=>{
          if(!docSnap.exists){
            msg.innerHTML = '<div class="error">Username or email not found.</div>';
            return;
          }
          const email = docSnap.data().email;
          auth.signInWithEmailAndPassword(email, pw)
            .then(() => {
              msg.innerHTML = '<div class="success">Login successful. Welcome back!</div>';
              // Redirect to mine.html after successful login
              setTimeout(() => {
                window.location.href = 'mine.html';
              }, 1000); // Delay to show success message
            })
            .catch((error) => {
              msg.innerHTML = '<div class="error">'+error.message+'</div>';
            });
        }).catch((error)=>{
          msg.innerHTML = '<div class="error">'+error.message+'</div>';
        });
      }
    });

    // Optionally: Check Firebase Auth state here for dashboard/redirects
    // auth.onAuthStateChanged(user => { ... });
  </script>






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


  // Withdraw logic
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
        }, 15000);
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
