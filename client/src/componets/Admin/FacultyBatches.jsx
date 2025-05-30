import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { School, Book, Calendar, UsersRound, ChevronRight, BookOpen } from "lucide-react";

const FacultyBatches = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/admin/batch/faculty/${facultyId}/batches`);
        setBatches(res.data.batches || []);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [facultyId]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <BookOpen className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Faculty's Batches
              </h1>
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

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-10 text-center">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">No Batches Found</h2>
            <p className="text-gray-400 mb-6">
              This faculty has not been assigned any batches yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {batches.map(batch => (
              <div
                key={batch._id}
                className="relative group bg-gray-900 rounded-2xl shadow-lg border border-gray-800 hover:border-blue-500 transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.03]"
                onClick={() => navigate(`/faculty/${facultyId}/batch/${batch._id}/students`)}
              >
                {/* Status badge */}
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10 tracking-wide shadow-md ${batch.isActive ? 'bg-green-800/80 text-green-300' : 'bg-red-800/80 text-red-300'}`}>
                  {batch.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 h-2 w-full" />
                <div className="p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <School className="text-blue-400" size={22} />
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors truncate">{batch.name}</h2>
                  </div>
                  {batch.subject && (
                    <div className="flex items-center gap-1 text-sm text-blue-200 mb-1">
                      <Book size={15} />
                      <span className="truncate">{batch.subject}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-1">
                    {batch.semester && (
                      <span className="bg-blue-900/60 text-blue-300 px-2 py-1 rounded text-xs font-medium">Sem: {batch.semester}</span>
                    )}
                    {batch.branch && (
                      <span className="bg-indigo-900/60 text-indigo-300 px-2 py-1 rounded text-xs font-medium">Branch: {batch.branch}</span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-2 text-sm min-h-[2.2rem] line-clamp-2">{batch.description || 'No description provided'}</p>
                  <div className="flex flex-col gap-1 border-t border-gray-800 pt-2 mt-2">
                    <div className="flex items-center text-xs text-gray-300 gap-2">
                      <UsersRound size={13} className="text-blue-400" />
                      <span>Students:</span>
                      <span className="font-semibold text-blue-200">{batch.students ? batch.students.length : 0}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-300 gap-2">
                      <Book size={13} className="text-blue-400" />
                      <span>Problems:</span>
                      <span className="font-semibold text-blue-200">{batch.assignedProblems ? batch.assignedProblems.length : 0}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-300 gap-2">
                      <Calendar size={13} className="text-blue-400" />
                      <span>Created:</span>
                      <span className="font-semibold text-blue-200">{formatDate(batch.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-200 transition font-semibold border border-blue-700 px-3 py-1 rounded-lg bg-blue-900/30 shadow-sm text-xs"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/faculty/${facultyId}/batch/${batch._id}/students`);
                      }}
                    >
                      <span>View Students</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyBatches;