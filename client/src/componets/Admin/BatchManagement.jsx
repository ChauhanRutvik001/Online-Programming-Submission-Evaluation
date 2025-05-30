import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';
import { FaLayerGroup, FaPlus } from "react-icons/fa";

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [facultyFilter, setFacultyFilter] = useState('');
  const [facultyList, setFacultyList] = useState([]);

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
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleDeleteConfirm = async () => {
    try {
      if (!batchToDelete) {
        toast.error('No batch selected for deletion');
        setShowDeleteModal(false);
        return;
      }
      const response = await axiosInstance.delete(`/admin/batch/batches/${batchToDelete}`);
      if (response.data.success) {
        toast.success('Batch deleted successfully');
        // If only one batch left on the page, go to previous page if possible
        if (batches.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchBatches(currentPage);
        }
      } else {
        toast.error(response.data.message || 'Failed to delete batch');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete batch');
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
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14 gap-4">
            <div className="flex items-center mb-4 md:mb-0">
              <FaLayerGroup className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
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
      <main className="flex-1 flex flex-col items-center px-2 md:px-8 py-8">
        <div className="w-full max-w-6xl space-y-8">
          {/* Top Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filter */}
            <div className="w-full md:w-1/3">
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
            {/* Create Batch Button */}
            <div className="flex justify-end w-full md:w-auto">
              <button
                className="flex items-center gap-2 py-2.5 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
                onClick={() => navigate("/admin/batch/batches/create")}
              >
                <FaPlus className="h-5 w-5" />
                Create Batch
              </button>
            </div>
          </div>

          {/* Table or Loader */}
          <div className="bg-gray-900 shadow-md rounded-xl border border-gray-700 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75 mb-4"></div>
                <p className="text-blue-100">Loading batches...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-800 rounded-xl">
                <p className="text-blue-100 text-lg font-semibold">No batches found</p>
                <button
                  onClick={() => navigate("/admin/batch/batches/create")}
                  className="mt-4 flex items-center gap-2 py-2.5 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
                >
                  <FaPlus className="h-5 w-5" />
                  Create your first batch
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-200 uppercase tracking-wider rounded-tl-xl">
                      Batch Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-200 uppercase tracking-wider">
                      Faculty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-200 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-200 uppercase tracking-wider rounded-tr-xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {batches.map((batch) => (
                    <tr key={batch._id} className="hover:bg-gray-700 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-semibold text-blue-100">{batch.name}</div>
                        <div className="text-xs text-blue-300">{batch.subject || 'No subject'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-blue-100">
                          {batch.faculty ? batch.faculty.username : 'Not assigned'}
                        </div>
                        <div className="text-xs text-blue-300">
                          {batch.faculty ? batch.faculty.email : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-block bg-blue-950 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                          {batch.students ? batch.students.length : 0} students
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            batch.isActive
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {batch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <Link
                          to={`/admin/batch/batches/${batch._id}`}
                          className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 transition"
                        >
                          View/Edit
                        </Link>
                        <button
                          onClick={() => openDeleteModal(batch._id)}
                          className="px-3 py-1 rounded bg-red-700 text-white hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium ${
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
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium ${
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

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleDeleteConfirm}
              title="Delete Batch"
              message="Are you sure you want to delete this batch? This action cannot be undone."
              confirmButtonText="Delete"
              cancelButtonText="Cancel"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BatchManagement;