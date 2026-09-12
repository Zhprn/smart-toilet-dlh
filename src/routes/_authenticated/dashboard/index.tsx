import { createFileRoute } from "@tanstack/react-router";
import { 
  BarChart3, 
  RotateCw, 
  Users,
  CheckCircle2
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const weeklyData = [
    { day: "Sen", value: "32k", height: "h-[68%]" },
    { day: "Sel", value: "26k", height: "h-[54%]" },
    { day: "Rab", value: "20k", height: "h-[40%]" },
    { 
      day: "Kam", 
      value: "28k", 
      height: "h-[85%]", 
      active: true,
      gradient: "bg-gradient-to-t from-[#1D408C] to-[#2B59C3]" 
    },
    { day: "Jum", value: "18k", height: "h-[36%]" },
    { day: "Sab", value: "22k", height: "h-[46%]" },
    { day: "Min", value: "12k", height: "h-[22%]" },
  ];

  return (
    <div className="flex w-full flex-col justify-between space-y-6 lg:h-[calc(100vh-4rem)] lg:space-y-0 lg:overflow-hidden">
      {/* Header Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-gray-100/80 px-3.5 py-1.5 text-xs font-semibold text-gray-700">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <span>Dashboard</span>
        </div>
        <span className="text-xs text-gray-400">Sabtu, 6 September 2026</span>
      </div>

      {/* Title */}
      <div className="shrink-0 py-1">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Selamat Datang, Admin!
        </h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Smart Toilet Pantai Padang · Jl. Samudera, Padang
        </p>
      </div>

      {/* 4 Kartu Metrik */}
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl bg-[#1D408C] p-5 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-blue-100">Pendapatan Hari Ini</p>
            <div className="h-6 w-6 rounded-lg bg-white/20" />
          </div>
          <div>
            <p className="mt-2 text-2xl font-bold tracking-tight">Rp 8.000</p>
            <p className="mt-0.5 text-[11px] text-blue-200">4 transaksi sukses</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pendapatan Bulan Ini</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">Rp 20.000</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white">
              <RotateCw className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">September 2026</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Pengunjung</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">5</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 text-white">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Pengguna hari ini</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Tingkat Keberhasilan</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">91.7%</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Transaksi berhasil</p>
        </div>
      </div>

      {/* Grid Grafik & Status */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 pt-2 lg:grid-cols-3">
        <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="flex shrink-0 items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Pendapatan Mingguan</h2>
              <p className="mt-0.5 text-xs text-gray-400">6 – 12 September 2026</p>
            </div>
            <span className="rounded-xl bg-gray-100 px-3.5 py-1 text-xs font-medium text-gray-600">
              7 Hari Terakhir
            </span>
          </div>

          <div className="flex flex-1 items-end justify-between gap-2 overflow-x-auto px-2 pb-1 pt-4 sm:gap-3 sm:px-3">
            {weeklyData.map((item, idx) => (
              <div key={idx} className="flex h-full min-w-[36px] flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-gray-400">{item.value}</span>
                <div 
                  className={`w-full max-w-[58px] rounded-t-xl transition-all ${
                    item.active 
                      ? item.gradient 
                      : "bg-[#D9DEEE] hover:bg-[#c5cce4]"
                  } ${item.height}`}
                />
                <span className="pt-1 text-xs font-semibold text-gray-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h2 className="text-base font-bold text-gray-900">Status Toilet</h2>
              <div className="h-6 w-6 rounded-md bg-gray-200" />
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-700">Operasional</span>
                <span className="font-bold text-emerald-500">Aktif</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-700">Jaringan</span>
                <span className="font-bold text-emerald-500">98%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-[98%] rounded-full bg-orange-500" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-800">Semua sistem normal</p>
            <p className="mt-0.5 text-xs font-medium text-blue-600">Update: 06 Sep 2026, 11:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}