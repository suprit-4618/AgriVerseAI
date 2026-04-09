import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/IconComponents';
import { UserProfile, Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationCenterProps {
    user: UserProfile;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        // Map user role to backend role expected by API
        const role = user.role === 'admin' ? 'admin' : user.role === 'buyer' ? 'agent' : 'farmer';
        const data = await notificationService.getNotifications(user.id, role);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
            case 'error': return <XCircleIcon className="w-5 h-5 text-red-500" />;
            default: return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-green-600 transition-colors rounded-full hover:bg-green-50"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                            <span className="text-xs text-gray-500">{unreadCount} unread</span>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {notifications.map(notification => (
                                        <li
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${notification.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="flex-shrink-0 self-center">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
