import * as Haptics from 'expo-haptics';
import { LightSensor } from 'expo-sensors';
import React, { useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [sub, setSub] = useState(false);
  const [prostrationCount, setProstrationCount] = useState(0);
  const [bowCount, setBowCount] = useState(0);
  const [lux, setLux] = useState<number>(0);
  const [lastSujoodDuration, setLastSujoodDuration] = useState<number | null>(null);

  const LOW_THRESHOLD = 45;
  const HIGH_THRESHOLD = 80;
  const DARKNESS_TIMEOUT_MS = 600;

  const darkSinceRef = useRef<number | null>(null);
  const isDarkRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  const reset = () => {
    setProstrationCount(0);
    setBowCount(0);
  };

  const start = () => {
    console.log('🟢 Sensor started');
    setSub(true);
    subscriptionRef.current = LightSensor.addListener(reading => {
      const currentLux = reading.illuminance;
      setLux(currentLux);
      console.log('📊 Lux:', currentLux);

      const now = Date.now();

      if (currentLux < LOW_THRESHOLD) {
        if (!darkSinceRef.current) {
          darkSinceRef.current = now;
          console.log('🔴 Started darkness timer');
        } else if (!isDarkRef.current && now - darkSinceRef.current >= DARKNESS_TIMEOUT_MS) {
          const duration = now - darkSinceRef.current;
          setProstrationCount(prev => {
            const newCount = prev + 1;

            // Increment bowCount every two sujood
            if (newCount % 2 === 0) {
              setBowCount(b => b + 1);
            }

            // Haptic feedback on successful sujood
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setLastSujoodDuration(duration / 1000);
            console.log('🔴 Going dark! Sujood detected and counted.');

            return newCount;
          });

          isDarkRef.current = true;
        }
      } else if (currentLux > HIGH_THRESHOLD) {
        if (isDarkRef.current || darkSinceRef.current) {
          console.log('🟢 Bright again, resetting dark state');
        }
        darkSinceRef.current = null;
        isDarkRef.current = false;
      } else {
        if (darkSinceRef.current !== null) {
          console.log('⚪ Lux between thresholds, reset darkSince');
          darkSinceRef.current = null;
        }
      }
    });
  };

  const stop = () => {
    console.log('🔴 Sensor stopped');
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    darkSinceRef.current = null;
    isDarkRef.current = false;
    setSub(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Uncomment if image is resolved */}
      {/* <Image
        source={require('../../assets/images/kaaba1.jpg')}
        style={styles.image}
        resizeMode="cover"
      /> */}

      <Text style={styles.header}>عداد الصلاة</Text>

      <View style={styles.counterContainer}>
        <Text style={styles.countLabel}>السجود (Prostrations):</Text>
        <Text style={styles.count}>{prostrationCount}</Text>
        <Text style={styles.countLabel}>الركوع (Bows):</Text>
        <Text style={styles.bowCount}>{bowCount}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="ابدأ (Start)" onPress={start} color="#0c3d0eff" disabled={!!sub} />
        <View style={{ height: 10, padding: 20 }} />
        <Button title="توقف (Stop)" onPress={stop} color="#470f0bff" disabled={!sub} />
        <View style={{ height: 10, padding: 20 }} />
        <Button title="Reset" onPress={reset} />
      </View>

      <Text style={styles.luxText}>🌞 الإضاءة: {lux?.toFixed(1) ?? '0.0'} lux</Text>

      {lastSujoodDuration !== null && (
        <Text style={styles.timerText}>
          ⏱️ مدة السجود الأخير: {lastSujoodDuration.toFixed(1)} ثانية
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 60,
    alignItems: 'center',
    backgroundColor: '#111',
    flexGrow: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#ddd',
  },
  image: {
    width: '90%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  countLabel: {
    fontSize: 20,
    marginTop: 10,
    color: '#fff',
  },
  count: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  bowCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d9dde2ff',
  },
  buttonContainer: {
    marginVertical: 20,
    width: '70%',
  },
  luxText: {
    fontSize: 24,
    marginTop: 10,
    color: '#4CAF50',
  },
  timerText: {
    fontSize: 18,
    marginTop: 10,
    color: '#fff',
  },
});
