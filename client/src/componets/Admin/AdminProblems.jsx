import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

const PAGE_SIZE = 7;

const AdminProblems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/admin/problems?page=${currentPage}&limit=${PAGE_SIZE}`);
        console.log("Response from server:", res.data);
        if (res.data.success) {
          setProblems(res.data.problems);
          setTotalPages(res.data.totalPages);
          setTotalProblems(res.data.total);
        } else {
          setError(res.data.message || "Failed to fetch problems.");
        }
      } catch (err) {
        setError("Error fetching problems.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [currentPage]);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <BookOpen className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Problems Dashboard
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
      <main className="flex-1 flex flex-col items-center px-2 md:px-8 py-8">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <p className="text-blue-300 text-lg font-medium">
                List of all problems, their creators, and assigned batches.
              </p>
            </div>
            <div className="flex items-center bg-gradient-to-r from-gray-800 to-gray-900 py-3 px-6 rounded-xl shadow font-semibold text-lg">
              <span>Total Problems:</span>
              <span className="ml-3 text-2xl font-extrabold text-blue-400">
                {totalProblems}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl shadow-2xl bg-[#222733]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                  <p className="mt-4 text-blue-400 text-lg font-semibold">
                    Loading, please wait...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-red-400 text-lg">
                {error}
              </div>
            ) : problems.length === 0 ? (
              <div className="text-center py-16 text-blue-300 text-lg">
                No problems found.
              </div>
            ) : (
              <>
                <table className="min-w-full text-base text-left text-white">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-blue-300">
                    <tr>
                      <th className="py-4 px-6 rounded-tl-xl">#</th>
                      <th className="py-4 px-6">Title</th>
                      <th className="py-4 px-6">Difficulty</th>
                      <th className="py-4 px-6">Created By</th>
                      <th className="py-4 px-6">Assigned Batches</th>
                      <th className="py-4 px-6">Total Marks</th>
                      <th className="py-4 px-6">Submissions</th>
                      <th className="py-4 px-6 rounded-tr-xl">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem, idx) => (
                      <tr
                        key={problem._id}
                        className={`transition-all duration-150 ${
                          idx % 2 === 0
                            ? "bg-[#23272f] hover:bg-blue-950"
                            : "bg-[#1a1d23] hover:bg-blue-950"
                        }`}
                      >
                        <td className="py-3 px-6 font-bold text-white">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="py-3 px-6 text-white">{problem.title}</td>
                        <td className="py-3 px-6 text-white">
                          {problem.difficulty}
                        </td>
                        <td className="py-3 px-6 text-white">
                          {problem.createdBy?.username || "Unknown"}
                        </td>
                        <td className="py-3 px-6 text-white">
                          {problem.assignedBatches &&
                          problem.assignedBatches.length > 0 ? (
                            problem.assignedBatches.map((b) => b.name).join(", ")
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-white">
                          {problem.totalMarks}
                        </td>
                        <td className="py-3 px-6 text-white">
                          {problem.count ?? 0}
                        </td>
                        <td className="py-3 px-6 text-white">
                          {new Date(problem.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-end mt-6">
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, idx) => (
                        <button
                          key={idx + 1}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                            currentPage === idx + 1
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 text-gray-200 hover:bg-blue-700 hover:text-white"
                          } transition`}
                          onClick={() => setCurrentPage(idx + 1)}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProblems;