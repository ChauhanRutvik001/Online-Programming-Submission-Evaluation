import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import ConfirmationModal from "../ConfirmationModal";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const ManageUser = () => {
  // Data states
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [teacherTotal, setTeacherTotal] = useState(0);
  const [studentTotal, setStudentTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters and search for teachers
  const [teacherBatch, setTeacherBatch] = useState("");
  const [teacherSort, setTeacherSort] = useState("newest");
  const [teacherSearch, setTeacherSearch] = useState("");

  // Filters and search for students
  const [studentBatch, setStudentBatch] = useState("");
  const [studentSort, setStudentSort] = useState("newest");
  const [studentSearch, setStudentSearch] = useState("");

  // For dropdown options
  const [batches, setBatches] = useState([]);

  // Message state
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success"); // "success" or "error"

  // UI state for user type selection
const [userType, setUserType] = useState(() => localStorage.getItem("userType") || "student");

  // Edit modal state
  const [editUser, setEditUser] = useState(null); // user object or null
  const [editRole, setEditRole] = useState(""); // "teacher" or "student"
  const navigate = useNavigate();

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Debounce hook
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  }

  useEffect(() => {
    // Fetch batches for filter dropdowns
    const fetchMeta = async () => {
      try {
        const batchRes = await axiosInstance.get("/admin/batches");
        setBatches(batchRes.data || []);
      } catch (err) {
        setBatches([]);
      }
    };
    fetchMeta();
  }, []);

  const debouncedTeacherSearch = useDebounce(teacherSearch, 400);
  const debouncedStudentSearch = useDebounce(studentSearch, 400);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (userType === "teacher") {
          // Teachers
          const facultyRes = await axiosInstance.post("/admin/getFaculty", {
            page: teacherPage,
            limit: PAGE_SIZE,
            batch: teacherBatch,
            sort: teacherSort,
            search: debouncedTeacherSearch,
          });
          setTeachers(facultyRes.data.facultys || []);
          setTeacherTotal(facultyRes.data.totalStudents || 0);
        } else {
          // Students
          const studentRes = await axiosInstance.post("/admin/getStudents", {
            page: studentPage,
            limit: PAGE_SIZE,
            batch: studentBatch,
            sort: studentSort,
            search: debouncedStudentSearch,
          });
          setStudents(studentRes.data.students || []);
          setStudentTotal(studentRes.data.totalStudents || 0);
        }
      } catch (err) {
        setTeachers([]);
        setStudents([]);
        setTeacherTotal(0);
        setStudentTotal(0);
      }
      setLoading(false);
    };
    fetchUsers();
    // eslint-disable-next-line
  }, [
    teacherPage,
    studentPage,
    teacherBatch,
    teacherSort,
    debouncedTeacherSearch,
    studentBatch,
    studentSort,
    debouncedStudentSearch,
    userType,
  ]);


  const teacherTotalPages = Math.ceil(teacherTotal / PAGE_SIZE);
  const studentTotalPages = Math.ceil(studentTotal / PAGE_SIZE);

  // Message helpers
  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
  };
  const handleCloseMessage = () => setMessage(null);

  // Delete handlers (open confirmation modal)
  const handleDeleteTeacher = (id) => {
    setUserToDelete({ id, type: "teacher" });
    setShowDeleteModal(true);
  };
  const handleDeleteStudent = (id) => {
    setUserToDelete({ id, type: "student" });
    setShowDeleteModal(true);
  };

  // Confirm delete logic
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (userToDelete.type === "teacher") {
        await axiosInstance.post("/admin/deleteFaculty", { facultyId: userToDelete.id });
        setTeachers((prev) => prev.filter((t) => t._id !== userToDelete.id));
        toast.success("Teacher deleted successfully!");
      } else {
        await axiosInstance.post("/admin/removeStudent", { userId: userToDelete.id });
        setStudents((prev) => prev.filter((s) => s._id !== userToDelete.id));
        toast.success("Student deleted successfully!");
      }
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Edit handlers
  const handleEditTeacher = (teacher) => {
    setEditUser(teacher);
    setEditRole("teacher");
  };
  const handleEditStudent = (student) => {
    setEditUser(student);
    setEditRole("student");
  };

  // User type filter dropdown
  const handleUserTypeDropdown = (e) => {
    setUserType(e.target.value);
      localStorage.setItem("userType", e.target.value);
    setLoading(true);
    setTimeout(() => setLoading(false), 200);
  };

  // Filtered lists for search
  const filteredTeachers = teachers.filter(
    (t) =>
      t.username.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.id?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email?.toLowerCase().includes(teacherSearch.toLowerCase())
  );
  const filteredStudents = students.filter(
    (s) =>
      s.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id?.toLowerCase().includes(studentSearch.toLowerCase())
  );

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

      {/* Message display */}
      {message && (
        <div
          className={`
            fixed top-6 left-1/2 transform -translate-x-1/2 z-50
            px-6 py-3 rounded shadow-lg flex items-center gap-4
            ${messageType === "success" ? "bg-green-600" : "bg-red-600"}
            text-white text-center
            transition-all duration-300
          `}
          style={{ minWidth: 200, maxWidth: 400 }}
        >
          <span>{message}</span>
          <button
            onClick={handleCloseMessage}
            className="ml-2 text-white font-bold hover:text-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <select
          value={userType}
          onChange={handleUserTypeDropdown}
          className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
        >
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
        </select>
        {userType === "teacher" ? (
          <>
            <select
              value={teacherBatch}
              onChange={(e) => setTeacherBatch(e.target.value)}
              className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={teacherSort}
              onChange={(e) => setTeacherSort(e.target.value)}
              className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <input
              type="text"
              placeholder="Search by name or ID"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
            />
          </>
        ) : (
          <>
            <select
              value={studentBatch}
              onChange={(e) => setStudentBatch(e.target.value)}
              className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={studentSort}
              onChange={(e) => setStudentSort(e.target.value)}
              className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <input
              type="text"
              placeholder="Search by name or ID"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="py-3 px-6 bg-gray-800 text-white rounded-lg shadow"
            />
          </>
        )}
      </div>

      {/* Table */}
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : userType === "teacher" ? (
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-4 px-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Teacher Records
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Batches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-400 bg-gray-950"
                      >
                        No teachers found
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <tr
                        key={teacher._id}
                        className="hover:bg-gray-800 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {teacher.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {teacher.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {teacher.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {teacher.batches && teacher.batches.length > 0
                            ? teacher.batches.map((b) => b.name || b).join(", ")
                            : "None"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <button
                              className="text-blue-400 hover:underline"
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-400 hover:underline"
                              onClick={() => handleDeleteTeacher(teacher._id)}
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
            {/* Pagination */}
            <div className="p-5 bg-gray-900 flex justify-end items-center">
              <button
                disabled={teacherPage === 1}
                onClick={() => setTeacherPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-4 text-sm">
                {teacherPage} / {teacherTotalPages || 1}
              </span>
              <button
                disabled={
                  teacherPage === teacherTotalPages || teacherTotalPages === 0
                }
                onClick={() =>
                  setTeacherPage((p) => Math.min(teacherTotalPages, p + 1))
                }
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-4 px-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Student Records
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-0 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400 bg-gray-950"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-gray-800 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {student.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {student.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {student.batch}
                        </td>
                        <td className="px-0 py-4">
                          <div className="flex items-center gap-4">
                            <button
                              className="text-blue-400 hover:underline"
                              onClick={() => handleEditStudent(student)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-400 hover:underline"
                              onClick={() => handleDeleteStudent(student._id)}
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
            {/* Pagination */}
            <div className="p-5 bg-gray-900 flex justify-end items-center">
              <button
                disabled={studentPage === 1}
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-4 text-sm">
                {studentPage} / {studentTotalPages || 1}
              </span>
              <button
                disabled={
                  studentPage === studentTotalPages || studentTotalPages === 0
                }
                onClick={() =>
                  setStudentPage((p) => Math.min(studentTotalPages, p + 1))
                }
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">
              Edit {editRole === "teacher" ? "Teacher" : "Student"}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editRole === "teacher") {
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
                    `${editRole === "teacher" ? "Teacher" : "Student"} updated successfully!`
                  );
                   localStorage.setItem("userType", editRole); // <-- Add this line
                  setEditUser(null);
                  window.location.reload();
                } catch (err) {
                  toast.error("Failed to update user.");
                }
              }}
            >
              {/* Faculty fields */}
              {editRole === "teacher" && (
                <>
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Name</label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                      value={editUser.username}
                      onChange={(e) =>
                        setEditUser({ ...editUser, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Email</label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                      value={editUser.email}
                      onChange={(e) =>
                        setEditUser({ ...editUser, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">
                      Faculty ID
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                      value={editUser.id}
                      onChange={(e) =>
                        setEditUser({ ...editUser, id: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              )}
              {/* Student fields */}
              {editRole === "student" && (
                <>
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Name</label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                      value={editUser.username}
                      onChange={(e) =>
                        setEditUser({ ...editUser, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">
                      Student ID
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                      value={editUser.id}
                      onChange={(e) =>
                        setEditUser({ ...editUser, id: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Batch</label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                      value={editUser.batch}
                      onChange={(e) =>
                        setEditUser({ ...editUser, batch: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-600 text-white"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white"
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