import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";

import client from "../api/client";

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;

  return apiError.response?.data?.detail ?? "Kayıt oluşturulamadı.";
}

export default function RegisterPage() {


  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      await client.post("/users/", {
        username,
        email,
        password,
      });

      window.location.assign("/login");
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
            Yeni hesabını oluştur.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Kullanıcı adı
              </label>

              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={50}
                required
                placeholder="arda"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                E-posta
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Şifre
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                placeholder="En az 8 karakter"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
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
              {isLoading ? "Hesap oluşturuluyor..." : "Kayıt ol"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Zaten hesabın var mı?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald-600 hover:underline"
          >
            Giriş yap
          </Link>
        </p>
      </section>
    </main>
  );
}