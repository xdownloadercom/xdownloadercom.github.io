self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const DEFAULT_URL = "https://x-downloader.com/";
  const url =
    event.notification?.data?.FCM_MSG?.notification?.click_action ||
    event.notification?.data?.fcmOptions?.link ||
    event.notification?.data?.data?.link ||
    DEFAULT_URL;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsArray) => {
      const hadWindowToFocus = clientsArray.some((windowClient) =>
        windowClient.url === url ? (windowClient.focus(), true) : false
      );
      if (!hadWindowToFocus)
        clients
          .openWindow(url)
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
    })
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js"
);

const app = firebase.initializeApp({
  apiKey: "AIzaSyAL2o6FfmThjCZ3rwagtuKL7qmpY4t4bjM",
  authDomain: "x-downloader-com.firebaseapp.com",
  projectId: "x-downloader-com",
  storageBucket: "x-downloader-com.firebasestorage.app",
  messagingSenderId: "75427303028",
  appId: "1:75427303028:web:97da603834edda23144b21",
  measurementId: "G-NDD0D475K4",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  let title = payload.data.title || payload.notification.title;
  let body = payload.data.body || payload.notification.body;
  const notificationTitle = title;
  const notificationOptions = {
    body: body,
    icon: "/icons/icon-192.png",
    data: payload,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}, false);
