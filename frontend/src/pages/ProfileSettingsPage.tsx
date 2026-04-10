import { Bell, Search, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useMutation } from "@tanstack/react-query";
import { updateProfileApi } from "../api/user";
import { useToast } from "../components/ui/ToastProvider";
import { PageHeader } from "../components/layout/PageHeader"

type FieldProps = {
    label: string;
    placeholder: string;
    value: string;
    type?: "text" | "email" | "password";
    multiline?: boolean;
    isFocused?: boolean;
    onChange: (value: string) => void;
};


function Field({
    label,
    placeholder,
    value,
    type = "text",
    multiline = false,
    isFocused = false,
    onChange
}: FieldProps) {
    return (
        <div className="space-y-2">
            <label className="text-[15px] font-medium text-[#5E6773]">{label}</label>

            {multiline ? (
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-[96px] w-full resize-none rounded-2xl border border-[#E3E8EE] bg-[#F9FBFD] px-4 py-3 text-[16px] text-[#202020] outline-none focus:border-[#2E2E5A]/40"
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className={
                        "h-[52px] w-full rounded-full border bg-[#F2F2F2] px-4 text-[16px] text-[#666B78] outline-none placeholder:text-[#98A2B3] " +
                        (isFocused ? "border-[#2E2E5A]/60" : "border-[#E3E8EE]")
                    }
                />
            )}
        </div>
    );
}

export function ProfileSettingsPage() {
    const { push } = useToast();
    const { user, refreshMe } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        setFirstName(user?.first_name ?? "");
        setSurname(user?.surname ?? "");
        setEmail(user?.email ?? "");
        setPhoneNumber(user?.phone_number ?? "");
        setAddress(user?.address ?? "");
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: updateProfileApi,
        onSuccess: async () => {
            await refreshMe();
            push("success", "Profile updated");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: () => push("error", "Failed to update profile")
    });

    const onSave = () => {
        if (newPassword || confirmPassword) {
            if (!newPassword) {
                push("error", "Enter new password");
                return;
            }
            if (newPassword !== confirmPassword) {
                push("error", "Passwords do not match");
                return;
            }
        }

        updateMutation.mutate({
            first_name: firstName.trim() || null,
            surname: surname.trim() || null,
            email: email.trim(),
            phone_number: phoneNumber.trim() || null,
            address: address.trim() || null,
            new_password: newPassword || undefined
        });
    };

    return (

        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle="Track your reports and submit new urban issues"
            />
            <section className="rounded-2xl border border-[#D9DEE6] bg-white p-6 shadow-sm">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-lg font-semibold text-[#202020]">Profile Information</h2>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="First name" placeholder="Enter your name" value={firstName} onChange={setFirstName} />
                            <Field label="Surname" placeholder="Enter your surname" value={surname} onChange={setSurname} />
                            <Field
                                label="Email Address"
                                placeholder="Enter your mail"
                                value={email}
                                onChange={setEmail}
                                type="email"
                            />
                            <Field
                                label="Phone Number"
                                placeholder="Enter your number"
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-[#202020]">Change Password</h2>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                            <Field
                                label="New Password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={setNewPassword}
                                type="password"
                            />
                            <Field
                                label="Confirm New Password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                type="password"
                            />
                        </div>
                    </div>

                    <div>
                        <Field label="Address" placeholder="Your address" value={address} onChange={setAddress} />
                    </div>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={updateMutation.isPending}
                        className="h-[59px] w-full max-w-[539px] rounded-[64px] bg-[#2E2E5A] text-[20px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </section>
        </div>
    );
}