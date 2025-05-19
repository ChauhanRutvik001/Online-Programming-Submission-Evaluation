import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
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

const StudentInfo = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [branchWiseCount, setBranchWiseCount] = useState([]);
  const [semesterWiseCount, setSemesterWiseCount] = useState({});
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/problems/getStudents");
        setUsers(response.data.students);
        setTotalStudents(response.data.totalStudents);
        setBranchWiseCount(response.data.branchWiseCount);
        setSemesterWiseCount(response.data.semesterBranchBatchWiseCount);
      } catch (err) {
        setError("Failed to fetch student data. Please try again later.");
        console.error("Error fetching sorted users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const [selectedStudents, setSelectedStudents] = useState([]);

  const handleSelectStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === users.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(users.map((user) => user.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navbar */}
      <nav className="w-full bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-800 shadow-lg px-4 py-4 flex items-center justify-between z-40">
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
        <main className="flex-1 flex flex-col items-center px-2 md:px-8 py-8 mt-6">
          <div className="w-full max-w-5xl">
            {/* Added prominent heading */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-blue-200">Student Info</h1>
                <p className="text-blue-300 text-base">
                  Overview of all registered students, batch-wise and semester-wise.
                </p>
              </div>
              <button
                className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition transform duration-200"
                onClick={() => navigate(-1)}
              >
                Back to Dashboard
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg shadow-md p-6">
              {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                    <p className="mt-4 text-blue-500 text-lg font-medium">
                      Loading, please wait...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xl font-medium">
                    Total Students: <span className="text-yellow-400 font-bold">{totalStudents}</span>
                  </p>
                  <BranchWiseCount branches={branchWiseCount} />
                  <SemesterWiseCount semesters={semesterWiseCount} />
                  {error && (
                    <div className="px-4 py-2 mb-4 bg-red-700 text-white rounded">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const BranchWiseCount = ({ branches }) => (
  <div className="mt-4 mb-4">
    <h3 className="text-lg font-medium text-white">Batch-wise Count:</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {branches.map((branch, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4"
        >
          <span className="text-sm font-semibold text-yellow-400">
            {branch._id?.toUpperCase()}
          </span>
          <span className="text-sm text-gray-300">{branch.count} students</span>
        </div>
      ))}
    </div>
  </div>
);

const SemesterWiseCount = ({ semesters }) => (
  <div className="pb-4">
    <h3 className="text-lg font-medium text-white">Semester-wise Count:</h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
      {Object.entries(semesters).map(([semester, branches]) => (
        <div
          key={semester}
          className="border border-gray-700 rounded-lg bg-gray-800 p-4"
        >
          <h4 className="text-md font-semibold text-blue-400 mb-2">
            Semester: {semester}
          </h4>
          {Object.entries(branches).map(([branch, batches]) => (
            <div key={branch} className="mb-4">
              <h5 className="text-sm font-medium text-yellow-400">
                Branch: {branch.toUpperCase()}
              </h5>
              <ul className="mt-2 space-y-1">
                {Object.entries(batches).map(([batch, count]) => (
                  <li
                    key={batch}
                    className="text-sm text-gray-300 bg-gray-900 p-2 rounded-md"
                  >
                    <span className="font-medium text-green-400">
                      Batch {batch.toUpperCase()}:
                    </span>{" "}
                    {count} students
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default StudentInfo;