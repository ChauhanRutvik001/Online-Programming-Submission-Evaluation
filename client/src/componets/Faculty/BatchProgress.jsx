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
              </div>              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-lg border border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm">Avg Score %</p>
                    <p className="text-2xl font-bold text-white">{progressStats.overallProgress.averageScorePercentage}%</p>
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
          <div className="space-y-6">            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                    <Book className="mr-2" size={20} />
                    Problems Progress Overview
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Detailed analysis of how students are performing on each problem
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>{progressStats.totalProblems} Problems Total</div>
                  <div>{progressStats.totalStudents} Students Enrolled</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-600 bg-gray-750">
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Problem Details</th>
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Max Marks</th>
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Attempt Rate</th>
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Success Rate</th>
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Avg Performance</th>
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Student Distribution</th>
                      <th className="text-left py-4 px-4 text-gray-200 font-semibold">Actions</th>
                    </tr>
                  </thead>                  <tbody>
                    {problems.map((problem, index) => {
                      const stats = progressStats.problemStats[problem._id];
                      const attemptRateNum = parseFloat(stats.attemptRate);
                      const completionRateNum = parseFloat(stats.completionRate);
                      const avgMarksNum = parseFloat(stats.averageMarksPercentage);
                      
                      return (
                        <tr key={problem._id} className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'
                        }`}>
                          {/* Problem Details */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <Link 
                                to={`/problems/${problem._id}`}
                                className="text-blue-400 hover:text-blue-300 font-medium text-base mb-1 transition-colors"
                              >
                                {stats.title}
                              </Link>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(stats.difficulty)}`}>
                                  {stats.difficulty}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Problem #{index + 1}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Max Marks */}
                          <td className="py-4 px-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-400">{stats.totalMarks}</div>
                              <div className="text-xs text-gray-400">marks</div>
                            </div>
                          </td>

                          {/* Attempt Rate */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-300">{stats.studentsAttempted}/{progressStats.totalStudents}</span>
                                <span className={`font-semibold ${
                                  attemptRateNum >= 80 ? 'text-green-400' :
                                  attemptRateNum >= 50 ? 'text-yellow-400' : 'text-red-400'
                                }`}>{stats.attemptRate}%</span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    attemptRateNum >= 80 ? 'bg-green-500' :
                                    attemptRateNum >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${stats.attemptRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Success Rate (Completion Rate) */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-300">{stats.studentsCompleted}/{stats.studentsAttempted}</span>
                                <span className={`font-semibold ${
                                  completionRateNum >= 80 ? 'text-green-400' :
                                  completionRateNum >= 60 ? 'text-yellow-400' : 
                                  completionRateNum >= 40 ? 'text-orange-400' : 'text-red-400'
                                }`}>{stats.completionRate}%</span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    completionRateNum >= 80 ? 'bg-green-500' :
                                    completionRateNum >= 60 ? 'bg-yellow-500' :
                                    completionRateNum >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${stats.completionRate}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {stats.studentsAttempted > 0 ? 'of attempted' : 'none attempted'}
                              </div>
                            </div>
                          </td>

                          {/* Avg Performance */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-center space-y-1">
                              <div className={`text-lg font-bold ${getPerformanceColor(avgMarksNum)}`}>
                                {stats.averageMarksPercentage}%
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    avgMarksNum >= 80 ? 'bg-green-500' :
                                    avgMarksNum >= 60 ? 'bg-yellow-500' :
                                    avgMarksNum >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${stats.averageMarksPercentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-400">avg marks</div>
                            </div>
                          </td>

                          {/* Student Distribution */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-2">
                              <div className="grid grid-cols-3 gap-1 text-xs">
                                <div className="bg-green-900/30 border border-green-700 rounded px-2 py-1 text-center">
                                  <div className="text-green-300 font-semibold">✓ {stats.studentsCompleted}</div>
                                  <div className="text-green-400 text-xs">Complete</div>
                                </div>
                                <div className="bg-yellow-900/30 border border-yellow-700 rounded px-2 py-1 text-center">
                                  <div className="text-yellow-300 font-semibold">◐ {stats.studentsPartial}</div>
                                  <div className="text-yellow-400 text-xs">Partial</div>
                                </div>
                                <div className="bg-blue-900/30 border border-blue-700 rounded px-2 py-1 text-center">
                                  <div className="text-blue-300 font-semibold">→ {stats.studentsAttempted}</div>
                                  <div className="text-blue-400 text-xs">Total</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 text-center">
                                {progressStats.totalStudents - stats.studentsAttempted} not started
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              <Link 
                                to={`/problems/${problem._id}`}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors text-center"
                              >
                                View Problem
                              </Link>
                              <button className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors">
                                View Submissions
                              </button>
                              {(completionRateNum < 50 || avgMarksNum < 60) && (
                                <div className="text-xs text-orange-400 text-center">
                                  ⚠️ Needs Attention
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Problems Analytics & Insights */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-semibold text-purple-400 mb-6 flex items-center">
                <Activity className="mr-2" size={20} />
                📊 Problems Analytics & Insights
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Distribution */}
                <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                  <h4 className="text-lg font-medium text-blue-300 mb-4 flex items-center">
                    <BarChart3 className="mr-2" size={16} />
                    Performance Distribution
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const highPerf = problems.filter(p => parseFloat(progressStats.problemStats[p._id]?.averageMarksPercentage || 0) >= 80);
                      const mediumPerf = problems.filter(p => {
                        const avg = parseFloat(progressStats.problemStats[p._id]?.averageMarksPercentage || 0);
                        return avg >= 60 && avg < 80;
                      });
                      const lowPerf = problems.filter(p => parseFloat(progressStats.problemStats[p._id]?.averageMarksPercentage || 0) < 60);
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                              <span className="text-green-300">High Performance (≥80%)</span>
                            </div>
                            <span className="text-green-400 font-bold">{highPerf.length} problems</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                              <span className="text-yellow-300">Medium Performance (60-79%)</span>
                            </div>
                            <span className="text-yellow-400 font-bold">{mediumPerf.length} problems</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                              <span className="text-red-300">Needs Attention (&lt;60%)</span>
                            </div>
                            <span className="text-red-400 font-bold">{lowPerf.length} problems</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Difficulty Analysis */}
                <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                  <h4 className="text-lg font-medium text-green-300 mb-4 flex items-center">
                    <Target className="mr-2" size={16} />
                    Difficulty Analysis
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const easyProblems = problems.filter(p => progressStats.problemStats[p._id]?.difficulty?.toLowerCase() === 'easy');
                      const mediumProblems = problems.filter(p => progressStats.problemStats[p._id]?.difficulty?.toLowerCase() === 'medium');
                      const hardProblems = problems.filter(p => progressStats.problemStats[p._id]?.difficulty?.toLowerCase() === 'hard');
                      
                      const easyAvg = easyProblems.length > 0 ? 
                        (easyProblems.reduce((sum, p) => sum + parseFloat(progressStats.problemStats[p._id]?.averageMarksPercentage || 0), 0) / easyProblems.length).toFixed(1) : 0;
                      const mediumAvg = mediumProblems.length > 0 ? 
                        (mediumProblems.reduce((sum, p) => sum + parseFloat(progressStats.problemStats[p._id]?.averageMarksPercentage || 0), 0) / mediumProblems.length).toFixed(1) : 0;
                      const hardAvg = hardProblems.length > 0 ? 
                        (hardProblems.reduce((sum, p) => sum + parseFloat(progressStats.problemStats[p._id]?.averageMarksPercentage || 0), 0) / hardProblems.length).toFixed(1) : 0;
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2 py-1 rounded text-xs font-medium text-green-400 bg-green-900/20 border border-green-700 mr-2">Easy</span>
                              <span className="text-gray-300">{easyProblems.length} problems</span>
                            </div>
                            <span className="text-green-400 font-bold">{easyAvg}% avg</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2 py-1 rounded text-xs font-medium text-yellow-400 bg-yellow-900/20 border border-yellow-700 mr-2">Medium</span>
                              <span className="text-gray-300">{mediumProblems.length} problems</span>
                            </div>
                            <span className="text-yellow-400 font-bold">{mediumAvg}% avg</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="px-2 py-1 rounded text-xs font-medium text-red-400 bg-red-900/20 border border-red-700 mr-2">Hard</span>
                              <span className="text-gray-300">{hardProblems.length} problems</span>
                            </div>
                            <span className="text-red-400 font-bold">{hardAvg}% avg</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Top Performing Problems */}
                <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                  <h4 className="text-lg font-medium text-emerald-300 mb-4 flex items-center">
                    <Award className="mr-2" size={16} />
                    🏆 Top Performing Problems
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const sortedProblems = [...problems]
                        .sort((a, b) => {
                          const aAvg = parseFloat(progressStats.problemStats[a._id]?.averageMarksPercentage || 0);
                          const bAvg = parseFloat(progressStats.problemStats[b._id]?.averageMarksPercentage || 0);
                          return bAvg - aAvg;
                        })
                        .slice(0, 3);
                      
                      return sortedProblems.map((problem, index) => {
                        const stats = progressStats.problemStats[problem._id];
                        const avgMarks = parseFloat(stats?.averageMarksPercentage || 0);
                        return (
                          <div key={problem._id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-emerald-800/30">
                            <div className="flex items-center">
                              <span className="text-emerald-400 mr-2">#{index + 1}</span>
                              <Link to={`/problems/${problem._id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                {stats?.title || 'Untitled'}
                              </Link>
                            </div>
                            <span className={`font-bold text-sm ${getPerformanceColor(avgMarks)}`}>
                              {avgMarks.toFixed(1)}%
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Problems Needing Attention */}
                <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                  <h4 className="text-lg font-medium text-orange-300 mb-4 flex items-center">
                    <AlertCircle className="mr-2" size={16} />
                    ⚠️ Problems Needing Attention
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const problematicProblems = [...problems]
                        .filter(p => {
                          const stats = progressStats.problemStats[p._id];
                          const avgMarks = parseFloat(stats?.averageMarksPercentage || 0);
                          const completionRate = parseFloat(stats?.completionRate || 0);
                          return avgMarks < 60 || completionRate < 50;
                        })
                        .sort((a, b) => {
                          const aAvg = parseFloat(progressStats.problemStats[a._id]?.averageMarksPercentage || 0);
                          const bAvg = parseFloat(progressStats.problemStats[b._id]?.averageMarksPercentage || 0);
                          return aAvg - bAvg;
                        })
                        .slice(0, 3);
                      
                      if (problematicProblems.length === 0) {
                        return (
                          <div className="text-green-400 text-sm text-center py-2">
                            🎉 All problems performing well!
                          </div>
                        );
                      }
                      
                      return problematicProblems.map((problem, index) => {
                        const stats = progressStats.problemStats[problem._id];
                        const avgMarks = parseFloat(stats?.averageMarksPercentage || 0);
                        const completionRate = parseFloat(stats?.completionRate || 0);
                        return (
                          <div key={problem._id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-orange-800/30">
                            <div className="flex items-center">
                              <span className="text-orange-400 mr-2">⚠️</span>
                              <Link to={`/problems/${problem._id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                {stats?.title || 'Untitled'}
                              </Link>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-xs ${getPerformanceColor(avgMarks)}`}>
                                {avgMarks.toFixed(1)}% avg
                              </div>
                              <div className={`text-xs ${getPerformanceColor(completionRate)}`}>
                                {completionRate.toFixed(1)}% complete
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Quick Action Recommendations */}
              <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
                  <CheckCircle className="mr-2" size={16} />
                  💡 Recommended Actions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {(() => {
                    const recommendations = [];
                    
                    // Check for low engagement
                    const lowEngagementProblems = problems.filter(p => {
                      const attemptRate = parseFloat(progressStats.problemStats[p._id]?.attemptRate || 0);
                      return attemptRate < 50;
                    });
                    
                    if (lowEngagementProblems.length > 0) {
                      recommendations.push(
                        <div key="engagement" className="flex items-start">
                          <span className="text-yellow-400 mr-2">📢</span>
                          <span className="text-gray-200">
                            <strong>{lowEngagementProblems.length} problems</strong> have low engagement (&lt;50% attempt rate). 
                            Consider sending reminders or reviewing problem statements.
                          </span>
                        </div>
                      );
                    }
                    
                    // Check for difficulty spikes
                    const hardProblemsWithLowPerformance = problems.filter(p => {
                      const stats = progressStats.problemStats[p._id];
                      const difficulty = stats?.difficulty?.toLowerCase();
                      const avgMarks = parseFloat(stats?.averageMarksPercentage || 0);
                      return difficulty === 'hard' && avgMarks < 40;
                    });
                    
                    if (hardProblemsWithLowPerformance.length > 0) {
                      recommendations.push(
                        <div key="difficulty" className="flex items-start">
                          <span className="text-red-400 mr-2">🔥</span>
                          <span className="text-gray-200">
                            <strong>{hardProblemsWithLowPerformance.length} hard problems</strong> showing very low performance. 
                            Consider providing additional hints or practice problems.
                          </span>
                        </div>
                      );
                    }
                    
                    // Check for successful patterns
                    const easyProblemsWithHighPerformance = problems.filter(p => {
                      const stats = progressStats.problemStats[p._id];
                      const difficulty = stats?.difficulty?.toLowerCase();
                      const avgMarks = parseFloat(stats?.averageMarksPercentage || 0);
                      return difficulty === 'easy' && avgMarks > 85;
                    });
                    
                    if (easyProblemsWithHighPerformance.length > 0) {
                      recommendations.push(
                        <div key="success" className="flex items-start">
                          <span className="text-green-400 mr-2">✨</span>
                          <span className="text-gray-200">
                            <strong>{easyProblemsWithHighPerformance.length} easy problems</strong> showing excellent performance. 
                            Students are ready for more challenging problems!
                          </span>
                        </div>
                      );
                    }
                    
                    // Default message
                    if (recommendations.length === 0) {
                      recommendations.push(
                        <div key="default" className="flex items-start col-span-2">
                          <span className="text-blue-400 mr-2">👍</span>
                          <span className="text-gray-200">
                            Overall performance looks balanced. Continue monitoring individual student progress 
                            and consider adding more challenging problems as students improve.
                          </span>
                        </div>
                      );
                    }
                    
                    return recommendations;
                  })()}
                </div>
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
                      <th className="text-left py-3 px-4 text-gray-300">Total Marks</th>
                      <th className="text-left py-3 px-4 text-gray-300">Score %</th>
                      <th className="text-left py-3 px-4 text-gray-300">Overall Progress</th>
                    </tr>
                  </thead>                  <tbody>                    {Object.values(progressStats.studentStats)
                      .sort((a, b) => {
                        // Primary: Total Marks Earned (descending)
                        if (b.totalMarksEarned !== a.totalMarksEarned) {
                          return b.totalMarksEarned - a.totalMarksEarned;
                        }
                        
                        // Tie-breaker 1: Problems Completed (descending)
                        if (b.problemsCompleted !== a.problemsCompleted) {
                          return b.problemsCompleted - a.problemsCompleted;
                        }
                        
                        // Tie-breaker 2: Submission Timing (earliest submission wins - smaller timestamp sum)
                        if (a.submissionTimingSum !== b.submissionTimingSum) {
                          return a.submissionTimingSum - b.submissionTimingSum;
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
                        </td>                        <td className="py-3 px-4">
                          <span className={getPerformanceColor(parseFloat(student.completionRate))}>{student.completionRate}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-yellow-400 font-bold">{student.totalMarksEarned}</span>
                          <span className="text-gray-400 text-sm">/{student.totalPossibleMarks}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getPerformanceColor(parseFloat(student.scorePercentage))}>{student.scorePercentage}%</span>
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
