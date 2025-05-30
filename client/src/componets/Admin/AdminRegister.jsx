import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import { FaUserTie } from "react-icons/fa";

const AdminRegister = () => {
  const user = useSelector((store) => store.app.user);
  const [facultys, setFacultys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facultyPage, setFacultyPage] = useState(1);
  const [totalFacultyPages, setTotalFacultyPages] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);

  const itemsPerPage = 8;
  const navigate = useNavigate();

  const fetchFacultys = async (page) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/admin/faculty/get-faculty-by-admin", {
        page,
        limit: itemsPerPage,
      });
      if (response.data.success) {
        setFacultys(response.data.facultys);
        setTotalFacultyPages(response.data.totalPages);
        setTotalFaculty(response.data.totalStudents);
      } else {
        setError(response.data.message || "Failed to fetch faculty.");
      }
    } catch (err) {
      setError("An error occurred while fetching faculty.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultys(facultyPage);
    // eslint-disable-next-line
  }, [facultyPage]);

  const handleFacultyClick = (facultyId) => {
    navigate(`/faculty/${facultyId}/batches`);
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
              <FaUserTie className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Faculty Info
              </h1>
            </div>
            <button
              className="py-2.5 px-6 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate("/pending-requests")}
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
      <main className="container mx-auto px-4 py-8">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <p className="text-blue-300 text-lg font-medium">
                List of all registered faculty members.
              </p>
            </div>
            <div className="flex items-center bg-gradient-to-r from-gray-800 to-gray-900 py-3 px-6 rounded-xl shadow font-semibold text-lg">
              <span>Total Registered:</span>
              <span className="ml-3 text-2xl font-extrabold text-yellow-400">{totalFaculty}</span>
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
            ) : (
              <table className="min-w-full text-base text-left text-blue-100">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-blue-200">
                  <tr>
                    <th className="py-4 px-6 rounded-tl-xl">#</th>
                    <th className="py-4 px-6">Username</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Branch</th>
                    <th className="py-4 px-6">Batches</th>
                    <th className="py-4 px-6 rounded-tr-xl">Create Date</th>
                  </tr>
                </thead>
                <tbody>
                  {facultys.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-6 px-6 text-center text-blue-300 text-lg"
                      >
                        Data not available
                      </td>
                    </tr>
                  ) : (
                    facultys.map((faculty, index) => (
                      <tr
                        key={faculty._id}
                        onClick={() => handleFacultyClick(faculty._id)}
                        className={`cursor-pointer transition-all duration-150 ${
                          index % 2 === 0
                            ? "bg-[#23272f] hover:bg-blue-950"
                            : "bg-[#1a1d23] hover:bg-blue-950"
                        }`}
                      >
                        <td className="py-3 px-6 font-bold">{index + 1}</td>
                        <td className="py-3 px-6">{faculty.username}</td>
                        <td className="py-3 px-6">{faculty.email}</td>
                        <td className="py-3 px-6">
                          {faculty?.branch?.toUpperCase()}
                        </td>
                        <td className="py-3 px-6">
                          {faculty.batches && faculty.batches.length > 0 ? (
                            <span
                              title={
                                Array.isArray(faculty.batches)
                                  ? faculty.batches
                                      .map((b) => (typeof b === "string" ? b : b.name))
                                      .join(", ")
                                  : ""
                              }
                            >
                              {faculty.batches
                                .slice(0, 3)
                                .map((b) => (typeof b === "string" ? b : b.name))
                                .join(", ")}
                              {faculty.batches.length > 3 && (
                                <span className="text-blue-400">
                                  , +{faculty.batches.length - 3} more
                                </span>
                              )}
                            </span>
                          ) : (
                            "No batches"
                          )}
                        </td>
                        <td className="py-3 px-6">
                          {formatDate(faculty.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {totalFacultyPages > 1 && (
            <div className="flex justify-end mt-6">
              <div className="flex gap-2">
                {Array.from({ length: totalFacultyPages }, (_, idx) => (
                  <button
                    key={idx + 1}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      facultyPage === idx + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-blue-700 hover:text-white"
                    } transition`}
                    onClick={() => setFacultyPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminRegister;