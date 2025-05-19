import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import {
  FaUserPlus,
  FaLayerGroup,
  FaUserTie,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
} from "react-icons/fa";

const sidebarLinks = [
  { name: "Dashboard", icon: <FaHome />, to: "/pending-requests" },
  { name: "Manage Users", icon: <FaUsers />, to: "/admin/users" },
  { name: "Student Registration", icon: <FaUserPlus />, to: "/registerStudents" },
  { name: "Teacher Registration", icon: <FaChalkboardTeacher />, to: "/create-faculty" },
  { name: "Batch Creation", icon: <FaLayerGroup />, to: "/admin/batch/batches/create" },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  }, [facultyPage]);

  const handleFacultyClick = (facultyId) => {
    navigate(`/students/${facultyId}`);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navbar */}
      <nav className="w-full bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-800 shadow-lg px-4 py-4 flex items-center justify-between z-40">
        {/* Hamburger for small screens */}
        <div className="md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full bg-gray-800 text-white shadow-lg focus:outline-none"
            aria-label="Open sidebar"
          >
            <svg width="24" height="24" fill="none">
              <rect y="4" width="24" height="2" rx="1" fill="currentColor"/>
              <rect y="11" width="24" height="2" rx="1" fill="currentColor"/>
              <rect y="18" width="24" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </nav>
      <div className="flex">
        {/* Sidebar for large screens */}
        <aside className="hidden md:flex flex-col w-60 bg-gray-800/90 border-r border-gray-700 shadow-lg py-8 px-4 min-h-screen">
          <div className="mb-8 mt-6">
            <ul className="space-y-2">
              {sidebarLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.to)}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 text-blue-100 font-medium transition"
                  >
                    {link.icon}
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        {/* Sidebar Drawer for small screens */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSidebarOpen(false)}>
            <div
              className="absolute top-0 left-0 h-full w-60 bg-gray-900/95 border-r border-gray-700 shadow-2xl py-8 px-4 backdrop-blur-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-8 flex justify-between items-center">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                  aria-label="Close sidebar"
                >
                  &times;
                </button>
              </div>
              <ul className="space-y-2">
                {sidebarLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => {
                        navigate(link.to);
                        setSidebarOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/80 text-blue-100 font-medium transition"
                    >
                      {link.icon}
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center px-2 md:px-8 py-8">
          <div className="w-full max-w-6xl">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 mt-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-blue-200 mb-1">Faculty Register</h1>
                <p className="text-blue-300 text-base">List of all registered faculty members.</p>
              </div>
              <button
                className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition transform duration-200"
                onClick={() => navigate(-1)}
              >
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center text-white py-2 px-4 rounded-lg shadow text-lg font-semibold mb-4 bg-gray-800">
              <span>Total Number of Faculty Registered:</span>
              <span className="ml-2 text-xl font-bold text-yellow-400">{totalFaculty}</span>
            </div>
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                    <p className="mt-4 text-blue-500 text-lg font-medium">
                      Loading, please wait...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <table className="min-w-full text-base text-left text-blue-100">
                    <thead className="bg-gray-800 text-blue-200">
                      <tr>
                        <th className="py-3 px-6">#</th>
                        <th className="py-3 px-6">Username</th>
                        <th className="py-3 px-6">Email</th>
                        <th className="py-3 px-6">Branch</th>
                        <th className="py-3 px-6">Subject</th>
                        <th className="py-3 px-6">Create Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultys.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-3 px-6 text-center text-blue-300"
                          >
                            Data not available
                          </td>
                        </tr>
                      ) : (
                        facultys.map((faculty, index) => (
                          <tr
                            key={faculty._id}
                            onClick={() => handleFacultyClick(faculty._id)}
                            className={`cursor-pointer ${
                              index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                            } hover:bg-gray-700 transition`}
                          >
                            <td className="py-3 px-6">{index + 1}</td>
                            <td className="py-3 px-6">{faculty.username}</td>
                            <td className="py-3 px-6">{faculty.email}</td>
                            <td className="py-3 px-6">
                              {faculty?.branch?.toUpperCase()}
                            </td>
                            <td className="py-3 px-6">{faculty.subject}</td>
                            <td className="py-3 px-6">
                              {formatDate(faculty.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminRegister;