import { LightSensor } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const LOW_THRESHOLD = 10;
  const HIGH_THRESHOLD = 40;
  const DARKNESS_DURATION_MS = 1200;

  const [lux, setLux] = useState<number>(0);
  const [prostrationCount, setProstrationCount] = useState(0);
  const [subscription, setSubscription] = useState(null);

  const darkSinceRef = useRef<number | null>(null);
  const lastLuxRef = useRef(null);

  useEffect(() => {
    return () => {
      stopSensor();
    };
  }, []);

  const startSensor = () => {
    console.log('🟢 Sensor started');
    const sub = LightSensor.addListener(data => {
      const currentLux = data.illuminance ?? 0;
      setLux(currentLux);
      lastLuxRef.current = currentLux;

      const now = Date.now();
      console.log(`📊 Lux: ${currentLux.toFixed(1)}`);

      if (currentLux < LOW_THRESHOLD) {
        if (!darkSinceRef.current) {
          darkSinceRef.current = now;
          console.log('🔴 Started darkness timer');
        } else if (now - darkSinceRef.current > DARKNESS_DURATION_MS) {
          console.log('🔴 Going dark! Sujood detected and counted.');
          setProstrationCount(prev => prev + 1);
          darkSinceRef.current = null; // reset
        }
      } else if (currentLux > HIGH_THRESHOLD) {
        if (darkSinceRef.current) {
          console.log('🟢 Bright again, resetting dark state');
        }
        darkSinceRef.current = null;
      } else {
        console.log('⚪ Lux between thresholds, reset darkSince');
        darkSinceRef.current = null;
      }
    });

    setSubscription(sub);
  };

  const stopSensor = () => {
    subscription?.remove();
    setSubscription(null);
    console.log('🔴 Sensor stopped');
  };

  const resetCounters = () => {
    setProstrationCount(0);
    darkSinceRef.current = null;
    console.log('🔁 Counters reset');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕌 Sujood Counter</Text>
      <Text style={styles.label}>Prostrations: {prostrationCount}</Text>
      <Text style={[styles.label, styles.bowsCount]}>Bows: {Math.floor(prostrationCount / 2)}</Text>
      <Text style={styles.label}>Lux: {lux !== null ? lux.toFixed(1) : 'N/A'}</Text>
      <Text style={styles.label}>
        Covered: {lux !== null && lux < LOW_THRESHOLD ? 'Yes' : 'No'}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Start" onPress={startSensor} disabled={!!subscription} />
        <Button title="Stop" onPress={stopSensor} disabled={!subscription} />
        <Button title="Reset" onPress={resetCounters} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  label: {
    fontSize: 20,
    marginVertical: 5,
    color: '#ccc',
  },
  buttonContainer: {
    marginTop: 30,
    gap: 10,
    width: '60%',
  },
  bowsCount: {
    fontSize: 32,        // bigger font size for Bows
    fontWeight: 'bold',  // make it bold for emphasis
    color: '#fff',       // brighter color for better visibility
    marginVertical: 10,
  },
});
