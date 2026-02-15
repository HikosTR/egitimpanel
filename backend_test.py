#!/usr/bin/env python3
"""
ProFit Team Education Platform - Backend API Test Suite
Tests all API endpoints with Super Admin and Distributor flows
"""

import requests
import sys
import json
import time
from datetime import datetime, timezone

class ProFitAPITester:
    def __init__(self, base_url="https://profit-edu.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.super_admin_token = None
        self.distributor_token = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Store created IDs for cleanup/testing
        self.created_user_id = None
        self.created_course_id = None
        self.created_module_id = None
        self.created_video_id = None
        self.created_quiz_id = None
        self.assignment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    headers.pop('Content-Type', None)  # Let requests handle it for files
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASS - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAIL - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json() if response.text else {}
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}
                
        except Exception as e:
            print(f"❌ FAIL - Error: {str(e)}")
            return False, {}

    def test_super_admin_login(self):
        """Test Super Admin login"""
        print("\n" + "="*60)
        print("TESTING SUPER ADMIN LOGIN")
        print("="*60)
        
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "admin@profitteam.tr", "password": "19901990Aa."}
        )
        
        if success and 'token' in response:
            self.super_admin_token = response['token']
            print(f"✅ Super Admin token obtained")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "/auth/me",
            200,
            token=self.super_admin_token
        )
        if success:
            print(f"✅ User info: {response.get('full_name')} ({response.get('role')})")
        return success

    def test_dashboard_reports(self):
        """Test dashboard metrics"""
        print("\n" + "="*60)
        print("TESTING DASHBOARD & REPORTS")
        print("="*60)
        
        success, response = self.run_test(
            "Dashboard Reports",
            "GET",
            "/reports/dashboard",
            200,
            token=self.super_admin_token
        )
        if success:
            print(f"✅ Dashboard metrics: {response.get('total_distributors')} distributors, {response.get('total_courses')} courses")
        return success

    def test_user_management(self):
        """Test complete user management flow"""
        print("\n" + "="*60)
        print("TESTING USER MANAGEMENT")
        print("="*60)
        
        # Test creating a distributor
        test_user_data = {
            "email": "test@test.com",
            "password": "Test123!",
            "full_name": "Test Distributor",
            "role": "distributor"
        }
        
        success, response = self.run_test(
            "Create Distributor User",
            "POST",
            "/users",
            200,
            data=test_user_data,
            token=self.super_admin_token
        )
        
        if success and 'id' in response:
            self.created_user_id = response['id']
            print(f"✅ Created user with ID: {self.created_user_id}")
        else:
            return False
        
        # Test listing users
        success, response = self.run_test(
            "List All Users",
            "GET",
            "/users",
            200,
            token=self.super_admin_token
        )
        
        if success:
            user_count = len(response) if isinstance(response, list) else 0
            print(f"✅ Found {user_count} users")
        
        # Test getting specific user
        success, response = self.run_test(
            "Get Specific User",
            "GET",
            f"/users/{self.created_user_id}",
            200,
            token=self.super_admin_token
        )
        
        return success

    def test_distributor_login(self):
        """Test distributor login"""
        print("\n" + "="*60)
        print("TESTING DISTRIBUTOR LOGIN")
        print("="*60)
        
        success, response = self.run_test(
            "Distributor Login",
            "POST",
            "/auth/login",
            200,
            data={"email": "test@test.com", "password": "Test123!"}
        )
        
        if success and 'token' in response:
            self.distributor_token = response['token']
            print(f"✅ Distributor token obtained")
            return True
        return False

    def test_course_management(self):
        """Test complete course management flow"""
        print("\n" + "="*60)
        print("TESTING COURSE MANAGEMENT")
        print("="*60)
        
        # Test creating a course
        course_data = {
            "title": "Test Leadership Course",
            "description": "A comprehensive leadership training course",
            "thumbnail": "https://example.com/thumb.jpg",
            "passing_rate": 80
        }
        
        success, response = self.run_test(
            "Create Course",
            "POST",
            "/courses",
            200,
            data=course_data,
            token=self.super_admin_token
        )
        
        if success and 'id' in response:
            self.created_course_id = response['id']
            print(f"✅ Created course with ID: {self.created_course_id}")
        else:
            return False
        
        # Test listing courses
        success, response = self.run_test(
            "List All Courses",
            "GET",
            "/courses",
            200,
            token=self.super_admin_token
        )
        
        # Test getting specific course
        success, response = self.run_test(
            "Get Course Details",
            "GET",
            f"/courses/{self.created_course_id}",
            200,
            token=self.super_admin_token
        )
        
        return success

    def test_module_management(self):
        """Test module creation and management"""
        print("\n" + "="*60)
        print("TESTING MODULE MANAGEMENT")
        print("="*60)
        
        # Create a module in the course
        module_data = {
            "title": "Introduction Module",
            "description": "Introduction to leadership principles",
            "order": 1
        }
        
        success, response = self.run_test(
            "Create Module",
            "POST",
            f"/courses/{self.created_course_id}/modules",
            200,
            data=module_data,
            token=self.super_admin_token
        )
        
        if success and 'id' in response:
            self.created_module_id = response['id']
            print(f"✅ Created module with ID: {self.created_module_id}")
        else:
            return False
        
        # List modules for the course
        success, response = self.run_test(
            "List Course Modules",
            "GET",
            f"/courses/{self.created_course_id}/modules",
            200,
            token=self.super_admin_token
        )
        
        return success

    def test_video_management(self):
        """Test video creation and management"""
        print("\n" + "="*60)
        print("TESTING VIDEO MANAGEMENT")
        print("="*60)
        
        # Create a video in the module
        video_data = {
            "title": "Leadership Fundamentals",
            "description": "Basic principles of effective leadership",
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "video_type": "youtube",
            "order": 1,
            "duration": 300
        }
        
        success, response = self.run_test(
            "Create Video",
            "POST",
            f"/modules/{self.created_module_id}/videos",
            200,
            data=video_data,
            token=self.super_admin_token
        )
        
        if success and 'id' in response:
            self.created_video_id = response['id']
            print(f"✅ Created video with ID: {self.created_video_id}")
            return True
        else:
            return False

    def test_quiz_management(self):
        """Test quiz creation and management"""
        print("\n" + "="*60)
        print("TESTING QUIZ MANAGEMENT")
        print("="*60)
        
        # Create a quiz for the video
        quiz_data = {
            "passing_rate": 80,
            "questions": [
                {
                    "question": "What is the most important quality of a leader?",
                    "options": ["Intelligence", "Communication", "Experience", "Charisma"],
                    "correct_answer": 1
                },
                {
                    "question": "Which leadership style is most effective?",
                    "options": ["Autocratic", "Democratic", "Laissez-faire", "Situational"],
                    "correct_answer": 3
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Quiz",
            "POST",
            f"/videos/{self.created_video_id}/quiz",
            200,
            data=quiz_data,
            token=self.super_admin_token
        )
        
        if success and 'id' in response:
            self.created_quiz_id = response['id']
            print(f"✅ Created quiz with ID: {self.created_quiz_id}")
        else:
            return False
        
        # Get the quiz
        success, response = self.run_test(
            "Get Video Quiz",
            "GET",
            f"/videos/{self.created_video_id}/quiz",
            200,
            token=self.super_admin_token
        )
        
        return success

    def test_course_assignment(self):
        """Test assigning course to distributor"""
        print("\n" + "="*60)
        print("TESTING COURSE ASSIGNMENT")
        print("="*60)
        
        # Assign the course to the distributor
        assignment_data = {
            "user_id": self.created_user_id,
            "course_id": self.created_course_id
        }
        
        success, response = self.run_test(
            "Assign Course to Distributor",
            "POST",
            "/assignments",
            200,
            data=assignment_data,
            token=self.super_admin_token
        )
        
        if success and 'id' in response:
            self.assignment_id = response['id']
            print(f"✅ Created assignment with ID: {self.assignment_id}")
        else:
            return False
        
        # List assignments
        success, response = self.run_test(
            "List Assignments",
            "GET",
            "/assignments",
            200,
            token=self.super_admin_token
        )
        
        return success

    def test_distributor_course_access(self):
        """Test distributor accessing assigned course"""
        print("\n" + "="*60)
        print("TESTING DISTRIBUTOR COURSE ACCESS")
        print("="*60)
        
        # Test distributor can see assigned courses
        success, response = self.run_test(
            "Distributor List Courses",
            "GET",
            "/courses",
            200,
            token=self.distributor_token
        )
        
        if success:
            course_count = len(response) if isinstance(response, list) else 0
            print(f"✅ Distributor can see {course_count} assigned courses")
        
        # Test distributor can access specific course
        success, response = self.run_test(
            "Distributor Get Course Detail",
            "GET",
            f"/courses/{self.created_course_id}",
            200,
            token=self.distributor_token
        )
        
        return success

    def test_progress_tracking(self):
        """Test progress tracking system"""
        print("\n" + "="*60)
        print("TESTING PROGRESS TRACKING")
        print("="*60)
        
        # Mark video as complete
        progress_data = {"video_id": self.created_video_id}
        
        success, response = self.run_test(
            "Mark Video Complete",
            "POST",
            "/progress/video-complete",
            200,
            data=progress_data,
            token=self.distributor_token
        )
        
        if not success:
            return False
        
        # Submit quiz attempt
        quiz_submission = {
            "answers": {
                "0": 1,  # Communication (correct)
                "1": 3   # Situational (correct)
            }
        }
        
        success, response = self.run_test(
            "Submit Quiz",
            "POST",
            f"/quizzes/{self.created_quiz_id}/submit",
            200,
            data=quiz_submission,
            token=self.distributor_token
        )
        
        if success:
            score = response.get('score', 0)
            passed = response.get('passed', False)
            print(f"✅ Quiz result: {score}% (Passed: {passed})")
        
        # Get course progress
        success, response = self.run_test(
            "Get Course Progress",
            "GET",
            f"/progress/course/{self.created_course_id}",
            200,
            token=self.distributor_token
        )
        
        if success:
            percentage = response.get('percentage', 0)
            print(f"✅ Course progress: {percentage}%")
        
        return success

    def test_user_reports(self):
        """Test user reporting functionality"""
        print("\n" + "="*60)
        print("TESTING USER REPORTS")
        print("="*60)
        
        # Get user progress report
        success, response = self.run_test(
            "Get User Progress Report",
            "GET",
            f"/progress/user/{self.created_user_id}",
            200,
            token=self.super_admin_token
        )
        
        # Get detailed user report
        success, response = self.run_test(
            "Get Detailed User Report",
            "GET",
            f"/reports/user/{self.created_user_id}",
            200,
            token=self.super_admin_token
        )
        
        return success

    def test_certificates(self):
        """Test certificate functionality"""
        print("\n" + "="*60)
        print("TESTING CERTIFICATES")
        print("="*60)
        
        # Get user certificates (might be empty if course not fully completed)
        success, response = self.run_test(
            "Get User Certificates",
            "GET",
            f"/certificates/user/{self.created_user_id}",
            200,
            token=self.super_admin_token
        )
        
        return success

    def cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*60)
        print("CLEANUP - Removing Test Data")
        print("="*60)
        
        # Remove assignment
        if self.assignment_id:
            self.run_test(
                "Remove Assignment",
                "DELETE",
                f"/assignments/{self.assignment_id}",
                200,
                token=self.super_admin_token
            )
        
        # Remove course (this should cascade delete modules, videos, quizzes)
        if self.created_course_id:
            self.run_test(
                "Delete Test Course",
                "DELETE",
                f"/courses/{self.created_course_id}",
                200,
                token=self.super_admin_token
            )
        
        # Remove user
        if self.created_user_id:
            self.run_test(
                "Delete Test User",
                "DELETE",
                f"/users/{self.created_user_id}",
                200,
                token=self.super_admin_token
            )

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting ProFit Team Education Platform Backend API Tests")
        print(f"🔗 Testing API: {self.base_url}")
        print("="*80)
        
        try:
            # Core authentication and setup tests
            if not self.test_super_admin_login():
                print("❌ CRITICAL: Super Admin login failed. Stopping tests.")
                return False
                
            if not self.test_auth_me():
                print("❌ CRITICAL: Auth verification failed. Stopping tests.")
                return False
            
            # Dashboard and reports
            self.test_dashboard_reports()
            
            # User management flow
            if not self.test_user_management():
                print("❌ CRITICAL: User management failed. Stopping tests.")
                return False
            
            if not self.test_distributor_login():
                print("❌ CRITICAL: Distributor login failed. Stopping tests.")
                return False
            
            # Course management flow
            if not self.test_course_management():
                print("❌ CRITICAL: Course management failed. Stopping tests.")
                return False
                
            if not self.test_module_management():
                print("❌ CRITICAL: Module management failed. Stopping tests.")
                return False
                
            if not self.test_video_management():
                print("❌ CRITICAL: Video management failed. Stopping tests.")
                return False
                
            if not self.test_quiz_management():
                print("❌ CRITICAL: Quiz management failed. Stopping tests.")
                return False
            
            # Assignment and access tests
            if not self.test_course_assignment():
                print("❌ CRITICAL: Course assignment failed. Stopping tests.")
                return False
                
            if not self.test_distributor_course_access():
                print("❌ CRITICAL: Distributor course access failed. Stopping tests.")
                return False
            
            # Progress tracking and learning flow
            if not self.test_progress_tracking():
                print("❌ WARNING: Progress tracking has issues but continuing...")
            
            # Reporting functionality
            self.test_user_reports()
            self.test_certificates()
            
            return True
            
        finally:
            # Always cleanup
            self.cleanup()

    def print_results(self):
        """Print final test results"""
        print("\n" + "="*80)
        print("🏁 TEST RESULTS SUMMARY")
        print("="*80)
        print(f"📊 Total Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Backend API is fully functional.")
        elif self.tests_passed / self.tests_run >= 0.8:
            print("⚠️  Most tests passed. Minor issues detected.")
        else:
            print("🚨 CRITICAL ISSUES DETECTED. Backend needs attention.")
        
        return self.tests_passed == self.tests_run


def main():
    """Main test execution"""
    tester = ProFitAPITester()
    
    success = tester.run_all_tests()
    all_passed = tester.print_results()
    
    # Return appropriate exit code
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())