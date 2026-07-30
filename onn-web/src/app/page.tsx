"use client";

import {FormEvent, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type PasswordStrength = {
    score: number;
    label: string;
    color: string;
};

export default function Home() {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [touched, setTouched] = useState<{ email: boolean; password: boolean; confirmPassword: boolean }>({
        email: false,
        password: false,
        confirmPassword: false,
    });
    const [emailValid, setEmailValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        label: "Weak",
        color: "bg-red-500",
    });
    const router = useRouter();

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    credentials: "include",
                });
                if (response.ok) {
                    router.push("/decks");
                }
            } catch {
                // Ignore errors
            }
        };
        checkAuth();
    }, [router]);

    // Validate email
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailValid(emailRegex.test(email));
    }, [email]);

    // Calculate password strength
    useEffect(() => {
        if (!isRegistering) {
            setPasswordStrength({score: 0, label: "", color: "bg-transparent"});
            return;
        }

        if (!password) {
            setPasswordStrength({score: 0, label: "Weak", color: "bg-red-500"});
            return;
        }

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const strengths: PasswordStrength[] = [
            {score: 0, label: "Very Weak", color: "bg-red-500"},
            {score: 1, label: "Weak", color: "bg-orange-500"},
            {score: 2, label: "Fair", color: "bg-yellow-500"},
            {score: 3, label: "Good", color: "bg-blue-500"},
            {score: 4, label: "Strong", color: "bg-green-500"},
            {score: 5, label: "Very Strong", color: "bg-emerald-500"},
        ];

        setPasswordStrength(strengths[Math.min(score, 5)]);
    }, [password]);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        return isRegistering ? password.length >= 8 : password.length >= 1;
    };

    const validateConfirmPassword = (confirmPassword: string) => {
        return isRegistering ? confirmPassword === password : true;
    };

    const getEmailError = () => {
        if (!touched.email) return "";
        if (!email) return "Email is required";
        if (!validateEmail(email)) return "Please enter a valid email address";
        return "";
    };

    const getPasswordError = () => {
        if (!touched.password) return "";
        if (!password) return "Password is required";
        if (!validatePassword(password)) return "Password must be at least 8 characters";
        return "";
    };

    const getConfirmPasswordError = () => {
        if (!touched.confirmPassword || !isRegistering) return "";
        if (!confirmPassword) return "Please confirm your password";
        if (confirmPassword !== password) return "Passwords do not match";
        return "";
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        // Validate all fields
        setTouched({email: true, password: true, confirmPassword: true});

        const emailError = getEmailError();
        const passwordError = getPasswordError();
        const confirmPasswordError = getConfirmPasswordError();

        if (emailError || passwordError || confirmPasswordError) {
            setError("Please fix the errors before submitting.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/auth/${isRegistering ? "register" : "login"}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    password,
                    ...(isRegistering && {displayName: displayName.trim() || undefined}),
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || (isRegistering ? "Unable to create your account." : "Unable to sign in right now."));
            }

            if (isRegistering) {
                setSuccess("Account created successfully! Redirecting to decks...");
                setTimeout(() => {
                    router.push("/decks");
                }, 1500);
            } else {
                router.push("/decks");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : (isRegistering ? "Unable to create your account." : "Unable to sign in right now."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError("");
        setSuccess("");
        setDisplayName("");
        setPassword("");
        setConfirmPassword("");
        setTouched({email: false, password: false, confirmPassword: false});
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-darkblue px-4 py-12 text-white">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="mb-8 text-center">
                    <div className="inline-block p-4 bg-gold/10 rounded-2xl border border-gold/20 mb-4">
                        <div className="text-4xl">🃏</div>
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
                        Riftbound
                    </p>
                    <h1 className="text-3xl font-semibold mt-2">
                        {isRegistering ? "Create your account" : "Welcome back"}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {isRegistering
                            ? "Join the community and start building your decks."
                            : "Sign in to manage your decks and collection."}
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-gold/20 bg-black p-8 shadow-xl">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Email Address
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-zinc-500"/>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={() => setTouched({...touched, email: true})}
                                    placeholder="you@example.com"
                                    className={`
                                        w-full rounded-lg border bg-zinc-900 px-3 py-2.5 pl-10 
                                        text-white outline-none ring-0 transition-all
                                        ${getEmailError() && touched.email
                                        ? "border-red-500 focus:border-red-500"
                                        : email && emailValid && touched.email
                                            ? "border-green-500 focus:border-green-500"
                                            : "border-zinc-700 focus:border-gold"
                                    }
                                    `}
                                    required
                                    disabled={isSubmitting}
                                />
                                {email && touched.email && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        {emailValid ? (
                                            <CheckCircle size={18} className="text-green-500"/>
                                        ) : (
                                            <AlertCircle size={18} className="text-red-500"/>
                                        )}
                                    </div>
                                )}
                            </div>
                            {getEmailError() && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={14}/>
                                    {getEmailError()}
                                </p>
                            )}
                        </div>

                        {isRegistering && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-300">
                                    Display Name <span className="text-zinc-500">(optional)</span>
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your public name"
                                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white outline-none ring-0 transition-all focus:border-gold"
                                        maxLength={100}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-zinc-500"/>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => setTouched({...touched, password: true})}
                                    placeholder="••••••••"
                                    className={`
                                        w-full rounded-lg border bg-zinc-900 px-3 py-2.5 pl-10 
                                        text-white outline-none ring-0 transition-all
                                        ${getPasswordError() && touched.password
                                        ? "border-red-500 focus:border-red-500"
                                        : password && !getPasswordError() && touched.password
                                            ? "border-green-500 focus:border-green-500"
                                            : "border-zinc-700 focus:border-gold"
                                    }
                                    `}
                                    required
                                    disabled={isSubmitting}
                                    minLength={isRegistering ? 8 : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {isRegistering && password && touched.password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{width: `${(passwordStrength.score / 5) * 100}%`}}
                                            />
                                        </div>
                                        <span
                                            className={`text-xs ${passwordStrength.score >= 4 ? 'text-green-400' : 'text-zinc-400'}`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    {getPasswordError() && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle size={14}/>
                                            {getPasswordError()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field (Register only) */}
                        {isRegistering && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-300">
                                    Confirm Password
                                </label>
                                <div className="relative mt-1">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-zinc-500"/>
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onBlur={() => setTouched({...touched, confirmPassword: true})}
                                        placeholder="Confirm your password"
                                        className={`
                                            w-full rounded-lg border bg-zinc-900 px-3 py-2.5 pl-10 
                                            text-white outline-none ring-0 transition-all
                                            ${getConfirmPasswordError() && touched.confirmPassword
                                            ? "border-red-500 focus:border-red-500"
                                            : confirmPassword && !getConfirmPasswordError() && touched.confirmPassword
                                                ? "border-green-500 focus:border-green-500"
                                                : "border-zinc-700 focus:border-gold"
                                        }
                                        `}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                                {getConfirmPasswordError() && (
                                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle size={14}/>
                                        {getConfirmPasswordError()}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                                <p className="text-sm text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16}/>
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
                                <p className="text-sm text-green-400 flex items-center gap-2">
                                    <CheckCircle size={16}/>
                                    {success}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-full rounded-lg px-4 py-3 font-medium text-black 
                                transition-all duration-200
                                ${isSubmitting
                                ? "bg-zinc-600 cursor-not-allowed opacity-70"
                                : "bg-gold hover:bg-orange hover:shadow-lg hover:shadow-gold/20 transform hover:scale-[1.02]"
                            }
                            `}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4" fill="none"/>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    {isRegistering ? "Creating account..." : "Signing in..."}
                                </span>
                            ) : (
                                isRegistering ? "Create Account" : "Sign In"
                            )}
                        </button>

                        {/* Demo Credentials (Development only) */}
                        {process.env.NODE_ENV === "development" && (
                            <div className="mt-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700">
                                <p className="text-xs text-zinc-400 text-center">
                                    Demo: Use any email with password (min 8 chars)
                                </p>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-400">
                        {isRegistering ? "Already have an account?" : "Need an account?"}{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="font-semibold text-gold underline-offset-4 hover:underline transition-colors"
                            disabled={isSubmitting}
                        >
                            {isRegistering ? "Sign in instead" : "Create one"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-zinc-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
