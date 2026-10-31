import { db } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { PetService } from '../types/booking';
import { PET_SERVICES as DEFAULT_SERVICES } from '../data/petServices';

const SERVICES_CACHE_KEY = 'pet_care_dynamic_services_v2_empty';
const PET_TYPES_CACHE_KEY = 'pet_care_dynamic_pet_types_v2_empty';

export interface PetTypeConfig {
  id: string;
  label: string;
  icon: string;
}

export const DEFAULT_PET_TYPES: PetTypeConfig[] = [];

// --- SERVICES MANAGMENT ---

function getServicesCache(): PetService[] {
  if (typeof window === 'undefined') return DEFAULT_SERVICES;
  try {
    const cached = localStorage.getItem(SERVICES_CACHE_KEY);
    if (!cached) {
      localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(DEFAULT_SERVICES));
      return DEFAULT_SERVICES;
    }
    return JSON.parse(cached);
  } catch (e) {
    return DEFAULT_SERVICES;
  }
}

function saveServicesCache(services: PetService[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(services));
  } catch (e) {
    console.warn(e);
  }
}

export function subscribeToServices(onUpdate: (services: PetService[]) => void): () => void {
  onUpdate(getServicesCache());

  try {
    const colRef = collection(db, 'services');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: PetService[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PetService);
        });

        saveServicesCache(items);
        onUpdate(items);
      },
      (err) => {
        console.warn('Firestore services error:', err);
        onUpdate(getServicesCache());
      }
    );

    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export async function clearAllServices(): Promise<boolean> {
  saveServicesCache([]);
  try {
    const colRef = collection(db, 'services');
    const snapshot = await getDocs(colRef);
    await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
    return true;
  } catch (err) {
    console.warn('Clear services error:', err);
    return true;
  }
}

export async function clearAllPetTypes(): Promise<boolean> {
  savePetTypesCache([]);
  try {
    const docRef = doc(db, 'settings', 'petTypes');
    await setDoc(docRef, { list: [] });
    return true;
  } catch (err) {
    return true;
  }
}

export async function saveService(service: PetService): Promise<boolean> {
  const current = getServicesCache();
  const index = current.findIndex(s => s.id === service.id);
  let updated: PetService[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = service;
  } else {
    updated = [service, ...current];
  }
  saveServicesCache(updated);

  try {
    const docRef = doc(db, 'services', service.id);
    await setDoc(docRef, service);
    return true;
  } catch (err) {
    console.warn('Firestore service save failed:', err);
    return true;
  }
}

export async function deleteService(serviceId: string): Promise<boolean> {
  const current = getServicesCache();
  const updated = current.filter(s => s.id !== serviceId);
  saveServicesCache(updated);

  try {
    const docRef = doc(db, 'services', serviceId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    return true;
  }
}

// --- PET TYPES MANAGEMENT ---

function getPetTypesCache(): PetTypeConfig[] {
  if (typeof window === 'undefined') return DEFAULT_PET_TYPES;
  try {
    const cached = localStorage.getItem(PET_TYPES_CACHE_KEY);
    if (!cached) {
      localStorage.setItem(PET_TYPES_CACHE_KEY, JSON.stringify(DEFAULT_PET_TYPES));
      return DEFAULT_PET_TYPES;
    }
    return JSON.parse(cached);
  } catch (e) {
    return DEFAULT_PET_TYPES;
  }
}

function savePetTypesCache(petTypes: PetTypeConfig[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PET_TYPES_CACHE_KEY, JSON.stringify(petTypes));
  } catch (e) {
    console.warn(e);
  }
}

export function subscribeToPetTypes(onUpdate: (petTypes: PetTypeConfig[]) => void): () => void {
  onUpdate(getPetTypesCache());

  try {
    const colRef = collection(db, 'settings');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        let petTypesData = getPetTypesCache();
        snapshot.forEach((docSnap) => {
          if (docSnap.id === 'petTypes') {
            petTypesData = docSnap.data().list as PetTypeConfig[];
          }
        });
        savePetTypesCache(petTypesData);
        onUpdate(petTypesData);
      },
      (err) => {
        onUpdate(getPetTypesCache());
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

export async function savePetTypes(petTypes: PetTypeConfig[]): Promise<boolean> {
  savePetTypesCache(petTypes);
  try {
    const docRef = doc(db, 'settings', 'petTypes');
    await setDoc(docRef, { list: petTypes });
    return true;
  } catch (err) {
    return true;
  }
}
