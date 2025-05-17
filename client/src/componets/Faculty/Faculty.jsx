import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Faculty = () => {
  const user = useSelector((store) => store.app.user);
  const navigate = useNavigate();

  // Only faculty allowed
  useEffect(() => {
    if (user?.role !== 'faculty') navigate('/');
  }, [user, navigate]);

  return (
    <>
      <div className="bg-gray-900 text-gray-100 min-h-screen overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4 p-6 pt-[100px]">
          <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        </div>
        
        <div className="p-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 mr-4 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            onClick={() => navigate(`/students/${user._id}`)}
          >
            View Students
          </button>
        </div>
      </div>
    </>
  );
};

export default Faculty;
