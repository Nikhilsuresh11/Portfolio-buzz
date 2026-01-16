import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { logout } from '@/lib/auth';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, User, LogOut } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';

export default function SettingsPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/');
        }
        document.documentElement.setAttribute('data-theme', 'dark');
    }, [router, isAuthLoading, userEmail]);

    if (isAuthLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <PageLoader
                    messages={[
                        "Loading settings...",
                        "Fetching your account...",
                        "Almost ready..."
                    ]}
                    subtitle="Preparing your settings"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Manual Header for Consistency */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                        Settings
                    </h1>
                    <p className="text-zinc-400">Manage your account preferences</p>
                </div>
            </div>

            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">
                {/* Profile Settings */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Account Profile</h2>
                            <p className="text-neutral-400">Manage your account information and preferences</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Email Address</Label>
                            <Input
                                value={userEmail || ''}
                                disabled
                                className="bg-white/5 border-white/10 text-neutral-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Account Type</Label>
                            <div className="flex items-center gap-2 h-10 px-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 font-semibold text-sm">
                                <Shield size={16} />
                                Pro Member
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Section */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
                                <LogOut size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Sign Out</h2>
                                <p className="text-neutral-400">Log out of your account</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-0.5">
                            <Button
                                onClick={handleLogout}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-10 px-6 rounded-[11px]"
                            >
                                <LogOut size={16} />
                                Log Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full font-medium ${className}`}>
            {children}
        </span>
    );
}
