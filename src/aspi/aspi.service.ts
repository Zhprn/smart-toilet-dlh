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
import { DashboardService } from '../dashboard/dashboard.service';

type AccessTokenResponse = {
  accessToken?: string;
  expiresIn?: string | number;
};

type SignatureAuthResponse = {
  signature?: string;
};

@Injectable()
export class AspiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService,
  ) {}

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
  private readonly serviceCode = process.env.ASPI_SERVICE_CODE ?? '47';
  private readonly externalStoreId =
    process.env.ASPI_EXTERNAL_STORE_ID ?? this.subMerchantId;

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
    const amount = await this.dashboardService.getQrAmount();
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
    const externalId = `${Date.now()}${crypto.randomInt(100000, 999999)}`;

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
          'X-EXTERNAL-ID': externalId,
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
        externalId,
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

    const paymentResponse = await this.sendSignedQrRequest(
      '/api/v1.0/qr/qr-mpm-payment',
      body,
    );
    const responseAmount = this.getNestedString(
      paymentResponse,
      'amount',
      'value',
    );
    const paymentSucceeded =
      this.getString(paymentResponse, 'responseCode') === '2005000' &&
      responseAmount === Number(transaction.amount).toFixed(2);

    if (paymentSucceeded) {
      await this.prisma.transaction.update({
        where: { partnerReferenceNo },
        data: { status: 'SUCCESS', paidAt: new Date() },
      });
    }

    return {
      ...paymentResponse,
      localTransactionStatus: paymentSucceeded ? 'SUCCESS' : transaction.status,
      amountMatched: responseAmount === Number(transaction.amount).toFixed(2),
    };
  }

  async query(partnerReferenceNo: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { partnerReferenceNo },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const body = {
      originalReferenceNo: transaction.referenceNo,
      originalPartnerReferenceNo: transaction.partnerReferenceNo,
      originalExternalId:
        transaction.externalId ?? transaction.partnerReferenceNo,
      serviceCode: this.serviceCode,
      merchantId: this.merchantId,
      externalStoreId: this.externalStoreId,
      additionalInfo: {
        deviceId: this.deviceId,
        channel: this.requireConfig('ASPI_CHANNEL_ID', this.channelId),
      },
    };

    const queryResponse = await this.sendSignedQrRequest(
      '/api/v1.0/qr/qr-mpm-query',
      body,
    );

    const latestTransactionStatus = this.getString(
      queryResponse,
      'latestTransactionStatus',
    );
    const responseAmount = this.getNestedString(
      queryResponse,
      'amount',
      'value',
    );
    const expectedAmount = Number(transaction.amount).toFixed(2);

    if (latestTransactionStatus === '00' && responseAmount === expectedAmount) {
      await this.prisma.transaction.update({
        where: { partnerReferenceNo },
        data: { status: 'SUCCESS', paidAt: new Date() },
      });
    }

    return {
      ...queryResponse,
      localTransactionStatus:
        latestTransactionStatus === '00' && responseAmount === expectedAmount
          ? 'SUCCESS'
          : transaction.status,
      amountMatched: responseAmount === expectedAmount,
    };
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

  async handlePaymentNotification(payload: Record<string, unknown>) {
    const partnerReferenceNo =
      this.getString(payload, 'originalPartnerReferenceNo') ??
      this.getString(payload, 'partnerReferenceNo');
    const responseCode = this.getString(payload, 'responseCode');
    const transactionStatus = this.getString(
      payload,
      'latestTransactionStatus',
    );
    const transactionStatusDesc = this.getString(
      payload,
      'transactionStatusDesc',
    );

    if (!partnerReferenceNo) {
      throw new BadRequestException('partnerReferenceNo is required');
    }

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { partnerReferenceNo },
    });

    if (!existingTransaction) {
      throw new NotFoundException(
        `Transaction not found for partnerReferenceNo: ${partnerReferenceNo}`,
      );
    }

    const status = this.isSuccessfulResponse(
      responseCode,
      transactionStatus,
      transactionStatusDesc,
    )
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

  private getNestedString(
    payload: Record<string, unknown>,
    objectKey: string,
    valueKey: string,
  ): string | undefined {
    const nested = payload[objectKey];
    if (!nested || typeof nested !== 'object') {
      return undefined;
    }

    const value = (nested as Record<string, unknown>)[valueKey];
    return typeof value === 'string' ? value : undefined;
  }

  private isSuccessfulResponse(
    responseCode: string | undefined,
    transactionStatus?: string,
    transactionStatusDesc?: string,
  ): boolean {
    return (
      responseCode === '2004700' ||
      responseCode === '2000000' ||
      transactionStatus === '00' ||
      transactionStatusDesc?.toLowerCase() === 'success'
    );
  }

  private generateValidityPeriod(): string {
    const validity = new Date(Date.now() + 15 * 60 * 1000);
    const jakartaTime = new Date(validity.getTime() + 7 * 60 * 60 * 1000);
    return `${jakartaTime.toISOString().slice(0, 19)}+07:00`;
  }
}
