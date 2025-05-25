import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Trophy, Users, Timer, Terminal, Rocket, ExternalLink, ArrowRight, CheckCircle, Star } from "lucide-react";
import Header from "./Header";
import { useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Adding the SimpleCodeBlock component
const SimpleCodeBlock = () => {
  const codeString = `#include <iostream>
using namespace std;

int main() {
    // Print the classic greeting to the console
    cout << "Hello, World!" << endl;
    // Return success code
    return 0;
}`;

  const getHighlightedLine = (line) => {
    const tokens = line.split(/(\bint\b|\breturn\b|\bcout\b|\bendl\b|#include\b|<|>|"[^"]*"|\/\/.*|\{|\}|\(|\)|;)/g);
    return tokens.map((token, i) => {
      if (!token) return null;
      if (/^#include\b/.test(token)) return <span key={i} className="text-blue-400">{token}</span>;
      if (/^<.*>$/.test(token)) return <span key={i} className="text-blue-300">{token}</span>;
      if (/^int\b/.test(token)) return <span key={i} className="text-purple-400">{token}</span>;
      if (/^return\b/.test(token)) return <span key={i} className="text-purple-400">{token}</span>;
      if (/^cout\b|endl\b/.test(token)) return <span key={i} className="text-green-300">{token}</span>;
      if (/^\/\/.*/.test(token)) return <span key={i} className="text-gray-500 italic">{token}</span>;
      if (/^"[^"]*"$/.test(token)) return <span key={i} className="text-yellow-300">{token}</span>;
      if (/^\{|\}|\(|\)|;$/.test(token)) return <span key={i} className="text-pink-400">{token}</span>;
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <div className="bg-[#0d1117] text-gray-300 p-4 rounded font-mono text-sm leading-relaxed">
      {codeString.split("\n").map((line, i) => (
        <div key={i} className="flex items-start">
          <span className="w-6 text-right pr-3 text-gray-500 select-none">{i + 1}</span>
          <pre className="whitespace-pre-wrap">{getHighlightedLine(line)}</pre>
        </div>
      ))}
    </div>
  );
};

const Browse = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const features = [
    {
      icon: <Code2 className="w-10 h-10 text-blue-400" />,
      title: "Coding Challenges",
      description: "Tackle real-world programming problems and sharpen your skills with our curated challenges.",
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-500/30",
      hoverColor: "group-hover:text-blue-400"
    },
    {
      icon: <Trophy className="w-10 h-10 text-yellow-400" />,
      title: "Compete & Win",
      description: "Participate in contests, earn points and climb the leaderboard to showcase your expertise.",
      color: "from-yellow-500/20 to-yellow-600/20",
      borderColor: "border-yellow-500/30",
      hoverColor: "group-hover:text-yellow-400"
    },
    {
      icon: <Users className="w-10 h-10 text-green-400" />,
      title: "Global Community",
      description: "Connect with developers worldwide, share solutions and learn from diverse perspectives.",
      color: "from-green-500/20 to-green-600/20",
      borderColor: "border-green-500/30",
      hoverColor: "group-hover:text-green-400"
    },
    {
      icon: <Timer className="w-10 h-10 text-purple-400" />,
      title: "Time-based Contests",
      description: "Test your speed and efficiency in timed competitions designed to push your limits.",
      color: "from-purple-500/20 to-purple-600/20", 
      borderColor: "border-purple-500/30",
      hoverColor: "group-hover:text-purple-400"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      <main className="container mx-auto px-4 pb-12">
        <HeroSection />
          {/* Features Section with Enhanced Design */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="px-4 py-2 rounded-full bg-blue-900/30 text-blue-400 text-sm font-medium">Why Choose Our Platform?</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 text-transparent bg-clip-text">
              Online Programming Submission & Evaluation
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-gray-400">
              A modern platform for students, faculty, and administrators to manage, submit, and evaluate programming assignments and contests with ease. Built for CSPIT/KDPIT/CHARUSAT, it supports secure code evaluation, real-time feedback, and collaborative learning.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * 0 }}
              className="group rounded-xl p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 hover:border-opacity-70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="mb-4 bg-gray-800/50 p-3 rounded-lg inline-block group-hover:bg-blue-600/20 transition-all duration-300">
                <Code2 className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300">Online Code Submission</h3>
              <p className="text-gray-300 leading-relaxed">Submit code for assignments and contests in multiple languages. Get instant feedback and detailed results for every submission.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * 1 }}
              className="group rounded-xl p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-500/30 hover:border-opacity-70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10"
            >
              <div className="mb-4 bg-gray-800/50 p-3 rounded-lg inline-block group-hover:bg-yellow-600/20 transition-all duration-300">
                <Trophy className="w-10 h-10 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-yellow-400 transition-colors duration-300">Automated Evaluation</h3>
              <p className="text-gray-300 leading-relaxed">All submissions are automatically tested against multiple test cases. See your score, errors, and performance instantly.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * 2 }}
              className="group rounded-xl p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 hover:border-opacity-70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/10"
            >
              <div className="mb-4 bg-gray-800/50 p-3 rounded-lg inline-block group-hover:bg-green-600/20 transition-all duration-300">
                <Users className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors duration-300">Batch & Contest Management</h3>
              <p className="text-gray-300 leading-relaxed">Faculty can create batches, assign problems, and organize contests. Students can join with codes and track their progress.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * 3 }}
              className="group rounded-xl p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 hover:border-opacity-70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
            >
              <div className="mb-4 bg-gray-800/50 p-3 rounded-lg inline-block group-hover:bg-purple-600/20 transition-all duration-300">
                <Timer className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors duration-300">Learning & Analytics</h3>
              <p className="text-gray-300 leading-relaxed">Track your coding history, analyze your strengths, and get personalized feedback to improve your programming skills.</p>
            </motion.div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-blue-400 mb-2"
              >
                500+
              </motion.div>
              <p className="text-gray-400">Active Students</p>
            </div>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-green-400 mb-2"
              >
                50+
              </motion.div>
              <p className="text-gray-400">Faculty Members</p>
            </div>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-yellow-400 mb-2"
              >
                1000+
              </motion.div>
              <p className="text-gray-400">Code Submissions</p>
            </div>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold text-purple-400 mb-2"
              >
                100+
              </motion.div>
              <p className="text-gray-400">Programming Problems</p>
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="px-4 py-2 rounded-full bg-purple-900/30 text-purple-400 text-sm font-medium">Simple Process</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 text-transparent bg-clip-text">
              How It Works
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-gray-400">
              Get started with our platform in just a few simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center relative"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-blue-500/30">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Register & Join</h3>
              <p className="text-gray-300">Sign up with your student credentials and join your assigned batches or contests using invite codes.</p>
              {/* Connecting line */}
              <div className="hidden md:block absolute top-10 left-3/4 w-1/2 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center relative"
            >
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-green-500/30">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-green-400">Code & Submit</h3>
              <p className="text-gray-300">Write your solutions in our online code editor supporting multiple programming languages with syntax highlighting.</p>
              {/* Connecting line */}
              <div className="hidden md:block absolute top-10 left-3/4 w-1/2 h-0.5 bg-gradient-to-r from-green-500/50 to-transparent"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-purple-500/30">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">Get Results</h3>
              <p className="text-gray-300">Receive instant feedback with detailed test case results, performance metrics, and suggestions for improvement.</p>
            </motion.div>
          </div>
        </section>

        {/* Language Support Section */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="px-4 py-2 rounded-full bg-green-900/30 text-green-400 text-sm font-medium">Multi-Language Support</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Code in Your Favorite Language
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {['C++', 'Java', 'Python', 'JavaScript', 'C'].map((lang, index) => (
              <motion.div
                key={lang}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="font-medium text-gray-300">{lang}</span>
              </motion.div>
            ))}
          </div>
        </section>        {/* Join Contest Section */}
        <section className="py-16 my-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-700/20 p-10 text-center relative overflow-hidden"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-40 h-40 bg-blue-500/10 rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.1, 0.3, 0.1],
                    x: [0, Math.random() * 50, 0],
                    y: [0, Math.random() * 50, 0],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-600/30 text-blue-300 backdrop-blur-sm border border-blue-500/30"
              >
                <Star className="w-5 h-5" />
                <span className="font-medium">Ready to Challenge Yourself?</span>
              </motion.div>

              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Join Programming Contests
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Test your skills against fellow students in timed programming challenges. 
                Compete, learn, and climb the leaderboard!
              </motion.p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-semibold shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                  onClick={() => navigate('/make-contest')}
                >
                  <span>View Upcoming Contests</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
                
                {/* <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsPopupOpen(true)}
                  className="group px-8 py-4 border-2 border-blue-500/30 hover:border-blue-400 rounded-xl text-lg font-semibold hover:bg-blue-900/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Join with Code</span>
                  <Terminal className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                </motion.button> */}
              </div>

              {/* Benefits row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Real-time Rankings</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Instant Feedback</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Skill Analytics</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>        {/* Join Contest Popup */}
      

        <Footer />
      </main>
    </div>
  );
};

