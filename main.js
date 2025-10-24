// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          getToken(messaging, {
            vapidKey: "BOL_q9yn151IXymDdYd7e06m1vZjjlCAZf91wtAJa8S4IsfcaoW_4Pu54z74qwzhUzfy81rmDO-Is-pTVDTUYNY",
            serviceWorkerRegistration: registration
          }).then((token) => {
            console.log("User Token:", token);
            localStorage.setItem("fcmToken", token);
            // optionally send to Firebase DB to store for admin
          }).catch((err) => {
            console.error("Token Error:", err);
          });
        }
      });
    });
}

// Show notifications while user is on the page
onMessage(messaging, (payload) => {
  console.log("Foreground message received:", payload);
  const { title, body, image } = payload.notification;
  new Notification(title, { body, icon: image || '/icon-192.png' });
});
