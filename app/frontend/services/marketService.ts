import { CropSellRequest, RequestMessage, BillReceipt, RequestStatus } from '../types';
import { db } from './firebaseClient';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { notificationService } from './notificationService';

const SELL_REQUESTS_COLLECTION = 'sell_requests';
const BILLS_COLLECTION = 'bills';

export const marketService = {
    getAllRequests: async (): Promise<CropSellRequest[]> => {
        try {
            const q = query(collection(db, SELL_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CropSellRequest[];
        } catch (error) {
            console.error("Error fetching market requests:", error);
            return [];
        }
    },

    getRequestsByFarmer: async (farmerId: string): Promise<CropSellRequest[]> => {
        try {
            const q = query(collection(db, SELL_REQUESTS_COLLECTION), where('farmerId', '==', farmerId));
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CropSellRequest[];
            return requests.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
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

            const docRef = await addDoc(collection(db, SELL_REQUESTS_COLLECTION), payload);
            return {
                id: docRef.id,
                ...payload
            } as CropSellRequest;
        } catch (error) {
            console.error("Error creating request:", error);
            throw error;
        }
    },

    updateStatus: async (requestId: string, status: RequestStatus, finalRate?: number): Promise<CropSellRequest> => {
        try {
            const docRef = doc(db, SELL_REQUESTS_COLLECTION, requestId);
            await updateDoc(docRef, { status });
            
            const updatedDoc = await getDoc(docRef);
            const req = { id: updatedDoc.id, ...updatedDoc.data() } as CropSellRequest;

            // Generate notification for farmer
            try {
                const notifType = status === "APPROVED" ? "success" : status === "REJECTED" ? "error" : "info";
                await notificationService.createNotification({
                    recipientId: req.farmerId,
                    title: `Deal ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`,
                    message: `Your sell request for ${req.cropName} has been ${status.toLowerCase()}.`,
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
            await deleteDoc(doc(db, SELL_REQUESTS_COLLECTION, requestId));
        } catch (error) {
            console.error("Error deleting request:", error);
            throw error;
        }
    },

    addMessage: async (requestId: string, message: Omit<RequestMessage, 'id' | 'timestamp'>): Promise<RequestMessage> => {
        try {
           const docRef = doc(db, SELL_REQUESTS_COLLECTION, requestId);
           const requestDoc = await getDoc(docRef);
           if (!requestDoc.exists()) throw new Error("Request not found");
           
           const newMessage = {
               ...message,
               id: `msg_${Date.now()}`,
               timestamp: new Date().toISOString()
           };
           
           const currentMessages = requestDoc.data()?.messages || [];
           await updateDoc(docRef, { messages: [...currentMessages, newMessage] });
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
                marketFee: (request.quantity * finalRate) * 0.015, // 1.5% fee
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
