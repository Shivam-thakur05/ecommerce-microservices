import { createLogger } from "../../../shared/common/utils/logger";
import { getDefaultConnection as getRabbitMQConnection } from "../../../shared/database/rabbitmq/connection";
import { UserService } from "../services/user.service";
import { UserRepository } from "../models/user.repository";
import {
  UserEvent,
  OrderEvent,
  PaymentEvent,
  NotificationEvent,
  ProductEvent,
  AnalyticsEvent,
  EventType,
  EventPayload,
} from "../../../shared/common/types";

const logger = createLogger("EventHandlers");

export class EventHandlers {
  private userService: UserService;
  private rabbitmq: any;

  constructor() {
    const userRepository = new UserRepository();
    this.userService = new UserService(userRepository);
    this.rabbitmq = getRabbitMQConnection();
  }

  /**
   * Initialize event handlers and start consuming messages
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing event handlers");

      // Assert queues
      await this.rabbitmq.assertQueue("user-service-events", { durable: true });
      await this.rabbitmq.assertQueue("user-service-orders", { durable: true });
      await this.rabbitmq.assertQueue("user-service-payments", {
        durable: true,
      });
      await this.rabbitmq.assertQueue("user-service-notifications", {
        durable: true,
      });
      await this.rabbitmq.assertQueue("user-service-products", {
        durable: true,
      });
      await this.rabbitmq.assertQueue("user-service-analytics", {
        durable: true,
      });

      // Assert exchanges
      await this.rabbitmq.assertExchange("user-events", "topic", {
        durable: true,
      });
      await this.rabbitmq.assertExchange("order-events", "topic", {
        durable: true,
      });
      await this.rabbitmq.assertExchange("payment-events", "topic", {
        durable: true,
      });
      await this.rabbitmq.assertExchange("notification-events", "topic", {
        durable: true,
      });
      await this.rabbitmq.assertExchange("product-events", "topic", {
        durable: true,
      });
      await this.rabbitmq.assertExchange("analytics-events", "topic", {
        durable: true,
      });

      // Bind queues to exchanges
      await this.rabbitmq.bindQueue("user-service-events", "user-events", "#");
      await this.rabbitmq.bindQueue("user-service-orders", "order-events", "#");
      await this.rabbitmq.bindQueue(
        "user-service-payments",
        "payment-events",
        "#"
      );
      await this.rabbitmq.bindQueue(
        "user-service-notifications",
        "notification-events",
        "#"
      );
      await this.rabbitmq.bindQueue(
        "user-service-products",
        "product-events",
        "#"
      );
      await this.rabbitmq.bindQueue(
        "user-service-analytics",
        "analytics-events",
        "#"
      );

      // Start consuming messages
      await this.startConsuming();

      logger.info("Event handlers initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize event handlers", { error });
      throw error;
    }
  }

  /**
   * Start consuming messages from all queues
   */
  private async startConsuming(): Promise<void> {
    try {
      // Consume user events
      await this.rabbitmq.consume("user-service-events", (msg: any) => {
        this.handleUserEvent(msg);
      });

      // Consume order events
      await this.rabbitmq.consume("user-service-orders", (msg: any) => {
        this.handleOrderEvent(msg);
      });

      // Consume payment events
      await this.rabbitmq.consume("user-service-payments", (msg: any) => {
        this.handlePaymentEvent(msg);
      });

      // Consume notification events
      await this.rabbitmq.consume("user-service-notifications", (msg: any) => {
        this.handleNotificationEvent(msg);
      });

      // Consume product events
      await this.rabbitmq.consume("user-service-products", (msg: any) => {
        this.handleProductEvent(msg);
      });

      // Consume analytics events
      await this.rabbitmq.consume("user-service-analytics", (msg: any) => {
        this.handleAnalyticsEvent(msg);
      });

      logger.info("Started consuming messages from all queues");
    } catch (error) {
      logger.error("Failed to start consuming messages", { error });
      throw error;
    }
  }

  /**
   * Handle user-related events
   */
  private async handleUserEvent(msg: any): Promise<void> {
    try {
      const event: UserEvent = JSON.parse(msg.content.toString());
      logger.info("Handling user event", {
        eventType: event.type,
        userId: event.payload.userId,
      });

      switch (event.type) {
        case EventType.USER_CREATED:
          await this.handleUserCreated(event.payload);
          break;
        case EventType.USER_UPDATED:
          await this.handleUserUpdated(event.payload);
          break;
        case EventType.USER_DELETED:
          await this.handleUserDeleted(event.payload);
          break;
        case EventType.USER_LOGIN:
          await this.handleUserLogin(event.payload);
          break;
        case EventType.USER_LOGOUT:
          await this.handleUserLogout(event.payload);
          break;
        case EventType.USER_PASSWORD_CHANGED:
          await this.handleUserPasswordChanged(event.payload);
          break;
        case EventType.USER_EMAIL_VERIFIED:
          await this.handleUserEmailVerified(event.payload);
          break;
        case EventType.USER_PHONE_VERIFIED:
          await this.handleUserPhoneVerified(event.payload);
          break;
        default:
          logger.warn("Unknown user event type", { eventType: event.type });
      }

      // Acknowledge the message
      await this.rabbitmq.ackMessage(msg);
    } catch (error) {
      logger.error("Failed to handle user event", { error, msg });
      // Reject the message and requeue
      await this.rabbitmq.nackMessage(msg, false, true);
    }
  }

