import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { BookOpen, Users, Clock, Calendar, School } from 'lucide-react';

const Student = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const navigate = useNavigate();

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
        setRecentProblems(problemsResponse.data.problems || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Failed to load your dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">Student Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-2">Welcome to your Classroom</h2>
                <p className="text-blue-100">
                  You're enrolled in {batches.length} {batches.length === 1 ? 'batch' : 'batches'}.
                  {recentProblems.length > 0 ? ` You have ${recentProblems.length} recent problems to solve.` : ''}
                </p>
              </div>
              
              {/* Recent Problems */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="text-blue-400" />
                  <h2 className="text-xl font-semibold">Recent Problems</h2>
                </div>
                
                {recentProblems.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No problems assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentProblems.map(problem => (
                      <div 
                        key={problem._id} 
                        className="flex flex-col sm:flex-row justify-between p-4 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition"
                        onClick={() => navigate(`/problems/${problem._id}`)}
                      >
                        <div>
                          <h3 className="font-medium">{problem.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>Assigned: {formatDate(problem.createdAt)}</span>
                            
                            {problem.dueDate && (
                              <>
                                <Clock size={12} className="ml-2" />
                                <span>Due: {formatDate(problem.dueDate)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : 
                              problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 
                              'bg-red-900/30 text-red-400'}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-4">
                      <button 
                        className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                        onClick={() => navigate('/browse')}
                      >
                        View All Problems
                      </button>
                    </div>
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
                
                {batches.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">You're not enrolled in any batches.</p>
                ) : (
                  <div className="space-y-3">
                    {batches.map(batch => (
                      <div 
                        key={batch._id} 
                        className="p-3 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition"
                        onClick={() => navigate(`/batch/${batch._id}/problems`)}
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Student
