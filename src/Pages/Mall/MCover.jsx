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
  // State for immediate preview of the selected profile image
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // Fetching cover image
      // Note: The endpoint name `/admin/update_profile_image/${id}` suggests profile,
      // but you're setting `coverImage` with it. Double-check backend naming for clarity.
      const coverRes = await fetch(
        `https://bcknd.sea-go.org/admin/update_profile_image/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const coverData = await coverRes.json();
      setCoverImage(coverData.mall.cover_image_link);

      // Fetching profile image
      const profileRes = await fetch(
        `https://bcknd.sea-go.org/admin/mall/item/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const profileData = await profileRes.json();
      setProfileImage(profileData.mall.image_link);
      // Initialize profileImagePreview with the current profile image
      setProfileImagePreview(profileData.mall.image_link);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load images.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    // This function is for the cover image upload
    if (!imageFile) {
      toast.error("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("cover_image", imageFile);

    setLoading(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/update_profile_image/add/${id}`, // Endpoint for cover image upload
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
        toast.success(data.success || "Cover image uploaded successfully!");
        setOpenAddDialog(false);
        setImageFile(null); // Clear the file input
        fetchImages(); // Re-fetch images to update the UI
      } else {
        toast.error(data.message || "Failed to upload cover image.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred while uploading cover image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    // This function is for deleting the cover image
    setLoading(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/update_profile_image/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.success || "Cover image deleted successfully!");
        setCoverImage(""); // Clear the cover image from state
      } else {
        toast.error(data.message || "Failed to delete cover image.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting cover image.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      // Create a URL for immediate preview
      setProfileImagePreview(URL.createObjectURL(file));
    } else {
      setProfileImageFile(null);
      // If no file is selected, revert to the original profile image or a placeholder
      setProfileImagePreview(profileImage); // Revert to the fetched profile image
    }
  };

  const handleUpdateProfileImage = async () => {
    // This function is for updating the profile image
    if (!profileImageFile) {
      toast.error("Please select a new profile image to update.");
      return;
    }

    const formData = new FormData();
    formData.append("image", profileImageFile); // Ensure backend expects 'image' key for profile

    setLoading(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/mall/update_profile_image/${id}`, // Endpoint for profile image update
        {
          method: "POST", // Use POST for FormData with file uploads
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type for FormData, browser sets it automatically with boundary
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.success || "Profile image updated successfully!");
        setOpenEditProfileDialog(false);
        setProfileImageFile(null); // Clear the file input state
        // Revoke the object URL to free up memory
        if (profileImagePreview && profileImagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(profileImagePreview);
        }
        fetchImages(); // Re-fetch images to update the UI with the new image
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
  }, [id, token]); // Add token to dependency array if it can change

  // Cleanup for object URLs
  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {loading && <Loading />}

      <div className="relative !my-10 w-full h-64">
        {/* Cover Image */}
        <img
          src={coverImage || "https://via.placeholder.com/1200x400?text=No+Cover+Image"}
          alt="Cover"
          className="w-full h-full object-cover"
        />

        {coverImage && (
          <button
            onClick={handleDeleteImage}
            className="absolute cursor-pointer top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center bg-gray-800 text-white hover:bg-bg-primary transition-all"
            title="Delete Cover Image"
          >
            <X size={20} />
          </button>
        )}

        {/* Profile Picture with Edit Button */}
        <div className="absolute bottom-2 left-4 ">
          <img
            src={profileImage || "https://via.placeholder.com/150?text=No+Profile+Image"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />

          <button
            onClick={() => {
              setOpenEditProfileDialog(true);
              // When opening the edit dialog, set preview to current profile image
              setProfileImagePreview(profileImage);
              setProfileImageFile(null); // Reset file input state
            }}
            className="absolute -top-1 right-0 bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-bg-primary transition-all shadow-md"
            title="Edit Profile Image"
          >
            <Pencil size={16} />
          </button>
        </div>

        {/* Add Cover Image Button */}
        <div className="absolute top-2 left-2 z-10">
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-bg-primary text-white cursor-pointer px-5 py-2 rounded-[16px] hover:bg-teal-500 transition-all"
              >
                Add Cover Image
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white p-6 border-none rounded-lg shadow-lg max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-bg-primary">
                  Add New Cover Image
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full mb-3 cursor-pointer text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bg-primary file:text-white hover:file:bg-teal-600"
                />
              </div>
              <DialogFooter className="pt-6 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setOpenAddDialog(false);
                    setImageFile(null); // Clear file state on cancel
                  }}
                  variant="outline"
                  className="border px-3 py-2 cursor-pointer border-teal-500 hover:bg-bg-primary hover:text-white transition-all text-bg-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImageUpload}
                  className="bg-bg-primary border border-teal-500 hover:bg-white hover:text-bg-primary transition-all px-3 py-2 cursor-pointer text-white"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Image Edit Dialog */}
        <Dialog open={openEditProfileDialog} onOpenChange={setOpenEditProfileDialog}>
          <DialogContent className="bg-white p-6 border-none rounded-lg shadow-lg max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-bg-primary">
                Edit Profile Image
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {profileImagePreview && (
                <div className="flex justify-center mb-4">
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageFileChange}
                className="w-full mb-3 cursor-pointer text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bg-primary file:text-white hover:file:bg-teal-600"
              />
            </div>
            <DialogFooter className="pt-6 flex justify-end gap-2">
              <Button
                onClick={() => {
                  setOpenEditProfileDialog(false);
                  setProfileImageFile(null); // Clear file state on cancel
                  // Revoke object URL if it was created
                  if (profileImagePreview && profileImagePreview.startsWith("blob:")) {
                    URL.revokeObjectURL(profileImagePreview);
                  }
                }}
                variant="outline"
                className="border px-3 py-2 cursor-pointer border-teal-500 hover:bg-bg-primary hover:text-white transition-all text-bg-primary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfileImage}
                className="bg-bg-primary border border-teal-500 hover:bg-white hover:text-bg-primary transition-all px-3 py-2 cursor-pointer text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CoverPage;