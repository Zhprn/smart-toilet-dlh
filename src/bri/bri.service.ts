import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class BriService {
  async getAccessToken() {
    const clientId = process.env.BRI_CLIENT_ID!;
    const privateKey = fs.readFileSync(
      process.env.BRI_PRIVATE_KEY_PATH!,
      'utf8',
    );

    const timestamp = new Date().toISOString();

    const stringToSign = `${clientId}|${timestamp}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(stringToSign);
    signer.end();

    const signature = signer.sign(privateKey, 'base64');

    const response = await axios.post(
      `${process.env.BRI_BASE_URL}/snap/v1.0/access-token/b2b`,
      {
        grantType: 'client_credentials',
      },
      {
        headers: {
          'X-CLIENT-KEY': clientId,
          'X-TIMESTAMP': timestamp,
          'X-SIGNATURE': signature,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  async generateQr() {
    const accessToken = await this.getAccessToken();

    const timestamp = new Date().toISOString();

    const partnerReferenceNo = `GATE-${Date.now()}`;

    const body = {
      partnerReferenceNo,
      amount: {
        value: '5000.00',
        currency: 'IDR',
      },
      merchantId: process.env.BRI_MERCHANT_ID!,
      terminalId: process.env.BRI_TERMINAL_ID!,
    };

    const minifiedBody = JSON.stringify(body);

    const bodyHash = crypto
      .createHash('sha256')
      .update(minifiedBody)
      .digest('hex')
      .toLowerCase();

    const endpoint = '/snap/v1.1/qr/qr-mpm-generate';

    const stringToSign = [
      'POST',
      endpoint,
      accessToken,
      bodyHash,
      timestamp,
    ].join(':');

    const signature = crypto
      .createHmac('sha512', process.env.BRI_CLIENT_SECRET!)
      .update(stringToSign)
      .digest('hex');

    const response = await axios.post(
      `${process.env.BRI_BASE_URL}${endpoint}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-TIMESTAMP': timestamp,
          'X-SIGNATURE': signature,
          'X-PARTNER-ID': process.env.BRI_PARTNER_ID!,
          'CHANNEL-ID': process.env.BRI_CHANNEL_ID!,
          'X-EXTERNAL-ID': partnerReferenceNo,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }
}
