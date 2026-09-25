import { OrderContract, OrderStatus, CropSellRequest } from '../types';
import { db } from './firebaseClient';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    Unsubscribe 
} from 'firebase/firestore';
import { notificationService } from './notificationService';

const ORDERS_COLLECTION = 'orders';

export const orderService = {
    /**
     * Create a new order contract when a buyer accepts / confirms a crop listing deal
     */
    createOrder: async (
        request: CropSellRequest,
        buyerId: string,
        buyerName: string,
        agreedRate: number,
        buyerPhone: string = '',
        deliveryLocation: string = ''
    ): Promise<OrderContract> => {
        try {
            const now = new Date().toISOString();
            const orderId = `ORD-${Date.now().toString().slice(-6)}`;
            const totalAmount = request.quantity * agreedRate;

            const orderData: Omit<OrderContract, 'id'> = {
                orderId,
                requestId: request.id,
                farmerId: request.farmerId,
                farmerName: request.farmerName,
                farmerPhone: '',
                buyerId,
                buyerName,
                buyerPhone,
                cropName: request.cropName,
                quantity: request.quantity,
                ratePerQuintal: agreedRate,
                totalAmount,
                marketFee: 0, // 0% Middleman Platform Fee
                status: 'CONFIRMED',
                deliveryLocation: deliveryLocation || request.location?.name || 'Karnataka Farm-Gate',
                weighbridgeReceiptId: `WB-${Math.floor(100000 + Math.random() * 900000)}`,
                createdAt: now,
                updatedAt: now,
                timeline: [
                    {
                        status: 'PENDING',
                        timestamp: request.createdAt || now,
                        note: 'Harvest batch listed on APMC Sovereign Marketplace'
                    },
                    {
                        status: 'CONFIRMED',
                        timestamp: now,
                        note: `Deal agreed at ₹${agreedRate}/Q by ${buyerName}`
                    }
                ]
            };

            const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);

            // Send notification to farmer
            try {
                await notificationService.createNotification({
                    recipientId: request.farmerId,
                    title: 'Purchase Order Confirmed!',
                    message: `${buyerName} confirmed order ${orderId} for ${request.quantity} Qtl ${request.cropName} at ₹${agreedRate}/Q.`,
                    type: 'success'
                });
            } catch (e) {
                console.warn('Failed to send order notification:', e);
            }

            return {
                id: docRef.id,
                ...orderData
            };
        } catch (error) {
            console.error('Error creating order contract:', error);
            throw error;
        }
    },

    /**
     * Update order lifecycle status (CONFIRMED -> DISPATCHED -> DELIVERED)
     */
    updateOrderStatus: async (
        orderDocId: string, 
        newStatus: OrderStatus, 
        note: string = ''
    ): Promise<void> => {
        try {
            const now = new Date().toISOString();
            const orderRef = doc(db, ORDERS_COLLECTION, orderDocId);
            const snap = await getDoc(orderRef);
            
            if (!snap.exists()) {
                throw new Error('Order not found');
            }

            const currentData = snap.data() as OrderContract;
            const updatedTimeline = [
                ...(currentData.timeline || []),
                {
                    status: newStatus,
                    timestamp: now,
                    note: note || `Order status updated to ${newStatus}`
                }
            ];

            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: now,
                timeline: updatedTimeline
            });

            // Notify both parties
            try {
                await notificationService.createNotification({
                    recipientId: currentData.farmerId,
                    title: `Order #${currentData.orderId} ${newStatus}`,
                    message: `Produce shipment status is now: ${newStatus}`,
                    type: newStatus === 'DELIVERED' ? 'success' : 'info'
                });
                await notificationService.createNotification({
                    recipientId: currentData.buyerId,
                    title: `Order #${currentData.orderId} ${newStatus}`,
                    message: `Produce shipment status is now: ${newStatus}`,
                    type: newStatus === 'DELIVERED' ? 'success' : 'info'
                });
            } catch (e) {
                console.warn('Notification error on order update:', e);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time orders for a Buyer
     */
    subscribeBuyerOrders: (buyerId: string, callback: (orders: OrderContract[]) => void): Unsubscribe => {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('buyerId', '==', buyerId)
        );

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as OrderContract[];
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(orders);
        }, (error) => {
            console.error('Error listening to buyer orders:', error);
            callback([]);
        });
    },

    /**
     * Subscribe to real-time orders for a Farmer
     */
    subscribeFarmerOrders: (farmerId: string, callback: (orders: OrderContract[]) => void): Unsubscribe => {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('farmerId', '==', farmerId)
        );

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as OrderContract[];
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(orders);
        }, (error) => {
            console.error('Error listening to farmer orders:', error);
            callback([]);
        });
    },

    /**
     * Fetch all orders (for Admin oversight)
     */
    subscribeAllOrders: (callback: (orders: OrderContract[]) => void): Unsubscribe => {
        const q = query(
            collection(db, ORDERS_COLLECTION)
        );

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as OrderContract[];
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(orders);
        }, (error) => {
            console.error('Error listening to all orders:', error);
            callback([]);
        });
    }
};
