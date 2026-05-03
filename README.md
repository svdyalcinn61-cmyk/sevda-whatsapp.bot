# WhatsApp Bot with WasenderAPI

Bu proje, Heroku üzerinde çalışan bir Node.js / Express tabanlı WhatsApp bot altyapısıdır. WasenderAPI üzerinden WhatsApp mesajlarını alır ve otomatik yanıt gönderir. İleride Claude Haiku ile akıllı cevaplar eklenmesi planlanmaktadır.

## Kullanılan Teknolojiler

- Node.js
- Express
- Axios
- dotenv
- WasenderAPI
- HTML / CSS / JavaScript (dashboard için)

## Kurulum Adımları

1. Proje klasörüne geçin:

```bash
cd whatsapp-bot
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. `.env` dosyası oluşturun ve gerekli değişkenleri ekleyin.

4. Sunucuyu çalıştırın:

```bash
npm start
```

## Environment Variables

Aşağıdaki environment variable’ları ayarlayın:

- `VERIFY_TOKEN` - Meta WhatsApp webhook doğrulaması için kullanılan token
- `WASENDER_API_KEY` - Wasender API anahtarınız
- `WASENDER_API_URL` - Wasender mesaj gönderme uç noktası, örn. `https://api.wasender.com/api/send-message`
- `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY` - İleride Claude Haiku veya Anthropic tabanlı zeki cevaplar için kullanılacak

## Webhook Çalışma Mantığı

Bot, `POST /webhook` endpoint’i üzerinden WasenderAPI’den gelen WhatsApp mesajlarını alır. Gelen istekler `headers`, `query` ve `body` olarak loglanır. Mesaj verisi `req.body.data.messages` altında bulunur, burada gönderici ve metin bilgisi parse edilir.

`GET /webhook` endpoint’i ise Meta WhatsApp webhook doğrulaması için kullanılır ve mevcut kod korunmuştur.

## WasenderAPI Bağlantısı

Cevap göndermek için WasenderAPI uç noktasına `to` ve `text` alanlarını içeren bir POST isteği gönderilir.

Örnek payload:

```json
{
  "to": "263866298683487@lid",
  "text": "Merhaba, mesajınızı aldık. Size en kısa sürede dönüş yapacağız."
}
```

## Heroku Deploy Akışı

1. Kod GitHub reposuna gönderilir.
2. Heroku uygulaması GitHub üzerinden deploy edilir.
3. Heroku üzerinde gerekli environment variable’lar ayarlanır.
4. Uygulama çalıştığında `https://<app-name>.herokuapp.com/webhook` adresine gelen webhook istekleri işlenir.

## Dashboard

Projeye basit bir kontrol dashboard’u eklendi. Dashboard dosyaları `public` klasöründe bulunur.

Dashboard üzerinden:

- Botun aktifliği takip edilebilir
- Son gelen mesajlar görüntülenebilir
- Son gönderilen cevaplar görüntülenebilir
- Webhook durumu görülebilir
- Test mesajı gönderilebilir
- Cevap şablonları yönetilebilir

Dashboard `dashboard.html` dosyasından açılabilir.

## Gelecek Geliştirmeler

- Müşteri cevap senaryoları oluşturma ve yönetme
- Dashboard üzerinde daha ileri bot kontrol panelleri
- Claude Haiku ile zeki cevap sistemi entegrasyonu
- Gelen mesajlara konteks bazlı yanıtlar
- Mesaj geçmişi ve analiz paneli
