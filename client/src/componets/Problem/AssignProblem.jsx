import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const AssignProblem = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [problem, setProblem] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [filters, setFilters] = useState({
    branch: "cspit-it",
    semester: "6",
  });
  const [error, setError] = useState("");
  // Fetch problem details
  useEffect(() => {
    const fetchProblemDetails = async () => {
      try {
        const response = await axiosInstance.get(`/problems/${problemId}`);
        setProblem(response.data.problem);
      } catch (err) {
        toast.error("Failed to fetch problem details");
        setError("Failed to fetch problem details");
      }
    };

    fetchProblemDetails();
  }, [problemId]);

  // Fetch batches based on filters
  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/faculty/batches", {
          params: {
            branch: filters.branch,
            semester: filters.semester
          }
        });
        setBatches(response.data.batches || []);
      } catch (err) {
        toast.error("Failed to fetch batches");
        setError("Failed to fetch batches");
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [filters]);

  const handleBranchChange = (e) => {
    setFilters(prev => ({ ...prev, branch: e.target.value }));
    setSelectedBatches([]);
  };

  const handleSemesterChange = (e) => {
    setFilters(prev => ({ ...prev, semester: e.target.value }));
    setSelectedBatches([]);
  };

  const toggleBatchSelection = (batchId) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const selectAllBatches = () => {
    if (selectedBatches.length === batches.length) {
      setSelectedBatches([]);
    } else {
      setSelectedBatches(batches.map(batch => batch._id));
    }
  };
  const handleAssignToBatches = async () => {
    if (selectedBatches.length === 0) {
      toast.error("Please select at least one batch");
      return;
    }

    setAssignLoading(true);
    try {
      const response = await axiosInstance.post(`/problems/${problemId}/assignBatches`, {
        batchIds: selectedBatches,
        dueDate: null // You can add a due date picker in the UI if needed
      });
      
      toast.success(response.data.message || "Problem assigned successfully to selected batches");
      setSelectedBatches([]);
      
      // Show additional information about how many students were affected
      if (response.data.problem) {
        toast.success(`Problem is now assigned to ${response.data.problem.assignedStudents.length} students`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign problem to batches");
      setError("Failed to assign problem to batches");
    } finally {
      setAssignLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 pt-16 text-center">
          Batch Problem Assignment
        </h1>
        
        {problem && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-2 text-blue-400">
              Problem: {problem.title}
            </h2>
            <div className="text-gray-300 mb-2">
              <span className="font-medium">Difficulty:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm font-medium
                ${problem.difficulty === 'Easy' ? 'bg-green-800 text-green-200' : 
                  problem.difficulty === 'Medium' ? 'bg-yellow-800 text-yellow-200' : 
                  'bg-red-800 text-red-200'}`}>
                {problem.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-1">Created: {new Date(problem.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition transform duration-200"
            onClick={() => navigate(`/assignedStudents/${problemId}`)}
          >
            View Assigned Students
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-800 rounded-lg p-5 mb-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
              <select
                value={filters.branch}
                onChange={handleBranchChange}
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cspit-it">CSPIT-IT</option>
                <option value="cspit-ce">CSPIT-CE</option>
                <option value="cspit-cse">CSPIT-CSE</option>
                <option value="depstar-ce">DEPSTAR-CE</option>
                <option value="depstar-cse">DEPSTAR-CSE</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Semester</label>
              <select
                value={filters.semester}
                onChange={handleSemesterChange}
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Batches Section */}
        <div className="bg-gray-800 rounded-lg p-5 mb-6 border border-gray-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-400">Available Batches</h2>
            <button
              onClick={selectAllBatches}
              className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              {selectedBatches.length === batches.length && batches.length > 0 
                ? "Deselect All" 
                : "Select All"}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          ) : batches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {batches.map(batch => (
                <div
                  key={batch._id}
                  onClick={() => toggleBatchSelection(batch._id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedBatches.includes(batch._id)
                      ? "bg-blue-900 border-blue-500 shadow-lg shadow-blue-900/30"
                      : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{batch.name}</h3>
                      <p className="text-xs text-gray-400">{batch.studentsCount || 0} students</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                      checked={selectedBatches.includes(batch._id)}
                      onChange={() => {}} // Handled by div click
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-400">
              No batches found for the selected filters
            </div>
          )}
        </div>

        {/* Assign Button */}
        <div className="flex justify-center">
          <button
            onClick={handleAssignToBatches}
            disabled={selectedBatches.length === 0 || assignLoading}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition transform duration-200"
          >
            {assignLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Assigning...
              </div>
            ) : `Assign Problem to ${selectedBatches.length} Batches`}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {assignLoading && (
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
            <p className="text-white text-lg font-semibold">Assigning to batches...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignProblem;