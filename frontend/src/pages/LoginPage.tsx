import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";

import client from "../api/client";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = error as {
      response?: {
        data?: {
          detail?: string;
        };
      };
    };

    return response.response?.data?.detail ?? "Giriş yapılamadı.";
  }

  return "Beklenmeyen bir hata oluştu.";
}

export default function LoginPage() {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await client.post<LoginResponse>(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      localStorage.setItem("access_token", response.data.access_token);

      window.location.assign("/dashboard");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500 text-3xl text-white shadow-sm">
            ₺
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            ExpenseSplitter
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Harcamaları paylaş, borçları kolayca kapat.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700"
                htmlFor="email"
              >
                E-posta
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  Şifre
                </label>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 pr-16 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Hesabın yok mu?{" "}
          <Link
            to="/register"
            className="font-semibold text-emerald-600 hover:underline"
          >
            Kayıt ol
          </Link>
        </p>
      </section>
    </main>
  );
}