  /**
   * Handle order-related events
   */
  private async handleOrderEvent(msg: any): Promise<void> {
    try {
      const event: OrderEvent = JSON.parse(msg.content.toString());
      logger.info("Handling order event", {
        eventType: event.type,
        orderId: event.payload.orderId,
      });

      switch (event.type) {
        case EventType.ORDER_CREATED:
          await this.handleOrderCreated(event.payload);
          break;
        case EventType.ORDER_UPDATED:
          await this.handleOrderUpdated(event.payload);
          break;
        case EventType.ORDER_CANCELLED:
          await this.handleOrderCancelled(event.payload);
          break;
        case EventType.ORDER_COMPLETED:
          await this.handleOrderCompleted(event.payload);
          break;
        default:
          logger.warn("Unknown order event type", { eventType: event.type });
      }

      await this.rabbitmq.ackMessage(msg);
    } catch (error) {
      logger.error("Failed to handle order event", { error, msg });
      await this.rabbitmq.nackMessage(msg, false, true);
    }
  }

  /**
   * Handle payment-related events
   */
  private async handlePaymentEvent(msg: any): Promise<void> {
    try {
      const event: PaymentEvent = JSON.parse(msg.content.toString());
      logger.info("Handling payment event", {
        eventType: event.type,
        paymentId: event.payload.paymentId,
      });

      switch (event.type) {
        case EventType.PAYMENT_PROCESSED:
          await this.handlePaymentProcessed(event.payload);
          break;
        case EventType.PAYMENT_FAILED:
          await this.handlePaymentFailed(event.payload);
          break;
        case EventType.PAYMENT_REFUNDED:
          await this.handlePaymentRefunded(event.payload);
          break;
        default:
          logger.warn("Unknown payment event type", { eventType: event.type });
      }

      await this.rabbitmq.ackMessage(msg);
    } catch (error) {
      logger.error("Failed to handle payment event", { error, msg });
      await this.rabbitmq.nackMessage(msg, false, true);
    }
  }

  /**
   * Handle notification-related events
   */
  private async handleNotificationEvent(msg: any): Promise<void> {
    try {
      const event: NotificationEvent = JSON.parse(msg.content.toString());
      logger.info("Handling notification event", {
        eventType: event.type,
        notificationId: event.payload.notificationId,
      });

      switch (event.type) {
        case EventType.NOTIFICATION_SENT:
          await this.handleNotificationSent(event.payload);
          break;
        case EventType.NOTIFICATION_READ:
          await this.handleNotificationRead(event.payload);
          break;
        default:
          logger.warn("Unknown notification event type", {
            eventType: event.type,
          });
      }

      await this.rabbitmq.ackMessage(msg);
    } catch (error) {
      logger.error("Failed to handle notification event", { error, msg });
      await this.rabbitmq.nackMessage(msg, false, true);
    }
  }

  /**
   * Handle product-related events
   */
  private async handleProductEvent(msg: any): Promise<void> {
    try {
      const event: ProductEvent = JSON.parse(msg.content.toString());
      logger.info("Handling product event", {
        eventType: event.type,
        productId: event.payload.productId,
      });

      switch (event.type) {
        case EventType.PRODUCT_CREATED:
          await this.handleProductCreated(event.payload);
          break;
        case EventType.PRODUCT_UPDATED:
          await this.handleProductUpdated(event.payload);
          break;
        case EventType.PRODUCT_DELETED:
          await this.handleProductDeleted(event.payload);
          break;
        default:
          logger.warn("Unknown product event type", { eventType: event.type });
      }

      await this.rabbitmq.ackMessage(msg);
    } catch (error) {
      logger.error("Failed to handle product event", { error, msg });
      await this.rabbitmq.nackMessage(msg, false, true);
    }
  }

  /**
   * Handle analytics-related events
   */
  private async handleAnalyticsEvent(msg: any): Promise<void> {
    try {
      const event: AnalyticsEvent = JSON.parse(msg.content.toString());
      logger.info("Handling analytics event", { eventType: event.type });

      switch (event.type) {
        case EventType.ANALYTICS_USER_ACTIVITY:
          await this.handleUserActivity(event.payload);
          break;
        case EventType.ANALYTICS_USER_BEHAVIOR:
          await this.handleUserBehavior(event.payload);
          break;
        default:
          logger.warn("Unknown analytics event type", {
            eventType: event.type,
          });
      }

      await this.rabbitmq.ackMessage(msg);
    } catch (error) {
      logger.error("Failed to handle analytics event", { error, msg });
      await this.rabbitmq.nackMessage(msg, false, true);
    }
  }

  // User event handlers
  private async handleUserCreated(payload: EventPayload): Promise<void> {
    logger.info("User created event handled", { userId: payload.userId });
    // Update user statistics, send welcome email, etc.
  }

