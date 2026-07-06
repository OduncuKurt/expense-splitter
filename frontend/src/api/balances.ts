import client from "./client";

export type MemberBalance = {
  user_id: number;
  username: string;
  balance: string;
};

export type Settlement = {
  from_user_id: number;
  from_username: string;
  to_user_id: number;
  to_username: string;
  amount: string;
};

export type GroupBalances = {
  balances: MemberBalance[];
  settlements: Settlement[];
};

export async function getGroupBalances(
  groupId: number,
): Promise<GroupBalances> {
  const response = await client.get<GroupBalances>(
    `/groups/${groupId}/balances`,
  );

  return response.data;
}