import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingSpinner from './src/components/common/LoadingSpinner';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Nasalization': require('./assets/fonts/Nasalization Rg.otf'),
  });

  if (!fontsLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
}

