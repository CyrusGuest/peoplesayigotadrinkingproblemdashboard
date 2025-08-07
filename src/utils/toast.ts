import { toast } from 'react-toastify';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  info: (message: string) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  // For background process updates
  processUpdate: (message: string) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      toastId: 'process-update', // Prevents duplicate toasts
    });
  },

  // For form validation errors
  validationError: (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  // For API errors
  apiError: (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  // For loading states (can be dismissed manually)
  loading: (message: string) => {
    return toast.loading(message, {
      position: "top-right",
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
    });
  },

  // Update loading toast to success
  updateToSuccess: (toastId: string | number, message: string) => {
    toast.update(toastId, {
      render: message,
      type: "success",
      isLoading: false,
      autoClose: 3000,
    });
  },

  // Update loading toast to error
  updateToError: (toastId: string | number, message: string) => {
    toast.update(toastId, {
      render: message,
      type: "error",
      isLoading: false,
      autoClose: 5000,
    });
  },
}; 