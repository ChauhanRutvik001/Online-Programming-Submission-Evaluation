import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const BatchAssignedStudents = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [assignedBatchIds, setAssignedBatchIds] = useState([]);
  const [dueDate, setDueDate] = useState("");
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

    // Fetch assigned batches for this problem
    const fetchProblemData = async () => {
      try {
        // First get the problem to get its due date
        const problemResponse = await axiosInstance.get(`/problems/${problemId}`);
        if (problemResponse.data.dueDate) {
          setDueDate(new Date(problemResponse.data.dueDate).toISOString().substring(0, 16));
        }
        
        // Then get the assigned batches
        const batchesResponse = await axiosInstance.get(`/problems/${problemId}/batches`);
        if (batchesResponse.data.success) {
          const assignedBatches = batchesResponse.data.batches || [];
          setAssignedBatchIds(assignedBatches.map(batch => batch._id));
          setSelectedBatchIds(assignedBatches.map(batch => batch._id));
        }
      } catch (err) {
        setError("Failed to load problem data: " + err.message);
      }
    };

    fetchBatches();
    fetchProblemData();
  }, [problemId]);

  // Handle batch selection
  const handleBatchSelect = (batchId) => {
    if (selectedBatchIds.includes(batchId)) {
      setSelectedBatchIds(selectedBatchIds.filter(id => id !== batchId));
    } else {
      setSelectedBatchIds([...selectedBatchIds, batchId]);
    }
  };
  
  // Handle date change
  const handleDateChange = (e) => {
    setDueDate(e.target.value);
  };
  
  // Save all assignment changes
  const handleSaveChanges = async () => {
    const batchesToAssign = selectedBatchIds.filter(
      id => !assignedBatchIds.includes(id)
    );
    
    const batchesToUnassign = assignedBatchIds.filter(
      id => !selectedBatchIds.includes(id)
    );
    
    if (batchesToAssign.length === 0 && batchesToUnassign.length === 0 && dueDate === "") {
      toast.info("No changes to save");
      return;
    }
    
    setProcessing(true);
    
    try {
      // Process batch assignments if needed
      if (batchesToAssign.length > 0) {
        await axiosInstance.post(`/problems/${problemId}/assignBatches`, {
          batchIds: batchesToAssign,
          dueDate: dueDate || null
        });
        
        // Update assigned batches
        setAssignedBatchIds([...assignedBatchIds, ...batchesToAssign]);
      }
      
      // Process batch unassignments if needed
      if (batchesToUnassign.length > 0) {
        await axiosInstance.post(`/problems/${problemId}/unassign-batches`, {
          batchIds: batchesToUnassign
        });
        
        // Update assigned batches
        setAssignedBatchIds(assignedBatchIds.filter(id => !batchesToUnassign.includes(id)));
      }
        // Update due date if it's changed
      if (dueDate) {
        await axiosInstance.put(`/problems/${problemId}`, {
          dueDate: dueDate
        });
      }
      
      toast.success("Assignment changes saved successfully!");
      setError(null);    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      console.error("Assignment error:", error);
      toast.error(`Failed to save assignment changes: ${errorMsg}`);
      setError(`Failed to save changes: ${errorMsg}`);
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

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      
      {/* Loading overlay for processing actions */}
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
              Processing changes...
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

      {/* Due Date Section */}
      <div className="mb-8 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">1. Set Due Date (Optional)</h2>
        <div className="flex items-center">
          <input
            type="datetime-local"
            value={dueDate}
            onChange={handleDateChange}
            className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="ml-4 text-gray-400">
            {dueDate ? (
              <>Due on: {new Date(dueDate).toLocaleString()}</>
            ) : (
              <>No due date set. Students can submit anytime.</>
            )}
          </p>
        </div>
      </div>

      {/* Batch selection section */}
      <div className="mb-8 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">2. Select Batches to Assign</h2>
        
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

      {/* Action buttons */}
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

      {/* Summary information */}
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
            <p className="text-sm text-gray-400">Total Students in Selected Batches</p>
            <p className="text-xl font-semibold text-blue-400">
              {batches
                .filter(batch => selectedBatchIds.includes(batch._id))
                .reduce((total, batch) => total + (batch.students?.length || 0), 0)}
            </p>
          </div>
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Changes to Save</p>
            <p className="text-xl font-semibold text-amber-400">
              {selectedBatchIds.filter(id => !assignedBatchIds.includes(id)).length + 
               assignedBatchIds.filter(id => !selectedBatchIds.includes(id)).length +
               (dueDate ? 1 : 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAssignedStudents;
