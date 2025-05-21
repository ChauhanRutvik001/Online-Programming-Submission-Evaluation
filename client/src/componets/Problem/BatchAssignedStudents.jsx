import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const BatchAssignedStudents = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [studentsInSelectedBatches, setStudentsInSelectedBatches] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch faculty's batches
  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/faculty/my-batches");
        if (response.data.success) {
          setBatches(response.data.batches || []);
        } else {
          setError("Failed to load batches");
        }
      } catch (err) {
        setError("Failed to load batches: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch assigned students for this problem
    const fetchAssignedStudents = async () => {
      try {
        const response = await axiosInstance.get(`/problems/${problemId}/students`);
        setAssignedStudents(response.data.assignedStudents || []);
      } catch (err) {
        setError("Failed to load assigned students: " + err.message);
      }
    };

    fetchBatches();
    fetchAssignedStudents();
  }, [problemId]);
  // When selected batches change, update the list of students in those batches
  useEffect(() => {
    if (selectedBatchIds.length > 0) {
      // Extract all students from selected batches and create a flat array
      const students = batches
        .filter(batch => selectedBatchIds.includes(batch._id))
        .flatMap(batch => batch.students || []);
      
      setStudentsInSelectedBatches(students);
      
      // Pre-select students who are already assigned to the problem
      const preSelectedStudentIds = students
        .filter(student => assignedStudents.some(assignedStudent => assignedStudent._id === student._id))
        .map(student => student._id);
      
      setSelectedStudents(preSelectedStudentIds);
    } else {
      setStudentsInSelectedBatches([]);
      setSelectedStudents([]);
    }
  }, [selectedBatchIds, batches, assignedStudents]);

  // Handle batch selection
  const handleBatchSelect = (batchId) => {
    if (selectedBatchIds.includes(batchId)) {
      setSelectedBatchIds(selectedBatchIds.filter(id => id !== batchId));
    } else {
      setSelectedBatchIds([...selectedBatchIds, batchId]);
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Select all students in the selected batches
  const handleSelectAllStudents = () => {
    if (selectedStudents.length === studentsInSelectedBatches.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentsInSelectedBatches.map(student => student._id));
    }
  };
  // Toggle assignment status for a student
  const handleToggleStudentAssignment = (studentId, isCurrentlyAssigned) => {
    // Add or remove the student from our selected students list based on click
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };
  
  // Save all assignment changes
  const handleSaveChanges = async () => {
    // Find students that need to be assigned (selected but not currently assigned)
    const studentsToAssign = selectedStudents.filter(
      studentId => !assignedStudents.some(assigned => assigned._id === studentId)
    );
    
    // Find students that need to be unassigned (not selected but currently assigned)
    const currentlyAssignedIds = assignedStudents.map(student => student._id);
    const studentsInBatchesIds = studentsInSelectedBatches.map(student => student._id);
    
    // Only consider unassigning students that are in the current batches view
    const studentsToUnassign = currentlyAssignedIds.filter(
      id => studentsInBatchesIds.includes(id) && !selectedStudents.includes(id)
    );
    
    if (studentsToAssign.length === 0 && studentsToUnassign.length === 0) {
      toast.info("No changes to save");
      return;
    }
    
    setProcessing(true);
    
    try {
      // Process assignments if needed
      if (studentsToAssign.length > 0) {
        const assignRes = await axiosInstance.post(`/problems/${problemId}/assign`, {
          studentIds: studentsToAssign,
        });
        
        // Update local state with newly assigned students
        const updatedAssignedStudents = [...assignedStudents];
        studentsToAssign.forEach(studentId => {
          const student = studentsInSelectedBatches.find(s => s._id === studentId);
          if (student && !updatedAssignedStudents.some(assigned => assigned._id === studentId)) {
            updatedAssignedStudents.push(student);
          }
        });
        
        setAssignedStudents(updatedAssignedStudents);
      }
      
      // Process unassignments if needed
      if (studentsToUnassign.length > 0) {
        const unassignRes = await axiosInstance.post(`/problems/${problemId}/unassign-students`, {
          studentIds: studentsToUnassign,
        });
        
        // Update local state by removing unassigned students
        setAssignedStudents(
          assignedStudents.filter(student => !studentsToUnassign.includes(student._id))
        );
      }
      
      toast.success("Assignment changes saved successfully!");
      setError(null);
    } catch (error) {
      toast.error("Failed to save assignment changes. Please try again.");
      setError("Failed to save changes: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
          <p className="mt-4 text-lg font-medium text-blue-400">Loading batches...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6 pt-20 text-center">
        Batch-Based Problem Assignment
      </h1>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}      {/* Loading overlay for processing actions */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="text-white text-lg font-semibold">
              Processing students...
            </p>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="mb-6">
        <button
          className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition transform duration-200"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {/* Batch selection section */}
      <div className="mb-8 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">1. Select Batches</h2>
        
        {batches.length === 0 ? (
          <p className="text-gray-400">No batches found. Create batches to assign problems to students.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div 
                key={batch._id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedBatchIds.includes(batch._id)
                    ? "border-blue-500 bg-blue-900/30"
                    : "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
                }`}
                onClick={() => handleBatchSelect(batch._id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{batch.name}</h3>
                  <span className="px-2 py-1 text-sm rounded-full bg-blue-500/20 text-blue-300">
                    {batch.students?.length || 0} Students
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">{batch.subject || "No subject"}</p>
                <p className="text-gray-400 text-sm mt-1">{batch.description || "No description"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Students selection section - only show if batches are selected */}
      {selectedBatchIds.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            2. Select Students from Batches ({studentsInSelectedBatches.length} students)
          </h2>
          
          <div className="mb-4">
            <button
              className="py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
              onClick={handleSelectAllStudents}
            >
              {selectedStudents.length === studentsInSelectedBatches.length
                ? "Deselect All"
                : "Select All Students"}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
            <table className="w-full border-collapse text-left text-gray-300">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="py-3 px-4 text-center">Select</th>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-center">Branch</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                  <th className="py-3 px-4 text-center">Batch</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>              <tbody className="divide-y divide-gray-800">
                {studentsInSelectedBatches.length > 0 ? (
                  studentsInSelectedBatches.map((student, index) => {
                    const isAssigned = assignedStudents.some(
                      assigned => assigned._id === student._id
                    );
                    const isSelected = selectedStudents.includes(student._id);
                    
                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors ${
                          index % 2 === 0 ? "bg-gray-900/30" : "bg-gray-900/10"
                        } hover:bg-gray-900/60 ${isSelected ? "bg-blue-900/10" : ""}`}
                        onClick={() => handleToggleStudentAssignment(student._id, isAssigned)}
                      >
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by row click
                              className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-100">
                          {student.id?.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-gray-100">
                          {student.username}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex rounded-full bg-gray-800 px-2 py-1 text-xs font-medium text-gray-100">
                            {student.branch?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-gray-100">
                          {student.semester}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
                            {student.batch?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isAssigned ? (
                            <span className={`inline-flex rounded-full ${isSelected ? "bg-green-500/40" : "bg-green-500/20"} px-2 py-1 text-xs font-medium text-green-400`}>
                              Assigned
                            </span>
                          ) : (
                            <span className={`inline-flex rounded-full ${isSelected ? "bg-green-500/40" : "bg-gray-500/20"} px-2 py-1 text-xs font-medium ${isSelected ? "text-green-400" : "text-gray-400"}`}>
                              {isSelected ? "Will be assigned" : "Not Assigned"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-gray-400">
                      No students found in the selected batches
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}      {/* Action buttons */}
      {studentsInSelectedBatches.length > 0 && (
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleSaveChanges}
            className="py-3 px-8 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition transform duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Assignment Changes
          </button>
        </div>
      )}      {/* Summary information */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Assignment Summary</h3>
        <div className="flex flex-wrap gap-4">
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Total Batches</p>
            <p className="text-xl font-semibold text-blue-400">{batches.length}</p>
          </div>
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Selected Batches</p>
            <p className="text-xl font-semibold text-blue-400">{selectedBatchIds.length}</p>
          </div>
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Students in Selected Batches</p>
            <p className="text-xl font-semibold text-blue-400">{studentsInSelectedBatches.length}</p>
          </div>
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Currently Assigned</p>
            <p className="text-xl font-semibold text-green-400">
              {assignedStudents.filter(s => 
                studentsInSelectedBatches.some(bs => bs._id === s._id)
              ).length} / {studentsInSelectedBatches.length}
            </p>
          </div>
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Selected for Assignment</p>
            <p className="text-xl font-semibold text-blue-400">{selectedStudents.length}</p>
          </div>
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Changes to Save</p>
            <p className="text-xl font-semibold text-amber-400">
              {selectedStudents.filter(id => !assignedStudents.some(s => s._id === id)).length +
               assignedStudents.filter(s => 
                 studentsInSelectedBatches.some(bs => bs._id === s._id) && 
                 !selectedStudents.includes(s._id)
               ).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAssignedStudents;
