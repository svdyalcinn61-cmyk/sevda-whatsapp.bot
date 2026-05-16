require("dotenv").config();
const path = require("path");
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "public");
const recentIncomingMessages = [];
const recentOutgoingReplies = [];
let lastWebhookTimestamp = null;

// Environment variables:
// WASENDER_API_KEY - Wasender API anahtarınız
// WASENDER_API_URL - Wasender mesaj gönderme uç noktası, örn. https://api.wasender.com/sendMessage
// WEBHOOK_SECRET - (varsa) Wasender webhook doğrulaması için kullanılabilir
// VERIFY_TOKEN - Meta WhatsApp webhook doğrulaması için kullanılır
app.use(express.json());
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.send("WhatsApp bot çalışıyor ✅");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook doğrulandı");
    return res.status(200).send(challenge);
  }

  console.warn("Webhook doğrulama başarısız:", mode, token);
  return res.sendStatus(403);
});

app.get("/api/dashboard-status", (req, res) => {
  const active = Boolean(
    lastWebhookTimestamp && Date.now() - new Date(lastWebhookTimestamp).getTime() < 1000 * 60 * 10
  );

  res.json({
    active,
    lastWebhookTimestamp,
    webhookStatus: active ? "active" : "waiting",
    recentIncomingMessages,
    recentOutgoingReplies,
  });
});

