import { ApiError } from '../../utils/ApiError';
import { User } from '../auth/auth.model';
import { isValidPermission } from '../../types/permissions';
import { Role, type RoleDoc } from './role.model';

export async function listRoles(): Promise<
  Array<RoleDoc & { userCount: number }>
> {
  const roles = await Role.find().sort({ createdAt: 1 }).lean();
  const counts = await User.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  const countByRole = new Map(counts.map((c) => [c._id, c.count]));
  return roles.map((role) => ({ ...role, userCount: countByRole.get(role.name) ?? 0 }));
}

export async function createRole(data: {
  name: string;
  description?: string;
  permissions: string[];
}): Promise<RoleDoc> {
  const existing = await Role.findOne({ name: { $regex: `^${data.name}$`, $options: 'i' } });
  if (existing) {
    throw ApiError.conflict(`Role '${data.name}' already exists`);
  }
  const invalid = data.permissions.filter((p) => !isValidPermission(p));
  if (invalid.length > 0) {
    throw ApiError.badRequest(`Unknown permission(s): ${invalid.join(', ')}`);
  }
  return Role.create({
    name: data.name,
    description: data.description ?? '',
    permissions: [...new Set(data.permissions)],
  });
}

export async function updateRole(
  roleId: string,
  data: { name?: string; description?: string; permissions?: string[] },
): Promise<RoleDoc> {
  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.notFound('Role not found');
  }
  if (data.name && data.name !== role.name) {
    const clash = await Role.findOne({ name: { $regex: `^${data.name}$`, $options: 'i' } });
    if (clash) {
      throw ApiError.conflict(`Role '${data.name}' already exists`);
    }
    if (role.isSystem) {
      throw ApiError.badRequest('System role names cannot be renamed');
    }
  }
  if (data.permissions) {
    const invalid = data.permissions.filter((p) => !isValidPermission(p));
    if (invalid.length > 0) {
      throw ApiError.badRequest(`Unknown permission(s): ${invalid.join(', ')}`);
    }
  }
  role.name = data.name ?? role.name;
  role.description = data.description ?? role.description;
  if (data.permissions) {
    role.permissions = [...new Set(data.permissions)];
  }
  await role.save();
  return role;
}

export async function deleteRole(roleId: string): Promise<void> {
  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.notFound('Role not found');
  }
  if (role.isSystem) {
    throw ApiError.badRequest('System roles cannot be deleted');
  }
  const users = await User.countDocuments({ role: role.name });
  if (users > 0) {
    throw ApiError.conflict(`Cannot delete role '${role.name}': ${users} user(s) still assigned to it`);
  }
  await role.deleteOne();
}
