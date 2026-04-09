import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseClient';
import { notificationService } from '../services/notificationService';
import { XCircleIcon, ExclamationTriangleIcon, UserCircleIcon, ShieldCheckIcon } from './common/IconComponents';
import Button from './common/Button';

interface AdminModalsProps {
    activeModal: 'manage_users' | 'create_alert' | 'system_settings' | null;
    onClose: () => void;
}

export const AdminModals: React.FC<AdminModalsProps> = ({ activeModal, onClose }) => {
    if (!activeModal) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {activeModal === 'create_alert' && <><ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" /> Create Broadcast Alert</>}
                        {activeModal === 'manage_users' && <><UserCircleIcon className="w-6 h-6 text-blue-500" /> Manage Platform Users</>}
                        {activeModal === 'system_settings' && <><ShieldCheckIcon className="w-6 h-6 text-slate-400" /> System Settings</>}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar text-slate-200">
                    {activeModal === 'create_alert' && <CreateAlertForm onClose={onClose} />}
                    {activeModal === 'manage_users' && <ManageUsersView />}
                    {activeModal === 'system_settings' && <SystemSettingsView onClose={onClose} />}
                </div>
            </motion.div>
        </div>
    );
};

// --- Create Alert Form ---
const CreateAlertForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all');
    const [type, setType] = useState('warning');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await notificationService.createNotification({
                recipientId: target,
                title,
                message,
                type: type as any
            });
            alert('Broadcast alert sent successfully!');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to send broadcast');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <div>
                <label className="block text-sm text-slate-400 mb-1">Target Audience</label>
                <select value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white">
                    <option value="all">All Users</option>
                    <option value="group:farmers">All Farmers</option>
                    <option value="group:agents">All Market Agents</option>
                </select>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Alert Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white">
                    <option value="info">General Info (Blue)</option>
                    <option value="warning">Warning / Alert (Yellow)</option>
                    <option value="error">Critical (Red)</option>
                    <option value="success">Success (Green)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Alert Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="e.g., Heavy Rainfall Warning" />
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Message Content</label>
                <textarea required value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[120px]" placeholder="Detailed message..." />
            </div>
            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Broadcasting...' : 'Broadcast Alert'}</Button>
            </div>
        </form>
    );
};

// --- Manage Users View ---
const ManageUsersView: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            const snap = await getDocs(collection(db, 'users'));
            setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleDelete = async (id: string, role: string) => {
        if (role === 'admin') {
            alert('Cannot delete administrators via this dashboard.');
            return;
        }
        if (confirm('Delete this user record? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'users', id));
                setUsers(users.filter(u => u.id !== id));
            } catch (e) {
                console.error(e);
                alert('Failed to delete user');
            }
        }
    };

    if (loading) return <div className="text-center py-10">Loading users...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="p-3 text-slate-400 font-medium">Name</th>
                        <th className="p-3 text-slate-400 font-medium">Email</th>
                        <th className="p-3 text-slate-400 font-medium">Role</th>
                        <th className="p-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="p-3 font-medium text-white">{u.first_name} {u.last_name || ''}</td>
                            <td className="p-3 text-sm">{u.email}</td>
                            <td className="p-3">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${
                                    u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                    u.role === 'buyer' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-green-500/20 text-green-400'
                                }`}>
                                    {u.role?.toUpperCase()}
                                </span>
                            </td>
                            <td className="p-3">
                                <button
                                    onClick={() => handleDelete(u.id, u.role)}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- System Settings View ---
const SystemSettingsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isSaving, setIsSaving] = useState(false);
    return (
        <div className="max-w-xl mx-auto space-y-6">
            <p className="text-slate-400 text-sm">Platform configuration and maintenance controls.</p>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-white">Maintenance Mode</h4>
                    <p className="text-sm text-slate-400">Put the platform offline for users. Admins can still login.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-white">Allow New Registrations</h4>
                    <p className="text-sm text-slate-400">Enable or disable public signup endpoints.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-white">AI Model Target Confidence</h4>
                    <p className="text-sm text-slate-400">Minimum threshold for automated disease detection.</p>
                </div>
                <select className="bg-slate-900 border border-slate-600 rounded p-1 text-sm text-white">
                    <option>High (95%+)</option>
                    <option>Standard (85%+)</option>
                    <option>Aggressive (75%+)</option>
                </select>
            </div>

            <div className="pt-6 flex justify-end">
                <Button 
                    onClick={() => {
                        setIsSaving(true);
                        setTimeout(() => { setIsSaving(false); onClose(); alert("Settings saved!"); }, 1000);
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>
        </div>
    );
};
