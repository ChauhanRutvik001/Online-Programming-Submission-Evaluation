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
  const [batchDueDates, setBatchDueDates] = useState([]); // [{ batchId, dueDate }]
  const [originalBatchDueDates, setOriginalBatchDueDates] = useState([]); // Keep track of original values
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get current date-time formatted for datetime-local input min attribute
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };
  

  // Fetch faculty's batches and assigned batches/due dates for this problem
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // First fetch the batches
        const batchResponse = await axiosInstance.get("/faculty/my-batches");
        
        if (!isMounted) return;
        
        if (batchResponse.data.success) {
          const loadedBatches = batchResponse.data.batches || [];
          setBatches(loadedBatches);
          
          // Now fetch problem data AFTER we have the batches
          try {
            const problemResponse = await axiosInstance.get(`/problems/${problemId}`);
            const problem = problemResponse.data.problem || problemResponse.data;
            
            if (!isMounted) return;
            
            console.log("Problem data:", problem);
            
            // Store all batch IDs from our loaded batches for later comparison
            const myBatchIds = loadedBatches.map(batch => batch._id);
            
            // Get all batchDueDates from the problem
            const allBatchDueDatesArr = (problem.batchDueDates || []).map(bd => {
              const batchId = typeof bd.batch === 'object' ? bd.batch._id : bd.batch;
              const dueDate = bd.dueDate ? new Date(bd.dueDate).toISOString().substring(0, 16) : "";
              
              return {
                batchId,
                dueDate
              };
            });
            
            // Only keep batch due dates for batches that belong to the current faculty
            const myBatchDueDatesArr = allBatchDueDatesArr.filter(bd => 
              myBatchIds.includes(bd.batchId)
            );
            
            // Save the filtered batch due dates
            setBatchDueDates(myBatchDueDatesArr);
            
            // IMPORTANT: Also save the original values for comparison later
            setOriginalBatchDueDates([...myBatchDueDatesArr]);
            
            // Extract batch IDs from due dates to set assigned batches
            const myAssignedBatchIdsArr = myBatchDueDatesArr.map(bd => bd.batchId);
            
            // Set both assigned and selected batch IDs
            setAssignedBatchIds(myAssignedBatchIdsArr);
            setSelectedBatchIds(myAssignedBatchIdsArr);
            
          } catch (err) {
            if (isMounted) {
              setError("Failed to load problem data: " + err.message);
              console.error("Error loading problem data:", err);
            }
          }
        } else {
          if (isMounted) {
            setError("Failed to load batches");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load batches: " + err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [problemId]);

  // Handle batch selection
  const handleBatchSelect = (batchId) => {
    if (selectedBatchIds.includes(batchId)) {
      // Deselecting a batch
      setSelectedBatchIds(selectedBatchIds.filter(id => id !== batchId));
    } else {
      // Selecting a batch
      // First check if this batch exists in our loaded batches (meaning we have permission)
      const batchExists = batches.some(batch => batch._id === batchId);
      if (!batchExists) {
        toast.error("You don't have permission to assign this batch");
        return;
      }
      
      setSelectedBatchIds([...selectedBatchIds, batchId]);
      
      // IMPORTANT: Only add it if it doesn't already exist, and don't set an empty string
      if (!batchDueDates.some(b => b.batchId === batchId)) {
        // Set dueDate to null explicitly, not empty string
        setBatchDueDates(prev => [...prev, { batchId, dueDate: null }]);
      }
    }
  };

  // Handle due date change for a batch
  const handleBatchDueDateChange = (batchId, newDueDate) => {
    // If newDueDate is empty string, set it to null explicitly
    const valueToSet = newDueDate === "" ? null : newDueDate;
    
    // Only validate if we have an actual date
    if (valueToSet) {
      const selectedDate = new Date(valueToSet);
      const currentDate = new Date();
      
      if (selectedDate < currentDate) {
        toast.error("Due date cannot be in the past");
        return;
      }
    }
    
    console.log(`Setting due date for batch ${batchId}:`, {
      oldValue: batchDueDates.find(b => b.batchId === batchId)?.dueDate || "none",
      newValue: valueToSet,
      originalValue: originalBatchDueDates.find(b => b.batchId === batchId)?.dueDate || "none"
    });
    
    setBatchDueDates(prev =>
      prev.some(b => b.batchId === batchId)
        ? prev.map(b =>
            b.batchId === batchId ? { ...b, dueDate: valueToSet } : b
          )
        : [...prev, { batchId, dueDate: valueToSet }]
    );
  };

  // Save all assignment changes
  const handleSaveChanges = async () => {
    // Validate that all selected batches are in our loaded batches (meaning we have permission)
    const validBatchIds = batches.map(batch => batch._id);
    const invalidBatchIds = selectedBatchIds.filter(id => !validBatchIds.includes(id));
    
    if (invalidBatchIds.length > 0) {
      toast.error("You don't have permission to assign some selected batches");
      setError("Permission denied for some batches. Please refresh and try again.");
      return;
    }

    // Find batches to assign (new selections)
    const batchesToAssign = selectedBatchIds.filter(
      id => !assignedBatchIds.includes(id)
    );
    
    // Find batches to unassign (removed selections)
    const batchesToUnassign = assignedBatchIds.filter(
      id => !selectedBatchIds.includes(id)
    );
    
    // Find batches with changed due dates by comparing with ORIGINAL values
    const batchesWithChangedDueDates = selectedBatchIds.filter(batchId => {
      // Get the current due date from our state
      const currentDueDate = batchDueDates.find(b => b.batchId === batchId)?.dueDate || "";
      
      // Get the ORIGINAL due date from when the component first loaded
      const originalDueDate = originalBatchDueDates.find(b => b.batchId === batchId)?.dueDate || "";
      
      console.log(`Comparing dates for batch ${batchId}:`, {
        currentDueDate,
        originalDueDate,
        isDifferent: currentDueDate !== originalDueDate
      });
      
      // Return true if the date has changed
      return currentDueDate !== originalDueDate;
    });
    
    // If nothing has changed, show a message and return
    if (batchesToAssign.length === 0 && batchesToUnassign.length === 0 && batchesWithChangedDueDates.length === 0) {
      toast("No changes to save", {
        icon: "ℹ️",
        style: {
          background: '#3b82f6',
          color: '#fff',
        }
      });
      return;
    }

    setProcessing(true);
    console.log("Changes to save:", {
      batchesToAssign,
      batchesToUnassign,
      batchesWithChangedDueDates
    });

    try {
      // Only send batches that need to be assigned or have changed due dates
      if (batchesToAssign.length > 0 || batchesWithChangedDueDates.length > 0) {
        // Only send the batches that are new or have changed due dates
        const batchesToUpdate = [...batchesToAssign, ...batchesWithChangedDueDates]
          .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
        
        // Create the batch due dates array for only changed items
        const batchDueDatesToSend = batchesToUpdate
          .filter(batchId => validBatchIds.includes(batchId))
          .map(batchId => {
            const dueDateEntry = batchDueDates.find(b => b.batchId === batchId);
            return {
              batchId: batchId,
              // Only send a date if one is explicitly set and valid
              dueDate: dueDateEntry?.dueDate && dueDateEntry.dueDate !== "" 
                ? new Date(dueDateEntry.dueDate).toISOString() 
                : null
            };
          });

        console.log("Sending updates for batches:", batchDueDatesToSend);
        
        await axiosInstance.post(`/problems/${problemId}/assignBatches`, {
          batchDueDates: batchDueDatesToSend
        });
      }

      // Unassign batches if needed
      if (batchesToUnassign.length > 0) {
        console.log("Unassigning batches:", batchesToUnassign);
        
        await axiosInstance.post(`/problems/${problemId}/unassign-batches`, {
          batchIds: batchesToUnassign
        });
      }

      toast.success("Assignment changes saved successfully!");
      setError(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      console.error("Assignment error:", error);
      toast.error(`Failed to save assignment changes: ${errorMsg}`);
      setError(`Failed to save changes: ${errorMsg}`);
      
      // If there's an error about missing batches, log more details
      if (error.response?.data?.missingBatchIds) {
        console.error("Missing batch IDs:", error.response.data.missingBatchIds);
      }
    } finally {
      // Refresh the data to ensure everything is in sync
      const refreshData = async () => {
        try {
          // Get the problem to get its batchDueDates
          const problemResponse = await axiosInstance.get(`/problems/${problemId}`);
          const problem = problemResponse.data.problem || problemResponse.data;
          
          // Use the current batches from state to ensure we have them
          const currentBatches = batches;
          const myBatchIds = currentBatches.map(batch => batch._id);
          
          // Get all batchDueDates from the problem
          const allBatchDueDatesArr = (problem.batchDueDates || []).map(bd => ({
            batchId: typeof bd.batch === 'object' ? bd.batch._id : bd.batch,
            dueDate: bd.dueDate ? new Date(bd.dueDate).toISOString().substring(0, 16) : ""
          }));
          
          // Only keep batch due dates for batches that belong to the current faculty
          const myBatchDueDatesArr = allBatchDueDatesArr.filter(bd => 
            myBatchIds.includes(bd.batchId)
          );
          
          // Update state
          setBatchDueDates(myBatchDueDatesArr);
          // IMPORTANT: Also update original dates after save
          setOriginalBatchDueDates([...myBatchDueDatesArr]);
          
          const myAssignedBatchIdsArr = myBatchDueDatesArr.map(bd => bd.batchId);
          setAssignedBatchIds(myAssignedBatchIdsArr);
          setSelectedBatchIds(myAssignedBatchIdsArr);
        } catch (err) {
          console.error("Failed to refresh problem data:", err);
        } finally {
          setProcessing(false);
        }
      };
      
      refreshData();
    }
  };

  // Add this new function to your component
  const handleClearDueDate = (e, batchId) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`Clearing due date for batch ${batchId}`);
    
    // Explicitly set to null
    setBatchDueDates(prev =>
      prev.map(b => 
        b.batchId === batchId ? { ...b, dueDate: null } : b
      )
    );
  }

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
                d="M4 12a8 8 0 0 1-8-8v8H4z"
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

      {/* Batch selection section with per-batch due date */}
      <div className="mb-8 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">1. Select Batches and Set Due Dates</h2>
        {batches.length === 0 ? (
          <p className="text-gray-400">No batches found. Create batches to assign problems to students.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => {
              const isSelected = selectedBatchIds.includes(batch._id);
              const batchDueDate = batchDueDates.find(b => b.batchId === batch._id);
              
              // IMPORTANT: Only use the due date if it's a valid date string, otherwise null
              const dueDateValue = batchDueDate?.dueDate && batchDueDate.dueDate.trim() !== "" 
                ? batchDueDate.dueDate 
                : null;
              
              const isAssigned = assignedBatchIds.includes(batch._id);
              
              return (
                <div
                  key={batch._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-900/30"
                      : "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
                  }`}
                  onClick={() => handleBatchSelect(batch._id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{batch.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-sm rounded-full bg-blue-500/20 text-blue-300">
                        {batch.students?.length || 0} Students
                      </span>
                      {isAssigned && (
                        <span className="px-2 py-1 text-sm rounded-full bg-green-500/20 text-green-300">
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">{batch.subject || "No subject"}</p>
                  <p className="text-gray-400 text-sm mt-1">{batch.description || "No description"}</p>
                  
                  {/* Only show this section if there's actually a due date */}
                  {dueDateValue && !isSelected && (
                    <div className="mt-3 p-2 bg-indigo-900/30 border border-indigo-800/50 rounded">
                      <p className="text-sm flex items-center gap-2 text-indigo-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Due: {new Date(dueDateValue).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className="mt-4">
                      <label className="block text-gray-300 mb-1 text-sm">
                        Due Date for this Batch {dueDateValue ? "(currently set)" : "(optional)"}
                      </label>
                      <input
                        type="datetime-local"
                        // Only show the value if it's actually set
                        value={dueDateValue || ""}
                        min={getCurrentDateTime()}
                        onChange={e => handleBatchDueDateChange(batch._id, e.target.value || null)}
                        className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 w-full"
                        onClick={e => e.stopPropagation()}
                      />
                      {/* Add a clear button to remove a due date */}
                      {dueDateValue && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-red-400 hover:text-red-300 bg-red-900/20 px-2 py-1 rounded"
                          onClick={(e) => handleClearDueDate(e, batch._id)}
                        >
                          Clear Due Date
                        </button>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {dueDateValue
                          ? `Due on: ${new Date(dueDateValue).toLocaleString()}`
                          : "No due date set for this batch."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
                assignedBatchIds.filter(id => !selectedBatchIds.includes(id)).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAssignedStudents;