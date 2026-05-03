require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables:
// WASENDER_API_KEY - Wasender API anahtarınız
// WASENDER_API_URL - Wasender mesaj gönderme uç noktası, örn. https://api.wasender.com/sendMessage
// WEBHOOK_SECRET - (varsa) Wasender webhook doğrulaması için kullanılabilir
// VERIFY_TOKEN - Meta WhatsApp webhook doğrulaması için kullanılır
app.use(express.json());

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

app.post("/webhook", async (req, res) => {
  console.log("Webhook headers:", req.headers);
  console.log("Webhook query:", req.query);
  console.log("Webhook body:", req.body);

  const messageData = req.body?.data?.messages;
  const senderId = messageData?.remoteJid;
  const incomingText = messageData?.messageBody;
  const pushName = messageData?.pushName;

  console.log("Gelen WhatsApp mesajı tespit edildi:", {
    senderId,
    incomingText,
    pushName,
  });

  const replyText = "Merhaba, mesajınızı aldık. Size en kısa sürede dönüş yapacağız.";

  if (senderId && process.env.WASENDER_API_URL && process.env.WASENDER_API_KEY) {
    const payload = {
      api_key: process.env.WASENDER_API_KEY,
      to: senderId,
      message: replyText,
      // Wasender API uç noktası ve gövde yapısı, kullanımınıza göre uyarlanabilir.
    };

    try {
      const response = await axios.post(process.env.WASENDER_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WASENDER_API_KEY}`,
        },
      });
      console.log("Wasender API yanıtı:", response.data);
    } catch (error) {
      console.error("Wasender API gönderim hatası:", error?.response?.data || error.message || error);
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