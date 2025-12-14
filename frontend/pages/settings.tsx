import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getUser } from '../lib/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, User } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = getUser();
        if (userData) {
            setUser(userData);
        } else {
            router.push('/auth/login');
        }
        document.documentElement.setAttribute('data-theme', 'dark');
    }, [router]);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white">
            <Sidebar />

            <main className="flex-1 flex flex-col min-h-screen relative p-6">
                <Header user={user?.name || 'User'} />

                <div className="max-w-4xl mx-auto w-full z-10 space-y-8">
                    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Profile Settings</h2>
                                <p className="text-gray-400">Manage your account information</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    defaultValue={user?.name || 'Guest User'}
                                    className="bg-black/20 border-white/10 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    defaultValue={user?.email || 'user@example.com'}
                                    disabled
                                    className="bg-black/20 border-white/10 text-white opacity-60"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
        </div>
    );
}
