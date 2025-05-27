"use client";
import { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "@/components/Loading";
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
    units_count: 0,
    maintenance_request_count: 0,
    problem_report_count: 0,
    rents_count: 0,
    users_beach: 0,
    users_pool: 0,
    visits_village: 0,
  });

  return (
    <div className="!p-4">
      {/* <FullPageLoader/> */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Units Number */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaHome className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.units_count}</div>
            <div className="">Number Of Village</div>
          </div>
        </div>

        {/* Today’s Visits */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaUsers className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.visits_village}</div>
            <div className="">Number Of Users</div>
          </div>
        </div>

        {/* Main Request Problem */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaUserCheck className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">
              {homeStats.problem_report_count}
            </div>
            <div className="">Number Of Subscribers</div>
          </div>
        </div>

        {/* Rents Count */}
        <div className="bg-[#F2FAFA] relative top-18 right-[6%]  text-bg-primary !p-4 h-full items-center justify-center rotate-90 w-full rounded-2xl flex-col shadow flex  border-r-4 border-bg-primary">
          <div className="flex flex-col items-center justify-center rotate-[-90deg]">
            <FaBuilding className="text-6xl text-[#0E7490] mb-2" />
            <div className="text-4xl font-bold text-[#0E7490]">
              {homeStats.rents_count}
            </div>
            <div className="text-lg text-[#0E7490]">Number Of Units</div>
          </div>
        </div>

        {/* Beach Entries */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaMoneyBillWave className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.users_beach}</div>
            <div className="">Pending Payments</div>
          </div>
        </div>

        {/* Pool Entries */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaTools className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">{homeStats.users_pool}</div>
            <div className="">Service Providers</div>
          </div>
        </div>

        {/* Units for Rent */}
        <div className="bg-[#F2FAFA] text-bg-primary !p-2 rounded-2xl shadow flex items-start border-r-4 border-bg-primary">
          <div className="!p-4 flex items-center justify-center">
            <FaWrench className="text-6xl text-[#0E7490]" />
          </div>
          <div className="!p-2">
            <div className="text-3xl font-bold">
              {homeStats.maintenance_request_count}
            </div>
            <div className="">Maintenance Providers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
