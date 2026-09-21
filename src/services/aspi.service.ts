import { apiClient } from "@/lib/api-client";

export interface AspiQrData {
  responseCode: string;
  responseMessage: string;
  referenceNo: string;
  partnerReferenceNo: string;
  qrContent: string;
  qrUrl?: string;
  qrImage?: string;
  terminalId?: string;
}

export interface AspiPaymentResponse {
  success: boolean;
  message: string;
  data: {
    responseCode: string;
    responseMessage: string;
    referenceNo: string;
    partnerReferenceNo: string;
    verificationId: string;
    localTransactionStatus: string;
    amountMatched: boolean;
    [key: string]: unknown;
  };
}

export const aspiService = {
  // POST /aspi/qr
  generateQr: async (payload: Record<string, unknown> = { amount: 2000 }) => {
    return apiClient.post<AspiQrData>("/aspi/qr", payload);
  },

  // POST /aspi/payment (pengganti query)
  processPayment: async (payload: Record<string, unknown>) => {
    return apiClient.post<AspiPaymentResponse>("/aspi/payment", payload);
  },
};