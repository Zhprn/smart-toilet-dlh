import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { GateService } from '../gate/gate.service';

@Injectable()
export class BriService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService,
    private readonly gateService: GateService,
  ) {}

  private accessToken: string | null = null;
  private accessTokenExpiredAt = 0;

  private readonly baseUrl = process.env.BRI_BASE_URL!;

  private readonly clientId = process.env.BRI_CLIENT_ID!;
  private readonly clientSecret = process.env.BRI_CLIENT_SECRET!;

  private readonly partnerId = process.env.BRI_PARTNER_ID!;
  private readonly channelId = process.env.BRI_CHANNEL_ID!;

  private readonly merchantId = process.env.BRI_MERCHANT_ID!;
  private readonly terminalId = process.env.BRI_TERMINAL_ID!;

  private readonly privateKey = process.env.BRI_PRIVATE_KEY!;
  private readonly webhookSecret = process.env.BRI_WEBHOOK_SECRET;

  /**
   * Generate timestamp ISO 8601
   */
  private generateTimestamp(): string {
    const now = new Date();

    const jakartaTime = new Date(
      now.getTime() + 7 * 60 * 60 * 1000,
    );

    return jakartaTime
      .toISOString()
      .slice(0, 19) + '+07:00';
  }
  /**
   * Generate unique external ID.
   *
   * BRI requires X-EXTERNAL-ID to be unique.
   */
  private generateExternalId(): string {
    return Date.now().toString() + crypto.randomInt(100000, 999999);
  }

  /**
   * Generate access token.
   *
   * Token tidak perlu dibuat setiap request.
   * Kita cache sampai mendekati expired.
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Buffer 30 detik sebelum expired
    if (this.accessToken && now < this.accessTokenExpiredAt - 30_000) {
      return this.accessToken;
    }

    const timestamp = this.generateTimestamp();

    const stringToSign = `${this.clientId}|${timestamp}`;

    /**
     * Signature OAuth:
     * SHA256withRSA
     */
    // const privateKeyPath = join(
    //   process.cwd(),
    //   'secrets',
    //   'bri_private_key.pem',
    // );
    // const privateKey = readFileSync(privateKeyPath, 'utf8');
    const privateKey = this.privateKey;

    if (!privateKey) {
      throw new InternalServerErrorException(
        'BRI_PRIVATE_KEY belum dikonfigurasi',
      );
    }

    const signer = crypto.createSign('RSA-SHA256');

    signer.update(stringToSign);
    signer.end();

    const signature = signer.sign(privateKey, 'base64');

    const response = await axios.post(
      `${this.baseUrl}/api/v1.0/access-token/b2b`,
      {
        grantType: 'client_credentials',
        additionalInfo: {},
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-TIMESTAMP': timestamp,
          'X-CLIENT-KEY': this.clientId,
          'X-SIGNATURE': signature,
        },
      },
    );

    const data = response.data;

    if (!data.accessToken) {
      throw new InternalServerErrorException(
        `Gagal mendapatkan BRI access token: ${JSON.stringify(data)}`,
      );
    }

    this.accessToken = data.accessToken;

    const expiresIn = Number(data.expiresIn ?? 900);

    this.accessTokenExpiredAt = Date.now() + expiresIn * 1000;

    return data.accessToken;
  }

  /**
   * Generate BRI transactional signature.
   */
  private generateSignature(
    method: string,
    endpoint: string,
    accessToken: string,
    timestamp: string,
    body: unknown,
  ): string {
    /**
     * JSON.stringify menghasilkan compact JSON
     * tanpa whitespace tambahan.
     */
    const minifiedBody = JSON.stringify(body);

    const bodyHash = crypto
      .createHash('sha256')
      .update(minifiedBody)
      .digest('hex')
      .toLowerCase();

    const stringToSign = `${method}:${endpoint}:${accessToken}:${bodyHash}:${timestamp}`;

    return crypto
      .createHmac('sha512', this.clientSecret)
      .update(stringToSign)
      .digest('base64');
  }

  /**
   * Generate QR MPM Dynamic
   */
  async generateQR() {
    const endpoint = '/api/v1.0/qr/qr-mpm-generate';

    const accessToken = await this.getAccessToken();

    const timestamp = this.generateTimestamp();
    const qrAmount = await this.dashboardService.getQrAmount();
    const partnerReferenceNo = `GATE-${Date.now()}`;

    const body = {
      partnerReferenceNo,

      amount: {
        value: qrAmount.toFixed(2),
        currency: 'IDR',
      },

      merchantId: this.merchantId,

      terminalId: this.terminalId,
    };

    const signature = this.generateSignature(
      'POST',
      endpoint,
      accessToken,
      timestamp,
      body,
    );

    const externalId = this.generateExternalId();

    const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',

        Authorization: `Bearer ${accessToken}`,

        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signature,

        'X-PARTNER-ID': this.partnerId,
        'X-EXTERNAL-ID': externalId,
        'CHANNEL-ID': this.channelId,
      },
    });

    const responseData = response.data as Record<string, unknown>;
    const referenceNo =
      typeof responseData.referenceNo === 'string'
        ? responseData.referenceNo
        : '';
    const qrContent =
      typeof responseData.qrContent === 'string' ? responseData.qrContent : '';

    if (!referenceNo || !qrContent) {
      return response.data;
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        partnerReferenceNo,
        externalId,
        referenceNo,
        amount: qrAmount,
        status: 'PENDING',
        qrContent,
        terminalId: this.terminalId,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return {
      ...responseData,
      transactionId: transaction.id,
      transactionStatus: transaction.status,
    };
  }

  async inquiry(partnerReferenceNo: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { partnerReferenceNo },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const endpoint = '/api/v1.0/qr/qr-mpm-query';
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const body = {
      originalReferenceNo: transaction.referenceNo,
      originalPartnerReferenceNo: transaction.partnerReferenceNo,
      terminalId: transaction.terminalId,
    };
    const signature = this.generateSignature(
      'POST',
      endpoint,
      accessToken,
      timestamp,
      body,
    );
    const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
      headers: this.buildTransactionHeaders(accessToken, timestamp, signature),
    });

    const responseAmount = this.getAmount(response.data);
    if (
      responseAmount !== undefined &&
      responseAmount !== Number(transaction.amount).toFixed(2)
    ) {
      throw new BadRequestException('Inquiry amount does not match transaction');
    }

    return this.applyPaymentStatus(transaction, response.data);
  }

  async handleNotification(
    payload: Record<string, unknown>,
    signature?: string,
  ) {
    this.verifyWebhookSignature(payload, signature);

    const partnerReferenceNo = this.getString(
      payload,
      'originalPartnerReferenceNo',
    );
    if (!partnerReferenceNo) {
      throw new BadRequestException('originalPartnerReferenceNo is required');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { partnerReferenceNo },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const amount = this.getAmount(payload);
    if (
      amount !== undefined &&
      amount !== Number(transaction.amount).toFixed(2)
    ) {
      throw new BadRequestException(
        'Notification amount does not match transaction',
      );
    }

    return this.applyPaymentStatus(transaction, payload);
  }

  private async applyPaymentStatus(
    transaction: { partnerReferenceNo: string; amount: unknown; status: string },
    payload: Record<string, unknown>,
  ) {
    const statusCode = this.getString(payload, 'latestTransactionStatus');
    const responseCode = this.getString(payload, 'responseCode');
    const success = statusCode === '00' || responseCode === '2000000';
    const failed = ['01', '02', '03', '04', '05'].includes(statusCode ?? '');

    if (!success && !failed) {
      return { ...payload, localTransactionStatus: transaction.status };
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { partnerReferenceNo: transaction.partnerReferenceNo },
      data: {
        status: success ? 'SUCCESS' : 'FAILED',
        ...(success ? { paidAt: new Date() } : {}),
      },
    });
    if (success) {
      await this.gateService.openGate(
        updatedTransaction.terminalId,
        updatedTransaction.id,
      );
    }
    return updatedTransaction;
  }

  private verifyWebhookSignature(
    payload: Record<string, unknown>,
    signature?: string,
  ) {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('BRI_WEBHOOK_SECRET is not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('BRI webhook signature is required');
    }

    const expected = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('base64');
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature);
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Invalid BRI webhook signature');
    }
  }

  private buildTransactionHeaders(
    accessToken: string,
    timestamp: string,
    signature: string,
  ) {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': this.partnerId,
      'X-EXTERNAL-ID': this.generateExternalId(),
      'CHANNEL-ID': this.channelId,
    };
  }

  private getString(payload: Record<string, unknown>, key: string) {
    return typeof payload[key] === 'string' ? payload[key] : undefined;
  }

  private getAmount(payload: Record<string, unknown>) {
    const amount = payload.amount;
    if (!amount || typeof amount !== 'object') {
      return undefined;
    }
    const value = (amount as Record<string, unknown>).value;
    return typeof value === 'string' || typeof value === 'number'
      ? Number(value).toFixed(2)
      : undefined;
  }

  async payment(params: {
    partnerReferenceNo: string;
    otp: string;
    verificationId: string;
  }) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { partnerReferenceNo: params.partnerReferenceNo },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const endpoint = '/api/v1.0/qr/qr-mpm-payment';

    const accessToken = await this.getAccessToken();

    const timestamp = this.generateTimestamp();

    const body = {
      partnerReferenceNo: params.partnerReferenceNo,

      merchantId: this.merchantId,

      amount: {
        value: Number(transaction.amount).toFixed(2),
        currency: 'IDR',
      },

      otp: params.otp,

      verificationId: params.verificationId,

      additionalInfo: {
        deviceId: '12345679237',
        channel: 'mobilephone',
      },
    };

    const signature = this.generateSignature(
      'POST',
      endpoint,
      accessToken,
      timestamp,
      body,
    );

    const externalId = this.generateExternalId();

    const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',

        Authorization: `Bearer ${accessToken}`,

        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signature,

        'X-PARTNER-ID': this.partnerId,
        'X-EXTERNAL-ID': externalId,
        'CHANNEL-ID': this.channelId,
      },
    });

    return this.applyPaymentStatus(transaction, response.data);
  }
}
