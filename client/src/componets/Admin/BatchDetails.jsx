import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';
import {
  FaLayerGroup,
} from "react-icons/fa";

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facultyList, setFacultyList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    facultyId: '',
    subject: '',
    isActive: true
  });
  const [filterTerm, setFilterTerm] = useState('');
  const [studentsToAdd, setStudentsToAdd] = useState([]);

  useEffect(() => {
    fetchBatchDetails();
    fetchFaculty();
    fetchAllStudents();
    // eslint-disable-next-line
  }, [batchId]);
  const fetchBatchDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/batch/batches/${batchId}`);
      if (response.data.success) {
        const batchData = response.data.batch;
        setBatch(batchData);
        setFormData({
          name: batchData.name || '',
          description: batchData.description || '',
          facultyId: batchData.faculty?._id || '',
          subject: batchData.subject || '',
          isActive: batchData.isActive
        });
      }
    } catch (error) {
      toast.error('Failed to load batch details');
      navigate('/admin/batch/batches');
    } finally {
      setLoading(false);
    }
  };
  const fetchFaculty = async () => {
    try {
      const response = await axiosInstance.post('/admin/faculty/get-faculty-by-admin', {
        page: 1,
        limit: 100
      });
      if (response.data.success) {
        setFacultyList(response.data.facultys);
      }
    } catch (error) {}
  };
  const fetchAllStudents = async () => {
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: 1,
        limit: 1000
      });
      if (response.data.success) {
        setAllStudents(response.data.students);
      }
    } catch (error) {}
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };
  const handleToggleEditMode = () => {
    if (editMode) {
      // Cancel edit - reset form data
      setFormData({
        name: batch.name || '',
        description: batch.description || '',
        facultyId: batch.faculty?._id || '',
        subject: batch.subject || '',
        isActive: batch.isActive
      });
      setStudentsToAdd([]);
    }
    setEditMode(!editMode);
  };

  const handleStudentSelection = (studentId) => {
    if (studentsToAdd.includes(studentId)) {
      setStudentsToAdd(studentsToAdd.filter(id => id !== studentId));
    } else {
      setStudentsToAdd([...studentsToAdd, studentId]);
    }
  };

  const handleRemoveStudent = (studentId) => {
    setStudentToRemove(studentId);
    setShowRemoveModal(true);
  };
  const confirmRemoveStudent = async () => {
    try {
      const response = await axiosInstance.delete(`/admin/batch/batches/${batchId}/students`, {
        data: { studentIds: [studentToRemove] }
      });
      if (response.data.success) {
        toast.success('Student removed from batch');
        fetchBatchDetails();
      }
    } catch (error) {
      toast.error('Failed to remove student');
    } finally {
      setShowRemoveModal(false);
      setStudentToRemove(null);
    }
  };
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Update batch details
      const updateResponse = await axiosInstance.put(`/admin/batch/batches/${batchId}`, formData);
      if (updateResponse.data.success) {
        // If there are students to add
        if (studentsToAdd.length > 0) {
          await axiosInstance.post(`/admin/batch/batches/${batchId}/students`, {
            studentIds: studentsToAdd
          });
        }
        toast.success('Batch updated successfully');
        setEditMode(false);
        fetchBatchDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update batch');
    } finally {
      setSaving(false);
    }
  };

  // Filter students that are not already in the batch
  const getAvailableStudents = () => {
    const batchStudentIds = batch?.students?.map(student => student._id) || [];
    return allStudents.filter(student => !batchStudentIds.includes(student._id));
  };

  const filteredAvailableStudents = getAvailableStudents().filter(student => {
    const searchTerm = filterTerm.toLowerCase();
    return (
      student.username.toLowerCase().includes(searchTerm) ||
      student.id.toLowerCase().includes(searchTerm) ||
      (student.batch && student.batch.toLowerCase().includes(searchTerm))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-opacity-75"></div>
        <p className="ml-3 text-white">Loading batch details...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-white">Batch not found</h2>
          <button
            onClick={() => navigate('/admin/batch/batches')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="py-6 mb-4 border-b border-blue-900">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mt-16 gap-4">
                  <div className="flex items-center mb-4 md:mb-0">
                    <FaLayerGroup className="h-8 w-8 mr-3 text-blue-300" />
                    <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
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
                    Back to List
                  </button>
                </div>
              </div>
            </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-0 md:px-0 py-0">
        <div className="w-full max-w-7xl mx-auto bg-gray-900 rounded-none shadow-none text-blue-100">
          {/* Batch Details */}
          <div className="p-8 border-b border-gray-800 w-full">
            <h2 className="text-2xl font-bold mb-6 text-blue-200 tracking-wide border-l-4 border-blue-500 pl-4">Batch Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Info Card */}
              <div className="col-span-2 space-y-6 bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                      Batch Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border-2 border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-blue-100 text-base font-semibold"
                        required
                      />
                    ) : (
                      <p className="text-blue-100 text-base font-semibold">{batch.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                      Subject
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border-2 border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-blue-100 text-base font-semibold"
                      />
                    ) : (
                      <p className="text-blue-100 text-base font-semibold">{batch.subject || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-base font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                      Description
                    </label>
                    {editMode ? (
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border-2 border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-blue-100 text-base font-semibold"
                      />
                    ) : (
                      <p className="text-blue-100 text-base">{batch.description || 'No description'}</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Status & Faculty Card */}
              <div className="space-y-6 bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 flex flex-col justify-between">
                <div>
                  <label className="block text-base font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                    Faculty
                  </label>
                  {editMode ? (
                    <select
                      name="facultyId"
                      value={formData.facultyId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border-2 border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-blue-100 text-base font-semibold"
                      required
                    >
                      <option value="">Select a faculty</option>
                      {facultyList.map(faculty => (
                        <option key={faculty._id} value={faculty._id} className="text-gray-900">
                          {faculty.username} ({faculty.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-blue-100 text-base font-semibold">
                      {batch.faculty ? (
                        <>
                          {batch.faculty.username} <span className="text-blue-300">({batch.faculty.email})</span>
                        </>
                      ) : (
                        'Not assigned'
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-base font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                    Status
                  </label>
                  {editMode ? (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={handleToggleActive}
                        className={`px-5 py-1 rounded-full text-base font-bold shadow ${
                          formData.isActive
                            ? 'bg-green-200 text-green-900'
                            : 'bg-red-200 text-red-900'
                        }`}
                      >
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <span className="ml-3 text-base text-blue-300">
                        (Click to toggle)
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`px-5 py-1 rounded-full text-base font-bold shadow ${
                        batch.isActive
                          ? 'bg-green-200 text-green-900'
                          : 'bg-red-200 text-red-900'
                      }`}
                    >
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Edit/Save/Cancel Buttons */}
            <div className="flex gap-4 mt-8 justify-end">
              <button
                onClick={handleToggleEditMode}
                className={`px-8 py-3 rounded-lg text-base font-bold shadow ${
                  editMode
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {editMode ? 'Cancel' : 'Edit Batch'}
              </button>
              {editMode && (
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base font-bold shadow disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
          {/* Students Section */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold text-blue-200 tracking-wide border-l-4 border-blue-500 pl-4">
                Students in Batch <span className="text-blue-300">({batch.students?.length || 0})</span>
              </h2>
              {editMode && (
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <input
                    type="text"
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    placeholder="Search students to add..."
                    className="w-full md:w-80 px-4 py-3 border-2 border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-blue-100 text-lg"
                  />
                  {studentsToAdd.length > 0 && (
                    <div className="flex items-center text-base text-blue-200">
                      <span className="ml-2">{studentsToAdd.length} selected</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Current Students List */}
            {batch.students && batch.students.length > 0 ? (
              <div className="mb-8">
                <div className="overflow-x-auto border border-gray-800 rounded-xl shadow">
                  <table className="min-w-full divide-y divide-gray-800 bg-gray-900">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-200 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-200 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-200 uppercase tracking-wider">
                          Batch
                        </th>
                        {editMode && (
                          <th className="px-6 py-4 text-right text-base font-bold text-blue-200 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                      {batch.students.map(student => (
                        <tr key={student._id} className="hover:bg-gray-800 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base font-semibold text-blue-100">{student.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base text-blue-300">{student.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base text-blue-300">{student.batch}</div>
                          </td>
                          {editMode && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-base font-semibold">
                              <button
                                onClick={() => handleRemoveStudent(student._id)}
                                className="text-red-400 hover:text-red-200"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 p-8 text-center rounded-xl mb-8 shadow">
                <p className="text-blue-200 text-lg">No students in this batch yet</p>
              </div>
            )}
            {/* Add Students Section - Only visible in edit mode */}
            {editMode && (
              <div className="mt-10 border-t pt-8">
                <h3 className="text-xl font-bold mb-6 text-blue-200 tracking-wide border-l-4 border-blue-500 pl-4">Add Students to Batch</h3>
                {filteredAvailableStudents.length > 0 ? (
                  <div className="border rounded-xl max-h-96 overflow-y-auto bg-gray-900 shadow">
                    <ul className="divide-y divide-gray-800">
                      {filteredAvailableStudents.map(student => (
                        <li key={student._id} className="p-4 hover:bg-gray-800 flex items-center gap-4">
                          <input
                            type="checkbox"
                            id={`add-student-${student._id}`}
                            checked={studentsToAdd.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`add-student-${student._id}`}
                            className="cursor-pointer flex-1"
                          >
                            <div className="text-base font-semibold text-blue-100">{student.username}</div>
                            <div className="text-sm text-blue-300">
                              ID: {student.id} | Batch: {student.batch}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-gray-800 p-8 text-center rounded-xl shadow">
                    <p className="text-blue-200 text-lg">
                      {filterTerm 
                        ? 'No matching students found' 
                        : 'No more students available to add'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Confirmation Modal for removing student */}
          {showRemoveModal && (
            <ConfirmationModal
              title="Remove Student"
              message="Are you sure you want to remove this student from the batch?"
              confirmButtonText="Remove"
              cancelButtonText="Cancel"
              onConfirm={confirmRemoveStudent}
              onCancel={() => {
                setShowRemoveModal(false);
                setStudentToRemove(null);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BatchDetails;