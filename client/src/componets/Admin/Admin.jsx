import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import {
  FaUserPlus,
  FaLayerGroup,
  FaUserTie,
  FaArrowLeft,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
} from "react-icons/fa";

// Skeleton loader component for stats cards
const StatCardSkeleton = () => (
  <div className="animate-pulse bg-gray-800/80 rounded-xl p-5 flex flex-col">
    <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="h-12 bg-gray-700 rounded mb-3"></div>
    <div className="flex justify-between items-end">
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

// Activity skeleton loader
const ActivitySkeleton = () => (
  <div className="animate-pulse bg-gray-800/80 rounded-xl p-5 flex flex-col">
    <div className="h-5 w-28 bg-gray-600 rounded mb-2 skeleton-shimmer"></div>
    <div className="h-10 w-20 bg-gray-600 rounded mt-2 skeleton-shimmer"></div>
  </div>
);

// Import CSS for grid background pattern and shimmer effect
const gridBgStyle = `
@keyframes gridBackgroundMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.bg-grid-white {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  animation: gridBackgroundMove 15s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #4b5563 25%, #6b7280 50%, #4b5563 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
`;

const Admin = () => {
  const user = useSelector((store) => store?.app?.user);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    batches: 0,
    contests: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userList, setUserList] = useState([]); // <-- Add userList state

  // Only admin allowed
  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user, navigate]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard statistics and user list
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/admin/batch/dashboard-stats');
        if (response.data && response.data.success) {
          setStats({
            students: response.data.studentCount || 0,
            faculty: response.data.facultyCount || 0,
            batches: response.data.batchCount || 0,
            contests: response.data.contestCount || 0
          });
          if (response.data.recentActivity && Array.isArray(response.data.recentActivity)) {
            const formattedActivity = response.data.recentActivity.map(activity => ({
              id: activity._id || activity.id,
              type: activity.userType || 'student',
              name: activity.name || activity.userName || 'User',
              action: activity.action || 'action',
              timestamp: new Date(activity.timestamp || activity.createdAt || Date.now())
            }));
            setRecentActivity(formattedActivity);
          }
        } else {
          setStats({
            students: 0,
            faculty: 0,
            batches: 0,
            contests: 0
          });
          setRecentActivity([]);
          toast.error("Could not load dashboard data properly");
        }
      } catch (error) {
        toast.error("Failed to load dashboard data");
        setStats({
          students: 0,
          faculty: 0,
          batches: 0,
          contests: 0
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch user list from backend
    const fetchUserList = async () => {
      try {
        setLoading(true);
        // Replace this endpoint with your actual backend API for users
        const res = await axiosInstance.get('/admin/batch/dashboard-users');
        if (res.data && res.data.success && Array.isArray(res.data.users)) {
          setUserList(res.data.users);
          console.log(res.data.users);
        } else {
          setUserList([]);
          toast.error("Could not load user list");
        }
      } catch (err) {
        setUserList([]);
        toast.error("Failed to load user list");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchUserList();
  }, []);

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date as Weekday, Month Day, Year
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time relative to now (e.g., "2 hours ago")
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
  };

  // Get appropriate icon for activity type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'student':
        return (
          <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
        );
      case 'faculty':
        return (
          <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'admin':
        return (
          <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-500/20 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <>
      <style>{gridBgStyle}</style>
      <div className="min-h-screen bg-gray-900 text-white flex">
        {/* Sidebar */}
       <Sidebar />
        {/* Main Content */}
        <div className="flex-1 md:ml-60 bg-gray-900 mt-8">
          {/* Header Section */}
          <div className="from-gray-900 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
            <div className="absolute inset-0"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="mt-16"></div>
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Admin Dashboard
                </h1>
                <div className="hidden md:block">
                  <div className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs font-medium text-blue-200/80 text-right">{formatDate(currentTime)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  {/* Students Card */}
                  <div className="group bg-gradient-to-br from-blue-900/90 to-blue-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-blue-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-blue-300 text-sm font-medium">Total Students</p>
                          <h3 className="mt-1 text-4xl font-bold text-white">{stats.students}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button 
                          onClick={() => navigate("/studentinformation")}
                          className="text-blue-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-blue-300/70 text-xs">Last updated: Today</span>
                      </div>
                    </div>
                  </div>
                  {/* Faculty Card */}
                  <div className="group bg-gradient-to-br from-purple-900/90 to-purple-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-purple-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-purple-300 text-sm font-medium">Total Faculty</p>
                          <h3 className="mt-1 text-4xl font-bold text-white">{stats.faculty}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button 
                          onClick={() => navigate("/registerFaculty")}
                          className="text-purple-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-purple-300/70 text-xs">Last updated: Today</span>
                      </div>
                    </div>
                  </div>
                  {/* Batches Card */}
                  <div className="group bg-gradient-to-br from-emerald-900/90 to-emerald-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-emerald-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-emerald-300 text-sm font-medium">Active Batches</p>
                          <h3 className="mt-1 text-4xl font-bold text-white">{stats.batches}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button 
                          onClick={() => navigate("/admin/batch/batches")}
                          className="text-emerald-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-emerald-300/70 text-xs">Last updated: Today</span>
                      </div>
                    </div>
                  </div>
                  {/* Contests Card */}
                  <div className="group bg-gradient-to-br from-amber-900/90 to-amber-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-amber-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-amber-300 text-sm font-medium">Total Contests</p>
                          <h3 className="mt-1 text-4xl font-bold text-white">{stats.contests}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button 
                          className="text-amber-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-amber-300/70 text-xs">Last updated: Today</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* User List and Recent Activity side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* User List Table (from backend) */}
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm flex flex-col">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 py-4 px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <FaUsers className="mr-2 text-blue-300" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">User List</span>
                  </div>
                  <button
                    onClick={() => navigate("/admin/users")}
                    className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Manage Users
                  </button>
                </div>
                <div className="p-6 overflow-x-auto flex-1">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="py-2 px-2">ID</th>
                        <th className="py-2 px-2">Name</th>
                        <th className="py-2 px-2">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-gray-400">Loading...</td>
                        </tr>
                      ) : userList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-gray-400">No users found.</td>
                        </tr>
                      ) : (
                        userList.slice(0, 5).map((user) => (
                          <tr key={user._id || user.id} className="border-t border-gray-700">
                            <td className="py-2 px-2">{user.id || user.id}</td>
                            <td className="py-2 px-2">{user.username}</td>
                            <td className="py-2 px-2">{user.role}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-500 hover:shadow-indigo-900/20 hover:shadow-xl relative flex flex-col">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]"></div>
                <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 py-4 px-6 relative z-10">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Recent Activity</span>
                  </h2>
                </div>
                <div className="p-4 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar flex-1">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(index => (
                        <div key={`activity-skeleton-${index}`} className="flex items-center gap-4 animate-pulse">
                          <div className="h-10 w-10 rounded-full bg-gray-700 skeleton-shimmer"></div>
                          <div className="flex-1">
                            <div className="h-4 w-3/4 bg-gray-700 rounded mb-2 skeleton-shimmer"></div>
                            <div className="h-3 w-1/2 bg-gray-700 rounded skeleton-shimmer"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-700/50">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">
                              <span className="font-medium text-white">{activity.name}</span>{" "}
                              <span className="text-gray-400">{activity.action}</span>
                            </p>
                            <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* ...rest of your code... */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;