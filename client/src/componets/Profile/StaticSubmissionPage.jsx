import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Code, ChevronRight, History, FileText } from 'lucide-react';

const StaticSubmissionPage = () => {
  const navigate = useNavigate();

  const handleViewMore = () => {
    navigate("/history");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const truncateTitle = (title, maxLength) => {
    return title && title.length > maxLength ? `${title.slice(0, maxLength)}...` : title || "Untitled";
  };

  const getStatusColor = (status) => {
    if (!status) return "gray";
    switch(status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'rejected':
        return 'red';
      case 'time limit exceeded':
        return 'yellow';
      case 'compilation error':
        return 'orange';
      case 'runtime error':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Static submission data for demonstration
  const staticSubmissions = [
    {
      _id: "1",
      problem_id: { title: "Two Sum Algorithm Challenge" },
      status: "completed",
      createdAt: "2024-01-15T10:30:00Z",
      language: "JavaScript"
    },
    {
      _id: "2", 
      problem_id: { title: "Binary Search Implementation" },
      status: "completed",
      createdAt: "2024-01-14T15:45:00Z",
      language: "Python"
    },
    {
      _id: "3",
      problem_id: { title: "Merge Sort Algorithm" },
      status: "rejected",
      createdAt: "2024-01-13T09:20:00Z",
      language: "Java"
    },
    {
      _id: "4",
      problem_id: { title: "Dynamic Programming - Fibonacci" },
      status: "completed",
      createdAt: "2024-01-12T14:15:00Z",
      language: "C++"
    },
    {
      _id: "5",
      problem_id: { title: "Graph Traversal - DFS Implementation" },
      status: "time limit exceeded",
      createdAt: "2024-01-11T11:30:00Z",
      language: "Python"
    }
  ];

  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl shadow-xl p-6 border border-gray-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <History size={24} className="text-blue-400" />
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-white">Submission History</h2>
            <p className="text-gray-400 text-sm">Your recent coding submissions</p>
          </div>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-full">
          <History size={24} className="text-blue-400" />
        </div>
      </div>

      {/* Static Submissions List */}
      <motion.ul 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {staticSubmissions.map((submission, index) => {
          const status = submission.status || "completed";
          const statusColor = getStatusColor(status);
          return (
            <motion.li
              key={submission._id}
              onClick={() => navigate("/submissions/" + submission._id)}
              className="bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 p-4 rounded-lg flex items-center cursor-pointer transition-all duration-300 hover:bg-gray-700/50 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex-shrink-0 mr-4 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <Code size={20} className="text-blue-400" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                    {truncateTitle(submission.problem_id?.title, 40)}
                  </h3>
                  <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/30`}>
                    {status}
                  </div>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-400">
                  <Clock size={14} className="mr-1" />
                  <span>{formatDate(submission.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>{submission.language}</span>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <ChevronRight size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* View More Button */}
      <motion.div 
        className="flex justify-end mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <button
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          onClick={handleViewMore}
        >
          <span>View All Submissions</span>
          <ChevronRight size={18} />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default StaticSubmissionPage;
