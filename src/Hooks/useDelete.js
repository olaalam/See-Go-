import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export function useDelete() {
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const deleteData = async (url, successMessage) => {
    setLoadingDelete(true);
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (err) {
      setError(err);
      toast.error(err.response?.data?.message || "Failed to delete");
      return false;
    } finally {
      setLoadingDelete(false);
      setIsDeleting(false);
    }
  };

  return { deleteData, loadingDelete, isDeleting, error };
}
