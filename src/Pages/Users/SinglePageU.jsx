import { useEffect, useState } from "react";
import SinglePageCompo from "@/components/SinglePageCompo";
import { useParams } from "react-router-dom";
import Loading from"@/components/Loading";
import { Outlet } from "react-router-dom";
export default function SinglePageU() {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");


  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Missing auth token");
        }

        const res = await fetch(`https://bcknd.sea-go.org/admin/user/item/${id}`, {
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
          name: json.user.name,
          image: json.user.image_link || "",
          phone: json.user.phone,
          email: json.user.email,
          user_type: json.user.user_type,

        };
        setStatus(json.user.status === 1 ? "Active" : "Inactive");

        console.log(transformedData);

        console.log("Full response:", json);

        setUserData(transformedData);
      } catch (err) {
        console.error("Error fetching user data:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [id]);

  if (loading) return <Loading/>;
  if (!userData) return <p className="text-center text-red-500">Failed to load user data.</p>;

  return(
    <>
      <SinglePageCompo data={userData} status={status}  />
      <Outlet/>
    </>
  )
}