import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { 
  FaUser,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";
import ConfirmationModal from "../ConfirmationModal";
import { toast } from "react-hot-toast";

const ManageUser = () => {
  // Data states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // UI state for user type selection
  const [userType, setUserType] = useState(() => localStorage.getItem("userType") || "student");

  // Edit modal state
  const [editUser, setEditUser] = useState(null);
  const navigate = useNavigate();

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const itemsPerPage = 10;
  const fetchUsers = async (page, search = "", sort = "createdAt", order = "desc") => {
    try {
      setLoading(true);
      const endpoint = userType === "teacher" ? "/admin/getFaculty" : "/admin/getStudents";
      
      // Map sortBy to backend format
      let backendSort = "newest";
      if (sort === "createdAt") {
        backendSort = order === "asc" ? "oldest" : "newest";
      }
      
      const response = await axiosInstance.post(endpoint, {
        page,
        limit: itemsPerPage,
        search: search.trim(),
        sort: backendSort,
      });
      
      if (response.data.success) {
        const userData = userType === "teacher" ? response.data.facultys : response.data.students;
        const totalCount = userType === "teacher" ? response.data.totalFaculty : response.data.totalStudents;
        
        setUsers(userData);
        setTotalPages(response.data.totalPages);
        setTotalUsers(totalCount);
        setError("");
      } else {
        setError(response.data.message || "Failed to fetch users.");
      }
    } catch (err) {
      setError("An error occurred while fetching users.");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [currentPage, searchTerm, sortBy, sortOrder, userType]);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
    localStorage.setItem("userType", e.target.value);
    setCurrentPage(1);
    setSearchTerm("");
    setSortBy("createdAt");
    setSortOrder("desc");
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

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <FaSort className="w-3 h-3 ml-1" />;
    }
    return sortOrder === "asc" ? (
      <FaSortUp className="w-3 h-3 ml-1" />
    ) : (
      <FaSortDown className="w-3 h-3 ml-1" />
    );
  };
  // Delete handlers
  const handleDeleteUser = (id) => {
    setUserToDelete({ id, type: userType });
    setShowDeleteModal(true);
  };

  // Confirm delete logic
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (userToDelete.type === "teacher") {
        await axiosInstance.post("/admin/deleteFaculty", { facultyId: userToDelete.id });
        toast.success("Teacher deleted successfully!");
      } else {
        await axiosInstance.post("/admin/removeStudent", { userId: userToDelete.id });
        toast.success("Student deleted successfully!");
      }
      // Refresh the list
      fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Edit handlers
  const handleEditUser = (user) => {
    setEditUser(user);
  };
  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUser className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                User Management
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

      {/* Main Content - Full Screen */}
      <main className="px-4 py-8">
        <div className="w-full">
          {/* Search and Stats Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={`Search ${userType}s by name, email, or ID...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Search and manage all registered {userType}s
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Type Filter */}
              <select
                value={userType}
                onChange={handleUserTypeChange}
                className="py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
              
              {/* Total Count */}
              <div className="flex items-center bg-gray-800 py-3 px-6 rounded-xl shadow font-semibold text-lg">
                <span>Total {userType === "teacher" ? "Teachers" : "Students"}:</span>
                <span className="ml-3 text-2xl font-extrabold text-blue-400">{totalUsers}</span>
              </div>
            </div>
          </div>

          {/* Table Section - Full Width */}
          <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-700 text-gray-200 text-sm uppercase">
                      <th className="py-4 px-6 text-left w-16">
                        <span className="font-semibold">#</span>
                      </th>
                      <th className="py-4 px-6 text-left min-w-[200px]">
                        <button
                          onClick={() => handleSort("username")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Name {getSortIcon("username")}
                        </button>
                      </th>
                      {userType === "teacher" && (
                        <th className="py-4 px-6 text-left min-w-[250px]">
                          <button
                            onClick={() => handleSort("email")}
                            className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                          >
                            Email {getSortIcon("email")}
                          </button>
                        </th>
                      )}
                      <th className="py-4 px-6 text-left min-w-[150px]">
                        <button
                          onClick={() => handleSort("id")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          ID {getSortIcon("id")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left min-w-[150px]">
                        <button
                          onClick={() => handleSort("batch")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          {userType === "teacher" ? "Branch" : "Batch"} {getSortIcon("batch")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-center min-w-[150px]">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center justify-center font-semibold mx-auto hover:text-blue-300 transition-colors"
                        >
                          Created Date {getSortIcon("createdAt")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-center min-w-[120px]">
                        <span className="font-semibold">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={userType === "teacher" ? "7" : "6"} className="py-8 px-6 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                            <p className="text-lg font-medium">No {userType}s found</p>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? `No results for "${searchTerm}"` : `No ${userType}s registered yet`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr
                          key={user._id}
                          className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-4 px-6 text-gray-300 font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white text-sm font-medium">
                                  {user.username?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              <div className="font-semibold text-blue-400">
                                {user.username}
                              </div>
                            </div>
                          </td>
                          {userType === "teacher" && (
                            <td className="py-4 px-6 text-gray-300">
                              {user.email}
                            </td>
                          )}
                          <td className="py-4 px-6 text-gray-300">
                            {user.id}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30">
                              {userType === "teacher" ? (user.branch || "N/A") : (user.batch || "N/A")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center text-gray-400 text-sm">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                onClick={() => handleEditUser(user)}
                              >
                                Edit
                              </button>
                              <button
                                className="px-3 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Always Show Pagination Controls */}
          <div className="flex justify-center items-center mt-8 gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <FaChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers - Always show current page info */}
            <div className="flex gap-1">
              {totalPages <= 1 ? (
                <span className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">
                  1
                </span>
              ) : (
                [...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages || totalPages <= 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Next
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pagination Info */}
          {totalUsers > 0 && (
            <div className="text-center mt-4 text-gray-400 text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} {userType}s
              {totalPages > 1 && (
                <span className="ml-4">Page {currentPage} of {totalPages}</span>
              )}
            </div>
          )}
        </div>
      </main>      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">
              Edit {userType === "teacher" ? "Teacher" : "Student"}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (userType === "teacher") {
                    await axiosInstance.post(
                      `/admin/editFaculty/${editUser._id}`,
                      {
                        _id: editUser._id,
                        username: editUser.username,
                        email: editUser.email,
                        id: editUser.id,
                      }
                    );
                  } else {
                    await axiosInstance.post(
                      `/admin/editStudent/${editUser._id}`,
                      {
                        _id: editUser._id,
                        username: editUser.username,
                        id: editUser.id,
                        batch: editUser.batch,
                      }
                    );
                  }
                  toast.success(
                    `${userType === "teacher" ? "Teacher" : "Student"} updated successfully!`
                  );
                  setEditUser(null);
                  fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
                } catch (err) {
                  toast.error("Failed to update user.");
                }
              }}
            >
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={editUser.username || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                  required
                />
              </div>
              
              {userType === "teacher" && (
                <div className="mb-3">
                  <label className="block text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                    value={editUser.email || ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, email: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">
                  {userType === "teacher" ? "Faculty ID" : "Student ID"}
                </label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={editUser.id || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, id: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">
                  {userType === "teacher" ? "Branch" : "Batch"}
                </label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={userType === "teacher" ? (editUser.branch || "") : (editUser.batch || "")}
                  onChange={(e) =>
                    setEditUser({ 
                      ...editUser, 
                      [userType === "teacher" ? "branch" : "batch"]: e.target.value 
                    })
                  }
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDeleteUser}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
      )}
    </div>
  );
};

export default ManageUser;