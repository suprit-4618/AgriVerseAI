import { CropSellRequest, RequestMessage, BillReceipt, RequestStatus } from '../types';
import { db } from './firebaseClient';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    onSnapshot,
    Unsubscribe 
} from 'firebase/firestore';
import { notificationService } from './notificationService';
import { orderService } from './orderService';

const CROPS_MARKET_COLLECTION = 'sell_requests';
const BILLS_COLLECTION = 'bills';

export const marketService = {
    /**
     * Real-time subscription to all harvest listings (for Buyer marketplace & Admin telemetry)
     */
    subscribeAllRequests: (callback: (requests: CropSellRequest[]) => void): Unsubscribe => {
        const q = query(
            collection(db, CROPS_MARKET_COLLECTION)
        );

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CropSellRequest[];
            requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            callback(requests);
        }, (error) => {
            console.error("Error listening to market listings:", error);
            callback([]);
        });
    },

    /**
     * Real-time subscription to listings owned by a specific farmer
     */
    subscribeFarmerRequests: (farmerId: string, callback: (requests: CropSellRequest[]) => void): Unsubscribe => {
        const q = query(
            collection(db, CROPS_MARKET_COLLECTION),
            where('farmerId', '==', farmerId)
        );

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CropSellRequest[];
            requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            callback(requests);
        }, (error) => {
            console.error("Error listening to farmer requests:", error);
            callback([]);
        });
    },

    getAllRequests: async (): Promise<CropSellRequest[]> => {
        try {
            const q = query(collection(db, CROPS_MARKET_COLLECTION));
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CropSellRequest[];
            return requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } catch (error) {
            console.error("Error fetching market requests:", error);
            return [];
        }
    },

    getRequestsByFarmer: async (farmerId: string): Promise<CropSellRequest[]> => {
        try {
            const q = query(collection(db, CROPS_MARKET_COLLECTION), where('farmerId', '==', farmerId));
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CropSellRequest[];
            return requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } catch (error) {
            console.error("Error fetching requests by farmer:", error);
            return [];
        }
    },

    createRequest: async (request: Omit<CropSellRequest, 'id' | 'status' | 'messages' | 'createdAt'>): Promise<CropSellRequest> => {
        try {
            const payload = {
                ...request,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                messages: []
            };

            const docRef = await addDoc(collection(db, CROPS_MARKET_COLLECTION), payload);
            return {
                id: docRef.id,
                ...payload
            } as CropSellRequest;
        } catch (error) {
            console.error("Error creating request:", error);
            throw error;
        }
    },

    updateStatus: async (
        requestId: string, 
        status: RequestStatus, 
        finalRate?: number,
        buyerId?: string,
        buyerName?: string
    ): Promise<CropSellRequest> => {
        try {
            const docRef = doc(db, CROPS_MARKET_COLLECTION, requestId);
            await updateDoc(docRef, { status, ...(finalRate ? { finalRate } : {}) });
            
            const updatedDoc = await getDoc(docRef);
            const req = { id: updatedDoc.id, ...updatedDoc.data() } as CropSellRequest;

            // When deal is approved, automatically generate contract order
            if (status === 'APPROVED' && finalRate && buyerId && buyerName) {
                try {
                    await orderService.createOrder(req, buyerId, buyerName, finalRate);
                } catch (oe) {
                    console.warn("Failed to create order contract:", oe);
                }
            }

            // Generate notification for farmer
            try {
                const notifType = status === "APPROVED" ? "success" : status === "REJECTED" ? "error" : "info";
                await notificationService.createNotification({
                    recipientId: req.farmerId,
                    title: `Deal ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`,
                    message: `Your harvest listing for ${req.cropName} (${req.quantity} Qtl) has been ${status.toLowerCase()}${finalRate ? ` at ₹${finalRate}/Q` : ''}.`,
                    type: notifType,
                });
            } catch (ne) {
                console.error("Failed to send notification: ", ne);
            }

            return req;
        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    },

    deleteRequest: async (requestId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, CROPS_MARKET_COLLECTION, requestId));
        } catch (error) {
            console.error("Error deleting request:", error);
            throw error;
        }
    },

    addMessage: async (requestId: string, message: Omit<RequestMessage, 'id' | 'timestamp'>): Promise<RequestMessage> => {
        try {
           const docRef = doc(db, CROPS_MARKET_COLLECTION, requestId);
           const requestDoc = await getDoc(docRef);
           if (!requestDoc.exists()) throw new Error("Request not found");
           
           const newMessage = {
               ...message,
               id: `msg_${Date.now()}`,
               timestamp: new Date().toISOString()
           };
           
           const currentMessages = requestDoc.data()?.messages || [];
           await updateDoc(docRef, { 
               messages: [...currentMessages, newMessage],
               status: 'NEGOTIATING'
           });

           // Notify recipient
           const reqData = requestDoc.data();
           const recipientId = message.senderId === reqData.farmerId ? 'all_buyers' : reqData.farmerId;
           try {
               await notificationService.createNotification({
                   recipientId,
                   title: `New Offer on ${reqData.cropName}`,
                   message: `${message.senderName}: "${message.text}"`,
                   type: 'info'
               });
           } catch (ne) {
               // notification is best-effort
           }

           return newMessage;
        } catch(e) {
            console.error("Error adding message", e);
            throw e;
        }
    },

    generateBill: async (request: CropSellRequest, buyerName: string, finalRate: number): Promise<BillReceipt> => {
        try {
            const bill: Omit<BillReceipt, "billId"> = {
                requestId: request.id,
                farmerName: request.farmerName,
                buyerName,
                cropName: request.cropName,
                quantity: request.quantity,
                ratePerQuintal: finalRate,
                totalAmount: request.quantity * finalRate,
                marketFee: 0, // 0% Middleman platform fee
                date: new Date().toISOString(),
                marketName: request.marketName
            };

            const docRef = await addDoc(collection(db, BILLS_COLLECTION), bill);
            return {
                billId: docRef.id,
                ...bill
            } as BillReceipt;
        } catch (error) {
            console.error("Error generating bill:", error);
            throw error;
        }
    }
};
