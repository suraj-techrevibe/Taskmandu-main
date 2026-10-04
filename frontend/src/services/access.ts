import { apiDelete, apiGet, apiPatch, apiPost } from './http';
import type { Invitation, ManagedUser, PermissionDef, Role, RoleDef } from '../types';

export interface InviteInput {
  employeeId: string;
  role: Role;
}

export const listRoles = async (): Promise<RoleDef[]> => {
  const res = await apiGet<{ roles: RoleDef[] }>('/roles');
  return res.roles;
};

export const getPermissionCatalog = async (): Promise<PermissionDef[]> => {
  const res = await apiGet<{ permissions: PermissionDef[] }>('/roles/permissions');
  return res.permissions;
};

export const createRole = async (input: { name: string; description?: string; permissions: string[] }): Promise<RoleDef> => {
  const res = await apiPost<{ role: RoleDef }>('/roles', input);
  return res.role;
};

export const updateRole = async (roleId: string, patch: { name?: string; description?: string; permissions?: string[] }): Promise<RoleDef> => {
  const res = await apiPatch<{ role: RoleDef }>(`/roles/${roleId}`, patch);
  return res.role;
};

export const deleteRole = async (roleId: string): Promise<void> => {
  await apiDelete(`/roles/${roleId}`);
};

export const listUsers = async (): Promise<ManagedUser[]> => {
  const res = await apiGet<{ users: ManagedUser[] }>('/auth/users');
  return res.users;
};

export const updateUser = async (
  userId: string,
  patch: {
    name?: string;
    email?: string;
    phone?: string | null;
    role?: Role;
    isActive?: boolean;
  },
): Promise<ManagedUser> => {
  const res = await apiPatch<{ user: ManagedUser }>(`/auth/users/${userId}`, patch);
  return res.user;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiDelete(`/auth/users/${userId}`);
};

export const listInvitations = async (): Promise<Invitation[]> => {
  const res = await apiGet<{ invitations: Invitation[] }>('/invitations');
  return res.invitations;
};

export const createInvitation = async (input: InviteInput): Promise<{ invitation: Invitation; inviteLink: string; emailDelivered: boolean }> => {
  const res = await apiPost<{ invitation: Invitation; inviteLink: string; emailDelivered: boolean }>('/invitations', input);
  return res;
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  await apiDelete(`/invitations/${invitationId}`);
};

export const getInvitation = async (token: string): Promise<Invitation> => {
  const res = await apiGet<{ invitation: Invitation }>(`/invitations/${token}`, { skipErrorToast: true });
  return res.invitation;
};

export const acceptInvitation = async (token: string, password: string): Promise<{ email: string; role: Role }> => {
  const res = await apiPost<{ email: string; role: Role }>(`/invitations/${token}/accept`, { password });
  return res;
};

export const rejectInvitation = async (token: string): Promise<void> => {
  await apiPost<void>(`/invitations/${token}/reject`);
};
