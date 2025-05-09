import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Image, ImageBackground, FlatList, Dimensions, Animated, PanResponder } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { User, getUsers, createCourse, Course, getCourses, deleteCourse, updateCourse } from '../lib/api';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

interface ScheduleEntry {
  days: string[];
  startTime: string;
  endTime: string;
}

export default function ManageCourses() {
  const [fontsLoaded, fontError] = useFonts({
    'THEDISPLAYFONT': require('../assets/fonts/THEDISPLAYFONT-DEMOVERSION.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    lecturerId: '',
    schedules: [] as ScheduleEntry[],
  });
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<ScheduleEntry>({
    days: [],
    startTime: '',
    endTime: '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseId, setNewCourseId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [drawerHeight] = useState(new Animated.Value(0));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreCourses, setHasMoreCourses] = useState(true);
  const ITEMS_PER_PAGE = 20;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) { // Only allow dragging down
        drawerHeight.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        closeDrawer();
      } else {
        Animated.spring(drawerHeight, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  useEffect(() => {
    fetchLecturers();
    fetchCourses();
  }, []);

  const fetchLecturers = async () => {
    try {
      setIsLoading(true);
      const users = await getUsers();
      const lecturerUsers = users.filter(user => user.role === 'lecturer');
      setLecturers(lecturerUsers);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      setError('Failed to fetch lecturers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async (pageNumber = 1, shouldAppend = false) => {
    try {
      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const coursesData = await getCourses();
      
      if (shouldAppend) {
        // Filter out any potential duplicates before appending
        setCourses(prevCourses => {
          const existingIds = new Set(prevCourses.map(course => course._id));
          const newCourses = coursesData.filter((course: Course) => !existingIds.has(course._id));
          return [...prevCourses, ...newCourses];
        });
      } else {
        // For fresh loads, just set the data directly
        setCourses(coursesData);
      }

      // Check if we have more courses to load
      setHasMoreCourses(coursesData.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.spring(drawerHeight, {
      toValue: screenHeight * 0.9,
      useNativeDriver: false,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsDrawerOpen(false);
      setFormData({
        courseCode: '',
        courseName: '',
        description: '',
        lecturerId: '',
        schedules: [],
      });
      setSelectedCourse(null);
    });
  };

  const handleAddCourse = () => {
    setError(null);
    setFormData({
      courseCode: '',
      courseName: '',
      description: '',
      lecturerId: '',
      schedules: [],
    });
    openDrawer();
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description,
      lecturerId: course.lecturerId?._id || '',
      schedules: course.schedules,
    });
    openDrawer();
  };

  const handleDeletePress = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCourse(courseToDelete._id);
      setSuccessMessage('Course deleted successfully!');
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete course');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedCourse) {
      setShowEditConfirm(true);
    } else {
      await saveCourse();
    }
  };

  const handleConfirmEdit = async () => {
    setShowEditConfirm(false);
    await saveCourse();
  };

  const saveCourse = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.courseCode || !formData.courseName || !formData.lecturerId || formData.schedules.length === 0) {
        setError('Course code, name, lecturer, and at least one schedule are required');
        return;
      }

      let updatedCourse;
      if (selectedCourse) {
        // Update existing course
        const lecturer = lecturers.find(l => l._id === formData.lecturerId);
        const courseData = {
          ...formData,
          lecturerId: lecturer ? {
            _id: lecturer._id,
            firstName: lecturer.firstName,
            lastName: lecturer.lastName
          } : undefined
        };
        updatedCourse = await updateCourse(selectedCourse._id, courseData);
        setSuccessMessage('Course updated successfully!');
      } else {
        // Create new course
        updatedCourse = await createCourse(formData);
        setSuccessMessage('Course added successfully!');
      }

      // Refresh the course list
      await fetchCourses();

      // Set new course ID for highlighting
      setNewCourseId(updatedCourse._id);

      // Reset form and close modal
      setShowModal(false);
      setSelectedCourse(null);
      setFormData({
        courseCode: '',
        courseName: '',
        description: '',
        lecturerId: '',
        schedules: [],
      });

      // Scroll to the course after a short delay
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error saving course:', error);
      setError(error instanceof Error ? error.message : 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeInput = (text: string) => {
    // Remove any non-numeric characters
    const numbers = text.replace(/[^0-9]/g, '');
    
    // Format as HH:MM
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  const validateTime = (time: string) => {
    if (!time) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (hours < 0 || hours > 23) return false;
    if (minutes < 0 || minutes > 59) return false;
    
    return true;
  };

  const handleAddSchedule = () => {
    if (newSchedule.days.length === 0) {
      setError('Please select at least one day');
      return;
    }

    if (!validateTime(newSchedule.startTime) || !validateTime(newSchedule.endTime)) {
      setError('Please enter valid start and end times');
      return;
    }

    // Validate that end time is after start time
    const [startHours, startMinutes] = newSchedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = newSchedule.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      setError('End time must be after start time');
      return;
    }

    setFormData({
      ...formData,
      schedules: [...formData.schedules, newSchedule],
    });
    setNewSchedule({
      days: [],
      startTime: '',
      endTime: '',
    });
    setShowScheduleModal(false);
    setError(null);
  };

  const handleRemoveSchedule = (index: number) => {
    const updatedSchedules = [...formData.schedules];
    updatedSchedules.splice(index, 1);
    setFormData({
      ...formData,
      schedules: updatedSchedules,
    });
  };

  const handleAssignStudents = (course: Course) => {
    // Store the current page before navigation
    const currentPage = page;
    
    // Navigate to assign students
    router.push(`/assign-students?courseId=${course._id}`);
    
    // When returning, we'll refresh the list through the focus effect
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear highlight after 2 seconds
  useEffect(() => {
    if (newCourseId) {
      const timer = setTimeout(() => {
        setNewCourseId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [newCourseId]);

  const generateUniqueKey = (prefix: string, id: string, index?: number) => {
    return `${prefix}-${id}${index !== undefined ? `-${index}` : ''}`;
  };

  const renderCourseCard = ({ item: course, index }: { item: Course; index: number }) => (
    <View 
      key={generateUniqueKey('course', course._id, index)}
      style={[
        styles.courseCard,
        newCourseId === course._id && styles.highlightedCard
      ]}
    >
      <View style={styles.courseHeader}>
        <View style={styles.courseTitleSection}>
          <Text style={styles.courseCode}>{course.courseCode}</Text>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.courseName}</Text>
        </View>
        <View style={styles.courseActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditCourse(course)}
          >
            <Ionicons name="create-outline" size={20} color="#1a73e8" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.assignButton]}
            onPress={() => handleAssignStudents(course)}
          >
            <Ionicons name="people-outline" size={20} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePress(course)}
            disabled={isDeleting}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.courseInfo}>
        <View style={styles.instructorSection}>
          <Ionicons name="person-circle-outline" size={20} color="#666" />
          <Text style={styles.instructorText}>
            {course.lecturerId ? `${course.lecturerId.firstName} ${course.lecturerId.lastName}` : 'Not assigned'}
          </Text>
        </View>

        <View style={styles.schedulesContainer}>
          {course.schedules.map((schedule, scheduleIndex) => (
            <View 
              key={generateUniqueKey('schedule', course._id, scheduleIndex)} 
              style={styles.scheduleItem}
            >
              <View style={styles.scheduleTime}>
                <Ionicons name="time-outline" size={16} color="#1a73e8" />
                <Text style={styles.timeText}>{schedule.startTime} - {schedule.endTime}</Text>
              </View>
              <View style={styles.scheduleDays}>
                {schedule.days.map((day, dayIndex) => (
                  <View key={dayIndex} style={styles.dayPill}>
                    <Text style={styles.dayText}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={48} color="#ccc" />
      <Text style={styles.emptyStateText}>No courses found</Text>
    </View>
  );

  const renderListHeader = () => (
    <>
      <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Course</Text>
      </TouchableOpacity>

      {successMessage && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
    </>
  );

  const renderDrawer = () => (
    <Animated.View
      style={[
        styles.drawer,
        {
          height: drawerHeight,
        },
      ]}
    >
      <View style={styles.drawerHeader} {...panResponder.panHandlers}>
        <View style={styles.drawerHandle} />
        <Text style={styles.drawerTitle}>
          {selectedCourse ? 'Edit Course' : 'Add New Course'}
        </Text>
        <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#002147" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.drawerContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={24} color="#1a73e8" />
            <Text style={styles.sectionTitle}>Course Information</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Course Code</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="code-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.courseCode}
                onChangeText={(text) => setFormData({ ...formData, courseCode: text })}
                placeholder="Enter course code"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Course Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="school-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.courseName}
                onChangeText={(text) => setFormData({ ...formData, courseName: text })}
                placeholder="Enter course name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter course description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color="#1a73e8" />
            <Text style={styles.sectionTitle}>Lecturer</Text>
          </View>
          <TouchableOpacity
            style={styles.selectContainer}
            onPress={() => setShowLecturerModal(true)}
          >
            <View style={styles.selectContent}>
              <Ionicons name="person-circle-outline" size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.selectText}>
                {formData.lecturerId
                  ? lecturers.find(l => l._id === formData.lecturerId)?.firstName + ' ' + lecturers.find(l => l._id === formData.lecturerId)?.lastName
                  : 'Select lecturer'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color="#1a73e8" />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
          <View style={styles.scheduleContainer}>
            {formData.schedules.map((schedule, index) => (
              <View 
                key={generateUniqueKey('form-schedule', `schedule-${index}`, index)} 
                style={styles.scheduleItem}
              >
                <View style={styles.scheduleInfo}>
                  <Ionicons name="calendar" size={16} color="#1a73e8" />
                  <Text style={styles.scheduleText}>
                    {schedule.days.join(', ')} {schedule.startTime}-{schedule.endTime}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveSchedule(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addScheduleButton}
              onPress={() => setShowScheduleModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.addScheduleButtonText}>Add Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.drawerButtons}>
          <TouchableOpacity
            style={[styles.drawerButton, styles.cancelButton]}
            onPress={closeDrawer}
          >
            <Ionicons name="close" size={20} color="#666" style={styles.buttonIcon} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.drawerButton, styles.saveButton]}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

  // Add Lecturer Selection Modal
  const renderLecturerModal = () => (
    <Modal
      visible={showLecturerModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLecturerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Lecturer</Text>
            <TouchableOpacity onPress={() => setShowLecturerModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            {lecturers.map((lecturer) => (
              <TouchableOpacity
                key={generateUniqueKey('lecturer', lecturer._id)}
                style={[
                  styles.modalItem,
                  formData.lecturerId === lecturer._id && styles.selectedItem
                ]}
                onPress={() => {
                  setFormData({ ...formData, lecturerId: lecturer._id });
                  setShowLecturerModal(false);
                }}
              >
                <View style={styles.lecturerInfo}>
                  <Ionicons name="person-circle" size={24} color="#1a73e8" />
                  <View style={styles.lecturerDetails}>
                    <Text style={styles.lecturerName}>
                      {lecturer.firstName} {lecturer.lastName}
                    </Text>
                    <Text style={styles.lecturerEmail}>{lecturer.email}</Text>
                  </View>
                </View>
                {formData.lecturerId === lecturer._id && (
                  <Ionicons name="checkmark-circle" size={24} color="#1a73e8" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Add Schedule Modal
  const renderScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowScheduleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Schedule</Text>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleForm}>
            <Text style={styles.inputLabel}>Days</Text>
            <View style={styles.daysContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <TouchableOpacity
                  key={generateUniqueKey('day', day)}
                  style={[
                    styles.dayButton,
                    newSchedule.days.includes(day) && styles.selectedDay
                  ]}
                  onPress={() => {
                    const updatedDays = newSchedule.days.includes(day)
                      ? newSchedule.days.filter(d => d !== day)
                      : [...newSchedule.days, day];
                    setNewSchedule({ ...newSchedule, days: updatedDays });
                  }}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      newSchedule.days.includes(day) && styles.selectedDayText
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={newSchedule.startTime}
                    onChangeText={(text) => {
                      const formattedTime = formatTimeInput(text);
                      setNewSchedule({ ...newSchedule, startTime: formattedTime });
                    }}
                    placeholder="HH:MM"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                {newSchedule.startTime && !validateTime(newSchedule.startTime) && (
                  <Text style={styles.errorText}>Invalid time format</Text>
                )}
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>End Time</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={newSchedule.endTime}
                    onChangeText={(text) => {
                      const formattedTime = formatTimeInput(text);
                      setNewSchedule({ ...newSchedule, endTime: formattedTime });
                    }}
                    placeholder="HH:MM"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                {newSchedule.endTime && !validateTime(newSchedule.endTime) && (
                  <Text style={styles.errorText}>Invalid time format</Text>
                )}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (!validateTime(newSchedule.startTime) || !validateTime(newSchedule.endTime)) && styles.disabledButton
                ]}
                onPress={handleAddSchedule}
                disabled={!validateTime(newSchedule.startTime) || !validateTime(newSchedule.endTime)}
              >
                <Text style={styles.saveButtonText}>Add Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Add this function to handle refresh
  const handleRefresh = async () => {
    setPage(1);
    setHasMoreCourses(true);
    await fetchCourses(1, false);
  };

  // Add this function to handle load more
  const handleLoadMore = async () => {
    if (!isLoadingMore && hasMoreCourses) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchCourses(nextPage, true);
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={32} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.logoTitle}>ATTENDANCE</Text>
              <Text style={styles.logoSubtitle}>Course Management</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#1a4b8e" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            renderItem={renderCourseCard}
            keyExtractor={(item, index) => generateUniqueKey('course', item._id, index)}
            contentContainerStyle={styles.courseList}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 220,
              offset: 220 * index,
              index,
            })}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={isLoading && page === 1}
            onRefresh={handleRefresh}
            ListFooterComponent={() => (
              isLoadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#1a4b8e" />
                  <Text style={styles.loadingMoreText}>Loading more courses...</Text>
                </View>
              ) : null
            )}
          />
        )}
      </View>

      {isDrawerOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={closeDrawer}
          />
          {renderDrawer()}
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.confirmModal]}>
            <View style={styles.confirmHeader}>
              <Ionicons name="warning" size={48} color="#dc3545" />
              <Text style={styles.confirmTitle}>Delete Course</Text>
            </View>
            
            <Text style={styles.confirmText}>
              Are you sure you want to delete{'\n'}
              <Text style={styles.confirmHighlight}>
                {courseToDelete?.courseName} ({courseToDelete?.courseCode})
              </Text>?
              {'\n'}This action cannot be undone.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelConfirmButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setCourseToDelete(null);
                }}
                disabled={isDeleting}
              >
                <Text style={styles.cancelConfirmText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Confirmation Modal */}
      <Modal
        visible={showEditConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.confirmModal]}>
            <View style={styles.confirmHeader}>
              <Ionicons name="warning" size={48} color="#1a73e8" />
              <Text style={styles.confirmTitle}>Confirm Edit</Text>
            </View>
            
            <Text style={styles.confirmText}>
              Are you sure you want to update{'\n'}
              <Text style={styles.confirmHighlight}>
                {selectedCourse?.courseName} ({selectedCourse?.courseCode})
              </Text>?
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelConfirmButton]}
                onPress={() => {
                  setShowEditConfirm(false);
                }}
                disabled={isSaving}
              >
                <Text style={styles.cancelConfirmText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.saveConfirmButton]}
                onPress={handleConfirmEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveConfirmText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderLecturerModal()}
      {renderScheduleModal()}

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/admin-dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={24} color="#666" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/manage-users')}
          activeOpacity={0.7}
        >
          <Ionicons name="people" size={24} color="#666" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Ionicons name="book" size={24} color="#1a4b8e" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Courses</Text>
        </TouchableOpacity>
      </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonText: {
    color: '#1a4b8e',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  courseList: {
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
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
    marginBottom: 16,
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
  courseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  editButton: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  assignButton: {
    backgroundColor: '#e6f4ea',
    borderColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#fce8e6',
    borderColor: '#F44336',
  },
  courseInfo: {
    gap: 12,
  },
  instructorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  instructorText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  schedulesContainer: {
    gap: 8,
  },
  scheduleItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#1a73e8',
    marginLeft: 8,
    fontWeight: '600',
  },
  scheduleDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayPill: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '600',
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#1a4b8e',
    transform: [{ scale: 1.02 }],
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
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
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingMoreText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    paddingBottom: 80,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  drawerHandle: {
    position: 'absolute',
    top: 12,
    width: 48,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
  },
  drawerContent: {
    padding: 24,
    paddingBottom: 100,
  },
  formSection: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a4b8e',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1a4b8e',
    marginBottom: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  drawerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingBottom: 24,
    gap: 16,
    position: 'relative',
    zIndex: 1,
  },
  drawerButton: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#1a4b8e',
    elevation: 4,
    shadowColor: '#1a4b8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  scheduleContainer: {
    gap: 12,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  removeButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a4b8e',
    padding: 18,
    borderRadius: 16,
    marginTop: 12,
    elevation: 4,
    shadowColor: '#1a4b8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addScheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#f0f7ff',
  },
  lecturerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lecturerDetails: {
    flex: 1,
  },
  lecturerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  lecturerEmail: {
    fontSize: 14,
    color: '#666',
  },
  scheduleForm: {
    padding: 24,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  dayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedDay: {
    backgroundColor: '#1a4b8e',
    borderColor: '#1a4b8e',
    shadowColor: '#1a4b8e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dayButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  timeInput: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 16,
    color: '#1a4b8e',
    marginBottom: 12,
    fontWeight: '600',
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeInputField: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalCancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalSaveButton: {
    backgroundColor: '#1a4b8e',
    shadowColor: '#1a4b8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelText: {
    color: '#666',
  },
  modalSaveText: {
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  confirmModal: {
    padding: 24,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  confirmText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  confirmHighlight: {
    fontWeight: 'bold',
    color: '#1a4b8e',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc3545',
  },
  saveConfirmButton: {
    backgroundColor: '#1a4b8e',
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelConfirmText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeNavLabel: {
    color: '#1a4b8e',
    fontWeight: '600',
  },
}); 