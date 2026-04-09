import { Notification } from '../types';
import { db } from './firebaseClient';
import { collection, doc, getDocs, updateDoc, addDoc, query, where } from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
    // Fetch notifications for a user
    getNotifications: async (userId: string, role?: string): Promise<Notification[]> => {
        try {
            // First query: direct target to userId
            const q1 = query(collection(db, NOTIFICATIONS_COLLECTION), where('recipientId', '==', userId));
            // Second query: broadcast
            const q2 = query(collection(db, NOTIFICATIONS_COLLECTION), where('recipientId', '==', 'all'));
            
            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            
            const notifications: Notification[] = [];
            snap1.forEach(doc => notifications.push({ id: doc.id, ...doc.data() } as Notification));
            snap2.forEach(doc => notifications.push({ id: doc.id, ...doc.data() } as Notification));
            
            if (role) {
                const groupName = role === 'farmer' ? 'group:farmers' : role === 'buyer' ? 'group:agents' : '';
                if (groupName) {
                    const q3 = query(collection(db, NOTIFICATIONS_COLLECTION), where('recipientId', '==', groupName));
                    const snap3 = await getDocs(q3);
                    snap3.forEach(doc => notifications.push({ id: doc.id, ...doc.data() } as Notification));
                }
            }

            // Sort descending by createdAt
            return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    // Mark a notification as read
    markAsRead: async (notificationId: string): Promise<void> => {
        try {
            const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
            await updateDoc(docRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    // Create a notification
    createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
        try {
            const payload = {
                ...notification,
                read: false,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), payload);
            return {
                id: docRef.id,
                ...payload
            } as Notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
};
