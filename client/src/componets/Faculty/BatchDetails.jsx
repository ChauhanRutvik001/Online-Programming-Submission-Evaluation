import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { 
  ChevronLeft, Users, Book, Calendar, School, Search, User, Tag, FileText, 
  CheckCircle, XCircle, ChevronRight, ChevronsLeft, ChevronsRight, Code, AlertCircle, BarChart3 
} from 'lucide-react';

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStudents, setShowStudents] = useState(false);
  const studentsPerPage = 20;
  const problemsPerPage = 10;
  
  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);
  
  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const fetchBatchDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/faculty/batches/${batchId}`);
      console.log('Batch details response:', response.data);
      if (response.data.success) {
        setBatch(response.data.batch);
      }
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast.error('Failed to load batch details');
      navigate('/faculty/batches');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter, sort, and paginate students
  const filteredStudents = batch?.students?.filter(student => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      student.username.toLowerCase().includes(term) ||
      student.id.toLowerCase().includes(term) ||
      (student.batch && student.batch.toLowerCase().includes(term)) ||
      (student.semester && student.semester.toLowerCase().includes(term)) ||
      (student.branch && student.branch.toLowerCase().includes(term))
    );
  });
  
  // Sort students by ID
  const sortedStudents = filteredStudents?.sort((a, b) => {
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });
  
  // Paginate students
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedStudents?.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil((filteredStudents?.length || 0) / studentsPerPage);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check if problem is past due
  const isPastDue = (dueDate) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  // Filter problems by search term
  const filteredProblems = batch?.assignedProblems?.filter(problem => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      problem.title.toLowerCase().includes(term) ||
      problem.difficulty.toLowerCase().includes(term) ||
      (problem.createdBy && problem.createdBy.username.toLowerCase().includes(term))
    );
  }) || [];
  
  // Sort problems by due date (nearest first)
  const sortedProblems = [...filteredProblems].sort((a, b) => {
    // Problems with due dates come first
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    // Sort by due date if both have it
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Otherwise sort by creation date
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  // Paginate problems
  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = sortedProblems?.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalProblemPages = Math.ceil((filteredProblems?.length || 0) / problemsPerPage);

  // Helper to get due date for this batch
  const getDueDateForBatch = (problem) => {
    if (!problem.batchDueDates) return null;
    const entry = problem.batchDueDates.find(
      (b) => b.batch === batchId || b.batchId === batchId
    );
    return entry ? entry.dueDate : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="bg-gray-800 rounded-lg shadow-lg p-10 text-center">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Batch not found</h2>
            <p className="text-gray-400 mb-6">
              The batch you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => navigate('/faculty/batches')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Back to Batches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8">
        {/* Back and Dashboard buttons */}
        <div className="flex justify-between items-center mb-8 mt-12">
          <button 
            onClick={() => navigate('/faculty/batches')}
            className="flex items-center text-blue-400 hover:text-blue-300 transition"
          >
            <ChevronLeft size={20} />
            <span>Back to Batches</span>
          </button>
          <button
            onClick={() => navigate(`/faculty/batches/${batchId}/progress`)}
            className="px-6 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 size={18} />
            Batch Progress Analytics
          </button>
        </div>

        {/* Batch info card */}
        <div className="flex flex-col md:flex-row gap-6 items-center bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl shadow-xl p-8 mb-8 border border-blue-900/40">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Tag size={20} className="text-blue-300" />
              <span className="text-lg font-bold text-white">{batch.name}</span>
              <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold tracking-widest shadow ${batch.isActive ? 'bg-green-800/80 text-green-100' : 'bg-red-800/80 text-red-100'}`}>{batch.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            {batch.description && <p className="text-blue-100 italic mb-1">{batch.description}</p>}
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2 text-blue-200">
                <Book size={16} />
                <span className="font-semibold">{batch.subject || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <User size={16} />
                <span className="font-semibold">{batch.faculty?.username || 'Not assigned'}</span>
                {batch.faculty?.email && <span className="ml-1 text-xs text-blue-100">({batch.faculty.email})</span>}
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <Users size={16} />
                <span className="font-semibold">{batch.students?.length || 0} Students</span>
              </div>
            </div>
          </div>
        </div>   
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowStudents(false)}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${!showStudents ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Assigned Problems
          </button>
          <button
            onClick={() => setShowStudents(true)}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${showStudents ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Show Student List
          </button>
          
        </div>

        {/* Main content: Problems or Students */}
        {!showStudents ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-3">
              <Code className="text-blue-400" size={20} />
              <h2 className="text-xl font-semibold">
                Assigned Problems <span className="text-blue-400">({batch.assignedProblems?.length || 0})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dashbaord</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentProblems.map((problem) => (
                    <tr key={problem._id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="text-blue-400 hover:underline font-semibold text-left"
                          onClick={() => navigate(`/problems/${problem._id}`)}
                        >
                          {problem.title}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{problem.difficulty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{problem.createdAt ? formatDate(problem.createdAt) : '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const due = problem.dueDate || getDueDateForBatch(problem);
                          if (!due) return <span className="text-gray-400">-</span>;
                          const isPast = new Date(due) < new Date();
                          return (
                            <span
                              className={`text-sm flex items-center gap-1 ${isPast ? "text-red-400" : "text-gray-300"}`}
                              title={isPast ? `Due Passed: ${formatDate(due)}` : `Due: ${formatDate(due)}`}
                            >
                              <Calendar size={14} />
                              {isPast ? "Due Passed" : formatDate(due)}
                            </span>
                          );
                        })()}
                      </td>                      <td className="px-6 py-4 whitespace-nowrap hover:cursor-pointer" onClick={() => navigate(`/dashboard/${problem._id}?batchId=${batchId}`)}>
                        <div className="text-blue-400 hover:underline font-semibold text-left">Progress</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isPastDue(problem.dueDate) ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>{isPastDue(problem.dueDate) ? 'Past Due' : 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstProblem + 1}-{Math.min(indexOfLastProblem, filteredProblems.length)} of {filteredProblems.length} problems
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center bg-gray-700 px-3 py-1 rounded">
                  <span>Page {currentPage} of {totalProblemPages || 1}</span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalProblemPages))}
                  disabled={currentPage === totalProblemPages || totalProblemPages === 0}
                  className={`p-2 rounded ${currentPage === totalProblemPages || totalProblemPages === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalProblemPages)}
                  disabled={currentPage === totalProblemPages || totalProblemPages === 0}
                  className={`p-2 rounded ${currentPage === totalProblemPages || totalProblemPages === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            {/* <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-3">
              <Users className="text-blue-400" size={20} />
              <h2 className="text-xl font-semibold">
                Students <span className="text-blue-400">({batch.students?.length || 0})</span>
              </h2>
            </div> */}
            {/* Students Table (reuse your existing students table and pagination here) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-700 pb-3">
              <div className="flex items-center gap-2 mb-3 sm:mb-0">
                <Users className="text-blue-400" size={20} />
                <h2 className="text-xl font-semibold">
                  Students <span className="text-blue-400">({batch.students?.length || 0})</span>
                </h2>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>            {filteredStudents && filteredStudents.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Batch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Semester
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Branch
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {currentStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{student.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{student.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{student.batch || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{student.semester || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{student.branch || '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <div className="flex items-center bg-gray-700 px-3 py-1 rounded">
                      <span>Page {currentPage} of {totalPages || 1}</span>
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`p-2 rounded ${currentPage === totalPages || totalPages === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`p-2 rounded ${currentPage === totalPages || totalPages === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:bg-gray-700'}`}
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-gray-750 rounded-lg">
                <Users size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? 'No students match your search' : 'No students in this batch'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BatchDetails;
