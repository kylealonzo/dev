import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { getAttendanceReport, getCourses } from '../lib/api';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

export default function Reports() {
  const [fontsLoaded] = useFonts({
    'THEDISPLAYFONT': require('../assets/fonts/THEDISPLAYFONT-DEMOVERSION.ttf'),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleGenerateReport = (reportType: string) => {
    if (reportType === 'attendance') {
      setShowCourseModal(true);
    } else {
      setSelectedReport(reportType);
      setShowConfirmModal(true);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setShowCourseModal(false);
    setSelectedReport('attendance');
    setShowConfirmModal(true);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedReport) return;

    try {
      setIsGenerating(true);
      const data = await getAttendanceReport(selectedReport, selectedCourse || undefined);
      setReportData(data);
      setShowConfirmModal(false);

      if (selectedReport === 'attendance' && data.csvData) {
        await exportToCSV(data.csvData);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = async (csvData: string) => {
    try {
      const fileName = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Attendance Report',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing files.');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export CSV file. Please try again.');
    }
  };

  const handleManageUsers = () => {
    router.push('/manage-users');
  };

  const handleManageCourses = () => {
    router.push('/manage-courses');
  };

  const handleDashboard = () => {
    router.push('/admin-dashboard');
  };

  const reportTypes = [
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Generate comprehensive attendance reports for courses',
      icon: 'calendar',
      color: '#1a4b8e'
    },
    {
      id: 'student',
      title: 'Student Performance',
      description: 'View attendance statistics for individual students',
      icon: 'school',
      color: '#34C759'
    },
    {
      id: 'course',
      title: 'Course Analytics',
      description: 'Analyze attendance patterns across courses',
      icon: 'book',
      color: '#FF9500'
    },
    {
      id: 'lecturer',
      title: 'Lecturer Reports',
      description: 'Track lecturer attendance and course coverage',
      icon: 'person',
      color: '#5856D6'
    }
  ];

  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'home' as const,
      onPress: handleDashboard,
    },
    {
      id: 'users',
      title: 'Users',
      icon: 'people' as const,
      onPress: handleManageUsers,
    },
    {
      id: 'courses',
      title: 'Courses',
      icon: 'book' as const,
      onPress: handleManageCourses,
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'bar-chart' as const,
      onPress: () => setActiveTab('reports'),
    }
  ];

  if (!fontsLoaded) {
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
              <Text style={styles.logoSubtitle}>Report Generation</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {reportData ? (
          <View style={styles.reportContent}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{reportData.title}</Text>
              <Text style={styles.reportDate}>{reportData.date}</Text>
              {selectedCourse && (
                <Text style={styles.reportCourse}>
                  Course: {courses.find(c => c.id === selectedCourse)?.name || 'Unknown'}
                </Text>
              )}
            </View>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: reportData.labels,
                  datasets: [{
                    data: reportData.data
                  }]
                }}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(26, 75, 142, ${opacity})`,
                  style: {
                    borderRadius: 16
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>

            <View style={styles.statsContainer}>
              {reportData.stats.map((stat: any, index: number) => (
                <View key={index} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.exportButton]}
                onPress={() => reportData.csvData && exportToCSV(reportData.csvData)}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.newReportButton]}
                onPress={() => {
                  setReportData(null);
                  setSelectedCourse(null);
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Generate New Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.reportGrid}>
            {reportTypes.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleGenerateReport(report.id)}
              >
                <View style={[styles.reportIcon, { backgroundColor: report.color }]}>
                  <Ionicons name={report.icon as any} size={32} color="#fff" />
                </View>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={activeTab === item.id ? '#1a4b8e' : '#666'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === item.id && styles.activeNavLabel,
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="document-text" size={40} color="#1a4b8e" />
            </View>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to generate this report?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleConfirmGenerate}
                disabled={isGenerating}
                activeOpacity={0.8}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Generate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCourseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="book" size={40} color="#1a4b8e" />
            </View>
            <Text style={styles.modalTitle}>Select Course</Text>
            <Text style={styles.modalMessage}>
              Choose a course to generate the attendance report
            </Text>

            <ScrollView style={styles.courseList}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={styles.courseItem}
                  onPress={() => handleCourseSelect(course._id)}
                >
                  <Text style={styles.courseName}>{course.courseName}</Text>
                  <Text style={styles.courseCode}>{course.courseCode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCourseModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  reportCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginBottom: 8,
    textAlign: 'center',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 75, 142, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#666',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#1a4b8e',
    flex: 1,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportContent: {
    padding: 20,
  },
  reportHeader: {
    marginBottom: 24,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reportCourse: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4b8e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  newReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a4b8e',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  newReportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  exportButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  courseList: {
    maxHeight: 300,
    width: '100%',
    marginVertical: 16,
  },
  courseItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4b8e',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#666',
  },
}); 