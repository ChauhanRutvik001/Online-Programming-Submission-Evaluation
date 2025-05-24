import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Users, School, Book, ChevronRight } from 'lucide-react';

const StudentBatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line
  }, [search, page]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/user/my-batches', {
        params: {
          search,
          page,
          limit: pageSize,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      if (response.data.success) {
        setBatches(response.data.batches || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load your batches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950 text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 mt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">My Batches</h1>
            <p className="text-gray-400">View all of your enrolled batches</p>
          </div>
          <input
            type="text"
            placeholder="Search batches..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72 shadow"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-gray-800/80 rounded-2xl shadow-2xl p-10 text-center backdrop-blur-md">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">No Batches Found</h2>
            <p className="text-gray-400 mb-6">
              You are not enrolled in any batches yet. Please contact your instructor or administrator if you believe this is incorrect.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {batches.map(batch => (
              <div
                key={batch._id}
                className="bg-gray-800/80 rounded-2xl shadow-xl overflow-hidden hover:scale-[1.025] hover:shadow-blue-700/30 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer backdrop-blur-md group"
                onClick={() => navigate(`/student/batch/${batch._id}`)}
              >
                <div className="bg-gradient-to-r from-blue-800/80 to-indigo-900/80 h-2"></div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="text-blue-400" size={22} />
                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{batch.name}</h3>
                  </div>
                  {batch.subject && (
                    <div className="flex items-center gap-1 text-sm text-gray-300 mb-3">
                      <Book size={14} />
                      <span>{batch.subject}</span>
                    </div>
                  )}
                  {batch.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{batch.description}</p>
                  )}
                  <div className="flex flex-col gap-2 mt-3 text-sm border-t border-gray-700 pt-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users size={16} />
                      <span>{batch.students?.length || 0} Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <Book size={16} />
                      <span>{batch.assignedProblems?.length || 0} Problems</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="font-semibold">Faculty:</span>
                      <span>{batch.faculty?.username || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-4">
                    <div className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                      <span>View Details</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-blue-300 font-semibold text-lg">
            Page {page} of {totalPages}
          </span>
          <button
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
};

export default StudentBatchList;
