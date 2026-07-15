import axios from "axios";
import { toast } from "react-toastify";

export function formatDateTimeForInput(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
}

export function formatDateForBackend(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  } catch {
    return "";
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

export async function deleteCode(apiUrl, token, code, userId, t) {
  try {
    const res = await axios.post(`${apiUrl}/appartment/delete_code`, { code, user_id: userId }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      }
    });
    toast.success(t ? t("CodeDeletedSuccessfully") : "Code deleted successfully");
    return true;
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to delete code");
    return false;
  }
}

export async function deleteRent(apiUrl, token, id, t) {
  try {
    await axios.post(`${apiUrl}/appartment/delete_code/${id}`, null, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      }
    });
    toast.success(t ? t("RenterDeletedSuccessfully") : "Renter deleted successfully");
    return true;
  } catch (err) {
    try {
      await axios.delete(`${apiUrl}/appartment/delete_code/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      });
      toast.success(t ? t("RenterDeletedSuccessfully") : "Renter deleted successfully");
      return true;
    } catch (err2) {
      toast.error(err2.response?.data?.message || "Failed to delete renter");
      return false;
    }
  }
}

export function groupRentsByOwner(rents) {
  if (!Array.isArray(rents)) return [];
  const groups = {};
  rents.forEach((rent) => {
    const ownerId = rent.user_id || rent.user?.id || "unknown";
    const key = `${ownerId}_${rent.from}_${rent.to}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        owner: rent.user || { name: rent.owner_name || "Unknown Owner" },
        from: rent.from,
        to: rent.to,
        people: rent.people || 0,
        codes: [],
      };
    }
    groups[key].codes.push(rent);
  });
  return Object.values(groups);
}

export function getRentStatus(from, to) {
  const now = new Date();
  const startDate = new Date(from);
  const endDate = new Date(to);

  if (now < startDate) return "upcoming";
  if (now > endDate) return "past";
  return "current";
}
