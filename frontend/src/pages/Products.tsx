import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import apiService from "../services/api.ts";
import { Product, SearchFilters } from "../types";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import { Card, CardBody } from "../components/ui/Card.tsx";

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Get URL parameters
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const rating = searchParams.get("rating") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery<{
    items: Product[];
    totalPages: number;
    total: number;
  }>({
    queryKey: ["products", currentPage, filters, searchQuery, sortBy, sortOrder],
    queryFn: async (): Promise<{ items: Product[]; totalPages: number; total: number }> =>
      await apiService.getProducts(currentPage, 12, {
        ...filters,
        category: category || undefined,
        brand: brand || undefined,
        priceRange:
          minPrice || maxPrice
            ? {
                min: minPrice ? parseFloat(minPrice) : 0,
                max: maxPrice ? parseFloat(maxPrice) : 999999,
              }
            : undefined,
        rating: rating ? parseInt(rating) : undefined,
      }) as { items: Product[]; totalPages: number; total: number },
    placeholderData: () => ({ items: [], totalPages: 1, total: 0 }),
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiService.getCategories(),
  });
  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => apiService.getBrands(),
  });

  useEffect(() => {
    // Update URL when filters change
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (rating) params.set("rating", rating);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params);
  }, [
    searchQuery,
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    sortBy,
    sortOrder,
    currentPage,
    setSearchParams,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPage(1);
      // Update search query in URL
      const params = new URLSearchParams(searchParams);
      params.set("q", searchQuery.trim());
      setSearchParams(params);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchParams({});
    setFilters({});
    setSearchQuery("");
  };

  const products = productsData?.items || [];
  const totalPages = productsData?.totalPages || 1;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error loading products
            </h2>
            <p className="text-gray-600">Please try again later.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">
            Discover our amazing collection of products
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </form>
            </div>

            {/* View Mode and Filter Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    {(Array.isArray(categories) ? categories : []).map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={brand}
                    onChange={(e) =>
                      handleFilterChange("brand", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Brands</option>
                    {(Array.isArray(brands) ? brands : []).map((brandItem: any) => (
                      <option key={brandItem.id} value={brandItem.id}>
                        {brandItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) =>
                      handleFilterChange("rating", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <div className="text-sm text-gray-500">
                  {productsData?.total || 0} products found
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {[...Array(12)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
            >
              {products.map((product: Product, index: number) => (
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
                        className={`w-full object-cover ${viewMode === "grid" ? "h-48" : "h-32"}`}
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
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.shortDescription}
                      </p>
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
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrent = page === currentPage;
                      const isNearCurrent = Math.abs(page - currentPage) <= 2;

                      if (
                        isCurrent ||
                        isNearCurrent ||
                        page === 1 ||
                        page === totalPages
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              isCurrent
                                ? "bg-primary-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
