import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type AccessTokenResponse = {
  accessToken?: string;
  expiresIn?: string | number;
};

type SignatureAuthResponse = {
  signature?: string;
};

@Injectable()
export class AspiService {
  private static readonly qrAmountKey = 'QR_AMOUNT';
  private static readonly defaultQrAmount = 2000;

  constructor(private readonly prisma: PrismaService) {}

  private accessToken: string | null = null;
  private accessTokenExpiredAt = 0;

  private readonly baseUrl = process.env.ASPI_BASE_URL;
  private readonly clientId = process.env.ASPI_CLIENT_ID;
  private readonly clientSecret = process.env.ASPI_CLIENT_SECRET;
  private readonly partnerId =
    process.env.ASPI_PARTNER_ID ?? process.env.ASPI_CLIENT_ID;
  private readonly channelId = process.env.ASPI_CHANNEL_ID;
  private readonly merchantId = process.env.ASPI_MERCHANT_ID ?? 'merch00001';
  private readonly subMerchantId =
    process.env.ASPI_SUB_MERCHANT_ID ?? '310928924949487';
  private readonly storeId = process.env.ASPI_STORE_ID ?? 'abcd';
  private readonly terminalId = process.env.ASPI_TERMINAL_ID ?? '213141251124';
  private readonly deviceId = process.env.ASPI_DEVICE_ID ?? '12345679237';

  generateTimestamp(): string {
    const jakartaTime = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return `${jakartaTime.toISOString().slice(0, 19)}+07:00`;
  }

  private requireConfig(name: string, value: string | undefined): string {
    if (!value) {
      throw new InternalServerErrorException(`${name} is not configured`);
    }
    return value;
  }