  private async handleUserUpdated(payload: EventPayload): Promise<void> {
    logger.info("User updated event handled", { userId: payload.userId });
    // Update cache, notify other services, etc.
  }

  private async handleUserDeleted(payload: EventPayload): Promise<void> {
    logger.info("User deleted event handled", { userId: payload.userId });
    // Clean up user data, remove from cache, etc.
  }

  private async handleUserLogin(payload: EventPayload): Promise<void> {
    logger.info("User login event handled", { userId: payload.userId });
    // Update last login time, track login activity, etc.
  }

  private async handleUserLogout(payload: EventPayload): Promise<void> {
    logger.info("User logout event handled", { userId: payload.userId });
    // Update session data, track logout activity, etc.
  }

  private async handleUserPasswordChanged(
    payload: EventPayload
  ): Promise<void> {
    logger.info("User password changed event handled", {
      userId: payload.userId,
    });
    // Invalidate sessions, send notification, etc.
  }

  private async handleUserEmailVerified(payload: EventPayload): Promise<void> {
    logger.info("User email verified event handled", {
      userId: payload.userId,
    });
    // Update user status, send welcome email, etc.
  }

  private async handleUserPhoneVerified(payload: EventPayload): Promise<void> {
    logger.info("User phone verified event handled", {
      userId: payload.userId,
    });
    // Update user status, enable SMS notifications, etc.
  }

  // Order event handlers
  private async handleOrderCreated(payload: EventPayload): Promise<void> {
    logger.info("Order created event handled", {
      orderId: payload.orderId,
      userId: payload.userId,
    });
    // Update user order history, send confirmation, etc.
  }

  private async handleOrderUpdated(payload: EventPayload): Promise<void> {
    logger.info("Order updated event handled", {
      orderId: payload.orderId,
      userId: payload.userId,
    });
    // Update user order history, send notification, etc.
  }

  private async handleOrderCancelled(payload: EventPayload): Promise<void> {
    logger.info("Order cancelled event handled", {
      orderId: payload.orderId,
      userId: payload.userId,
    });
    // Update user order history, send cancellation email, etc.
  }

  private async handleOrderCompleted(payload: EventPayload): Promise<void> {
    logger.info("Order completed event handled", {
      orderId: payload.orderId,
      userId: payload.userId,
    });
    // Update user statistics, send completion email, etc.
  }

  // Payment event handlers
  private async handlePaymentProcessed(payload: EventPayload): Promise<void> {
    logger.info("Payment processed event handled", {
      paymentId: payload.paymentId,
      userId: payload.userId,
    });
    // Update user payment history, send receipt, etc.
  }

  private async handlePaymentFailed(payload: EventPayload): Promise<void> {
    logger.info("Payment failed event handled", {
      paymentId: payload.paymentId,
      userId: payload.userId,
    });
    // Update user payment history, send failure notification, etc.
  }

  private async handlePaymentRefunded(payload: EventPayload): Promise<void> {
    logger.info("Payment refunded event handled", {
      paymentId: payload.paymentId,
      userId: payload.userId,
    });
    // Update user payment history, send refund notification, etc.
  }

  // Notification event handlers
  private async handleNotificationSent(payload: EventPayload): Promise<void> {
    logger.info("Notification sent event handled", {
      notificationId: payload.notificationId,
      userId: payload.userId,
    });
    // Update user notification preferences, track delivery, etc.
  }

  private async handleNotificationRead(payload: EventPayload): Promise<void> {
    logger.info("Notification read event handled", {
      notificationId: payload.notificationId,
      userId: payload.userId,
    });
    // Update notification status, track engagement, etc.
  }

  // Product event handlers
  private async handleProductCreated(payload: EventPayload): Promise<void> {
    logger.info("Product created event handled", {
      productId: payload.productId,
    });
    // Update user preferences, send notification if user is interested, etc.
  }

  private async handleProductUpdated(payload: EventPayload): Promise<void> {
    logger.info("Product updated event handled", {
      productId: payload.productId,
    });
    // Update user preferences, send notification if user is interested, etc.
  }

  private async handleProductDeleted(payload: EventPayload): Promise<void> {
    logger.info("Product deleted event handled", {
      productId: payload.productId,
    });
    // Update user preferences, remove from wishlist, etc.
  }

  // Analytics event handlers
  private async handleUserActivity(payload: EventPayload): Promise<void> {
    logger.info("User activity event handled", { userId: payload.userId });
    // Update user activity tracking, update statistics, etc.
  }

  private async handleUserBehavior(payload: EventPayload): Promise<void> {
    logger.info("User behavior event handled", { userId: payload.userId });
    // Update user behavior tracking, update recommendations, etc.
  }

  /**
   * Cleanup event handlers
   */
  async cleanup(): Promise<void> {
    try {
      logger.info("Cleaning up event handlers");
      await this.rabbitmq.disconnect();
      logger.info("Event handlers cleaned up successfully");
    } catch (error) {
      logger.error("Failed to cleanup event handlers", { error });
    }
  }
}
