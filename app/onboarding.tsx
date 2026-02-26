import { Stack } from 'expo-router';
import React from 'react';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';

export default function OnboardingRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <OnboardingScreen />
        </>
    );
}