  async getQrAmount(): Promise<number> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: AspiService.qrAmountKey },
    });

    return setting ? Number(setting.value) : AspiService.defaultQrAmount;
  }

  async updateQrAmount(amount: number): Promise<number> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('QR amount must be greater than zero');
    }

    const setting = await this.prisma.appSetting.upsert({
      where: { key: AspiService.qrAmountKey },
      create: { key: AspiService.qrAmountKey, value: amount },
      update: { value: amount },
    });

    return Number(setting.value);
  }

  async generateSignatureAuth(timestamp: string): Promise<string> {
    const baseUrl = this.requireConfig('ASPI_BASE_URL', this.baseUrl);
    const clientId = this.requireConfig('ASPI_CLIENT_ID', this.clientId);
    const privateKey = this.requireConfig(
      'ASPI_PRIVATE_KEY',
      process.env.ASPI_PRIVATE_KEY,
    );
    const response = await axios.post<SignatureAuthResponse>(
      `${baseUrl}/api/v1.0/utilities/signature-auth`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'X-TIMESTAMP': timestamp,
          'X-CLIENT-KEY': clientId,
          Private_Key: privateKey,
        },
      },
    );

    if (!response.data.signature) {
      throw new InternalServerErrorException(
        'ASPI signature-auth did not return a signature',
      );
    }

    return response.data.signature;
  }

  async signatureAuth(): Promise<{ timestamp: string; signature: string }> {
    const timestamp = this.generateTimestamp();
    return {
      timestamp,
      signature: await this.generateSignatureAuth(timestamp),
    };
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiredAt - 30_000) {
      return this.accessToken;
    }

    const baseUrl = this.requireConfig('ASPI_BASE_URL', this.baseUrl);
    const clientId = this.requireConfig('ASPI_CLIENT_ID', this.clientId);
    const timestamp = this.generateTimestamp();
    const response = await axios.post<AccessTokenResponse>(
      `${baseUrl}/api/v1.0/access-token/b2b`,
      { grantType: 'client_credentials', additionalInfo: {} },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-TIMESTAMP': timestamp,
          'X-CLIENT-KEY': clientId,
          'X-SIGNATURE': await this.generateSignatureAuth(timestamp),
        },
      },
    );

    if (!response.data.accessToken) {
      throw new InternalServerErrorException(
        'ASPI access token was not returned',
      );
    }

    this.accessToken = response.data.accessToken;
    this.accessTokenExpiredAt =
      now + Number(response.data.expiresIn ?? 900) * 1000;
    return this.accessToken;
  }

  private async generateSignatureService(
    accessToken: string,
    timestamp: string,
    body: Record<string, unknown>,
    endpoint = '/api/v1.0/qr/qr-mpm-generate',
  ): Promise<string> {
    const baseUrl = this.requireConfig('ASPI_BASE_URL', this.baseUrl);
    const clientSecret = this.requireConfig(
      'ASPI_CLIENT_SECRET',
      this.clientSecret,
    );
    const response = await axios.post<{ signature?: string }>(
      `${baseUrl}/api/v1.0/utilities/signature-service`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-TIMESTAMP': timestamp,
          'X-CLIENT-SECRET': clientSecret,
          HttpMethod: 'POST',
          EndpointUrl: endpoint,
          EndpoinUrl: endpoint,
          AccessToken: accessToken,
        },
      },
    );

    if (!response.data.signature) {
      throw new InternalServerErrorException('ASPI signature was not returned');
    }
    return response.data.signature;
  }

  async generateQr() {
    const baseUrl = this.requireConfig('ASPI_BASE_URL', this.baseUrl);
    const clientId = this.requireConfig('ASPI_CLIENT_ID', this.clientId);
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const amount = await this.getQrAmount();
    const requestBody = {
      partnerReferenceNo: `${Date.now()}${crypto.randomInt(100000, 999999)}`,
      amount: {
        value: amount.toFixed(2),
        currency: 'IDR',
      },
      feeAmount: {
        value: '0.00',
        currency: 'IDR',
      },
      merchantId: this.merchantId,
      subMerchantId: this.subMerchantId,
      storeId: this.storeId,
      terminalId: this.terminalId,
      validityPeriod: this.generateValidityPeriod(),
      additionalInfo: {
        deviceId: this.deviceId,
        channel: this.requireConfig('ASPI_CHANNEL_ID', this.channelId),
      },
    };
    const signature = await this.generateSignatureService(
      accessToken,
      timestamp,
      requestBody,
    );

    const response = await axios.post<Record<string, unknown>>(
      `${baseUrl}/api/v1.0/qr/qr-mpm-generate`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-TIMESTAMP': timestamp,
          'X-SIGNATURE': signature,
          'X-PARTNER-ID': this.partnerId ?? clientId,
          'X-EXTERNAL-ID': `${Date.now()}${crypto.randomInt(100000, 999999)}`,
          'CHANNEL-ID': this.requireConfig('ASPI_CHANNEL_ID', this.channelId),
        },
      },
    );

    const qrResponse = response.data;
    const referenceNo =
      typeof qrResponse.referenceNo === 'string' ? qrResponse.referenceNo : '';
    const qrContent =
      typeof qrResponse.qrContent === 'string' ? qrResponse.qrContent : '';

    if (!referenceNo || !qrContent) {
      throw new InternalServerErrorException(
        'ASPI QR response did not contain referenceNo or qrContent',
      );
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        partnerReferenceNo: requestBody.partnerReferenceNo,
        referenceNo,
        amount,
        status: 'PENDING',
        qrContent,
        terminalId: requestBody.terminalId,
        expiredAt: new Date(requestBody.validityPeriod),
      },
    });

    return {
      ...qrResponse,
      transactionId: transaction.id,
      transactionStatus: transaction.status,
    };
  }

  async payment(
    partnerReferenceNo: string,
    otp: string,
    verificationId: string,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { partnerReferenceNo },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const body = {
      partnerReferenceNo,
      merchantId: this.merchantId,
      subMerchantId: this.subMerchantId,
      amount: {
        value: Number(transaction.amount).toFixed(2),
        currency: 'IDR',
      },
      feeAmount: {
        value: '0.00',
        currency: 'IDR',
      },
      otp,
      verificationId,
      additionalInfo: {
        deviceId: this.deviceId,
        channel: this.requireConfig('ASPI_CHANNEL_ID', this.channelId),
      },
    };

    return this.sendSignedQrRequest('/api/v1.0/qr/qr-mpm-payment', body);
  }

  async query(partnerReferenceNo: string) {
    const body = {
      partnerReferenceNo,
      merchantId: this.merchantId,
      subMerchantId: this.subMerchantId,
      additionalInfo: {
        deviceId: this.deviceId,
        channel: this.requireConfig('ASPI_CHANNEL_ID', this.channelId),
      },
    };

    return this.sendSignedQrRequest('/api/v1.0/qr/qr-mpm-query', body);
  }

  private async sendSignedQrRequest(
    endpoint: string,
    body: Record<string, unknown>,
  ) {
    const baseUrl = this.requireConfig('ASPI_BASE_URL', this.baseUrl);
    const clientId = this.requireConfig('ASPI_CLIENT_ID', this.clientId);
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const signature = await this.generateSignatureService(
      accessToken,
      timestamp,
      body,
      endpoint,
    );

    const response = await axios.post<Record<string, unknown>>(
      `${baseUrl}${endpoint}`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-TIMESTAMP': timestamp,
          'X-SIGNATURE': signature,
          'X-PARTNER-ID': this.partnerId ?? clientId,
          'X-EXTERNAL-ID': `${Date.now()}${crypto.randomInt(100000, 999999)}`,
          'CHANNEL-ID': this.requireConfig('ASPI_CHANNEL_ID', this.channelId),
        },
      },
    );

    return response.data;
  }

  findTransactions() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async handlePaymentNotification(payload: Record<string, unknown>) {
    const partnerReferenceNo = this.getString(payload, 'partnerReferenceNo');
    const responseCode = this.getString(payload, 'responseCode');

    if (!partnerReferenceNo) {
      throw new BadRequestException('partnerReferenceNo is required');
    }

    const status = this.isSuccessfulResponse(responseCode)
      ? 'SUCCESS'
      : 'FAILED';
    const transaction = await this.prisma.transaction.update({
      where: { partnerReferenceNo },
      data: {
        status,
        ...(status === 'SUCCESS' ? { paidAt: new Date() } : {}),
      },
    });

    return transaction;
  }

  async simulatePayment(
    partnerReferenceNo: string,
    status: 'SUCCESS' | 'FAILED',
  ) {
    if (process.env.ASPI_ENABLE_TEST_PAYMENT !== 'true') {
      throw new ForbiddenException('Test payment simulation is disabled');
    }

    return this.prisma.transaction.update({
      where: { partnerReferenceNo },
      data: {
        status,
        ...(status === 'SUCCESS' ? { paidAt: new Date() } : {}),
      },
    });
  }

  private getString(
    payload: Record<string, unknown>,
    key: string,
  ): string | undefined {
    return typeof payload[key] === 'string' ? payload[key] : undefined;
  }

  private isSuccessfulResponse(responseCode: string | undefined): boolean {
    return responseCode === '2004700' || responseCode === '2000000';
  }

  private generateValidityPeriod(): string {
    const validity = new Date(Date.now() + 15 * 60 * 1000);
    const jakartaTime = new Date(validity.getTime() + 7 * 60 * 60 * 1000);
    return `${jakartaTime.toISOString().slice(0, 19)}+07:00`;
  }
}
