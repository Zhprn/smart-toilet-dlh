# Smart Gate QRIS --- ASPI / BRI QRIS MPM Implementation

## 1. Tujuan

Dokumen ini menjadi panduan implementasi integrasi QRIS MPM pada backend
NestJS untuk project Smart Gate QRIS.

Untuk tahap awal, implementasi dilakukan terhadap **ASPI DevPortal
sandbox** agar flow keamanan dan request dapat diuji tanpa menunggu
credential sandbox BRIAPI.

Setelah flow ASPI berhasil, konfigurasi akan disesuaikan untuk **BRIAPI
sandbox**.

> **Penting:** ASPI DevPortal dan BRIAPI adalah environment yang
> berbeda. Credential, private key, base URL, endpoint, dan parameter
> sandbox tidak boleh dicampur.

------------------------------------------------------------------------

## 2. Flow API

Flow yang digunakan pada ASPI DevPortal:

``` text
1. Signature Auth
       ↓
2. Access Token B2B
       ↓
3. Signature Service
       ↓
4. Generate QR MPM
```

Secara detail:

``` text
Client ID + Timestamp + Private Key
            │
            ▼
     Signature Auth
            │
            ▼
       X-SIGNATURE
            │
            ▼
      Access Token B2B
            │
            ▼
       Access Token
            │
            ▼
    Signature Service
            │
            │ Method
            │ Endpoint
            │ Timestamp
            │ Access Token
            │ Client Secret
            │ Request Body
            ▼
       X-SIGNATURE
            │
            ▼
      Generate QR MPM
            │
            ▼
       qrContent / qrImage / qrUrl
```

------------------------------------------------------------------------

## 3. Environment ASPI

``` env
ASPI_BASE_URL=https://apidevportal.aspi-indonesia.or.id:44310

ASPI_CLIENT_ID=YOUR_ASPI_CLIENT_ID
ASPI_CLIENT_SECRET=YOUR_ASPI_CLIENT_SECRET

# Private key ASPI yang diberikan melalui ASPI DevPortal.
# Untuk tahap ASPI test, key dibaca langsung dari ENV.
ASPI_PRIVATE_KEY="YOUR_ASPI_PRIVATE_KEY"
```

Private key tidak disimpan langsung di `.env`.

Struktur:

``` text
project/
├── src/
│   └── bri/
│       ├── bri.controller.ts
│       ├── bri.service.ts
│       └── bri.module.ts
├── secrets/
│   └── private_key.pem          # key BRI/SNAP, dipakai nanti
├── .env                         # ASPI private key untuk test sementara
└── docker-compose.yml
```

Untuk Docker:

``` yaml
volumes:
  - ./secrets:/usr/src/app/secrets:ro
```

Jangan commit `.env` maupun `secrets/` ke Git.

------------------------------------------------------------------------

## 4. Timestamp

Gunakan format:

``` text
2026-09-18T13:30:00+07:00
```

Helper:

``` typescript
private generateTimestamp(): string {
  const now = new Date();

  const jakartaTime = new Date(
    now.getTime() + 7 * 60 * 60 * 1000,
  );

  return jakartaTime.toISOString().slice(0, 19) + '+07:00';
}
```

Pada pengujian ASPI sebelumnya, timestamp dengan milidetik menyebabkan
error karena panjangnya melebihi batas yang diterima.

------------------------------------------------------------------------

## 5. Step 1 --- Signature Auth

Endpoint:

``` http
POST /api/v1.0/utilities/signature-auth
```

Parameter pada ASPI:

``` text
X-TIMESTAMP
X-CLIENT-KEY
Private_Key
```

Konsep:

``` text
Client ID + "|" + Timestamp
             ↓
        RSA SHA-256
             ↓
       Base64 Signature
```

Implementasi:

``` typescript
private generateSignatureAuth(timestamp: string): string {
  const privateKey = process.env.ASPI_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('ASPI_PRIVATE_KEY is not configured');
  }

  const stringToSign = `${this.clientId}|${timestamp}`;

  const sign = crypto.createSign('RSA-SHA256');

  sign.update(stringToSign);
  sign.end();

  return sign.sign(privateKey, 'base64');
}
```

Hasilnya digunakan sebagai `X-SIGNATURE` pada Access Token B2B.

------------------------------------------------------------------------

## 6. Step 2 --- Access Token B2B

Endpoint ASPI:

``` http
POST /api/v1.0/access-token/b2b
```

Header:

``` text
Content-Type: application/json
X-TIMESTAMP: <timestamp>
X-CLIENT-KEY: <client id>
X-SIGNATURE: <signature-auth>
```

Body:

