import React from "react";
import { Link } from "react-router-dom";
// import { useQuery } from "react-query";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Star, ShoppingCart, Heart } from "lucide-react";
import apiService from "../services/api.ts";
import { Product, Category } from "../types";
import Button from "../components/ui/Button.tsx";
import { Card, CardBody } from "../components/ui/Card.tsx";

const Home: React.FC = () => {
  // Fetch featured products
  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: () => apiService.getFeaturedProducts(8),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const heroStats = [
    { label: "Products", value: "10,000+" },
    { label: "Customers", value: "50,000+" },
    { label: "Countries", value: "100+" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Discover Amazing
                <span className="block text-yellow-300">Products</span>
              </h1>
              <p className="text-xl mb-8 text-primary-100">
                Shop the latest trends with our curated collection of
                high-quality products. Fast delivery, secure payments, and
                exceptional customer service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button
                    size="lg"
                    className="bg-white text-primary-600 hover:bg-gray-100"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-primary-600"
                  >
                    Browse Categories
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl transform rotate-6"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Start Shopping
                    </h3>
                    <p className="text-gray-600">
                      Join thousands of satisfied customers
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're
              looking for
            </p>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-32 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(Array.isArray(categories) ? categories : [])
                .slice(0, 8)
                .map((category: Category, index: number) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link to={`/category/${category.slug}`}>
                      <div className="group">
                        <div className="bg-gray-100 rounded-lg p-6 text-center group-hover:bg-primary-50 transition-colors">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-16 h-16 mx-auto mb-4 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                              <span className="text-2xl font-bold text-primary-600">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of the best products
            </p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(Array.isArray(featuredProducts) ? featuredProducts : [])
                .slice(0, 8)
                .map((product: Product, index: number) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="group hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={
                            product.images[0]?.url || "/placeholder-product.jpg"
                          }
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-2 right-2">
                          <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                            <Heart className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        {product.comparePrice &&
                          product.comparePrice > product.price && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-error-600 text-white text-xs px-2 py-1 rounded">
                                {Math.round(
                                  ((product.comparePrice - product.price) /
                                    product.comparePrice) *
                                    100
                                )}
                                % OFF
                              </span>
                            </div>
                          )}
                      </div>
                      <CardBody>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.averageRating || 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 ml-2">
                            ({product.totalRatings || 0})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.comparePrice &&
                              product.comparePrice > product.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${product.comparePrice.toFixed(2)}
                                </span>
                              )}
                          </div>
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg">
                View All Products
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of satisfied customers and discover amazing products
            today.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
