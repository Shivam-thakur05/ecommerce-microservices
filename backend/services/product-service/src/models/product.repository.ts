import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../../../shared/common/utils/logger";
import { getDefaultConnection } from "../../../shared/database/postgres/connection";
import { getDefaultConnection as getRedisConnection } from "../../../shared/database/redis/connection";
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
  DatabaseQueryError,
  ValidationError,
} from "../../../shared/common/errors";
import { CACHE_KEYS, DATABASE_CONFIG } from "../../../shared/common/constants";

const logger = createLogger("ProductRepository");

export class ProductRepository {
  private redisConnection = getRedisConnection();
  private postgresConnection = getDefaultConnection();

  // Create product
  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    try {
      const productId = uuidv4();

      const query = `
        INSERT INTO products (
          id, name, description, short_description, sku, price, compare_price, 
          cost_price, category_id, brand_id, stock, min_stock_level, max_stock_level,
          images, variants, attributes, tags, is_active, is_featured, weight,
          dimensions, seo, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING *
      `;

      const values = [
        productId,
        productData.name,
        productData.description,
        productData.shortDescription,
        productData.sku,
        productData.price,
        productData.comparePrice,
        productData.costPrice,
        productData.categoryId,
        productData.brandId,
        productData.stock,
        productData.minStockLevel,
        productData.maxStockLevel,
        JSON.stringify(productData.images),
        JSON.stringify(productData.variants),
        JSON.stringify(productData.attributes),
        JSON.stringify(productData.tags),
        productData.isActive,
        productData.isFeatured,
        productData.weight,
        JSON.stringify(productData.dimensions),
        JSON.stringify(productData.seo),
        new Date(),
        new Date(),
      ];

      const result = await this.postgresConnection.queryOne(query, values);

      if (!result) {
        throw new DatabaseQueryError("Failed to create product");
      }

      const product = this.mapDatabaseProductToProduct(result);

      // Cache product data
      await this.cacheProduct(product);

      logger.info("Product created successfully", {
        productId: product.id,
        sku: product.sku,
      });

      return product;
    } catch (error: any) {
      if (error.code === "23505") {
        // PostgreSQL unique constraint violation
        throw new ValidationError("Product with this SKU already exists");
      }
      logger.error("Failed to create product", { error: error.message });
      throw new DatabaseQueryError(
        `Failed to create product: ${error.message}`
      );
    }
  }

  // Get product by ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      // Try to get from cache first
      const cachedProduct = await this.getCachedProduct(productId);
      if (cachedProduct) {
        return cachedProduct;
      }

      const query = `
        SELECT p.*, 
               c.name as category_name,
               b.name as brand_name,
               AVG(pr.rating) as average_rating,
               COUNT(pr.id) as rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_ratings pr ON p.id = pr.product_id
        WHERE p.id = $1 AND p.is_active = true
        GROUP BY p.id, c.name, b.name
      `;

      const result = await this.postgresConnection.queryOne(query, [productId]);

      if (!result) {
        return null;
      }

      const product = this.mapDatabaseProductToProduct(result);

      // Cache product data
      await this.cacheProduct(product);

      return product;
    } catch (error) {
      logger.error("Failed to get product by ID", {
        productId,
        error: error.message,
      });
      throw new DatabaseQueryError(`Failed to get product: ${error.message}`);
    }
  }

  // Get product by SKU
  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      const query = `
        SELECT p.*, 
               c.name as category_name,
               b.name as brand_name,
               AVG(pr.rating) as average_rating,
               COUNT(pr.id) as rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_ratings pr ON p.id = pr.product_id
        WHERE p.sku = $1 AND p.is_active = true
        GROUP BY p.id, c.name, b.name
      `;

      const result = await this.postgresConnection.queryOne(query, [sku]);

      if (!result) {
        return null;
      }

      return this.mapDatabaseProductToProduct(result);
    } catch (error) {
      logger.error("Failed to get product by SKU", {
        sku,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to get product by SKU: ${error.message}`
      );
    }
  }

  // Update product
  async updateProduct(
    productId: string,
    updateData: Partial<Product>
  ): Promise<Product> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new NotFoundError("Product not found");
      }

      const query = `
        UPDATE products 
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            short_description = COALESCE($4, short_description),
            price = COALESCE($5, price),
            compare_price = COALESCE($6, compare_price),
            cost_price = COALESCE($7, cost_price),
            category_id = COALESCE($8, category_id),
            brand_id = COALESCE($9, brand_id),
            stock = COALESCE($10, stock),
            min_stock_level = COALESCE($11, min_stock_level),
            max_stock_level = COALESCE($12, max_stock_level),
            images = COALESCE($13, images),
            variants = COALESCE($14, variants),
            attributes = COALESCE($15, attributes),
            tags = COALESCE($16, tags),
            is_active = COALESCE($17, is_active),
            is_featured = COALESCE($18, is_featured),
            weight = COALESCE($19, weight),
            dimensions = COALESCE($20, dimensions),
            seo = COALESCE($21, seo),
            updated_at = $22
        WHERE id = $1
        RETURNING *
      `;

      const values = [
        productId,
        updateData.name,
        updateData.description,
        updateData.shortDescription,
        updateData.price,
        updateData.comparePrice,
        updateData.costPrice,
        updateData.categoryId,
        updateData.brandId,
        updateData.stock,
        updateData.minStockLevel,
        updateData.maxStockLevel,
        updateData.images ? JSON.stringify(updateData.images) : null,
        updateData.variants ? JSON.stringify(updateData.variants) : null,
        updateData.attributes ? JSON.stringify(updateData.attributes) : null,
        updateData.tags ? JSON.stringify(updateData.tags) : null,
        updateData.isActive,
        updateData.isFeatured,
        updateData.weight,
        updateData.dimensions ? JSON.stringify(updateData.dimensions) : null,
        updateData.seo ? JSON.stringify(updateData.seo) : null,
        new Date(),
      ];

      const result = await this.postgresConnection.queryOne(query, values);

      if (!result) {
        throw new DatabaseQueryError("Failed to update product");
      }

      const updatedProduct = this.mapDatabaseProductToProduct(result);

      // Update cache
      await this.cacheProduct(updatedProduct);

      logger.info("Product updated successfully", { productId });

      return updatedProduct;
    } catch (error) {
      logger.error("Failed to update product", {
        productId,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to update product: ${error.message}`
      );
    }
  }

  // Delete product (soft delete)
  async deleteProduct(productId: string): Promise<void> {
    try {
      const query = `
        UPDATE products 
        SET is_active = false, updated_at = $2
        WHERE id = $1
      `;

      const result = await this.postgresConnection.queryOne(query, [
        productId,
        new Date(),
      ]);

      if (!result) {
        throw new NotFoundError("Product not found");
      }

      // Remove from cache
      await this.removeCachedProduct(productId);

      logger.info("Product deleted successfully", { productId });
    } catch (error) {
      logger.error("Failed to delete product", {
        productId,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to delete product: ${error.message}`
      );
    }
  }

  // Get products with pagination and filters
  async getProducts(
    page: number = 1,
    limit: number = 20,
    filters: SearchFilters = {}
  ): Promise<SearchResult<Product>> {
    try {
      let query = `
        SELECT p.*, 
               c.name as category_name,
               b.name as brand_name,
               AVG(pr.rating) as average_rating,
               COUNT(pr.id) as rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_ratings pr ON p.id = pr.product_id
        WHERE p.is_active = true
      `;

      const queryParams: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters.query) {
        query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
        queryParams.push(`%${filters.query}%`);
        paramIndex++;
      }

      if (filters.category) {
        query += ` AND p.category_id = $${paramIndex}`;
        queryParams.push(filters.category);
        paramIndex++;
      }

      if (filters.brand) {
        query += ` AND p.brand_id = $${paramIndex}`;
        queryParams.push(filters.brand);
        paramIndex++;
      }

      if (filters.priceRange) {
        query += ` AND p.price BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(filters.priceRange.min, filters.priceRange.max);
        paramIndex += 2;
      }

      if (filters.rating) {
        query += ` AND (SELECT AVG(rating) FROM product_ratings WHERE product_id = p.id) >= $${paramIndex}`;
        queryParams.push(filters.rating);
        paramIndex++;
      }

      if (filters.inStock !== undefined) {
        if (filters.inStock) {
          query += ` AND p.stock > 0`;
        } else {
          query += ` AND p.stock = 0`;
        }
      }

      query += ` GROUP BY p.id, c.name, b.name`;

      // Apply sorting
      const sortBy = filters.sortBy || "created_at";
      const sortOrder = filters.sortOrder || "desc";
      query += ` ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`;

      // Get total count
      const countQuery = query.replace(
        /SELECT.*FROM/,
        "SELECT COUNT(DISTINCT p.id) as total FROM"
      );
      const countResult = await this.postgresConnection.queryOne(
        countQuery,
        queryParams
      );
      const total = parseInt(countResult?.total || "0");

      // Apply pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const results = await this.postgresConnection.query(query, queryParams);
      const products = results.map(this.mapDatabaseProductToProduct);

      return {
        items: products,
        total,
        facets: this.generateFacets(results),
        suggestions: this.generateSuggestions(filters.query || ""),
      };
    } catch (error) {
      logger.error("Failed to get products", { error: error.message });
      throw new DatabaseQueryError(`Failed to get products: ${error.message}`);
    }
  }

  // Search products
  async searchProducts(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<Product>> {
    try {
      const searchQuery = `
        SELECT p.*, 
               c.name as category_name,
               b.name as brand_name,
               AVG(pr.rating) as average_rating,
               COUNT(pr.id) as rating_count,
               ts_rank(to_tsvector('english', p.name || ' ' || p.description), plainto_tsquery('english', $1)) as rank
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_ratings pr ON p.id = pr.product_id
        WHERE p.is_active = true 
          AND to_tsvector('english', p.name || ' ' || p.description) @@ plainto_tsquery('english', $1)
        GROUP BY p.id, c.name, b.name
        ORDER BY rank DESC, p.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const offset = (page - 1) * limit;
      const results = await this.postgresConnection.query(searchQuery, [
        query,
        limit,
        offset,
      ]);

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        WHERE p.is_active = true 
          AND to_tsvector('english', p.name || ' ' || p.description) @@ plainto_tsquery('english', $1)
      `;
      const countResult = await this.postgresConnection.queryOne(countQuery, [
        query,
      ]);
      const total = parseInt(countResult?.total || "0");

      const products = results.map(this.mapDatabaseProductToProduct);

      return {
        items: products,
        total,
        facets: this.generateFacets(results),
        suggestions: this.generateSuggestions(query),
      };
    } catch (error) {
      logger.error("Failed to search products", {
        query,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to search products: ${error.message}`
      );
    }
  }

  // Get products by category
  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult<Product>> {
    try {
      const query = `
        SELECT p.*, 
               c.name as category_name,
               b.name as brand_name,
               AVG(pr.rating) as average_rating,
               COUNT(pr.id) as rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_ratings pr ON p.id = pr.product_id
        WHERE p.category_id = $1 AND p.is_active = true
        GROUP BY p.id, c.name, b.name
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const offset = (page - 1) * limit;
      const results = await this.postgresConnection.query(query, [
        categoryId,
        limit,
        offset,
      ]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        WHERE p.category_id = $1 AND p.is_active = true
      `;
      const countResult = await this.postgresConnection.queryOne(countQuery, [
        categoryId,
      ]);
      const total = parseInt(countResult?.total || "0");

      const products = results.map(this.mapDatabaseProductToProduct);

      return {
        items: products,
        total,
        facets: this.generateFacets(results),
        suggestions: [],
      };
    } catch (error) {
      logger.error("Failed to get products by category", {
        categoryId,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to get products by category: ${error.message}`
      );
    }
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      const query = `
        SELECT p.*, 
               c.name as category_name,
               b.name as brand_name,
               AVG(pr.rating) as average_rating,
               COUNT(pr.id) as rating_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_ratings pr ON p.id = pr.product_id
        WHERE p.is_featured = true AND p.is_active = true
        GROUP BY p.id, c.name, b.name
        ORDER BY p.created_at DESC
        LIMIT $1
      `;

      const results = await this.postgresConnection.query(query, [limit]);
      return results.map(this.mapDatabaseProductToProduct);
    } catch (error) {
      logger.error("Failed to get featured products", { error: error.message });
      throw new DatabaseQueryError(
        `Failed to get featured products: ${error.message}`
      );
    }
  }

  // Update product stock
  async updateProductStock(productId: string, quantity: number): Promise<void> {
    try {
      const query = `
        UPDATE products 
        SET stock = stock + $2, updated_at = $3
        WHERE id = $1
      `;

      const result = await this.postgresConnection.queryOne(query, [
        productId,
        quantity,
        new Date(),
      ]);

      if (!result) {
        throw new NotFoundError("Product not found");
      }

      // Remove from cache to force refresh
      await this.removeCachedProduct(productId);

      logger.info("Product stock updated", { productId, quantity });
    } catch (error) {
      logger.error("Failed to update product stock", {
        productId,
        quantity,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to update product stock: ${error.message}`
      );
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
      const ratingId = uuidv4();
      const query = `
        INSERT INTO product_ratings (id, product_id, user_id, rating, review, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (product_id, user_id) 
        DO UPDATE SET rating = $4, review = $5, updated_at = $7
      `;

      await this.postgresConnection.queryOne(query, [
        ratingId,
        productId,
        userId,
        rating,
        review,
        new Date(),
        new Date(),
      ]);

      // Remove from cache to force refresh
      await this.removeCachedProduct(productId);

      logger.info("Product rating added", { productId, userId, rating });
    } catch (error) {
      logger.error("Failed to add product rating", {
        productId,
        userId,
        rating,
        error: error.message,
      });
      throw new DatabaseQueryError(
        `Failed to add product rating: ${error.message}`
      );
    }
  }

  // Cache operations
  private async cacheProduct(product: Product): Promise<void> {
    try {
      const key = CACHE_KEYS.PRODUCT.DETAILS(product.id);
      await this.redisConnection.set(
        key,
        JSON.stringify(product),
        DATABASE_CONFIG.REDIS.TTL.MEDIUM
      );
    } catch (error) {
      logger.error("Failed to cache product", {
        productId: product.id,
        error: error.message,
      });
    }
  }

  private async getCachedProduct(productId: string): Promise<Product | null> {
    try {
      const key = CACHE_KEYS.PRODUCT.DETAILS(productId);
      const cached = await this.redisConnection.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error("Failed to get cached product", {
        productId,
        error: error.message,
      });
      return null;
    }
  }

  private async removeCachedProduct(productId: string): Promise<void> {
    try {
      const key = CACHE_KEYS.PRODUCT.DETAILS(productId);
      await this.redisConnection.del(key);
    } catch (error) {
      logger.error("Failed to remove cached product", {
        productId,
        error: error.message,
      });
    }
  }

  // Helper methods
  private mapDatabaseProductToProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      shortDescription: dbProduct.short_description,
      sku: dbProduct.sku,
      price: parseFloat(dbProduct.price),
      comparePrice: dbProduct.compare_price
        ? parseFloat(dbProduct.compare_price)
        : undefined,
      costPrice: parseFloat(dbProduct.cost_price),
      categoryId: dbProduct.category_id,
      brandId: dbProduct.brand_id,
      stock: parseInt(dbProduct.stock),
      minStockLevel: parseInt(dbProduct.min_stock_level),
      maxStockLevel: parseInt(dbProduct.max_stock_level),
      images: dbProduct.images ? JSON.parse(dbProduct.images) : [],
      variants: dbProduct.variants ? JSON.parse(dbProduct.variants) : [],
      attributes: dbProduct.attributes ? JSON.parse(dbProduct.attributes) : [],
      tags: dbProduct.tags ? JSON.parse(dbProduct.tags) : [],
      isActive: dbProduct.is_active,
      isFeatured: dbProduct.is_featured,
      weight: parseFloat(dbProduct.weight),
      dimensions: dbProduct.dimensions
        ? JSON.parse(dbProduct.dimensions)
        : undefined,
      seo: dbProduct.seo ? JSON.parse(dbProduct.seo) : undefined,
      ratings: [], // Will be populated separately if needed
      createdAt: new Date(dbProduct.created_at),
      updatedAt: new Date(dbProduct.updated_at),
    };
  }

  private generateFacets(products: any[]): Record<string, any> {
    const facets: Record<string, any> = {
      categories: {},
      brands: {},
      priceRanges: {
        "0-50": 0,
        "50-100": 0,
        "100-200": 0,
        "200-500": 0,
        "500+": 0,
      },
      ratings: {
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0,
      },
    };

    products.forEach((product) => {
      // Category facet
      if (product.category_name) {
        facets.categories[product.category_name] =
          (facets.categories[product.category_name] || 0) + 1;
      }

      // Brand facet
      if (product.brand_name) {
        facets.brands[product.brand_name] =
          (facets.brands[product.brand_name] || 0) + 1;
      }

      // Price range facet
      const price = parseFloat(product.price);
      if (price <= 50) facets.priceRanges["0-50"]++;
      else if (price <= 100) facets.priceRanges["50-100"]++;
      else if (price <= 200) facets.priceRanges["100-200"]++;
      else if (price <= 500) facets.priceRanges["200-500"]++;
      else facets.priceRanges["500+"]++;

      // Rating facet
      const rating = parseFloat(product.average_rating || "0");
      if (rating >= 4.5) facets.ratings["5"]++;
      else if (rating >= 3.5) facets.ratings["4"]++;
      else if (rating >= 2.5) facets.ratings["3"]++;
      else if (rating >= 1.5) facets.ratings["2"]++;
      else facets.ratings["1"]++;
    });

    return facets;
  }

  private generateSuggestions(query: string): string[] {
    // This would typically use a search engine like Elasticsearch
    // For now, return empty array
    return [];
  }
}
