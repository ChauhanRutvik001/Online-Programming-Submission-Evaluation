import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Users, Book, Calendar, ChevronLeft, Clock, Code, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { debounce } from 'lodash';

const StudentBatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClassmates, setShowClassmates] = useState(false);
  const [showProblems, setShowProblems] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [problems, setProblems] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);

  // Add the fetchProblems function
  const fetchProblems = useCallback(async (searchQuery = '', pageNum = 1) => {
    setProblemsLoading(true);
    try {
      const response = await axiosInstance.get(`/user/batches/${batchId}/problems`, {
        params: {
          search: searchQuery,
          page: pageNum,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      if (response.data.success) {
        setProblems(response.data.problems);
        setTotalPages(Math.ceil(response.data.totalProblems / limit));
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setProblemsLoading(false);
    }
  }, [batchId, limit]);

  // Handle search input changes with debounce
  const debouncedSearch = useCallback(
    debounce((value) => {
      setPage(1); // Reset to first page on new search
      fetchProblems(value, 1);
    }, 300),
    [fetchProblems]
  );

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchProblems(searchTerm, newPage);
  };

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/user/batches/${batchId}`);
        if (response.data.success) {
          setBatch(response.data.batch);
          fetchProblems('', 1); // Initial problems load
        }
      } catch (error) {
        console.error('Error fetching batch details:', error);
        toast.error('Failed to load batch details');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetails();
  }, [batchId, navigate, fetchProblems]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64 mt-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-medium text-red-400 mb-2">Batch Not Found</h2>
            <p className="text-gray-400 mb-4">
              The batch you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link to="/student" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8">        {/* Back button */}
        <div className="mb-6 mt-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/student/batches')}
            className="flex items-center text-blue-400 hover:text-blue-300 transition"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          
          <Link
            to={`/student/batch/${batchId}/progress`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <TrendingUp size={18} />
            <span>View Progress Analytics</span>
          </Link>
        </div>

        {/* Batch Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-6 shadow-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">{batch.name}</h1>
          {batch.description && <p className="text-blue-100 mb-3">{batch.description}</p>}
          
          <div className="flex flex-wrap gap-4 text-sm">
            {batch.subject && (
              <div className="flex items-center gap-1">
                <Book size={16} className="text-blue-300" />
                <span>{batch.subject}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={16} className="text-blue-300" />
              <span>Created: {formatDate(batch.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} className="text-blue-300" />
              <span>{batch.students?.length || 0} Students</span>
            </div>
            {batch.faculty && (
              <div className="flex items-center gap-1">
                <Users size={16} className="text-blue-300" />
                <span>Faculty: {batch.faculty.username}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Code size={16} className="text-blue-300" />
              <span>Total Problems: {batch.assignedProblems?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Area (Problems or Students) */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  {showProblems ? (
                    <>
                      <Code className="text-blue-400" />
                      <h2 className="text-xl font-semibold">Assigned Problems</h2>
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">
                        {batch.assignedProblems?.length || 0}
                      </span>
                    </>
                  ) : (
                    <>
                      <Users className="text-blue-400" />
                      <h2 className="text-xl font-semibold">Classmates</h2>
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">
                        {batch.students?.length || 0}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowProblems(!showProblems);
                    setShowClassmates(!showClassmates);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  {showProblems ? 'Show Classmates' : 'Show Problems'}
                </button>
              </div>

              {showProblems ? (
                <>
                  {/* Search input */}
                  <div className="mb-4 relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search problems by title or difficulty..."
                      className="w-full p-2 pr-8 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {problemsLoading && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {/* Problems List */}
                  {problemsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : problems.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        {problems.map(problem => (
                          <div 
                            key={problem._id}
                            onClick={() => navigate(`/problems/${problem._id}`)}
                            className="p-4 bg-gray-750 rounded-lg border border-gray-700 hover:bg-gray-700 cursor-pointer transition-all relative group"
                          >
                            <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                              {problem.title}
                              <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <div className="flex justify-between items-center mt-2 gap-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' :
                                  problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                  'bg-red-900/30 text-red-400'
                                }`}>
                                  {problem.difficulty}
                                </span>
                                {problem.dueDate && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1" title={`Due: ${formatDate(problem.dueDate)}`}>
                                    <Clock size={12} />
                                    Due: {formatDate(problem.dueDate)}
                                  </span>
                                )}
                              </div>
                              {problem.createdBy && (
                                <span className="text-xs text-gray-400">
                                  By: {problem.createdBy.username}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Results count */}
                      <div className="text-sm text-gray-400 mb-4">
                        Showing {problems.length} {searchTerm ? 'matching' : ''} problems {searchTerm ? `for "${searchTerm}"` : ''}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                            title="First page"
                          >
                            «
                          </button>
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                            title="Previous page"
                          >
                            ‹
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => {
                              // Show first page, last page, current page, and pages around current
                              if (
                                i === 0 || // First page
                                i === totalPages - 1 || // Last page
                                (i >= page - 2 && i <= page) || // 2 pages before current
                                (i >= page && i <= page + 1) // 1 page after current
                              ) {
                                return (
                                  <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-3 py-1 rounded min-w-[2.5rem] ${
                                      page === i + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                );
                              } else if (
                                (i === 1 && page > 3) || // Show ellipsis after first page
                                (i === totalPages - 2 && page < totalPages - 3) // Show ellipsis before last page
                              ) {
                                return <span key={i} className="px-2 py-1 text-gray-500">...</span>;
                              }
                              return null;
                            })}
                          </div>

                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                            title="Next page"
                          >
                            ›
                          </button>
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages}
                            className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                            title="Last page"
                          >
                            »
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-750 rounded-lg">
                      <AlertCircle size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-400">No problems have been assigned to this batch yet.</p>
                    </div>
                  )}
                </>
              ) : (                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-700 text-gray-300">
                      <tr>
                        <th className="px-4 py-2">Student ID</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Branch</th>
                        <th className="px-4 py-2">Semester</th>
                        <th className="px-4 py-2">Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.students.map(student => (
                        <tr key={student._id} className="border-t border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-2">{student.id}</td>
                          <td className="px-4 py-2">{student.username}</td>
                          <td className="px-4 py-2">{student.branch || '-'}</td>
                          <td className="px-4 py-2">{student.semester || '-'}</td>
                          <td className="px-4 py-2">{student.batch || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>          {/* End of Content Area */}
        </div>
      </main>
    </div>
  );
};

export default StudentBatchDetails;
