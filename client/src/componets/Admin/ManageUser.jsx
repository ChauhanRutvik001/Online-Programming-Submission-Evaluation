import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import axiosInstance from "../../utils/axiosInstance";

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

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
  };
  const handleCloseMessage = () => setMessage(null);

  // Edit modal state
  const [editUser, setEditUser] = useState(null); // user object or null
  const [editRole, setEditRole] = useState(""); // "teacher" or "student"

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
      } catch (err) {
        setTeachers([]);
        setStudents([]);
        setTeacherTotal(0);
        setStudentTotal(0);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [
    teacherPage,
    studentPage,
    teacherBatch,
    teacherSort,
    debouncedTeacherSearch,
    studentBatch,
    studentSort,
    debouncedStudentSearch,
  ]);

  const teacherTotalPages = Math.ceil(teacherTotal / PAGE_SIZE);
  const studentTotalPages = Math.ceil(studentTotal / PAGE_SIZE);

  // Delete handlers
  const handleDeleteTeacher = async (id) => {
    try {
      await axiosInstance.post("/admin/deleteFaculty", { facultyId: id });
      setTeachers((prev) => prev.filter((t) => t._id !== id));
      showMessage("Teacher deleted successfully!", "success");
    } catch (err) {
      showMessage("Failed to delete teacher.", "error");
    }
  };
  const handleDeleteStudent = async (id) => {
    try {
      await axiosInstance.post("/admin/removeStudent", { userId: id });
      setStudents((prev) => prev.filter((s) => s._id !== id));
      showMessage("Student deleted successfully!", "success");
    } catch (err) {
      showMessage("Failed to delete student.", "error");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col md:flex-row">
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

      {/* Sidebar */}
      <div className="w-full md:w-60 flex-shrink-0">
        <Sidebar />
      </div>
      {/* Main content */}
      <div className="flex-1 min-w-0 p-2 sm:p-4 ">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-200 mb-8 pt-20">
          Manage Users
        </h1>
        {/* Filters Row */}
        {!loading && (
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-4">
            {/* Teacher Filters */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold mb-2">
                Teacher Filters
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-2">
                <select
                  value={teacherBatch}
                  onChange={(e) => setTeacherBatch(e.target.value)}
                  className="bg-gray-800 text-white px-3 py-2 rounded"
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
                  className="bg-gray-800 text-white px-3 py-2 rounded"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="bg-gray-800 text-white px-3 py-2 rounded"
                />
              </div>
            </div>
            {/* Student Filters */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold mb-2">
                Student Filters
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-2">
                <select
                  value={studentBatch}
                  onChange={(e) => setStudentBatch(e.target.value)}
                  className="bg-gray-800 text-white px-3 py-2 rounded"
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
                  className="bg-gray-800 text-white px-3 py-2 rounded"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="bg-gray-800 text-white px-3 py-2 rounded"
                />
              </div>
            </div>
          </div>
        )}
        {/* Tables Row */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Teachers Table */}
            <div className="flex-1 min-w-0 bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-x-auto mb-4 lg:mb-0">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-4 px-6 flex justify-between items-center rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Teachers</h2>
                {/* Pagination */}
                <div className="flex gap-2">
                  <button
                    disabled={teacherPage === 1}
                    onClick={() => setTeacherPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-sm">
                    {teacherPage} / {teacherTotalPages || 1}
                  </span>
                  <button
                    disabled={
                      teacherPage === teacherTotalPages ||
                      teacherTotalPages === 0
                    }
                    onClick={() =>
                      setTeacherPage((p) => Math.min(teacherTotalPages, p + 1))
                    }
                    className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-700 shadow-md table-fixed">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider w-32">
                      Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider w-24">
                      ID
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider w-56">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider w-40">
                      Batches
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {teachers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-400 bg-gray-800"
                      >
                        No teachers found
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher, idx) => (
                      <tr
                        key={teacher._id}
                        className={`hover:bg-gray-800 transition-colors duration-150 ${
                          idx % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                        }`}
                      >
                        <td className="px-4 py-4 text-center text-sm font-medium text-white truncate max-w-[8rem]">
                          {teacher.username}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-300 truncate max-w-[6rem]">
                          {teacher.id}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-300 truncate max-w-[14rem]">
                          {teacher.email ? (
                            <>
                              <span>{teacher.email.split("@")[0]}</span>
                              <br />
                              <span className="text-xs text-gray-400">
                                @{teacher.email.split("@")[1]}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-300 truncate max-w-[10rem]">
                          {teacher.batches && teacher.batches.length > 0
                            ? teacher.batches.map((b) => b.name || b).join(", ")
                            : "None"}
                        </td>
                        <td className="px-4 py-4 text-center text-sm">
                          <div className="flex flex-col items-center gap-1">
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
            {/* Students Table */}
            <div className="flex-1 min-w-0 bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-x-auto">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-4 px-6 flex justify-between items-center rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Students</h2>
                <div className="flex gap-2">
                  <button
                    disabled={studentPage === 1}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-sm">
                    {studentPage} / {studentTotalPages || 1}
                  </span>
                  <button
                    disabled={
                      studentPage === studentTotalPages ||
                      studentTotalPages === 0
                    }
                    onClick={() =>
                      setStudentPage((p) => Math.min(studentTotalPages, p + 1))
                    }
                    className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-700 shadow-md">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400 bg-gray-800"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    students.map((student, idx) => (
                      <tr
                        key={student._id}
                        className={`hover:bg-gray-800 transition-colors duration-150 ${
                          idx % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                        }`}
                      >
                        <td className="px-6 py-4 text-center text-sm font-medium text-white">
                          {student.username}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-300">
                          {student.id}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-300">
                          {student.batch}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          <div className="flex flex-col items-center gap-1">
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
          </div>
        )}
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
                    showMessage(
                      `${
                        editRole === "teacher" ? "Teacher" : "Student"
                      } updated successfully!`,
                      "success"
                    );
                    setEditUser(null);
                    window.location.reload(); // <-- Add this line to reload the page
                  } catch (err) {
                    showMessage("Failed to update user.", "error");
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
      </div>
    </div>
  );
};

export default ManageUser;
