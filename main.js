import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

   // 🔥 Your Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyDR_rkTfGLWWX4NRWOVer9wwGlUFiRMRO4",
      authDomain: "usdt-login.firebaseapp.com",
      databaseURL: "https://usdt-login-default-rtdb.firebaseio.com",
      projectId: "usdt-login",
      storageBucket: "usdt-login.firebasestorage.app",
      messagingSenderId: "807602854227",
      appId: "1:807602854227:web:309ae73f572e48dbc7a9a6"
    };

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

Notification.requestPermission().then((permission) => {
  if (permission === "granted") {
    getToken(messaging, {
      vapidKey: "BOL_q9yn151IXymDdYd7e06m1vZjjlCAZf91wtAJa8S4IsfcaoW_4Pu54z74qwzhUzfy81rmDO-Is-pTVDTUYNY"
    }).then((token) => {
      console.log("User FCM Token:", token);
      // Save to your database for targeting notifications later
      localStorage.setItem("fcmToken", token);
    });
  } else {
    console.log("Notification permission denied");
  }
});

// Foreground messages
onMessage(messaging, (payload) => {
  console.log("Message received: ", payload);
  const notification = payload.notification;
  if (notification) {
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.image || '/icon-192.png'
    });
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js');
}
