import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/IconComponents';
import { UserProfile, Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { useLanguage } from '../context/LanguageContext';

interface NotificationCenterProps {
    user: UserProfile;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user }) => {
    const { isKannada } = useLanguage();
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
            case 'success': return <CheckCircleIcon className="w-4 h-4 text-white" />;
            case 'warning': return <ExclamationTriangleIcon className="w-4 h-4 text-neutral-300" />;
            case 'error': return <XCircleIcon className="w-4 h-4 text-neutral-400" />;
            default: return <InformationCircleIcon className="w-4 h-4 text-white" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-neutral-400 hover:text-white transition-colors rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
                title={isKannada ? "ಸೂಚನೆಗಳು" : "Notifications"}
            >
                <BellIcon className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
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
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden z-50 font-mono"
                    >
                        <div className="p-3.5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/60">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                                {isKannada ? "ಸೂಚನೆಗಳು" : "Notifications"}
                            </h3>
                            <span className="text-[10px] text-neutral-400">
                                {unreadCount} {isKannada ? "ಓದಿಲ್ಲ" : "unread"}
                            </span>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500 text-xs">
                                    <p>{isKannada ? "ಯಾವುದೇ ಹೊಸ ಸೂಚನೆಗಳಿಲ್ಲ" : "No notifications yet"}</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-neutral-900">
                                    {notifications.map(notification => (
                                        <li
                                            key={notification.id}
                                            className={`p-3.5 hover:bg-neutral-900/50 transition-colors cursor-pointer ${notification.read ? 'opacity-50' : 'bg-neutral-900/20'}`}
                                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`text-xs font-bold ${notification.read ? 'text-neutral-400' : 'text-white'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{notification.message}</p>
                                                    <p className="text-[9px] text-neutral-500 mt-1.5">
                                                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="flex-shrink-0 self-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
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

