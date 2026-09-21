import { apiClient } from "@/lib/api-client";

export interface GateDevice {
  id: string;
  name: string;
  deviceCode: string;
  status: "ONLINE" | "OFFLINE" | string;
  lastConnectedAt: string;
}

export interface WeeklyTrendItem {
  label: string;
  value: number;
}

export interface DashboardSummaryData {
  todayRevenue: number;
  monthRevenue: number;
  totalVisitors: number;
  successRate: number;
  gateStatus: {
    total: number;
    active: number;
    inactive: number;
    devices: GateDevice[];
  };
  weeklyTrend: WeeklyTrendItem[];
  activeGateCount: number;
  totalGateCount: number;
}

export interface DashboardSummaryResponse {
  success: boolean;
  message: string;
  data: DashboardSummaryData;
}

export const dashboardService = {
  getSummary: async () => {
    return apiClient.get<DashboardSummaryResponse>("/dashboard/summary");
  },
};