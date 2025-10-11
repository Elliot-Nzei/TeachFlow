
'use client';
import React, { createContext, useState, useEffect } from 'react';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type Settings = {
    name: string;
    schoolName: string;
    schoolMotto: string;
    schoolAddress: string;
    email: string;
    schoolLogo: string;
    currentTerm: 'First Term' | 'Second Term' | 'Third Term';
    currentSession: string;
    userCode: string;
    studentCounter?: number;
}

type SettingsContextType = {
    settings: Settings | null;
    setSettings: (newSettings: Partial<Settings>) => void;
    isLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    setSettings: () => {},
    isLoading: true,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const { firestore, user, isUserLoading } = useFirebase();
    const [localSettings, setLocalSettings] = useState<Settings | null>(null);

    const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: fetchedSettings, isLoading: isSettingsLoading } = useDoc<Settings>(userProfileQuery);
    
    useEffect(() => {
        if (fetchedSettings) {
            setLocalSettings(fetchedSettings);
        }
    }, [fetchedSettings]);

    const handleSetSettings = (newSettings: Partial<Settings>) => {
        if (user && localSettings) {
            const updatedSettings = { ...localSettings, ...newSettings };
            setLocalSettings(updatedSettings);
            const userRef = doc(firestore, 'users', user.uid);
            updateDocumentNonBlocking(userRef, newSettings);
        }
    }

    const isLoading = isUserLoading || isSettingsLoading;

    return (
        <SettingsContext.Provider value={{ settings: localSettings, setSettings: handleSetSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};
