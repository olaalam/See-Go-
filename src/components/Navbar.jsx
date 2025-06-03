import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";  // استيراد useLocation
import { Button } from "./ui/button";

export default function Navbar() {
  const userData = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();  // قراءة المسار الحالي
  const userName = userData?.admin?.name;
  const userInitials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
    : "AD";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="w-full h-16 flex items-center justify-between !p-6">
      {/* إخفاء زر السهم إذا كنا في الصفحة الرئيسية "/" */}
      {location.pathname !== "/" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-bg-primary hover:bg-gray-100 rounded-full"
          aria-label="Go Back"
        >
          <ArrowLeft className="h-5 w-5 font-bold" />
        </Button>
      )}

      {/* Left: Welcome text with Avatar */}
      <div className="flex items-center gap-2 text-teal-600 font-semibold text-lg">
        <Avatar className="w-9 h-9 bg-gray-300 text-white font-bold text-sm">
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        Hello {userName || "Admin"}
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-6 text-teal-600 font-semibold">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-bg-primary cursor-pointer flex items-center gap-2 hover:text-teal-700"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
