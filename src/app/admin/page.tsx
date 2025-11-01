'use client';

import { AdminUsageDashboard } from '@/components/lazy/LazyUsageDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check if already authenticated on mount
    useEffect(() => {
        const authStatus = sessionStorage.getItem('admin-authenticated');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                setIsAuthenticated(true);
                sessionStorage.setItem('admin-authenticated', 'true');
                setPassword('');
            } else {
                const data = await response.json();
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin-authenticated');
        setPassword('');
    };

    if (isAuthenticated) {
        return (
            <div className="min-h-screen bg-zinc-800 border border-zinc-700">
                <div className="w-full px-4 py-8">
                    <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-white">
                            Admin Dashboard
                        </h1>
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                        >
                            Logout
                        </Button>
                    </div>

                    <AdminUsageDashboard />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-800 border border-zinc-700 flex items-center justify-center p-4">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-zinc-700 border border-zinc-600 p-3 rounded-full">
                        <Lock size={32} className="text-zinc-300" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-white mb-2">
                    Admin Access
                </h1>
                <p className="text-zinc-300 text-center mb-8">
                    Enter the admin password to access the dashboard
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                required
                                disabled={isLoading}
                                className="pr-12"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || !password.trim()}
                        className="w-full"
                    >
                        {isLoading ? 'Authenticating...' : 'Access Dashboard'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-400">
                        Authorized personnel only
                    </p>
                </div>
            </div>
        </div>
    );
}