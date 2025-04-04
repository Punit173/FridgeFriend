import React, { useState } from "react";
import { supabase } from "./supabase.js";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 p-4">
            {/* Main Container */}
            <div className="w-full max-w-md">
                {/* Card with Glass Effect */}
                <div className="bg-emerald-900/30 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-emerald-700/30 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/10"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                                FridgeFriend
                            </h1>
                            <p className="text-emerald-200">Your Smart Kitchen Assistant</p>
                        </div>

                        {/* Feature Highlights */}
                        <div className="mb-8 grid grid-cols-3 gap-4">
                            <div className="bg-emerald-800/30 rounded-lg p-3 text-center border border-emerald-700/30">
                                <span className="text-2xl mb-1">🤖</span>
                                <p className="text-xs text-emerald-200">AI Tracking</p>
                            </div>
                            <div className="bg-emerald-800/30 rounded-lg p-3 text-center border border-emerald-700/30">
                                <span className="text-2xl mb-1">🎤</span>
                                <p className="text-xs text-emerald-200">Voice Log</p>
                            </div>
                            <div className="bg-emerald-800/30 rounded-lg p-3 text-center border border-emerald-700/30">
                                <span className="text-2xl mb-1">🤝</span>
                                <p className="text-xs text-emerald-200">Community</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-900/30 text-red-300 p-3 rounded-lg mb-4 border border-red-800/50">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-emerald-200 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-emerald-800/30 border border-emerald-700/50 rounded-lg text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition duration-200"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-emerald-200">
                                        Password
                                    </label>
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-emerald-800/30 border border-emerald-700/50 rounded-lg text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition duration-200"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-emerald-900 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </div>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-emerald-200">
                                Don't have an account?{" "}
                                <a href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                    Sign Up
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;