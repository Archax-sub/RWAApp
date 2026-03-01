const axios = require('axios');
const { ethers } = require('ethers');
const { getValidatorToken } = require("../routes/validators");

// Blockchain service for Ethereum interactions
class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contracts = new Map();
    this.initializeProvider();
  }

  // Initialize provider
  initializeProvider() {
    try {
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      console.log('Blockchain provider initialized');
    } catch (error) {
      console.error('Failed to initialize blockchain provider:', error);
    }
  }

  // Get network info
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    const gasPrice = await this.provider.getGasPrice();

    return {
      chainId: network.chainId,
      name: network.name,
      blockNumber,
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
    };
  }

  // Get account balance
  async getBalance(address) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  // Deploy contract
  async deployContract(contractFactory, constructorArgs = []) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const contract = await contractFactory.deploy(...constructorArgs);
    await contract.deployed();
    
    return {
      address: contract.address,
      transactionHash: contract.deployTransaction.hash,
      blockNumber: contract.deployTransaction.blockNumber
    };
  }

  // Call contract method
  async callContractMethod(contractAddress, abi, methodName, args = []) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    return await contract[methodName](...args);
  }

  // Send transaction
  async sendTransaction(contractAddress, abi, methodName, args = [], value = 0) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const contract = new ethers.Contract(contractAddress, abi, this.wallet);
    const tx = await contract[methodName](...args, { value });
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    };
  }

  // Estimate gas
  async estimateGas(contractAddress, abi, methodName, args = [], value = 0) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    return await contract.estimateGas[methodName](...args, { value });
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    return await this.provider.getTransactionReceipt(txHash);
  }

  // Listen to events
  async listenToEvents(contractAddress, abi, eventName, callback) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    contract.on(eventName, callback);
    
    return () => contract.removeListener(eventName, callback);
  }
}

// Etherscan API service
class EtherscanService {
  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY;
    this.baseUrl = process.env.ETHERSCAN_BASE_URL || 'https://api.etherscan.io/api';
  }

  // Get account transactions
  async getAccountTransactions(address, startBlock = 0, endBlock = 99999999) {
    const params = {
      module: 'account',
      action: 'txlist',
      address,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      apikey: this.apiKey
    };

    const response = await axios.get(this.baseUrl, { params });
    return response.data.result;
  }

  // Get token transactions
  async getTokenTransactions(address, contractAddress) {
    const params = {
      module: 'account',
      action: 'tokentx',
      address,
      contractaddress: contractAddress,
      sort: 'desc',
      apikey: this.apiKey
    };

    const response = await axios.get(this.baseUrl, { params });
    return response.data.result;
  }

  // Get contract ABI
  async getContractABI(contractAddress) {
    const params = {
      module: 'contract',
      action: 'getabi',
      address: contractAddress,
      apikey: this.apiKey
    };

    const response = await axios.get(this.baseUrl, { params });
    return JSON.parse(response.data.result);
  }

  // Get contract source code
  async getContractSourceCode(contractAddress) {
    const params = {
      module: 'contract',
      action: 'getsourcecode',
      address: contractAddress,
      apikey: this.apiKey
    };

    const response = await axios.get(this.baseUrl, { params });
    return response.data.result;
  }

  // Get gas price
  async getGasPrice() {
    const params = {
      module: 'gastracker',
      action: 'gasoracle',
      apikey: this.apiKey
    };

    const response = await axios.get(this.baseUrl, { params });
    return response.data.result;
  }
}

// CoinGecko API service for cryptocurrency data
class CoinGeckoService {
  constructor() {
    this.baseUrl = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
  }

  // Get cryptocurrency prices
  async getPrices(ids, vsCurrencies = ['usd']) {
    const params = {
      ids: Array.isArray(ids) ? ids.join(',') : ids,
      vs_currencies: vsCurrencies.join(','),
      include_market_cap: true,
      include_24hr_vol: true,
      include_24hr_change: true
    };

    const response = await axios.get(`${this.baseUrl}/simple/price`, { params });
    return response.data;
  }

  // Get market data
  async getMarketData(vsCurrency = 'usd', order = 'market_cap_desc', perPage = 100) {
    const params = {
      vs_currency: vsCurrency,
      order,
      per_page: perPage,
      page: 1,
      sparkline: false
    };

    const response = await axios.get(`${this.baseUrl}/coins/markets`, { params });
    return response.data;
  }

  // Get coin details
  async getCoinDetails(coinId) {
    const response = await axios.get(`${this.baseUrl}/coins/${coinId}`);
    return response.data;
  }

  // Get historical data
  async getHistoricalData(coinId, days = 30, vsCurrency = 'usd') {
    const params = {
      vs_currency: vsCurrency,
      days
    };

    const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, { params });
    return response.data;
  }

  // Get trending coins
  async getTrendingCoins() {
    const response = await axios.get(`${this.baseUrl}/search/trending`);
    return response.data;
  }

  // Get global market data
  async getGlobalMarketData() {
    const response = await axios.get(`${this.baseUrl}/global`);
    return response.data;
  }
}