app.post("/api/test-message", async (req, res) => {
  const { to, text } = req.body;

  if (!to || !text) {
    return res.status(400).json({ error: "Eksik test mesajı verisi: to ve text gerekli." });
  }

  if (!process.env.WASENDER_API_URL || !process.env.WASENDER_API_KEY) {
    return res.status(500).json({ error: "Wasender API bilgileri eksik." });
  }

  const payload = { to, text };

  try {
    const response = await axios.post(process.env.WASENDER_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WASENDER_API_KEY}`,
      },
    });

    recentOutgoingReplies.unshift({
      to,
      text,
      status: "sent",
      timestamp: new Date().toISOString(),
      response: response.data,
    });
    if (recentOutgoingReplies.length > 20) recentOutgoingReplies.pop();

    return res.json({ success: true, data: response.data });
  } catch (error) {
    const errorMsg = error?.response?.data || error.message || "Bilinmeyen hata.";
    recentOutgoingReplies.unshift({
      to,
      text,
      status: "error",
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });
    if (recentOutgoingReplies.length > 20) recentOutgoingReplies.pop();

    return res.status(500).json({ error: errorMsg });
  }
});

app.post("/webhook", async (req, res) => {
  console.log("Webhook headers:", req.headers);
  console.log("Webhook query:", req.query);
  console.log("Webhook body:", req.body);

  const messageData = req.body?.data?.messages;
  const senderId = messageData?.remoteJid;
  const incomingText = messageData?.messageBody;
  const pushName = messageData?.pushName;
  lastWebhookTimestamp = new Date().toISOString();

  if (senderId || incomingText) {
    recentIncomingMessages.unshift({
      senderId,
      incomingText,
      pushName,
      receivedAt: lastWebhookTimestamp,
    });
    if (recentIncomingMessages.length > 20) recentIncomingMessages.pop();
  }

  console.log("Gelen WhatsApp mesajı tespit edildi:", {
    senderId,
    incomingText,
    pushName,
  });

 let replyText = "Merhaba, TrustCo Company’ye hoş geldiniz. Marka yönetimi, nöropazarlama, dijital pazarlama ve iletişim stratejileri alanlarında size doğru yönlendirme yapabilmemiz için hangi konuda destek aradığınızı öğrenebilir miyim?";

if (incomingText) {
  const lowerText = incomingText.toLowerCase();

  if (
    lowerText.includes("fiyat") ||
    lowerText.includes("ücret") ||
    lowerText.includes("ucret") ||
    lowerText.includes("paket") ||
    lowerText.includes("ne kadar") ||
    lowerText.includes("kaç para") ||
    lowerText.includes("kac para") ||
    lowerText.includes("ödeme") ||
    lowerText.includes("odeme")
  ) {
    replyText = "Fiyatlandırma, markanın hedefi, sektörü ve ihtiyaç duyduğu stratejik kapsama göre değişiyor. Bu yüzden doğrudan standart bir fiyat paylaşmak yerine önce ihtiyacı doğru analiz etmeyi tercih ediyoruz. Hangi hizmet alanı için bilgi almak istiyorsunuz?";
  } else if (
    lowerText.includes("randevu") ||
    lowerText.includes("görüşme") ||
    lowerText.includes("gorusme") ||
    lowerText.includes("zoom") ||
    lowerText.includes("toplantı") ||
    lowerText.includes("toplanti") ||
    lowerText.includes("aramak") ||
    lowerText.includes("beni arayın") ||
    lowerText.includes("beni arayin") ||
    lowerText.includes("konuşalım") ||
    lowerText.includes("konusalim")
  ) {
    replyText = "Elbette, birebir strateji görüşmesiyle ilerlemek en doğru yöntem olur. Size uygun günü ve saati seçebilmeniz için takvim bağlantımızı paylaşacağım. Öncesinde markanızın hangi alanda destek aradığını kısaca öğrenebilir miyim?";
  } else if (
    lowerText.includes("sosyal medya") ||
    lowerText.includes("instagram") ||
    lowerText.includes("reklam") ||
    lowerText.includes("marka yönetimi") ||
    lowerText.includes("marka yonetimi") ||
    lowerText.includes("dijital pazarlama") ||
    lowerText.includes("nöropazarlama") ||
    lowerText.includes("noropazarlama") ||
    lowerText.includes("içerik") ||
    lowerText.includes("icerik")
  ) {
    replyText = "Anladım. Bu alanda doğru yönlendirme yapabilmemiz için önce hedefi netleştirmek önemli. Önceliğiniz görünürlüğü artırmak mı, güven veren bir marka algısı oluşturmak mı, yoksa satışa dönüşümü güçlendirmek mi?";
  } else if (
    lowerText.includes("merhaba") ||
    lowerText.includes("selam") ||
    lowerText.includes("iyi günler") ||
    lowerText.includes("iyi gunler") ||
    lowerText.includes("bilgi almak istiyorum")
  ) {
    replyText = "Merhaba, TrustCo Company’ye hoş geldiniz. Marka yönetimi, nöropazarlama, dijital pazarlama ve iletişim stratejileri alanlarında size doğru yönlendirme yapabilmemiz için hangi konuda destek aradığınızı öğrenebilir miyim?";
  } else {
    replyText = "Sizi doğru yönlendirebilmem için ihtiyacınızı biraz daha netleştirelim. Marka yönetimi, dijital pazarlama, sosyal medya stratejisi veya nöropazarlama tarafında mı destek arıyorsunuz?";
  }
}

  if (senderId && process.env.WASENDER_API_URL && process.env.WASENDER_API_KEY) {
    const payload = {
      to: senderId,
      text: replyText,
    };

    try {
      const response = await axios.post(process.env.WASENDER_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WASENDER_API_KEY}`,
        },
      });
      console.log("Wasender API yanıtı:", response.data);

      recentOutgoingReplies.unshift({
        to: senderId,
        text: replyText,
        status: "sent",
        timestamp: new Date().toISOString(),
        response: response.data,
      });
      if (recentOutgoingReplies.length > 20) recentOutgoingReplies.pop();
    } catch (error) {
      const errorMsg = error?.response?.data || error.message || error;
      console.error("Wasender API gönderim hatası:", errorMsg);

      recentOutgoingReplies.unshift({
        to: senderId,
        text: replyText,
        status: "error",
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      if (recentOutgoingReplies.length > 20) recentOutgoingReplies.pop();
    }
  } else {
    console.warn("Wasender API ile yanıt gönderilmedi. Eksik env veya gönderici bilgisi:", {
      senderId,
      hasUrl: Boolean(process.env.WASENDER_API_URL),
      hasKey: Boolean(process.env.WASENDER_API_KEY),
    });
  }

  return res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});