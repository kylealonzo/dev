import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  FlatList,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App';

// Types for our data
interface Student {
  id: string;
  id_student: string; // This matches the PK in the DB schema
  fname: string;
  lname: string;
  username: string;
  password?: string;
  email: string;
  contactnumber: string;
  studentID: string; // Added as per the database schema
}

interface Lecturer {
  id: string;
  id_lecturer: string; // Primary key in DB schema
  fname: string;
  lname: string;
  username: string;
  password?: string;
  email: string;
  contactnumber: string;
  department: string;
  courses: string[];
  status: 'active' | 'on leave' | 'inactive';
}

interface Class {
  id: string;
  id_classes?: string; // Primary key from database
  classname: string;
  classcode: string;
  capacity: string;
}

// Settings interfaces
interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  language: 'English' | 'Spanish' | 'French';
  autoLogout: number; // minutes
  dataSync: boolean;
  dataBackup: boolean;
  twoFactorAuth: boolean;
}

interface SystemInfo {
  version: string;
  buildNumber: string;
  deviceModel: string;
  operatingSystem: string;
  freeStorage: string;
  lastUpdate: string;
}

// Menu interfaces
interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: TabType;
}

// Updated mock student data with the new structure
const mockStudents: Student[] = [];

// Mock lecturer data
const mockLecturers: Lecturer[] = [];

// Mock classes data
const mockClasses: Class[] = [
  {
    id: '1',
    classname: 'Introduction to Computer Science',
    classcode: 'CS101',
    capacity: '40'
  },
  {
    id: '2',
    classname: 'Data Structures and Algorithms',
    classcode: 'CS201',
    capacity: '30'
  },
  {
    id: '3',
    classname: 'Database Systems',
    classcode: 'CS301',
    capacity: '35'
  },
  {
    id: '4',
    classname: 'Web Development',
    classcode: 'CS401',
    capacity: '25'
  },
  {
    id: '5',
    classname: 'Artificial Intelligence',
    classcode: 'CS501',
    capacity: '30'
  }
];

// Mock settings data
const mockSettings: AppSettings = {
  notifications: true,
  darkMode: false,
  language: 'English',
  autoLogout: 30,
  dataSync: true,
  dataBackup: false,
  twoFactorAuth: false
};

// Mock system info
const mockSystemInfo: SystemInfo = {
  version: '1.0.5',
  buildNumber: '105',
  deviceModel: 'Web Browser',
  operatingSystem: 'Cross-platform',
  freeStorage: '2.4 GB',
  lastUpdate: '2023-05-15'
};

// Mock menu items
const menuItems: MenuItem[] = [
  { id: '1', title: 'Dashboard', icon: 'home', route: 'dashboard' },
  { id: '2', title: 'Student Management', icon: 'school', route: 'student' },
  { id: '3', title: 'Lecturer Management', icon: 'person', route: 'lecturer' },
  { id: '4', title: 'Class Management', icon: 'grid', route: 'classes' },
  { id: '5', title: 'Notifications', icon: 'notifications', },
  { id: '6', title: 'Reports & Analytics', icon: 'analytics', },
  { id: '7', title: 'Settings', icon: 'settings', route: 'setting' },
  { id: '8', title: 'Help & Support', icon: 'help-circle', },
];

type TabType = 'dashboard' | 'student' | 'lecturer' | 'classes' | 'setting';

// Add these interfaces for API responses and requests
interface ApiUser {
  id: number;
  fname: string;
  lname: string;
  email: string | null;
  user_name: string;
  contact_n: string | null;
  role: string;
  course?: string;
  studentID?: string;
  department?: string;
  courses?: string[] | string;
  status?: string;
}

interface ApiResponse<T> {
  message: string;
  user?: ApiUser;
  data?: T;
  error?: string;
}

// Student form initial state (don't include id or id_student as they're auto-generated)
const initialStudentForm = {
    fname: '',
    lname: '',
    username: '',
    password: '',
    email: '',
    contactnumber: '',
    studentID: ''
};

// After initialStudentForm, add lecturerForm initial state
const initialLecturerForm = {
  fname: '',
  lname: '',
  username: '',
    password: '',
  email: '',
  contactnumber: '',
  department: '',
  courses: [''],
  status: 'active' as Lecturer['status']
};

// Add a new initialClassForm for class creation
const initialClassForm = {
  classname: '',
  classcode: '',
  capacity: '30'
};

// Update API_URL to work with React Native
// React Native can't connect to 'localhost' as it runs in a different context
// Use your computer's IP address instead
const API_URL = 'http://192.168.68.132:3001'; // CHANGE THIS to your actual computer's IP address

