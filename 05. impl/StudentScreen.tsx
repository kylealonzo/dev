import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';

const { width } = Dimensions.get('window');

const StudentScreen = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -width * 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STUDENT</Text>
      </View>

      {/* Side Menu */}
      {menuVisible && (
        <View style={styles.sideMenuOverlay}>
          <TouchableOpacity 
            style={styles.sideMenuBackground}
            activeOpacity={1}
            onPress={toggleMenu}
          />
          <Animated.View 
            style={[
              styles.sideMenu,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.menuHeader}>
              <View style={styles.menuUserInfo}>
                <View style={styles.menuAvatar}>
                  <Ionicons name="person" size={30} color="#fff" />
                </View>
                <View style={styles.menuUserDetails}>
                  <Text style={styles.menuUserName}>{user?.name || 'Student Name'}</Text>
                  <Text style={styles.menuUserEmail}>{user?.email || 'student@example.com'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.menuCloseButton} onPress={toggleMenu}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={20} color="#1a4b8e" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings-outline" size={20} color="#1a4b8e" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={20} color="#1a4b8e" />
              <Text style={styles.menuItemText}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
              <Text style={[styles.menuItemText, { color: '#e74c3c' }]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
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
  menuButton: {
    padding: 5,
  },
  sideMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenuBackground: {
    flex: 1,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  menuHeader: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    flexDirection: 'column',
  },
  menuUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a4b8e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuUserDetails: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuUserEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menuCloseButton: {
    position: 'absolute',
    top: 0,
    right: 10,
    padding: 5,
  },
  menuHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
});

export default StudentScreen; 