import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export function usePost({ url }) {
  const [response, setResponse] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [error, setError] = useState(null);

  const postData = async (body, successMessage) => {
    setLoadingPost(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(url, body, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      setResponse(res);
      if (successMessage) {
        toast.success(successMessage);
      }
      return res;
    } catch (err) {
      setError(err);
      toast.error(err.response?.data?.message || "Something went wrong");
      throw err;
    } finally {
      setLoadingPost(false);
    }
  };

  return { postData, loadingPost, response, error };
}
