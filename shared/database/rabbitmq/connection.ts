import { Connection, Channel, Message, Options } from "amqplib";
import * as amqp from "amqplib";
import createLogger from "../../common/utils/logger";
import { MessageQueueError } from "../../common/errors";
import { DATABASE_CONFIG } from "../../common/constants";

const logger = createLogger("rabbitmq-connection");

interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  heartbeat?: number;
  connectionTimeout?: number;
  channelMax?: number;
  frameMax?: number;
}

interface QueueConfig {
  name: string;
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: any;
}

interface ExchangeConfig {
  name: string;
  type: "direct" | "fanout" | "topic" | "headers";
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: any;
}

interface PublishConfig {
  exchange: string;
  routingKey: string;
  content: any;
  options?: Options.Publish;
}

interface ConsumeConfig {
  queue: string;
  callback: (msg: Message | null) => Promise<void>;
  options?: Options.Consume;
}

class RabbitMQConnection {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  private consumers: Map<string, (msg: Message | null) => Promise<void>> =
    new Map();

  constructor(config: RabbitMQConfig) {
    this.config = {
      ...DATABASE_CONFIG.RABBITMQ,
      ...config,
      vhost: config.vhost || DATABASE_CONFIG.RABBITMQ.DEFAULT_VHOST,
      heartbeat: config.heartbeat || DATABASE_CONFIG.RABBITMQ.HEARTBEAT,
      connectionTimeout:
        config.connectionTimeout || DATABASE_CONFIG.RABBITMQ.CONNECTION_TIMEOUT,
    };
  }

  async connect(): Promise<void> {
    try {
      if (this.connection) {
        await this.disconnect();
      }

      const url = `amqp://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}${this.config.vhost}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any    
      this.connection  as any == await amqp.connect(url, {
        heartbeat: this.config.heartbeat,
        connectionTimeout: this.config.connectionTimeout,
        channelMax: this.config.channelMax,
        frameMax: this.config.frameMax,
      });

      // Set up connection event listeners
      this.connection.on("connect", () => {
        logger.info("RabbitMQ connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.connection.on("error", (error) => {
        logger.error("RabbitMQ connection error", { error: error.message });
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        logger.warn("RabbitMQ connection closed");
        this.isConnected = false;
      });

      // Create channel
      this.channel = await (this.connection as any).createChannel();

      // Set up channel event listeners
      this.channel.on("error", (error) => {
        logger.error("RabbitMQ channel error", { error: error.message });
      });

      this.channel.on("return", (msg) => {
        logger.warn("RabbitMQ message returned", {
          exchange: msg.fields.exchange,
          routingKey: msg.fields.routingKey,
          replyCode: msg.fields.replyCode,
          replyText: msg.fields.replyText,
        });
      });

      logger.info("RabbitMQ connection established successfully", {
        host: this.config.host,
        port: this.config.port,
        vhost: this.config.vhost,
      });
    } catch (error) {
      logger.error("Failed to connect to RabbitMQ", { error: error.message });
      throw new MessageQueueError(
        `RabbitMQ connection failed: ${error.message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await (this.connection as any).close();
      this.connection = null;
      this.isConnected = false;
      logger.info("RabbitMQ connection closed");
    }
  }

  async getChannel(): Promise<Channel> {
    if (!this.connection || !this.channel || !this.isConnected) {
      await this.connect();
    }

    if (!this.channel) {
      throw new MessageQueueError("RabbitMQ channel not available");
    }

    return this.channel;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      await channel.checkQueue("health-check-queue");
      return true;
    } catch (error) {
      logger.error("RabbitMQ health check failed", { error: error.message });
      return false;
    }
  }

  // Queue operations
  async assertQueue(config: QueueConfig): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.assertQueue(config.name, {
        durable: config.durable !== false,
        autoDelete: config.autoDelete || false,
        arguments: config.arguments,
      });

