import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import {
  FaUserPlus,
  FaLayerGroup,
  FaUserTie,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
} from "react-icons/fa";

// Sidebar links (match your Admin.jsx)
const sidebarLinks = [
  { name: "Dashboard", icon: <FaHome />, to: "/pending-requests" },
  { name: "Manage Users", icon: <FaUsers />, to: "/admin/users" },
  { name: "Student Registration", icon: <FaUserPlus />, to: "/registerStudents" },
  { name: "Teacher Registration", icon: <FaChalkboardTeacher />, to: "/create-faculty" },
  { name: "Batch Creation", icon: <FaLayerGroup />, to: "/admin/batch/batches/create" },
];

const CreateBatch = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [facultyList, setFacultyList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    batches: [],
    semesters: [],
    branches: []
  });

  // Student filtering and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsPerPage, setStudentsPerPage] = useState(20);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const [batchData, setBatchData] = useState({
    name: '',
    description: '',
    facultyId: '',
    subject: '',
  });

  useEffect(() => {
    fetchFaculty();
    fetchStudents();
    // eslint-disable-next-line
  }, [currentPage, studentsPerPage, searchTerm, selectedBatch, selectedSemester, selectedBranch, sortBy, sortOrder]);

  const fetchFaculty = async () => {
    setFacultyLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-faculty-by-admin', {
        page: 1,
        limit: 100 // Get all faculty
      });

      if (response.data.success) {
        setFacultyList(response.data.facultys);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty data');
    } finally {
      setFacultyLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: currentPage,
        limit: studentsPerPage,
        search: searchTerm,
        batch: selectedBatch,
        semester: selectedSemester,
        branch: selectedBranch,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.data.success) {
        setAllStudents(response.data.students);
        setTotalPages(response.data.totalPages);
        setTotalStudents(response.data.totalStudents);

        // Set filter options if available and not already set
        if (response.data.filters && filterOptions.batches.length === 0) {
          setFilterOptions({
            batches: response.data.filters.batches || [],
            semesters: response.data.filters.semesters || [],
            branches: response.data.filters.branches || []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student data');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBatchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (allStudents.every(student => selectedStudents.includes(student._id))) {
      // Deselect all currently visible students
      const currentStudentIds = allStudents.map(student => student._id);
      setSelectedStudents(selectedStudents.filter(id => !currentStudentIds.includes(id)));
    } else {
      // Select all currently visible students
      const currentStudentIds = allStudents.map(student => student._id);
      const newSelectedStudents = [...selectedStudents];

      currentStudentIds.forEach(id => {
        if (!newSelectedStudents.includes(id)) {
          newSelectedStudents.push(id);
        }
      });

      setSelectedStudents(newSelectedStudents);
    }
  };

  // Bulk selection based on criteria
  const handleBulkSelection = async () => {
    setStudentLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: 1,
        limit: 1000,
        search: searchTerm,
        batch: selectedBatch,
        semester: selectedSemester,
        branch: selectedBranch,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.data.success) {
        const matchingStudentIds = response.data.students.map(student => student._id);
        const newSelectedStudents = [...selectedStudents];
        matchingStudentIds.forEach(id => {
          if (!newSelectedStudents.includes(id)) {
            newSelectedStudents.push(id);
          }
        });
        setSelectedStudents(newSelectedStudents);
        toast.success(`Selected ${matchingStudentIds.length} students matching current filters`);
      }
    } catch (error) {
      console.error('Error in bulk selection:', error);
      toast.error('Failed to perform bulk selection');
    } finally {
      setStudentLoading(false);
      fetchStudents();
    }
  };

  const handleBulkDeselection = async () => {
    setStudentLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: 1,
        limit: 1000,
        search: searchTerm,
        batch: selectedBatch,
        semester: selectedSemester,
        branch: selectedBranch,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.data.success) {
        const matchingStudentIds = response.data.students.map(student => student._id);
        const newSelectedStudents = selectedStudents.filter(id => !matchingStudentIds.includes(id));
        const removedCount = selectedStudents.length - newSelectedStudents.length;
        setSelectedStudents(newSelectedStudents);
        toast.success(`Removed ${removedCount} students from selection`);
      }
    } catch (error) {
      console.error('Error in bulk deselection:', error);
      toast.error('Failed to remove students from selection');
    } finally {
      setStudentLoading(false);
      fetchStudents();
    }
  };

  const handleClearSelection = () => {
    setSelectedStudents([]);
    toast.success('Cleared all selected students');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'batch') setSelectedBatch(value);
    if (name === 'semester') setSelectedSemester(value);
    if (name === 'branch') setSelectedBranch(value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sortBy') setSortBy(value);
    else if (name === 'sortOrder') setSortOrder(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePerPageChange = (e) => {
    setStudentsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!batchData.name || !batchData.facultyId) {
      toast.error('Batch name and faculty are required!');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...batchData,
        students: selectedStudents
      };
      const response = await axiosInstance.post('/admin/batch/batches', payload);
      if (response.data.success) {
        toast.success('Batch created successfully!');
        navigate('/admin/batch/batches');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const allCurrentPageSelected = allStudents.length > 0 &&
    allStudents.every(student => selectedStudents.includes(student._id));

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
          {/* Heading after sidebar */}
          <div className="w-full max-w-5xl flex items-center justify-between mb-9 mt-6">
            <h1 className="text-2xl font-bold text-blue-200 flex items-center gap-2">
              <FaLayerGroup className="inline-block text-blue-400" /> Create Batch
            </h1>
            <button
              className="py-2 px-4 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-all duration-200 active:scale-95 text-sm"
              onClick={() => navigate(-1)}
            >
              Back To Dashboard
            </button>
          </div>
          <div className="w-full max-w-5xl bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 md:p-6 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Batch Details Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={batchData.name}
                      onChange={handleInputChange}
                      placeholder="Enter batch name"
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={batchData.description}
                      onChange={handleInputChange}
                      placeholder="Describe this batch"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      Faculty *
                    </label>
                    {facultyLoading ? (
                      <p className="text-blue-200">Loading faculty...</p>
                    ) : (
                      <select
                        name="facultyId"
                        value={batchData.facultyId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a faculty</option>
                        {facultyList.map(faculty => (
                          <option key={faculty._id} value={faculty._id}>
                            {faculty.username} ({faculty.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={batchData.subject}
                      onChange={handleInputChange}
                      placeholder="Subject name (optional)"
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {/* Student Selection Section */}
                <div className="space-y-4">
                  <div className="flex flex-col space-y-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search students..."
                        className="px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-blue-100 rounded text-sm whitespace-nowrap"
                      >
                        {allCurrentPageSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select
                        name="batch"
                        value={selectedBatch}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Batches</option>
                        {filterOptions.batches.map(batch => (
                          <option key={batch} value={batch}>{batch}</option>
                        ))}
                      </select>
                      <select
                        name="semester"
                        value={selectedSemester}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Semesters</option>
                        {filterOptions.semesters.map(semester => (
                          <option key={semester} value={semester}>Semester {semester}</option>
                        ))}
                      </select>
                      <select
                        name="branch"
                        value={selectedBranch}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Branches</option>
                        {filterOptions.branches.map(branch => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="text-sm text-blue-300">
                        {(selectedBatch || selectedSemester || selectedBranch || searchTerm) && (
                          <div className="flex items-center flex-wrap">
                            <span className="mr-1">Active filters:</span>
                            {selectedBatch && (
                              <span className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded mr-1 mb-1">
                                Batch: {selectedBatch}
                              </span>
                            )}
                            {selectedSemester && (
                              <span className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded mr-1 mb-1">
                                Semester: {selectedSemester}
                              </span>
                            )}
                            {selectedBranch && (
                              <span className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded mr-1 mb-1">
                                Branch: {selectedBranch}
                              </span>
                            )}
                            {searchTerm && (
                              <span className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded mr-1 mb-1">
                                Search: "{searchTerm}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={handleBulkSelection}
                          disabled={studentLoading}
                          className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs sm:text-sm"
                        >
                          {studentLoading ? 'Processing...' : 'Select All Matching Filters'}
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDeselection}
                          disabled={studentLoading || !selectedStudents.length}
                          className="px-3 py-2 bg-yellow-700 hover:bg-yellow-800 text-white rounded text-xs sm:text-sm"
                        >
                          Remove Matching From Selection
                        </button>
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          disabled={!selectedStudents.length}
                          className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs sm:text-sm"
                        >
                          Clear All Selection
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <select
                        name="sortBy"
                        value={sortBy}
                        onChange={handleSortChange}
                        className="px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="id">Sort by ID</option>
                        <option value="username">Sort by Name</option>
                        <option value="batch">Sort by Batch</option>
                        <option value="semester">Sort by Semester</option>
                      </select>
                      <select
                        name="sortOrder"
                        value={sortOrder}
                        onChange={handleSortChange}
                        className="px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>
                  {studentLoading ? (
                    <div className="text-center py-10">
                      <div className="spinner"></div>
                      <p className="mt-2 text-blue-200">Loading students...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="border border-gray-700 rounded-md h-72 md:h-96 overflow-y-auto bg-gray-900/60">
                        {allStudents.length === 0 ? (
                          <p className="text-center py-6 text-blue-200">No students found</p>
                        ) : (
                          <ul className="divide-y divide-gray-800">
                            {allStudents.map(student => (
                              <li key={student._id} className="p-3 hover:bg-gray-800/60">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`student-${student._id}`}
                                    checked={selectedStudents.includes(student._id)}
                                    onChange={() => handleStudentSelection(student._id)}
                                    className="h-4 w-4 text-blue-600 border-gray-700 rounded focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`student-${student._id}`}
                                    className="ml-3 block text-sm font-medium text-blue-100 cursor-pointer w-full"
                                  >
                                    <div className="font-medium">{student.username}</div>
                                    <div className="text-xs text-blue-300">
                                      ID: {student.id} | Batch: {student.batch} | Sem: {student.semester} | Branch: {student.branch || 'N/A'}
                                    </div>
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Pagination Controls */}
                      <div className="mt-4 flex flex-wrap items-center justify-between">
                        <div className="text-sm text-blue-200 mb-2 sm:mb-0">
                          <span className="font-semibold">{selectedStudents.length}</span> students selected | 
                          Showing {allStudents.length} of {totalStudents} students
                          {selectedStudents.length > 0 && (
                            <div className="text-xs mt-1 text-blue-400">
                              Tip: Use the filters and "Select All Matching Filters" to quickly select groups of students
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={studentsPerPage}
                            onChange={handlePerPageChange}
                            className="px-2 py-1 border border-gray-700 bg-gray-900/70 text-white rounded text-sm"
                          >
                            <option value="10">10 / page</option>
                            <option value="20">20 / page</option>
                            <option value="50">50 / page</option>
                            <option value="100">100 / page</option>
                          </select>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              className="px-2 py-1 border border-gray-700 bg-gray-900/70 text-white rounded text-sm disabled:opacity-50"
                            >
                              &laquo;
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="px-2 py-1 border border-gray-700 bg-gray-900/70 text-white rounded text-sm disabled:opacity-50"
                            >
                              &lsaquo;
                            </button>
                            <span className="px-2 py-1 text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="px-2 py-1 border border-gray-700 bg-gray-900/70 text-white rounded text-sm disabled:opacity-50"
                            >
                              &rsaquo;
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              className="px-2 py-1 border border-gray-700 bg-gray-900/70 text-white rounded text-sm disabled:opacity-50"
                            >
                              &raquo;
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/admin/batch/batches')}
                  className="px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-blue-200 bg-gray-800 hover:bg-gray-700 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !batchData.name || !batchData.facultyId}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateBatch;