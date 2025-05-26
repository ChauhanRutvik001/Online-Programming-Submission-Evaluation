import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { BookOpen, Users, Clock, Calendar, School, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Student = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const [problemStatuses, setProblemStatuses] = useState({});
  const navigate = useNavigate();
  const user = useSelector((state) => state.app.user); // Get current user from Redux
  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        // Fetch batches student is part of
        const batchesResponse = await axiosInstance.get('/user/my-batches');
        setBatches(batchesResponse.data.batches || []);
        
        // Fetch recent problems assigned to student
        const problemsResponse = await axiosInstance.get('/problems', {
          params: {
            limit: 5,
            sort: 'recent'
          }
        });
        setRecentProblems(problemsResponse.data.problems || []);        // Fetch completion status for recent problems from all batches
        const statusPromises = (batchesResponse.data.batches || []).map(async (batch) => {
          try {
            const progressResponse = await axiosInstance.get(`/user/batches/${batch._id}/progress`);
            if (progressResponse.data.success && user && user._id) {
              const userProgress = progressResponse.data.progressStats?.studentStats?.[user._id];
              return {
                batchId: batch._id,
                problemDetails: userProgress?.problemDetails || {}
              };
            }
            return { batchId: batch._id, problemDetails: {} };
          } catch (error) {
            console.error(`Error fetching progress for batch ${batch._id}:`, error);
            return { batchId: batch._id, problemDetails: {} };
          }
        });

        const statusResults = await Promise.all(statusPromises);
        const combinedStatuses = {};
        statusResults.forEach(result => {
          Object.assign(combinedStatuses, result.problemDetails);
        });
        setProblemStatuses(combinedStatuses);

      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Failed to load your dashboard data');
      } finally {
        setLoading(false);
      }
    };    fetchStudentData();
  }, [user]); // Add user as dependency
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  // Helper function to get completion status icon and color
  const getCompletionIcon = (problemId) => {
    const status = problemStatuses[problemId];
    if (!status) {
      return {
        icon: <AlertCircle size={24} className="text-gray-400" />,
        text: 'Not Started',
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/30'
      };
    }

    switch (status.status) {
      case 'completed':
        return {
          icon: <CheckCircle size={24} className="text-green-400" />,
          text: 'Completed',
          color: 'text-green-400',
          bgColor: 'bg-green-900/30'
        };
      case 'attempted':
        return {
          icon: <AlertCircle size={24} className="text-yellow-400" />,
          text: 'In Progress',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30'
        };
      default:
        return {
          icon: <AlertCircle size={24} className="text-gray-400" />,
          text: 'Not Started ',
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/30'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-blue-400 mt-16">Student Dashboard</h1>        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-2">Welcome to your Classroom</h2>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-blue-700/50 rounded w-3/4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                  </div>
                  <div className="h-4 bg-blue-700/50 rounded w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <p className="text-blue-100">
                  You're enrolled in {batches.length} {batches.length === 1 ? 'batch' : 'batches'}.
                  {recentProblems.length > 0 ? ` You have ${recentProblems.length} recent problems to solve.` : ''}
                </p>
              )}
            </div>
            
            {/* Recent Problems */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-blue-400" />
                <h2 className="text-xl font-semibold">Recent Problems</h2>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(index => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-750 rounded-lg border border-gray-700">
                      {/* Status Icon Skeleton */}
                      <div className="w-16 h-16 bg-gray-700 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                      
                      {/* Problem Details Skeleton */}
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-700 rounded w-3/4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                        <div className="flex gap-4">
                          <div className="h-4 bg-gray-700 rounded w-32 relative overflow-hidden">
                            <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                          </div>
                          <div className="h-4 bg-gray-700 rounded w-24 relative overflow-hidden">
                            <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-700 rounded w-20 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                      </div>
                      
                      {/* Difficulty Badge Skeleton */}
                      <div className="w-16 h-6 bg-gray-700 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                    </div>                  ))}
                  
                  <div className="text-center mt-4">
                    <button 
                      className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                      onClick={() => navigate('/browse')}
                    >
                      View All Problems
                    </button>
                  </div>
                </div>
              ) : recentProblems.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No problems assigned yet.</p>
              ) : (
                <div className="space-y-4">
                  {recentProblems.map(problem => {
                    const completionStatus = getCompletionIcon(problem._id);
                    return (
                      <div 
                        key={problem._id} 
                        className="flex items-center gap-4 p-4 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition group"
                        onClick={() => navigate(`/problems/${problem._id}`)}
                      >
                        {/* Large Status Icon */}
                        <div className={`flex items-center justify-center w-16 h-16 rounded-lg ${completionStatus.bgColor} border-2 border-current ${completionStatus.color}`}>
                          {completionStatus.icon}
                        </div>
                        
                        {/* Problem Details */}
                        <div className="flex-1">
                          <h3 className="font-medium text-lg group-hover:text-blue-400 transition-colors">{problem.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>Assigned: {formatDate(problem.createdAt)}</span>
                            </div>
                            
                            {problem.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>Due: {formatDate(problem.dueDate)}</span>
                              </div>
                            )}
                          </div>
                          <div className={`text-sm mt-1 font-medium ${completionStatus.color}`}>
                            {completionStatus.text}
                            {problemStatuses[problem._id]?.score && 
                              ` - ${problemStatuses[problem._id].score}% score`
                            }
                          </div>
                        </div>
                        
                        {/* Difficulty Badge */}
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium 
                            ${problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : 
                              problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 
                              'bg-red-900/30 text-red-400'}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {!loading && (
                <div className="text-center mt-4">
                  <button 
                    className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                    onClick={() => navigate('/browse')}
                  >
                    View All Problems
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Batches */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-blue-400" />
                <h2 className="text-xl font-semibold">My Batches</h2>
              </div>
                {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(index => (
                    <div key={index} className="p-3 bg-gray-750 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-gray-700 rounded relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                        <div className="h-4 bg-gray-700 rounded w-24 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-700 rounded w-32 relative overflow-hidden">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center mt-4">
                    <button 
                      className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                      onClick={() => navigate('/student/batches')}
                    >
                      View All Batches
                    </button>
                  </div>
                </div>
              ) : batches.length === 0 ? (
                <p className="text-gray-400 text-center py-4">You're not enrolled in any batches.</p>
              ) : (
                <div className="space-y-3">
                  {batches.map(batch => (
                    <div 
                      key={batch._id} 
                      className="p-3 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition"
                      onClick={() => navigate(`/student/batch/${batch._id}`)}
                    >
                      <h3 className="font-medium flex items-center gap-2">
                        <School size={16} className="text-blue-400" />
                        {batch.name}
                      </h3>
                      {batch.subject && (
                        <p className="text-sm text-gray-400 mt-1">{batch.subject}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {!loading && (
                <div className="text-center mt-4">
                  <button 
                    className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                    onClick={() => navigate('/student/batches')}
                  >
                    View All Batches
                  </button>
                </div>
              )}            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Student
