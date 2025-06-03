"use client";
import { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "@/components/Loading"; // Assuming this component exists and works
import {
  FaUsers,
  FaMoneyBillWave,
  FaTools,
  FaWrench,
  FaHome,
  FaBuilding,
  FaUserCheck,
} from "react-icons/fa";
import { MdReportProblem } from "react-icons/md";

const Home = () => {
  const [homeStats, setHomeStats] = useState({
    villages: 0,
    users: 0,
    subscriper: 0,
    units: 0,
    pending_payment: 0,
    service_providers: 0,
    maintenance_providers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeStats = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authorization token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/home", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json(); // Renamed to avoid confusion with data.data

        // MOST LIKELY FIX: Check if the main responseData object is the stats
        // If the API returns { "villages": ..., "users": ... } directly:
        if (responseData && typeof responseData === 'object' && 'villages' in responseData) {
            setHomeStats(prevStats => ({
                ...prevStats,
                ...responseData // Use responseData directly
            }));
        }
        // If the API returns { "data": { "villages": ..., "users": ... } }:
        else if (responseData && responseData.data && typeof responseData.data === 'object' && 'villages' in responseData.data) {
            setHomeStats(prevStats => ({
                ...prevStats,
                ...responseData.data // Use responseData.data
            }));
        }
        else {
            console.warn("API response did not contain expected stats structure:", responseData);
            setError("Received unexpected data format from the server. Check console for details.");
        }

      } catch (err) {
        console.error("Failed to fetch home stats:", err);
        setError(err.message || "Failed to load data. Please check your network.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeStats();
  }, []);

  // ... (rest of your component rendering logic for loading, error, and actual dashboard) ...
  if (loading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div className="!p-4 text-center text-red-600 font-bold">
        Error: {error}
        <p>Please try again later or check your network connection.</p>
      </div>
    );
  }

  return (
    <div className="!p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Number Of Village */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaHome className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.villages}</div>
            <div className="">Number Of Village</div>
          </div>
        </div>

        {/* Number Of Users */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaUsers className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.users}</div>
            <div className="">Number Of Users</div>
          </div>
        </div>

        {/* Number Of Subscribers */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaUserCheck className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">
              {homeStats.subscriper}
            </div>
            <div className="">Number Of Subscribers</div>
          </div>
        </div>

        {/* Number Of Units */}
        <div className="bg-[#F2FAFA] relative top-18 right-[6%] text-bg-primary !p-4 h-full items-center justify-center rotate-90 w-full rounded-2xl flex-col shadow flex border-r-4 border-bg-primary">
          <div className="flex flex-col items-center justify-center rotate-[-90deg]">
            <FaBuilding className="text-6xl text-[#0E7490] mb-2" />
            <div className="text-4xl font-bold text-[#0E7490]">
              {homeStats.units}
            </div>
            <div className="text-lg text-[#0E7490]">Number Of Units</div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaMoneyBillWave className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.pending_payment}</div>
            <div className="">Pending Payments</div>
          </div>
        </div>

        {/* Service Providers */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaTools className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.service_providers}</div>
            <div className="">Service Providers</div>
          </div>
        </div>

        {/* Maintenance Providers */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaWrench className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">
              {homeStats.maintenance_providers}
            </div>
            <div className="">Maintenance Providers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;