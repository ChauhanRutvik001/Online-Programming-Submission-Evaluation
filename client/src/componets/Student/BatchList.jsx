import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Users, School, Book, ChevronRight } from 'lucide-react';

const StudentBatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
  }, []);
  
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/user/my-batches');
      if (response.data.success) {
        setBatches(response.data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load your batches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 mt-16">
          <h1 className="text-2xl font-bold">My Batches</h1>
          <p className="text-gray-400">View all of your enrolled batches</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-10 text-center">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">No Batches Found</h2>
            <p className="text-gray-400 mb-6">
              You are not enrolled in any batches yet. Please contact your instructor or administrator if you believe this is incorrect.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map(batch => (
              <div key={batch._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:border hover:border-blue-500 transition cursor-pointer" onClick={() => navigate(`/student/batch/${batch._id}`)}>
                <div className="bg-gradient-to-r from-blue-800 to-indigo-900 h-3"></div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="text-blue-400" size={20} />
                    <h3 className="font-bold text-lg">{batch.name}</h3>
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

                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users size={16} />
                      <span>{batch.students?.length || 0} Students</span>
                    </div>
                    
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
      </main>
    </div>
  );
};

export default StudentBatchList;
