import client from "./client";

export type ExpenseSplit = {
  user_id: number;
  amount_owed: string;
};

export type Expense = {
  id: number;
  group_id: number;
  paid_by: number;
  description: string;
  amount: string;
  created_at: string;
  splits: ExpenseSplit[];
};

export type CreateExpensePayload = {
  description: string;
  amount: number;
  paid_by_user_id: number;
  participant_user_ids: number[];
};

export async function getExpenses(groupId: number): Promise<Expense[]> {
  const response = await client.get<Expense[]>(
    `/groups/${groupId}/expenses/`,
  );

  return response.data;
}

export async function createExpense(
  groupId: number,
  payload: CreateExpensePayload,
): Promise<Expense> {
  const response = await client.post<Expense>(
    `/groups/${groupId}/expenses/`,
    payload,
  );

  return response.data;
}