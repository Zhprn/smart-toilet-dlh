import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  Percent,
  DoorClosed,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  TrendingUp,
} from "lucide-react";
import {
  dashboardService,
  type DashboardSummaryData,
} from "@/services/dashboard.service";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await dashboardService.getSummary();
        const data = (res.data as any)?.data || res.data;
        setSummary(data);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D408C]" />
        <span className="text-sm font-medium">Memuat data dashboard...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-2 text-rose-500">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-gray-100 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  const formatRupiah = (val: number = 0) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Dashboard Smart Toilet
        </h1>
        <p className="text-xs text-gray-500 sm:text-sm">
          Monitoring gate dan retribusi kebersihan DLH Kota Padang
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Pendapatan Hari Ini
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-[#1D408C]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {formatRupiah(summary?.todayRevenue)}
          </p>
          <span className="text-[11px] text-gray-400">
            Bulan ini: {formatRupiah(summary?.monthRevenue)}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Total Pengunjung
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {summary?.totalVisitors?.toLocaleString("id-ID") || 0}
          </p>
          <span className="text-[11px] text-gray-400">Akses masuk terverifikasi</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Success Rate
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {summary?.successRate || 0}%
          </p>
          <span className="text-[11px] text-gray-400">Rasio transaksi sukses</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Status Gate
            </span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <DoorClosed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">
              {summary?.activeGateCount ?? summary?.gateStatus?.active ?? 0}
            </p>
            <span className="text-xs text-gray-400">
              / {summary?.totalGateCount ?? summary?.gateStatus?.total ?? 0} Aktif
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            {summary?.gateStatus?.inactive ?? 0} perangkat offline
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Trend Transaksi Mingguan</h2>
              <p className="text-xs text-gray-400">Jumlah pengunjung dalam 7 hari terakhir</p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>

          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-2">
            {summary?.weeklyTrend?.map((item, idx) => {
              const maxValue = Math.max(
                ...(summary?.weeklyTrend?.map((d) => d.value) || [1]),
                1
              );
              const heightPercent = Math.round((item.value / maxValue) * 100);

              return (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-600">
                    {item.value}
                  </span>
                  <div className="relative flex h-32 w-full max-w-[36px] items-end justify-center rounded-lg bg-gray-100">
                    <div
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      className="w-full rounded-lg bg-[#1D408C] transition-all duration-500"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Status Gate</h2>
            <p className="text-xs text-gray-400">Kondisi perangkat keras fisik</p>
          </div>

          <div className="mt-4 space-y-3">
            {summary?.gateStatus?.devices && summary.gateStatus.devices.length > 0 ? (
              summary.gateStatus.devices.map((device) => {
                const isOnline = device.status?.toUpperCase() === "ONLINE" || device.status?.toUpperCase() === "ACTIVE";

                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          isOnline
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {isOnline ? (
                          <Wifi className="h-4 w-4" />
                        ) : (
                          <WifiOff className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 leading-tight">
                          {device.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Kode: {device.deviceCode}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isOnline
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {device.status}
                      </span>
                      <p className="mt-1 text-[9px] text-gray-400">
                        {new Date(device.lastConnectedAt).toLocaleDateString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-gray-400">
                Tidak ada perangkat gate terdaftar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}