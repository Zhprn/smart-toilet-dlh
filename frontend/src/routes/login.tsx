import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Email atau kata sandi salah. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-[#E5E7EB] p-2 sm:p-4 lg:p-6">
      <div className="flex h-full max-h-[96vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-[2.5rem] lg:h-[88vh] lg:max-h-[760px]">
        {/* Sisi Kiri - Banner Biru */}
        <div className="relative hidden h-full w-1/2 flex-col justify-between overflow-hidden bg-[#1D408C] p-6 text-white lg:flex lg:p-8 xl:p-10">
          <img
            src="/images/bg-pattern.svg"
            alt="Pattern Background"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-4">
              <img
                src="/images/logodlh.svg"
                alt="Logo DLH"
                draggable={false}
                className="h-16 w-auto object-contain drop-shadow-md xl:h-20"
              />
              <img
                src="/images/logoprov.svg"
                alt="Logo Kota Padang"
                draggable={false}
                className="h-16 w-auto object-contain drop-shadow-md xl:h-20"
              />
            </div>

            <h1 className="mt-3 text-center text-lg font-bold uppercase tracking-wider xl:mt-4 xl:text-xl">
              PORTAL PETUGAS DLH
            </h1>
            <p className="mt-1 text-center text-[11px] font-light text-blue-100/90 xl:text-xs">
              Sistem Pemantauan Retribusi Smart Toilet Kota Padang
            </p>

            <div className="my-auto mt-4 flex w-full max-w-[360px] items-center justify-center xl:mt-6 xl:max-w-[420px]">
              <img
                src="/images/mockup-priview.svg"
                alt="Mockup Diagram Pendapatan"
                draggable={false}
                className="max-h-[38vh] w-full select-none object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="relative z-10 text-center text-[11px] text-blue-200/80 xl:text-xs">
            © 2026 Dinas Lingkungan Hidup Kota Padang
          </div>
        </div>

        {/* Sisi Kanan - Form Login */}
        <div className="flex h-full w-full flex-col justify-center overflow-y-auto px-6 py-6 sm:px-10 md:px-12 lg:w-1/2 lg:overflow-hidden lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 xl:mb-6">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logodlh.svg"
                  alt="Smart Toilet"
                  className="h-8 w-auto object-contain xl:h-10"
                />
                <div>
                  <h2 className="text-xs font-bold leading-tight text-gray-900 sm:text-sm">
                    Smart Toilet
                  </h2>
                  <p className="text-[11px] text-gray-500">DLH Kota Padang</p>
                </div>
              </div>

              <h1 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl xl:mt-6">
                Dashboard Smart Toilet
              </h1>
              <p className="text-xs text-gray-500">
                Dinas Lingkungan Hidup Kota Padang
              </p>
              <p className="mt-2 text-xs font-semibold text-[#1D408C] xl:mt-3">
                Masuk ke Akun Anda
              </p>
            </div>

            {/* Alert Error */}
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 xl:space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Email Kedinasan
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@dlh.padang.go.id"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 focus:border-[#1D408C] focus:outline-none focus:ring-1 focus:ring-[#1D408C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-xs text-gray-900 focus:border-[#1D408C] focus:outline-none focus:ring-1 focus:ring-[#1D408C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D408C] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#163370] active:scale-[0.99] disabled:opacity-60 xl:py-3"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isLoading ? "Memproses..." : "Masuk Ke Dashboard"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}