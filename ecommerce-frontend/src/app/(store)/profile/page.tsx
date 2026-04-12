"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Key, Plus, Trash2, BadgeCheck, MailCheck } from "lucide-react";
import { useProfile, useAddresses, useAddAddress, useDeleteAddress } from "@/hooks/useApi";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { userApi } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/hooks/useApi";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "password", label: "Password", icon: Key },
];

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const { data: profile, isLoading } = useProfile();
  const { data: addresses } = useAddresses();
  const { mutate: deleteAddress } = useDeleteAddress();
  const { mutate: addAddress, isPending: addingAddr } = useAddAddress();

  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ fullName: "", phone: "", street: "", city: "", state: "", pincode: "", country: "India", isDefault: false, landmark: "" });

  if (!hasHydrated) return <LoadingSpinner />;
  if (!isAuthenticated) { router.push("/auth/login"); return null; }
  if (isLoading) return <LoadingSpinner />;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userApi.updateProfile({ name: profileForm.name || profile!.name, phone: profileForm.phone || profile!.phone });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error("Passwords don't match"); return; }
    setSavingPwd(true);
    try {
      await userApi.changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      toast.success("Password changed!");
      setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSavingPwd(false); }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      await userApi.sendEmailVerificationOtp();
      toast.success("OTP sent to your email address");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setVerifyingOtp(true);
    try {
      await userApi.verifyEmailOtp({ otp });
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      setOtp("");
      toast.success("Email verified successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    addAddress(addrForm, {
      onSuccess: () => {
        setShowAddrForm(false);
        setAddrForm({
          fullName: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          isDefault: false,
          landmark: "",
        });
      },
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <section className="mb-6 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Account Center</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My Account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage profile details, addresses, password and email verification from one polished account hub.
            </p>
          </div>
          {profile && (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
              <p className="mt-1 text-xs text-slate-500">{profile.email}</p>
            </div>
          )}
        </div>
      </section>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && profile && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSaveProfile} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-950">Profile details</h2>
              <p className="mt-1 text-sm text-slate-500">Keep your account information accurate and up to date.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <input defaultValue={profile.name} onChange={(e) => setProfileForm(p => ({...p, name: e.target.value}))}
                className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium">Email</label>
                {profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <MailCheck className="h-3.5 w-3.5" /> Verification Pending
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input value={profile.email} disabled
                  className="w-full h-10 px-3 text-sm rounded-lg border bg-muted text-muted-foreground" />
                {!profile.emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="h-10 shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : "Send OTP"}
                  </button>
                )}
              </div>
            </div>
            {!profile.emailVerified && (
              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
                <p className="mb-3 text-sm text-slate-700">
                  Enter the 6-digit OTP sent to your email, then verify to get the blue tick.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length !== 6}
                    className="h-10 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {verifyingOtp ? "Verifying..." : "Verify Email"}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <input defaultValue={profile.phone || ""} onChange={(e) => setProfileForm(p => ({...p, phone: e.target.value}))}
                placeholder="10-digit mobile" className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" disabled={savingProfile}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Account status</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email verification</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {profile.emailVerified ? "Verified and trusted" : "Pending verification"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Phone number</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile.phone || "Not added yet"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Recommendations</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add your primary phone and verify your email to make checkout and support smoother.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && (
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {addresses?.map((addr) => (
            <div key={addr.id} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm">
                <p className="font-medium">{addr.fullName}
                  {addr.isDefault && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                </p>
                <p className="text-muted-foreground">{addr.phone}</p>
                <p className="text-muted-foreground">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
              <button onClick={() => deleteAddress(addr.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!showAddrForm ? (
            <button onClick={() => setShowAddrForm(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors">
              <Plus className="h-4 w-4" /> Add New Address
            </button>
          ) : (
            <form onSubmit={handleAddAddress} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[["fullName","Full Name"],["phone","Phone"],["street","Street"],["city","City"],["state","State"],["pincode","Pincode"]].map(([key, label]) => (
                  <div key={key} className={key === "street" ? "col-span-2" : ""}>
                    <label className="text-xs font-medium mb-1 block">{label}</label>
                    <input value={(addrForm as any)[key]} onChange={(e) => setAddrForm(f => ({...f, [key]: e.target.value}))} required
                      className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="default" checked={addrForm.isDefault} onChange={(e) => setAddrForm(f => ({...f, isDefault: e.target.checked}))} />
                <label htmlFor="default" className="text-sm">Set as default address</label>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={addingAddr} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                  {addingAddr ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setShowAddrForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="max-w-2xl space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2">
            <h2 className="text-xl font-bold text-slate-950">Password & security</h2>
            <p className="mt-1 text-sm text-slate-500">Use a strong password to protect your account and orders.</p>
          </div>
          {[["oldPassword","Current Password"],["newPassword","New Password"],["confirmPassword","Confirm New Password"]].map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-medium mb-1.5 block">{label}</label>
              <input type="password" value={(pwdForm as any)[key]}
                onChange={(e) => setPwdForm(p => ({...p, [key]: e.target.value}))} required
                className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
          <button type="submit" disabled={savingPwd}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {savingPwd ? "Changing..." : "Change Password"}
          </button>
        </form>
      )}
    </div>
  );
}
