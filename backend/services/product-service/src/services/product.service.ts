import { createLogger } from "../../../shared/common/utils/logger";
import { ProductRepository } from "../models/product.repository";
import {
  Product,
  ProductImage,
  ProductVariant,
  ProductAttribute,
  ProductDimensions,
  ProductRating,
  SEOData,
  SearchFilters,
  SearchResult,
} from "../../../shared/common/types";
import {
  NotFoundError,
  ValidationError,
  InsufficientStockError,
} from "../../../shared/common/errors";

const logger = createLogger("ProductService");

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  // Create new product
  async createProduct(productData: {
    name: string;
    description: string;
    shortDescription: string;
    sku: string;
    price: number;
    comparePrice?: number;
    costPrice: number;
    categoryId: string;
    brandId?: string;
    stock: number;
    minStockLevel: number;
    maxStockLevel: number;
    images: ProductImage[];
    variants: ProductVariant[];
    attributes: ProductAttribute[];
    tags: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    weight: number;
    dimensions?: ProductDimensions;
    seo?: SEOData;
  }): Promise<Product> {
    try {
      // Validate product data
      this.validateProductData(productData);

      // Check if SKU already exists
      const existingProduct = await this.productRepository.getProductBySku(
        productData.sku
      );
      if (existingProduct) {
        throw new ValidationError("Product with this SKU already exists");
      }

      // Create product with default values
      const newProduct = await this.productRepository.createProduct({
        name: productData.name,
        description: productData.description,
        shortDescription: productData.shortDescription,
        sku: productData.sku,
        price: productData.price,
        comparePrice: productData.comparePrice,
        costPrice: productData.costPrice,
        categoryId: productData.categoryId,
        brandId: productData.brandId,
        stock: productData.stock,
        minStockLevel: productData.minStockLevel,
        maxStockLevel: productData.maxStockLevel,
        images: productData.images,
        variants: productData.variants,
        attributes: productData.attributes,
        tags: productData.tags,
        isActive: productData.isActive ?? true,
        isFeatured: productData.isFeatured ?? false,
        weight: productData.weight,
        dimensions: productData.dimensions,
        seo: productData.seo,
      });

      logger.info("Product created successfully", {
        productId: newProduct.id,
        sku: newProduct.sku,
      });

      return newProduct;
    } catch (error) {
      logger.error("Failed to create product", { error: error.message });
      throw error;
    }
  }

  // Get product by ID
  async getProductById(productId: string): Promise<Product> {
    try {
      const product = await this.productRepository.getProductById(productId);
      if (!product) {
        throw new NotFoundError("Product not found");
      }
      return product;
    } catch (error) {
      logger.error("Failed to get product by ID", {
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  // Get product by SKU
  async getProductBySku(sku: string): Promise<Product> {
    try {
      const product = await this.productRepository.getProductBySku(sku);
      if (!product) {
        throw new NotFoundError("Product not found");
      }
      return product;
    } catch (error) {
      logger.error("Failed to get product by SKU", {
        sku,
        error: error.message,
      });
      throw error;
    }
  }

  // Update product
  async updateProduct(
    productId: string,
    updateData: Partial<Product>
  ): Promise<Product> {
    try {
      // Validate product exists
      const existingProduct =
        await this.productRepository.getProductById(productId);
      if (!existingProduct) {
        throw new NotFoundError("Product not found");
      }

      // Validate update data
      if (updateData.price !== undefined && updateData.price < 0) {
        throw new ValidationError("Price cannot be negative");
      }

      if (updateData.stock !== undefined && updateData.stock < 0) {
        throw new ValidationError("Stock cannot be negative");
      }

      if (updateData.weight !== undefined && updateData.weight < 0) {
        throw new ValidationError("Weight cannot be negative");
      }

      // Update product
      const updatedProduct = await this.productRepository.updateProduct(
        productId,
        updateData
      );

      logger.info("Product updated successfully", { productId });

      return updatedProduct;
    } catch (error) {
      logger.error("Failed to update product", {
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    try {
      const product = await this.productRepository.getProductById(productId);
      if (!product) {
        throw new NotFoundError("Product not found");
      }

      await this.productRepository.deleteProduct(productId);

      logger.info("Product deleted successfully", { productId });
    } catch (error) {
      logger.error("Failed to delete product", {
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  // Get products with filters
  async getProducts(
    page: number = 1,
    limit: number = 20,
    filters: SearchFilters = {}
  ): Promise<SearchResult<Product>> {
    try {
      return await this.productRepository.getProducts(page, limit, filters);
    } catch (error) {
      logger.error("Failed to get products", { error: error.message });
      throw error;
    }
  }

  // Search products
  async searchProducts(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<Product>> {
    try {
      if (!query || query.trim().length === 0) {
        throw new ValidationError("Search query is required");
      }

      return await this.productRepository.searchProducts(query, page, limit);
    } catch (error) {
      logger.error("Failed to search products", {
        query,
        error: error.message,
      });
      throw error;
    }
  }

  // Get products by category
  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<Product>> {
    try {
      return await this.productRepository.getProductsByCategory(
        categoryId,
        page,
        limit
      );
    } catch (error) {
      logger.error("Failed to get products by category", {
        categoryId,
        error: error.message,
      });
      throw error;
    }
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      return await this.productRepository.getFeaturedProducts(limit);
    } catch (error) {
      logger.error("Failed to get featured products", { error: error.message });
      throw error;
    }
  }

  // Update product stock
  async updateProductStock(productId: string, quantity: number): Promise<void> {
    try {
      const product = await this.productRepository.getProductById(productId);
      if (!product) {
        throw new NotFoundError("Product not found");
      }

      // Check if we have enough stock for negative quantity (reservation)
      if (quantity < 0 && Math.abs(quantity) > product.stock) {
        throw new InsufficientStockError("Insufficient stock available");
      }

      await this.productRepository.updateProductStock(productId, quantity);

      logger.info("Product stock updated", {
        productId,
        quantity,
        newStock: product.stock + quantity,
      });
    } catch (error) {
      logger.error("Failed to update product stock", {
        productId,
        quantity,
        error: error.message,
      });
      throw error;
    }
  }

  // Reserve product stock
  async reserveProductStock(
    productId: string,
    quantity: number
  ): Promise<void> {
    try {
      if (quantity <= 0) {
        throw new ValidationError("Reservation quantity must be positive");
      }

      await this.updateProductStock(productId, -quantity);
    } catch (error) {
      logger.error("Failed to reserve product stock", {
        productId,
        quantity,
        error: error.message,
      });
      throw error;
    }
  }

  // Release product stock reservation
  async releaseProductStock(
    productId: string,
    quantity: number
  ): Promise<void> {
    try {
      if (quantity <= 0) {
        throw new ValidationError("Release quantity must be positive");
      }

      await this.updateProductStock(productId, quantity);
    } catch (error) {
      logger.error("Failed to release product stock", {
        productId,
        quantity,
        error: error.message,
      });
      throw error;
    }
  }

  // Add product rating
  async addProductRating(
    productId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<void> {
    try {
      // Validate product exists
      const product = await this.productRepository.getProductById(productId);
      if (!product) {
        throw new NotFoundError("Product not found");
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new ValidationError("Rating must be between 1 and 5");
      }

      await this.productRepository.addProductRating(
        productId,
        userId,
        rating,
        review
      );

      logger.info("Product rating added", { productId, userId, rating });
    } catch (error) {
      logger.error("Failed to add product rating", {
        productId,
        userId,
        rating,
        error: error.message,
      });
      throw error;
    }
  }

  // Get product statistics
  async getProductStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    featuredProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averagePrice: number;
    totalCategories: number;
    totalBrands: number;
  }> {
    try {
      // This would typically query the database for statistics
      // For now, return placeholder data
      return {
        totalProducts: 1000,
        activeProducts: 950,
        featuredProducts: 50,
        lowStockProducts: 25,
        outOfStockProducts: 10,
        averagePrice: 99.99,
        totalCategories: 20,
        totalBrands: 50,
      };
    } catch (error) {
      logger.error("Failed to get product statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  // Bulk update products
  async bulkUpdateProducts(
    productIds: string[],
    updateData: Partial<Product>
  ): Promise<Product[]> {
    try {
      const updatedProducts: Product[] = [];

      for (const productId of productIds) {
        try {
          const updatedProduct = await this.updateProduct(
            productId,
            updateData
          );
          updatedProducts.push(updatedProduct);
        } catch (error) {
          logger.error("Failed to update product in bulk operation", {
            productId,
            error: error.message,
          });
          // Continue with other products
        }
      }

      logger.info("Bulk update completed", {
        totalRequested: productIds.length,
        successfullyUpdated: updatedProducts.length,
      });

      return updatedProducts;
    } catch (error) {
      logger.error("Failed to bulk update products", { error: error.message });
      throw error;
    }
  }

  // Export product data
  async exportProductData(productId: string): Promise<{
    product: Product;
    exportDate: Date;
    metadata: {
      totalRatings: number;
      averageRating: number;
      totalVariants: number;
      totalImages: number;
    };
  }> {
    try {
      const product = await this.getProductById(productId);

      const metadata = {
        totalRatings: product.ratings?.length || 0,
        averageRating:
          product.ratings?.length > 0
            ? product.ratings.reduce((sum, r) => sum + r.rating, 0) /
              product.ratings.length
            : 0,
        totalVariants: product.variants?.length || 0,
        totalImages: product.images?.length || 0,
      };

      return {
        product,
        exportDate: new Date(),
        metadata,
      };
    } catch (error) {
      logger.error("Failed to export product data", {
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  // Validation methods
  private validateProductData(productData: any): void {
    if (!productData.name || productData.name.trim().length === 0) {
      throw new ValidationError("Product name is required");
    }

    if (
      !productData.description ||
      productData.description.trim().length === 0
    ) {
      throw new ValidationError("Product description is required");
    }

    if (
      !productData.shortDescription ||
      productData.shortDescription.trim().length === 0
    ) {
      throw new ValidationError("Product short description is required");
    }

    if (!productData.sku || productData.sku.trim().length === 0) {
      throw new ValidationError("Product SKU is required");
    }

    if (productData.price === undefined || productData.price < 0) {
      throw new ValidationError("Product price must be non-negative");
    }

    if (productData.costPrice === undefined || productData.costPrice < 0) {
      throw new ValidationError("Product cost price must be non-negative");
    }

    if (!productData.categoryId) {
      throw new ValidationError("Product category is required");
    }

    if (productData.stock === undefined || productData.stock < 0) {
      throw new ValidationError("Product stock must be non-negative");
    }

    if (
      productData.minStockLevel === undefined ||
      productData.minStockLevel < 0
    ) {
      throw new ValidationError(
        "Product minimum stock level must be non-negative"
      );
    }

    if (
      productData.maxStockLevel === undefined ||
      productData.maxStockLevel < productData.minStockLevel
    ) {
      throw new ValidationError(
        "Product maximum stock level must be greater than minimum stock level"
      );
    }

    if (productData.weight === undefined || productData.weight < 0) {
      throw new ValidationError("Product weight must be non-negative");
    }

    // Validate images
    if (productData.images && !Array.isArray(productData.images)) {
      throw new ValidationError("Product images must be an array");
    }

    // Validate variants
    if (productData.variants && !Array.isArray(productData.variants)) {
      throw new ValidationError("Product variants must be an array");
    }

    // Validate attributes
    if (productData.attributes && !Array.isArray(productData.attributes)) {
      throw new ValidationError("Product attributes must be an array");
    }

    // Validate tags
    if (productData.tags && !Array.isArray(productData.tags)) {
      throw new ValidationError("Product tags must be an array");
    }
  }
}
