import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { FaUserGraduate } from "react-icons/fa"; // Add icon for header

const STUDENTS_PER_PAGE = 5;

const SemesterStudentList = () => {
  
  const { semesterId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  // Track page for each batch
  const [batchPages, setBatchPages] = useState({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axiosInstance.get("/problems/getStudents");
        setStudents(
          res.data.students.filter(
            (s) => String(s.semester) === String(semesterId)
          )
        );
      } catch (err) {
        setError("Failed to fetch students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [semesterId]);

  // Group students by batch
  const batchGroups = {};
  students.forEach((student) => {
    const batch = student.batch || "Unknown";
    if (!batchGroups[batch]) batchGroups[batch] = [];
    batchGroups[batch].push(student);
  });

  // Ensure batchPages state is initialized for all batches
  useEffect(() => {
    const newPages = {};
    Object.keys(batchGroups).forEach((batch) => {
      newPages[batch] = batchPages[batch] || 1;
    });
    setBatchPages(newPages);
    // eslint-disable-next-line
  }, [students.length]);

  // Handle page change for a batch
  const handlePageChange = (batch, newPage) => {
    setBatchPages((prev) => ({
      ...prev,
      [batch]: newPage,
    }));
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-0 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUserGraduate className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Semester {semesterId} - Students by Batch
              </h1>
            </div>
            <button
              className="py-2.5 px-6 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate(-1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-2 md:px-7 py-8">
        <div className="w-full">
          <div className="mb-8">
            <p className="text-blue-300 text-base">
              Students are shown batch-wise, 5 per page.
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg shadow-md p-4">
            {loading ? (
              <div className="flex justify-center items-center min-h-[120px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-opacity-75"></div>
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              Object.keys(batchGroups).length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-700 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-300">No students found</h3>
                  <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    There are no students enrolled in this semester yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(batchGroups)
                    .sort((a, b) => a.localeCompare(b))
                    .map((batch) => {
                      const page = batchPages[batch] || 1;
                      const studentsInBatch = batchGroups[batch];
                      const totalPages = Math.ceil(studentsInBatch.length / STUDENTS_PER_PAGE);
                      const startIdx = (page - 1) * STUDENTS_PER_PAGE;
                      const paginatedStudents = studentsInBatch.slice(startIdx, startIdx + STUDENTS_PER_PAGE);

                      return (
                        <div key={batch} className="bg-gray-800/70 rounded-xl shadow-md overflow-hidden h-full flex flex-col">
                          {/* Compact Elegant Header (without export button) */}
                          <div className="bg-gradient-to-r from-gray-850 to-gray-900 border-b border-gray-700">
                            <div className="px-5 py-3">
                              <div className="flex items-center">
                                {/* Left side batch label with colored accent */}
                                <div className="w-1.5 h-10 bg-blue-500 rounded-r-full mr-3"></div>
                                <div>
                                  <h2 className="text-lg font-bold text-white">{batch.toUpperCase()}</h2>
                                  <p className="text-blue-300 text-xs mt-0.5">
                                    {studentsInBatch.length} Student{studentsInBatch.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Students List in a clean, compact layout */}
                          <div className="flex-1 overflow-x-auto">
                            {paginatedStudents.length === 0 ? (
                              <div className="py-6 text-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p>No students in this batch</p>
                              </div>
                            ) : (
                              <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                  <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Branch</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                  {paginatedStudents.map((student, idx) => (
                                    <tr 
                                      key={student.id}
                                      className={`${idx % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'} hover:bg-gray-700/50 transition-colors`}
                                    >
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className={`flex-shrink-0 h-7 w-7 rounded-full ${getGradientForInitial(student.username.charAt(0).toUpperCase())} flex items-center justify-center`}>
                                            <span className="text-white text-xs font-medium">
                                              {student.username.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="ml-2">
                                            <div className="text-sm font-medium text-white">{student.username}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-300">
                                        {student.id}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-900/30 text-blue-300">
                                          {student.branch || 'N/A'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                          
                          {/* Simplified Pagination */}
                          {totalPages > 1 && (
                            <div className="bg-gray-850 border-t border-gray-700 px-3 py-2 flex items-center justify-between">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handlePageChange(batch, Math.max(1, page - 1))}
                                  disabled={page === 1}
                                  className={`p-1 rounded ${
                                    page === 1 
                                      ? 'text-gray-600 cursor-not-allowed' 
                                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                
                                <div className="text-xs text-gray-400 mx-2">
                                  <span className="bg-gray-750 px-1.5 py-0.5 rounded text-white font-medium">{page}</span>
                                  <span className="mx-1">of</span>
                                  <span>{totalPages}</span>
                                </div>
                                
                                <button
                                  onClick={() => handlePageChange(batch, Math.min(totalPages, page + 1))}
                                  disabled={page === totalPages}
                                  className={`p-1 rounded ${
                                    page === totalPages 
                                      ? 'text-gray-600 cursor-not-allowed' 
                                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SemesterStudentList;

/* Helper function to get a gradient based on the initial letter */
function getGradientForInitial(initial) {
  /* Map of gradients for different letter ranges */
  const gradients = [
    'bg-gradient-to-br from-blue-500 to-blue-600',    // A-D
    'bg-gradient-to-br from-purple-500 to-indigo-600', // E-H
    'bg-gradient-to-br from-green-500 to-emerald-600',  // I-L
    'bg-gradient-to-br from-red-500 to-rose-600',     // M-P
    'bg-gradient-to-br from-amber-500 to-yellow-600',  // Q-T
    'bg-gradient-to-br from-pink-500 to-fuchsia-600',  // U-X
    'bg-gradient-to-br from-cyan-500 to-sky-600',     // Y-Z
  ];
  
  // Convert letter to its position in alphabet (0-25)
  const position = initial.charCodeAt(0) - 65;
  
  // Get gradient based on position
  const index = Math.floor(position / 4) % gradients.length;
  return gradients[index >= 0 ? index : 0];
}