import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [facultyFilter, setFacultyFilter] = useState('');
  const [facultyList, setFacultyList] = useState([]);

  useEffect(() => {
    fetchFaculty();
    fetchBatches(currentPage);
  }, [currentPage, facultyFilter]);
  const fetchFaculty = async () => {
    try {
      const response = await axiosInstance.post('/admin/faculty/get-faculty-by-admin', {
        page: 1,
        limit: 100 // Get all faculty for filtering
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
  };  const handleDeleteConfirm = async () => {
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
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6 mt-20">
        <h1 className="text-2xl font-bold">Batch Management</h1>        <Link
          to="/admin/batch/batches/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Create New Batch
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Faculty:
        </label>
        <select
          value={facultyFilter}
          onChange={handleFacultyFilterChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Faculty</option>
          {facultyList.map((faculty) => (
            <option key={faculty._id} value={faculty._id}>
              {faculty.username} ({faculty.email})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No batches found</p>
          <p className="mt-2">            <Link to="/admin/batch/batches/create" className="text-blue-600 hover:underline">
              Create your first batch
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty
                  </th>                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.name}</div>
                      <div className="text-sm text-gray-500">{batch.subject || 'No subject'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {batch.faculty ? batch.faculty.username : 'Not assigned'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {batch.faculty ? batch.faculty.email : ''}
                      </div>
                    </td>                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
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
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View/Edit
                      </Link>
                      <button
                        onClick={() => openDeleteModal(batch._id)}
                        className="text-red-600 hover:text-red-900"
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
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
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
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
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
  );
};

export default BatchManagement;
