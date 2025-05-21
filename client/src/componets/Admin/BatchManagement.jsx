import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';
import {
  FaUserPlus,
  FaLayerGroup,
  FaUserTie,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
} from "react-icons/fa";
import Sidebar from './Sidebar';



const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [facultyFilter, setFacultyFilter] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculty();
    fetchBatches(currentPage);
    // eslint-disable-next-line
  }, [currentPage, facultyFilter]);

  const fetchFaculty = async () => {
    try {
      const response = await axiosInstance.post('/admin/faculty/get-faculty-by-admin', {
        page: 1,
        limit: 100
      });
      if (response.data.success) {
        setFacultyList(response.data.facultys);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty data');
    }
  };

  const fetchBatches = async (page) => {
    setLoading(true);
    try {
      const payload = {
        page,
        limit: 10
      };
      if (facultyFilter) {
        payload.facultyId = facultyFilter;
      }
      const response = await axiosInstance.get('/admin/batch/batches', { params: payload });
      if (response.data.success) {
        setBatches(response.data.batches);
        setTotalPages(response.data.totalPages);
        setCurrentPage(Number(response.data.currentPage));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/admin/batch/batches/${batchToDelete}`);
      if (response.data.success) {
        toast.success('Batch deleted successfully');
        fetchBatches(currentPage);
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    } finally {
      setShowDeleteModal(false);
      setBatchToDelete(null);
    }
  };

  const openDeleteModal = (batchId) => {
    setBatchToDelete(batchId);
    setShowDeleteModal(true);
  };

  const handleFacultyFilterChange = (e) => {
    setFacultyFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navbar */}
      <nav className="w-full bg-gradient-to-b from-gray-800 via-grey-800 to-gray-800  px-4 flex items-center justify-between z-40">
        {/* Hamburger for small screens */}
      </nav>
      <div className="flex">
        {/* Sidebar */} 
        <Sidebar/>
        {/* Main Content */}
        <main className="flex-1 md:ml-60 flex flex-col items-center px-2 md:px-8 py-8">
          <div className="w-full max-w-6xl">
            <div className="flex justify-between items-center mb-6 mt-16">
              <h1 className="text-2xl font-bold text-blue-200">Batch Management</h1>
              <Link
                to="/admin/batch/batches/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
              >
                Create New Batch
              </Link>
            </div>

            {/* Filters */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-100 mb-1">
                Filter by Faculty:
              </label>
              <select
                value={facultyFilter}
                onChange={handleFacultyFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-blue-100"
              >
                <option value="" className="text-blue-100 bg-gray-800">All Faculty</option>
                {facultyList.map((faculty) => (
                  <option key={faculty._id} value={faculty._id} className="text-blue-100 bg-gray-800">
                    {faculty.username} ({faculty.email})
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="spinner"></div>
                <p className="mt-2 text-blue-100">Loading batches...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-blue-100">No batches found</p>
                <p className="mt-2">
                  <Link to="/admin/batch/batches/create" className="text-blue-400 hover:underline">
                    Create your first batch
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto bg-gray-900 shadow-md rounded-lg border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Batch Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {batches.map((batch) => (
                        <tr key={batch._id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-100">{batch.name}</div>
                            <div className="text-sm text-blue-300">{batch.subject || 'No subject'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-blue-100">
                              {batch.faculty ? batch.faculty.username : 'Not assigned'}
                            </div>
                            <div className="text-sm text-blue-300">
                              {batch.faculty ? batch.faculty.email : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-blue-100">
                              {batch.students ? batch.students.length : 0} students
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                batch.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {batch.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/admin/batch/batches/${batch._id}`}
                              className="text-blue-400 hover:text-blue-200 mr-3"
                            >
                              View/Edit
                            </Link>
                            <button
                              onClick={() => openDeleteModal(batch._id)}
                              className="text-red-400 hover:text-red-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium ${
                          currentPage === 1
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-blue-200 hover:bg-gray-700'
                        }`}
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === i + 1
                              ? 'z-10 bg-blue-900 border-blue-500 text-blue-200'
                              : 'bg-gray-800 border-gray-700 text-blue-100 hover:bg-gray-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium ${
                          currentPage === totalPages
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-blue-200 hover:bg-gray-700'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <ConfirmationModal
                title="Delete Batch"
                message="Are you sure you want to delete this batch? This action cannot be undone."
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteModal(false)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BatchManagement;