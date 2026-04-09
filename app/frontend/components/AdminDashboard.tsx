
import React, { useState, useEffect } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebaseClient';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import DashboardCard from './common/DashboardCard';
import AreaChart from './common/charts/AreaChart';
import Button from './common/Button';
import StaticLogo from './common/StaticLogo';
import {
    ShieldCheckIcon,
    UserCircleIcon,
    BuildingIcon,
    ArrowRightOnRectangleIcon,
    BugIcon,
    ExclamationTriangleIcon,
    CheckBadgeIcon
} from './common/IconComponents';

import AdminNotificationPanel from './AdminNotificationPanel';
import NotificationCenter from './NotificationCenter';
import { AdminModals } from './AdminModals';

interface AdminDashboardProps {
    user: UserProfile;
    onLogout: () => void;
    onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onNavigate }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRequests: 0,
        activeMarkets: 15,
        diseasesDetected: 3890
    });
    
    const [activeModal, setActiveModal] = useState<'create_alert' | 'manage_users' | 'system_settings' | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const usersSnap = await getCountFromServer(collection(db, 'users'));
                const requestsSnap = await getCountFromServer(collection(db, 'sell_requests'));
                setStats(prev => ({
                    ...prev,
                    totalUsers: usersSnap.data().count,
                    totalRequests: requestsSnap.data().count,
                }));
            } catch (e) {
                console.error("Failed to load counts", e);
            }
        };
        loadStats();
    }, []);

    const systemHealthData = [
        { name: 'Mon', load: 24 },
        { name: 'Tue', load: 35 },
        { name: 'Wed', load: 28 },
        { name: 'Thu', load: 45 },
        { name: 'Fri', load: 62 },
        { name: 'Sat', load: 55 },
        { name: 'Sun', load: 40 },
    ];

    const recentActivity = [
        { id: 1, user: 'Farmer_01', action: 'Reported New Disease', time: '2m ago', status: 'Pending' },
        { id: 2, user: 'Market_Agent_blr', action: 'Updated Tomato Prices', time: '15m ago', status: 'Success' },
        { id: 3, user: 'System', action: 'Daily Backup', time: '1h ago', status: 'Success' },
        { id: 4, user: 'Farmer_05', action: 'Failed Login Attempt', time: '2h ago', status: 'Warning' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white font-poppins">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <StaticLogo />
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 ml-2">ADMIN</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate('home')}
                            className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            Platform Home
                        </button>
                        <NotificationCenter user={user} />
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {user.fullName.charAt(0)}
                            </div>
                            <span className="hidden md:inline">{user.fullName}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            title="Logout"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <span className="hidden md:inline font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-end gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-white">System Overview</h1>
                        <p className="text-slate-400 mt-1">Platform performance and user metrics.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="!bg-slate-700 hover:!bg-slate-600" onClick={() => alert("Loading logs...")}>Download Logs</Button>
                        <Button size="sm" className="!bg-blue-600 hover:!bg-blue-700" onClick={() => setActiveModal('system_settings')}>System Settings</Button>
                    </div>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard
                        icon={<UserCircleIcon className="w-6 h-6" />}
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        color="from-green-500 to-emerald-600"
                        index={0}
                    />
                    <DashboardCard
                        icon={<BuildingIcon className="w-6 h-6" />}
                        title="Active Markets / Requests"
                        value={stats.totalRequests.toLocaleString()}
                        color="from-blue-500 to-indigo-600"
                        index={1}
                    />
                    <DashboardCard
                        icon={<BugIcon className="w-6 h-6" />}
                        title="Diseases Detected"
                        value={stats.diseasesDetected.toLocaleString()}
                        color="from-purple-500 to-pink-600"
                        index={2}
                    />
                    <DashboardCard
                        icon={<ShieldCheckIcon className="w-6 h-6" />}
                        title="System Health"
                        value="99.9%"
                        color="from-amber-500 to-orange-600"
                        index={3}
                    />
                </div>

                {/* Charts & Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* System Load Chart */}
                    <motion.div
                        className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Server Load & Traffic</h3>
                        <div className="h-64 w-full">
                            <AreaChart
                                data={systemHealthData}
                                xKey="name"
                                yKey="load"
                                gradientColor="text-blue-500"
                                texts={{ detections: "Load (%)" } as any}
                            />
                        </div>
                    </motion.div>

                    {/* Recent Activity Feed */}
                    <motion.div
                        className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'Success' ? 'bg-green-500' : item.status === 'Warning' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{item.action}</p>
                                        <p className="text-xs text-slate-400 truncate">by {item.user}</p>
                                    </div>
                                    <span className="text-xs text-slate-500 whitespace-nowrap">{item.time}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => alert("Audit log viewer coming soon.")} className="w-full mt-4 text-center text-sm text-blue-400 hover:text-blue-300 py-2">View Full Audit Log</button>
                    </motion.div>
                </div>

                {/* Action Panel */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 mb-3" />
                        <h4 className="font-bold text-white">Alert Broadcast</h4>
                        <p className="text-sm text-slate-400 mb-4">Send emergency notifications to farmers in specific districts.</p>
                        <Button onClick={() => setActiveModal('create_alert')} size="sm" className="w-full !bg-slate-700 hover:!bg-slate-600">Create Alert</Button>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <UserCircleIcon className="w-8 h-8 text-blue-500 mb-3" />
                        <h4 className="font-bold text-white">User Management</h4>
                        <p className="text-sm text-slate-400 mb-4">Verify new market agents and moderate user content.</p>
                        <Button onClick={() => setActiveModal('manage_users')} size="sm" className="w-full !bg-slate-700 hover:!bg-slate-600">Manage Users</Button>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <CheckBadgeIcon className="w-8 h-8 text-green-500 mb-3" />
                        <h4 className="font-bold text-white">Model Training</h4>
                        <p className="text-sm text-slate-400 mb-4">Review new dataset additions for the disease detection model.</p>
                        <Button onClick={() => alert('Model parameters are synced automatically from Vertex AI.')} size="sm" className="w-full !bg-slate-700 hover:!bg-slate-600">Review Data</Button>
                    </div>
                </motion.div>

                {/* Notification Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <AdminNotificationPanel />
                </motion.div>
            </main>

            {/* Admin Modals */}
            <AdminModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
        </div>
    );
};

export default AdminDashboard;
