// Service worker ของแอป Rockman · ส่งของรายวัน
// โหลดจากเน็ตก่อนเสมอ (ได้ข้อมูลล่าสุดทุกครั้ง) ถ้าไม่มีเน็ตจึงใช้ไฟล์ที่เก็บไว้ในเครื่อง
// เปลี่ยนเลขเวอร์ชันเมื่ออยากล้างแคชเก่าทั้งหมด
const CACHE = "rockman-v3";
const CORE = ["./", "./index.html", "./config.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // ไม่ยุ่งกับ Supabase, Discord, ฟอนต์ หรือ CDN ภายนอก
  if (url.origin !== self.location.origin) return;
  // ไม่แตะหน้าแอดมิน
  if (url.pathname.endsWith("/admin.html")) return;

  // เก็บแคชโดยตัด ?code=... / ?t=... ออก จะได้ไม่เก็บรหัสล็อกอินไว้
  const key = url.origin + url.pathname;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(key, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(key).then(hit =>
          hit || (req.mode === "navigate" ? caches.match(new URL("./", self.location).href) : Response.error())
        )
      )
  );
});
