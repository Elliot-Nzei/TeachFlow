'use client';
import React, { createContext, useState, useEffect } from 'react';

type Settings = {
    name: string;
    schoolName: string;
    email: string;
    profilePicture: string;
    currentTerm: 'First Term' | 'Second Term' | 'Third Term';
    currentSession: string;
}

type SettingsContextType = {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const defaultSettings: Settings = {
    name: 'John Doe',
    schoolName: 'Sunshine Primary School',
    email: 'j.doe@example.com',
    profilePicture: 'https://picsum.photos/seed/user-avatar/100/100',
    currentTerm: 'First Term',
    currentSession: '2023/2024',
};

export const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    setSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        if (typeof window !== 'undefined') {
            const savedSettings = localStorage.getItem('nsms-settings');
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        }
        return defaultSettings;
    });
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('nsms-settings', JSON.stringify(settings));
        }
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
