import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { 
  Users, 
  Book, 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3, 
  PieChart, 
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity
} from 'lucide-react';

const FacultyBatchProgress = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [progressStats, setProgressStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, problems, students

  useEffect(() => {
    const fetchBatchProgress = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/faculty/batches/${batchId}/progress`);
        console.log('Batch Progress Response:', response.data);
        if (response.data.success) {
          setBatch(response.data.batch);
          setProgressStats(response.data.progressStats);
          setProblems(response.data.problems);
        }
      } catch (error) {
        console.error('Error fetching batch progress:', error);
        toast.error('Failed to load batch progress');
        navigate('/faculty/batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchProgress();
  }, [batchId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/20 border-green-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'hard': return 'text-red-400 bg-red-900/20 border-red-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch || !progressStats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400">Batch not found</h2>
            <p className="text-gray-400 mt-2">You don't have access to this batch or it doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 ">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-16">
          <div className="flex items-center space-x-4">
            {/* Add this button for browser history back navigation */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            
            {/* Keep the existing direct navigation button */}
            <button
              onClick={() => navigate(`/faculty/batches/${batchId}`)}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <span>Batch Details</span>
            </button>
          </div>
        </div>

        {/* Batch Info Header */}
        <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-6 mb-8 border border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{batch.name}</h1>
              <div className="flex items-center space-x-6 text-blue-200">
                <div className="flex items-center space-x-2">
                  <Book size={18} />
                  <span>{batch.subject}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={18} />
                  <span>{progressStats.totalStudents} Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target size={18} />
                  <span>{progressStats.totalProblems} Problems</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Branch: {batch.branch}</div>
              <div className="text-sm text-blue-200">Semester: {batch.semester}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'problems', label: 'Problems Progress', icon: Book },
            { id: 'students', label: 'Students Progress', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overall Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-6 rounded-lg border border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Active Students</p>
                    <p className="text-2xl font-bold text-white">
                      {progressStats.overallProgress.studentsActive}/{progressStats.totalStudents}
                    </p>
                  </div>
                  <Activity className="text-blue-300" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-700 to-green-800 p-6 rounded-lg border border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Avg Completion Rate</p>
                    <p className="text-2xl font-bold text-white">{progressStats.overallProgress.averageCompletionRate}%</p>
                  </div>
                  <CheckCircle className="text-green-300" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-lg border border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm">Avg Score</p>
                    <p className="text-2xl font-bold text-white">{progressStats.overallProgress.averageScore}%</p>
                  </div>
                  <Award className="text-yellow-300" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg border border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm">Total Submissions</p>
                    <p className="text-2xl font-bold text-white">{progressStats.overallProgress.totalSubmissions}</p>
                  </div>
                  <BarChart3 className="text-purple-300" size={24} />
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">📊 Batch Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-blue-400">{progressStats.overallProgress.studentsActive}</div>
                  <div className="text-gray-300">Students actively solving problems</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-green-400">{progressStats.overallProgress.averageAttemptsPerStudent}</div>
                  <div className="text-gray-300">Average attempts per student</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-yellow-400">{progressStats.totalProblems}</div>
                  <div className="text-gray-300">Total problems assigned</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Problems Progress Tab */}
        {activeTab === 'problems' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                <Book className="mr-2" size={20} />
                Problems Progress Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Problem</th>
                      <th className="text-left py-3 px-4 text-gray-300">Difficulty</th>
                      <th className="text-left py-3 px-4 text-gray-300">Attempt Rate</th>
                      <th className="text-left py-3 px-4 text-gray-300">Completion Rate</th>
                      <th className="text-left py-3 px-4 text-gray-300">Avg Score</th>
                      <th className="text-left py-3 px-4 text-gray-300">Students Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem) => {
                      const stats = progressStats.problemStats[problem._id];
                      return (
                        <tr key={problem._id} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <Link 
                              to={`/problems/${problem._id}`}
                              className="text-blue-400 hover:text-blue-300 font-medium"
                            >
                              {stats.title}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(stats.difficulty)}`}>
                              {stats.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${stats.attemptRate}%` }}
                                ></div>
                              </div>
                              <span className="text-white">{stats.attemptRate}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                <div 
                                  className={`h-2 rounded-full ${
                                    parseFloat(stats.completionRate) >= 80 ? 'bg-green-500' :
                                    parseFloat(stats.completionRate) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${stats.completionRate}%` }}
                                ></div>
                              </div>
                              <span className={getPerformanceColor(parseFloat(stats.completionRate))}>{stats.completionRate}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={getPerformanceColor(parseFloat(stats.averageScore))}>{stats.averageScore}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                                ✓ {stats.studentsCompleted}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-900 text-yellow-300">
                                ◐ {stats.studentsPartial}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-900 text-blue-300">
                                → {stats.studentsAttempted}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Students Progress Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                <Users className="mr-2" size={20} />
                Students Progress
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Student</th>
                      <th className="text-left py-3 px-4 text-gray-300">Problems Attempted</th>
                      <th className="text-left py-3 px-4 text-gray-300">Problems Completed</th>
                      <th className="text-left py-3 px-4 text-gray-300">Completion Rate</th>
                      <th className="text-left py-3 px-4 text-gray-300">Average Score</th>
                      <th className="text-left py-3 px-4 text-gray-300">Overall Progress</th>
                    </tr>
                  </thead>                  <tbody>
                    {Object.values(progressStats.studentStats)
                      .sort((a, b) => {
                        // Primary: Average Score (descending)
                        const scoreA = parseFloat(a.averageScore);
                        const scoreB = parseFloat(b.averageScore);
                        if (scoreB !== scoreA) return scoreB - scoreA;
                        
                        // Tie-breaker 1: Problems Completed (descending)
                        if (b.problemsCompleted !== a.problemsCompleted) {
                          return b.problemsCompleted - a.problemsCompleted;
                        }
                        
                        // Tie-breaker 2: Completion Rate (descending)
                        const completionA = parseFloat(a.completionRate);
                        const completionB = parseFloat(b.completionRate);
                        if (completionB !== completionA) return completionB - completionA;
                        
                        // Tie-breaker 3: Problems Attempted (descending)
                        if (b.problemsAttempted !== a.problemsAttempted) {
                          return b.problemsAttempted - a.problemsAttempted;
                        }
                        
                        // Final tie-breaker: Username (alphabetical)
                        return a.username.localeCompare(b.username);
                      })
                      .map((student, index) => (
                      <tr key={student.username} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {index < 3 && (
                              <span className={`mr-2 ${
                                index === 0 ? 'text-yellow-400' : 
                                index === 1 ? 'text-gray-300' : 'text-orange-400'
                              }`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            )}
                            <span className="font-medium">{student.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-blue-400">{student.problemsAttempted}/{progressStats.totalProblems}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-green-400">{student.problemsCompleted}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getPerformanceColor(parseFloat(student.completionRate))}>{student.completionRate}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getPerformanceColor(parseFloat(student.averageScore))}>{student.averageScore}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-600 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  parseFloat(student.progressPercentage) >= 80 ? 'bg-green-500' :
                                  parseFloat(student.progressPercentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${student.progressPercentage}%` }}
                              ></div>
                            </div>
                            <span className={getPerformanceColor(parseFloat(student.progressPercentage))}>{student.progressPercentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyBatchProgress;
