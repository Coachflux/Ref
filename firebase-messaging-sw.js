importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
      apiKey: "AIzaSyDR_rkTfGLWWX4NRWOVer9wwGlUFiRMRO4",
      authDomain: "usdt-login.firebaseapp.com",
      databaseURL: "https://usdt-login-default-rtdb.firebaseio.com",
      projectId: "usdt-login",
      storageBucket: "usdt-login.firebasestorage.app",
      messagingSenderId: "807602854227",
      appId: "1:807602854227:web:309ae73f572e48dbc7a9a6"
    };

const messaging = firebase.messaging();

// Background push notification display
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/icon-192.png',
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
