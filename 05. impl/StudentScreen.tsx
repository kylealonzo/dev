import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera as ExpoCamera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';
import { useNavigation } from '@react-navigation/native';

const Camera = ExpoCamera as any;
const CameraType = { back: 'back' };

interface StudentScreenProps {}

interface CourseItem {
  id: string;
  name: string;
  time: string;
  location: string;
  classroom: string;
  attendanceMarked: boolean;
  attendanceTime?: string;
  description?: string;
  classCode?: string;
}

interface NavItem {
  id: string;
  title: string;
  description: string;
  badge?: number;
}

interface ApiResponse {
  ok: boolean;
  data: {
    courses: CourseItem[];
  };
}

const StudentScreen: React.FC<StudentScreenProps> = () => {
  const navigation = useNavigation();
  const { user, handleLogout } = useContext(AuthContext);
  const studentName = user ? `${user.fname} ${user.lname}` : '';
  
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [selectedNavItem, setSelectedNavItem] = useState<NavItem | null>(null);
  const [navModalVisible, setNavModalVisible] = useState(false);
  
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);
  
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanningActive, setScanningActive] = useState(false);
  const cameraRef = useRef<any>(null);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const navigationItems: NavItem[] = [
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'View all course announcements and updates from your instructor. Important dates, class cancellations, and additional resources will be posted here.'
    },
    {
      id: 'assignments',
      title: 'Assignments',
      description: 'Access all homework, projects, and tasks assigned for this course. Submit your work and view grades and feedback from your instructor.'
    },
    {
      id: 'quizzes',
      title: 'Quizzes',
      description: 'Take online quizzes and assessments for this course. View your results and feedback after completion.'
    },
    {
      id: 'grades',
      title: 'Grades',
      description: 'View your grades for all assignments, quizzes, and exams. Track your progress throughout the semester.',
      badge: 4
    },
    {
      id: 'files',
      title: 'Files',
      description: 'Access course materials, lecture slides, readings, and other resources shared by your instructor.'
    },
    {
      id: 'people',
      title: 'People',
      description: 'View the list of instructors, teaching assistants, and classmates enrolled in this course.'
    }
  ];
  
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
    
    // Set loading state initially
    setIsLoading(true);
    
    // Fetch data (in a real app this would call an API)
    fetchData();
  }, []);

  useEffect(() => {
    if (scannerModalVisible) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }
  }, [scannerModalVisible]);

  useEffect(() => {
    if (scannerModalVisible && !scanningActive) {
      // Animate the scan line up and down
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnimation.setValue(0);
    }
  }, [scannerModalVisible, scanningActive]);

  const markAttendance = (id: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    });
    
    setCourses(
      courses.map(course => 
        course.id === id 
          ? { ...course, attendanceMarked: true, attendanceTime: timeString } 
          : course
      )
    );
    
    Alert.alert('Success', 'Attendance marked successfully!');
  };
  
  const handleCoursePress = (course: CourseItem) => {
    setSelectedCourse(course);
    setModalVisible(true);
  };
  
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCourse(null);
  };

  const handleNavItemPress = (navItem: NavItem) => {
    setSelectedNavItem(navItem);
    setNavModalVisible(true);
  };
  
  const handleCloseNavModal = () => {
    setNavModalVisible(false);
    setSelectedNavItem(null);
  };

  const handleJoinClass = () => {
    if (!classCode.trim()) {
      Alert.alert('Error', 'Please enter a class code');
      return;
    }
    
    setIsJoining(true);
    // TODO: Implement actual class joining logic with API
    setTimeout(() => {
      // This would be replaced with actual API call to verify the class code
      // and get the class details from the server
      const classExists = true; // This would be checked against the server
      
      if (!classExists) {
        setIsJoining(false);
        Alert.alert('Error', 'Invalid class code. Please check and try again.');
        return;
      }
      
      // Simulate getting class details from server
      const newCourse: CourseItem = {
        id: Date.now().toString(),
        name: 'Programming 101', // This would come from server
        time: '10:00 AM - 11:30 AM',
        location: 'Building A',
        classroom: 'Room 101',
        classCode: classCode.toUpperCase(),
        attendanceMarked: false
      };
      
      setCourses(prevCourses => {
        // Check if already joined
        if (prevCourses.some(course => course.classCode === classCode.toUpperCase())) {
          setIsJoining(false);
          Alert.alert('Error', 'You have already joined this class');
          return prevCourses;
        }
        
        // Add new course
        Alert.alert('Success', `Successfully joined ${newCourse.name}`);
        return [...prevCourses, newCourse];
      });
      
      setIsJoining(false);
      setJoinModalVisible(false);
      setClassCode('');
    }, 1500);
  };

  const handleScanQR = () => {
    setScanningQR(true);
    setScannerModalVisible(true);
  };
  
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanningActive) return;
    
    setScanningActive(true);
    
    try {
      // Try to parse the scanned data as JSON
      let scannedData;
      try {
        scannedData = JSON.parse(data);
      } catch (e) {
        // If not JSON, treat as plain text (class code)
        setTimeout(() => {
          setScanningActive(false);
          setScanningQR(false);
          setScannerModalVisible(false);
          setClassCode(data);
          
          Alert.alert('Scan Successful', `QR code scanned successfully. Class code: ${data}`);
        }, 500);
        return;
      }
      
      // Check if this is an attendance QR code
      if (scannedData.type === 'attendance' && scannedData.courseId) {
        // Find the course that matches the QR code
        const course = courses.find(c => c.id === scannedData.courseId);
        
        if (!course) {
          Alert.alert('Error', 'You are not enrolled in this class');
          setScanningActive(false);
          setScanningQR(false);
          setScannerModalVisible(false);
          return;
        }
        
        if (course.attendanceMarked) {
          Alert.alert('Already Marked', 'Your attendance for this class has already been recorded');
          setScanningActive(false);
          setScanningQR(false);
          setScannerModalVisible(false);
          return;
        }
        
        // Mark attendance for this course
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        });
        
        setCourses(
          courses.map(c => 
            c.id === scannedData.courseId 
              ? { ...c, attendanceMarked: true, attendanceTime: timeString } 
              : c
          )
        );
        
        // Create data for sending to API
        const attendanceData = {
          courseId: scannedData.courseId,
          studentId: 'current_student_id', // This would be the actual student ID in a real app
          timestamp: new Date().toISOString(),
        };
        
        // In a real app, you would send this data to your API
        console.log('Sending attendance data to API:', attendanceData);
        
        Alert.alert('Success', `Attendance recorded for ${course.name}`);
      } else {
        // Unknown QR code format
        Alert.alert('Unknown QR Format', 'This QR code is not recognized');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code');
    } finally {
      setTimeout(() => {
        setScanningActive(false);
        setScanningQR(false);
        setScannerModalVisible(false);
      }, 500);
    }
  };
  
  const handleCancelScan = () => {
    setScanningQR(false);
    setScannerModalVisible(false);
    setScanningActive(false);
  };

  const handleLeaveClass = (courseId: string, courseName: string) => {
    Alert.alert(
      'Leave Class',
      `Are you sure you want to leave ${courseName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual API call to leave class
            setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
            setModalVisible(false);
            setSelectedCourse(null);
            Alert.alert('Success', `You have left ${courseName}`);
          }
        }
      ]
    );
  };

  const renderCourseItem = ({ item }: { item: CourseItem }) => (
    <TouchableOpacity 
      style={styles.courseItem}
      onPress={() => handleCoursePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.courseContent}>
        <Text style={styles.courseName}>{item.name}</Text>
        <Text style={styles.courseTime}>{item.time}</Text>
        <Text style={styles.courseLocation}>{item.location} • Room {item.classroom}</Text>
        {item.attendanceMarked && (
          <View style={styles.attendanceTag}>
            <Text style={styles.attendanceTagText}>
              Present {item.attendanceTime && `(${item.attendanceTime})`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Add this helper function for generating consistent colors based on class name
  const getRandomColor = (name: string) => {
    const colors = [
      '#4299E1', // blue
      '#48BB78', // green
      '#ED8936', // orange
      '#9F7AEA', // purple
      '#F56565', // red
      '#38B2AC', // teal
    ];
    
    // Use the sum of character codes to generate a consistent index
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const fetchData = async () => {
    try {
      // In a real app, this would be an actual API call
      // For now, set empty data and handle in the UI
      setCourses([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to connect to server');
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const renderScannerModal = () => (
    <Modal
      visible={scannerModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelScan}
    >
      <View style={styles.scannerContainer}>
        {hasPermission === null ? (
          <View style={styles.scannerLoading}>
            <ActivityIndicator size="large" color="#1a4b8e" />
            <Text style={styles.scannerText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.scannerLoading}>
            <Text style={styles.scannerText}>No access to camera</Text>
            <TouchableOpacity style={styles.scannerButton} onPress={handleCancelScan}>
              <Text style={styles.scannerButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannerContent}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>
                {scanningQR ? 'Scan QR Code' : 'Scanning...'}
              </Text>
              <Text style={styles.scannerSubtitle}>
                {scanningQR 
                  ? 'Scan the QR code displayed by your lecturer' 
                  : 'Positioning camera to scan QR code'}
              </Text>
            </View>
            
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.back}
              onBarCodeScanned={scanningActive ? undefined : handleBarCodeScanned}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scanFrameContainer}>
                  <View style={styles.scanFrame} />
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 220]
                            })
                          }
                        ]
                      }
                    ]}
                  />
                </View>
                {scanningActive && (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.processingText}>Processing...</Text>
                  </View>
                )}
              </View>
            </Camera>
            
            <TouchableOpacity style={styles.scannerButton} onPress={handleCancelScan}>
              <Text style={styles.scannerButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  const generateStudentQRCode = (courseId: string) => {
    // In a real app, you would include a token or authentication information
    // The student ID would be obtained from the authentication context
    return JSON.stringify({
      studentId: 'student_123', // This would be the actual student ID in a real app
      courseId: courseId,
      timestamp: new Date().toISOString()
    });
  };

  const renderCourseModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedCourse && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalCourseName}>{selectedCourse.name}</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalClassCodeContainer}>
                <Text style={styles.modalClassCodeLabel}>Class Code</Text>
                <Text style={styles.modalClassCode}>{selectedCourse.classCode}</Text>
              </View>
              
              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>Course Details</Text>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="time-outline" size={20} color="#555" style={{marginRight: 8}} />
                  <Text style={styles.modalInfoText}>{selectedCourse.time}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="location-outline" size={20} color="#555" style={{marginRight: 8}} />
                  <Text style={styles.modalInfoText}>
                    {selectedCourse.location} • Room {selectedCourse.classroom}
                  </Text>
                </View>
                
                {selectedCourse.description && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="information-circle-outline" size={20} color="#555" style={{marginRight: 8}} />
                    <Text style={styles.modalInfoText}>{selectedCourse.description}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.modalAttendanceSection}>
                <Text style={styles.modalSectionTitle}>Attendance Status</Text>
                
                <View style={styles.modalAttendanceStatus}>
                  <Ionicons 
                    name={selectedCourse.attendanceMarked ? "checkmark-circle" : "alert-circle"} 
                    size={24} 
                    color={selectedCourse.attendanceMarked ? "#2ecc71" : "#f39c12"} 
                  />
                  <View style={styles.modalAttendanceTextContainer}>
                    <Text style={styles.modalAttendanceStatusText}>
                      {selectedCourse.attendanceMarked ? "Present" : "Not Marked"}
                    </Text>
                    {selectedCourse.attendanceMarked && selectedCourse.attendanceTime && (
                      <Text style={styles.modalAttendanceTimeText}>
                        Marked at {selectedCourse.attendanceTime}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.leaveButton}
                onPress={() => handleLeaveClass(selectedCourse.id, selectedCourse.name)}
              >
                <Text style={styles.leaveButtonText}>Leave Course</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

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
        
        {/* Simple Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <Ionicons name="menu-outline" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>STUDENT</Text>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#666"
              colors={["#666"]}
              progressBackgroundColor="#ffffff"
            />
          }
        >
          {isLoading ? (
            <View style={{justifyContent: 'center', alignItems: 'center', paddingVertical: 50}}>
              <ActivityIndicator size="large" color="#666" />
            </View>
          ) : courses.length === 0 ? (
            <View style={{justifyContent: 'center', alignItems: 'center', paddingVertical: 50}}>
              <Text style={{fontSize: 16, color: '#666'}}>No classes available</Text>
              <TouchableOpacity 
                style={styles.joinClassButton}
                onPress={() => {
                  Alert.alert(
                    "Join Class", 
                    "In a complete app, this would open a join class form or QR scanner",
                    [{ text: "OK" }]
                  );
                }}
              >
                <Text style={styles.joinClassButtonText}>Join a Class</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{padding: 16}}>
              {courses.map(course => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseItem}
                  onPress={() => handleCoursePress(course)}
                >
                  <View style={styles.courseContent}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseTime}>{course.time}</Text>
                    <Text style={styles.courseLocation}>{course.location} • Room {course.classroom}</Text>
                    {course.attendanceMarked && (
                      <View style={styles.attendanceTag}>
                        <Text style={styles.attendanceTagText}>
                          Present {course.attendanceTime && `(${course.attendanceTime})`}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home-outline" size={24} color="#666" />
            <Text style={styles.navText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={handleScanQR}>
            <Ionicons name="qr-code-outline" size={24} color="#666" />
            <Text style={styles.navText}>QR Scanner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="document-text-outline" size={24} color="#666" />
            <Text style={styles.navText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="grid-outline" size={24} color="#666" />
            <Text style={styles.navText}>Classes</Text>
          </TouchableOpacity>
        </View>

        {/* Scanner Modal */}
        {renderScannerModal()}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  coursesList: {
    marginBottom: 20,
  },
  courseListContainer: {
    padding: 16,
  },
  courseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  courseContent: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  courseTime: {
    fontSize: 14,
    color: '#666',
  },
  courseLocation: {
    fontSize: 14,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerLoading: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  scannerText: {
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  scannerButton: {
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  scannerButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  scannerContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  scannerHeader: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: '#eee',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameContainer: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  scanFrame: {
    width: '100%', 
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  processingText: {
    color: '#fff',
    marginTop: 16,
  },
  attendanceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCourseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalClassCodeContainer: {
    marginBottom: 20,
  },
  modalClassCodeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  modalClassCode: {
    fontSize: 16,
    color: '#333',
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#666',
  },
  modalAttendanceSection: {
    marginBottom: 20,
  },
  modalAttendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalAttendanceTextContainer: {
    marginLeft: 8,
  },
  modalAttendanceStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalAttendanceTimeText: {
    fontSize: 12,
    color: '#666',
  },
  leaveButton: {
    backgroundColor: '#f56565',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 30,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItemsContainer: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  dismissArea: {
    flex: 1,
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
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  joinClassButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  joinClassButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudentScreen; 