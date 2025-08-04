import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Download,
  ArrowLeft,
  Star,
} from "lucide-react";
import apiService from "../services/api.ts";
import { Order, OrderStatus } from "../types";
import Button from "../components/ui/Button.tsx";
import { Card, CardBody, CardHeader } from "../components/ui/Card.tsx";

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery(["order", id], () => apiService.getOrderById(id!), {
    enabled: !!id,
  });

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "confirmed":
      case "processing":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
      case "refunded":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
              <div className="bg-gray-200 h-48 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Order not found
            </h2>
            <p className="text-gray-600 mb-8">
              The order you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/orders")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
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
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Items
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <img
                        src={
                          item.product?.images[0]?.url ||
                          "/placeholder-product.jpg"
                        }
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.product?.name}
                        </h3>
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            {item.variant.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-medium text-gray-900">
                            ${item.totalPrice.toFixed(2)}
                          </span>
                          {order.status === "delivered" && (
                            <Button size="sm" variant="outline">
                              <Star className="w-4 h-4 mr-2" />
                              Write Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Timeline
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Order Placed
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  {order.status !== "pending" && (
                    <div className="flex items-start space-x-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Order Confirmed
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.updatedAt
                            ? formatDate(order.updatedAt)
                            : "Processing..."}
                        </p>
                      </div>
                    </div>
                  )}
                  {["shipped", "delivered"].includes(order.status) && (
                    <div className="flex items-start space-x-4">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Order Shipped
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.shippedAt
                            ? formatDate(order.shippedAt)
                            : "In transit..."}
                        </p>
                      </div>
                    </div>
                  )}
                  {order.status === "delivered" && (
                    <div className="flex items-start space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Order Delivered
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.deliveredAt
                            ? formatDate(order.deliveredAt)
                            : "Delivered"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Summary
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {order.shippingCost === 0
                        ? "Free"
                        : `$${order.shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Shipping Address
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.addressLine1}
                      </p>
                      {order.shippingAddress.addressLine2 && (
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.addressLine2}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.country}
                      </p>
                    </div>
                  </div>
                  {order.shippingAddress.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        {order.shippingAddress.phone}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                  {order.status === "pending" && (
                    <Button variant="outline" className="w-full">
                      Cancel Order
                    </Button>
                  )}
                  {order.status === "shipped" && (
                    <Button className="w-full">Track Package</Button>
                  )}
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