``` json
{
  "grantType": "client_credentials",
  "additionalInfo": {}
}
```

Response sukses:

``` json
{
  "responseCode": "2007300",
  "responseMessage": "Successful",
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": "900",
  "additionalInfo": {}
}
```

Token berlaku sekitar 15 menit pada environment yang diuji.

Implementasi final sebaiknya melakukan cache:

``` text
getAccessToken()
       │
       ├── token masih valid → gunakan token lama
       │
       └── token expired → request token baru
```

------------------------------------------------------------------------

## 7. Step 3 --- Signature Service

Endpoint:

``` http
POST /api/v1.0/utilities/signature-service
```

Parameter:

``` text
X-TIMESTAMP
X-CLIENT-SECRET
HttpMethod
EndpointUrl
AccessToken
body
```

Contoh target:

``` text
HttpMethod  = POST
EndpointUrl = /api/v1.0/qr/qr-mpm-generate
AccessToken = access token hasil Step 2
X-TIMESTAMP = timestamp baru
body        = body Generate QR
```

### Sangat penting

Body yang digunakan untuk Signature Service harus **persis sama** dengan
body yang dikirim ke Generate QR.

Contoh:

``` typescript
const requestBody = {
  partnerReferenceNo: '...',
  amount: {
    value: '5000.00',
    currency: 'IDR',
  },
  merchantId: 'merch00001',
  // ...
};

const bodyString = JSON.stringify(requestBody);

// bodyString digunakan saat membuat signature.
// requestBody yang sama dikirim ke Generate QR.
```

Perbedaan body dapat menyebabkan:

``` text
4014700 Invalid Signature
```

------------------------------------------------------------------------

## 8. Signature Transaction

Secara konsep, signature transactional SNAP dibentuk dari:

``` text
HTTPMethod
:
EndpointUrl
:
AccessToken
:
SHA256(MinifiedRequestBody)
:
X-TIMESTAMP
```

Kemudian diproses menggunakan:

``` text
HMAC-SHA512
key = Client Secret
```

Hasilnya digunakan sebagai `X-SIGNATURE`.

Untuk ASPI DevPortal, Signature Service dapat digunakan selama tahap
pengujian untuk menghasilkan signature tersebut.

------------------------------------------------------------------------

## 9. Step 4 --- Generate QR MPM

Endpoint ASPI:

``` http
POST /api/v1.0/qr/qr-mpm-generate
```

Sandbox merchant yang ditampilkan ASPI:

``` text
merchantId = merch00001
```

Contoh request:

``` json
{
  "partnerReferenceNo": "2020102900000000000001",
  "amount": {
    "value": "5000.00",
    "currency": "IDR"
  },
  "feeAmount": {
    "value": "0.00",
    "currency": "IDR"
  },
  "merchantId": "merch00001",
  "subMerchantId": "310928924949487",
  "storeId": "abcd",
  "terminalId": "213141251124",
  "validityPeriod": "2026-09-18T14:00:00+07:00",
  "additionalInfo": {
    "deviceId": "12345679237",
    "channel": "mobilephone"
  }
}
```

Gunakan parameter sandbox yang memang diterima oleh ASPI. Contoh
dokumentasi tidak otomatis menjadi credential production.

------------------------------------------------------------------------

## 10. Header Generate QR

``` text
Content-Type: application/json
Authorization: Bearer <accessToken>
X-TIMESTAMP: <timestamp>
X-SIGNATURE: <signature-service>
X-PARTNER-ID: <partner/client identifier>
X-EXTERNAL-ID: <numeric external id>
CHANNEL-ID: <channel id>
```

Parameter lain seperti `Authorization-Customer`, `Origin`,
`X-IP-ADDRESS`, `X-DEVICE-ID`, `X-LATITUDE`, dan `X-LONGITUDE` digunakan
sesuai kebutuhan API.

------------------------------------------------------------------------

## 11. Response Generate QR

Response sukses yang sebelumnya diperoleh dari ASPI memiliki struktur:

``` json
{
  "responseCode": "2004700",
  "responseMessage": "Successful",
  "referenceNo": "...",
  "partnerReferenceNo": "...",
  "qrContent": "...",
  "qrUrl": "...",
  "qrImage": "...",
  "redirectUrl": "...",
  "merchantName": "...",
  "storeId": "...",
  "terminalId": "...",
  "additionalInfo": {
    "deviceId": "...",
    "channel": "mobilephone"
  }
}
```

Untuk Smart Gate, informasi utama yang nantinya diperlukan frontend
adalah QR yang diberikan oleh response BRI/ASPI, terutama `qrContent`
atau representasi QR image yang sesuai.

