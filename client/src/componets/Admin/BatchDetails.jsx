import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';

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
      console.error('Error fetching batch details:', error);
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
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
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
    } catch (error) {
      console.error('Error fetching students:', error);
    }
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
  const confirmRemoveStudent = async () => {    try {
      const response = await axiosInstance.delete(`/admin/batch/batches/${batchId}/students`, {
        data: { studentIds: [studentToRemove] }
      });
      if (response.data.success) {
        toast.success('Student removed from batch');
        fetchBatchDetails();
      }
    } catch (error) {
      console.error('Error removing student:', error);
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
      console.error('Error updating batch:', error);
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
      <div className="flex justify-center items-center h-96">
        <div className="spinner"></div>
        <p className="ml-3">Loading batch details...</p>
      </div>
    );
  }

  if (!batch) {
    return (      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Batch not found</h2>
        <button
          onClick={() => navigate('/admin/batch/batches')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Batches
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{batch.name}</h1>
          <p className="text-gray-600">
            Created: {new Date(batch.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleToggleEditMode}
            className={`px-4 py-2 rounded text-sm font-medium ${
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
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>          )}
          <button
            onClick={() => navigate('/admin/batch/batches')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Batch Details */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Batch Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                ) : (
                  <p className="text-gray-900">{batch.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {editMode ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{batch.description || 'No description'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty
                </label>
                {editMode ? (
                  <select
                    name="facultyId"
                    value={formData.facultyId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a faculty</option>
                    {facultyList.map(faculty => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.username} ({faculty.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {batch.faculty ? (
                      <>
                        {batch.faculty.username} <span className="text-gray-500">({batch.faculty.email})</span>
                      </>
                    ) : (
                      'Not assigned'
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{batch.subject || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {editMode ? (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <span className="ml-2 text-sm text-gray-500">
                      (Click to toggle)
                    </span>
                  </div>
                ) : (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      batch.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {batch.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Students in Batch <span className="text-gray-500">({batch.students?.length || 0})</span>
            </h2>
          </div>

          {/* Current Students List */}
          {batch.students && batch.students.length > 0 ? (
            <div className="mb-6">
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
                      {editMode && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batch.students.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.batch}</div>
                        </td>
                        {editMode && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              className="text-red-600 hover:text-red-900"
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
            <div className="bg-gray-50 p-6 text-center rounded-lg mb-6">
              <p className="text-gray-500">No students in this batch yet</p>
            </div>
          )}

          {/* Add Students Section - Only visible in edit mode */}
          {editMode && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Add Students to Batch</h3>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  placeholder="Search students to add..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {filteredAvailableStudents.length > 0 ? (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {filteredAvailableStudents.map(student => (
                      <li key={student._id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id={`add-student-${student._id}`}
                            checked={studentsToAdd.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`add-student-${student._id}`}
                            className="ml-3 cursor-pointer"
                          >
                            <div className="text-sm font-medium text-gray-900">{student.username}</div>
                            <div className="text-xs text-gray-500">
                              ID: {student.id} | Batch: {student.batch}
                            </div>
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 text-center rounded-lg">
                  <p className="text-gray-500">
                    {filterTerm 
                      ? 'No matching students found' 
                      : 'No more students available to add'}
                  </p>
                </div>
              )}
              
              {studentsToAdd.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  {studentsToAdd.length} students selected to add
                </div>
              )}
            </div>
          )}
        </div>
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
  );
};

export default BatchDetails;
