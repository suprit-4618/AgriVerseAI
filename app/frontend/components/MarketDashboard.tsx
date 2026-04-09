
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, CropSellRequest, RequestMessage } from '../types';
import DashboardCard from './common/DashboardCard';
import SimpleBarChart from './common/charts/SimpleBarChart';
import LineChart from './common/charts/LineChart';
import Button from './common/Button';
import StaticLogo from './common/StaticLogo';
import { marketService } from '../services/marketService';
import {
    BuildingIcon,
    ArrowRightOnRectangleIcon,
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    DocumentTextIcon,
    PencilIcon,
    CheckBadgeIcon,
    XCircleIcon,
    UserCircleIcon,
    MapPinIcon,
    PaperAirplaneIcon
} from './common/IconComponents';

import NotificationCenter from './NotificationCenter';

interface MarketDashboardProps {
    user: UserProfile;
    onLogout: () => void;
    onNavigate: (page: string) => void;
}

const MarketDashboard: React.FC<MarketDashboardProps> = ({ user, onLogout, onNavigate }) => {
    const [currentTab, setCurrentTab] = useState<'overview' | 'requests'>('overview');
    const [requests, setRequests] = useState<CropSellRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<CropSellRequest | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [finalRate, setFinalRate] = useState('');

    // Load requests on mount and polling
    useEffect(() => {
        const loadRequests = async () => {
            const data = await marketService.getAllRequests();
            setRequests(data);
        };
        loadRequests();
        const interval = setInterval(loadRequests, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleSendMessage = async () => {
        if (!selectedRequest || !chatInput.trim()) return;
        const msg = await marketService.addMessage(selectedRequest.id, {
            senderId: user.id,
            senderName: 'Marketer',
            text: chatInput
        });

        // Update UI with the returned message
        setSelectedRequest({
            ...selectedRequest,
            messages: [...(selectedRequest.messages || []), msg]
        });
        setChatInput('');
    };

    const handleApprove = async () => {
        if (!selectedRequest || !finalRate) return;
        await marketService.generateBill(selectedRequest, user.fullName, parseFloat(finalRate));
        await marketService.updateStatus(selectedRequest.id, 'APPROVED', parseFloat(finalRate));
        setShowApprovalModal(false);
        setSelectedRequest(null);
        // Refresh list
        const data = await marketService.getAllRequests();
        setRequests(data);
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (confirm("Are you sure you want to reject this request?")) {
            await marketService.updateStatus(selectedRequest.id, 'REJECTED');
            setSelectedRequest(null);
            const data = await marketService.getAllRequests();
            setRequests(data);
        }
    };

    // Live Data Computations
    const liveVolumeData = React.useMemo(() => {
        const volumeMap: Record<string, number> = {};
        requests.forEach(req => {
            if (req.status === 'APPROVED' || req.status === 'PENDING') {
                volumeMap[req.cropName] = (volumeMap[req.cropName] || 0) + req.quantity;
            }
        });
        const arr = Object.keys(volumeMap).map(name => ({ name, value: volumeMap[name] })).sort((a, b) => b.value - a.value).slice(0, 5);
        return arr.length > 0 ? arr : [{ name: 'No Data', value: 0 }];
    }, [requests]);

    const totalVolume = React.useMemo(() => {
        return requests.reduce((sum, req) => (req.status === 'APPROVED' || req.status === 'PENDING' ? sum + req.quantity : sum), 0);
    }, [requests]);

    const priceTrendData = [{ month: 'Day 1', detections: 1200 }, { month: 'Day 2', detections: 1250 }, { month: 'Day 3', detections: 1180 }, { month: 'Day 4', detections: 1300 }, { month: 'Day 5', detections: 1350 }, { month: 'Day 6', detections: 1400 }];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-poppins flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <StaticLogo />
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded ml-2 border border-amber-500/30">MARKET AGENT</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <NotificationCenter user={user} />
                        <nav className="hidden md:flex gap-1 bg-gray-800 p-1 rounded-lg">
                            <button onClick={() => setCurrentTab('overview')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentTab === 'overview' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Overview</button>
                            <button onClick={() => setCurrentTab('requests')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all relative ${currentTab === 'requests' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                Requests
                                {requests.filter(r => r.status === 'PENDING').length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                            </button>
                        </nav>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onNavigate('home')}
                                className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
                            >
                                Platform Home
                            </button>
                            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-sm">{user.fullName.charAt(0)}</div>
                            <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span className="hidden md:inline font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 flex-grow">
                <AnimatePresence mode="wait">
                    {currentTab === 'overview' ? (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <DashboardCard icon={<BuildingIcon className="w-6 h-6" />} title="Total Volume (Qtl)" value={totalVolume.toLocaleString()} color="from-blue-500 to-cyan-600" index={0} />
                                <DashboardCard icon={<ArrowUpRightIcon className="w-6 h-6" />} title="Avg. Price Inc." value="+12.5%" color="from-green-500 to-emerald-600" index={1} />
                                <DashboardCard icon={<DocumentTextIcon className="w-6 h-6" />} title="Active Requests" value={requests.filter(r => r.status === 'PENDING').length} color="from-amber-500 to-orange-600" index={2} />
                                <DashboardCard icon={<ArrowDownRightIcon className="w-6 h-6" />} title="Pending Actions" value={requests.filter(r => r.status === 'PENDING').length} color="from-red-500 to-pink-600" index={3} />
                            </div>
                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-6">Price Trend (Tomato)</h3>
                                    <div className="h-64 w-full"><LineChart data={priceTrendData} /></div>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-6">Volume by Crop</h3>
                                    <div className="h-64 w-full"><SimpleBarChart data={liveVolumeData} /></div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
                            {/* Request List */}
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-gray-700 font-semibold">Incoming Requests</div>
                                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                                    {requests.length === 0 ? (
                                        <p className="text-center text-gray-500 mt-10">No requests found.</p>
                                    ) : (
                                        requests.map(req => (
                                            <div
                                                key={req.id}
                                                onClick={() => setSelectedRequest(req)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedRequest?.id === req.id ? 'bg-gray-700 border-amber-500' : 'bg-gray-800 border-transparent hover:bg-gray-700'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-white">{req.cropName}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : req.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{req.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-400">{req.farmerName} • {req.quantity} Qtl</p>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Detail View */}
                            <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
                                {selectedRequest ? (
                                    <>
                                        <div className="p-6 border-b border-gray-700 flex justify-between items-start bg-gray-800/50">
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">{selectedRequest.cropName} <span className="text-lg font-normal text-gray-400">({selectedRequest.category})</span></h2>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1"><UserCircleIcon className="w-4 h-4" /> {selectedRequest.farmerName}</span>
                                                    <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {selectedRequest.location.name}</span>
                                                </div>
                                            </div>
                                            {selectedRequest.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <Button onClick={handleReject} variant="danger" size="sm">Reject</Button>
                                                    <Button onClick={() => setShowApprovalModal(true)} className="!bg-green-600 hover:!bg-green-700" size="sm">Approve</Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-6 mb-6">
                                                <div className="space-y-4">
                                                    <div className="bg-gray-900 p-4 rounded-lg">
                                                        <p className="text-gray-400 text-sm">Quantity</p>
                                                        <p className="text-xl font-bold">{selectedRequest.quantity} Quintals</p>
                                                    </div>
                                                    <div className="bg-gray-900 p-4 rounded-lg">
                                                        <p className="text-gray-400 text-sm">AI Estimate</p>
                                                        <p className="text-xl font-bold text-green-400">₹{selectedRequest.aiEstimatedPrice.min} - ₹{selectedRequest.aiEstimatedPrice.max}</p>
                                                    </div>
                                                    <div className="bg-gray-900 p-4 rounded-lg">
                                                        <p className="text-gray-400 text-sm">Weather Context</p>
                                                        <p className="text-white">{selectedRequest.weatherSummary}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                                                    {selectedRequest.imageUrl ? (
                                                        <img src={selectedRequest.imageUrl} alt="Crop" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-500">No Image Provided</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chat Section */}
                                            <div className="border-t border-gray-700 pt-4">
                                                <h3 className="font-semibold mb-3">Communication</h3>
                                                <div className="bg-gray-900 rounded-lg h-48 overflow-y-auto p-4 space-y-3 mb-3">
                                                    {selectedRequest.messages.length === 0 && <p className="text-center text-gray-600 text-sm">No messages yet.</p>}
                                                    {selectedRequest.messages.map(msg => (
                                                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                                {msg.text}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={chatInput}
                                                        onChange={e => setChatInput(e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                                        className="flex-1 bg-gray-700 border-none rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Type a message..."
                                                    />
                                                    <button onClick={handleSendMessage} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"><PaperAirplaneIcon className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">Select a request to view details</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Approval Modal */}
            <AnimatePresence>
                {showApprovalModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-4">Approve Request</h3>
                            <p className="text-gray-400 mb-6 text-sm">Enter the final agreed rate per quintal. This will generate a digital bill for the farmer.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Final Rate (₹/Qtl)</label>
                                    <input
                                        type="number"
                                        value={finalRate}
                                        onChange={e => setFinalRate(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-lg font-bold text-center focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                {finalRate && selectedRequest && (
                                    <div className="bg-gray-900/50 p-3 rounded-lg text-sm space-y-1">
                                        <div className="flex justify-between"><span>Quantity:</span> <span>{selectedRequest.quantity} Qtl</span></div>
                                        <div className="flex justify-between font-bold text-green-400"><span>Total:</span> <span>₹{(parseFloat(finalRate) * selectedRequest.quantity).toLocaleString()}</span></div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button onClick={() => setShowApprovalModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                                <Button onClick={handleApprove} disabled={!finalRate} className="flex-1 !bg-green-600 hover:!bg-green-700">Confirm & Bill</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketDashboard;
