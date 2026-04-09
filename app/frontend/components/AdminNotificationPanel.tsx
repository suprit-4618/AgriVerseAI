import React, { useState } from 'react';
import { notificationService } from '../services/notificationService';
import Button from './common/Button';
import { PaperAirplaneIcon } from './common/IconComponents';

const AdminNotificationPanel: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [recipientType, setRecipientType] = useState<'all' | 'group' | 'individual'>('all');
    const [recipientId, setRecipientId] = useState('');
    const [group, setGroup] = useState<'farmers' | 'agents'>('farmers');
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setStatus(null);

        try {
            let finalRecipientId = 'all';
            if (recipientType === 'group') {
                finalRecipientId = `group:${group}`;
            } else if (recipientType === 'individual') {
                finalRecipientId = recipientId;
            }

            await notificationService.createNotification({
                recipientId: finalRecipientId,
                title,
                message,
                type
            });

            setStatus({ type: 'success', msg: 'Notification sent successfully!' });
            setTitle('');
            setMessage('');
            setRecipientId('');
        } catch (error) {
            setStatus({ type: 'error', msg: 'Failed to send notification.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Send Notification</h2>

            {status && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {status.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Notification Title"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Notification Message"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Recipient Type</label>
                        <select
                            value={recipientType}
                            onChange={(e) => setRecipientType(e.target.value as any)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="all">All Users</option>
                            <option value="group">Specific Group</option>
                            <option value="individual">Individual User</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notification Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="info">Info (Blue)</option>
                            <option value="success">Success (Green)</option>
                            <option value="warning">Warning (Yellow)</option>
                            <option value="error">Error (Red)</option>
                        </select>
                    </div>
                </div>

                {recipientType === 'group' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Group</label>
                        <select
                            value={group}
                            onChange={(e) => setGroup(e.target.value as any)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="farmers">Farmers</option>
                            <option value="agents">Market Agents</option>
                        </select>
                    </div>
                )}

                {recipientType === 'individual' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">User ID</label>
                        <input
                            type="text"
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter User ID"
                        />
                    </div>
                )}

                <div className="pt-2">
                    <Button
                        type="submit"
                        isLoading={isSending}
                        leftIcon={<PaperAirplaneIcon className="w-5 h-5" />}
                        className="w-full md:w-auto"
                    >
                        Send Notification
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminNotificationPanel;
