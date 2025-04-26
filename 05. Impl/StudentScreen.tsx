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
    
    // Simulate loading courses
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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
      <View style={styles.courseHeader}>
        <View style={styles.courseIconAndName}>
          <View style={[styles.courseIcon, { backgroundColor: getRandomColor(item.name) }]}>
            <Text style={styles.courseIconText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.courseNameContainer}>
            <Text style={styles.courseName}>{item.name}</Text>
            <View style={styles.classCodeContainer}>
              <Text style={styles.classCodeLabel}>Class Code:</Text>
              <Text style={styles.classCodeText}>{item.classCode}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.courseInfoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="time-outline" size={18} style={styles.infoIcon} />
          </View>
          <Text style={styles.infoText}>{item.time}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="location-outline" size={18} style={styles.infoIcon} />
          </View>
          <Text style={styles.infoText}>{item.location} • Room {item.classroom}</Text>
        </View>
      </View>
      
      <View style={styles.attendanceSection}>
        {item.attendanceMarked ? (
          <>
            <View style={styles.attendanceStatusContainer}>
              <View style={styles.attendanceMarkedIndicator} />
              <Text style={styles.attendanceStatusText}>Present</Text>
            </View>
            {item.attendanceTime && (
              <Text style={styles.attendanceTime}>
                Marked at {item.attendanceTime}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.attendanceStatusContainer}>
            <View style={[styles.attendanceMarkedIndicator, styles.notMarkedIndicator]} />
            <Text style={[styles.attendanceStatusText, styles.notMarkedText]}>
              Not Marked
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
      // Simulate API call to fetch updated data
      const mockData: CourseItem[] = [
        {
          id: '1',
          name: 'Mathematics 101',
          time: '9:00 AM - 10:30 AM',
          location: 'Building A',
          classroom: '101',
          attendanceMarked: false,
          description: 'Introduction to Calculus',
          classCode: 'MATH101'
        },
        {
          id: '2',
          name: 'Physics 101',
          time: '11:00 AM - 12:30 PM',
          location: 'Building B',
          classroom: '202',
          attendanceMarked: false,
          description: 'Basic Physics',
          classCode: 'PHYS101'
        }
      ];

      const response: ApiResponse = await new Promise<ApiResponse>((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            data: {
              courses: mockData
            }
          });
        }, 1000);
      });

      if (response.ok) {
        setCourses(response.data.courses);
      } else {
        Alert.alert('Error', 'Failed to refresh data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
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
      <TouchableWithoutFeedback onPress={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {selectedCourse && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalCourseIcon, { backgroundColor: getRandomColor(selectedCourse.name) }]}>
                      <Text style={styles.modalCourseIconText}>{selectedCourse.name.charAt(0)}</Text>
                    </View>
                    <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.modalCourseName}>{selectedCourse.name}</Text>
                  
                  <View style={styles.modalClassCodeContainer}>
                    <Text style={styles.modalClassCodeLabel}>Class Code</Text>
                    <Text style={styles.modalClassCode}>{selectedCourse.classCode}</Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalSectionTitle}>Course Details</Text>
                    
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="time-outline" size={20} color="#555" />
                      <Text style={styles.modalInfoText}>{selectedCourse.time}</Text>
                    </View>
                    
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="location-outline" size={20} color="#555" />
                      <Text style={styles.modalInfoText}>
                        {selectedCourse.location} • Room {selectedCourse.classroom}
                      </Text>
                    </View>
                    
                    {selectedCourse.description && (
                      <View style={styles.modalInfoRow}>
                        <Ionicons name="information-circle-outline" size={20} color="#555" />
                        <Text style={styles.modalInfoText}>{selectedCourse.description}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.modalAttendanceSection}>
                    <Text style={styles.modalSectionTitle}>Attendance Status</Text>
                    
                    <View style={[
                      styles.modalAttendanceStatus,
                      selectedCourse.attendanceMarked 
                        ? styles.modalAttendanceMarked 
                        : styles.modalAttendanceNotMarked
                    ]}>
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
                    
                    {!selectedCourse.attendanceMarked && (
                      <>
                        <Text style={styles.qrCodeSectionText}>
                          Generate a QR code for your lecturer to scan and mark you present:
                        </Text>
                        <View style={styles.qrCodeSection}>
                          <View style={styles.studentQRCode}>
                            {/* In a real app, use a proper QR code generator component */}
                            <Text style={styles.studentQRText}>QR CODE</Text>
                            <Text style={styles.studentQRData}>
                              {generateStudentQRCode(selectedCourse.id)}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{studentName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="white" />
            <Text style={styles.statNumber}>{courses.length}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="stats-chart-outline" size={24} color="white" />
            <Text style={styles.statNumber}>
              {courses.length > 0 
                ? Math.round((courses.filter(c => c.attendanceMarked).length / courses.length) * 100)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="white" />
            <Text style={styles.statNumber}>
              {courses.filter(c => {
                const [startTime] = c.time.split(' - ');
                const courseDate = new Date();
                const [hours, minutes] = startTime.split(':');
                courseDate.setHours(parseInt(hours), parseInt(minutes));
                return courseDate > new Date();
              }).length}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <View style={styles.titleContainer}>
            <Ionicons name="calendar-outline" size={24} color="#1a4b8e" />
            <Text style={styles.contentTitle}>Today's Classes</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#1a4b8e" />
          </View>
        ) : courses.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.centerContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1a4b8e"
                colors={["#1a4b8e"]}
                progressBackgroundColor="#ffffff"
              />
            }
          >
            <Ionicons name="school-outline" size={80} color="#e1e5e9" />
            <Text style={styles.noClassesText}>No Classes Yet</Text>
            <Text style={styles.noClassesSubtext}>
              Join your first class to get started
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.coursesList}
            renderItem={renderCourseItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1a4b8e"
                colors={["#1a4b8e"]}
                progressBackgroundColor="#ffffff"
              />
            }
          />
        )}
      </View>

      {/* Join Button */}
      <TouchableOpacity 
        style={styles.joinButton}
        onPress={() => setJoinModalVisible(true)}
      >
        <Text style={styles.plusIcon}>+</Text>
        <Text style={styles.joinButtonText}>Join Class</Text>
      </TouchableOpacity>

      {/* Join Modal */}
      <Modal
        visible={joinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setJoinModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Join a Class</Text>
                  <TouchableOpacity 
                    onPress={() => setJoinModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>Class Code<Text style={styles.requiredStar}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, styles.codeInput]}
                      value={classCode}
                      onChangeText={(text) => setClassCode(text.toUpperCase())}
                      placeholder="Enter 6-character class code"
                      placeholderTextColor="#999"
                      autoCapitalize="characters"
                      maxLength={6}
                    />
                  </View>
                  <Text style={styles.codeHint}>Enter the 6-character code provided by your lecturer</Text>
                  <TouchableOpacity
                    style={[
                      styles.modalJoinButton,
                      (!classCode.trim() || isJoining) && styles.modalJoinButtonDisabled
                    ]}
                    onPress={handleJoinClass}
                    disabled={!classCode.trim() || isJoining}
                  >
                    <Text style={styles.modalJoinButtonText}>
                      {isJoining ? 'Joining...' : 'Join Class'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {renderCourseModal()}

      {renderScannerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4b8e',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  welcomeContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  nameText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginLeft: 8,
  },
  dateContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noClassesText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  noClassesSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  coursesList: {
    padding: 20,
  },
  courseItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  courseHeader: {
    padding: 16,
  },
  courseIconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  courseNameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  classCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classCodeLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 4,
  },
  classCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a4b8e',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  courseInfoContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: {
    color: '#1a4b8e',
  },
  infoText: {
    fontSize: 14,
    color: '#4a4a4a',
    flex: 1,
  },
  attendanceSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  attendanceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceMarkedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 8,
  },
  notMarkedIndicator: {
    backgroundColor: '#ed8936',
  },
  attendanceStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#48bb78',
  },
  notMarkedText: {
    color: '#ed8936',
  },
  attendanceTime: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  joinButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#ffd700',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  plusIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginRight: 4,
  },
  joinButtonText: {
    color: '#1a4b8e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCourseIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCourseIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalClassCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalClassCodeLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 6,
  },
  modalClassCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a4b8e',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 16,
  },
  modalBody: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  modalInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  attendanceMarkedCard: {
    backgroundColor: '#f0fff4',
    borderColor: '#c6f6d5',
  },
  attendanceUnmarkedCard: {
    backgroundColor: '#fffaf0',
    borderColor: '#feebc8',
  },
  attendanceMarkedIcon: {
    backgroundColor: '#f0fff4',
  },
  attendanceUnmarkedIcon: {
    backgroundColor: '#fffaf0',
  },
  attendanceMarkedLabel: {
    color: '#48bb78',
  },
  attendanceUnmarkedLabel: {
    color: '#ed8936',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#e53e3e',
    marginLeft: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1a1a1a',
  },
  codeInput: {
    letterSpacing: 1,
  },
  codeHint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 24,
  },
  modalJoinButton: {
    backgroundColor: '#1a4b8e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalJoinButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  modalJoinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  scannerButton: {
    backgroundColor: '#1a4b8e',
    padding: 12,
    borderRadius: 12,
  },
  scannerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerContent: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeader: {
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginBottom: 8,
  },
  scannerSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameContainer: {
    width: '80%',
    height: '80%',
    borderWidth: 2,
    borderColor: '#1a4b8e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#1a4b8e',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  qrCodeSectionText: {
    fontSize: 14,
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  qrCodeSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  studentQRCode: {
    width: 180,
    height: 180,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  studentQRText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentQRData: {
    fontSize: 10,
    color: '#666',
    padding: 8,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  modalCourseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalInfoSection: {
    marginBottom: 24,
  },
  modalAttendanceSection: {
    marginBottom: 24,
  },
  modalAttendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAttendanceTextContainer: {
    marginLeft: 12,
  },
  modalAttendanceStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#48bb78',
  },
  modalAttendanceTimeText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  leaveButton: {
    backgroundColor: '#ffd700',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  leaveButtonText: {
    color: '#1a4b8e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalAttendanceMarked: {
    backgroundColor: '#e6f7ed',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c6e9d5',
  },
  modalAttendanceNotMarked: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
});

export default StudentScreen; 