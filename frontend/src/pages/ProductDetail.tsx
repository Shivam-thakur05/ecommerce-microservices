import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { motion } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  ArrowLeft,
  Minus,
  Plus,
} from "lucide-react";
import apiService from "../services/api.ts";
import { Product, ProductVariant } from "../types";
import Button from "../components/ui/Button.tsx";
import { Card, CardBody } from "../components/ui/Card.tsx";
import { useCartStore } from "../store/cartStore.ts";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery(["product", id], () => apiService.getProductById(id!), {
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, selectedVariant || undefined);
      // You could show a toast notification here
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                <div className="bg-gray-200 h-6 rounded w-1/4"></div>
                <div className="bg-gray-200 h-32 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Product not found
            </h2>
            <p className="text-gray-600 mb-8">
              The product you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price || product.price;
  const originalPrice = selectedVariant?.comparePrice || product.comparePrice;
  const discount =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button
                onClick={() => navigate("/")}
                className="hover:text-primary-600"
              >
                Home
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate("/products")}
                className="hover:text-primary-600"
              >
                Products
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative">
                <img
                  src={
                    product.images[selectedImage]?.url ||
                    "/placeholder-product.jpg"
                  }
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
                {discount > 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-error-600 text-white text-sm px-3 py-1 rounded-full">
                      {discount}% OFF
                    </span>
                  </div>
                )}
                <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex space-x-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index
                          ? "border-primary-600"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 mb-4">{product.shortDescription}</p>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.averageRating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  ({product.totalRatings || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ${currentPrice.toFixed(2)}
                </span>
                {originalPrice && originalPrice > currentPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Variants
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedVariant?.id === variant.id
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <div className="font-medium">{variant.name}</div>
                      <div className="text-sm text-gray-600">
                        ${variant.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quantity
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock} in stock
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full"
                leftIcon={<ShoppingCart className="w-5 h-5" />}
              >
                Add to Cart
              </Button>

              <Button variant="outline" size="lg" className="w-full">
                Buy Now
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Free Shipping</div>
                  <div className="text-sm text-gray-500">
                    On orders over $50
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Fast Delivery</div>
                  <div className="text-sm text-gray-500">2-3 business days</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Secure Payment
                  </div>
                  <div className="text-sm text-gray-500">
                    100% secure checkout
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Details */}
        <div className="mt-12">
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Product Details
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
