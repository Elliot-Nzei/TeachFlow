
'use client';
import React, { createContext, useState, useEffect } from 'react';
import { useUser, useDoc, useFirebase, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
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
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [settings, setLocalSettings] = useState<Settings | null>(null);

    const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<Settings>(userProfileQuery);
    
    useEffect(() => {
        if (userProfile) {
            setLocalSettings(userProfile);
        }
    }, [userProfile]);

    const handleSetSettings = (newSettings: Partial<Settings>) => {
        if (user && settings) {
            const updatedSettings = { ...settings, ...newSettings };
            setLocalSettings(updatedSettings);
            const userRef = doc(firestore, 'users', user.uid);
            updateDocumentNonBlocking(userRef, newSettings);
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings, isLoading: isProfileLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};