export default Browse;

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center">
        {/* Left Content */}
        <motion.div
          className="md:w-1/2"
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full bg-blue-900/50 text-blue-300 backdrop-blur-sm border border-blue-700/30">
              <Rocket size={20} />
              <span className="font-medium">Welcome to Codify</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 mb-4 leading-tight tracking-tight">
              Code Without Limits <br className="hidden sm:inline" />
              <span className="relative text-white">
                Think. Build. Dominate.
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-full" />
              </span>
            </h1>

            <p className="text-lg text-gray-300 max-w-3xl mx-auto md:mx-0 leading-relaxed">
              Elevate your programming journey on a platform where challenges 
              ignite innovation, competitions forge excellence, and code 
              becomes your signature in the tech world.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all duration-300">
                Start Coding
              </button>
              <button className="px-6 py-3 border border-blue-500 text-blue-400 rounded-md font-medium hover:bg-blue-900/20 transition-all duration-300">
                Explore Challenges
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div
          className="lg:w-1/2"
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-4 text-gray-400 text-sm font-mono">challenge.js</div>
            </div>
            <div className="p-4 font-mono text-sm text-gray-300">
              <SimpleCodeBlock />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="py-8 text-center"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <motion.img
          src="/cspit.jpg"
          alt="CSPIT Logo"
          className="h-16 mx-auto mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />

        {/* Footer Text */} 
        <p className="text-gray-600 text-sm">
          Coding Platform - KDPIT
        </p>

        {/* CHARUSAT Link */}
        <motion.a
          href="https://www.charusat.ac.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          Visit CHARUSAT <ExternalLink className="ml-2 w-4 h-4" />
        </motion.a>

        {/* Copyright */}
        <p className="mt-6 text-gray-500 text-xs">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-semibold">CHARUSAT UNIVERSITY - KDPIT</span>.
          All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
};

