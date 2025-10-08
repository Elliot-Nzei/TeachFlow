
'use client';
import React, { createContext, useState, useEffect } from 'react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type Settings = {
    name: string;
    schoolName: string;
    email: string;
    profilePicture: string;
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
    const { firestore, user, settings: globalSettings, isSettingsLoading } = useFirebase();
    const [localSettings, setLocalSettings] = useState<Settings | null>(null);

    useEffect(() => {
        if (globalSettings) {
            setLocalSettings(globalSettings);
        }
    }, [globalSettings]);

    const handleSetSettings = (newSettings: Partial<Settings>) => {
        if (user && localSettings) {
            const updatedSettings = { ...localSettings, ...newSettings };
            setLocalSettings(updatedSettings);
            const userRef = doc(firestore, 'users', user.uid);
            updateDocumentNonBlocking(userRef, newSettings);
        }
    }

    return (
        <SettingsContext.Provider value={{ settings: localSettings, setSettings: handleSetSettings, isLoading: isSettingsLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};
