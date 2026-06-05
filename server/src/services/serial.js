/**
 * M5Stack 串口通信服务
 *
 * 负责：
 * 1. 连接 M5StopWatch (COM5, 115200 baud)
 * 2. 解析上行 JSON 传感器数据
 * 3. 提供 API 获取最新数据
 * 4. 支持下行指令发送
 * 5. 自动重连机制
 *
 * 云端部署时设置 SKIP_SERIAL=true 跳过串口功能
 */

import { EventEmitter } from 'events';

// ========== 动态导入串口模块（云端可能无法编译原生模块）==========
let SerialPort, ReadlineParser;

if (process.env.SKIP_SERIAL !== 'true') {
  try {
    const sp = await import('serialport');
    const parser = await import('@serialport/parser-readline');
    SerialPort = sp.SerialPort;
    ReadlineParser = parser.ReadlineParser;
  } catch (e) {
    console.warn('⚠️  serialport 模块加载失败，串口功能不可用:', e.message);
  }
}

// ========== 配置 ==========
const SERIAL_CONFIG = {
  path: process.env.SERIAL_PORT || 'COM5',
  baudRate: parseInt(process.env.SERIAL_BAUD || '115200'),
};
const RECONNECT_INTERVAL = 3000; // 重连间隔 ms

// ========== 串口服务类 ==========
class SerialService extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.parser = null;
    this.connected = false;
    this.deviceReady = false;
    this.deviceInfo = null;

    // 最新传感器数据
    this.latestData = null;
    this.history = [];       // 最近 60 条数据（1分钟 @1Hz）
    this.maxHistory = 60;

    // 统计
    this.stats = {
      messagesReceived: 0,
      errors: 0,
      lastMessageAt: null,
    };
  }

  /** 启动串口连接 */
  start() {
    if (process.env.SKIP_SERIAL === 'true') {
      console.log('⏭️  串口服务已跳过 (SKIP_SERIAL=true)');
      return;
    }
    if (!SerialPort) {
      console.warn('⏭️  SerialPort 模块不可用，跳过串口连接');
      return;
    }
    console.log(`🔌 串口服务启动: ${SERIAL_CONFIG.path} @ ${SERIAL_CONFIG.baudRate}`);
    this._connect();
  }

  /** 内部连接逻辑 */
  _connect() {
    if (!SerialPort) return;

    try {
      this.port = new SerialPort({
        ...SERIAL_CONFIG,
        autoOpen: false,
        // 关键：禁止自动操作 DTR/RTS，避免 ESP32-S3 被复位进下载模式
        hupcl: false,
        rtscts: false,
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // 数据接收
      this.parser.on('data', (line) => this._handleData(line));

      // 连接事件
      this.port.on('open', () => {
        this.connected = true;
        console.log(`✅ M5Stack 已连接: ${SERIAL_CONFIG.path}`);
        this.emit('connected');
      });

      // 断开事件
      this.port.on('close', () => {
        this.connected = false;
        this.deviceReady = false;
        console.log('⚠️  M5Stack 已断开');
        this.emit('disconnected');
        // 自动重连
        setTimeout(() => this._connect(), RECONNECT_INTERVAL);
      });

      // 错误处理
      this.port.on('error', (err) => {
        this.stats.errors++;
        console.error(`❌ 串口错误: ${err.message}`);
        this.emit('error', err);
        if (!this.port.isOpen) {
          setTimeout(() => this._connect(), RECONNECT_INTERVAL);
        }
      });

      // 打开连接（打开后立即设置 DTR/RTS 为安全状态）
      this.port.open((err) => {
        if (err) {
          console.warn(`⏳ 串口打开失败，${RECONNECT_INTERVAL / 1000}s 后重试: ${err.message}`);
          setTimeout(() => this._connect(), RECONNECT_INTERVAL);
        } else {
          // ESP32-S3 原生 USB: 确保 DTR=false, RTS=false 避免触发复位/下载模式
          this.port.set({ dtr: false, rts: false });
        }
      });
    } catch (err) {
      console.warn(`⏳ 串口初始化失败: ${err.message}`);
      setTimeout(() => this._connect(), RECONNECT_INTERVAL);
    }
  }

  /** 处理接收到的数据行 */
  _handleData(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const data = JSON.parse(trimmed);
      this.stats.messagesReceived++;
      this.stats.lastMessageAt = Date.now();

      switch (data.type) {
        case 'ready':
          this.deviceReady = true;
          this.deviceInfo = data;
          console.log(`🎉 设备就绪: ${data.device} (${data.firmware})`);
          this.emit('ready', data);
          break;

        case 'sensor':
          this.latestData = { ...data, receivedAt: Date.now() };
          this.history.push(this.latestData);
          if (this.history.length > this.maxHistory) {
            this.history.shift();
          }
          this.emit('sensor', this.latestData);
          break;

        case 'event':
          console.log(`🔔 设备事件: ${data.event} → ${data.action || ''}`);
          this.emit('device-event', data);
          break;

        case 'error':
          console.error(`⚠️  设备报错: ${data.msg}`);
          this.emit('device-error', data);
          break;

        default:
          break;
      }
    } catch (e) {
      // 非 JSON 数据（ESP32 boot log 等），静默忽略
    }
  }

  /** 发送指令到设备 */
  send(data) {
    if (!this.connected || !this.port?.isOpen) {
      return false;
    }
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    this.port.write(json + '\n');
    return true;
  }

  /** 发送显示洞察指令 */
  showInsight(text) {
    return this.send({ type: 'cmd', action: 'show_insight', text });
  }

  /** 发送晚安模式指令 */
  goodnightMode(text = 'Sweet dreams...') {
    return this.send({ type: 'cmd', action: 'goodnight_mode', text });
  }

  /** 重置设备 */
  resetDevice() {
    return this.send({ type: 'cmd', action: 'reset' });
  }

  /** 获取最新传感器数据 */
  getLatest() {
    return this.latestData;
  }

  /** 获取设备状态概览 */
  getStatus() {
    return {
      connected: this.connected,
      deviceReady: this.deviceReady,
      deviceInfo: this.deviceInfo,
      latestData: this.latestData,
      stats: this.stats,
      port: SERIAL_CONFIG.path,
    };
  }

  /**
   * 将传感器数据转换为 wearable_data 格式
   * 用于替代 mock 数据，喂给 AI insight
   */
  toWearableData() {
    if (!this.latestData) return null;

    const avgActivity = this.history.length > 0
      ? this.history.reduce((sum, d) => sum + (d.activity || 0), 0) / this.history.length
      : this.latestData.activity || 1.0;

    return {
      steps: this.latestData.steps || 0,
      heart_rate: Math.round(60 + avgActivity * 20),
      stress: Math.round(Math.max(20, Math.min(95, avgActivity * 50))),
      noise_level: this.latestData.noise || 0,
      source: 'hardware',
      device_state: this.latestData.state,
    };
  }

  /** 关闭连接 */
  close() {
    if (this.port?.isOpen) {
      this.port.close();
    }
  }
}

// ========== 单例导出 ==========
export const serialService = new SerialService();
