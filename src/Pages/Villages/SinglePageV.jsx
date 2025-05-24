import { useEffect, useState } from "react";
import SinglePageCompo from "@/components/SinglePageCompo";
import { useParams } from "react-router-dom";
import Loading from"@/components/Loading";
import { Outlet } from "react-router-dom";
export default function SomePage() {
  const { id } = useParams();
  const [villageData, setVillageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");


  useEffect(() => {
    async function fetchVillage() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Missing auth token");
        }

        const res = await fetch(`https://bcknd.sea-go.org/admin/village/item/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();

        const transformedData = {
          name: json.village.name,
          image: json.village.image_link || "",
          location: json.village.location,
          description: json.village.description,
          units: `${json.village.units_count} Units`,
          population: json.village.population_count||"zero",
          zone: json.village.zone?.name || "—",
        };
        setStatus(json.village.status === 1 ? "Active" : "Inactive");

        console.log(transformedData);

        console.log("Full response:", json);

        setVillageData(transformedData);
      } catch (err) {
        console.error("Error fetching village data:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVillage();
  }, [id]);

  if (loading) return <Loading/>;
  if (!villageData) return <p className="text-center text-red-500">Failed to load village data.</p>;

  return(
    <>
      <SinglePageCompo data={villageData} status={status}  entityType="village" />
      <Outlet/>
    </>
  )
}