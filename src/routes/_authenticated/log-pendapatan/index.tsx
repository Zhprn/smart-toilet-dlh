import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
} from "lucide-react";
import {
  transactionService,
  type TransactionItem,
  type TransactionMeta,
} from "@/services/transaction.service";

export const Route = createFileRoute("/_authenticated/log-pendapatan/")({
  component: LogPendapatanComponent,
});

function LogPendapatanComponent() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [meta, setMeta] = useState<TransactionMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionService.getTransactions(page, limit);

      const raw = res.data as any;
      const payload = raw?.data?.data ? raw.data : raw;

      const list: TransactionItem[] = payload?.data || [];
      const pagination: TransactionMeta = payload?.meta || {
        page,
        limit,
        total: list.length,
        totalPages: Math.ceil(list.length / limit) || 1,
      };

      setTransactions(list);
      setMeta(pagination);
    } catch (err) {
      console.error("Gagal memuat log transaksi:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await transactionService.exportTransactions();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "transactions.xlsx";
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Gagal mendownload laporan:", err);
      alert("Gagal mendownload file laporan transaksi. Pastikan sesi login aktif.");
    } finally {
      setExporting(false);
    }
  };

  const formatRupiah = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Log Pendapatan Retribusi
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Catatan seluruh transaksi retribusi masuk melalui QRIS gate
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D408C] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#16326e] active:scale-95 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{exporting ? "Mengunduh..." : "Export Laporan"}</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Ref No / Partner Ref</th>
                <th className="px-5 py-3.5">Terminal ID</th>
                <th className="px-5 py-3.5">Nominal</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Waktu Dibuat</th>
                <th className="px-5 py-3.5">Waktu Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1D408C]" />
                    <span className="mt-2 block text-xs">Memuat data transaksi...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <ReceiptText className="mx-auto h-8 w-8 text-gray-300" />
                    <span className="mt-2 block text-xs">Belum ada riwayat transaksi</span>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="transition hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <p className="font-mono font-medium text-gray-900">
                        {tx.partnerReferenceNo}
                      </p>
                      <p className="font-mono text-[10px] text-gray-400">
                        Ref: {tx.referenceNo}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono text-gray-600">
                      {tx.terminalId || "-"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {formatRupiah(tx.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(tx.paidAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 focus:border-[#1D408C] focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>data dari total {meta.total} transaksi</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Halaman {meta.page} dari {meta.totalPages || 1}
            </span>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                disabled={page >= meta.totalPages || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}