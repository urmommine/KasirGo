import { Audio } from 'expo-av';
import { useCallback, useEffect, useState } from 'react';

export const useBeepSound = () => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const loadSound = useCallback(async () => {
        try {
            // Using a simple beep sound from a public URL or local asset
            // For now, let's just use a placeholder logic or a local asset if available
            const { sound: newSound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/beep.mp3')
            );
            setSound(newSound);
        } catch (e) {
            console.warn('Failed to load beep sound', e);
        }
    }, []);

    useEffect(() => {
        loadSound();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [loadSound]);

    const playBeep = useCallback(async () => {
        try {
            if (sound) {
                await sound.replayAsync();
            }
        } catch (e) {
            console.error('Failed to play beep sound', e);
        }
    }, [sound]);

    return { playBeep };
};
