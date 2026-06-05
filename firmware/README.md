# Good-Night Firmware (M5StickC Plus2)

## 硬件信息
- **芯片**: ESP32-S3 (QFN56) revision v0.2
- **特性**: Wi-Fi, BT 5 (LE), 双核 240MHz, PSRAM 8MB
- **Flash**: 16MB SPI
- **串口**: COM5 (USB 原生，无需外部驱动)
- **MAC**: 44:1b:f6:c1:90:0c

## 开发环境
- PlatformIO IDE (VSCode 扩展)
- Framework: Arduino
- 依赖: M5StickCPlus2 库, ArduinoJson

## 编译烧录
```bash
# 编译
pio run

# 烧录
pio run --target upload

# 串口监控
pio device monitor
```

## 串口协议 (115200 baud, JSON per line)

### 上行 (设备 → 电脑)

**设备就绪:**
```json
{"type":"ready","device":"M5StickCPlus2","firmware":"good-night-v0.1","sensors":{"imu":true,"mic":true,"rtc":true}}
```

**传感器数据 (1Hz):**
```json
{"type":"sensor","ts":12345,"activity":1.02,"steps":150,"noise":23.5,"state":"monitoring","battery_v":3.85}
```

**按键事件:**
```json
{"type":"event","event":"button_press","action":"goodnight_trigger"}
```

### 下行 (电脑 → 设备)

**显示洞察文本:**
```json
{"type":"cmd","action":"show_insight","text":"今晚适合早睡，活动量偏低"}
```

**进入晚安模式:**
```json
{"type":"cmd","action":"goodnight_mode","text":"Good Night!"}
```

**重置:**
```json
{"type":"cmd","action":"reset"}
```

## 传感器用途

| 传感器 | 用途 | 对应字段 |
|--------|------|----------|
| IMU (MPU6886) | 步数/活动量 | `steps`, `activity` |
| PDM 麦克风 | 环境噪音水平 | `noise` |
| RTC (BM8563) | 作息时间追踪 | 后续版本 |
| 按键 (BtnA) | 触发晚安流程 | `event.goodnight_trigger` |
