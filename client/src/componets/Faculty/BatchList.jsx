import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/faculty/batches');
      if (response.data.success) {
        setBatches(response.data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Batches</h1>
        <p className="text-gray-600">Manage your assigned student batches</p>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <h2 className="text-xl font-medium text-gray-700 mb-2">No Batches Found</h2>
          <p className="text-gray-500 mb-6">
            You haven't been assigned any batches yet. Please contact an administrator if you believe this is incorrect.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(batch => (
            <div key={batch._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{batch.name}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2 h-12">
                  {batch.description || 'No description provided'}
                </p>
                
                <div className="space-y-2 mb-4">                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 font-medium w-24">Subject:</span>
                    <span>{batch.subject || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 font-medium w-24">Students:</span>
                    <span>{batch.students ? batch.students.length : 0}</span>
                  </div>
                </div>
                
                <Link
                  to={`/faculty/batches/${batch._id}`}
                  className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchList;
