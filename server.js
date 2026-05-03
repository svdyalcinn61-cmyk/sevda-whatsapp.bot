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

  const replyText = "Merhaba, mesajınızı aldık. Size en kısa sürede dönüş yapacağız.";

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