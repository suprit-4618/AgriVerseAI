import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, CropSellRequest } from '../types';
import { marketService } from '../services/marketService';
import { XCircleIcon, DocumentTextIcon, MapPinIcon, TrashIcon } from './common/IconComponents';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';

interface MyRequestsModalProps {
    onClose: () => void;
    user: UserProfile;
}

const MyRequestsModal: React.FC<MyRequestsModalProps> = ({ onClose, user }) => {
    const [requests, setRequests] = useState<CropSellRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await marketService.getRequestsByFarmer(user.id);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
            try {
                await marketService.deleteRequest(id);
                setRequests(requests.filter(req => req.id !== id));
            } catch (error) {
                console.error("Failed to delete", error);
                alert("Failed to delete request.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col h-[80vh] max-h-[800px]"
            >
                <header className="p-4 sm:p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                        My Sell Requests
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </header>

                <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-900/50">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <LoadingSpinner size="lg" text="Loading requests..." />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <DocumentTextIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">You haven't posted any sell requests yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <div key={req.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
                                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-white">{req.cropName}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : req.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                                                <MapPinIcon className="w-4 h-4" /> {req.marketName}
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                <span className="text-gray-300"><b>Quantity:</b> {req.quantity} Qtl</span>
                                                <span className="text-gray-300"><b>Estimate:</b> ₹{req.aiEstimatedPrice.min} - ₹{req.aiEstimatedPrice.max}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Posted on: {new Date(req.createdAt || '').toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-2 shrink-0 self-end sm:self-auto">
                                            <Button 
                                                onClick={(e) => handleDelete(req.id, e)} 
                                                variant="danger" 
                                                size="sm"
                                                leftIcon={<TrashIcon className="w-4 h-4" />}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default MyRequestsModal;
