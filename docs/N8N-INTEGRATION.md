# n8n Entegrasyonu

## Genel Bakış

Platform'unuz n8n ile entegre çalışabilir. Özel bir entegrasyon yazmaya gerek yok çünkü platform standart HTTP webhook'ları kullanıyor ve n8n bunları destekliyor.

## Kurulum

### 1. n8n'de Webhook Node'u Oluşturma

1. n8n workflow'unuzu açın
2. "Webhook" node'unu ekleyin
3. Node ayarlarında:
   - **HTTP Method**: POST
   - **Path**: İstediğiniz path'i girin (örn: `/odoo-webhook`)
   - **Response Mode**: "Respond to Webhook" seçin
4. Webhook URL'ini kopyalayın (örn: `https://your-n8n-instance.com/webhook/odoo-webhook`)

### 2. Platform'da Webhook Oluşturma

1. Platform'da `/api/webhooks` endpoint'ine POST isteği gönderin:

```bash
curl -X POST https://your-platform.com/api/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "n8n Integration",
    "url": "https://your-n8n-instance.com/webhook/odoo-webhook",
    "events": [
      "company.created",
      "company.updated",
      "project.created",
      "project.updated",
      "ticket.created",
      "ticket.resolved"
    ]
  }'
```

2. Webhook oluşturulduğunda size bir `secret` verilecek. Bu secret'i n8n'de kullanabilirsiniz.

### 3. n8n'de Signature Doğrulama (Opsiyonel)

Webhook güvenliği için signature doğrulaması yapabilirsiniz:

1. n8n'de "Function" node'u ekleyin
2. Webhook node'undan sonra bağlayın
3. Function kodunu ekleyin:

```javascript
const crypto = require('crypto');

// Webhook secret (platform'dan aldığınız)
const secret = 'YOUR_WEBHOOK_SECRET';

// Request body
const body = JSON.stringify($input.item.json);

// Signature from header
const signature = $input.item.headers['x-webhook-signature'];

// Create expected signature
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

// Verify signature
if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return $input.item.json;
```

## Webhook Event'leri

Platform şu event'leri destekler:

- `company.created` - Firma oluşturulduğunda
- `company.updated` - Firma güncellendiğinde
- `company.deleted` - Firma silindiğinde
- `project.created` - Proje oluşturulduğunda
- `project.updated` - Proje güncellendiğinde
- `project.completed` - Proje tamamlandığında
- `ticket.created` - Destek talebi oluşturulduğunda
- `ticket.updated` - Destek talebi güncellendiğinde
- `ticket.resolved` - Destek talebi çözüldüğünde
- `document.created` - Doküman oluşturulduğunda
- `document.updated` - Doküman güncellendiğinde
- `user.created` - Kullanıcı oluşturulduğunda
- `user.updated` - Kullanıcı güncellendiğinde

## Webhook Payload Formatı

Tüm webhook'lar şu formatta gönderilir:

```json
{
  "event": "company.created",
  "data": {
    "id": "uuid",
    "name": "Company Name",
    "status": "discovery",
    ...
  },
  "timestamp": "2025-11-12T10:00:00Z"
}
```

## Örnek Workflow'lar

### 1. Yeni Firma Oluşturulduğunda Slack'e Bildirim

1. Webhook node'u ekle (event: `company.created`)
2. Slack node'u ekle
3. Mesaj formatını ayarla:

```
Yeni firma oluşturuldu: {{ $json.data.name }}
Durum: {{ $json.data.status }}
```

### 2. Proje Tamamlandığında Email Gönder

1. Webhook node'u ekle (event: `project.completed`)
2. Email node'u ekle
3. Email içeriğini formatla

### 3. Destek Talebi Oluşturulduğunda Trello'ya Kart Ekle

1. Webhook node'u ekle (event: `ticket.created`)
2. Trello node'u ekle
3. Kart bilgilerini webhook data'sından al

## API Kullanımı

Platform'un Public API'sini de kullanabilirsiniz:

### API Key Oluşturma

```bash
curl -X POST https://your-platform.com/api/api-keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "n8n API Key",
    "scopes": ["read:companies", "read:projects", "write:projects"]
  }'
```

### API Kullanımı

```bash
curl https://your-platform.com/api/v1/companies \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Sorun Giderme

### Webhook Gelmiyor

1. Webhook URL'inin doğru olduğundan emin olun
2. n8n'in public erişilebilir olduğundan emin olun
3. Webhook loglarını kontrol edin (`/api/webhooks/[id]/deliveries`)

### Signature Doğrulama Hatası

1. Secret'in doğru kopyalandığından emin olun
2. Body'nin JSON string olarak doğru formatlandığından emin olun
3. Header'ın `x-webhook-signature` olduğundan emin olun

## Daha Fazla Bilgi

- [n8n Webhook Dokümantasyonu](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Platform API Dokümantasyonu](./API-DOCUMENTATION.md)

