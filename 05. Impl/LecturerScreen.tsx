import React, { useState, useEffect, useContext } from 'react';
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
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';

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
  name: string;
  time: string;
  location: string;
  classroom: string;
  description: string;
  classCode: string;
  students: number;
  attendance: number;
  lastClass?: string;
  nextClass?: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  studentList?: StudentItem[];
}

type TabType = 'dashboard' | 'student' | 'reports' | 'classes';

const LecturerScreen: React.FC<LecturerScreenProps> = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const lecturerName = user ? `${user.fname} ${user.lname}` : '';
  
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
    
    // Simulate loading courses with mock student data
    setTimeout(() => {
      // Add mock courses with student data
      const mockCourses: CourseItem[] = [
        {
          id: '1',
          name: 'Computer Science 101',
          time: '9:00 AM - 10:30 AM',
          location: 'Building A',
          classroom: '101',
          description: 'Introduction to Computer Science',
          classCode: 'CS101',
          students: 25,
          attendance: 20,
          status: 'ongoing',
          studentList: generateMockStudents(25, 20)
        },
        {
          id: '2',
          name: 'Data Structures',
          time: '11:00 AM - 12:30 PM',
          location: 'Building B',
          classroom: '202',
          description: 'Advanced data structures and algorithms',
          classCode: 'DS202',
          students: 18,
          attendance: 15,
          status: 'upcoming',
          studentList: generateMockStudents(18, 15)
        },
        {
          id: '3',
          name: 'Web Development',
          time: '2:00 PM - 3:30 PM',
          location: 'Building C',
          classroom: '303',
          description: 'HTML, CSS, JavaScript and React',
          classCode: 'WD303',
          students: 30,
          attendance: 25,
          status: 'completed',
          studentList: generateMockStudents(30, 25)
        }
      ];
      
      setCourses(mockCourses);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Function to generate mock student data
  const generateMockStudents = (total: number, present: number): StudentItem[] => {
    const students: StudentItem[] = [];
    const firstNames = ['John', 'Emma', 'Michael', 'Olivia', 'William', 'Sophia', 'James', 'Ava', 'Alexander', 'Isabella', 'Kyle'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Alonzo'];
    
    // Generate dates for the last 5 class sessions
    const classDates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7)); // Weekly classes
      classDates.push(date.toISOString().split('T')[0]);
    }
    classDates.reverse(); // Oldest to newest
    
    for (let i = 0; i < total; i++) {
      const firstName = i === 0 ? 'Kyle' : firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = i === 0 ? 'Alonzo' : lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const studentId = `STU${100000 + i}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`;
      
      // Generate random attendance record for past dates
      const attendanceRecord: Record<string, boolean> = {};
      classDates.forEach(date => {
        // Higher chance of being present (80%) for more consistent data
        attendanceRecord[date] = Math.random() < 0.8;
      });
      
      students.push({
        id: `student-${i + 1}`,
        name,
        studentId,
        email,
        present: i < present,
        lastAttendance: i < present ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        attendanceRecord
      });
    }
    
    return students;
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
                <Text style={styles.statCount}>
                  {courses.reduce((sum, course) => sum + course.students, 0)}
                </Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statCount}>
                  {courses.filter(c => c.status === 'ongoing').length}
                </Text>
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
                  Classes will appear here once assigned
                </Text>
              </View>
            ) : (
              <View style={styles.coursesList}>
                {courses.map((course) => (
                  <View key={course.id} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={styles.courseNameContainer}>
                        <Text style={styles.courseName}>{course.name}</Text>
                        <Text style={styles.courseCodeText}>{course.classCode}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(course.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>
                          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.courseInfo}>
                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{course.time}</Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{course.location}, Room {course.classroom}</Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>
                          {course.attendance}/{course.students} Students Present
                        </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LECTURER</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
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
                  <Text style={styles.qrCodeSubtitle}>{selectedCourse.name}</Text>
                  <View style={styles.qrCodeClassCode}>
                    <Text style={styles.qrCodeClassCodeText}>{selectedCourse.classCode}</Text>
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.qrCodeBox}>
              {/* Simplified QR code visual */}
              <View style={styles.qrCode}>
                {/* Static QR code sample */}
                <Image 
                  source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=example' }} 
                  style={styles.qrImage}
                />
              </View>
            </View>
            
            {selectedCourse && (
              <View style={styles.qrCodeStats}>
                <View style={styles.qrCodeStat}>
                  <Text style={styles.qrCodeStatValue}>{selectedCourse.attendance}</Text>
                  <Text style={styles.qrCodeStatLabel}>Present</Text>
                </View>
                
                <View style={styles.qrCodeStat}>
                  <Text style={styles.qrCodeStatValue}>{selectedCourse.students - selectedCourse.attendance}</Text>
                  <Text style={styles.qrCodeStatLabel}>Absent</Text>
                </View>
                
                <View style={styles.qrCodeStat}>
                  <Text style={styles.qrCodeStatValue}>
                    {Math.round((selectedCourse.attendance / selectedCourse.students) * 100)}%
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
    justifyContent: 'space-between',
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
  qrImage: {
    width: 200,
    height: 200,
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
});

export default LecturerScreen; 