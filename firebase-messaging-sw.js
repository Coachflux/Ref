// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ✅ Your Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyDR_rkTfGLWWX4NRWOVer9wwGlUFiRMRO4",
  authDomain: "usdt-login.firebaseapp.com",
  projectId: "usdt-login",
  storageBucket: "usdt-login.firebasestorage.app",
  messagingSenderId: "807602854227",
  appId: "1:807602854227:web:309ae73f572e48dbc7a9a6"
});

// ✅ Initialize messaging
const messaging = firebase.messaging();

// ✅ Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);

  const notificationTitle = payload.notification.title || "Mining Savi";
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || "/icon.png", // notification image
    badge: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Open app when user taps the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/mine.html"));
});
