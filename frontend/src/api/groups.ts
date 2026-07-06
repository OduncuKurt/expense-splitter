import client from "./client";

export type Group = {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
};

export async function getGroups(): Promise<Group[]> {
  const response = await client.get<Group[]>("/groups/");
  return response.data;
}

export async function createGroup(name: string): Promise<Group> {
  const response = await client.post<Group>("/groups/", {
    name,
  });

  return response.data;
}

export type GroupMember = {
  id: number;
  username: string;
  email: string;
};

export async function getGroup(groupId: number): Promise<Group> {
  const response = await client.get<Group>(`/groups/${groupId}`);
  return response.data;
}

export async function getGroupMembers(
  groupId: number,
): Promise<GroupMember[]> {
  const response = await client.get<GroupMember[]>(
    `/groups/${groupId}/members`,
  );

  return response.data;
}

export async function addGroupMember(
  groupId: number,
  email: string,
): Promise<GroupMember> {
  const response = await client.post<GroupMember>(
    `/groups/${groupId}/members`,
    { email },
  );

  return response.data;
}