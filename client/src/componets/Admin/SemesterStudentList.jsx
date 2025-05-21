import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import Sidebar from "./Sidebar";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <nav className="w-full bg-gradient-to-b from-gray-800 via-grey-800 to-gray-800  px-4 flex items-center justify-between z-40">
        {/* Hamburger for small screens */}
      </nav>
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col items-center px-2 md:px-7 py-8 mt-16">
        <div className="w-full max-w-5xl">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-200">
                Semester {semesterId} - Students by Batch
              </h1>
              <p className="text-blue-300 text-base">
                Students are shown batch-wise, 5 per page.
              </p>
            </div>
            <button
              className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition transform duration-200"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
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