import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { ScanLine, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { aspiService } from "@/services/aspi.service";
import { getSocket } from "@/lib/socket";

export const Route = createFileRoute("/payment")({
  component: PaymentComponent,
});

function PaymentComponent() {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gateStatusText, setGateStatusText] = useState("Pintu gate terbuka otomatis");

  const currentPartnerRef = useRef<string>("");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initQr = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setIsSuccess(false);
      setGateStatusText("Pintu gate terbuka otomatis");

      const res = await aspiService.generateQr({ amount: 2000 });
      const data = (res.data as any)?.data || res.data;

      const content = data?.qrContent;
      if (content) {
        setQrSrc(
          `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
            content
          )}`
        );
      } else {
        setErrorMsg("Data QR tidak valid.");
      }

      currentPartnerRef.current = data?.partnerReferenceNo || "";
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Gagal memuat QRIS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    initQr();

    const handlePaymentStatus = (event: any) => {
      const status = event?.status || event?.transactionStatus;
      const refNo = event?.partnerReferenceNo;

      if (!refNo || refNo === currentPartnerRef.current || status === "SUCCESS") {
        setIsSuccess(true);

        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          initQr();
        }, 5000);
      }
    };

    const handleGateAck = () => {
      setGateStatusText("Gate berhasil dibuka oleh hardware");
    };

    const handleGateStatus = (event: any) => {
      if (event?.status === "OFFLINE") {
        setErrorMsg("Gate sedang offline. Silakan hubungi petugas.");
      }
    };

    socket.on("payment:status", handlePaymentStatus);
    socket.on("gate:ack", handleGateAck);
    socket.on("gate:status", handleGateStatus);

    return () => {
      socket.off("payment:status", handlePaymentStatus);
      socket.off("gate:ack", handleGateAck);
      socket.off("gate:status", handleGateStatus);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [initQr]);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-between overflow-hidden bg-[#1D408C] p-3 text-white select-none sm:p-5">

      <img
        src="/images/bg-pattern.svg"
        alt="Background Pattern"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
      />

      <div className="relative z-10 flex shrink-0 flex-col items-center pt-1">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/images/logodlh.svg"
            alt="Logo DLH"
            className="h-7 w-auto object-contain drop-shadow sm:h-9"
          />
          <div className="text-left">
            <h1 className="text-[11px] font-bold leading-tight tracking-wide sm:text-xs">
              Smart Toilet
            </h1>
            <p className="text-[9px] text-blue-100/80 sm:text-[10px]">DLH Kota Padang</p>
          </div>
        </div>

        <p className="mt-1.5 text-[10px] font-light text-blue-100 sm:mt-2 sm:text-xs">
          Tarif Retribusi Kebersihan
        </p>
        <p className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl md:text-2xl">
          Rp 2.000 <span className="text-[10px] font-normal text-blue-200 sm:text-xs">/akses</span>
        </p>
      </div>

      <div className="relative z-10 my-auto flex w-full max-w-[240px] flex-col rounded-2xl bg-white p-3.5 text-gray-900 shadow-2xl transition-all sm:max-w-[280px] sm:p-5">
        <p className="text-[10px] font-bold tracking-wider text-[#1D408C] uppercase sm:text-xs">
          QRIS
        </p>

        <div className="mt-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-inner sm:mt-3 sm:p-3">
          {loading ? (
            <div className="flex flex-col items-center gap-1.5 text-gray-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#1D408C]" />
              <span className="text-[10px] font-medium sm:text-xs">Membuat QRIS baru...</span>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-1.5 text-center text-emerald-600">
              <CheckCircle2 className="h-10 w-10 animate-bounce sm:h-12 sm:w-12" />
              <span className="text-xs font-bold sm:text-sm">Pembayaran Berhasil!</span>
              <span className="text-[10px] text-gray-500 sm:text-xs">{gateStatusText}</span>
              <span className="text-[9px] text-gray-400 mt-1">Layar akan reset otomatis</span>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center gap-1.5 px-2 text-center text-rose-500">
              <AlertCircle className="h-6 w-6" />
              <span className="text-[10px] sm:text-xs">{errorMsg}</span>
            </div>
          ) : qrSrc ? (
            <img
              src={qrSrc}
              alt="QRIS Code"
              className="h-full w-full object-contain"
              onError={() => setErrorMsg("Gagal memuat QR.")}
            />
          ) : (
            <div className="text-center text-[10px] text-gray-400 sm:text-xs">
              QRIS tidak ditemukan. Silakan refresh.
            </div>
          )}
        </div>

        <p className="mt-2.5 text-center text-[9px] font-semibold text-gray-400 sm:mt-3.5 sm:text-[10px]">
          BCA, Mandiri, GoPay, OVO, ShopeePay
        </p>
      </div>

      <div className="relative z-10 flex shrink-0 w-full max-w-sm items-center justify-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-center text-xs text-blue-100 backdrop-blur-md sm:py-2.5">
        <ScanLine className="h-4 w-4 shrink-0 text-white" />
        <span className="text-left text-[10px] leading-tight font-medium sm:text-[11px]">
          Pindai dengan aplikasi pembayaran apa saja untuk membuka pintu otomatis.
        </span>
      </div>
    </div>
  );
}