------------------------------------------------------------------------

## 12. Controller Sementara

Selama debugging, endpoint dibuat terpisah agar setiap step dapat diuji.

``` typescript
import { Controller, Get } from '@nestjs/common';
import { AspiService } from './aspi.service';

@Controller('aspi')
export class AspiController {
  constructor(
    private readonly aspiService: AspiService,
  ) {}

  @Get('signature-auth')
  async signatureAuth() {
    return this.aspiService.signatureAuth();
  }

  @Get('token')
  async token() {
    return this.aspiService.getAccessToken();
  }
}
```

Setelah authentication berhasil, baru tambahkan endpoint untuk Signature
Service dan Generate QR.

------------------------------------------------------------------------

## 13. Struktur Service

Gunakan pemisahan fungsi:

``` text
AspiService
│
├── generateTimestamp()
├── generateSignatureAuth()
├── signatureAuth()
├── getAccessToken()
├── generateSignatureService()
└── generateQR()
```

Selama debugging, panggil step satu per satu.

Setelah semuanya berhasil, flow dapat diotomatisasi menjadi:

``` text
POST /aspi/qr
      ↓
Signature Auth
      ↓
Access Token
      ↓
Signature Service
      ↓
Generate QR
```

------------------------------------------------------------------------

## 14. Nominal Smart Gate

Tarif Smart Gate adalah Rp5.000.

Nominal sebaiknya ditentukan oleh backend, bukan frontend.

Frontend:

``` http
POST /transactions
```

tidak perlu mengirim:

``` json
{
  "amount": 5000
}
```

Backend:

``` typescript
const amount = 5000;
```

Kemudian request QR:

``` json
{
  "amount": {
    "value": "5000.00",
    "currency": "IDR"
  }
}
```

------------------------------------------------------------------------

## 15. Tahap Payment

Setelah Generate QR berhasil, endpoint QRMPM ASPI yang tersedia
mencakup:

``` text
POST /api/v1.0/qr/qr-mpm-payment
POST /api/v1.0/qr/qr-mpm-query
POST /api/v1.0/qr/qr-mpm-notify
POST /api/v1.0/qr/qr-mpm-cancel
POST /api/v1.0/qr/qr-mpm-refund
```

`qr-mpm-payment` didokumentasikan sebagai **Payment - Host to Host**.

`qr-mpm-notify` didokumentasikan sebagai **Payment Notification**.

Tahap ini dikerjakan setelah Generate QR berhasil.

------------------------------------------------------------------------

## 16. Perbedaan ASPI dan BRIAPI

### ASPI DevPortal --- testing sekarang

``` text
https://apidevportal.aspi-indonesia.or.id:44310

/api/v1.0/...
```

Digunakan untuk pengujian Devsite/API.

### BRIAPI --- target Smart Gate

``` text
https://sandbox.partner.api.bri.co.id
```

Untuk QRIS MPM Dinamis v1.1, target implementasi menggunakan endpoint
SNAP v1.1, misalnya:

``` text
/snap/v1.1/qr/qr-mpm-generate
/snap/v1.1/qr/qr-mpm-query
```

Credential BRIAPI dan parameter merchant/terminal harus menggunakan
value yang diberikan/ditentukan untuk BRIAPI sandbox.

**Jangan mencampur endpoint `/api/v1.0/...` ASPI dengan endpoint
`/snap/v1.1/...` BRIAPI.**

------------------------------------------------------------------------

## 17. Checklist

### Phase 1 --- Authentication

-   [ ] Buat `.env`
-   [ ] Simpan private key
-   [ ] Implement `generateTimestamp()`
-   [ ] Implement Signature Auth
-   [ ] Test Signature Auth
-   [ ] Implement Access Token B2B
-   [ ] Test Access Token
-   [ ] Pastikan response `2007300`
-   [ ] Pastikan token memiliki `expiresIn`

### Phase 2 --- QR

-   [ ] Implement Signature Service
-   [ ] Pastikan body signature identik dengan body request
-   [ ] Implement Generate QR
-   [ ] Test response `2004700`
-   [ ] Ambil `referenceNo`
-   [ ] Ambil `partnerReferenceNo`
-   [ ] Ambil `qrContent` / QR image

### Phase 3 --- Payment

-   [ ] Test `qr-mpm-payment`
-   [ ] Test `qr-mpm-query`
-   [ ] Test `qr-mpm-notify`
-   [ ] Tentukan flow status transaksi

### Phase 4 --- BRI Sandbox