// Add a function to test the API connection
const testApiConnection = async () => {
  try {
    console.log(`Testing connection to: ${API_URL}/test`);
    const response = await fetch(`${API_URL}/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API connection successful:', data);
    return true;
  } catch (error: any) {
    console.error('API connection failed:', error);
    Alert.alert(
      'Connection Error',
      `Could not connect to the server. Please check:\n\n` +
      `1. Your server is running\n` +
      `2. API_URL (${API_URL}) is correct\n` +
      `3. Your device and server are on the same network\n\n` +
      `Error: ${error.message}`
    );
    return false;
  }
};

const AdminScreen = () => {
  const { handleLogout, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(mockSettings);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Student management state
  const [students, setStudents] = useState<Student[]>([]);
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  // Add extra state variables for editing
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  
  // Lecturer management state
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [addLecturerModalVisible, setAddLecturerModalVisible] = useState(false);
  const [lecturerForm, setLecturerForm] = useState(initialLecturerForm);
  const [deleteLecturerId, setDeleteLecturerId] = useState<string | null>(null);
  const [isLecturerDeleteConfirmVisible, setIsLecturerDeleteConfirmVisible] = useState(false);
  const [isLecturerEditMode, setIsLecturerEditMode] = useState(false);
  const [editLecturerId, setEditLecturerId] = useState<string | null>(null);
  const [selectedLecturerStatus, setSelectedLecturerStatus] = useState<Lecturer['status']>('active');
  const [lecturerFilter, setLecturerFilter] = useState('all');
  
  // Class management state
  const [classes, setClasses] = useState<Class[]>([]);
  const [classFilter, setClassFilter] = useState('all');
  const [classSearchQuery, setClassSearchQuery] = useState('');
  
  // Add new state variables for class management
  const [addClassModalVisible, setAddClassModalVisible] = useState(false);
  const [classForm, setClassForm] = useState(initialClassForm);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [isClassDeleteConfirmVisible, setIsClassDeleteConfirmVisible] = useState(false);
  const [isClassEditMode, setIsClassEditMode] = useState(false);
  const [editClassId, setEditClassId] = useState<string | null>(null);
  
  // Menu slide animation
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const windowWidth = Dimensions.get('window').width;
  
  // Toggle menu visibility
  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.route) {
      setActiveTab(item.route);
    }
    toggleMenu();
  };

  // Initialize data when component mounts
  const initializeData = async () => {
    try {
      await testApiConnection();
      await fetchStudents();
      await fetchLecturers();
      await fetchClasses();
    } catch (error) {
      console.error('Failed to initialize data:', error);
      setErrorMessage('Failed to connect to the server. Please check your network connection and try again.');
    }
  };

  // In AdminScreen component, add connection testing on mount
  useEffect(() => {
    // Test API connection first, then fetch students if successful
    const initializeData = async () => {
      const isConnected = await testApiConnection();
      if (isConnected) {
        fetchStudents();
        fetchLecturers();
        fetchClasses();
      }
    };
    
    initializeData();
  }, []);

  // Update fetchStudents with better error handling
  const fetchStudents = async () => {
    try {
    setIsLoading(true);
      setErrorMessage(null);
      
      console.log(`Fetching students from: ${API_URL}/users?role=student`);
      
      // Add timeout to the fetch request
      const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const { signal } = controller;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new Error('Request timeout - server took too long to respond'));
          }, timeout);
        });
        
        return Promise.race([
          fetch(url, { ...options, signal }) as Promise<Response>,
          timeoutPromise
        ]);
      };
      
      // Fetch students from the API with timeout
      const response = await fetchWithTimeout(`${API_URL}/users?role=student`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched students data successfully:', data);
      
      // Map API data to our Student interface
      const fetchedStudents = Array.isArray(data) 
        ? data
          .filter((user: ApiUser) => user.role === 'student')
          .map((user: ApiUser) => ({
            id: user.id.toString(), // This is the auto-generated id_student from the database
            id_student: user.id.toString(), // Same as id, both representing the auto-generated PK
            fname: user.fname,
            lname: user.lname,
            email: user.email || '',
            username: user.user_name,
            contactnumber: user.contact_n || '',
            studentID: user.studentID || ''
          }))
        : [];
      
      setStudents(fetchedStudents);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to load students: ${error.message}`);
    }
  };
  
  // Update saveStudentToDatabase with better error handling
  const saveStudentToDatabase = async (student: {
    fname: string;
    lname: string;
    username: string;
    password: string;
    email: string;
    contactnumber: string;
    studentID: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map our form fields to what the server expects
      // Using the exact field names that match your API
      const userData = {
        fname: student.fname,
        lname: student.lname,
        email: student.email,
        user_name: student.username, // Use user_name as server expects
        password: student.password,
        contact_n: student.contactnumber, // Use contact_n as server expects
        studentID: student.studentID, // Include studentID field
        role: 'student'
      };
      
      console.log(`Sending student data to: ${API_URL}/users`);
      console.log('Student data:', userData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to create a new user
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || `Server returned ${response.status} ${response.statusText}`);
      }
      
      setIsLoading(false);
      
      Alert.alert(
        'Success',
        `Student ${student.fname} ${student.lname} has been added to the database.`,
        [{ text: 'OK' }]
      );
      
      return {
        success: true,
        data: result.user
      };
    } catch (error: any) {
      console.error('Error saving student:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to save student: ${error.message}`);
      
      Alert.alert(
        'Error',
        `Failed to save student: ${error.message}. Please check your connection and try again.`
      );
      
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Fix the deleteStudentFromDatabase function with proper typing
  const deleteStudentFromDatabase = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Call the API to delete the user
      const response = await fetch(`${API_URL}/users/${id}?role=student`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete student');
      }
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting student:', error);
      setIsLoading(false);
      setErrorMessage('Failed to delete student from database');
      Alert.alert('Error', error.message || 'Failed to delete student from database');
      return false;
    }
  };
  
  // Add updateStudentInDatabase function
  const updateStudentInDatabase = async (id: string, studentData: {
    fname: string;
    lname: string;
    username: string;
    password?: string;
    email: string;
    contactnumber: string;
    studentID: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map our form fields to what the server expects
      const userData = {
        id: id,
        fname: studentData.fname,
        lname: studentData.lname,
        email: studentData.email,
        user_name: studentData.username,
        ...(studentData.password && { password: studentData.password }),
        contact_n: studentData.contactnumber,
        studentID: studentData.studentID,
          role: 'student'
      };
      
      console.log(`Sending update student data to: ${API_URL}/users/${id}`);
      console.log('Update data:', userData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to update the user
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || `Server returned ${response.status} ${response.statusText}`);
      }
      
      setIsLoading(false);
      
      Alert.alert(
        'Success',
        `Student ${studentData.fname} ${studentData.lname} has been updated.`,
        [{ text: 'OK' }]
      );
      
      return {
        success: true,
        data: result.user
      };
    } catch (error: any) {
      console.error('Error updating student:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to update student: ${error.message}`);
      
      Alert.alert(
        'Error',
        `Failed to update student: ${error.message}. Please check your connection and try again.`
      );
      
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  const handleAddStudent = async () => {
    // Validate form
    if (!studentForm.fname.trim() || !studentForm.lname.trim() || !studentForm.username.trim()) {
      Alert.alert('Error', 'First name, last name and username are required');
      return;
    }
    
    if (!studentForm.email.trim() || !validateEmail(studentForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!studentForm.password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    
    if (!studentForm.contactnumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }
    
    if (!studentForm.studentID.trim()) {
      Alert.alert('Error', 'Student ID is required');
      return;
    }
    
    // Create new student object matching DB schema
    const newStudent = {
      fname: studentForm.fname.trim(),
      lname: studentForm.lname.trim(),
      username: studentForm.username.trim(),
      password: studentForm.password.trim(),
      email: studentForm.email.trim().toLowerCase(),
      contactnumber: studentForm.contactnumber.trim(),
      studentID: studentForm.studentID.trim().toUpperCase()
    };
    
    console.log('Preparing to save student:', newStudent);
    
    // Save to database
    const result = await saveStudentToDatabase(newStudent);
    
    if (result.success) {
      // Map the returned data to our Student interface
      const studentWithId = {
        id: result.data.id.toString(),
        id_student: result.data.id.toString(), // Using the auto-generated ID from the server
        fname: result.data.fname,
        lname: result.data.lname,
        username: result.data.username || result.data.user_name,
        email: result.data.email || '',
        contactnumber: result.data.contactnumber || result.data.contact_n || '',
        studentID: result.data.studentID || ''
      };
      
      // Add to students array
      setStudents([...students, studentWithId]);
      
      // Reset form and close modal
      setStudentForm(initialStudentForm);
      setAddStudentModalVisible(false);
      
      // Refresh the student list to make sure we're in sync with the server
      fetchStudents();
    }
  };
  
  // Update the handleDeleteStudent function with proper typing
  const handleDeleteStudent = (id: string) => {
    setDeleteStudentId(id);
    setIsDeleteConfirmVisible(true);
  };
  
  const confirmDeleteStudent = async () => {
    if (deleteStudentId) {
      const success = await deleteStudentFromDatabase(deleteStudentId);
      
      if (success) {
        // Remove from local state
        setStudents(students.filter(student => student.id !== deleteStudentId));
        setDeleteStudentId(null);
        setIsDeleteConfirmVisible(false);
        
        // Refresh the student list
        fetchStudents();
      }
    }
  };
  
  const cancelDeleteStudent = () => {
    setDeleteStudentId(null);
    setIsDeleteConfirmVisible(false);
  };
  
  const handleInputChange = (field: keyof typeof initialStudentForm, value: string) => {
    setStudentForm({
      ...studentForm,
      [field]: value
    });
    
    // Auto-generate username when first and last name are entered
    if ((field === 'fname' || field === 'lname') && studentForm.fname && studentForm.lname) {
      const generatedUsername = (studentForm.fname[0] + studentForm.lname).toLowerCase();
      
      // Also generate a student ID if we have first and last name
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      const generatedStudentID = `${currentYear}${randomDigits}`;
      
      setStudentForm(prev => ({
        ...prev,
        username: generatedUsername,
        studentID: generatedStudentID
      }));
    }
  };
  
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  // Add togglePasswordVisibility function
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Handle edit button click
  const handleEditStudent = (student: Student) => {
    setIsEditMode(true);
    setEditStudentId(student.id);
    setStudentForm({
      fname: student.fname,
      lname: student.lname,
      username: student.username,
      password: '', // Don't populate password for security
      email: student.email,
      contactnumber: student.contactnumber,
      studentID: student.studentID
    });
    setAddStudentModalVisible(true);
  };

  // Handle update student
  const handleUpdateStudent = async () => {
    // Validate form (similar to handleAddStudent)
    if (!studentForm.fname.trim() || !studentForm.lname.trim() || !studentForm.username.trim()) {
      Alert.alert('Error', 'First name, last name and username are required');
      return;
    }
    
    if (!studentForm.email.trim() || !validateEmail(studentForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!studentForm.contactnumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }
    
    if (!studentForm.studentID.trim()) {
      Alert.alert('Error', 'Student ID is required');
      return;
    }
    
    if (!editStudentId) {
      Alert.alert('Error', 'Student ID not found');
      return;
    }
    
    // Create updated student object
    const updatedStudent = {
      fname: studentForm.fname.trim(),
      lname: studentForm.lname.trim(),
      username: studentForm.username.trim(),
      ...(studentForm.password.trim() && { password: studentForm.password.trim() }),
      email: studentForm.email.trim().toLowerCase(),
      contactnumber: studentForm.contactnumber.trim(),
      studentID: studentForm.studentID.trim().toUpperCase()
    };
    
    console.log('Preparing to update student:', updatedStudent);
    
    // Update in database
    const result = await updateStudentInDatabase(editStudentId, updatedStudent);
    
    if (result.success) {
      // Update the student in the local state
      setStudents(students.map(s => 
        s.id === editStudentId 
          ? {
              ...s,
              fname: result.data.fname,
              lname: result.data.lname,
              username: result.data.username,
              email: result.data.email || '',
              contactnumber: result.data.contactnumber || '',
              studentID: result.data.studentID || ''
            } 
          : s
      ));
      
      // Reset form and close modal
      setStudentForm(initialStudentForm);
      setAddStudentModalVisible(false);
      setIsEditMode(false);
      setEditStudentId(null);
      
      // Refresh the student list to make sure we're in sync with the server
      fetchStudents();
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setAddStudentModalVisible(false);
    setIsEditMode(false);
    setEditStudentId(null);
    setStudentForm(initialStudentForm);
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.fname} {item.lname}</Text>
        <Text style={styles.studentId}>Student ID: {item.studentID}</Text>
        <View style={styles.studentContactInfo}>
          <Ionicons name="mail-outline" size={14} color="#666" />
          <Text style={styles.studentContactText}>{item.email}</Text>
        </View>
        <View style={styles.studentContactInfo}>
          <Ionicons name="call-outline" size={14} color="#666" />
          <Text style={styles.studentContactText}>{item.contactnumber}</Text>
        </View>
      </View>
      <View style={styles.studentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditStudent(item)}
        >
          <Ionicons name="create-outline" size={20} color="#1a4b8e" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteStudent(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLecturerItem = ({ item }: { item: Lecturer }) => (
    <View style={styles.lecturerItem}>
      <View style={styles.lecturerInfo}>
        <Text style={styles.lecturerName}>{item.fname} {item.lname}</Text>
        <Text style={styles.lecturerId}>ID: {item.id_lecturer}</Text>
        <Text style={styles.lecturerDepartment}>{item.department}</Text>
        
        <View style={styles.lecturerContactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.contactText}>{item.email || 'No email provided'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.contactText}>{item.contactnumber || 'No contact number'}</Text>
          </View>
        </View>
        
        <View style={styles.courseChips}>
          {item.courses.slice(0, 3).map((course, index) => (
            <View key={index} style={styles.courseChip}>
              <Text style={styles.courseChipText}>{course}</Text>
            </View>
          ))}
          {item.courses.length > 3 && (
            <View style={styles.courseChip}>
              <Text style={styles.courseChipText}>+{item.courses.length - 3} more</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.lecturerActions}>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusBadgeText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity 
            style={{
              padding: 8,
              marginLeft: 8,
              borderRadius: 20,
              backgroundColor: '#f8f9fa',
              borderWidth: 1,
              borderColor: '#eee',
            }}
            onPress={() => handleEditLecturer(item)}
          >
            <Ionicons name="pencil" size={18} color="#1a4b8e" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              padding: 8,
              marginLeft: 8,
              borderRadius: 20,
              backgroundColor: '#fff0f0',
              borderWidth: 1,
              borderColor: '#ffcccc',
            }}
            onPress={() => handleDeleteLecturer(item.id)}
          >
            <Ionicons name="trash" size={18} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getStatusBadgeStyle = (status: Lecturer['status']) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#e6f9ee' };
      case 'on leave':
        return { backgroundColor: '#fff8e6' };
      case 'inactive':
        return { backgroundColor: '#ffe6e6' };
      default:
        return { backgroundColor: '#f0f0f0' };
    }
  };

  const getLecturerStatusStyle = (status: Lecturer['status']) => {
    switch (status) {
      case 'active':
        return { borderLeftColor: '#2ecc71' };
      case 'on leave':
        return { borderLeftColor: '#f39c12' };
      case 'inactive':
        return { borderLeftColor: '#e74c3c' };
      default:
        return { borderLeftColor: '#95a5a6' };
    }
  };

  const renderClassItem = ({ item }: { item: Class }) => (
    <View style={styles.classCard}>
      <View style={styles.classCardHeader}>
        <View style={styles.classCodeBadge}>
          <Text style={styles.classCodeText}>{item.classcode}</Text>
        </View>
      </View>
      
      <Text style={styles.className}>{item.classname}</Text>
      
      <View style={styles.classDetailsRow}>
        <View style={styles.classDetailItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.classDetailText}>
            Capacity: {item.capacity}
          </Text>
        </View>
      </View>
      
      <View style={styles.classCardActions}>
        <TouchableOpacity 
          style={styles.classActionButton}
          onPress={() => handleEditClass(item)}
        >
          <Ionicons name="create-outline" size={18} color="#1a4b8e" />
          <Text style={styles.classActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.classActionButton, styles.deleteButton]}
          onPress={() => handleDeleteClass(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getClassStatusStyle = () => {
    return { borderLeftColor: '#95a5a6' };
  };

  const getClassStatusBadgeStyle = () => {
    return { backgroundColor: '#f0f0f0' };
  };

  const getCapacityBarColor = (ratio: number) => {
    if (ratio < 0.5) return { backgroundColor: '#2ecc71' }; // green
    if (ratio < 0.8) return { backgroundColor: '#f39c12' }; // orange
    return { backgroundColor: '#e74c3c' }; // red
  };

  const handleSettingToggle = (setting: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleAutoLogoutChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      autoLogout: value
    }));
  };

  const handleLanguageChange = (language: AppSettings['language']) => {
    setSettings(prev => ({
      ...prev,
      language
    }));
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setSettings(mockSettings)
        }
      ]
    );
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity 
      key={item.id}
      style={[
        styles.menuItem, 
        activeTab === item.route && styles.activeMenuItem
      ]}
      onPress={() => handleMenuItemPress(item)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={activeTab === item.route ? '#1a4b8e' : '#555'} 
      />
      <Text style={[
        styles.menuItemText,
        activeTab === item.route && styles.activeMenuItemText
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.dashboardContainer}>
            {/* Welcome section */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>Welcome back, <Text style={styles.adminName}>{user?.fname || 'Admin'}</Text></Text>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </View>
              <View style={styles.profileImageContainer}>
                <Ionicons name="person-circle" size={50} color="#1a4b8e" />
              </View>
            </View>

            {/* Quick stats section */}
            <View style={styles.statsContainer}>
              <View style={styles.statsCard}>
                <View style={[styles.statsIconContainer, { backgroundColor: '#e6f9ee' }]}>
                  <Ionicons name="school" size={24} color="#2ecc71" />
                </View>
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsCount}>{students.length}</Text>
                  <Text style={styles.statsLabel}>Students</Text>
                </View>
                <View style={styles.statsTrendContainer}>
                  <Ionicons name="trending-up" size={16} color="#2ecc71" />
                  <Text style={[styles.statsTrendText, { color: '#2ecc71' }]}>3.2%</Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <View style={[styles.statsIconContainer, { backgroundColor: '#e6f6fe' }]}>
                  <Ionicons name="people" size={24} color="#3498db" />
                </View>
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsCount}>{lecturers.length}</Text>
                  <Text style={styles.statsLabel}>Lecturers</Text>
                </View>
                <View style={styles.statsTrendContainer}>
                  <Ionicons name="trending-up" size={16} color="#3498db" />
                  <Text style={[styles.statsTrendText, { color: '#3498db' }]}>1.5%</Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <View style={[styles.statsIconContainer, { backgroundColor: '#fff0e6' }]}>
                  <Ionicons name="grid" size={24} color="#f39c12" />
                </View>
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsCount}>{classes.length}</Text>
                  <Text style={styles.statsLabel}>Classes</Text>
                </View>
                <View style={styles.statsTrendContainer}>
                  <Ionicons name="trending-up" size={16} color="#f39c12" />
                  <Text style={[styles.statsTrendText, { color: '#f39c12' }]}>2.8%</Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <View style={[styles.statsIconContainer, { backgroundColor: '#f9e6e6' }]}>
                  <Ionicons name="calendar" size={24} color="#e74c3c" />
                </View>
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsCount}>
                    {classes.length}
                  </Text>
                  <Text style={styles.statsLabel}>Total Classes</Text>
                </View>
                <View style={styles.statsTrendContainer}>
                  <Ionicons name="trending-up" size={16} color="#e74c3c" />
                  <Text style={[styles.statsTrendText, { color: '#e74c3c' }]}>2.0%</Text>
                </View>
              </View>
            </View>

            {/* Quick actions */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => {
                    setActiveTab('student');
                    setAddStudentModalVisible(true);
                  }}
                >
                  <View style={[styles.quickActionIconContainer, { backgroundColor: '#e6f9ee' }]}>
                    <Ionicons name="person-add" size={24} color="#2ecc71" />
                  </View>
                  <Text style={styles.quickActionText}>Add Student</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => {
                    setActiveTab('lecturer');
                    setAddLecturerModalVisible(true);
                  }}
                >
                  <View style={[styles.quickActionIconContainer, { backgroundColor: '#e6f6fe' }]}>
                    <Ionicons name="person-add" size={24} color="#3498db" />
                  </View>
                  <Text style={styles.quickActionText}>Add Lecturer</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => {
                    setActiveTab('classes');
                    setAddClassModalVisible(true);
                  }}
                >
                  <View style={[styles.quickActionIconContainer, { backgroundColor: '#fff0e6' }]}>
                    <Ionicons name="add-circle" size={24} color="#f39c12" />
                  </View>
                  <Text style={styles.quickActionText}>Create Class</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionCard}>
                  <View style={[styles.quickActionIconContainer, { backgroundColor: '#e6e6f9' }]}>
                    <Ionicons name="stats-chart" size={24} color="#9b59b6" />
                  </View>
                  <Text style={styles.quickActionText}>Reports</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Enrollment status */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Enrollment Status</Text>
              <View style={styles.enrollmentCard}>
                <View style={styles.enrollmentHeader}>
                  <Text style={styles.enrollmentTitle}>Student Enrollment</Text>
                  <View style={styles.enrollmentPeriod}>
                    <Text style={styles.enrollmentPeriodText}>Current Semester</Text>
                  </View>
                </View>

                {classes.slice(0, 5).map((cls, index) => (
                  <View key={index} style={styles.enrollmentItem}>
                    <View style={styles.enrollmentItemInfo}>
                      <Text style={styles.enrollmentItemTitle}>{cls.classname}</Text>
                      <Text style={styles.enrollmentItemCode}>{cls.classcode}</Text>
                    </View>
                    <View style={styles.enrollmentStats}>
                      <Text style={styles.enrollmentCount}>
                        {cls.capacity}
                      </Text>
                      <View style={styles.enrollmentBarContainer}>
                        <View 
                          style={[
                            styles.enrollmentBarFill, 
                            { width: '75%' },
                            { backgroundColor: '#2ecc71' }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent activities */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <View style={styles.recentActivitiesCard}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#e6f9ee' }]}>
                    <Ionicons name="person-add" size={20} color="#2ecc71" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>New Student Added</Text>
                    <Text style={styles.activityDesc}>John Smith was registered</Text>
                  </View>
                  <Text style={styles.activityTime}>2h ago</Text>
                </View>

                <View style={styles.activityItem}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#e6f6fe' }]}>
                    <Ionicons name="calendar" size={20} color="#3498db" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Class Schedule Updated</Text>
                    <Text style={styles.activityDesc}>CS101 moved to Room A-101</Text>
                  </View>
                  <Text style={styles.activityTime}>3h ago</Text>
                </View>

                <View style={styles.activityItem}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#f9e6e6' }]}>
                    <Ionicons name="stats-chart" size={20} color="#e74c3c" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Attendance Report Ready</Text>
                    <Text style={styles.activityDesc}>Monthly report has been generated</Text>
                  </View>
                  <Text style={styles.activityTime}>5h ago</Text>
                </View>

                <View style={styles.activityItem}>
                  <View style={[styles.activityIconContainer, { backgroundColor: '#fff0e6' }]}>
                    <Ionicons name="people" size={20} color="#f39c12" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>New Lecturer Onboarded</Text>
                    <Text style={styles.activityDesc}>Dr. Sarah Miller joined Computer Science</Text>
                  </View>
                  <Text style={styles.activityTime}>1d ago</Text>
                </View>
              </View>
            </View>

            {/* System status */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>System Status</Text>
              <View style={styles.systemStatusCard}>
                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Server Status</Text>
                  <View style={styles.systemStatusValue}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.systemStatusText}>Operational</Text>
                  </View>
                </View>

                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Database</Text>
                  <View style={styles.systemStatusValue}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.systemStatusText}>Connected</Text>
                  </View>
                </View>

                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Last Backup</Text>
                  <Text style={styles.systemStatusText}>Today, 04:30 AM</Text>
                </View>

                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>System Version</Text>
                  <Text style={styles.systemStatusText}>v{mockSystemInfo.version}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      case 'student':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Student Management</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setAddStudentModalVisible(true)}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a4b8e" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}

            {!isLoading && errorMessage && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={40} color="#e74c3c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchStudents}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !errorMessage && students.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="school-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>No students found</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => setAddStudentModalVisible(true)}
                >
                  <Text style={styles.emptyStateButtonText}>Add New Student</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !isLoading && !errorMessage && (
                <FlatList
                  data={students}
                  renderItem={renderStudentItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.listContainer}
                />
              )
            )}
            
            {/* Add Student Modal */}
    <Modal
              visible={addStudentModalVisible}
              transparent
              animationType="fade"
              onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
              >
                <TouchableWithoutFeedback onPress={handleModalClose}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                
                <ScrollView
                  contentContainerStyle={styles.scrollModalContent}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{isEditMode ? 'Edit Student' : 'Add New Student'}</Text>
                      <TouchableOpacity onPress={handleModalClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formGroup, styles.formGroupHalf]}>
                        <Text style={styles.formLabel}>First Name</Text>
              <TextInput
                          style={styles.formInput}
                          value={studentForm.fname}
                          onChangeText={(text) => handleInputChange('fname', text)}
                          placeholder="First name"
                          placeholderTextColor="#999"
              />
            </View>

                      <View style={[styles.formGroup, styles.formGroupHalf]}>
                        <Text style={styles.formLabel}>Last Name</Text>
              <TextInput
                          style={styles.formInput}
                          value={studentForm.lname}
                          onChangeText={(text) => handleInputChange('lname', text)}
                          placeholder="Last name"
                          placeholderTextColor="#999"
                        />
                      </View>
            </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Username</Text>
              <TextInput
                        style={styles.formInput}
                        value={studentForm.username}
                        onChangeText={(text) => handleInputChange('username', text)}
                        placeholder="Enter username for login"
                        placeholderTextColor="#999"
                autoCapitalize="none"
                        autoCorrect={false}
              />
                      <Text style={styles.formHelpText}>
                        Username is required and must be unique
                      </Text>
            </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</Text>
                      <View style={styles.passwordInputContainer}>
              <TextInput
                          style={styles.passwordInput}
                          value={studentForm.password}
                          onChangeText={(text) => handleInputChange('password', text)}
                          placeholder={isEditMode ? "Enter new password (optional)" : "Password"}
                          placeholderTextColor="#999"
                          secureTextEntry={!passwordVisible}
                        />
            <TouchableOpacity
                          style={styles.togglePasswordButton}
                          onPress={togglePasswordVisibility}
                        >
                          <Ionicons 
                            name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
                            size={22} 
                            color="#666" 
                          />
                        </TouchableOpacity>
                      </View>
                      {isEditMode && (
                        <Text style={styles.formHelpText}>
                          Leave blank to keep the current password
                        </Text>
                      )}
            </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Email</Text>
              <TextInput
                        style={styles.formInput}
                        value={studentForm.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        placeholder="Email address"
                        placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Contact Number</Text>
              <TextInput
                        style={styles.formInput}
                        value={studentForm.contactnumber}
                        onChangeText={(text) => handleInputChange('contactnumber', text)}
                        placeholder="Phone number"
                        placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Student ID</Text>
                      <TextInput
                        style={styles.formInput}
                        value={studentForm.studentID}
                        onChangeText={(text) => handleInputChange('studentID', text)}
                        placeholder="Enter student ID number"
                        placeholderTextColor="#999"
                        autoCapitalize="characters"
                      />
                    </View>
                    
                    <View style={styles.modalFooter}>
          <TouchableOpacity
                        style={styles.studentCancelButton}
                        onPress={handleModalClose}
                      >
                        <Text style={styles.studentCancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={isEditMode ? handleUpdateStudent : handleAddStudent}
                      >
                        <Text style={styles.submitButtonText}>{isEditMode ? 'Update Student' : 'Add Student'}</Text>
          </TouchableOpacity>
        </View>
                  </View>
                </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
              visible={isDeleteConfirmVisible}
              transparent
              animationType="fade"
              onRequestClose={cancelDeleteStudent}
            >
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={cancelDeleteStudent}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                
                <View style={styles.confirmDialog}>
                  <Ionicons name="warning-outline" size={48} color="#e74c3c" />
                  <Text style={styles.confirmTitle}>Delete Student</Text>
                  <Text style={styles.confirmMessage}>
                    Are you sure you want to delete this student from the database? This action cannot be undone.
                  </Text>
                  
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity 
                      style={styles.cancelDeleteButton}
                      onPress={cancelDeleteStudent}
                    >
                      <Text style={styles.cancelDeleteText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmDeleteButton}
                      onPress={confirmDeleteStudent}
                    >
                      <Text style={styles.confirmDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        );
      case 'lecturer':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lecturer Management</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setAddLecturerModalVisible(true)}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterChip, lecturerFilter === 'all' && styles.activeFilterChip]}
                onPress={() => handleFilterChange('all')}
              >
                <Text style={lecturerFilter === 'all' ? styles.activeFilterText : styles.filterText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, lecturerFilter === 'active' && styles.activeFilterChip]}
                onPress={() => handleFilterChange('active')}
              >
                <Text style={lecturerFilter === 'active' ? styles.activeFilterText : styles.filterText}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, lecturerFilter === 'on leave' && styles.activeFilterChip]}
                onPress={() => handleFilterChange('on leave')}
              >
                <Text style={lecturerFilter === 'on leave' ? styles.activeFilterText : styles.filterText}>On Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, lecturerFilter === 'inactive' && styles.activeFilterChip]}
                onPress={() => handleFilterChange('inactive')}
              >
                <Text style={lecturerFilter === 'inactive' ? styles.activeFilterText : styles.filterText}>Inactive</Text>
              </TouchableOpacity>
            </View>
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a4b8e" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}

            {!isLoading && errorMessage && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={40} color="#e74c3c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchLecturers}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !errorMessage && lecturers.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="person-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>No lecturers found</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => setAddLecturerModalVisible(true)}
                >
                  <Text style={styles.emptyStateButtonText}>Add New Lecturer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !isLoading && !errorMessage && (
                <FlatList
                  data={lecturerFilter === 'all' 
                    ? lecturers 
                    : lecturers.filter(lecturer => lecturer.status === lecturerFilter)
                  }
                  renderItem={renderLecturerItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.listContainer}
                />
              )
            )}
            
            {/* Add Lecturer Modal */}
            <Modal
              visible={addLecturerModalVisible}
              transparent
              animationType="fade"
              onRequestClose={handleLecturerModalClose}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
              >
                <TouchableWithoutFeedback onPress={handleLecturerModalClose}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                
                <ScrollView
                  contentContainerStyle={styles.scrollModalContent}
                >
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {isLecturerEditMode ? 'Edit Lecturer' : 'Add New Lecturer'}
                      </Text>
                      <TouchableOpacity onPress={handleLecturerModalClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formGroup, styles.formGroupHalf]}>
                        <Text style={styles.formLabel}>First Name</Text>
                        <TextInput
                          style={styles.formInput}
                          value={lecturerForm.fname}
                          onChangeText={(text) => handleLecturerInputChange('fname', text)}
                          placeholder="First name"
                          placeholderTextColor="#999"
                        />
                      </View>

                      <View style={[styles.formGroup, styles.formGroupHalf]}>
                        <Text style={styles.formLabel}>Last Name</Text>
                        <TextInput
                          style={styles.formInput}
                          value={lecturerForm.lname}
                          onChangeText={(text) => handleLecturerInputChange('lname', text)}
                          placeholder="Last name"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Username</Text>
                      <TextInput
                        style={styles.formInput}
                        value={lecturerForm.username}
                        onChangeText={(text) => handleLecturerInputChange('username', text)}
                        placeholder="Enter username for login"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={styles.formHelpText}>
                        Username is required and must be unique
                      </Text>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        {isLecturerEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                      </Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={styles.passwordInput}
                          value={lecturerForm.password}
                          onChangeText={(text) => handleLecturerInputChange('password', text)}
                          placeholder={isLecturerEditMode ? "Enter new password (optional)" : "Password"}
                          placeholderTextColor="#999"
                          secureTextEntry={!passwordVisible}
                        />
                        <TouchableOpacity 
                          style={styles.togglePasswordButton}
                          onPress={togglePasswordVisibility}
                        >
                          <Ionicons 
                            name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
                            size={22} 
                            color="#666" 
                          />
                        </TouchableOpacity>
                      </View>
                      {isLecturerEditMode && (
                        <Text style={styles.formHelpText}>
                          Leave blank to keep the current password
                        </Text>
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Email</Text>
                      <TextInput
                        style={styles.formInput}
                        value={lecturerForm.email}
                        onChangeText={(text) => handleLecturerInputChange('email', text)}
                        placeholder="Email address"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Contact Number</Text>
                      <TextInput
                        style={styles.formInput}
                        value={lecturerForm.contactnumber}
                        onChangeText={(text) => handleLecturerInputChange('contactnumber', text)}
                        placeholder="Phone number"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Department</Text>
                      <TextInput
                        style={styles.formInput}
                        value={lecturerForm.department}
                        onChangeText={(text) => handleLecturerInputChange('department', text)}
                        placeholder="Department"
                        placeholderTextColor="#999"
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Courses</Text>
                      {lecturerForm.courses.map((course, index) => (
                        <View key={index} style={styles.courseInputRow}>
                          <TextInput
                            style={styles.courseInput}
                            value={course}
                            onChangeText={(text) => handleCourseInputChange(index, text)}
                            placeholder={`Course ${index + 1}`}
                            placeholderTextColor="#999"
                          />
                          <TouchableOpacity 
                            style={styles.removeCourseButton}
                            onPress={() => handleRemoveCourseField(index)}
                          >
                            <Ionicons name="remove-circle-outline" size={24} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={styles.addCourseButton}
                        onPress={handleAddCourseField}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#1a4b8e" />
                        <Text style={styles.addCourseText}>Add Another Course</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Status</Text>
                      <View style={styles.statusButtonsContainer}>
                        <TouchableOpacity 
                          style={[
                            styles.statusButton, 
                            lecturerForm.status === 'active' && styles.activeStatusButton
                          ]}
                          onPress={() => handleStatusChange('active')}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            lecturerForm.status === 'active' && styles.activeStatusButtonText
                          ]}>Active</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.statusButton, 
                            lecturerForm.status === 'on leave' && styles.onLeaveStatusButton
                          ]}
                          onPress={() => handleStatusChange('on leave')}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            lecturerForm.status === 'on leave' && styles.onLeaveStatusButtonText
                          ]}>On Leave</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.statusButton, 
                            lecturerForm.status === 'inactive' && styles.inactiveStatusButton
                          ]}
                          onPress={() => handleStatusChange('inactive')}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            lecturerForm.status === 'inactive' && styles.inactiveStatusButtonText
                          ]}>Inactive</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={styles.studentCancelButton}
                        onPress={handleLecturerModalClose}
                      >
                        <Text style={styles.studentCancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={isLecturerEditMode ? handleUpdateLecturer : handleAddLecturer}
                      >
                        <Text style={styles.submitButtonText}>
                          {isLecturerEditMode ? 'Update Lecturer' : 'Add Lecturer'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
              visible={isLecturerDeleteConfirmVisible}
              transparent
              animationType="fade"
              onRequestClose={cancelDeleteLecturer}
            >
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={cancelDeleteLecturer}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                
                <View style={styles.confirmDialog}>
                  <Ionicons name="warning-outline" size={48} color="#e74c3c" />
                  <Text style={styles.confirmTitle}>Delete Lecturer</Text>
                  <Text style={styles.confirmMessage}>
                    Are you sure you want to delete this lecturer from the database? This action cannot be undone.
                  </Text>
                  
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity 
                      style={styles.cancelDeleteButton}
                      onPress={cancelDeleteLecturer}
                    >
                      <Text style={styles.cancelDeleteText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmDeleteButton}
                      onPress={confirmDeleteLecturer}
                    >
                      <Text style={styles.confirmDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        );
      case 'classes':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Class Management</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setAddClassModalVisible(true)}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterChip, classFilter === 'all' && styles.activeFilterChip]}
                onPress={() => setClassFilter('all')}
              >
                <Text style={classFilter === 'all' ? styles.activeFilterText : styles.filterText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, classFilter === 'upcoming' && styles.activeFilterChip]}
                onPress={() => setClassFilter('upcoming')}
              >
                <Text style={classFilter === 'upcoming' ? styles.activeFilterText : styles.filterText}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, classFilter === 'ongoing' && styles.activeFilterChip]}
                onPress={() => setClassFilter('ongoing')}
              >
                <Text style={classFilter === 'ongoing' ? styles.activeFilterText : styles.filterText}>Ongoing</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, classFilter === 'completed' && styles.activeFilterChip]}
                onPress={() => setClassFilter('completed')}
              >
                <Text style={classFilter === 'completed' ? styles.activeFilterText : styles.filterText}>Completed</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes..."
              value={classSearchQuery}
              onChangeText={setClassSearchQuery}
            />
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a4b8e" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}

            {!isLoading && errorMessage && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={40} color="#e74c3c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchClasses}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !errorMessage && classes.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="grid-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>No classes found</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => setAddClassModalVisible(true)}
                >
                  <Text style={styles.emptyStateButtonText}>Add New Class</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !isLoading && !errorMessage && (
                <FlatList
                  data={
                    classes.filter(cls => 
                      classSearchQuery === '' || 
                      cls.classname.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                      cls.classcode.toLowerCase().includes(classSearchQuery.toLowerCase())
                    )
                  }
                  renderItem={renderClassItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.listContainer}
                />
              )
            )}
            
            {/* Delete Confirmation Modal */}
            <Modal
              visible={isClassDeleteConfirmVisible}
              transparent
              animationType="fade"
              onRequestClose={cancelDeleteClass}
            >
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={cancelDeleteClass}>
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                
                <View style={styles.confirmDialog}>
                  <Ionicons name="warning-outline" size={48} color="#e74c3c" />
                  <Text style={styles.confirmTitle}>Delete Class</Text>
                  <Text style={styles.confirmMessage}>
                    Are you sure you want to delete this class from the database? This action cannot be undone.
                  </Text>
                  
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity 
                      style={styles.cancelDeleteButton}
                      onPress={cancelDeleteClass}
                    >
                      <Text style={styles.cancelDeleteText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmDeleteButton}
                      onPress={confirmDeleteClass}
                    >
                      <Text style={styles.confirmDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        );
      case 'setting':
        return (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.settingsContainer}>
            <View style={styles.settingSection}>
              <Text style={styles.settingSectionTitle}>Account Settings</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="person-circle" size={22} color="#1a4b8e" />
                  </View>
                  <Text style={styles.settingName}>Profile</Text>
                </View>
                <TouchableOpacity style={styles.settingButton}>
                  <Text style={styles.settingButtonText}>Edit</Text>
                  <Ionicons name="chevron-forward" size={16} color="#1a4b8e" />
                </TouchableOpacity>
        </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="lock-closed" size={22} color="#1a4b8e" />
                  </View>
                  <Text style={styles.settingName}>Change Password</Text>
                </View>
                <TouchableOpacity style={styles.settingButton}>
                  <Text style={styles.settingButtonText}>Change</Text>
                  <Ionicons name="chevron-forward" size={16} color="#1a4b8e" />
                </TouchableOpacity>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="shield-checkmark" size={22} color="#1a4b8e" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Two-Factor Authentication</Text>
                    <Text style={styles.settingDescription}>Add an extra layer of security</Text>
                  </View>
                </View>
                <Switch
                  value={settings.twoFactorAuth}
                  onValueChange={() => handleSettingToggle('twoFactorAuth')}
                  trackColor={{ false: '#d0d0d0', true: '#a0cfff' }}
                  thumbColor={settings.twoFactorAuth ? '#1a4b8e' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="time" size={22} color="#1a4b8e" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Auto Logout</Text>
                    <Text style={styles.settingDescription}>Time in minutes</Text>
                  </View>
                </View>
              <View style={styles.pickerContainer}>
            <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => handleAutoLogoutChange(15)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      settings.autoLogout === 15 && styles.selectedTimeText
                    ]}>15</Text>
            </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => handleAutoLogoutChange(30)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      settings.autoLogout === 30 && styles.selectedTimeText
                    ]}>30</Text>
            </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => handleAutoLogoutChange(60)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      settings.autoLogout === 60 && styles.selectedTimeText
                    ]}>60</Text>
            </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingSectionTitle}>App Settings</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="notifications" size={22} color="#1a4b8e" />
            </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Notifications</Text>
                    <Text style={styles.settingDescription}>Receive alerts and updates</Text>
          </View>
        </View>
                <Switch
                  value={settings.notifications}
                  onValueChange={() => handleSettingToggle('notifications')}
                  trackColor={{ false: '#d0d0d0', true: '#a0cfff' }}
                  thumbColor={settings.notifications ? '#1a4b8e' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="moon" size={22} color="#1a4b8e" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Dark Mode</Text>
                    <Text style={styles.settingDescription}>Change app appearance</Text>
                  </View>
                </View>
                <Switch
                  value={settings.darkMode}
                  onValueChange={() => handleSettingToggle('darkMode')}
                  trackColor={{ false: '#d0d0d0', true: '#a0cfff' }}
                  thumbColor={settings.darkMode ? '#1a4b8e' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="language" size={22} color="#1a4b8e" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Language</Text>
                    <Text style={styles.settingDescription}>Select your preferred language</Text>
                  </View>
                </View>
                <View style={styles.languageButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.languageButton,
                      settings.language === 'English' && styles.selectedLanguageButton
                    ]}
                    onPress={() => handleLanguageChange('English')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      settings.language === 'English' && styles.selectedLanguageText
                    ]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.languageButton,
                      settings.language === 'Spanish' && styles.selectedLanguageButton
                    ]}
                    onPress={() => handleLanguageChange('Spanish')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      settings.language === 'Spanish' && styles.selectedLanguageText
                    ]}>ES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.languageButton,
                      settings.language === 'French' && styles.selectedLanguageButton
                    ]}
                    onPress={() => handleLanguageChange('French')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      settings.language === 'French' && styles.selectedLanguageText
                    ]}>FR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingSectionTitle}>Data Management</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="sync" size={22} color="#1a4b8e" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Auto Sync</Text>
                    <Text style={styles.settingDescription}>Automatically sync data</Text>
                  </View>
                </View>
                <Switch
                  value={settings.dataSync}
                  onValueChange={() => handleSettingToggle('dataSync')}
                  trackColor={{ false: '#d0d0d0', true: '#a0cfff' }}
                  thumbColor={settings.dataSync ? '#1a4b8e' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="cloud-upload" size={22} color="#1a4b8e" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingName}>Auto Backup</Text>
                    <Text style={styles.settingDescription}>Backup data to cloud</Text>
                  </View>
                </View>
                <Switch
                  value={settings.dataBackup}
                  onValueChange={() => handleSettingToggle('dataBackup')}
                  trackColor={{ false: '#d0d0d0', true: '#a0cfff' }}
                  thumbColor={settings.dataBackup ? '#1a4b8e' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="trash" size={22} color="#e74c3c" />
                  </View>
                  <Text style={styles.settingName}>Clear Cache</Text>
                </View>
                <TouchableOpacity style={[styles.settingButton, styles.dangerButton]}>
                  <Text style={styles.dangerButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingSectionTitle}>System Information</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>{mockSystemInfo.version}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Build Number</Text>
                <Text style={styles.infoValue}>{mockSystemInfo.buildNumber}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Device Model</Text>
                <Text style={styles.infoValue}>{mockSystemInfo.deviceModel}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Operating System</Text>
                <Text style={styles.infoValue}>{mockSystemInfo.operatingSystem}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Free Storage</Text>
                <Text style={styles.infoValue}>{mockSystemInfo.freeStorage}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Last Update</Text>
                <Text style={styles.infoValue}>{mockSystemInfo.lastUpdate}</Text>
              </View>
            </View>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetSettings}
              >
                <Ionicons name="refresh" size={18} color="#666" />
                <Text style={styles.resetButtonText}>Reset Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoutButtonLarge}
                onPress={() => setShowConfirmLogout(true)}
              >
                <Ionicons name="log-out" size={18} color="white" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
            
            {showConfirmLogout && (
              <View style={styles.confirmLogoutOverlay}>
                <View style={styles.confirmLogoutCard}>
                  <Text style={styles.confirmLogoutTitle}>Confirm Logout</Text>
                  <Text style={styles.confirmLogoutMessage}>Are you sure you want to logout?</Text>
                  <View style={styles.confirmLogoutButtons}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setShowConfirmLogout(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleLogout}
                    >
                      <Text style={styles.confirmButtonText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
      </ScrollView>
        );
      default:
        return (
          <View style={styles.content}>
            {/* Dashboard content here */}
          </View>
        );
    }
  };
  
  // Fix for the toUpperCase() linter error by ensuring activeTab is treated as a string
  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'DASHBOARD';
      case 'student': return 'STUDENTS';
      case 'lecturer': return 'LECTURERS';
      case 'classes': return 'CLASSES';
      case 'setting': return 'SETTINGS';
      default: return String(activeTab).toUpperCase();
    }
  };

  // Add lecturer fetch function
  const fetchLecturers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      console.log(`Fetching lecturers from: ${API_URL}/users?role=lecturer`);
      
      // Add timeout to the fetch request
      const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const { signal } = controller;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new Error('Request timeout - server took too long to respond'));
          }, timeout);
        });
        
        return Promise.race([
          fetch(url, { ...options, signal }) as Promise<Response>,
          timeoutPromise
        ]);
      };
      
      // Fetch lecturers from the API with timeout
      const response = await fetchWithTimeout(`${API_URL}/users?role=lecturer`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched lecturers data successfully:', data);
      
      // Map API data to our Lecturer interface following the database schema
      const fetchedLecturers = Array.isArray(data) 
        ? data
          .filter((user: ApiUser) => user.role === 'lecturer')
          .map((user: ApiUser) => ({
            id: user.id.toString(),
            id_lecturer: user.id.toString(),
            fname: user.fname,
            lname: user.lname,
            username: user.user_name,
            email: user.email || '',
            contactnumber: user.contact_n || '',
            department: user.department || '',
            courses: Array.isArray(user.courses) 
              ? user.courses 
              : typeof user.courses === 'string' && user.courses 
                ? (user.courses.includes('[') ? JSON.parse(user.courses) : [user.courses]) 
                : [],
            status: (user.status as Lecturer['status']) || 'active'
          }))
        : [];
      
      setLecturers(fetchedLecturers);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching lecturers:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to load lecturers: ${error.message}`);
    }
  };

  // Function to save a new lecturer to the database
  const saveLecturerToDatabase = async (lecturer: {
    fname: string;
    lname: string;
    username: string;
    password: string;
    email: string;
    contactnumber: string;
    department: string;
    courses: string[];
    status: Lecturer['status'];
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map our form fields to what the server expects
      const userData = {
        fname: lecturer.fname,
        lname: lecturer.lname,
        email: lecturer.email,
        user_name: lecturer.username,
        password: lecturer.password,
        contact_n: lecturer.contactnumber,
        department: lecturer.department,
        courses: lecturer.courses,
        status: lecturer.status,
        role: 'lecturer'
      };
      
      console.log(`Sending lecturer data to: ${API_URL}/users`);
      console.log('Lecturer data:', userData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to create a new user
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || `Server returned ${response.status} ${response.statusText}`);
      }
      
      setIsLoading(false);
      
      Alert.alert(
        'Success',
        `Lecturer ${lecturer.fname} ${lecturer.lname} has been added to the database.`,
        [{ text: 'OK' }]
      );
      
      return {
        success: true,
        data: result.user
      };
    } catch (error: any) {
      console.error('Error saving lecturer:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to save lecturer: ${error.message}`);
      
      Alert.alert(
        'Error',
        `Failed to save lecturer: ${error.message}. Please check your connection and try again.`
      );
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Function to update a lecturer in the database
  const updateLecturerInDatabase = async (id: string, lecturerData: {
    fname: string;
    lname: string;
    username: string;
    password?: string;
    email: string;
    contactnumber: string;
    department: string;
    courses: string[];
    status: Lecturer['status'];
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map our form fields to what the server expects
      const userData = {
        id: id,
        fname: lecturerData.fname,
        lname: lecturerData.lname,
        email: lecturerData.email,
        user_name: lecturerData.username,
        ...(lecturerData.password && { password: lecturerData.password }),
        contact_n: lecturerData.contactnumber,
        department: lecturerData.department,
        courses: lecturerData.courses,
        status: lecturerData.status,
        role: 'lecturer'
      };
      
      console.log(`Sending update lecturer data to: ${API_URL}/users/${id}`);
      console.log('Update data:', userData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to update the user
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || `Server returned ${response.status} ${response.statusText}`);
      }
      
      setIsLoading(false);
      
      Alert.alert(
        'Success',
        `Lecturer ${lecturerData.fname} ${lecturerData.lname} has been updated.`,
        [{ text: 'OK' }]
      );
      
      return {
        success: true,
        data: result.user
      };
    } catch (error: any) {
      console.error('Error updating lecturer:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to update lecturer: ${error.message}`);
      
      Alert.alert(
        'Error',
        `Failed to update lecturer: ${error.message}. Please check your connection and try again.`
      );
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Function to delete a lecturer from the database
  const deleteLecturerFromDatabase = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Call the API to delete the user
      const response = await fetch(`${API_URL}/users/${id}?role=lecturer`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lecturer');
      }
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting lecturer:', error);
      setIsLoading(false);
      setErrorMessage('Failed to delete lecturer from database');
      Alert.alert('Error', error.message || 'Failed to delete lecturer from database');
      return false;
    }
  };

  // Handle adding a new lecturer
  const handleAddLecturer = async () => {
    // Validate form
    if (!lecturerForm.fname.trim() || !lecturerForm.lname.trim() || !lecturerForm.username.trim()) {
      Alert.alert('Error', 'First name, last name and username are required');
      return;
    }
    
    if (!lecturerForm.email.trim() || !validateEmail(lecturerForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!lecturerForm.password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    
    if (!lecturerForm.contactnumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }
    
    if (!lecturerForm.department.trim()) {
      Alert.alert('Error', 'Department is required');
      return;
    }
    
    // Filter out empty courses
    const courses = lecturerForm.courses.filter(course => course.trim() !== '');
    if (courses.length === 0) {
      Alert.alert('Error', 'At least one course is required');
      return;
    }
    
    // Create new lecturer object
    const newLecturer = {
      fname: lecturerForm.fname.trim(),
      lname: lecturerForm.lname.trim(),
      username: lecturerForm.username.trim(),
      password: lecturerForm.password.trim(),
      email: lecturerForm.email.trim().toLowerCase(),
      contactnumber: lecturerForm.contactnumber.trim(),
      department: lecturerForm.department.trim(),
      courses: courses,
      status: lecturerForm.status
    };
    
    console.log('Preparing to save lecturer:', newLecturer);
    
    // Save to database
    const result = await saveLecturerToDatabase(newLecturer);
    
    if (result.success) {
      // Map the returned data to our Lecturer interface
      const lecturerWithId = {
        id: result.data.id.toString(),
        id_lecturer: result.data.id.toString(),
        fname: result.data.fname,
        lname: result.data.lname,
        username: result.data.username || result.data.user_name,
        email: result.data.email || '',
        contactnumber: result.data.contactnumber || result.data.contact_n || '',
        department: result.data.department || '',
        courses: result.data.courses || [],
        status: (result.data.status as Lecturer['status']) || 'active'
      };
      
      // Add to lecturers array
      setLecturers([...lecturers, lecturerWithId]);
      
      // Reset form and close modal
      setLecturerForm(initialLecturerForm);
      setAddLecturerModalVisible(false);
      
      // Refresh the lecturer list to make sure we're in sync with the server
      fetchLecturers();
    }
  };

  // Handle editing a lecturer
  const handleEditLecturer = (lecturer: Lecturer) => {
    setIsLecturerEditMode(true);
    setEditLecturerId(lecturer.id);
    setLecturerForm({
      fname: lecturer.fname,
      lname: lecturer.lname,
      username: lecturer.username || '',
      password: '', // Don't populate password for security
      email: lecturer.email,
      contactnumber: lecturer.contactnumber,
      department: lecturer.department,
      courses: lecturer.courses.length > 0 ? lecturer.courses : [''],
      status: lecturer.status
    });
    setAddLecturerModalVisible(true);
  };

  // Handle updating a lecturer
  const handleUpdateLecturer = async () => {
    // Validate form
    if (!lecturerForm.fname.trim() || !lecturerForm.lname.trim() || !lecturerForm.username.trim()) {
      Alert.alert('Error', 'First name, last name and username are required');
      return;
    }
    
    if (!lecturerForm.email.trim() || !validateEmail(lecturerForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!lecturerForm.contactnumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }
    
    if (!lecturerForm.department.trim()) {
      Alert.alert('Error', 'Department is required');
      return;
    }
    
    // Filter out empty courses
    const courses = lecturerForm.courses.filter(course => course.trim() !== '');
    if (courses.length === 0) {
      Alert.alert('Error', 'At least one course is required');
      return;
    }
    
    if (!editLecturerId) {
      Alert.alert('Error', 'Lecturer ID not found');
      return;
    }
    
    // Create updated lecturer object
    const updatedLecturer = {
      fname: lecturerForm.fname.trim(),
      lname: lecturerForm.lname.trim(),
      username: lecturerForm.username.trim(),
      ...(lecturerForm.password.trim() && { password: lecturerForm.password.trim() }),
      email: lecturerForm.email.trim().toLowerCase(),
      contactnumber: lecturerForm.contactnumber.trim(),
      department: lecturerForm.department.trim(),
      courses: courses,
      status: lecturerForm.status
    };
    
    console.log('Preparing to update lecturer:', updatedLecturer);
    
    // Update in database
    const result = await updateLecturerInDatabase(editLecturerId, updatedLecturer);
    
    if (result.success) {
      // Update the lecturer in the local state
      setLecturers(lecturers.map(l => 
        l.id === editLecturerId 
          ? {
              ...l,
              fname: result.data.fname,
              lname: result.data.lname,
              username: result.data.username || result.data.user_name,
              email: result.data.email || '',
              contactnumber: result.data.contactnumber || result.data.contact_n || '',
              department: result.data.department || '',
              courses: result.data.courses || [],
              status: (result.data.status as Lecturer['status']) || 'active'
            } 
          : l
      ));
      
      // Reset form and close modal
      setLecturerForm(initialLecturerForm);
      setAddLecturerModalVisible(false);
      setIsLecturerEditMode(false);
      setEditLecturerId(null);
      
      // Refresh the lecturer list
      fetchLecturers();
    }
  };

  // Handle lecturer delete
  const handleDeleteLecturer = (id: string) => {
    setDeleteLecturerId(id);
    setIsLecturerDeleteConfirmVisible(true);
  };

  // Confirm lecturer delete
  const confirmDeleteLecturer = async () => {
    if (deleteLecturerId) {
      const success = await deleteLecturerFromDatabase(deleteLecturerId);
      
      if (success) {
        // Remove from local state
        setLecturers(lecturers.filter(lecturer => lecturer.id !== deleteLecturerId));
        setDeleteLecturerId(null);
        setIsLecturerDeleteConfirmVisible(false);
        
        // Refresh the lecturer list
        fetchLecturers();
      }
    }
  };

  // Cancel lecturer delete
  const cancelDeleteLecturer = () => {
    setDeleteLecturerId(null);
    setIsLecturerDeleteConfirmVisible(false);
  };

  // Handle lecturer modal close
  const handleLecturerModalClose = () => {
    setAddLecturerModalVisible(false);
    setIsLecturerEditMode(false);
    setEditLecturerId(null);
    setLecturerForm(initialLecturerForm);
  };

  // Handle adding a course field
  const handleAddCourseField = () => {
    setLecturerForm(prev => ({
      ...prev,
      courses: [...prev.courses, '']
    }));
  };

  // Handle removing a course field
  const handleRemoveCourseField = (index: number) => {
    if (lecturerForm.courses.length <= 1) {
      return; // Keep at least one course field
    }
    
    setLecturerForm(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  // Handle course input change
  const handleCourseInputChange = (index: number, value: string) => {
    const updatedCourses = [...lecturerForm.courses];
    updatedCourses[index] = value;
    
    setLecturerForm(prev => ({
      ...prev,
      courses: updatedCourses
    }));
  };

  // Handle lecturer form input change
  const handleLecturerInputChange = (field: keyof typeof lecturerForm, value: string) => {
    setLecturerForm({
      ...lecturerForm,
      [field]: value
    });
    
    // Auto-generate username when first and last name are entered
    if ((field === 'fname' || field === 'lname') && lecturerForm.fname && lecturerForm.lname) {
      const generatedUsername = (lecturerForm.fname[0] + lecturerForm.lname).toLowerCase();
      setLecturerForm(prev => ({
        ...prev,
        username: generatedUsername
      }));
    }
  };

  // Handle status change
  const handleStatusChange = (status: Lecturer['status']) => {
    setLecturerForm(prev => ({
      ...prev,
      status
    }));
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setLecturerFilter(filter);
  };

  // Add useEffect to call initializeData on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Render lecturer form modal
  const renderLecturerForm = () => (
    <Modal
      visible={addLecturerModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleLecturerModalClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isLecturerEditMode ? 'Edit Lecturer' : 'Add New Lecturer'}
            </Text>
            <TouchableOpacity onPress={handleLecturerModalClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={lecturerForm.fname}
                onChangeText={(value) => handleLecturerInputChange('fname', value)}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lecturerForm.lname}
                onChangeText={(value) => handleLecturerInputChange('lname', value)}
                placeholder="Enter last name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={lecturerForm.username}
                onChangeText={(value) => handleLecturerInputChange('username', value)}
                placeholder="Enter username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password {isLecturerEditMode && '(leave empty to keep current)'}</Text>
              <View style={styles.passwordInputContainer}>
              <TextInput
                  style={styles.passwordInput}
                  value={lecturerForm.password}
                  onChangeText={(value) => handleLecturerInputChange('password', value)}
                  placeholder={isLecturerEditMode ? "Enter new password (optional)" : "Enter password"}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.passwordVisibilityButton} onPress={togglePasswordVisibility}>
                  <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={lecturerForm.email}
                onChangeText={(value) => handleLecturerInputChange('email', value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={lecturerForm.contactnumber}
                onChangeText={(value) => handleLecturerInputChange('contactnumber', value)}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={lecturerForm.department}
                onChangeText={(value) => handleLecturerInputChange('department', value)}
                placeholder="Enter department"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Courses</Text>
              {lecturerForm.courses.map((course, index) => (
                <View key={index} style={styles.courseInputContainer}>
                  <TextInput
                    style={styles.courseInput}
                    value={course}
                    onChangeText={(value) => handleCourseInputChange(index, value)}
                    placeholder={`Enter course ${index + 1}`}
                  />
                  <TouchableOpacity 
                    style={styles.removeCourseButton} 
                    onPress={() => handleRemoveCourseField(index)}
                    disabled={lecturerForm.courses.length === 1}
                  >
                    <Ionicons name="remove-circle" size={24} color={lecturerForm.courses.length === 1 ? "#ccc" : "#ff6b6b"} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.addCourseButton} 
                onPress={handleAddCourseField}
              >
                <Ionicons name="add-circle" size={24} color="#4dabf7" />
                <Text style={styles.addCourseText}>Add Another Course</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusContainer}>
                {['active', 'on leave', 'inactive'].map((status) => (
                  <TouchableOpacity 
                    key={status} 
                    style={[
                      styles.statusOption,
                      lecturerForm.status === status && styles.statusOptionSelected,
                      { backgroundColor: lecturerForm.status === status 
                        ? status === 'active' ? '#4dabf7' 
                        : status === 'on leave' ? '#ffd43b' 
                        : '#ff6b6b' 
                        : '#f8f9fa' 
                      }
                    ]}
                    onPress={() => handleStatusChange(status as Lecturer['status'])}
                  >
                    <Text style={[
                      styles.statusText,
                      lecturerForm.status === status && styles.statusTextSelected
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
          <TouchableOpacity
              style={styles.cancelButton} 
              onPress={handleLecturerModalClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={isLecturerEditMode ? handleUpdateLecturer : handleAddLecturer}
            >
              <Text style={styles.saveButtonText}>
                {isLecturerEditMode ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );

  // Render menu
  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <TouchableOpacity style={styles.menuOverlay} onPress={() => setIsMenuVisible(false)} />
      <View style={styles.menu}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
      </View>
        <ScrollView>
          {menuItems.map(renderMenuItem)}
        </ScrollView>
          </View>
          </View>
  );

  // Fetch classes from API
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      console.log(`Fetching classes from: ${API_URL}/classes`);
      
      // Add timeout to the fetch request
      const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const { signal } = controller;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(new Error('Request timeout - server took too long to respond'));
          }, timeout);
        });
        
        return Promise.race([
          fetch(url, { ...options, signal }) as Promise<Response>,
          timeoutPromise
        ]);
      };
      
      try {
        // Try to fetch classes from the API with timeout
        const response = await fetchWithTimeout(`${API_URL}/classes`);
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched classes data successfully:', data);
        
        // Map API data to our Class interface
        const fetchedClasses = Array.isArray(data) 
          ? data.map((cls: any) => ({
              id: cls.id_classes.toString(),
              id_classes: cls.id_classes.toString(),
              classname: cls.classname,
              classcode: cls.classcode,
              capacity: cls.capacity
            }))
          : [];
        
        setClasses(fetchedClasses);
      } catch (error) {
        console.log('No classes found in API, using empty array');
        // If API doesn't have classes endpoint yet, use empty array
        setClasses([]);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      setIsLoading(false);
      setErrorMessage(`Failed to load classes: ${error.message}`);
      setClasses([]);
    }
  };

  // Save class to database
  const saveClassToDatabase = async (classData: {
    classname: string;
    classcode: string;
    capacity: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map our form fields to what the server expects
      const classPayload = {
        classname: classData.classname,
        classcode: classData.classcode,
        capacity: classData.capacity
      };
      
      console.log(`Sending class data to: ${API_URL}/classes`);
      console.log('Class data:', classPayload);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to create a new class
      const response = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(classPayload),
        signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save class');
      }
      
      setIsLoading(false);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error saving class:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: `Failed to save class: ${error.message}` 
      };
    }
  };
  
  // Update class in database
  const updateClassInDatabase = async (id: string, classData: {
    classname: string;
    classcode: string;
    capacity: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map our form fields to what the server expects
      const classPayload = {
        classname: classData.classname,
        classcode: classData.classcode,
        capacity: classData.capacity
      };
      
      console.log(`Updating class at: ${API_URL}/classes/${id}`);
      console.log('Class data:', classPayload);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to update the class
      const response = await fetch(`${API_URL}/classes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(classPayload),
        signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update class');
      }
      
      setIsLoading(false);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error updating class:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: `Failed to update class: ${error.message}` 
      };
    }
  };
  
  // Delete class from database
  const deleteClassFromDatabase = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log(`Deleting class with ID ${id} from: ${API_URL}/classes/${id}`);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const { signal } = controller;
      
      // Set timeout for 15 seconds
      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      // Call the API to delete the class
      const response = await fetch(`${API_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete class: ${response.status}`);
      }
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting class:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Handler functions for class management
  
  // Handle adding a new class
  const handleAddClass = async () => {
    try {
      // Validate required fields
      if (!classForm.classname || !classForm.classcode) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      // Save to database
      const result = await saveClassToDatabase({
        ...classForm
      });
      
      if (result.success) {
        // Add the new class with its ID to the local state
        const newClass: Class = {
          id: result.data.id.toString(),
          classname: classForm.classname,
          classcode: classForm.classcode,
          capacity: classForm.capacity
        };
        
        setClasses(prevClasses => [...prevClasses, newClass]);
        setAddClassModalVisible(false);
        setClassForm(initialClassForm);
        
        // Show success message
        Alert.alert('Success', 'Class added successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to add class');
      }
    } catch (error: any) {
      console.error('Error in handleAddClass:', error);
      Alert.alert('Error', `Failed to add class: ${error.message}`);
    }
  };
  
  // Handle editing a class
  const handleEditClass = (classItem: Class) => {
    // Set the form data for editing
    setClassForm({
      classname: classItem.classname,
      classcode: classItem.classcode,
      capacity: classItem.capacity
    });
    
    // Set edit mode and ID
    setIsClassEditMode(true);
    setEditClassId(classItem.id);
    setAddClassModalVisible(true);
  };
  
  // Handle updating a class
  const handleUpdateClass = async () => {
    try {
      // Validate required fields
      if (!classForm.classname || !classForm.classcode) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      if (!editClassId) {
        Alert.alert('Error', 'Class ID not found');
        return;
      }
      
      // Update in database
      const result = await updateClassInDatabase(editClassId, {
        ...classForm
      });
      
      if (result.success) {
        // Update the class in local state
        setClasses(prevClasses => 
          prevClasses.map(cls => 
            cls.id === editClassId
              ? {
                  ...cls,
                  classname: classForm.classname,
                  classcode: classForm.classcode,
                  capacity: classForm.capacity
                }
              : cls
          )
        );
        
        // Reset form and close modal
        setAddClassModalVisible(false);
        setClassForm(initialClassForm);
        setIsClassEditMode(false);
        setEditClassId(null);
        
        // Show success message
        Alert.alert('Success', 'Class updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update class');
      }
    } catch (error: any) {
      console.error('Error in handleUpdateClass:', error);
      Alert.alert('Error', `Failed to update class: ${error.message}`);
    }
  };
  
  // Handle deleting a class
  const handleDeleteClass = (id: string) => {
    setDeleteClassId(id);
    setIsClassDeleteConfirmVisible(true);
  };
  
  // Confirm delete class
  const confirmDeleteClass = async () => {
    if (!deleteClassId) return;
    
    const success = await deleteClassFromDatabase(deleteClassId);
    
    if (success) {
      // Remove the class from local state
      setClasses(prevClasses => prevClasses.filter(cls => cls.id !== deleteClassId));
      
      // Reset state and close confirmation
      setDeleteClassId(null);
      setIsClassDeleteConfirmVisible(false);
      
      // Show success message
      Alert.alert('Success', 'Class deleted successfully');
    } else {
      Alert.alert('Error', 'Failed to delete class');
    }
  };
  
  // Cancel delete class
  const cancelDeleteClass = () => {
    setDeleteClassId(null);
    setIsClassDeleteConfirmVisible(false);
  };
  
  // Handle closing the class modal
  const handleClassModalClose = () => {
    setAddClassModalVisible(false);
    setClassForm(initialClassForm);
    setIsClassEditMode(false);
    setEditClassId(null);
  };
  
  // Handle class input changes
  const handleClassInputChange = (field: keyof typeof initialClassForm, value: any) => {
    setClassForm(prev => ({
      ...prev,
      [field]: field === 'capacity' ? value : value
    }));
  };
  
  // Handle class status change
  const handleClassStatusChange = (status: Class['status']) => {
    setClassForm(prev => ({
      ...prev,
      status
    }));
  };

  // Render class form
  const renderClassForm = () => (
    <Modal
      visible={addClassModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClassModalClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isClassEditMode ? 'Edit Class' : 'Add New Class'}
            </Text>
            <TouchableOpacity onPress={handleClassModalClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Class Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter class name"
                value={classForm.classname}
                onChangeText={(value) => handleClassInputChange('classname', value)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Class Code</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter class code"
                value={classForm.classcode}
                onChangeText={(value) => handleClassInputChange('classcode', value)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Capacity</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter capacity"
                value={classForm.capacity}
                onChangeText={(value) => handleClassInputChange('capacity', value)}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton} 
              onPress={handleClassModalClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={isClassEditMode ? handleUpdateClass : handleAddClass}
            >
              <Text style={styles.saveButtonText}>
                {isClassEditMode ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={styles.spacer} />
        </View>

      {/* Main Content */}
      {renderContent()}
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
            <TouchableOpacity 
          style={[styles.navItem, activeTab === 'dashboard' && styles.activeNavItem]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'dashboard' ? '#4dabf7' : '#666'}
          />
          <Text
            style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}
          >
            Dashboard
          </Text>
            </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'student' && styles.activeNavItem]}
          onPress={() => setActiveTab('student')}
        >
          <Ionicons
            name={activeTab === 'student' ? 'school' : 'school-outline'}
            size={24}
            color={activeTab === 'student' ? '#4dabf7' : '#666'}
          />
          <Text
            style={[styles.navText, activeTab === 'student' && styles.activeNavText]}
          >
            Student
          </Text>
            </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'lecturer' && styles.activeNavItem]}
          onPress={() => setActiveTab('lecturer')}
        >
          <Ionicons
            name={activeTab === 'lecturer' ? 'person' : 'person-outline'}
            size={24}
            color={activeTab === 'lecturer' ? '#4dabf7' : '#666'}
          />
          <Text
            style={[styles.navText, activeTab === 'lecturer' && styles.activeNavText]}
          >
            Lecturer
          </Text>
            </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'classes' && styles.activeNavItem]}
          onPress={() => setActiveTab('classes')}
        >
          <Ionicons
            name={activeTab === 'classes' ? 'grid' : 'grid-outline'}
            size={24}
            color={activeTab === 'classes' ? '#4dabf7' : '#666'}
          />
          <Text
            style={[styles.navText, activeTab === 'classes' && styles.activeNavText]}
          >
            Classes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'setting' && styles.activeNavItem]}
          onPress={() => setActiveTab('setting')}
        >
          <Ionicons
            name={activeTab === 'setting' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'setting' ? '#4dabf7' : '#666'}
          />
          <Text
            style={[styles.navText, activeTab === 'setting' && styles.activeNavText]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Menu */}
      {isMenuVisible && renderMenu()}

      {/* Render forms and modals */}
      {renderLecturerForm()}
      {renderClassForm()}
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#4dabf7',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  activeNavText: {
    color: '#4dabf7',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  passwordVisibilityButton: {
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#1a4b8e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  courseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  removeCourseButton: {
    padding: 5,
  },
  addCourseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addCourseText: {
    marginLeft: 8,
    color: '#4dabf7',
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusOptionSelected: {
    borderColor: '#1a4b8e',
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  statusTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1a4b8e',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1a4b8e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  lecturerItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4dabf7',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterChipSelected: {
    backgroundColor: '#1a4b8e',
  },
  filterChipText: {
    fontSize: 14,
    color: '#555',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  courseChip: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  courseChipText: {
    fontSize: 12,
    color: '#1a4b8e',
  },
  coursesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1a4b8e',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#1a4b8e',
    marginTop: 4,
    fontWeight: '500',
    marginBottom: 4,
  },
  studentContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  studentContactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  studentActions: {
    flexDirection: 'row',
  },
  lecturerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1a4b8e',
  },
  lecturerInfo: {
    flex: 1,
  },
  // Additional styles needed for the lecturer item
  lecturerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lecturerId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lecturerDepartment: {
    fontSize: 14,
    color: '#1a4b8e',
    marginTop: 2,
    fontWeight: '500',
  },
  courseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  lecturerActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  // Class related styles
  classCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1a4b8e',
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classCodeBadge: {
    backgroundColor: '#1a4b8e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classCodeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  classDepartment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  classDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  classDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classDetailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  capacityBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 4,
  },
  classCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  classActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f7ff',
    marginLeft: 8,
  },
  classActionText: {
    fontSize: 12,
    color: '#1a4b8e',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Additional styles
  deleteButton: {
    backgroundColor: '#fff0f0',
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1a4b8e',
  },
  menuItemText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 16,
  },
  activeMenuItemText: {
    color: '#1a4b8e',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1a4b8e',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#1a4b8e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollModalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    width: '48%',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  togglePasswordButton: {
    padding: 10,
  },
  studentCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  studentCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1a4b8e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmDialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelDeleteText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activeFilterChip: {
    backgroundColor: '#1a4b8e',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  classListContainer: {
    paddingBottom: 16,
  },
  settingsContainer: {
    paddingBottom: 30,
  },
  settingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  settingButtonText: {
    fontSize: 14,
    color: '#1a4b8e',
    marginRight: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
  },
  timeButton: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 6,
    borderRadius: 4,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#777',
  },
  selectedTimeText: {
    color: '#1a4b8e',
    fontWeight: 'bold',
  },
  languageButtons: {
    flexDirection: 'row',
  },
  languageButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 6,
    borderRadius: 4,
  },
  languageButtonText: {
    fontSize: 14,
    color: '#777',
  },
  selectedLanguageButton: {
    backgroundColor: '#1a4b8e',
    borderColor: '#1a4b8e',
  },
  selectedLanguageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeStatusButton: {
    backgroundColor: '#e6f9ee',
    borderColor: '#2ecc71',
  },
  activeStatusButtonText: {
    color: '#2ecc71',
    fontWeight: '500',
  },
  onLeaveStatusButton: {
    backgroundColor: '#fff8e6',
    borderColor: '#f39c12',
  },
  onLeaveStatusButtonText: {
    color: '#f39c12',
    fontWeight: '500',
  },
  inactiveStatusButton: {
    backgroundColor: '#ffe6e6',
    borderColor: '#e74c3c',
  },
  inactiveStatusButtonText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  // System info styles
  dangerButton: {
    backgroundColor: '#ffe6e6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  dangerButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Action styles
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButtonLarge: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f87171',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
  // Confirmation dialog styles
  confirmLogoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmLogoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  confirmLogoutMessage: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
  },
  confirmLogoutButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  lecturerContactInfo: {
    flexDirection: 'column',
    marginTop: 8,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  dashboardContainer: {
    paddingBottom: 30,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
    marginRight: 16,
  },
  statsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTextContainer: {
    alignItems: 'center',
  },
  statsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsTrendText: {
    fontSize: 12,
    color: '#2ecc71',
    marginLeft: 4,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  enrollmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enrollmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  enrollmentPeriod: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  enrollmentPeriodText: {
    fontSize: 12,
    color: '#666',
  },
  enrollmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enrollmentItemInfo: {
    flex: 1,
  },
  enrollmentItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  enrollmentItemCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  enrollmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enrollmentCount: {
    fontSize: 12,
    color: '#666',
  },
  enrollmentBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  enrollmentBarFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 4,
  },
  recentActivitiesCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  activityDesc: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  systemStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  systemStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  systemStatusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  systemStatusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  systemStatusText: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});

export default AdminScreen; 