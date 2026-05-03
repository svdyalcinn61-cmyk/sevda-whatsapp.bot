const statusEl = document.getElementById("botActive");
const webhookEl = document.getElementById("webhookStatus");
const lastWebhookEl = document.getElementById("lastWebhook");
const incomingList = document.getElementById("incomingList");
const outgoingList = document.getElementById("outgoingList");
const testForm = document.getElementById("testForm");
const testTo = document.getElementById("testTo");
const testText = document.getElementById("testText");
const testResult = document.getElementById("testResult");
const templateButtons = document.querySelectorAll(".template-list button");

async function loadDashboard() {
  try {
    const response = await fetch("/api/dashboard-status");
    const data = await response.json();

    statusEl.textContent = data.active ? "Evet" : "Hayır";
    webhookEl.textContent = data.webhookStatus;
    lastWebhookEl.textContent = data.lastWebhookTimestamp || "Henüz yok";

    incomingList.innerHTML = data.recentIncomingMessages.length
      ? data.recentIncomingMessages
          .slice(0, 20)
          .map(
            (item) =>
              `<li><strong>${item.pushName || "Bilinmeyen"}</strong><br /><em>${item.senderId || "-"}</em><br />${item.incomingText || "(metin yok)"}<br /><small>${item.receivedAt}</small></li>`
          )
          .join("")
      : "<li>Henüz gelen mesaj yok.</li>";

    outgoingList.innerHTML = data.recentOutgoingReplies.length
      ? data.recentOutgoingReplies
          .slice(0, 20)
          .map(
            (item) =>
              `<li><strong>${item.status}</strong><br /><em>${item.to || "-"}</em><br />${item.text || "(metin yok)"}<br /><small>${item.timestamp}</small></li>`
          )
          .join("")
      : "<li>Henüz gönderilen cevap yok.</li>";
  } catch (error) {
    console.error("Dashboard yükleme hatası:", error);
    statusEl.textContent = "Hata";
    webhookEl.textContent = "Hata";
    lastWebhookEl.textContent = "Hata";
  }
}

testForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  testResult.textContent = "Gönderiliyor...";

  try {
    const response = await fetch("/api/test-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: testTo.value.trim(),
        text: testText.value.trim(),
      }),
    });

    const result = await response.json();
    if (response.ok) {
      testResult.textContent = "Test mesajı gönderildi.";
      testText.value = "";
      loadDashboard();
    } else {
      testResult.textContent = `Hata: ${result.error || "Bilinmeyen"}`;
    }
  } catch (error) {
    testResult.textContent = `Hata: ${error.message}`;
  }
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    testText.value = button.dataset.template;
  });
});

window.addEventListener("load", () => {
  loadDashboard();
  setInterval(loadDashboard, 15000);
});
