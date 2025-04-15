import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

// Define a structure for the user data returned by the API
interface User {
  id: string | number;
  fname: string;
  lname: string;
  username: string;
  email?: string;
  contactnumber?: string;
  role: string;
}

interface LoginScreenProps {
  // Update onLogin prop to accept the User object on success
  onLogin: (user: User) => void; 
}

const { width } = Dimensions.get('window');

// Define the API endpoint
// IMPORTANT: Replace 'localhost' with your computer's IP address if testing on a physical device
const API_URL = 'http://192.168.68.131:3001'; 

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleLogin = async () => { // Make the function async
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setError('');
    setIsLoading(true); // Start loading

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, call onLogin with the user data from the response
        onLogin(data.user); 
      } else {
        // Login failed, show error message from server
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (networkError) {
      // Handle network errors (e.g., server not reachable)
      console.error('Login network error:', networkError);
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.backgroundPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.logoTitle}>ATTENDANCE</Text>
          <Text style={styles.logoSubtitle}>Student Portal</Text>
        </View>
        
        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ROLE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={20} color="#1a4b8e" style={styles.inputIcon} />
              <Picker
                selectedValue={role}
                onValueChange={(itemValue: string) => setRole(itemValue)}
                style={styles.picker}
                dropdownIconColor="#1a4b8e"
              >
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Lecturer" value="lecturer" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>USERNAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#1a4b8e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                autoCapitalize="none"
                placeholderTextColor="#aaa"
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#1a4b8e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#1a4b8e" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]} // Apply disabled style when loading
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading} // Disable button when loading
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" /> // Show loading indicator
            ) : (
              <Text style={styles.loginButtonText}>SIGN IN</Text> // Show text otherwise
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2023 Attendance System</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4b8e',
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  patternCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  patternCircle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: '30%',
    left: '20%',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 6,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a4b8e',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    borderRadius: 12,
    backgroundColor: '#f7f9fc',
    borderWidth: 1,
    borderColor: '#edf2f7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#2d3748',
  },
  passwordToggle: {
    paddingRight: 16,
  },
  picker: {
    flex: 1,
    height: 52,
    color: '#2d3748',
  },
  loginButton: {
    backgroundColor: '#1a4b8e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1a4b8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: '#9EB3CB', 
    shadowOpacity: 0.1,
    elevation: 2,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#1a4b8e',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#e53e3e',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#fff5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});

export default LoginScreen; 