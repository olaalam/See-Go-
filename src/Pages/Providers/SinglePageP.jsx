import { useEffect, useState } from "react";
import SinglePageCompo from "@/components/SinglePageCompo";
import { useParams, Outlet } from "react-router-dom";
import Loading from "@/components/Loading";

export default function SomePage() {
  const { id } = useParams();
  const [providerData, setProviderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [adminColumns] = useState([
    { label: "Provider Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Role", key: "role" },
  ]);

  useEffect(() => {
    async function fetchProvider() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token");

        const res = await fetch(
          `https://bcknd.sea-go.org/admin/provider/item/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();

        const transformedData = {
          name: json.provider.name,
          image: json.provider.image_link || "",
          location: json.provider.location,
          description: json.provider.description,
          phone: json.provider.phone,
          open_from: json.provider.open_from,
          open_to: json.provider.open_to,
          population: json.provider.population_count || "zero",
          village: json.provider.village?.name || "—",
        };

        setStatus(json.provider.status === 1 ? "Active" : "Inactive");
        setProviderData(transformedData);
      } catch (err) {
        console.error("Error fetching provider data:", err.message);
        setError("Failed to load provider data.");
      } finally {
        setLoading(false);
      }
    }

    fetchProvider();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <p className="text-center text-red-500 mt-4">{error}</p>;

  if (!providerData)
    return (
      <p className="text-center text-red-500 mt-4">No provider data found.</p>
    );

  return (
    <>
      <SinglePageCompo
        data={providerData}
        status={status}
        adminColumns={adminColumns}
      />
      <Outlet />
    </>
  );
}
