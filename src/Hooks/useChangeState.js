import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export function useChangeState() {
  const [loadingChange, setLoadingChange] = useState(false);
  const [error, setError] = useState(null);

  const changeState = async (url, successMessage, body = null) => {
    setLoadingChange(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(url, body, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (successMessage) {
        toast.success(successMessage);
      }
      return res.data || true;
    } catch (err) {
      setError(err);
      toast.error(err.response?.data?.message || "Failed to update state");
      return null;
    } finally {
      setLoadingChange(false);
    }
  };

  return { changeState, loadingChange, error };
}
