import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout";
import Login from "./Login";
import Browse from "./Browse";
import Student from "./Student";
import MakeContest from "./Contest/MakeContest";
import CreateContest from "./Contest/CreateContest";
import MakeProblem from "./Problem/MakeProblem";
import ProblemForm from "./Problem/ProblemForm";
import ProblemShow from "./Problem/ProblemShow";
import NotFoundError from "./NotFoundError";
import Contest from "./Contest/Contest";
import Profile from "./Profile/Profile";
import AdminPage from "./Admin/AdminPage";
import Dashboard from "./Problem/Dashboard";
import History from "./History";
import AdminRegister from "./Admin/AdminRegister";
import CreateFaculty from "./Admin/CreateFaculty";
import { default as AdminStudentRegister } from "./Admin/StudentRegister";
import StudentList from "./Admin/StudentList";
import StudentInfo from "./Admin/StudentInfo";
import Details from "./Problem/Details";
import Support from "./Support";
import AssignedContest from "./Contest/AssignedContest";
import UnAssignContest from "./Contest/UnAssignContest";
import Duplicate from "./Duplicate";
import ContestDashboard from "./Contest/ContestDashboard";
import BatchManagement from "./Admin/BatchManagement";
import CreateBatch from "./Admin/CreateBatch";
import BatchDetails from "./Admin/BatchDetails";
import FacultyBatchList from "./Faculty/BatchList";
import FacultyBatchDetails from "./Faculty/BatchDetails";
import FacultyBatchProgress from "./Faculty/BatchProgress";
import StudentBatchList from "./Student/BatchList";
import StudentBatchDetails from "./Student/BatchDetails";
import StudentBatchProgress from "./Student/BatchProgress";
import ManageUser from "./Admin/ManageUser";
import SemesterStudentList from "./Admin/SemesterStudentList";
import BatchAssignedStudents from "./Problem/BatchAssignedStudents";
import AdminProblems from "./Admin/AdminProblems";
import FacultyBatches from "./Admin/FacultyBatches";
import ProblemDetails from "./Problem/ProblemDetails";
import { useSelector } from "react-redux";
import AdminApiKeyManagement from "./Admin/AdminApiKeyManagement";

const Body = () => {
  // Get authentication status from Redux store
  const isAuthenticated = useSelector((state) => state.app.authStatus);
  
  const appRouter = createBrowserRouter([
    {
      path: "/",
      element: <Layout isAuthenticated={isAuthenticated} />,
      children: [
        { path: "/", element: <Browse isAuthenticated={isAuthenticated} /> },
         // Changed to Browse
        { path: "/login", element: <Login /> }, // Keep login route as is
        { path: "/support", element: <Support /> },
        
        // For protected routes, check if authenticated
        { path: "/student", 
          element: isAuthenticated ? <Student /> : <Login /> 
        },
        { path: "/make-contest", 
          element: isAuthenticated ? <MakeContest /> : <Login /> 
        },
        { path: "/create-contest", 
          element: isAuthenticated ? <CreateContest /> : <Login /> 
        },
        { path: "/create-contest/:id", 
          element: isAuthenticated ? <CreateContest /> : <Login /> 
        },
        { path: "/contests/:id", 
          element: isAuthenticated ? <Contest /> : <Login /> 
        },
        { path: "/make-problem", 
          element: isAuthenticated ? <MakeProblem /> : <Login /> 
        },
        { path: "/pending-requests", 
          element: isAuthenticated ? <AdminPage /> : <Login /> 
        },
        { path: "/problem-form", 
          element: isAuthenticated ? <ProblemForm /> : <Login /> 
        },
        { path: "/problem-form/:id", 
          element: isAuthenticated ? <ProblemForm /> : <Login /> 
        },
        { path: "/problems/:id/:batchId", 
          element: isAuthenticated ? <ProblemShow /> : <Login /> 
        },
        { path: "/profile", 
          element: isAuthenticated ? <Profile /> : <Login /> 
        },
        { path: "/dashboard/:problemId", 
          element: isAuthenticated ? <Dashboard /> : <Login /> 
        },
        { path: "/history", 
          element: isAuthenticated ? <History /> : <Login /> 
        },
        { path: "/registerFaculty", 
          element: isAuthenticated ? <AdminRegister /> : <Login /> 
        },
        { path: "/create-faculty", 
          element: isAuthenticated ? <CreateFaculty /> : <Login /> 
        },
        { path: "/registerStudents", 
          element: isAuthenticated ? <AdminStudentRegister /> : <Login /> 
        },
        { path: "/studentinformation", 
          element: isAuthenticated ? <StudentInfo /> : <Login /> 
        },
        { path: "/submissions/:submissionId", 
          element: isAuthenticated ? <Details /> : <Login /> 
        },
        { path: "/assignContestToStudents/:contestId",
          element: isAuthenticated ? <UnAssignContest /> : <Login /> 
        },
        { path: "/unassignContestToStudents/:contestId",
          element: isAuthenticated ? <AssignedContest /> : <Login /> 
        },
        { path: "/duplicate", 
          element: isAuthenticated ? <Duplicate /> : <Login /> 
        },
        { path: "/contests/:id/dashboard", 
          element: isAuthenticated ? <ContestDashboard /> : <Login /> 
        },
        { path: "/admin/batch/batches", 
          element: isAuthenticated ? <BatchManagement /> : <Login /> 
        },
        { path: "/admin/batch/batches/create", 
          element: isAuthenticated ? <CreateBatch /> : <Login /> 
        },
        { path: "/admin/batch/batches/:batchId", 
          element: isAuthenticated ? <BatchDetails /> : <Login /> 
        },
        { path: "/faculty/batches", 
          element: isAuthenticated ? <FacultyBatchList /> : <Login /> 
        },
        { path: "/faculty/batches/:batchId", 
          element: isAuthenticated ? <FacultyBatchDetails /> : <Login /> 
        },
        { path: "/faculty/batches/:batchId/progress",
          element: isAuthenticated ? <FacultyBatchProgress /> : <Login /> 
        },
        { path: "/student/batches", 
          element: isAuthenticated ? <StudentBatchList /> : <Login /> 
        },
        { path: "/student/batch/:batchId", 
          element: isAuthenticated ? <StudentBatchDetails /> : <Login /> 
        },
        { path: "/student/batch/:batchId/progress",
          element: isAuthenticated ? <StudentBatchProgress /> : <Login /> 
        },
        { path: "/admin/users", 
          element: isAuthenticated ? <ManageUser /> : <Login /> 
        },
        { path: "/students/semester/:semesterId",
          element: isAuthenticated ? <SemesterStudentList /> : <Login /> 
        },
        { path: "/batch-assign/:problemId", 
          element: isAuthenticated ? <BatchAssignedStudents /> : <Login /> 
        },
        { path: "/admin/problems", 
          element: isAuthenticated ? <AdminProblems /> : <Login /> 
        },
        { path: "/faculty/:facultyId/batches", 
          element: isAuthenticated ? <FacultyBatches /> : <Login /> 
        },
        { path: "/faculty/:facultyId/batch/:batchId/students",
          element: isAuthenticated ? <StudentList /> : <Login /> 
        },
        { path: "/problem-details/:problemId", 
          element: isAuthenticated ? <ProblemDetails /> : <Login /> 
        },
        {
          path:"/admin/api-keys",
          element: isAuthenticated ? <AdminApiKeyManagement /> : <Login />
        },
        // 404 route
        { path: "*", element: <NotFoundError /> },
      ],
    },
  ]);

  return <RouterProvider router={appRouter} />;
};

export default Body;