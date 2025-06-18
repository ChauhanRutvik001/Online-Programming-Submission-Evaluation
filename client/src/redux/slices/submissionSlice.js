import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { logout } from "../userSlice"; // Import logout action from userSlice

export const fetchSubmissions = createAsyncThunk(
  "submissions/fetchSubmissions",
  async ({ page = 1, limit = 7 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/submissions/user/submissions?page=${page}&limit=${limit}`);
      console.log("Fetched submissions:", response.data.submissions);
      return { submissions: response.data.submissions || [] };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch submissions"
      );
    }
  }
);

const submissionSlice = createSlice({
  name: "submissions",  initialState: {
    submissions: [],
    loading: false,
    error: null,
    selectedSubmission: null,
    hasAttemptedFetch: false,
  },
  reducers: {
    setSelectedSubmission(state, action) {
      state.selectedSubmission = action.payload;
    },
    clearSubmissions(state) {
      state.submissions = [];
      state.loading = false;
      state.error = null;
      state.selectedSubmission = null;
    },
    addSubmission(state, action) {
      state.submissions.unshift(action.payload);
      state.selectedSubmission = action.payload;
    },
    logoutSubmissions: (state) => {
      state.submissions = [];
      state.loading = false;
      state.error = null;
      state.selectedSubmission = null;
    },
  },
  extraReducers: (builder) => {
    builder      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.hasAttemptedFetch = true;
        state.submissions = action.payload.submissions || [];
        state.selectedSubmission =
          action.payload.submissions?.length > 0
            ? action.payload.submissions[0]
            : null;
        state.error = action.payload.submissions?.length === 0 ? "No submissions found" : null;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.hasAttemptedFetch = true;
        state.error = action.payload || "No submissions found";
      })
      // Handle user logout action from userSlice
      .addCase(logout, (state) => {
        state.submissions = [];
        state.loading = false;
        state.error = null;
        state.selectedSubmission = null;
      });
  },
});

export const {
  setSelectedSubmission,
  clearSubmissions,
  addSubmission,
  logoutSubmissions,
} = submissionSlice.actions;
export default submissionSlice.reducer;