import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
