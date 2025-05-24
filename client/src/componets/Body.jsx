import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from './Layout';
import Login from './Login';
import Browse from './Browse';
import Student from './Student';
import MakeContest from './Contest/MakeContest';
import CreateContest from './Contest/CreateContest';
import MakeProblem from './Problem/MakeProblem';
import ProblemForm from './Problem/ProblemForm';
import ProblemShow from './Problem/ProblemShow';
import NotFoundError from './NotFoundError';
import Contest from './Contest/Contest';
import Profile from './Profile/Profile';
import AdminPage from './Admin/AdminPage';
import Dashboard from './Problem/Dashboard';
import History from './History';
import AdminRegister from './Admin/AdminRegister';
import CreateFaculty from './Admin/CreateFaculty';
import { default as AdminStudentRegister } from './Admin/StudentRegister';
import StudentList from './Admin/StudentList';
import StudentInfo from './Admin/StudentInfo';
import Details from './Problem/Details';
import Support from './Support';
import AssignedContest from './Contest/AssignedContest';
import UnAssignContest from './Contest/UnAssignContest';
import Duplicate from './Duplicate';
import ContestDashboard from './Contest/ContestDashboard';
import BatchManagement from './Admin/BatchManagement';
import CreateBatch from './Admin/CreateBatch';
import BatchDetails from './Admin/BatchDetails';
import FacultyBatchList from './Faculty/BatchList';
import FacultyBatchDetails from './Faculty/BatchDetails';
import FacultyBatchProgress from './Faculty/BatchProgress';
import StudentBatchList from './Student/BatchList';
import StudentBatchDetails from './Student/BatchDetails';
import StudentBatchProgress from './Student/BatchProgress';
import ManageUser from './Admin/ManageUser';
import SemesterStudentList from './Admin/SemesterStudentList';
import BatchAssignedStudents from './Problem/BatchAssignedStudents'
const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Login /> },
      { path: "/browse", element: <Browse /> },
      { path: "/support", element: <Support /> },
      { path: "/student", element: <Student /> },
      { path: "/make-contest", element: <MakeContest /> },
      { path: "/create-contest", element: <CreateContest /> },
      { path: "/create-contest/:id", element: <CreateContest /> },
      { path: "/contests/:id", element: <Contest /> },
      { path: "/make-problem", element: <MakeProblem /> },
      { path: "/pending-requests", element: <AdminPage /> },
      { path: "/problem-form", element: <ProblemForm /> },
      { path: "/problem-form/:id", element: <ProblemForm /> },
      { path: "/problems/:id", element: <ProblemShow /> },      { path: "/profile", element: <Profile /> },
      { path: "/dashboard/:problemId", element: <Dashboard /> },
      { path: "/history", element: <History /> },
      { path: "*", element: <NotFoundError /> },      { path: "/registerFaculty", element: <AdminRegister /> },
      { path: "/create-faculty", element: <CreateFaculty /> },
      { path: "/registerStudents", element: <AdminStudentRegister /> },
      { path:"/students/:facultyId", element: <StudentList /> },
      { path:"/studentinformation", element: <StudentInfo /> },
      { path:"/submissions/:submissionId", element:<Details />},      { path:"/assignContestToStudents/:contestId", element:<UnAssignContest />},
      { path:"/unassignContestToStudents/:contestId", element:<AssignedContest />},
      { path:"/duplicate", element:<Duplicate />},      { path:"/contests/:id/dashboard", element:<ContestDashboard />},
      { path:"/admin/batch/batches", element:<BatchManagement />},
      { path:"/admin/batch/batches/create", element:<CreateBatch />},
      { path:"/admin/batch/batches/:batchId", element:<BatchDetails />},      { path:"/faculty/batches", element:<FacultyBatchList />},
      { path:"/faculty/batches/:batchId", element:<FacultyBatchDetails />},
      { path:"/faculty/batches/:batchId/progress", element:<FacultyBatchProgress />},
      { path:"/student/batches", element:<StudentBatchList />},
      { path:"/student/batch/:batchId", element:<StudentBatchDetails />},
      { path:"/student/batch/:batchId/progress", element:<StudentBatchProgress />},
      {path:"/admin/users", element:<ManageUser />},
      {path:"/students/semester/:semesterId", element:<SemesterStudentList />},
      { path:"/batch-assign/:problemId", element: <BatchAssignedStudents /> },
    ],
  },
]);

const Body = () => (
  <RouterProvider router={appRouter} />
);

export default Body;
