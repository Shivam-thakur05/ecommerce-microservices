import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { useCartStore } from "../store/cartStore.ts";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import { Card, CardBody } from "../components/ui/Card.tsx";

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const tax = total * 0.08;
  const shipping = total > 50 ? 0 : 5.99;
  const finalTotal = total + tax + shipping;

  const handlePlaceOrder = () => {
    // TODO: Implement order placement
    console.log("Placing order...");
    clearCart();
    setStep(3);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some items to your cart before checkout.
            </p>
            <Button onClick={() => navigate("/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody>
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= 1
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
                    </div>
                    <span
                      className={`ml-2 ${step >= 1 ? "text-primary-600" : "text-gray-500"}`}
                    >
                      Shipping
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= 2
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
                    </div>
                    <span
                      className={`ml-2 ${step >= 2 ? "text-primary-600" : "text-gray-500"}`}
                    >
                      Payment
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= 3
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      3
                    </div>
                    <span
                      className={`ml-2 ${step >= 3 ? "text-primary-600" : "text-gray-500"}`}
                    >
                      Confirmation
                    </span>
                  </div>
                </div>

                {/* Step 1: Shipping Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Shipping Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        placeholder="Enter your first name"
                        required
                      />
                      <Input
                        label="Last Name"
                        placeholder="Enter your last name"
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        required
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Address Line 1"
                          placeholder="Enter your address"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Address Line 2"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>
                      <Input
                        label="City"
                        placeholder="Enter your city"
                        required
                      />
                      <Input
                        label="State"
                        placeholder="Enter your state"
                        required
                      />
                      <Input
                        label="ZIP Code"
                        placeholder="Enter ZIP code"
                        required
                      />
                      <Input
                        label="Country"
                        placeholder="Enter your country"
                        required
                      />
                    </div>
                    <div className="mt-6">
                      <Button
                        onClick={() => setStep(2)}
                        className="w-full"
                        size="lg"
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment Information */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Payment Method
                    </h2>

                    {/* Payment Method Selection */}
                    <div className="space-y-4 mb-6">
                      <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                        <span className="font-medium">Credit Card</span>
                      </label>

                      <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <div className="w-5 h-5 mr-3 bg-blue-600 rounded"></div>
                        <span className="font-medium">PayPal</span>
                      </label>
                    </div>

                    {/* Credit Card Form */}
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <Input
                          label="Card Number"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Expiry Date"
                            placeholder="MM/YY"
                            required
                          />
                          <Input label="CVV" placeholder="123" required />
                        </div>
                        <Input
                          label="Name on Card"
                          placeholder="Enter cardholder name"
                          required
                        />
                      </div>
                    )}

                    <div className="mt-6 space-y-3">
                      <Button
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="w-full"
                      >
                        Back to Shipping
                      </Button>
                      <Button
                        onClick={handlePlaceOrder}
                        className="w-full"
                        size="lg"
                        leftIcon={<Lock className="w-5 h-5" />}
                      >
                        Place Order
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Order Confirmation */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Order Confirmed!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Thank you for your purchase. Your order has been
                      successfully placed.
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate("/orders")}
                        className="w-full"
                      >
                        View Orders
                      </Button>
                      <Button
                        onClick={() => navigate("/")}
                        variant="outline"
                        className="w-full"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardBody>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId || "default"}`}
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
                        <h3 className="font-medium text-gray-900">
                          {item.product?.name}
                        </h3>
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            {item.variant.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          $
                          {(
                            (item.variant?.price || item.product?.price || 0) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Secure Checkout
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Your payment information is encrypted and secure.
                      </p>
                    </div>
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

export default Checkout;
