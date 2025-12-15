"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";

interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

interface User {
  id: string;
  display_name: string | null;
  is_superadmin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load settings
        const settingsRes = await fetch("/api/admin/settings", {
          headers: { Authorization: `Bearer ${(await user.getIdToken?.()) || ""}` },
        });

        if (settingsRes.status === 403) {
          setIsSuperadmin(false);
          setLoading(false);
          return;
        }

        if (!settingsRes.ok) {
          throw new Error("Failed to load settings");
        }

        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings || []);
        setIsSuperadmin(true);

        // Load users
        const usersRes = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${(await user.getIdToken?.()) || ""}` },
        });

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await user?.getIdToken?.()) || ""}`,
        },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        throw new Error("Failed to update setting");
      }

      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const toggleSuperadmin = async (userId: string, makeSuperadmin: boolean) => {
    try {
      const res = await fetch("/api/admin/superadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await user?.getIdToken?.()) || ""}`,
        },
        body: JSON.stringify({ user_id: userId, is_superadmin: makeSuperadmin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update superadmin status");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_superadmin: makeSuperadmin } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-50">Admin Access Required</h1>
        <p className="text-sm text-slate-400">Please sign in to access the admin panel.</p>
        <a
          href="/sign-in"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (!isSuperadmin) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-50">Access Denied</h1>
        <p className="text-sm text-slate-400">You do not have superadmin privileges.</p>
        <a
          href="/dashboard"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  const settingLabels: Record<string, string> = {
    gemini_model: "Gemini Model",
    verify_per_minute: "Verifications per User/Minute",
    verify_per_hour: "Verifications per User/Hour",
    verify_global_per_minute: "Global Verifications/Minute",
    verify_global_per_hour: "Global Verifications/Hour",
  };

  const filteredUsers = userSearch
    ? users.filter((u) =>
        u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Admin Panel</h1>
        <p className="text-sm text-slate-400">Manage site-wide settings and superadmins.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Site Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Site Settings</h2>
        <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
          {settings.map((setting) => (
            <div key={setting.key} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-100">
                  {settingLabels[setting.key] || setting.key}
                </p>
                {setting.description && (
                  <p className="text-xs text-slate-500">{setting.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={setting.value}
                  onBlur={(e) => {
                    if (e.target.value !== setting.value) {
                      updateSetting(setting.key, e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const target = e.target as HTMLInputElement;
                      if (target.value !== setting.value) {
                        updateSetting(setting.key, target.value);
                      }
                    }
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-50 focus:border-sky-500 focus:outline-none sm:w-64"
                  disabled={saving === setting.key}
                />
                {saving === setting.key && (
                  <span className="text-xs text-slate-500">Saving...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Management */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">User Management</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
          {filteredUsers.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400">No users found.</p>
          )}
          {filteredUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-slate-100">
                  {u.display_name || "Unnamed User"}
                  {u.id === user?.id && (
                    <span className="ml-2 text-xs text-slate-500">(you)</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{u.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {u.is_superadmin && (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-400">
                    Superadmin
                  </span>
                )}
                <button
                  onClick={() => toggleSuperadmin(u.id, !u.is_superadmin)}
                  disabled={u.id === user?.id}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                    u.is_superadmin
                      ? "border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      : "border border-sky-500/50 text-sky-400 hover:bg-sky-500/10"
                  }`}
                >
                  {u.is_superadmin ? "Remove" : "Make Superadmin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
