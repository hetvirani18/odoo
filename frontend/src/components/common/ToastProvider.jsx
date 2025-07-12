import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Separate component to handle ToastContainer safely
const ToastProvider = () => {
  return (
    <ToastContainer 
      position="bottom-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      draggable
      pauseOnHover
    />
  );
};

export default ToastProvider;
