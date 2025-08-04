import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import apiService from "../services/api.ts";
import { Order, OrderStatus } from "../types";
import Button from "../components/ui/Button.tsx";
import { Card, CardBody } from "../components/ui/Card.tsx";

const Orders: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery(
    ["orders", selectedStatus],
    () =>
      apiService.getOrders({
        status: selectedStatus === "all" ? undefined : selectedStatus,
      }),
    {
      keepPreviousData: true,
    }
  );

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "confirmed":
      case "processing":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
      case "refunded":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "badge-warning";
      case "confirmed":
      case "processing":
        return "badge-primary";
      case "shipped":
        return "badge-secondary";
      case "delivered":
        return "badge-success";
      case "cancelled":
      case "refunded":
        return "badge-error";
      default:
        return "badge-secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error loading orders
            </h2>
            <p className="text-gray-600 mb-8">Please try again later.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const orderList = orders?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">
            Track your orders and view order history
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === "all"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === "pending"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus("processing")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === "processing"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setSelectedStatus("shipped")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === "shipped"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Shipped
            </button>
            <button
              onClick={() => setSelectedStatus("delivered")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === "delivered"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orderList.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedStatus === "all"
                    ? "You haven't placed any orders yet."
                    : `No ${selectedStatus} orders found.`}
                </p>
                <Link to="/products">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {orderList.map((order: Order, index: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardBody>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Order #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span
                              className={`badge ${getStatusColor(order.status)}`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 mb-4">
                          {order.items.slice(0, 3).map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="flex items-center space-x-3"
                            >
                              <img
                                src={
                                  item.product?.images[0]?.url ||
                                  "/placeholder-product.jpg"
                                }
                                alt={item.product?.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {item.product?.name}
                                </h4>
                                {item.variant && (
                                  <p className="text-sm text-gray-600">
                                    {item.variant.name}
                                  </p>
                                )}
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity} × $
                                  {item.unitPrice.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  ${item.totalPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>

                        {/* Order Summary */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-600">
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "items"}
                            </span>
                            <span className="text-gray-600">
                              Total: ${order.total.toFixed(2)}
                            </span>
                          </div>
                          {order.estimatedDelivery && (
                            <span className="text-gray-600">
                              Est. Delivery:{" "}
                              {formatDate(order.estimatedDelivery)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6">
                        <Link to={`/order/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Invoice
                        </Button>
                        {order.status === "delivered" && (
                          <Button size="sm" className="w-full">
                            Write Review
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {orders && orders.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(orders.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === 1
                          ? "bg-primary-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
