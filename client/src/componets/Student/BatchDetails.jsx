import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Users, Book, Calendar, ChevronLeft, School, User, Clock } from 'lucide-react';

const StudentBatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/user/batches/${batchId}`);
        if (response.data.success) {
          setBatch(response.data.batch);
        }
      } catch (error) {
        console.error('Error fetching batch details:', error);
        toast.error('Failed to load batch details');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetails();
  }, [batchId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 ">
          <div className="flex justify-center items-center h-64 mt-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-medium text-red-400 mb-2">Batch Not Found</h2>
            <p className="text-gray-400 mb-4">
              The batch you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link to="/student" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6 mt-16">
          <button 
            onClick={() => navigate('/student/batches')}
            className="flex items-center text-blue-400 hover:text-blue-300 transition"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Batch Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-6 shadow-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">{batch.name}</h1>
          {batch.description && <p className="text-blue-100 mb-3">{batch.description}</p>}
          
          <div className="flex flex-wrap gap-4 text-sm">
            {batch.subject && (
              <div className="flex items-center gap-1">
                <Book size={16} className="text-blue-300" />
                <span>{batch.subject}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Calendar size={16} className="text-blue-300" />
              <span>Created: {formatDate(batch.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users size={16} className="text-blue-300" />
              <span>{batch.students?.length || 0} Students</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Faculty Information */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-blue-400" />
                <h2 className="text-xl font-semibold">Faculty Information</h2>
              </div>
              
              {batch.faculty ? (
                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700">
                  <h3 className="font-medium">{batch.faculty.username}</h3>
                  {batch.faculty.email && (
                    <p className="text-sm text-gray-400 mt-1">{batch.faculty.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No faculty information available</p>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Classmates */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-blue-400" />
                <h2 className="text-xl font-semibold">Classmates</h2>
              </div>
              
              {batch.students && batch.students.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {batch.students.map(student => (
                    <div key={student._id} className="p-2 bg-gray-750 rounded-lg border border-gray-700">
                      <span className="font-medium">{student.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No other students in this batch</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentBatchDetails;
