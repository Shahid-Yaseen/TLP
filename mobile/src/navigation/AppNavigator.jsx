import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useEffect, useRef } from 'react';

// Screens
import Homepage from '../screens/Home/Homepage';
import AboutUs from '../screens/About/AboutUs';
import LaunchCenter from '../screens/Launches/LaunchCenter';
import LaunchDetail from '../screens/Launches/LaunchDetail';
import MissionBriefing from '../screens/Launches/MissionBriefing';
import News from '../screens/News/News';
import ArticleDetail from '../screens/News/ArticleDetail';
import AstronautsList from '../screens/Spacebase/AstronautsList';
import AstronautProfile from '../screens/Spacebase/AstronautProfile';
import RocketsList from '../screens/Spacebase/RocketsList';
import EnginesList from '../screens/Spacebase/EnginesList';
import SpacecraftList from '../screens/Spacebase/SpacecraftList';
import FacilitiesList from '../screens/Spacebase/FacilitiesList';
import PadsList from '../screens/Spacebase/PadsList';
import AgenciesList from '../screens/Spacebase/AgenciesList';
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import EmailVerification from '../screens/Auth/EmailVerification';
import Profile from '../screens/Profile/Profile';
import Notifications from '../screens/Notifications/Notifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabs = () => {

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#374151',
        },
        tabBarActiveTintColor: '#8B1A1A',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={Homepage}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="LaunchesTab" 
        component={LaunchCenter}
        options={{
          tabBarLabel: 'Launches',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'rocket' : 'rocket-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="NewsTab" 
        component={News}
        options={{
          tabBarLabel: 'News',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'newspaper' : 'newspaper-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="SpacebaseTab" 
        component={AstronautsList}
        options={{
          tabBarLabel: 'Spacebase',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'planet' : 'planet-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={Profile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { loading, isAuthenticated } = useAuth();
  const { setNavigationRef } = useNotifications();
  const navigationRef = useRef(null);

  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [setNavigationRef]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        if (navigationRef.current) {
          setNavigationRef(navigationRef.current);
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="EmailVerification" component={EmailVerification} />

        {/* Main Tabs */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Detail Screens */}
        <Stack.Screen name="LaunchDetail" component={LaunchDetail} />
        <Stack.Screen name="MissionBriefing" component={MissionBriefing} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetail} />
        <Stack.Screen name="AstronautProfile" component={AstronautProfile} />
        
        {/* Spacebase List Screens */}
        <Stack.Screen name="RocketsList" component={RocketsList} />
        <Stack.Screen name="EnginesList" component={EnginesList} />
        <Stack.Screen name="SpacecraftList" component={SpacecraftList} />
        <Stack.Screen name="FacilitiesList" component={FacilitiesList} />
        <Stack.Screen name="PadsList" component={PadsList} />
        <Stack.Screen name="AgenciesList" component={AgenciesList} />
        
        {/* Other Screens */}
        <Stack.Screen name="AboutUs" component={AboutUs} />
        <Stack.Screen name="Notifications" component={Notifications} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

