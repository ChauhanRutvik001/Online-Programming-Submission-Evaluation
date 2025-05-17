import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

const CreateBatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [facultyList, setFacultyList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filterTerm, setFilterTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);  const [batchData, setBatchData] = useState({
    name: '',
    description: '',
    facultyId: '',
    subject: '',
  });

  useEffect(() => {
    fetchFaculty();
    fetchStudents();
  }, []);  const fetchFaculty = async () => {
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
        page: 1,
        limit: 1000 // Get all students for selection
      });
      
      if (response.data.success) {
        setAllStudents(response.data.students);
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
    if (filteredStudents.length === selectedStudents.length) {
      // Deselect all
      setSelectedStudents([]);
    } else {
      // Select all filtered students
      const filteredIds = filteredStudents.map(student => student._id);
      setSelectedStudents(filteredIds);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!batchData.name || !batchData.facultyId) {
      toast.error('Batch name and faculty are required!');
      return;
    }
    
    setLoading(true);
    
    try {      const payload = {
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
  // Filter students based on search term
  const filteredStudents = allStudents.filter(student => {
    const searchTerm = filterTerm.toLowerCase();
    return (
      student.username.toLowerCase().includes(searchTerm) ||
      student.id.toLowerCase().includes(searchTerm) ||
      (student.batch && student.batch.toLowerCase().includes(searchTerm))
    );
  });

  // Check if all filtered students are selected
  const allFilteredSelected = 
    filteredStudents.length > 0 && 
    filteredStudents.every(student => selectedStudents.includes(student._id));

  return (
    <div className="container mx-auto p-4 mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Batch</h1>
        <p className="text-gray-600">Assign students to a faculty in a named batch</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Batch Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={batchData.name}
                  onChange={handleInputChange}
                  placeholder="Enter batch name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={batchData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this batch"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty *
                </label>
                {facultyLoading ? (
                  <p>Loading faculty...</p>
                ) : (
                  <select
                    name="facultyId"
                    value={batchData.facultyId}
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
                )}
              </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={batchData.subject}
                  onChange={handleInputChange}
                  placeholder="Subject name (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Student Selection Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Select Students</h2>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    placeholder="Search students..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex-1 mr-2"
                  />
                  
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {studentLoading ? (
                  <div className="text-center py-10">
                    <div className="spinner"></div>
                    <p className="mt-2">Loading students...</p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-md h-96 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">No students found</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredStudents.map(student => (
                          <li key={student._id} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`student-${student._id}`}
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleStudentSelection(student._id)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label 
                                htmlFor={`student-${student._id}`}
                                className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                <div className="font-medium">{student.username}</div>
                                <div className="text-xs text-gray-500">
                                  ID: {student.id} | Batch: {student.batch} | 
                                  Sem: {student.semester} | Branch: {student.branch}
                                </div>
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                <div className="mt-2 text-sm text-gray-600">
                  {selectedStudents.length} students selected
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/batch/batches')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !batchData.name || !batchData.facultyId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBatch;
