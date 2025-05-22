import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import Header from '../Header';
import { Users, School, Book, Calendar, ChevronRight, Clipboard, Search, UsersRound } from 'lucide-react';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  // Filter batches based on search term
  const filteredBatches = batches.filter(batch => 
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.subject && batch.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 mt-16">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">My Batches</h1>
            <p className="text-gray-400 mt-1">Manage your assigned student batches and track their progress</p>
          </div>
          
          {/* Search bar */}
          <div className="mt-4 md:mt-0 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none w-full md:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-10 text-center">
            <School size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">No Batches Found</h2>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No batches match your search criteria.' : "You haven't been assigned any batches yet. Please contact an administrator if you believe this is incorrect."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map(batch => (
              <div 
                key={batch._id} 
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition cursor-pointer"
                onClick={() => navigate(`/faculty/batches/${batch._id}`)}
              >
                <div className="bg-gradient-to-r from-blue-800 to-indigo-900 h-3"></div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="text-blue-400" size={20} />
                    <h2 className="text-xl font-bold text-white">{batch.name}</h2>
                  </div>
                  
                  {batch.subject && (
                    <div className="flex items-center gap-1 text-sm text-gray-300 mb-3">
                      <Book size={14} />
                      <span>{batch.subject}</span>
                    </div>
                  )}
                  
                  <p className="text-gray-400 mb-4 line-clamp-2 h-12">
                    {batch.description || 'No description provided'}
                  </p>
                  
                  <div className="space-y-2 mb-4 pt-2 border-t border-gray-700">
                    <div className="flex items-center text-sm text-gray-300">
                      <UsersRound size={14} className="mr-2 text-blue-400" />
                      <span className="w-24">Students:</span>
                      <span className="font-medium">{batch.students ? batch.students.length : 0}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar size={14} className="mr-2 text-blue-400" />
                      <span className="w-24">Created:</span>
                      <span className="font-medium">{formatDate(batch.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Link
                      to={`/faculty/batches/${batch._id}`}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>View Details</span>
                      <ChevronRight size={16} />
                    </Link>                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BatchList;
