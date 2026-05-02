const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.post("/webhook", (req, res) => {
  console.log("Webhook geldi:", req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});