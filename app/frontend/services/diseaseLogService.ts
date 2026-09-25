import { DiseaseLog, PlantAnalysisReport } from '../types';
import { db } from './firebaseClient';
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    Unsubscribe 
} from 'firebase/firestore';

const DISEASE_LOGS_COLLECTION = 'disease_logs';

export const diseaseLogService = {
    /**
     * Save a completed plant disease diagnostic scan to Firestore
     */
    saveScanLog: async (
        farmerId: string,
        farmerName: string,
        location: string,
        crop: string,
        report: PlantAnalysisReport,
        imageUrl?: string
    ): Promise<DiseaseLog> => {
        try {
            const now = new Date().toISOString();
            
            // Extract remedies
            const organic = report.remedies?.organic 
                ? [report.remedies.organic.treatment, ...(report.remedies.organic.steps || [])]
                : [];
            const chemical = report.remedies?.chemical 
                ? [report.remedies.chemical.treatment, ...(report.remedies.chemical.steps || [])]
                : [];
            const prevention = report.preventionTips || [];

            const logData: Omit<DiseaseLog, 'id'> = {
                farmerId,
                farmerName,
                crop: crop || report.cropName?.en || 'Crop',
                diseaseName: report.diseaseName?.en || (report.isHealthy ? 'Healthy Plant' : 'Unknown Disease'),
                confidenceScore: Math.round((report.confidence || 0.95) * 100),
                severity: report.severity?.en as any || (report.isHealthy ? 'Healthy' : 'Moderate'),
                organicRemedy: organic.filter(Boolean),
                chemicalRemedy: chemical.filter(Boolean),
                preventionTips: prevention.filter(Boolean),
                imageUrl: imageUrl || '',
                location: location || 'Karnataka, India',
                timestamp: now
            };

            const docRef = await addDoc(collection(db, DISEASE_LOGS_COLLECTION), logData);
            return {
                id: docRef.id,
                ...logData
            };
        } catch (error) {
            console.error('Error logging plant disease scan:', error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time scan history for a specific farmer
     */
    subscribeFarmerScanHistory: (farmerId: string, callback: (logs: DiseaseLog[]) => void): Unsubscribe => {
        const q = query(
            collection(db, DISEASE_LOGS_COLLECTION),
            where('farmerId', '==', farmerId)
        );

        return onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as DiseaseLog[];
            logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(logs);
        }, (error) => {
            console.error('Error fetching farmer disease logs:', error);
            callback([]);
        });
    },

    /**
     * Subscribe to all disease scan logs across Karnataka (for Admin telemetry & outbreak clustering)
     */
    subscribeAllDiseaseLogs: (callback: (logs: DiseaseLog[]) => void): Unsubscribe => {
        const q = query(
            collection(db, DISEASE_LOGS_COLLECTION)
        );

        return onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as DiseaseLog[];
            logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(logs);
        }, (error) => {
            console.error('Error listening to all disease logs:', error);
            callback([]);
        });
    }
};
