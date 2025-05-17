import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfilePicThunk, setLoading, setUser } from "../redux/userSlice";
import axiosInstance from "../utils/axiosInstance";
import PasswordChange from "./PassWordChange";

const Login = () => {
  const user = useSelector((store) => store.app.user);
  const authStatus = useSelector((store) => store.app.authStatus);
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [popUp, setPopUp] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((store) => store.app.isLoading);

  useEffect(() => {
    if (authStatus) {
      navigate("/browse");
    } else {
      navigate("/");
    }
  }, [authStatus]);

  const validateLogin = () => {
    if (!idOrEmail || !password) {
      toast.error("ID/Email and password are required for login.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    dispatch(setLoading(true));
    setAssignLoading(true);
    const user = {
      [idOrEmail.includes("@") ? "email" : "id"]: idOrEmail.toLowerCase(),
      password,
    };

    try {
      const url = `auth/login`;
      const res = await axiosInstance.post(url, user);
      console.log(res.data);
      if (res.data.success) {
        const { firstTimeLogin, message } = res.data;
        if (firstTimeLogin) {
          setIsFirstTime(true);
          toast.success("Welcome to your first login!");
          return;
        }

        const { user: loggedInUser } = res.data;
        toast.success(message || "Login successful!");
        dispatch(setUser(loggedInUser));
        dispatch(setLoading(true));
        dispatch(fetchProfilePicThunk());
        dispatch(setLoading(false));
        navigate("/browse");
      } else {
        toast.error(res.data.message || "Login failed!");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "An error occurred during login.";
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
      setAssignLoading(false);

      if (!isFirstTime) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setIdOrEmail("");
    setPassword("");
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left Section */}
      <div className="hidden lg:block w-1/3 h-screen">
        <img
          src="/leftside.png"
          alt="Logo"
          className="h-full w-full object-fit"
        />
      </div>

      {/* Right Section */}
      <div
        className="w-full lg:w-2/3 h-screen bg-cover bg-center relative"
        style={{ backgroundImage: `url('/rightside.jpg')` }}
      >
        <div className="inset-0 absolute flex items-center justify-center bg-gray-900 bg-opacity-50 px-4 sm:px-6">
          <div className="w-full max-w-2xl sm:max-w-lg bg-opacity-90">
            {isFirstTime ? (
              <PasswordChange id={idOrEmail} />
            ) : (
              <form
                onSubmit={handleLogin}
                className="w-full bg-white p-6 sm:p-8 rounded-lg shadow-md"
              >
                <div className="mb-6 text-center">                  <img
                    src="/logo2.jpg"
                    alt="CHARUSAT"
                    className="mx-auto h-12 sm:h-16"
                  />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Online Programming Submission & Evaluation
                  </h2>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="id"
                    value={idOrEmail}
                    onChange={(e) => setIdOrEmail(e.target.value)}
                    className="mt-1 block w-full p-2 sm:p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="mb-4 relative">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full p-2 sm:p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? "👁️" : "🙅‍♂️"}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p
                    onClick={() =>
                      setPopUp("We can't change your password at the moment.")
                    }
                    className="text-indigo-600 text-sm cursor-pointer hover:underline"
                  >
                    Forgot your password?
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                >
                  Login
                </button>

                {popUp && (
                  <p className="text-center mt-4 text-red-600 text-sm">
                    {popUp}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {assignLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="text-white text-lg font-semibold">Login...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;