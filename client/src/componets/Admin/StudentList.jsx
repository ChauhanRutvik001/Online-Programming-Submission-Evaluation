import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { UsersRound } from "lucide-react";

const StudentList = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const studentsPerPage = 10;
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchStudents = async (page) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/admin/batch/batches/${batchId}/students?page=${page}&limit=${studentsPerPage}`
      );
      if (response.data.success) {
        setStudents(response.data.students);
        setTotalPages(response.data.totalPages);
        setTotalStudents(response.data.totalStudents);
      } else {
        setError(response.data.message || "Failed to fetch students.");
      }
    } catch (err) {
      setError("An error occurred while fetching students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(currentPage);
    // eslint-disable-next-line
  }, [batchId, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <UsersRound className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Batch Students
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
              Back to Batches
            </button>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center ml-4 text-white py-2 px-4 rounded-full shadow-lg text-lg font-semibold">
          <span>Total Number of Students Registered:</span>
          <span className="ml-2 text-xl font-bold">{totalStudents}</span>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
              <p className="mt-4 text-blue-500 text-lg font-medium">
                Loading, please wait...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : students.length === 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-10 text-center">
            <UsersRound size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">No Students Found</h2>
            <p className="text-gray-400 mb-6">
              There are no students registered in this batch yet.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl shadow-2xl bg-[#222733] p-4">
              <table className="min-w-full text-base text-left text-blue-100">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-blue-200">
                  <tr>
                    <th className="py-3 px-6">#</th>
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Username</th>
                    <th className="py-3 px-6">Semester</th>
                    <th className="py-3 px-6">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr
                      key={student._id}
                      className={`${
                        index % 2 === 0 ? "bg-[#23272f]" : "bg-[#1a1d23]"
                      }`}
                    >
                      <td className="py-3 px-6">
                        {(currentPage - 1) * studentsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-6">
                        {student?.id?.toUpperCase()}
                      </td>
                      <td className="capitalize py-3 px-6">
                        {student?.username}
                      </td>
                      <td className="py-3 px-6">{student?.semester}</td>
                      <td className="py-3 px-6">
                        {student?.batch?.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-300 pr-2 pl-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentList;