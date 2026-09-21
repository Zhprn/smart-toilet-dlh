import { apiClient } from "@/lib/api-client";

export interface TransactionItem {
  id: string;
  partnerReferenceNo: string;
  externalId: string;
  referenceNo: string;
  amount: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  qrContent: string;
  terminalId: string;
  createdAt: string;
  paidAt: string | null;
  expiredAt: string;
}

export interface TransactionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: {
    data: TransactionItem[];
    meta: TransactionMeta;
  };
}

export const transactionService = {
  getTransactions: async (page = 1, limit = 10) => {
    return apiClient.get<TransactionListResponse>(
      `/transaction?page=${page}&limit=${limit}`
    );
  },

  exportTransactions: async (): Promise<Blob> => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;

    const authHeader = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : "";

    const response = await fetch(`${baseUrl}/transaction/export`, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }

    return response.blob();
  },
};