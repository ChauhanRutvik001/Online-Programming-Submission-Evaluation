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
                <div className="text-gray-400">No students found for this semester.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(batchGroups)
                    .sort((a, b) => a.localeCompare(b))
                    .map((batch) => {
                      const page = batchPages[batch] || 1;
                      const studentsInBatch = batchGroups[batch];
                      const totalPages = Math.ceil(studentsInBatch.length / STUDENTS_PER_PAGE);
                      const startIdx = (page - 1) * STUDENTS_PER_PAGE;
                      const paginatedStudents = studentsInBatch.slice(startIdx, startIdx + STUDENTS_PER_PAGE);

                      return (
                        <div key={batch} className="bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-col">
                          <h2 className="text-lg font-semibold text-yellow-400 mb-2 text-center">
                            Batch: {batch.toUpperCase()}
                          </h2>
                          {/* Pagination controls above */}
                          {totalPages > 1 && (
                            <div className="flex justify-end items-center gap-2 mb-2">
                              {Array.from({ length: totalPages }, (_, idx) => (
                                <button
                                  key={idx + 1}
                                  className={`px-2 py-1 rounded text-xs ${
                                    page === idx + 1
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-700 text-gray-200"
                                  }`}
                                  onClick={() => handlePageChange(batch, idx + 1)}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Student Table */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-gray-900 rounded">
                              <thead>
                                <tr>
                                  <th className="px-3 py-2 text-left text-blue-200 text-xs">Name</th>
                                  <th className="px-3 py-2 text-left text-blue-200 text-xs">ID</th>
                                  <th className="px-3 py-2 text-left text-blue-200 text-xs">Branch</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedStudents.map((student) => (
                                  <tr key={student.id} className="border-b border-gray-700">
                                    <td className="px-3 py-2 text-sm">{student.username}</td>
                                    <td className="px-3 py-2 text-sm">{student.id}</td>
                                    <td className="px-3 py-2 text-sm">{student.branch}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Pagination controls below */}
                          {totalPages > 1 && (
                            <div className="flex justify-end items-center gap-2 mt-2">
                              <span className="text-gray-300 text-xs">
                                Page {page} of {totalPages}
                              </span>
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