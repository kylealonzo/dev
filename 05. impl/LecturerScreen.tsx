import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  StatusBar as RNStatusBar,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config/config';
import NetInfo from '@react-native-community/netinfo';

interface LecturerScreenProps {}

interface StudentItem {
  id: string;
  name: string;
  studentId: string;
  email: string;
  avatar?: string;
  present: boolean;
  lastAttendance?: string;
  attendanceRecord?: Record<string, boolean>;
}

interface CourseItem {
  id: string;
  id_classes: string;
  classname: string;
  classcode: string;
  classschedule: string;
  time: string;
  section: string;
  room: string;
  capacity: string;
  assigned_date: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  students?: StudentItem[];
  attendance?: number;
}

type TabType = 'dashboard' | 'student' | 'reports' | 'classes';

const LecturerScreen: React.FC<LecturerScreenProps> = () => {
  const navigation = useNavigation();
  const { user, handleLogout } = useContext(AuthContext);
  const lecturerName = user ? `${user.fname} ${user.lname}` : '';
  
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
    
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const lecturerId = user?.id || 1;
      const relationshipUrl = `${API_URL}/lecturer-classes/lecturer/${lecturerId}`;
      console.log('Attempting to fetch from:', relationshipUrl);

      const response = await fetch(relationshipUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (!Array.isArray(data)) {
        console.log('Data is not an array:', data);
        throw new Error('Invalid data format received');
      }

      // Transform the data directly since we're already getting class details
      const transformedCourses: CourseItem[] = data.map(item => ({
        id: item.id_lecturer_class?.toString() || '',
        id_classes: item.id_classes?.toString() || '',
        classname: item.classname || 'Unnamed Class',
        classcode: item.classcode || 'NO-CODE',
        classschedule: item.classschedule || '',
        time: item.time || '',
        section: item.section || '',
        room: item.room || '',
        capacity: item.capacity || '0',
        assigned_date: new Date(item.assigned_date).toLocaleDateString(),
        status: 'ongoing' as const,
        students: [],
        attendance: 0
      }));

      console.log('Transformed courses:', transformedCourses);
      setCourses(transformedCourses);

    } catch (error: any) {
      console.error('Error in fetchData:', error);
      Alert.alert(
        'Error',
        'Failed to load classes. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              console.log('Retrying fetch...');
              fetchData();
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView style={styles.contentScrollView}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome, {lecturerName}</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="book-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statCount}>{courses.length}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statCount}>0</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statCount}>0</Text>
                <Text style={styles.statLabel}>Active Classes</Text>
              </View>
            </View>
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Classes</Text>
            </View>
            
            {isLoading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            ) : courses.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="school-outline" size={64} color="#e1e5e9" />
                <Text style={styles.emptyStateText}>No Classes Yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Connect to your API to see your classes
                </Text>
              </View>
            ) : (
              <View style={styles.coursesList}>
                {courses.map((course) => (
                  <View key={course.id} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={styles.courseNameContainer}>
                        <Text style={styles.courseName}>{course.classname}</Text>
                        <Text style={styles.courseCodeText}>{course.classcode}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(course.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>
                          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.courseInfo}>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{course.classschedule || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{course.time || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="layers-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>Section: {course.section || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>Room: {course.room || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>Capacity: {course.capacity}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.courseActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                          setSelectedCourse(course);
                          setScannerModalVisible(true);
                        }}
                      >
                        <Ionicons name="qr-code-outline" size={18} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>QR Code</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="people-outline" size={18} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>Students</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        );
        
      case 'student':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Student Management Coming Soon</Text>
          </View>
        );
        
      case 'reports':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Reports Coming Soon</Text>
          </View>
        );
        
      case 'classes':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Classes Management Coming Soon</Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  const getStatusColor = (status: CourseItem['status']) => {
    switch (status) {
      case 'ongoing':
        return '#2ecc71';
      case 'upcoming':
        return '#3498db';
      case 'completed':
        return '#95a5a6';
      default:
        return '#3b82f6';
    }
  };

  const getStatusBgColor = (status: CourseItem['status']) => {
    switch (status) {
      case 'ongoing':
        return '#eafaf1';
      case 'upcoming':
        return '#ebf5fb';
      case 'completed':
        return '#f4f6f6';
      default:
        return '#e8f0fe';
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const onLogout = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Confirm Logout",
        "Are you sure you want to log out?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log Out",
            style: "destructive",
            onPress: async () => {
              setIsLoggingOut(true);
              
              // Close the menu with animation
              setMenuVisible(false);
              
              // Start logout animation
              Animated.parallel([
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 0.95,
                  duration: 800,
                  useNativeDriver: true,
                })
              ]).start(async () => {
                // Perform actual logout after animation completes
                await handleLogout();
              });
            }
          }
        ],
        { cancelable: true }
      );
    } catch (error) {
      // Reset animations if error occurs
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      setIsLoggingOut(false);
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Animated.View style={[
        styles.container, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <StatusBar style="dark" />
        
        {/* Logout overlay */}
        {isLoggingOut && (
          <View style={styles.logoutOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.logoutText}>Logging out...</Text>
          </View>
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <Ionicons name="menu-outline" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>LECTURER</Text>
          </View>
        </View>
        
        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <View style={styles.menuContent}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  <TouchableOpacity onPress={() => setMenuVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.menuItemsContainer}>
                  <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="person-outline" size={24} color="#333" style={styles.menuIcon} />
                    <Text style={styles.menuItemText}>Profile</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="settings-outline" size={24} color="#333" style={styles.menuIcon} />
                    <Text style={styles.menuItemText}>Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="notifications-outline" size={24} color="#333" style={styles.menuIcon} />
                    <Text style={styles.menuItemText}>Notifications</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="help-circle-outline" size={24} color="#333" style={styles.menuIcon} />
                    <Text style={styles.menuItemText}>Help & Support</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#f56565" style={styles.menuIcon} />
                    <Text style={[styles.menuItemText, { color: '#f56565' }]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.dismissArea} 
                activeOpacity={1}
                onPress={() => setMenuVisible(false)}
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'dashboard' && styles.activeNavItem]} 
            onPress={() => setActiveTab('dashboard')}
          >
            <Ionicons 
              name={activeTab === 'dashboard' ? "home" : "home-outline"} 
              size={24} 
              color={activeTab === 'dashboard' ? "#3b82f6" : "#666"} 
            />
            <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.activeNavLabel]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'student' && styles.activeNavItem]} 
            onPress={() => setActiveTab('student')}
          >
            <Ionicons 
              name={activeTab === 'student' ? "people" : "people-outline"} 
              size={24} 
              color={activeTab === 'student' ? "#3b82f6" : "#666"} 
            />
            <Text style={[styles.navLabel, activeTab === 'student' && styles.activeNavLabel]}>
              Student
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'reports' && styles.activeNavItem]} 
            onPress={() => setActiveTab('reports')}
          >
            <Ionicons 
              name={activeTab === 'reports' ? "document-text" : "document-text-outline"} 
              size={24} 
              color={activeTab === 'reports' ? "#3b82f6" : "#666"} 
            />
            <Text style={[styles.navLabel, activeTab === 'reports' && styles.activeNavLabel]}>
              Reports
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, activeTab === 'classes' && styles.activeNavItem]} 
            onPress={() => setActiveTab('classes')}
          >
            <Ionicons 
              name={activeTab === 'classes' ? "grid" : "grid-outline"} 
              size={24} 
              color={activeTab === 'classes' ? "#3b82f6" : "#666"} 
            />
            <Text style={[styles.navLabel, activeTab === 'classes' && styles.activeNavLabel]}>
              Classes
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* QR Code Modal */}
        <Modal
          visible={scannerModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setScannerModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeHeader}>
                <Text style={styles.qrCodeTitle}>Attendance QR Code</Text>
                {selectedCourse && (
                  <>
                    <Text style={styles.qrCodeSubtitle}>{selectedCourse.classname}</Text>
                    <View style={styles.qrCodeClassCode}>
                      <Text style={styles.qrCodeClassCodeText}>{selectedCourse.classcode}</Text>
                    </View>
                  </>
                )}
              </View>
              
              <View style={styles.qrCodeBox}>
                {/* In a real app, this would come from the backend */}
                <View style={styles.qrCode}>
                  <Text style={styles.qrPlaceholderText}>
                    QR Code will be generated from backend API
                  </Text>
                </View>
              </View>
              
              {selectedCourse && (
                <View style={styles.qrCodeStats}>
                  <View style={styles.qrCodeStat}>
                    <Text style={styles.qrCodeStatValue}>{selectedCourse.attendance || 0}</Text>
                    <Text style={styles.qrCodeStatLabel}>Present</Text>
                  </View>
                  
                  <View style={styles.qrCodeStat}>
                    <Text style={styles.qrCodeStatValue}>
                      {Number(selectedCourse.capacity) - (selectedCourse.attendance || 0)}
                    </Text>
                    <Text style={styles.qrCodeStatLabel}>Absent</Text>
                  </View>
                  
                  <View style={styles.qrCodeStat}>
                    <Text style={styles.qrCodeStatValue}>
                      {Math.round(((selectedCourse.attendance || 0) / Number(selectedCourse.capacity)) * 100)}%
                    </Text>
                    <Text style={styles.qrCodeStatLabel}>Attendance</Text>
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setScannerModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 0,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  coursesList: {
    padding: 15,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  courseNameContainer: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  courseCodeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  courseInfo: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  courseActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    borderTopColor: '#3b82f6',
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  activeNavLabel: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
  },
  qrCodeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  qrCodeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  qrCodeClassCode: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qrCodeClassCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    letterSpacing: 1,
  },
  qrCodeBox: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  qrCodeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  qrCodeStat: {
    alignItems: 'center',
  },
  qrCodeStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  qrCodeStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  menuContent: {
    backgroundColor: '#fff',
    padding: 20,
    width: '75%',
    height: '100%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  dismissArea: {
    flex: 1,
    width: '25%',
  },
  logoutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
});

export default LecturerScreen; 