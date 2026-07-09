import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bell, Send, AlertCircle, CheckCircle, Check, ChevronsUpDown } from "lucide-react";
import Loading from "@/components/Loading";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Notification() {
  const [message, setMessage] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Missing auth token");
      }

      const res = await fetch("https://bcknd.sea-go.org/admin/push_notification/lists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("Villages from notification API:", json);
      setVillages(json.villages || []);
    } catch (err) {
      console.error("Error fetching villages:", err.message);
      showNotification("error", "Failed to load villages");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  const handleSendNotification = async () => {
    if (!message.trim()) {
      showNotification("error", "Please enter a message");
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Missing auth token");
      }

      const body = { message: message.trim() };
      
      // إذا لم يكن "all"، أضف village_id
      if (selectedVillage !== "all") {
        body.village_id = parseInt(selectedVillage);
      }

      console.log("Sending notification:", body);

      const res = await fetch("https://bcknd.sea-go.org/admin/push_notification", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("Response:", json);

      showNotification("success", "Notification sent successfully!");
      setMessage("");
      setSelectedVillage("all");
    } catch (err) {
      console.error("Error sending notification:", err.message);
      showNotification("error", "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen !p-8 flex items-center justify-center">
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 !mb-6">
          <Bell className="w-8 h-8 text-bg-primary" />
          <h1 className="text-3xl font-bold text-bg-primary">Push Notification</h1>
        </div>

        <Card className="!p-8 bg-[#f3fbfa] shadow-lg border-none">
          <CardContent className="space-y-6 !p-6">
            {/* Village Selector with Search */}
            <div className="space-y-2">
              <Label className="text-base font-semibold text-bg-primary">
                Select Village
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between border-gray-300 hover:border-bg-primary h-11 text-left font-normal"
                  >
                    {selectedVillage === "all"
                      ? "All Villages"
                      : villages.find((village) => village.id.toString() === selectedVillage)?.name ||
                        "Select a village"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[550px] p-0" 
                  align="start" 
                  side="bottom" 
                  sideOffset={5}
                  avoidCollisions={false}
                  sticky="always"
                >
                  <Command>
                    <CommandInput placeholder="Search village..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No village found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedVillage("all");
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVillage === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Villages
                        </CommandItem>
                        {villages.map((village) => (
                          <CommandItem
                            key={village.id}
                            value={village.name}
                            onSelect={() => {
                              setSelectedVillage(village.id.toString());
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedVillage === village.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {village.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedVillage === "all" && (
                <p className="text-sm text-gray-500 italic">
                  Notification will be sent to all users
                </p>
              )}
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-base font-semibold text-bg-primary">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Enter your notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px] resize-none border-gray-300 focus:border-bg-primary focus:ring-bg-primary"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {message.length} characters
                </p>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendNotification}
              disabled={sending || !message.trim()}
              className="w-full bg-bg-primary hover:bg-teal-700 text-white py-6 text-base font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
