import { type ExternalToast, toast as sonnerToast } from "sonner";

type ToastMessage = string;

const defaultOptions: ExternalToast = {
  duration: 5000,
};

export const toast = {
  success(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.success(message, { ...defaultOptions, ...options });
  },

  error(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.error(message, { ...defaultOptions, ...options });
  },

  warning(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.warning(message, { ...defaultOptions, ...options });
  },

  info(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.info(message, { ...defaultOptions, ...options });
  },

  message(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.message(message, { ...defaultOptions, ...options });
  },

  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  loading: sonnerToast.loading,
};
