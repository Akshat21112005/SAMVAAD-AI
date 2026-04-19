import { createSlice } from "@reduxjs/toolkit";

const interviewSlice = createSlice({
  name: "interview",
  initialState: {
    currentSession: null,
    sessions: [],
    status: "idle",
  },
  reducers: {
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
      state.status = "active";
    },
    updateAnswer: (state, action) => {
      const { questionId, answer, evaluation } = action.payload;
      if (!state.currentSession) return;
      if (!state.currentSession.answers) state.currentSession.answers = {};
      if (!state.currentSession.evaluations) state.currentSession.evaluations = {};
      state.currentSession.answers[questionId] = answer;
      if (evaluation) state.currentSession.evaluations[questionId] = evaluation;
    },
    completeSession: (state, action) => {
      const completed = {
        ...state.currentSession,
        ...action.payload,
      };
      state.sessions.unshift(completed);
      state.currentSession = null;
      state.status = "completed";
    },
    hydrateHistory: (state, action) => {
      state.sessions = action.payload || [];
    },
    clearSession: (state) => {
      state.currentSession = null;
      state.status = "idle";
    },
  },
});

export const {
  clearSession,
  completeSession,
  hydrateHistory,
  setCurrentSession,
  updateAnswer,
} = interviewSlice.actions;

export default interviewSlice.reducer;
