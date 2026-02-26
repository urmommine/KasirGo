import { useAudioPlayer } from 'expo-audio';

// Path to the beep sound asset
const beepSource = require('../../assets/sounds/beep.mp3');

/**
 * Custom hook to provide beep sound functionality with preloading.
 * Uses downloadFirst option to reduce playback latency.
 * Must be used within a React component.
 */
export function useBeepSound() {
    const player = useAudioPlayer(beepSource, {
        // Preload audio for instant playback - reduces delay
        downloadFirst: true,
        // Keep audio session active for faster subsequent plays
        keepAudioSessionActive: true,
    });

    const playBeep = () => {
        // Reset to beginning and play immediately
        player.seekTo(0);
        player.play();
    };

    return { playBeep };
}
