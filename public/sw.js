self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "תזכורת אירוע", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "תזכורת אירוע";
  const options = {
    body: data.body || "",
    requireInteraction: true,
    tag: data.tag || "ibox-event-reminder",
    dir: "rtl",
    actions: [{ action: "confirm", title: "אישרתי" }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "confirm") return;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientsArr) => {
      if (clientsArr.length > 0) {
        clientsArr[0].focus();
      } else {
        clients.openWindow("/");
      }
    })
  );
});
