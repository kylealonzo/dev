import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Animated, Dimensions, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User, Course, getUsers, updateCourse, getCourses } from '../lib/api';

const ITEMS_PER_PAGE = 50;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const { width } = Dimensions.get('window');

// Header Component
const Header = ({ onBack }: { onBack: () => void }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={32} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>A</Text>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.logoTitle}>ATTENDANCE</Text>
          <Text style={styles.logoSubtitle}>Student Assignment</Text>
        </View>
      </View>
    </View>
  </View>
);

// Course Card Component
const CourseCard = ({ course, studentCount }: { course: Course; studentCount: number }) => (
  <View style={styles.courseCard}>
    <View style={styles.courseHeader}>
      <View style={styles.courseTitleSection}>
        <Text style={styles.courseCode}>{course.courseCode}</Text>
        <Text style={styles.courseTitle}>{course.courseName}</Text>
      </View>
      <View style={styles.courseStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color="#1a73e8" />
          <Text style={styles.statText}>{studentCount} Students</Text>
        </View>
      </View>
    </View>
  </View>
);

// Search Bar Component
const SearchBar = ({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) => (
  <View style={styles.searchSection}>
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search students by name or ID number..."
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
      />
      {value ? (
        <TouchableOpacity 
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

// Student Item Component
const StudentItem = ({ 
  student, 
  isSelected, 
  onToggle 
}: { 
  student: User; 
  isSelected: boolean; 
  onToggle: () => void;
}) => (
  <TouchableOpacity
    style={[styles.studentItem, isSelected && styles.selectedStudent]}
    onPress={onToggle}
  >
    <View style={styles.studentInfo}>
      <View style={styles.studentHeader}>
        <Text style={styles.studentId}>{student.idNumber}</Text>
        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#4caf50" />}
      </View>
      <Text style={[styles.studentName, isSelected && styles.selectedStudentText]}>
        {student.lastName}, {student.firstName}
      </Text>
    </View>
    <TouchableOpacity
      style={[styles.actionButton, isSelected ? styles.removeButton : styles.addButton]}
      onPress={onToggle}
    >
      <Ionicons 
        name={isSelected ? 'remove' : 'add'} 
        size={24} 
        color="#fff" 
      />
    </TouchableOpacity>
  </TouchableOpacity>
);

// Success Message Component
const SuccessMessage = ({ message }: { message: string }) => (
  <View style={styles.successContainer}>
    <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
    <Text style={styles.successText}>{message}</Text>
  </View>
);

// Save Button Component
const SaveButton = ({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }) => (
  <View style={styles.footer}>
    <TouchableOpacity
      style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

export default function AssignStudents() {
  const params = useLocalSearchParams();
  const courseId = params.courseId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      (student.lastName.toLowerCase() + ', ' + student.firstName.toLowerCase())
        .includes(searchQuery.toLowerCase()) ||
      student.idNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [students, searchQuery]);

  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredStudents, page]);

  useEffect(() => {
    fetchStudents();
    fetchCourse();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchStudents = async () => {
    try {
      const users = await getUsers();
      const studentUsers = users.filter(user => user.role === 'student');
      setStudents(studentUsers);
      setHasMore(studentUsers.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students. Please try again.');
    }
  };

  const fetchCourse = async () => {
    try {
      const courses = await getCourses();
      const course = courses.find((c: Course) => c._id === courseId);
      if (course) {
        setCurrentCourse(course);
        setSelectedStudents(course.students || []);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to fetch course details.');
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
      setHasMore(filteredStudents.length > page * ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, filteredStudents.length, page]);

  const handleSaveAssignments = async () => {
    if (!currentCourse) return;

    try {
      setIsLoading(true);
      await updateCourse(currentCourse._id, {
        ...currentCourse,
        students: selectedStudents
      });
      setSuccessMessage('Students assigned successfully!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error assigning students:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStudent = useCallback((studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const renderStudentItem = useCallback(({ item: student }: { item: User }) => (
    <StudentItem
      student={student}
      isSelected={selectedStudents.includes(student._id)}
      onToggle={() => handleToggleStudent(student._id)}
    />
  ), [selectedStudents, handleToggleStudent]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="people" size={48} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'No students found matching your search'
          : 'No students available'}
      </Text>
    </View>
  ), [searchQuery]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#1a73e8" />
      </View>
    );
  }, [isLoadingMore]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
      </View>

      <Header onBack={() => router.back()} />

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {currentCourse && (
          <CourseCard 
            course={currentCourse} 
            studentCount={selectedStudents.length} 
          />
        )}

        {successMessage && <SuccessMessage message={successMessage} />}

        <SearchBar 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
        />

        <View style={styles.listContainer}>
          <FlatList
            data={paginatedStudents}
            renderItem={renderStudentItem}
            keyExtractor={item => item._id}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            style={styles.studentList}
            contentContainerStyle={styles.studentListContent}
          />
        </View>

        <SaveButton 
          onPress={handleSaveAssignments} 
          isLoading={isLoading} 
        />
      </Animated.View>
    </View>
  );
}

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
  header: {
    backgroundColor: 'transparent',
    padding: 20,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  headerTitleContainer: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  courseCode: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002147',
    lineHeight: 22,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  studentList: {
    flex: 1,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedStudent: {
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002147',
  },
  selectedStudentText: {
    color: '#1a73e8',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#4caf50',
  },
  removeButton: {
    backgroundColor: '#dc3545',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  studentListContent: {
    paddingBottom: 20,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    marginBottom: 80, // Space for the footer
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 