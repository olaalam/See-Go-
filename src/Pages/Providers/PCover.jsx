import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Pencil } from "lucide-react";
import Loading from "@/components/Loading";

const CoverPage = () => {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [coverImage, setCoverImage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openEditProfileDialog, setOpenEditProfileDialog] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const coverRes = await fetch(
        `https://bcknd.sea-go.org/admin/provider_cover/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const coverData = await coverRes.json();
      setCoverImage(coverData.provider.cover_image_link);

      const profileRes = await fetch(
        `https://bcknd.sea-go.org/admin/provider/item/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const profileData = await profileRes.json();
      setProfileImage(profileData.provider.image_link);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load images.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("cover_image", imageFile);

    setLoading(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_cover/add/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.success || "Image uploaded successfully!");
        setOpenAddDialog(false);
        fetchImages();
      } else {
        toast.error(data.message || "Failed to upload image.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred while uploading.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_cover/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.success || "Image deleted successfully!");
        setCoverImage("");
      } else {
        toast.error(data.message || "Failed to delete image.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting.");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateProfileImage = async () => {
    if (!profileImageFile) {
      toast.error("Please select a new profile image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", profileImageFile);

    setLoading(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/update_profile_image/${id}`, 
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.success || "Profile image updated successfully!");
        setOpenEditProfileDialog(false);
        fetchImages(); 
      } else {
        toast.error(data.message || "Failed to update profile image.");
      }
    } catch (error) {
      console.error("Profile image update error:", error);
      toast.error("An error occurred while updating profile image.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [id]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {loading && <Loading />}

      <div className="relative !my-10 w-full h-64">
        <img
          src={coverImage || "https://via.placeholder.com/1200x400"}
          alt="Cover"
          className="w-full h-full object-cover"
        />

        {coverImage && (
          <button
            onClick={handleDeleteImage}
            className="absolute cursor-pointer top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center bg-gray-800 text-white hover:bg-bg-primary"
            title="Delete Cover Image"
          >
            <X size={20} />
          </button>
        )}

        {/* Profile Picture مع زر التعديل */}
        <div className="absolute bottom-2 left-4 ">
        {/* Profile Picture */}
          <img
            src={profileImage || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white"
          />
        
          <button
            onClick={() => setOpenEditProfileDialog(true)}
            className="absolute top-0 right-2 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-bg-primary transition-all"
            title="Edit Profile Image"
          >
            <Pencil size={16} /> {/* استخدام أيقونة Pencil */}
          </button>
        </div>

        {/* Add Button */}
        <div className="flex justify-end space-x-2 !p-4 !m-5">
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button
                className="absolute top-2 left-2 z-10 bg-bg-primary text-white cursor-pointer !px-5 !py-2 rounded-[16px] hover:bg-teal-500 transition-all"
              >
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white !p-6 border-none rounded-lg shadow-lg max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-bg-primary">
                  Add New Image
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full !mb-3 cursor-pointer text-sm text-gray-500 file:!mr-4 file:!py-2 file:!px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bg-primary file:text-white hover:file:bg-teal-600"
                />
              </div>
              <DialogFooter className="pt-6">
                <Button
                  onClick={() => setOpenAddDialog(false)}
                  variant="outline"
                  className="border !px-3 !py-2 cursor-pointer border-teal-500 hover:bg-bg-primary hover:text-white transition-all text-bg-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImageUpload}
                  className="bg-bg-primary border border-teal-500 hover:bg-white hover:text-bg-primary transition-all !px-3 !py-2 cursor-pointer text-white"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* مربع حوار تعديل صورة البروفايل */}
          <Dialog open={openEditProfileDialog} onOpenChange={setOpenEditProfileDialog}>
            <DialogTrigger asChild>
              {/* هذا الزر غير مرئي */}
            </DialogTrigger>
            <DialogContent className="bg-white !p-6 border-none rounded-lg shadow-lg max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-bg-primary">
                  Edit Profile Image
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImageFile(e.target.files[0])}
                  className="w-full !mb-3 cursor-pointer text-sm text-gray-500 file:!mr-4 file:!py-2 file:!px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bg-primary file:text-white hover:file:bg-teal-600"
                />
              </div>
              <DialogFooter className="pt-6">
                <Button
                  onClick={() => setOpenEditProfileDialog(false)}
                  variant="outline"
                  className="border !px-3 !py-2 cursor-pointer border-teal-500 hover:bg-bg-primary hover:text-white transition-all text-bg-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfileImage}
                  className="bg-bg-primary border border-teal-500 hover:bg-white hover:text-bg-primary transition-all !px-3 !py-2 cursor-pointer text-white"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default CoverPage;