-   [ ] Dapatkan BRI sandbox access
-   [ ] Dapatkan/konfirmasi Client ID
-   [ ] Dapatkan/konfirmasi Client Secret
-   [ ] Konfirmasi public key terdaftar
-   [ ] Konfirmasi URL Token
-   [ ] Konfirmasi URL Inquiry
-   [ ] Konfirmasi URL Payment
-   [ ] Konfirmasi merchant ID
-   [ ] Konfirmasi terminal ID
-   [ ] Jalankan E2E/UAT sesuai arahan BRI

### Phase 5 --- Smart Gate

-   [ ] Transaction module
-   [ ] Fixed amount Rp5.000
-   [ ] QRIS module
-   [ ] Notification callback
-   [ ] Inquiry/recovery
-   [ ] Raspberry Pi WebSocket
-   [ ] Gate device authentication
-   [ ] Relay control
-   [ ] Gate opening
-   [ ] Transaction logging
-   [ ] Dashboard revenue

------------------------------------------------------------------------

## 18. Aturan Debugging

### Timestamp baru

Setiap request menggunakan timestamp baru.

``` text
Request A → timestamp A
Request B → timestamp B
```

### Signature baru

Signature tidak dipakai ulang untuk request yang berbeda.

``` text
Access Token → Signature Auth
Generate QR   → Signature Service
Payment       → Signature Service baru
Query         → Signature Service baru
```

### Body harus identik

``` text
Body yang di-sign
        =
Body yang dikirim
```

### Token dapat digunakan selama masih aktif

``` text
Token A
   │
   ├── Generate QR
   ├── Query
   └── Payment
```

Selama token masih valid, tidak perlu meminta token baru pada setiap
request.

### Credential jangan dicampur

Jangan menggunakan:

``` text
ASPI Client ID + BRI Private Key
```

atau:

``` text
BRI Client ID + ASPI Private Key
```

Pasangan credential dan key harus sesuai environment.

------------------------------------------------------------------------

## 19. Target Pertama

Untuk coding sekarang, jangan langsung menyelesaikan seluruh Smart Gate.

Target pertama:

``` text
NestJS
   ↓
ASPI Signature Auth
   ↓
Access Token B2B
   ↓
Signature Service
   ↓
Generate QR MPM
   ↓
2004700 Successful
   ↓
qrContent
```

Setelah target ini berhasil, baru lanjut ke payment, query,
notification, dan integrasi Raspberry Pi.

------------------------------------------------------------------------

## 20. Arsitektur Smart Gate Final

Setelah integrasi BRIAPI tersedia:

``` text
Visitor
   │
   ▼
Kiosk / Touchscreen
   │
   │ POST /transactions
   ▼
NestJS Backend
   │
   ├── Fixed amount Rp5.000
   ├── BRI Authentication
   ├── Generate QR
   └── Transaction Database
          │
          ▼
       QRIS BRI
          │
          ▼
      Visitor bayar
          │
          ▼
       BRI Notify
          │
          ▼
      NestJS Backend
          │
          ├── Validate payment
          ├── Update SUCCESS
          └── Send event
                    │
                    ▼
              Raspberry Pi
                    │
                    ▼
                  Relay
                    │
                    ▼
                TS2000
                    │
                    ▼
                Gate Open
```

**Urutan pengerjaan sekarang: Signature Auth → Access Token B2B →
Signature Service → Generate QR.**


---

## 21. Perubahan Konfigurasi Key dan Tarif

Keputusan implementasi terbaru:

### ASPI DevPortal

Private key **langsung dibaca dari ENV**:

```env
ASPI_PRIVATE_KEY="..."
```

Contoh service:

```typescript
private getAspiPrivateKey(): string {
  const privateKey = process.env.ASPI_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('ASPI_PRIVATE_KEY is not configured');
  }

  return privateKey;
}
```

Kemudian:

```typescript
const privateKey = this.getAspiPrivateKey();

const sign = crypto.createSign('RSA-SHA256');
sign.update(stringToSign);
sign.end();

return sign.sign(privateKey, 'base64');
```

### BRIAPI

Untuk BRIAPI nanti tetap gunakan key file yang sudah dibuat untuk SNAP, misalnya:

```text
secrets/private_key.pem
```

Karena ASPI dan BRIAPI merupakan environment berbeda, key tidak boleh dipakai silang.

### Tarif

Tarif gate tidak lagi dianggap hardcoded `5000`.

Backend mengambil tarif aktif dari database/configuration sehingga admin dapat mengubahnya.

Frontend hanya meminta pembuatan transaksi:

```http
POST /transactions
```

Backend yang menentukan:

```text
amount = tarif aktif
```

Kemudian amount tersebut digunakan secara konsisten untuk:

```text
Database Transaction
        =
Signature Service body
        =
Generate QR body
```

