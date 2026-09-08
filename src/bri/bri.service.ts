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
}
