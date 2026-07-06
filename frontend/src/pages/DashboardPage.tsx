import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import client from "../api/client";
import {
  createGroup,
  getGroups,
  type Group,
} from "../api/groups";

type User = {
  id: number;
  username: string;
  email: string;
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const apiError = error as {
      response?: {
        data?: {
          detail?: string;
        };
      };
    };

    return apiError.response?.data?.detail ?? "İşlem sırasında hata oluştu.";
  }

  return "Beklenmeyen bir hata oluştu.";
}

export default function DashboardPage() {

  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
        try {
        const [userResponse, groupsResponse] = await Promise.all([
            client.get<User>("/auth/me"),
            getGroups(),
        ]);

        if (!isMounted) {
            return;
        }

        setUser(userResponse.data);
        setGroups(groupsResponse);
        } catch (error) {
        if (isMounted) {
            setErrorMessage(getErrorMessage(error));
        }
        } finally {
        if (isMounted) {
            setIsLoading(false);
        }
        }
    }

    void Promise.resolve().then(loadDashboard);

    return () => {
        isMounted = false;
    };
    }, []);

  async function handleCreateGroup() {
    const trimmedName = groupName.trim();

    if (trimmedName.length < 2) {
      setErrorMessage("Grup adı en az 2 karakter olmalı.");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");

    try {
      const newGroup = await createGroup(trimmedName);

      setGroups((currentGroups) => [newGroup, ...currentGroups]);
      setGroupName("");
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    window.location.assign("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Dashboard yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              ExpenseSplitter
            </h1>

            <p className="text-sm text-slate-500">
              Hoş geldin, {user?.username ?? "kullanıcı"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Çıkış yap
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Grupların
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Harcamalarını paylaşmak için bir grup oluştur veya mevcut gruplarını aç.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setIsModalOpen(true);
            }}
            className="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            + Yeni grup oluştur
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{errorMessage}</span>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="font-semibold hover:underline"
            >
              Kapat
            </button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl">
              👥
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Henüz grubun yok
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Tatil, ev, yemek veya arkadaş grubun için ilk harcama grubunu oluştur.
            </p>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              İlk grubunu oluştur
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-lg">
                    👥
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    #{group.id}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-emerald-600">
                  {group.name}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Oluşturulma:{" "}
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(group.created_at))}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
          onClick={() => !isCreating && setIsModalOpen(false)}
        >
          <section
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Yeni grup oluştur
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Harcamaları paylaşacağın grubun adını yaz.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="text-xl text-slate-400 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <label
                htmlFor="group-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Grup adı
              </label>

              <input
                id="group-name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleCreateGroup();
                  }
                }}
                placeholder="Örn. Yaz Tatili 2026"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={() => void handleCreateGroup()}
                disabled={isCreating}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Oluşturuluyor..." : "Grubu oluştur"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}