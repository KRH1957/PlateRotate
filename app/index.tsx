import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { getSettings } from '../src/db/settingsDb';
import { Colors } from '../src/theme';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        // Require both the flag AND a diet selection — the flag alone can persist
        // across reinstalls if app data survives the install (e.g. adb install).
        // Without a diet there is nothing to convert to, so the app is unusable.
        setOnboardingDone(settings.onboardingComplete && settings.dietId !== null);
      })
      .catch(() => {
        // If we can't read settings, send to onboarding — safest default
        setOnboardingDone(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={onboardingDone ? '/(tabs)/convert' : '/onboarding/welcome'} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
