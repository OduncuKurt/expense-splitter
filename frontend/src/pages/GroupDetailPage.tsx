import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  addGroupMember,
  getGroup,
  getGroupMembers,
  type Group,
  type GroupMember,
} from "../api/groups";
import {
  createExpense,
  getExpenses,
  type Expense,
} from "../api/expenses";
import {
  getGroupBalances,
  type GroupBalances,
} from "../api/balances";

function formatMoney(value: string | number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

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

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const numericGroupId = Number(groupId);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<GroupBalances | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<number | null>(null);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  async function refreshGroupData() {
    const [groupData, memberData, expenseData, balanceData] =
      await Promise.all([
        getGroup(numericGroupId),
        getGroupMembers(numericGroupId),
        getExpenses(numericGroupId),
        getGroupBalances(numericGroupId),
      ]);

    setGroup(groupData);
    setMembers(memberData);
    setExpenses(expenseData);
    setBalances(balanceData);

    if (payerId === null && memberData.length > 0) {
      setPayerId(memberData[0].id);
    }

    if (participantIds.length === 0 && memberData.length > 0) {
      setParticipantIds(memberData.map((member) => member.id));
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!Number.isInteger(numericGroupId) || numericGroupId <= 0) {
        navigate("/dashboard", { replace: true });
        return;
      }

      try {
        await refreshGroupData();
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

    void Promise.resolve().then(loadData);

    return () => {
      isMounted = false;
    };
  }, [numericGroupId]);

  function openExpenseModal() {
    setDescription("");
    setAmount("");
    setPayerId(members[0]?.id ?? null);
    setParticipantIds(members.map((member) => member.id));
    setErrorMessage("");
    setIsExpenseModalOpen(true);
  }

  function toggleParticipant(userId: number) {
    setParticipantIds((currentIds) => {
      if (currentIds.includes(userId)) {
        return currentIds.filter((id) => id !== userId);
      }

      return [...currentIds, userId];
    });
  }

  async function handleAddMember() {
    const email = memberEmail.trim();

    if (!email) {
      setErrorMessage("E-posta adresi girmen gerekiyor.");
      return;
    }

    setIsAddingMember(true);
    setErrorMessage("");

    try {
      await addGroupMember(numericGroupId, email);
      await refreshGroupData();

      setMemberEmail("");
      setIsMemberModalOpen(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleAddExpense() {
    const parsedAmount = Number(amount.replace(",", "."));

    if (!description.trim()) {
      setErrorMessage("Harcama açıklaması girmen gerekiyor.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Geçerli bir tutar gir.");
      return;
    }

    if (payerId === null) {
      setErrorMessage("Ödeyen kişiyi seç.");
      return;
    }

    if (participantIds.length === 0) {
      setErrorMessage("En az bir katılımcı seç.");
      return;
    }

    setIsAddingExpense(true);
    setErrorMessage("");

    try {
      await createExpense(numericGroupId, {
        description: description.trim(),
        amount: parsedAmount,
        paid_by_user_id: payerId,
        participant_user_ids: participantIds,
      });

      await refreshGroupData();
      setIsExpenseModalOpen(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsAddingExpense(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    window.location.assign("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Grup yükleniyor...</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-slate-900">Grup bulunamadı.</p>

          <Link
            to="/dashboard"
            className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline"
          >
            Dashboard'a dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            to="/dashboard"
            className="text-xl font-extrabold tracking-tight text-slate-900"
          >
            ExpenseSplitter
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Çıkış yap
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-emerald-600 hover:underline"
        >
          ← Gruplara dön
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {group.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Oluşturulma: {formatDate(group.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setIsMemberModalOpen(true);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              + Üye ekle
            </button>

            <button
              type="button"
              onClick={openExpenseModal}
              className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              + Harcama ekle
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Üyeler</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {members.length} kişi
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg border border-slate-100 px-3 py-3"
                >
                  <p className="font-semibold text-slate-800">
                    {member.username}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {member.email}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">
              Bakiye özeti
            </h2>

            {balances?.balances.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {balances.balances.map((balance) => {
                  const numericBalance = Number(balance.balance);
                  const isPositive = numericBalance > 0;
                  const isNegative = numericBalance < 0;

                  return (
                    <div
                      key={balance.user_id}
                      className="rounded-lg border border-slate-100 p-4"
                    >
                      <p className="font-semibold text-slate-800">
                        {balance.username}
                      </p>

                      <p
                        className={`mt-2 text-lg font-bold ${
                          isPositive
                            ? "text-emerald-600"
                            : isNegative
                              ? "text-red-600"
                              : "text-slate-500"
                        }`}
                      >
                        {isPositive && "+"}
                        {formatMoney(balance.balance)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {isPositive
                          ? "Alacaklı"
                          : isNegative
                            ? "Borçlu"
                            : "Hesap kapalı"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Henüz bakiye verisi yok.
              </p>
            )}

            <div className="mt-7 border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900">
                Kim kime ne kadar atmalı?
              </h3>

              {balances?.settlements.length ? (
                <div className="mt-4 space-y-3">
                  {balances.settlements.map((settlement, index) => (
                    <div
                      key={`${settlement.from_user_id}-${settlement.to_user_id}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {settlement.from_username} → {settlement.to_username}
                      </p>

                      <p className="text-sm font-bold text-emerald-700">
                        {formatMoney(settlement.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Şu an herkesin hesabı kapalı.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Harcama geçmişi
            </h2>

            <span className="text-sm text-slate-500">
              {expenses.length} harcama
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="font-medium text-slate-700">
                Henüz harcama eklenmedi.
              </p>

              <button
                type="button"
                onClick={openExpenseModal}
                className="mt-4 text-sm font-semibold text-emerald-600 hover:underline"
              >
                İlk harcamayı ekle
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {expenses.map((expense) => {
                const payer = members.find(
                  (member) => member.id === expense.paid_by,
                );

                return (
                  <div
                    key={expense.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {expense.description}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {payer?.username ?? "Bilinmeyen kullanıcı"} ödedi ·{" "}
                        {formatDate(expense.created_at)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(expense.amount)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {expense.splits.length} kişiyle paylaşıldı
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {isMemberModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
          onClick={() => !isAddingMember && setIsMemberModalOpen(false)}
        >
          <section
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900">Üye ekle</h2>

            <p className="mt-1 text-sm text-slate-500">
              Sisteme kayıtlı kullanıcının e-posta adresini yaz.
            </p>

            <label
              htmlFor="member-email"
              className="mt-6 mb-2 block text-sm font-medium text-slate-700"
            >
              E-posta
            </label>

            <input
              id="member-email"
              type="email"
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              placeholder="arkadas@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isAddingMember}
                onClick={() => setIsMemberModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={isAddingMember}
                onClick={() => void handleAddMember()}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {isAddingMember ? "Ekleniyor..." : "Üyeyi ekle"}
              </button>
            </div>
          </section>
        </div>
      )}

      {isExpenseModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-8"
          onClick={() => !isAddingExpense && setIsExpenseModalOpen(false)}
        >
          <section
            className="mx-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900">
              Harcama ekle
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="expense-description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Açıklama
                </label>

                <input
                  id="expense-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Örn. Akşam yemeği"
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="expense-amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Tutar
                </label>

                <input
                  id="expense-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="900"
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="payer"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Kim ödedi?
                </label>

                <select
                  id="payer"
                  value={payerId ?? ""}
                  onChange={(event) => setPayerId(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Kimler paylaşacak?
                </p>

                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={participantIds.includes(member.id)}
                        onChange={() => toggleParticipant(member.id)}
                        className="h-4 w-4 accent-emerald-500"
                      />

                      <span className="text-sm text-slate-700">
                        {member.username}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                disabled={isAddingExpense}
                onClick={() => setIsExpenseModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={isAddingExpense}
                onClick={() => void handleAddExpense()}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {isAddingExpense ? "Ekleniyor..." : "Harcama ekle"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}