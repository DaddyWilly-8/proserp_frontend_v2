// Mirrors the backend's App\Support\Reports\PermissionCategory::label() —
// categorizes a permission by the real module(s) it's gated behind
// (module_permission), falling back to "Core" (always-available, not
// module-gated) or "Other" (the rare permission with neither). Keep in
// sync with that class if the grouping logic ever changes.
export type CategorizablePermission = {
  name: string;
  is_core?: boolean;
  modules?: { id: number; name: string }[];
};

export function permissionCategory(permission: CategorizablePermission): string {
  const modules = permission.modules ?? [];
  if (modules.length > 0) {
    return modules.map((m) => m.name).sort().join(' / ');
  }
  return permission.is_core ? 'Core' : 'Other';
}

export function groupPermissionsByCategory<T extends CategorizablePermission>(permissions: T[]) {
  const groups = new Map<string, T[]>();

  for (const permission of permissions) {
    const category = permissionCategory(permission);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(permission);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      permissions: items.slice().sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
