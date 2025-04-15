import React, { useState, useEffect } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LecturerScreenProps {
  lecturerName: string;
  onLogout: () => void;
}

interface Course {
  id: string;
  name: string;
  time: string;
  location: string;
  students: number;
  attendanceRate: number;
  description: string;
}

const LecturerScreen: React.FC<LecturerScreenProps> = ({ lecturerName, onLogout }) => {
  const [courses, setCourses] = useState<Course[]>([
    { 
      id: '1', 
      name: 'Mathematics 101', 
      time: '9:00 AM - 10:30 AM', 
      location: 'Room A-204', 
      students: 45,
      attendanceRate: 92,
      description: 'Introduction to calculus and analytical geometry. Topics include functions, limits, derivatives, and applications of differentiation.'
    },
    { 
      id: '2', 
      name: 'Physics 202', 
      time: '11:00 AM - 12:30 PM', 
      location: 'Lab Building B', 
      students: 38,
      attendanceRate: 88,
      description: 'Study of electricity, magnetism, and light. Laboratory experiments and problem-solving sessions complement the lectures.'
    },
    { 
      id: '3', 
      name: 'Computer Science 303', 
      time: '2:00 PM - 3:30 PM', 
      location: 'IT Center 105', 
      students: 52,
      attendanceRate: 95,
      description: 'Advanced programming concepts including data structures, algorithms, and object-oriented programming principles.'
    },
  ]);
  
  const [currentDate, setCurrentDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createCourseModalVisible, setCreateCourseModalVisible] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    time: '',
    location: '',
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateCourse = () => {
    if (!newCourse.name || !newCourse.time || !newCourse.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    
    // Simulate API call
    setTimeout(() => {
      const course: Course = {
        id: Date.now().toString(),
        name: newCourse.name,
        time: newCourse.time,
        location: newCourse.location,
        students: 0,
        attendanceRate: 0,
        description: newCourse.description
      };
      
      setCourses([...courses, course]);
      setNewCourse({ name: '', time: '', location: '', description: '' });
      setCreateCourseModalVisible(false);
      setIsCreating(false);
      Alert.alert('Success', 'Course created successfully');
    }, 1500);
  };

  const handleCoursePress = (course: Course) => {
    setSelectedCourse(course);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCourse(null);
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9ff']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.courseHeader}>
          <View style={styles.courseTitleContainer}>
            <View style={styles.courseIconContainer}>
              <Ionicons name="book-outline" size={20} color="#1a4b8e" />
            </View>
            <Text style={styles.courseName}>{item.name}</Text>
          </View>
          <View style={[
            styles.attendanceBadge,
            { backgroundColor: item.attendanceRate >= 90 ? '#e6f7ff' : 
                             item.attendanceRate >= 80 ? '#f0fff4' : 
                             item.attendanceRate >= 70 ? '#fff7e6' : '#ffe6e6' }
          ]}>
            <Text style={[
              styles.attendanceText,
              { color: item.attendanceRate >= 90 ? '#1a4b8e' : 
                      item.attendanceRate >= 80 ? '#2e7d32' : 
                      item.attendanceRate >= 70 ? '#ed6c02' : '#d32f2f' }
            ]}>{item.attendanceRate}%</Text>
          </View>
        </View>
        
        <View style={styles.courseInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.students} Students</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1a4b8e', '#0d2b4d']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{lecturerName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.headerText}>{lecturerName}</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={18} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="book-outline" size={24} color="white" style={styles.statIcon} />
              <Text style={styles.statNumber}>{courses.length}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="stats-chart-outline" size={24} color="white" style={styles.statIcon} />
              <Text style={styles.statNumber}>
                {Math.round(courses.reduce((acc, course) => acc + course.attendanceRate, 0) / courses.length)}%
              </Text>
              <Text style={styles.statLabel}>Avg. Attendance</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={24} color="white" style={styles.statIcon} />
              <Text style={styles.statNumber}>
                {courses.reduce((acc, course) => acc + course.students, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Ionicons name="school-outline" size={24} color="#1a4b8e" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>My Courses</Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#666" style={styles.dateIcon} />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>
        
        {courses.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="book-outline" size={60} color="#cbd5e0" />
            <Text style={styles.emptyStateText}>No courses yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first course to get started</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <TouchableOpacity 
          style={styles.createCourseButton}
          onPress={() => setCreateCourseModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1a4b8e', '#0d2b4d']}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.createButtonContent}>
              <View style={styles.plusIcon}>
                <Text style={styles.plusIconText}>+</Text>
              </View>
              <Text style={styles.createCourseButtonText}>Create Course</Text>
            </View>
          </LinearGradient>
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
              <ScrollView>
                <LinearGradient
                  colors={['#1a4b8e', '#0d2b4d']}
                  style={styles.modalHeaderGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedCourse.name}</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={handleCloseModal}
                    >
                      <Ionicons name="close" size={20} color="#1a4b8e" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
                
                <View style={styles.modalBody}>
                  <View style={styles.modalInfoSection}>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Ionicons name="time-outline" size={20} color="#1a4b8e" />
                      </View>
                      <Text style={styles.modalInfoText}>{selectedCourse.time}</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Ionicons name="location-outline" size={20} color="#1a4b8e" />
                      </View>
                      <Text style={styles.modalInfoText}>{selectedCourse.location}</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Ionicons name="people-outline" size={20} color="#1a4b8e" />
                      </View>
                      <Text style={styles.modalInfoText}>{selectedCourse.students} Students</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Ionicons name="stats-chart-outline" size={20} color="#1a4b8e" />
                      </View>
                      <Text style={styles.modalInfoText}>{selectedCourse.attendanceRate}% Attendance Rate</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalDescriptionSection}>
                    <Text style={styles.modalDescriptionTitle}>Course Description</Text>
                    <Text style={styles.modalDescriptionText}>{selectedCourse.description}</Text>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalActionButton}>
                      <Ionicons name="qr-code-outline" size={20} color="white" />
                      <Text style={styles.modalActionButtonText}>Generate QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalActionButton}>
                      <Ionicons name="list-outline" size={20} color="white" />
                      <Text style={styles.modalActionButtonText}>View Attendance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalActionButton}>
                      <Ionicons name="settings-outline" size={20} color="white" />
                      <Text style={styles.modalActionButtonText}>Course Settings</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Create Course Modal */}
      <Modal
        visible={createCourseModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCreateCourseModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setCreateCourseModalVisible(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.createModalContent}>
                <LinearGradient
                  colors={['#1a4b8e', '#0d2b4d']}
                  style={styles.createModalHeaderGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.createModalHeader}>
                    <Text style={styles.createModalTitle}>Create New Course</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={() => setCreateCourseModalVisible(false)}
                    >
                      <Ionicons name="close" size={20} color="#1a4b8e" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
                
                <View style={styles.createModalBody}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Course Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newCourse.name}
                      onChangeText={(text) => setNewCourse({...newCourse, name: text})}
                      placeholder="Enter course name"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Time</Text>
                    <TextInput
                      style={styles.input}
                      value={newCourse.time}
                      onChangeText={(text) => setNewCourse({...newCourse, time: text})}
                      placeholder="e.g., 9:00 AM - 10:30 AM"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                      style={styles.input}
                      value={newCourse.location}
                      onChangeText={(text) => setNewCourse({...newCourse, location: text})}
                      placeholder="Enter room number or location"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newCourse.description}
                      onChangeText={(text) => setNewCourse({...newCourse, description: text})}
                      placeholder="Enter course description"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.createModalActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setCreateCourseModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.createButton,
                        isCreating && styles.disabledButton
                      ]}
                      onPress={handleCreateCourse}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.createButtonText}>Create Course</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
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
    backgroundColor: '#f5f8fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    marginTop: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateIcon: {
    marginRight: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  courseCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceText: {
    fontWeight: '600',
    fontSize: 12,
  },
  courseInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  createCourseButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#1a4b8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  createButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIconText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  createCourseButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalInfoSection: {
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#2d3748',
  },
  modalDescriptionSection: {
    marginBottom: 24,
  },
  modalDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4b8e',
    marginBottom: 8,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  modalActions: {
    gap: 12,
  },
  modalActionButton: {
    backgroundColor: '#1a4b8e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  createModalHeaderGradient: {
    padding: 20,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  createModalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4b8e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7f9fc',
    borderWidth: 1,
    borderColor: '#edf2f7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2d3748',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#1a4b8e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default LecturerScreen; 