"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "../hook/useAuth";

interface Profile {
  userId: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { auth, logout, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient.get<Profile>("/profile");
      setProfile(data);
      setForm({ name: data.name, email: data.email });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("401")) {
        try {
          await refresh();
          const data = await apiClient.get<Profile>("/profile");
          setProfile(data);
          setForm({ name: data.name, email: data.email });
        } catch {
          logout();
          router.push("/signin");
        }
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.push("/signin");
    } else {
      loadProfile();
    }
  }, [auth.isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.put<Profile>("/profile", form);
      setProfile(updated);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {profile && (
        <div className="space-y-3">
          <p>
            <strong>User ID:</strong> {profile.userId}
          </p>
          <p>
            <strong>Username:</strong> {profile.username}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {profile.createdAt
              ? new Date(profile.createdAt).toLocaleString()
              : " "}
          </p>

          <p>
            <strong>Updated At:</strong>{" "}
            {profile.updatedAt
              ? new Date(profile.updatedAt).toLocaleString()
              : " "}
          </p>

          {editing ? (
            <>
              <div>
                <label className="block font-semibold">Full Name</label>
                <input
                  className="border p-2 rounded w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold">Email</label>
                <input
                  className="border p-2 rounded w-full"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition cursor-pointer"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({ name: profile.name, email: profile.email });
                  }}
                  className="bg-gray-300 text-black p-2 rounded hover:bg-gray-400 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Full Name:</strong> {profile.name}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition cursor-pointer"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => {
          logout();
          router.push("/signin");
        }}
        className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
