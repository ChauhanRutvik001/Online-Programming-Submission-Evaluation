import React from "react";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gray-900 text-white font-serif text-justify">
      <div className="px-4 sm:px-8 w-full flex flex-col items-center bg-gray-900 pt-28 sm:pt-40">
        <div className="w-full rounded-xl max-w-5xl bg-gray-300 border shadow-md p-4 sm:p-8">
          <div className="w-full flex flex-col-reverse md:flex-row items-start">
            <div className="w-full md:w-2/3">
              <h1 className="text-2xl sm:text-3xl font-bold text-black mb-4">Contact Us</h1>
              <p className="text-gray-600 break-words leading-relaxed text-sm sm:text-base">
                Feel free to reach out to us with your inquiries, feedback, or concerns. 
                Our team is here to assist you with any questions you may have.
                <br /><br />
                📩 <strong>Email:</strong> 22it015@charusat.edu.in
                <br />
                🏛️ <strong>Address:</strong> Charotar University of Science and Technology, CHARUSAT Campus, Off. Nadiad-Petlad Highway, Changa-388421
              </p>
            </div>
            <div className="flex justify-center md:justify-end w-full md:w-1/3 mb-6 md:mb-0">
              <img
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 rounded-xl object-contain"
                src="/collageLogo.jpg"
                alt="College Logo"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;