// Webhook service for handling external notifications
class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.secret = process.env.WEBHOOK_SECRET;
  }

  // Register webhook
  registerWebhook(name, url, events = []) {
    this.webhooks.set(name, {
      url,
      events,
      active: true,
      createdAt: new Date()
    });
  }

  // Trigger webhook
  async triggerWebhook(name, event, data) {
    const webhook = this.webhooks.get(name);
    if (!webhook || !webhook.active) {
      throw new Error(`Webhook '${name}' not found or inactive`);
    }

    if (!webhook.events.includes(event)) {
      throw new Error(`Event '${event}' not registered for webhook '${name}'`);
    }

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      signature: this.generateSignature(data)
    };

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': payload.signature
        },
        timeout: 10000
      });

      return {
        success: true,
        status: response.status,
        response: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  // Generate signature for webhook payload
  generateSignature(data) {
    if (!this.secret) return null;
    
    const crypto = require('crypto');
    const payload = JSON.stringify(data);
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  // Verify webhook signature
  verifySignature(payload, signature) {
    if (!this.secret) return true; // Skip verification if no secret set
    
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  // List webhooks
  listWebhooks() {
    return Array.from(this.webhooks.entries()).map(([name, webhook]) => ({
      name,
      ...webhook
    }));
  }

  // Deactivate webhook
  deactivateWebhook(name) {
    const webhook = this.webhooks.get(name);
    if (webhook) {
      webhook.active = false;
      return true;
    }
    return false;
  }

  // Remove webhook
  removeWebhook(name) {
    return this.webhooks.delete(name);
  }
}getValidatorToken();

// Analytics service for tracking events
class AnalyticsService {
  constructor() {
    this.events = new Map();
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  // Track event
  trackEvent(eventName, properties = {}) {
    const event = {
      id: require('crypto').randomUUID(),
      name: eventName,
      properties,
      timestamp: new Date(),
      sessionId: properties.sessionId || 'anonymous'
    };

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName).push(event);
    
    // Update metrics
    this.updateMetrics(eventName, properties);
    
    return event.id;
  }

  // Update metrics
  updateMetrics(eventName, properties) {
    const metricKey = `event:${eventName}`;
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, {
        count: 0,
        uniqueUsers: new Set(),
        lastOccurrence: null
      });
    }

    const metric = this.metrics.get(metricKey);
    metric.count++;
    metric.uniqueUsers.add(properties.userId || 'anonymous');
    metric.lastOccurrence = new Date();
  }

  // Get event analytics
  getEventAnalytics(eventName, timeRange = '24h') {
    const events = this.events.get(eventName) || [];
    const now = new Date();
    const timeRangeMs = this.getTimeRangeMs(timeRange);
    const cutoffDate = new Date(now.getTime() - timeRangeMs);

    const filteredEvents = events.filter(e => e.timestamp > cutoffDate);

    return {
      eventName,
      timeRange,
      totalEvents: filteredEvents.length,
      uniqueUsers: new Set(filteredEvents.map(e => e.sessionId)).size,
      eventsPerHour: this.calculateEventsPerHour(filteredEvents, timeRangeMs),
      topProperties: this.getTopProperties(filteredEvents)
    };
  }

  // Get time range in milliseconds
  getTimeRangeMs(timeRange) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['24h'];
  }

  // Calculate events per hour
  calculateEventsPerHour(events, timeRangeMs) {
    const hours = timeRangeMs / (60 * 60 * 1000);
    return Math.round(events.length / hours);
  }

  // Get top properties
  getTopProperties(events) {
    const propertyCounts = {};
    events.forEach(event => {
      Object.entries(event.properties).forEach(([key, value]) => {
        const propertyKey = `${key}:${value}`;
        propertyCounts[propertyKey] = (propertyCounts[propertyKey] || 0) + 1;
      });
    });

    return Object.entries(propertyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([property, count]) => ({ property, count }));
  }

  // Get all metrics
  getAllMetrics() {
    const metrics = {};
    for (const [key, metric] of this.metrics) {
      metrics[key] = {
        count: metric.count,
        uniqueUsers: metric.uniqueUsers.size,
        lastOccurrence: metric.lastOccurrence
      };
    }
    return metrics;
  }

  // Get service stats
  getServiceStats() {
    const uptime = Date.now() - this.startTime;
    return {
      uptime: Math.floor(uptime / 1000), // seconds
      totalEvents: Array.from(this.events.values()).reduce((sum, events) => sum + events.length, 0),
      uniqueEvents: this.events.size,
      totalMetrics: this.metrics.size
    };
  }
}

module.exports = {
  BlockchainService,
  EtherscanService,
  CoinGeckoService,
  WebhookService,
  AnalyticsService
};
