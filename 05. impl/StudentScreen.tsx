import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';

const StudentScreen = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>STUDENT</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Content will go here */}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name="home-outline" 
            size={24} 
            color={activeTab === 'dashboard' ? '#1a4b8e' : '#777'} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'dashboard' && styles.activeNavText
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('qr')}
        >
          <Ionicons 
            name="qr-code-outline" 
            size={24} 
            color={activeTab === 'qr' ? '#1a4b8e' : '#777'} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'qr' && styles.activeNavText
          ]}>
            qr scanner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={24} 
            color={activeTab === 'reports' ? '#1a4b8e' : '#777'} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'reports' && styles.activeNavText
          ]}>
            reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('classes')}
        >
          <Ionicons 
            name="grid-outline" 
            size={24} 
            color={activeTab === 'classes' ? '#1a4b8e' : '#777'} 
          />
          <Text style={[
            styles.navText, 
            activeTab === 'classes' && styles.activeNavText
          ]}>
            classes
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  navText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  activeNavText: {
    color: '#1a4b8e',
    fontWeight: '500',
  },
});

export default StudentScreen; 