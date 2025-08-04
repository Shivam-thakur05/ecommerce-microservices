import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Heart,
  Package,
} from "lucide-react";
import { useCartStore } from "../store/cartStore.ts";
import Button from "../components/ui/Button.tsx";
import { Card, CardBody } from "../components/ui/Card.tsx";

const Cart: React.FC = () => {
  const {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const handleQuantityChange = (
    productId: string,
    variantId: string | undefined,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      removeItem(productId, variantId);
    } else {
      updateQuantity(productId, newQuantity, variantId);
    }
  };

  const handleAddToWishlist = (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log("Add to wishlist:", productId);
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/products">
              <Button size="lg">
                Start Shopping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody>
                <div className="space-y-6">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.productId}-${item.variantId || "default"}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={
                              item.product?.images[0]?.url ||
                              "/placeholder-product.jpg"
                            }
                            alt={item.product?.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.product?.name}
                              </h3>
                              {item.variant && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.variant.name}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                SKU: {item.product?.sku}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                $
                                {(
                                  (item.variant?.price ||
                                    item.product?.price ||
                                    0) * item.quantity
                                ).toFixed(2)}
                              </p>
                              {item.variant?.comparePrice &&
                                item.variant.comparePrice >
                                  item.variant.price && (
                                  <p className="text-sm text-gray-500 line-through">
                                    $
                                    {(
                                      item.variant.comparePrice * item.quantity
                                    ).toFixed(2)}
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.variantId,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.variantId,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleAddToWishlist(item.productId)
                                }
                                className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                title="Add to wishlist"
                              >
                                <Heart className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  removeItem(item.productId, item.variantId)
                                }
                                className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Cart Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="text-error-600 border-error-200 hover:bg-error-50"
                    >
                      Clear Cart
                    </Button>
                    <Link to="/products">
                      <Button variant="outline">
                        Continue Shopping
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
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

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal ({itemCount} items)
                    </span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      ${(total * 0.08).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${(total + total * 0.08).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link to="/checkout">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>

                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Package className="w-4 h-4 mr-2" />
                    Free shipping on orders over $50
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
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

export default Cart;
