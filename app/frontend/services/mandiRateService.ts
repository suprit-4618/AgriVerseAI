import { MarketRateRecord } from '../types';
import { db } from './firebaseClient';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    orderBy, 
    onSnapshot,
    Unsubscribe 
} from 'firebase/firestore';

const MARKET_RATES_COLLECTION = 'market_rates';

const INITIAL_KARNATAKA_RATES: Omit<MarketRateRecord, 'id'>[] = [
    {
        marketName: 'Haveri APMC',
        district: 'Haveri',
        commodity: 'Cotton (Bunny/Bt)',
        minPrice: 7100,
        maxPrice: 7650,
        modalPrice: 7450,
        priceTrend: 'UP',
        changePercentage: '+2.1%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Kolar APMC',
        district: 'Kolar',
        commodity: 'Tomato (Hybrid)',
        minPrice: 1600,
        maxPrice: 2100,
        modalPrice: 1850,
        priceTrend: 'UP',
        changePercentage: '+5.4%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Mandya APMC',
        district: 'Mandya',
        commodity: 'Finger Millet (Ragi)',
        minPrice: 3800,
        maxPrice: 4200,
        modalPrice: 3920,
        priceTrend: 'UP',
        changePercentage: '+1.2%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Davanagere APMC',
        district: 'Davanagere',
        commodity: 'Maize (Yellow Feed)',
        minPrice: 2050,
        maxPrice: 2200,
        modalPrice: 2140,
        priceTrend: 'DOWN',
        changePercentage: '-0.8%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Belagavi APMC',
        district: 'Belagavi',
        commodity: 'Soybean (Grade-A)',
        minPrice: 4400,
        maxPrice: 4850,
        modalPrice: 4620,
        priceTrend: 'UP',
        changePercentage: '+1.8%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Chikkamagaluru APMC',
        district: 'Chikkamagaluru',
        commodity: 'Coffee (Robusta Cherry)',
        minPrice: 9400,
        maxPrice: 10200,
        modalPrice: 9800,
        priceTrend: 'UP',
        changePercentage: '+3.0%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Kalaburagi APMC',
        district: 'Kalaburagi',
        commodity: 'Tur Dal (Red Gram)',
        minPrice: 9800,
        maxPrice: 10800,
        modalPrice: 10250,
        priceTrend: 'UP',
        changePercentage: '+4.2%',
        updatedAt: new Date().toISOString()
    },
    {
        marketName: 'Mysuru APMC',
        district: 'Mysuru',
        commodity: 'Paddy (Sona Masoori)',
        minPrice: 2400,
        maxPrice: 2750,
        modalPrice: 2580,
        priceTrend: 'STABLE',
        changePercentage: '0.0%',
        updatedAt: new Date().toISOString()
    }
];

export const mandiRateService = {
    /**
     * Subscribe to real-time Karnataka APMC Mandi rates from Firestore
     */
    subscribeLiveMandiRates: (callback: (rates: MarketRateRecord[]) => void): Unsubscribe => {
        const q = query(
            collection(db, MARKET_RATES_COLLECTION)
        );

        return onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                // If collection is empty, auto-seed with standard verified Karnataka APMC benchmark rates
                await mandiRateService.seedRates();
                return;
            }

            const rates = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as MarketRateRecord[];
            callback(rates);
        }, (error) => {
            console.error('Error listening to mandi rates:', error);
            callback(INITIAL_KARNATAKA_RATES.map((r, i) => ({ id: `local_${i}`, ...r })));
        });
    },

    /**
     * Seed initial benchmark APMC rates into Firestore
     */
    seedRates: async (): Promise<void> => {
        try {
            for (const rate of INITIAL_KARNATAKA_RATES) {
                const docId = `${rate.district.toLowerCase()}_${rate.commodity.split(' ')[0].toLowerCase()}`;
                await setDoc(doc(db, MARKET_RATES_COLLECTION, docId), rate, { merge: true });
            }
        } catch (error) {
            console.error('Error seeding mandi rates:', error);
        }
    },

    /**
     * Update an APMC commodity rate (used by Admin or automated AGMARKNET sync)
     */
    updateRate: async (
        docId: string, 
        modalPrice: number, 
        minPrice: number, 
        maxPrice: number
    ): Promise<void> => {
        try {
            const now = new Date().toISOString();
            await setDoc(doc(db, MARKET_RATES_COLLECTION, docId), {
                modalPrice,
                minPrice,
                maxPrice,
                updatedAt: now
            }, { merge: true });
        } catch (error) {
            console.error('Error updating mandi rate:', error);
            throw error;
        }
    }
};
