import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Activity,
  User,
  Star
} from 'lucide-react';

const StudentBatchProgress = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.app.user); // Get current user from Redux
  const [batch, setBatch] = useState(null);
  const [progressStats, setProgressStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, problems, classmates
  const [myProgress, setMyProgress] = useState(null); // Current student's individual progress
  useEffect(() => {
    const fetchBatchProgress = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/user/batches/${batchId}/progress`);
        if (response.data.success) {
          setBatch(response.data.batch);
          setProgressStats(response.data.progressStats);
          setProblems(response.data.problems);
          
          // Extract current user's individual progress
          if (user && user._id && response.data.progressStats.studentStats[user._id]) {
            setMyProgress(response.data.progressStats.studentStats[user._id]);
          }
        }
      } catch (error) {
        console.error('Error fetching batch progress:', error);
        toast.error('Failed to load batch progress');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch when we have user data
      fetchBatchProgress();
    }
  }, [batchId, navigate, user]);

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/student')}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back to Batches</span>
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
        </div>        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'My Progress', icon: User },
            { id: 'problems', label: 'Problems Status', icon: Book },
            { id: 'classmates', label: 'Classmates Progress', icon: Users }
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
        </div>        {/* My Progress Tab */}
        {activeTab === 'overview' && myProgress && (
          <div className="space-y-8">
            {/* Personal Progress Header */}
            <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-6 border border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <User className="mr-3" size={24} />
                    Your Progress in {batch.name}
                  </h2>
                  <p className="text-blue-200">Tracking your individual performance and improvement</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{myProgress.progressPercentage}%</div>
                  <div className="text-blue-200 text-sm">Overall Progress</div>
                </div>
              </div>
            </div>

            {/* Personal Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-700 to-green-800 p-6 rounded-lg border border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Problems Completed</p>
                    <p className="text-2xl font-bold text-white">
                      {myProgress.problemsCompleted}/{progressStats.totalProblems}
                    </p>
                  </div>
                  <CheckCircle className="text-green-300" size={24} />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-green-900/30 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${(myProgress.problemsCompleted / progressStats.totalProblems) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-6 rounded-lg border border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Problems Attempted</p>
                    <p className="text-2xl font-bold text-white">
                      {myProgress.problemsAttempted}/{progressStats.totalProblems}
                    </p>
                  </div>
                  <Activity className="text-blue-300" size={24} />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-900/30 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${(myProgress.problemsAttempted / progressStats.totalProblems) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-lg border border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm">Average Score</p>
                    <p className="text-2xl font-bold text-white">{myProgress.averageScore}%</p>
                  </div>
                  <Award className="text-yellow-300" size={24} />
                </div>
                <div className="mt-2 text-xs text-yellow-200">
                  Batch avg: {progressStats.overallProgress.averageScore}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg border border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm">Completion Rate</p>
                    <p className="text-2xl font-bold text-white">{myProgress.completionRate}%</p>
                  </div>
                  <Target className="text-purple-300" size={24} />
                </div>
                <div className="mt-2 text-xs text-purple-200">
                  Batch avg: {progressStats.overallProgress.averageCompletionRate}%
                </div>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Ranking */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">                <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                  <Star className="mr-2" size={20} />
                  Your Class Ranking
                </h3>
                {(() => {
                  const students = Object.values(progressStats.studentStats)
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
                    });
                  const myRank = students.findIndex(s => s.username === myProgress.username) + 1;
                  const totalStudents = students.length;
                  
                  return (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-400">#{myRank}</div>
                        <div className="text-gray-300">out of {totalStudents} students</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Percentile</span>
                          <span className="text-blue-400 font-semibold">
                            {Math.round(((totalStudents - myRank) / totalStudents) * 100)}th
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Performance vs Class Average */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Performance Comparison</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Completion Rate</span>
                      <span className={`font-semibold ${
                        parseFloat(myProgress.completionRate) > parseFloat(progressStats.overallProgress.averageCompletionRate) 
                          ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {parseFloat(myProgress.completionRate) > parseFloat(progressStats.overallProgress.averageCompletionRate) 
                          ? '+' : ''}
                        {(parseFloat(myProgress.completionRate) - parseFloat(progressStats.overallProgress.averageCompletionRate)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          parseFloat(myProgress.completionRate) > parseFloat(progressStats.overallProgress.averageCompletionRate)
                            ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${myProgress.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Average Score</span>
                      <span className={`font-semibold ${
                        parseFloat(myProgress.averageScore) > parseFloat(progressStats.overallProgress.averageScore) 
                          ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {parseFloat(myProgress.averageScore) > parseFloat(progressStats.overallProgress.averageScore) 
                          ? '+' : ''}
                        {(parseFloat(myProgress.averageScore) - parseFloat(progressStats.overallProgress.averageScore)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          parseFloat(myProgress.averageScore) > parseFloat(progressStats.overallProgress.averageScore)
                            ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${myProgress.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">📈 Your Next Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const incomplete = progressStats.totalProblems - myProgress.problemsCompleted;
                  const unattempted = progressStats.totalProblems - myProgress.problemsAttempted;
                  
                  return (
                    <>
                      <div className="text-center p-4 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-orange-400">{incomplete}</div>
                        <div className="text-gray-300 text-sm">Problems to complete</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-blue-400">{unattempted}</div>
                        <div className="text-gray-300 text-sm">Problems to attempt</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-green-400">{myProgress.averageScore}%</div>
                        <div className="text-gray-300 text-sm">Current average score</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Show message if user progress not found */}
        {activeTab === 'overview' && !myProgress && !loading && (
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 text-center">
            <AlertCircle className="mx-auto mb-4 text-yellow-400" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No Progress Data Found</h3>
            <p className="text-gray-400">
              You haven't started working on problems in this batch yet. 
              Start solving problems to see your progress here!
            </p>
          </div>
        )}        {/* Problems Progress Tab */}
        {activeTab === 'problems' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                <Book className="mr-2" size={20} />
                My Problems Status & Batch Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Problem</th>
                      <th className="text-left py-3 px-4 text-gray-300">Difficulty</th>
                      <th className="text-left py-3 px-4 text-gray-300">My Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">My Score</th>
                      <th className="text-left py-3 px-4 text-gray-300">Batch Completion</th>
                      <th className="text-left py-3 px-4 text-gray-300">Batch Avg Score</th>
                      <th className="text-left py-3 px-4 text-gray-300">Class Performance</th>
                    </tr>
                  </thead>                  <tbody>
                    {problems.map((problem) => {
                      const stats = progressStats.problemStats[problem._id];
                      
                      // Get user's individual status for this specific problem
                      let myStatus = 'Not Started';
                      let myScore = '--';
                      let statusColor = 'text-gray-400';
                      let statusIcon = '○';

                      if (myProgress && myProgress.problemDetails && myProgress.problemDetails[problem._id]) {
                        const problemDetail = myProgress.problemDetails[problem._id];
                        
                        switch (problemDetail.status) {
                          case 'completed':
                            myStatus = 'Completed';
                            myScore = `${problemDetail.score}%`;
                            statusColor = 'text-green-400';
                            statusIcon = '✓';
                            break;
                          case 'attempted':
                            myStatus = 'In Progress';
                            myScore = `${problemDetail.score}%`;
                            statusColor = 'text-yellow-400';
                            statusIcon = '◐';
                            break;
                          default:
                            myStatus = 'Not Started';
                            myScore = '--';
                            statusColor = 'text-gray-400';
                            statusIcon = '○';
                        }
                      }

                      return (                        <tr key={problem._id} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <Link 
                              to={`/student/problem/${problem._id}`}
                              className="text-blue-400 hover:text-blue-300 font-medium"
                            >
                              {problem.title}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                              {problem.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`flex items-center ${statusColor}`}>
                              <span className="mr-2">{statusIcon}</span>
                              <span className="font-medium">{myStatus}</span>
                              {myProgress && myProgress.problemDetails && myProgress.problemDetails[problem._id] && 
                               myProgress.problemDetails[problem._id].testCasesPassed > 0 && (
                                <span className="ml-2 text-xs text-gray-400">
                                  ({myProgress.problemDetails[problem._id].testCasesPassed}/{myProgress.problemDetails[problem._id].totalTestCases})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${statusColor}`}>
                              {myScore}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                <div 
                                  className={`h-2 rounded-full ${
                                    ((stats?.completedCount || 0) / progressStats.totalStudents * 100) >= 80 ? 'bg-green-500' :
                                    ((stats?.completedCount || 0) / progressStats.totalStudents * 100) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(stats?.completedCount || 0) / progressStats.totalStudents * 100}%` }}
                                ></div>
                              </div>
                              <span className={getPerformanceColor((stats?.completedCount || 0) / progressStats.totalStudents * 100)}>
                                {((stats?.completedCount || 0) / progressStats.totalStudents * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>                          <td className="py-3 px-4">
                            <span className={getPerformanceColor(parseFloat(stats?.averageScore) || 0)}>
                              {typeof stats?.averageScore === 'number' ? stats.averageScore.toFixed(1) : (stats?.averageScore || '0.0')}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                                ✓ {stats?.completedCount || 0}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-900 text-yellow-300">
                                ◐ {stats?.attemptedCount || 0}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-900 text-blue-300">
                                → {(progressStats.totalStudents - (stats?.completedCount || 0) - (stats?.attemptedCount || 0))}
                              </span>
                            </div>
                          </td>
                        </tr>);
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Personal Progress Summary for Problems */}
            {myProgress && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">📊 Your Problem-Solving Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-green-400">{myProgress.problemsCompleted}</div>
                    <div className="text-gray-300 text-sm">Problems Completed</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {((myProgress.problemsCompleted / progressStats.totalProblems) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-blue-400">{myProgress.problemsAttempted}</div>
                    <div className="text-gray-300 text-sm">Problems Attempted</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {((myProgress.problemsAttempted / progressStats.totalProblems) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-yellow-400">
                      {progressStats.totalProblems - myProgress.problemsAttempted}
                    </div>
                    <div className="text-gray-300 text-sm">Problems Remaining</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {(((progressStats.totalProblems - myProgress.problemsAttempted) / progressStats.totalProblems) * 100).toFixed(1)}% untouched
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-purple-400">{myProgress.averageScore}%</div>
                    <div className="text-gray-300 text-sm">Your Average Score</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {parseFloat(myProgress.averageScore) > parseFloat(progressStats.overallProgress.averageScore) ? 'Above' : 'Below'} batch average
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}        {/* Classmates Progress Tab */}
        {activeTab === 'classmates' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                <Users className="mr-2" size={20} />
                Classmates Progress & Your Ranking
              </h3>
              <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700 rounded">
                <p className="text-blue-200 text-sm">
                  <span className="font-semibold">💡 Tip:</span> Your row is highlighted to help you track your progress compared to classmates.
                  Use this to identify areas for improvement and celebrate your achievements!
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-300">Student</th>
                      <th className="text-left py-3 px-4 text-gray-300">Problems Attempted</th>
                      <th className="text-left py-3 px-4 text-gray-300">Problems Completed</th>
                      <th className="text-left py-3 px-4 text-gray-300">Completion Rate</th>
                      <th className="text-left py-3 px-4 text-gray-300">Average Score</th>
                      <th className="text-left py-3 px-4 text-gray-300">Overall Progress</th>
                    </tr>
                  </thead>
                  <tbody>                    {Object.values(progressStats.studentStats)
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
                      .map((student, index) => {
                        const isCurrentUser = user && student.username === user.username;
                        return (
                          <tr 
                            key={student.username} 
                            className={`border-b border-gray-700 transition-colors ${
                              isCurrentUser 
                                ? 'bg-blue-900/30 border-blue-600 ring-1 ring-blue-500' 
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {index < 3 && (
                                  <span className={`mr-2 text-lg ${
                                    index === 0 ? 'text-yellow-400' : 
                                    index === 1 ? 'text-gray-300' : 'text-orange-400'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                )}
                                <span className={`font-medium ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                                  #{index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {isCurrentUser && (
                                  <span className="mr-2 text-blue-400">
                                    <User size={16} />
                                  </span>
                                )}
                                <span className={`font-medium ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                                  {student.username}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs bg-blue-600 text-blue-100 px-2 py-1 rounded">
                                      You
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={isCurrentUser ? 'text-blue-300 font-semibold' : 'text-blue-400'}>
                                {student.problemsAttempted}/{progressStats.totalProblems}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={isCurrentUser ? 'text-green-300 font-semibold' : 'text-green-400'}>
                                {student.problemsCompleted}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`${getPerformanceColor(parseFloat(student.completionRate))} ${
                                isCurrentUser ? 'font-semibold' : ''
                              }`}>
                                {student.completionRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`${getPerformanceColor(parseFloat(student.averageScore))} ${
                                isCurrentUser ? 'font-semibold' : ''
                              }`}>
                                {student.averageScore}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-600 rounded-full h-2 mr-3">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      parseFloat(student.progressPercentage) >= 80 ? 'bg-green-500' :
                                      parseFloat(student.progressPercentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    } ${isCurrentUser ? 'ring-1 ring-blue-400' : ''}`}
                                    style={{ width: `${student.progressPercentage}%` }}
                                  ></div>
                                </div>
                                <span className={`${getPerformanceColor(parseFloat(student.progressPercentage))} ${
                                  isCurrentUser ? 'font-semibold' : ''
                                }`}>
                                  {student.progressPercentage}%
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

            {/* Class Performance Insights */}
            {myProgress && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Position Analysis */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">                  <h3 className="text-xl font-semibold text-blue-400 mb-4">📈 Your Position Analysis</h3>
                  {(() => {
                    const students = Object.values(progressStats.studentStats)
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
                      });
                    const myRank = students.findIndex(s => s.username === myProgress.username) + 1;
                    const totalStudents = students.length;
                    const studentsAbove = myRank - 1;
                    const studentsBelow = totalStudents - myRank;
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-gray-700 rounded">
                            <div className="text-lg font-bold text-red-400">{studentsAbove}</div>
                            <div className="text-xs text-gray-300">Above you</div>
                          </div>
                          <div className="p-3 bg-blue-800 rounded border border-blue-600">
                            <div className="text-lg font-bold text-blue-300">#{myRank}</div>
                            <div className="text-xs text-blue-200">Your rank</div>
                          </div>
                          <div className="p-3 bg-gray-700 rounded">
                            <div className="text-lg font-bold text-green-400">{studentsBelow}</div>
                            <div className="text-xs text-gray-300">Below you</div>
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-700 rounded">
                          <div className="text-sm text-gray-300">
                            You're in the <span className="font-semibold text-blue-400">
                              {Math.round(((totalStudents - myRank) / totalStudents) * 100)}th percentile
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Performance Comparison */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                  <h3 className="text-xl font-semibold text-blue-400 mb-4">⚡ Performance Insights</h3>
                  <div className="space-y-4">
                    {(() => {
                      const batchAvgScore = parseFloat(progressStats.overallProgress.averageScore);
                      const batchAvgCompletion = parseFloat(progressStats.overallProgress.averageCompletionRate);
                      const myScore = parseFloat(myProgress.averageScore);
                      const myCompletion = parseFloat(myProgress.completionRate);
                      
                      return (
                        <>
                          <div className="p-3 bg-gray-700 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Score vs Class Avg</span>
                              <div className="flex items-center">
                                <span className={`font-semibold ${myScore > batchAvgScore ? 'text-green-400' : 'text-red-400'}`}>
                                  {myScore > batchAvgScore ? '+' : ''}{(myScore - batchAvgScore).toFixed(1)}%
                                </span>
                                <span className={`ml-2 ${myScore > batchAvgScore ? 'text-green-400' : 'text-red-400'}`}>
                                  {myScore > batchAvgScore ? '↗️' : '↘️'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-700 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Completion vs Class Avg</span>
                              <div className="flex items-center">
                                <span className={`font-semibold ${myCompletion > batchAvgCompletion ? 'text-green-400' : 'text-red-400'}`}>
                                  {myCompletion > batchAvgCompletion ? '+' : ''}{(myCompletion - batchAvgCompletion).toFixed(1)}%
                                </span>
                                <span className={`ml-2 ${myCompletion > batchAvgCompletion ? 'text-green-400' : 'text-red-400'}`}>
                                  {myCompletion > batchAvgCompletion ? '↗️' : '↘️'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-700 rounded">
                            <div className="text-center">
                              <div className="text-sm text-gray-300">
                                {myScore > batchAvgScore && myCompletion > batchAvgCompletion 
                                  ? "🎉 Performing above average in both metrics!"
                                  : myScore > batchAvgScore 
                                    ? "💪 Great scores! Try completing more problems."
                                    : myCompletion > batchAvgCompletion
                                      ? "📚 Good completion rate! Focus on improving scores."
                                      : "🎯 Room for improvement in both areas. Keep going!"
                                }
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBatchProgress;
