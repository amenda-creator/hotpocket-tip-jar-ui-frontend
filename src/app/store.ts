import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import snackbarReducer from '../features/snackbar/snackbarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    snackbar: snackbarReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
