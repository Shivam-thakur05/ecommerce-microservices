import React, { useState } from "react";
import { useQuery } from "react-query";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Shield,
  Bell,
  Settings,
} from "lucide-react";
import { useAuthStore } from "../store/authStore.ts";
import apiService from "../services/api.ts";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import { Card, CardBody, CardHeader } from "../components/ui/Card.tsx";

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const { data: userProfile, isLoading } = useQuery(
    "userProfile",
    () => apiService.getCurrentUser(),
    {
      enabled: !!user,
    }
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        leftIcon={<Save className="w-4 h-4" />}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        leftIcon={<X className="w-4 h-4" />}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    disabled={!isEditing}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    disabled={!isEditing}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    disabled={!isEditing}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>

                {/* Account Status */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          user?.emailVerified ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-600">
                        Email{" "}
                        {user?.emailVerified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">
                        Account{" "}
                        {user?.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Addresses */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Addresses
                </h2>
              </CardHeader>
              <CardBody>
                {user?.addresses && user.addresses.length > 0 ? (
                  <div className="space-y-4">
                    {user.addresses.map((address, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {address.firstName} {address.lastName}
                              </span>
                              <span className="badge badge-primary">
                                {address.type}
                              </span>
                              {address.isDefault && (
                                <span className="badge badge-success">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.addressLine1}
                              {address.addressLine2 && <br />}
                              {address.addressLine2}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state}{" "}
                              {address.postalCode}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.country}
                            </p>
                            {address.phone && (
                              <p className="text-sm text-gray-600 mt-1">
                                Phone: {address.phone}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No addresses
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add your shipping and billing addresses
                    </p>
                    <Button>Add Address</Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Account Summary */}
            <Card className="mb-6">
              <CardBody>
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                  <div className="text-sm text-gray-500">
                    Member since{" "}
                    {new Date(user?.createdAt || "").toLocaleDateString()}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-3" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-3" />
                    Notification Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-3" />
                    Account Settings
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Stats
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wishlist Items</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews Given</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reward Points</span>
                    <span className="font-medium">1,250</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
