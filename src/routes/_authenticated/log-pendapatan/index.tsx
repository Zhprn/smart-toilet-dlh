import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ReceiptText, Download, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/log-pendapatan/")({
  component: LogPendapatanComponent,
});

type TransactionStatus = "berhasil" | "gagal" | "pending";

interface Transaction {
  id: number;
  tanggal: string;
  waktu: string;
  metode: string;
  nominal: number;
  status: TransactionStatus;
}

const TRANSACTION_DATA: Transaction[] = [
  { id: 1, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 2, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 3, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 4, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "gagal" },
  { id: 5, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 6, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 7, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 8, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 9, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "pending" },
  { id: 10, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 11, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
  { id: 12, tanggal: "2026-09-06", waktu: "09:15", metode: "QRIS", nominal: 2000, status: "berhasil" },
];

function LogPendapatanComponent() {
  const [filter, setFilter] = useState<"semua" | TransactionStatus>("semua");

  const counts = {
    semua: TRANSACTION_DATA.length,
    berhasil: TRANSACTION_DATA.filter((item) => item.status === "berhasil").length,
    gagal: TRANSACTION_DATA.filter((item) => item.status === "gagal").length,
    pending: TRANSACTION_DATA.filter((item) => item.status === "pending").length,
  };

  const filteredData = filter === "semua"
    ? TRANSACTION_DATA
    : TRANSACTION_DATA.filter((item) => item.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 rounded-xl bg-gray-100/80 px-3.5 py-1.5 text-xs font-semibold text-gray-700">
          <ReceiptText className="h-4 w-4 text-gray-600" />
          <span>Log Pendapatan</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#1D408C] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#163370]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Eksport</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <Printer className="h-3.5 w-3.5 text-gray-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Log Pendapatan</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Riwayat seluruh transaksi pembayaran QRIS
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-gray-400">Total Pendapatan</p>
          <p className="text-xl font-bold text-[#1D408C] sm:text-2xl">Rp 20.000</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("semua")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            filter === "semua"
              ? "bg-[#1D408C] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setFilter("berhasil")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            filter === "berhasil"
              ? "bg-[#1D408C] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Berhasil ({counts.berhasil})
        </button>
        <button
          type="button"
          onClick={() => setFilter("gagal")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            filter === "gagal"
              ? "bg-[#1D408C] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Gagal ({counts.gagal})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            filter === "pending"
              ? "bg-[#1D408C] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Pending ({counts.pending})
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-[640px] w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 font-medium">
              <th className="py-3.5 pl-4 font-medium">No</th>
              <th className="py-3.5 font-medium">Tanggal</th>
              <th className="py-3.5 font-medium">Waktu</th>
              <th className="py-3.5 font-medium">Metode</th>
              <th className="py-3.5 font-medium">Nominal</th>
              <th className="py-3.5 pr-4 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-4 pl-4 font-medium text-gray-400">{index + 1}</td>
                <td className="py-4 font-semibold text-gray-900">{item.tanggal}</td>
                <td className="py-4 text-gray-500">{item.waktu}</td>
                <td className="py-4 text-gray-500">{item.metode}</td>
                <td className="py-4 font-bold text-gray-900">
                  Rp {item.nominal.toLocaleString("id-ID")}
                </td>
                <td className="py-4 pr-4 text-right">
                  {item.status === "berhasil" && (
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                      Berhasil
                    </span>
                  )}
                  {item.status === "gagal" && (
                    <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-500">
                      Gagal
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-600">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-1 text-xs text-gray-400">
        Menampilkan {filteredData.length} dari {TRANSACTION_DATA.length} transaksi
      </div>
    </div>
  );
}