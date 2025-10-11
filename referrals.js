import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDR_rkTfGLWWX4NRWOVer9wwGlUFiRMRO4",
    authDomain: "usdt-login.firebaseapp.com",
    databaseURL: "https://usdt-login-default-rtdb.firebaseio.com",
    projectId: "usdt-login",
    storageBucket: "usdt-login.firebasestorage.app",
    messagingSenderId: "807602854227",
    appId: "1:807602854227:web:309ae73f572e48dbc7a9a6"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // --- Helper functions ---
  const userRef = (username) => ref(db, `users/${username}`);

  async function getAllUsers() {
    const snap = await get(ref(db, "users"));
    return snap.exists() ? snap.val() : {};
  }

  async function getUser(username) {
    const snap = await get(userRef(username));
    return snap.exists() ? snap.val() : null;
  }

  async function saveUser(username, data) {
    await set(userRef(username), data);
  }

  async function updateUser(username, data) {
    await update(userRef(username), data);
  }

  function generateReferralCode(username) {
    return username + Math.floor(Math.random() * 10000);
  }

  // --- Registration Logic (with email) ---
  async function registerUser() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    let inviterCode = document.getElementById("inviterCode").value.trim();

    if (!username || !email || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    const users = await getAllUsers();
    // Check if username or email already exists
    for (const key in users) {
      const user = users[key];
      if (user.username === username) {
        return alert("Username already exists.");
      }
      if (user.email === email) {
        return alert("Email already registered.");
      }
    }

    if (!inviterCode) {
      inviterCode = localStorage.getItem("incomingRefCode") || "";
    }

    const newUser = {
      username,
      email,
      password,
      referralCode: generateReferralCode(username),
      invited: 0,
      referralEarnings: 0,
      balance: 0,
      rank: "Starter",
      days: [],
      baseBalance: 0,
      startTime: 0
    };

    let newBalance = 0;
    let inviterFound = false;

    if (inviterCode) {
      for (const key in users) {
        const inviter = users[key];
        if (inviter.referralCode === inviterCode) {
          inviter.invited = (inviter.invited || 0) + 1;
          inviter.referralEarnings = (inviter.referralEarnings || 0) + 0.3;
          inviter.balance = (inviter.balance || 0) + 0.3;
          await updateUser(inviter.username, inviter);
          newBalance = 0.3;
          inviterFound = true;
          break;
        }
      }
    }

    newUser.balance = newBalance;
    await saveUser(username, newUser);
    localStorage.setItem("currentUser", username);

    alert("🎉 Registration successful! You can now login.");
    showPage("login");
  }

  // --- Login Logic (Email or Username) ---
  async function loginUser() {
    const userInput = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!userInput || !password) {
      alert("Please enter your email/username and password.");
      return;
    }

    const users = await getAllUsers();

    let matchedUser = null;
    for (const key in users) {
      const user = users[key];
      if (user.username === userInput || user.email === userInput) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return alert("User not found.");
    }

    if (matchedUser.password !== password) {
      return alert("Incorrect password.");
    }

    localStorage.setItem("currentUser", matchedUser.username);
    alert("✅ Login successful!");
    window.location.href = "mine.html";
  }

  // --- Display Referral Info ---
  async function displayReferralInfo() {
    const username = localStorage.getItem("currentUser");
    if (!username) return showPage("login");

    const user = await getUser(username);
    if (!user) return;

    document.getElementById("displayUsername").innerText = user.username;
    document.getElementById("referralCode").innerText = user.referralCode;
    document.getElementById("referralLink").innerText =
      `${location.origin}${location.pathname.replace(/referral\.html$/, "index.html")}?ref=${user.referralCode}`;
    document.getElementById("referralCount").innerText = user.invited || "No invitee yet";
    document.getElementById("referralEarnings").innerText = "$" + (user.referralEarnings || 0).toFixed(2);

    const allUsers = await getAllUsers();
    const sorted = Object.values(allUsers).sort((a, b) => (b.invited || 0) - (a.invited || 0));
    const pos = sorted.findIndex((u) => u.username === username);
    const position = pos !== -1 ? 5135 + pos : "N/A";

    let positionEl = document.getElementById("userPosition");
    if (!positionEl) {
      positionEl = document.createElement("p");
      positionEl.id = "userPosition";
      document.querySelector(".card").appendChild(positionEl);
    }
    positionEl.innerHTML = `<strong>Your Position:</strong> <span>${position}</span>`;
  }

  // --- Share Referral ---
  function shareReferral() {
    const username = localStorage.getItem("currentUser");
    if (!username) return;
    getUser(username).then((user) => {
      const code = user.referralCode;
      const link = `${location.origin}${location.pathname.replace(/referral\.html$/, "index.html")}?ref=${code}`;
      const text = `Earn free USDT with NHCoin! Register with my referral code: ${code}\n${link}`;

      if (navigator.share) {
        navigator.share({ title: "NHCoin", text, url: link });
      } else {
        navigator.clipboard.writeText(text);
        alert("Referral message copied!");
      }
    });
  }

  // --- Handle referral in URL ---
  window.onload = () => {
    const refCode = new URLSearchParams(window.location.search).get("ref");
    if (refCode) {
      localStorage.setItem("incomingRefCode", refCode);
    }
    const user = localStorage.getItem("currentUser");
    if (user) showPage("referral");
    else showPage("login");
  };

  // Attach to window for button usage
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.displayReferralInfo = displayReferralInfo;
  window.shareReferral = shareReferral;