      const duration = Date.now() - start;
      logger.debug("RabbitMQ queue asserted", {
        queue: config.name,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ queue assertion failed", {
        queue: config.name,
        error: error.message,
      });
      throw new MessageQueueError(`Queue assertion failed: ${error.message}`);
    }
  }

  async deleteQueue(queueName: string): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.deleteQueue(queueName);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ queue deleted", {
        queue: queueName,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ queue deletion failed", {
        queue: queueName,
        error: error.message,
      });
      throw new MessageQueueError(`Queue deletion failed: ${error.message}`);
    }
  }

  async purgeQueue(queueName: string): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.purgeQueue(queueName);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ queue purged", {
        queue: queueName,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ queue purge failed", {
        queue: queueName,
        error: error.message,
      });
      throw new MessageQueueError(`Queue purge failed: ${error.message}`);
    }
  }

  // Exchange operations
  async assertExchange(config: ExchangeConfig): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.assertExchange(config.name, config.type, {
        durable: config.durable !== false,
        autoDelete: config.autoDelete || false,
        arguments: config.arguments,
      });

      const duration = Date.now() - start;
      logger.debug("RabbitMQ exchange asserted", {
        exchange: config.name,
        type: config.type,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ exchange assertion failed", {
        exchange: config.name,
        error: error.message,
      });
      throw new MessageQueueError(
        `Exchange assertion failed: ${error.message}`
      );
    }
  }

  async deleteExchange(exchangeName: string): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.deleteExchange(exchangeName);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ exchange deleted", {
        exchange: exchangeName,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ exchange deletion failed", {
        exchange: exchangeName,
        error: error.message,
      });
      throw new MessageQueueError(`Exchange deletion failed: ${error.message}`);
    }
  }

  // Binding operations
  async bindQueue(
    queueName: string,
    exchangeName: string,
    routingKey: string
  ): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.bindQueue(queueName, exchangeName, routingKey);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ queue bound", {
        queue: queueName,
        exchange: exchangeName,
        routingKey,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ queue binding failed", {
        queue: queueName,
        exchange: exchangeName,
        routingKey,
        error: error.message,
      });
      throw new MessageQueueError(`Queue binding failed: ${error.message}`);
    }
  }

  async unbindQueue(
    queueName: string,
    exchangeName: string,
    routingKey: string
  ): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.unbindQueue(queueName, exchangeName, routingKey);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ queue unbound", {
        queue: queueName,
        exchange: exchangeName,
        routingKey,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ queue unbinding failed", {
        queue: queueName,
        exchange: exchangeName,
        routingKey,
        error: error.message,
      });
      throw new MessageQueueError(`Queue unbinding failed: ${error.message}`);
    }
  }

  // Publishing
  async publish(config: PublishConfig): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      const content = Buffer.from(JSON.stringify(config.content));
      const result = channel.publish(
        config.exchange,
        config.routingKey,
        content,
        config.options
      );

      const duration = Date.now() - start;
      logger.debug("RabbitMQ message published", {
        exchange: config.exchange,
        routingKey: config.routingKey,
        duration: `${duration}ms`,
        success: result,
      });

      return result;
    } catch (error) {
      logger.error("RabbitMQ message publishing failed", {
        exchange: config.exchange,
        routingKey: config.routingKey,
        error: error.message,
      });
      throw new MessageQueueError(
        `Message publishing failed: ${error.message}`
      );
    }
  }

  async sendToQueue(
    queueName: string,
    content: any,
    options?: Options.Publish
  ): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      const message = Buffer.from(JSON.stringify(content));
      const result = channel.sendToQueue(queueName, message, options);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ message sent to queue", {
        queue: queueName,
        duration: `${duration}ms`,
        success: result,
      });

      return result;
    } catch (error) {
      logger.error("RabbitMQ message sending failed", {
        queue: queueName,
        error: error.message,
      });
      throw new MessageQueueError(`Message sending failed: ${error.message}`);
    }
  }

  // Consuming
  async consume(config: ConsumeConfig): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.consume(
        config.queue,
        async (msg) => {
          try {
            await config.callback(msg);
          } catch (error) {
            logger.error("RabbitMQ message processing failed", {
              queue: config.queue,
              error: error.message,
            });
            // Reject the message and requeue it
            if (msg) {
              channel.nack(msg, false, true);
            }
          }
        },
        config.options
      );

      this.consumers.set(config.queue, config.callback);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ consumer started", {
        queue: config.queue,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ consumer setup failed", {
        queue: config.queue,
        error: error.message,
      });
      throw new MessageQueueError(`Consumer setup failed: ${error.message}`);
    }
  }

  async cancelConsumer(queueName: string): Promise<void> {
    try {
      const channel = await this.getChannel();
      const start = Date.now();

      await channel.cancel(queueName);
      this.consumers.delete(queueName);

      const duration = Date.now() - start;
      logger.debug("RabbitMQ consumer cancelled", {
        queue: queueName,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error("RabbitMQ consumer cancellation failed", {
        queue: queueName,
        error: error.message,
      });
      throw new MessageQueueError(
        `Consumer cancellation failed: ${error.message}`
      );
    }
  }

  // Message acknowledgment
  async ackMessage(msg: Message): Promise<void> {
    try {
      const channel = await this.getChannel();
      channel.ack(msg);
      logger.debug("RabbitMQ message acknowledged", {
        queue: msg.fields.routingKey,
        deliveryTag: msg.fields.deliveryTag,
      });
    } catch (error) {
      logger.error("RabbitMQ message acknowledgment failed", {
        error: error.message,
      });
      throw new MessageQueueError(
        `Message acknowledgment failed: ${error.message}`
      );
    }
  }

  async nackMessage(msg: Message, requeue: boolean = false): Promise<void> {
    try {
      const channel = await this.getChannel();
      channel.nack(msg, false, requeue);
      logger.debug("RabbitMQ message negative acknowledged", {
        queue: msg.fields.routingKey,
        deliveryTag: msg.fields.deliveryTag,
        requeue,
      });
    } catch (error) {
      logger.error("RabbitMQ message negative acknowledgment failed", {
        error: error.message,
      });
      throw new MessageQueueError(
        `Message negative acknowledgment failed: ${error.message}`
      );
    }
  }

  // Utility methods
  async getQueueInfo(queueName: string): Promise<{
    queue: string;
    messageCount: number;
    consumerCount: number;
  }> {
    try {
      const channel = await this.getChannel();
      const info = await channel.checkQueue(queueName);

      return {
        queue: queueName,
        messageCount: info.messageCount,
        consumerCount: info.consumerCount,
      };
    } catch (error) {
      logger.error("Failed to get queue info", {
        queue: queueName,
        error: error.message,
      });
      throw new MessageQueueError(`Failed to get queue info: ${error.message}`);
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new MessageQueueError("Max reconnection attempts reached");
    }

    this.reconnectAttempts++;
    logger.warn(
      `Attempting to reconnect to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    try {
      await this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));
      await this.connect();
    } catch (error) {
      logger.error("Reconnection failed", { error: error.message });
      throw error;
    }
  }

  isHealthy(): boolean {
    return (
      this.isConnected && this.connection !== null && this.channel !== null
    );
  }

  getConfig(): RabbitMQConfig {
    return { ...this.config };
  }

  getConsumers(): string[] {
    return Array.from(this.consumers.keys());
  }
}

// Factory function to create connection
export function createRabbitMQConnection(
  config: RabbitMQConfig
): RabbitMQConnection {
  return new RabbitMQConnection(config);
}

// Default connection instance
let defaultConnection: RabbitMQConnection | null = null;

export function getDefaultConnection(): RabbitMQConnection {
  if (!defaultConnection) {
    const config: RabbitMQConfig = {
      host: process.env.RABBITMQ_HOST || "localhost",
      port: parseInt(process.env.RABBITMQ_PORT || "5672"),
      username: process.env.RABBITMQ_USER || "admin",
      password: process.env.RABBITMQ_PASS || "admin123",
      vhost: process.env.RABBITMQ_VHOST || "/",
    };
    defaultConnection = createRabbitMQConnection(config);
  }
  return defaultConnection;
}

export default RabbitMQConnection;
