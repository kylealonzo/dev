import React, { useState, useEffect, createContext } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import LoginScreen from './src/screens/LoginScreen';
import StudentScreen from './src/screens/StudentScreen';
import LecturerScreen from './src/screens/LecturerScreen';
import AdminScreen from './src/screens/AdminScreen';

// Enable screens for better performance
enableScreens();

// Define API URL - make sure to use the same URL as in LoginScreen
const API_URL = 'http://192.168.68.123:3001';

// Define User interface
interface User {
  id: string | number;
  username: string;
  fname: string;
  lname: string;
  email?: string;
  contactnumber?: string;
  role: string;
}

// Create auth context
interface AuthContextType {
  user: User | null;
  handleLogout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  handleLogout: async () => {},
});

// Define navigation types
type RootStackParamList = { 
  Login: undefined;
  Admin: undefined;
  Lecturer: undefined;
  Student: undefined;
};

// Define screen props types
type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;
type AdminScreenProps = StackScreenProps<RootStackParamList, 'Admin'>;
type LecturerScreenProps = StackScreenProps<RootStackParamList, 'Lecturer'>;
type StudentScreenProps = StackScreenProps<RootStackParamList, 'Student'>;

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Log current date when app loads
    const currentDate = new Date();
    console.log('App loaded on:', currentDate.toLocaleDateString());
  }, []);

  const handleLogin = (userData: User) => {
    console.log('Login handler called with:', userData);
    setUser(userData);
    setIsLoggedIn(true);
    console.log('User logged in at:', new Date().toLocaleTimeString());
  };

  const handleLogout = async () => {
    if (user) {
      try {
        // Make request to server to log the logout action
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            role: user.role
          }),
        });
      } catch (error) {
        console.error('Error logging logout:', error);
      }
    }
    
    // Reset auth state
    setIsLoggedIn(false);
    setUser(null);
    console.log('User logged out at:', new Date().toLocaleTimeString());
  };

  const authContextValue = {
    user,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <NavigationContainer>
        <Stack.Navigator>
          {!isLoggedIn ? (
            <Stack.Screen 
              name="Login" 
              options={{ headerShown: false }}
            >
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
          ) : user?.role === 'admin' ? (
            <Stack.Screen 
              name="Admin" 
              component={AdminScreen}
              options={{
                headerShown: false
              }}
            />
          ) : user?.role === 'lecturer' ? (
            <Stack.Screen 
              name="Lecturer" 
              component={LecturerScreen}
              options={{
                headerShown: false
              }}
            />
          ) : user ? (
            <Stack.Screen 
              name="Student" 
              component={StudentScreen}
              options={{
                headerShown: false
              }}
            />
          ) : null}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutButton: {
    marginRight: 15,
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
