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
        setOnboardingDone(settings.onboardingComplete);
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
