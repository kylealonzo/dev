import React, { useState, useEffect, useRef } from 'react';
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
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera as ExpoCamera } from 'expo-camera';

const Camera = ExpoCamera as any;
const CameraType = { back: 'back' };

interface StudentScreenProps {
  studentName: string;
  onLogout: () => void;
}

interface CourseItem {
  id: string;
  name: string;
  time: string;
  location: string;
  attendanceMarked: boolean;
  attendanceTime?: string;
  description?: string;
}

interface NavItem {
  id: string;
  title: string;
  description: string;
  badge?: number;
}

const StudentScreen: React.FC<StudentScreenProps> = ({ studentName, onLogout }) => {
  const [courses, setCourses] = useState<CourseItem[]>([
    { 
      id: '1', 
      name: 'Mathematics 101', 
      time: '9:00 AM - 10:30 AM', 
      location: 'Room A-204', 
      attendanceMarked: false,
      description: 'Introduction to calculus and analytical geometry. Topics include functions, limits, derivatives, and applications of differentiation.'
    },
    { 
      id: '2', 
      name: 'Physics 202', 
      time: '11:00 AM - 12:30 PM', 
      location: 'Lab Building B', 
      attendanceMarked: false,
      description: 'Study of electricity, magnetism, and light. Laboratory experiments and problem-solving sessions complement the lectures.'
    },
    { 
      id: '3', 
      name: 'Computer Science 303', 
      time: '2:00 PM - 3:30 PM', 
      location: 'IT Center 105', 
      attendanceMarked: false,
      description: 'Advanced programming concepts including data structures, algorithms, and object-oriented programming principles.'
    },
    { 
      id: '4', 
      name: 'English Literature', 
      time: '4:00 PM - 5:30 PM', 
      location: 'Humanities Hall', 
      attendanceMarked: false,
      description: 'Survey of major works of English literature from the Renaissance to the present day with an emphasis on critical analysis.'
    },
  ]);
  
  const [currentDate, setCurrentDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [selectedNavItem, setSelectedNavItem] = useState<NavItem | null>(null);
  const [navModalVisible, setNavModalVisible] = useState(false);
  
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joiningClass, setJoiningClass] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);
  
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanningActive, setScanningActive] = useState(false);
  const cameraRef = useRef<any>(null);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  
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
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
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
      Alert.alert('Error', 'Please enter a valid class code');
      return;
    }
    
    setJoiningClass(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setJoiningClass(false);
      setJoinModalVisible(false);
      setClassCode('');
      Alert.alert('Success', `You've successfully joined the class with code: ${classCode}`);
    }, 1500);
  };

  const handleScanQR = () => {
    setScanningQR(true);
    setScannerModalVisible(true);
  };
  
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanningActive) return;
    
    setScanningActive(true);
    
    // Short delay to show scanning state
    setTimeout(() => {
      setScanningActive(false);
      setScanningQR(false);
      setScannerModalVisible(false);
      setClassCode(data);
      
      Alert.alert('Scan Successful', `QR code scanned successfully. Class code: ${data}`);
    }, 500);
  };
  
  const handleCancelScan = () => {
    setScanningQR(false);
    setScannerModalVisible(false);
    setScanningActive(false);
  };

  const renderCourseItem = ({ item }: { item: CourseItem }) => (
    <TouchableOpacity 
      style={styles.courseItem}
      onPress={() => handleCoursePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.courseIconContainer}>
        <View style={styles.courseIcon}>
          <Text style={styles.courseIconText}>{item.name.charAt(0)}</Text>
        </View>
      </View>
      
      <Text style={styles.courseName}>{item.name}</Text>
      
      <View style={styles.timeContainer}>
        <View style={styles.iconContainer}>
          <View style={styles.timeIcon} />
        </View>
        <Text style={styles.courseTime}>{item.time}</Text>
      </View>
      
      {item.attendanceMarked ? (
        <View style={styles.attendanceStatusContainer}>
          <View style={styles.attendanceMarkedIndicator} />
          <Text style={styles.attendanceStatusText}>Present</Text>
        </View>
      ) : (
        <Text style={styles.attendanceStatusText}>Not Marked</Text>
      )}
      
      {item.attendanceMarked && item.attendanceTime && (
        <Text style={styles.attendanceTime}>{item.attendanceTime}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.headerText}>{studentName}</Text>
          </View>
          
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Classes</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>
        
        <FlatList
          key="two-column-grid"
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      </View>
      
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity 
          style={styles.joinClassButton}
          onPress={() => setJoinModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.joinButtonContent}>
            <View style={styles.plusIcon}>
              <Text style={styles.plusIconText}>+</Text>
            </View>
            <Text style={styles.joinClassButtonText}>Join</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Course Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCourse && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.courseModalIcon}>
                    <Text style={styles.courseIconText}>{selectedCourse.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedCourse.name}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Course Information</Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Time:</Text>
                      <Text style={styles.infoValue}>{selectedCourse.time}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Location:</Text>
                      <Text style={styles.infoValue}>{selectedCourse.location}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <Text style={[
                        styles.infoValue, 
                        selectedCourse.attendanceMarked ? styles.statusPresent : styles.statusPending
                      ]}>
                        {selectedCourse.attendanceMarked ? 'Present' : 'Not Marked'}
                      </Text>
                    </View>
                    
                    {selectedCourse.attendanceMarked && selectedCourse.attendanceTime && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Marked at:</Text>
                        <Text style={styles.infoValue}>{selectedCourse.attendanceTime}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.descriptionSection}>
                    <Text style={styles.infoSectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                      {selectedCourse.description || 'No description available.'}
                    </Text>
                  </View>
                  
                  <View style={styles.navigationSection}>
                    <Text style={styles.infoSectionTitle}>Course Navigation</Text>
                    
                    <View style={styles.navLinksContainer}>
                      {navigationItems.map((navItem) => (
                        <TouchableOpacity 
                          key={navItem.id}
                          style={styles.navLink}
                          onPress={() => handleNavItemPress(navItem)}
                        >
                          {navItem.badge ? (
                            <View style={styles.navLinkContent}>
                              <Text style={styles.navLinkText}>{navItem.title}</Text>
                              <View style={styles.navBadge}>
                                <Text style={styles.navBadgeText}>{navItem.badge}</Text>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.navLinkText}>{navItem.title}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
                
                {!selectedCourse.attendanceMarked && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={styles.markAttendanceButton}
                      onPress={() => {
                        markAttendance(selectedCourse.id);
                        handleCloseModal();
                      }}
                    >
                      <Text style={styles.markAttendanceButtonText}>Mark Attendance</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Nav Item Detail Modal */}
      <Modal
        visible={navModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNavModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNavItem && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedNavItem.title}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={handleCloseNavModal}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.navDescriptionSection}>
                    <Text style={styles.descriptionText}>
                      {selectedNavItem.description}
                    </Text>
                  </View>
                  
                  {selectedNavItem.id === 'announcements' && (
                    <View style={styles.navContentSection}>
                      <Text style={styles.infoSectionTitle}>Recent Announcements</Text>
                      <View style={styles.announcementItem}>
                        <Text style={styles.announcementTitle}>Midterm Exam Date Change</Text>
                        <Text style={styles.announcementDate}>Posted: May 10, 2024</Text>
                        <Text style={styles.announcementContent}>
                          The midterm exam has been rescheduled to next Thursday, May 18. Please review chapters 5-8 in preparation.
                        </Text>
                      </View>
                      <View style={styles.announcementItem}>
                        <Text style={styles.announcementTitle}>Guest Lecturer Next Week</Text>
                        <Text style={styles.announcementDate}>Posted: May 8, 2024</Text>
                        <Text style={styles.announcementContent}>
                          We will have Dr. Johnson as a guest lecturer next Monday to discuss recent developments in the field.
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {selectedNavItem.id === 'assignments' && (
                    <View style={styles.navContentSection}>
                      <Text style={styles.infoSectionTitle}>Upcoming Assignments</Text>
                      <View style={styles.assignmentItem}>
                        <View style={styles.assignmentHeader}>
                          <Text style={styles.assignmentTitle}>Research Paper</Text>
                          <Text style={styles.assignmentDue}>Due: May 20, 2024</Text>
                        </View>
                        <Text style={styles.assignmentPoints}>100 points</Text>
                        <Text style={styles.assignmentContent}>
                          Submit a 10-page research paper on a topic of your choice related to the course material.
                        </Text>
                      </View>
                      <View style={styles.assignmentItem}>
                        <View style={styles.assignmentHeader}>
                          <Text style={styles.assignmentTitle}>Problem Set 4</Text>
                          <Text style={styles.assignmentDue}>Due: May 15, 2024</Text>
                        </View>
                        <Text style={styles.assignmentPoints}>50 points</Text>
                        <Text style={styles.assignmentContent}>
                          Complete problems 1-20 in Chapter 7 of the textbook.
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {selectedNavItem.id === 'grades' && (
                    <View style={styles.navContentSection}>
                      <Text style={styles.infoSectionTitle}>Recent Grades</Text>
                      <View style={styles.gradeItem}>
                        <View style={styles.gradeHeader}>
                          <Text style={styles.gradeTitle}>Quiz 3</Text>
                          <Text style={styles.gradeScore}>18/20</Text>
                        </View>
                        <View style={styles.gradeFeedback}>
                          <Text style={styles.gradeFeedbackLabel}>Feedback:</Text>
                          <Text style={styles.gradeFeedbackContent}>
                            Great work! Just a minor error on question 5.
                          </Text>
                        </View>
                      </View>
                      <View style={styles.gradeItem}>
                        <View style={styles.gradeHeader}>
                          <Text style={styles.gradeTitle}>Assignment 2</Text>
                          <Text style={styles.gradeScore}>48/50</Text>
                        </View>
                        <View style={styles.gradeFeedback}>
                          <Text style={styles.gradeFeedbackLabel}>Feedback:</Text>
                          <Text style={styles.gradeFeedbackContent}>
                            Excellent analysis. Your conclusion could be a bit more developed.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Join Class Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setJoinModalVisible(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.joinModalContent}>
                <View style={styles.joinModalHeader}>
                  <Text style={styles.joinModalTitle}>Join a Class</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setJoinModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.joinModalBody}>
                  <Text style={styles.joinModalText}>
                    Enter the class code provided by your instructor to join a new class.
                  </Text>
                  
                  <View style={styles.codeInputContainer}>
                    <Text style={styles.codeInputLabel}>Class Code</Text>
                    <TextInput
                      style={styles.codeInput}
                      placeholder="Enter class code (e.g., ABC123)"
                      placeholderTextColor="#999"
                      value={classCode}
                      onChangeText={setClassCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.scanButton} 
                    onPress={handleScanQR}
                    disabled={scanningQR}
                  >
                    <View style={styles.scanButtonContent}>
                      <View style={styles.scanIcon}>
                        <View style={styles.scanIconBox}></View>
                      </View>
                      <Text style={styles.scanButtonText}>
                        {scanningQR ? 'Scanning...' : 'Scan QR Code'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.joinModalButtonContainer}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setJoinModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.confirmJoinButton,
                        (!classCode.trim() || joiningClass) && styles.disabledButton
                      ]}
                      onPress={handleJoinClass}
                      disabled={!classCode.trim() || joiningClass}
                    >
                      <Text style={styles.confirmJoinButtonText}>
                        {joiningClass ? 'Joining...' : 'Join Class'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* QR Scanner Modal */}
      <Modal
        visible={scannerModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCancelScan}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleCancelScan}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cameraContainer}>
            {hasPermission === null ? (
              <View style={styles.cameraPermissionContainer}>
                <Text style={styles.cameraPermissionText}>Requesting camera permission...</Text>
                <ActivityIndicator size="large" color="#f9d423" />
              </View>
            ) : hasPermission === false ? (
              <View style={styles.cameraPermissionContainer}>
                <Text style={styles.cameraPermissionText}>No access to camera</Text>
                <TouchableOpacity 
                  style={styles.cameraPermissionButton}
                  onPress={() => setHasPermission(true)}
                >
                  <Text style={styles.cameraPermissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.camera}>
                <View style={styles.cameraPreview}>
                  {scanningActive && (
                    <View style={styles.scanningIndicator}>
                      <ActivityIndicator size="large" color="#f9d423" />
                      <Text style={styles.scanningText}>Scanning...</Text>
                    </View>
                  )}
                  <View style={styles.scannerOverlay}>
                    <View style={styles.scannerTargetOuter}>
                      <View style={styles.scannerTargetInner}>
                        <View style={styles.scannerTargetCorner1}></View>
                        <View style={styles.scannerTargetCorner2}></View>
                        <View style={styles.scannerTargetCorner3}></View>
                        <View style={styles.scannerTargetCorner4}></View>
                      </View>
                    </View>
                    <Animated.View 
                      style={[
                        styles.scannerLine,
                        {
                          transform: [{
                            translateY: scanLineAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-100, 100]
                            })
                          }]
                        }
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
            
            <Text style={styles.scannerInstruction}>
              Position the QR code inside the square
            </Text>
            
            <View style={styles.scannerButtonContainer}>
              <TouchableOpacity 
                style={styles.scannerCancel}
                onPress={handleCancelScan}
              >
                <Text style={styles.scannerCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              {hasPermission && !scanningActive && (
                <TouchableOpacity 
                  style={styles.scannerTest}
                  onPress={async () => {
                    try {
                      if (cameraRef.current) {
                        setScanningActive(true);
                        // Simulate camera interaction
                        setTimeout(() => {
                          // Simulate successful scan
                          handleBarCodeScanned({ type: 'qr', data: 'TEST101' });
                        }, 1000);
                      }
                    } catch (error) {
                      console.log("Camera error:", error);
                      Alert.alert("Camera Error", "There was an error accessing the camera. Please try again.");
                      setScanningActive(false);
                    }
                  }}
                >
                  <Text style={styles.scannerTestText}>Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4b8e',
  },
  header: {
    backgroundColor: '#1a4b8e',
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.7,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    width: '30%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#1a4b8e',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f9d423',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(249,212,35,0.7)',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseItem: {
    backgroundColor: '#214c7a',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  courseIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  timeIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  courseTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  attendanceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  attendanceMarkedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 6,
  },
  attendanceStatusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  attendanceTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    backgroundColor: '#1a4b8e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  courseModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  navigationSection: {
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusPresent: {
    color: '#48bb78',
    fontWeight: '600',
  },
  statusPending: {
    color: '#ed8936',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  navLinksContainer: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    overflow: 'hidden',
  },
  navLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  navLinkContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLinkText: {
    fontSize: 15,
    color: '#1a4b8e',
  },
  navBadge: {
    backgroundColor: '#1a4b8e',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  markAttendanceButton: {
    backgroundColor: '#1a4b8e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  markAttendanceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navDescriptionSection: {
    backgroundColor: '#f5f8fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  navContentSection: {
    marginBottom: 20,
  },
  announcementItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginBottom: 4,
  },
  announcementDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  assignmentItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  assignmentDue: {
    fontSize: 13,
    color: '#e53e3e',
    fontWeight: '500',
  },
  assignmentPoints: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  assignmentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  gradeItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  gradeScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48bb78',
  },
  gradeFeedback: {
    backgroundColor: '#f5f8fa',
    padding: 12,
    borderRadius: 6,
  },
  gradeFeedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  gradeFeedbackContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  joinClassButton: {
    backgroundColor: '#f9d423',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  joinButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    marginBottom: 4,
  },
  plusIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4b8e',
    lineHeight: 28,
  },
  joinClassButtonText: {
    color: '#1a4b8e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Join Modal Styles
  joinModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  joinModalHeader: {
    backgroundColor: '#1a4b8e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  joinModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinModalBody: {
    padding: 24,
  },
  joinModalText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  codeInputContainer: {
    marginBottom: 20,
  },
  codeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#f5f8fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  joinModalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmJoinButton: {
    backgroundColor: '#1a4b8e',
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9EB3CB',
  },
  confirmJoinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#f5f8fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIconBox: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#1a4b8e',
    borderRadius: 2,
  },
  scanButtonText: {
    color: '#1a4b8e',
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Scanner Modal Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    backgroundColor: '#1a4b8e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50, // Account for status bar
  },
  scannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  camera: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTargetOuter: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTargetInner: {
    width: '100%',
    height: '100%',
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    position: 'relative',
  },
  scannerTargetCorner1: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#f9d423',
  },
  scannerTargetCorner2: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#f9d423',
  },
  scannerTargetCorner3: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#f9d423',
  },
  scannerTargetCorner4: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#f9d423',
  },
  scannerLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: '#f9d423',
    opacity: 0.7,
  },
  scannerInstruction: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
  },
  scannerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 30,
  },
  scannerCancel: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  scannerCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scannerTest: {
    backgroundColor: '#f9d423',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  scannerTestText: {
    color: '#1a4b8e',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Scanner Modal Styles
  cameraPermissionContainer: {
    width: '100%',
    height: '70%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPermissionText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  cameraPermissionButton: {
    backgroundColor: '#f9d423',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cameraPermissionButtonText: {
    color: '#1a4b8e',
    fontSize: 16,
    fontWeight: '600',
  },
  scanningIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanningText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  },
});

export default StudentScreen; 