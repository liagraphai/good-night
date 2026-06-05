/**
 * Good-Night × M5StopWatch 固件 v0.4
 *
 * 使用 M5Unified 库（自动检测 M5StopWatch 硬件）
 *
 * 功能：
 * 1. IMU 数据采集 → 活动量/步数估算
 * 2. 麦克风采集 → 环境噪音水平
 * 3. 按键事件 → 触发"准备睡觉"
 * 4. 屏幕显示 → 状态反馈
 *
 * 串口协议：115200 baud, JSON per line
 */

#include <M5Unified.h>
#include <ArduinoJson.h>

// ========== 配置 ==========
#define SENSOR_INTERVAL_MS  1000   // 传感器采样间隔 (1Hz)
#define STEP_THRESHOLD      1.3f   // 步数检测阈值 (G)
#define MIC_SAMPLE_COUNT    256

// ========== 状态变量 ==========
unsigned long lastSensorTime = 0;
unsigned long stepCount = 0;
float lastMagnitude = 0;
bool stepState = false;

enum DeviceState {
    STATE_IDLE,
    STATE_MONITORING,
    STATE_GOODNIGHT
};
DeviceState currentState = STATE_MONITORING;

// ========== 函数声明 ==========
void readIMU(float &activity, bool &stepDetected);
float readNoise();
void sendSensorData(float activity, float noise);
void handleSerialInput();
void updateDisplay();
void handleButton();

// ========== 主程序 ==========
void setup() {
    auto cfg = M5.config();
    cfg.serial_baudrate = 115200;
    M5.begin(cfg);

    delay(200);

    // 打印硬件检测结果
    Serial.printf("{\"type\":\"boot\",\"board\":%d,\"imu\":%s,\"mic\":%s}\n",
        (int)M5.getBoard(),
        M5.Imu.isEnabled() ? "true" : "false",
        M5.Mic.isEnabled() ? "true" : "false");

    // 初始化麦克风
    if (M5.Mic.isEnabled()) {
        auto mic_cfg = M5.Mic.config();
        mic_cfg.sample_rate = 16000;
        M5.Mic.config(mic_cfg);
        M5.Mic.begin();
    }

    // 屏幕初始化 + 强制开启背光
    if (M5.Display.width() > 0) {
        M5.Display.setBrightness(200);  // 强制背光亮度 (0-255)
        M5.Display.wakeup();
        M5.Display.setRotation(0);      // M5StopWatch 圆形屏幕用默认方向
        M5.Display.fillScreen(TFT_WHITE); // 先白屏确认屏幕工作
        delay(500);
        M5.Display.fillScreen(TFT_BLACK);
        M5.Display.setTextColor(TFT_WHITE);
        M5.Display.setTextSize(3);
        M5.Display.setCursor(120, 180);
        M5.Display.println("Good Night");
        M5.Display.setTextSize(2);
        M5.Display.setCursor(140, 240);
        M5.Display.printf("Board: %d", (int)M5.getBoard());
        M5.Display.setCursor(140, 270);
        M5.Display.printf("IMU: %s", M5.Imu.isEnabled() ? "OK" : "N/A");
        M5.Display.setCursor(140, 300);
        M5.Display.printf("Mic: %s", M5.Mic.isEnabled() ? "OK" : "N/A");
    }

    // 发送设备就绪信号
    JsonDocument doc;
    doc["type"] = "ready";
    doc["device"] = "M5StopWatch";
    doc["firmware"] = "good-night-v0.4";
    doc["board_id"] = (int)M5.getBoard();
    doc["display_w"] = M5.Display.width();
    doc["display_h"] = M5.Display.height();
    doc["sensors"]["imu"] = M5.Imu.isEnabled();
    doc["sensors"]["mic"] = M5.Mic.isEnabled();
    serializeJson(doc, Serial);
    Serial.println();

    delay(2000);
}

void loop() {
    M5.update();
    handleButton();
    handleSerialInput();

    unsigned long now = millis();
    if (now - lastSensorTime >= SENSOR_INTERVAL_MS) {
        lastSensorTime = now;

        float activity;
        bool stepDetected;
        readIMU(activity, stepDetected);
        if (stepDetected) stepCount++;

        float noise = readNoise();

        sendSensorData(activity, noise);
        updateDisplay();
    }
}

// ========== IMU ==========
void readIMU(float &activity, bool &stepDetected) {
    if (!M5.Imu.isEnabled()) {
        activity = 0;
        stepDetected = false;
        return;
    }

    auto data = M5.Imu.getImuData();
    float ax = data.accel.x;
    float ay = data.accel.y;
    float az = data.accel.z;

    float magnitude = sqrt(ax * ax + ay * ay + az * az);
    activity = magnitude;

    stepDetected = false;
    if (!stepState && magnitude > STEP_THRESHOLD) {
        stepState = true;
        stepDetected = true;
    } else if (stepState && magnitude < (STEP_THRESHOLD - 0.2f)) {
        stepState = false;
    }

    lastMagnitude = magnitude;
}

// ========== 麦克风噪音采集 (M5Unified API) ==========
float readNoise() {
    if (!M5.Mic.isEnabled()) return 0;

    int16_t buf[MIC_SAMPLE_COUNT];
    if (!M5.Mic.record(buf, MIC_SAMPLE_COUNT, 16000)) return 0;

    // 等待录制完成
    while (M5.Mic.isRecording()) {
        delay(1);
    }

    // 计算 RMS
    long long sumSquares = 0;
    for (int i = 0; i < MIC_SAMPLE_COUNT; i++) {
        sumSquares += (long long)buf[i] * buf[i];
    }
    float rms = sqrt((float)sumSquares / MIC_SAMPLE_COUNT);
    float noise = (rms / 32767.0f) * 100.0f;
    return constrain(noise, 0, 100);
}

// ========== 发送传感器数据 ==========
void sendSensorData(float activity, float noise) {
    static int msgCount = 0;
    msgCount++;

    JsonDocument doc;
    doc["type"] = "sensor";
    doc["ts"] = millis();
    doc["activity"] = round(activity * 100) / 100.0;
    doc["steps"] = stepCount;
    doc["noise"] = round(noise * 10) / 10.0;
    doc["state"] = (currentState == STATE_MONITORING) ? "monitoring"
                 : (currentState == STATE_GOODNIGHT) ? "goodnight" : "idle";

    int32_t bat = M5.Power.getBatteryLevel();
    doc["battery_pct"] = bat;

    // 每 10 条输出一次设备诊断
    if (msgCount % 10 == 1) {
        doc["diag"]["board"] = (int)M5.getBoard();
        doc["diag"]["display_w"] = M5.Display.width();
        doc["diag"]["display_h"] = M5.Display.height();
        doc["diag"]["imu"] = M5.Imu.isEnabled();
        doc["diag"]["mic"] = M5.Mic.isEnabled();
    }

    serializeJson(doc, Serial);
    Serial.println();
}

// ========== 串口指令处理 ==========
void handleSerialInput() {
    if (Serial.available()) {
        String line = Serial.readStringUntil('\n');
        line.trim();
        if (line.length() == 0) return;

        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, line);
        if (err) return;

        const char* type = doc["type"];
        if (!type) return;

        if (strcmp(type, "cmd") == 0) {
            const char* action = doc["action"];
            if (!action) return;

            if (strcmp(action, "show_insight") == 0) {
                const char* text = doc["text"] | "";
                M5.Display.fillScreen(TFT_BLACK);
                M5.Display.setCursor(5, 5);
                M5.Display.setTextSize(1);
                M5.Display.setTextColor(TFT_CYAN);
                M5.Display.println("~ Good Night ~");
                M5.Display.setTextColor(TFT_WHITE);
                M5.Display.setCursor(5, 25);
                M5.Display.println(text);
            }
            else if (strcmp(action, "goodnight_mode") == 0) {
                currentState = STATE_GOODNIGHT;
                M5.Display.fillScreen(0x000F);
                M5.Display.setTextColor(0xFFE0);
                M5.Display.setTextSize(2);
                M5.Display.setCursor(20, 50);
                M5.Display.println("Good Night");
                M5.Display.setTextSize(1);
                M5.Display.setCursor(20, 80);
                M5.Display.println(doc["text"] | "Sweet dreams...");
            }
            else if (strcmp(action, "reset") == 0) {
                currentState = STATE_MONITORING;
                stepCount = 0;
            }
        }
    }
}

// ========== 按键处理 ==========
void handleButton() {
    if (M5.BtnA.wasPressed()) {
        JsonDocument doc;
        doc["type"] = "event";
        doc["event"] = "button_press";
        doc["action"] = "goodnight_trigger";
        serializeJson(doc, Serial);
        Serial.println();

        M5.Display.fillScreen(TFT_NAVY);
        M5.Display.setTextColor(TFT_WHITE);
        M5.Display.setTextSize(2);
        M5.Display.setCursor(10, 50);
        M5.Display.println("Preparing...");
    }

    if (M5.BtnB.wasPressed()) {
        stepCount = 0;
        JsonDocument doc;
        doc["type"] = "event";
        doc["event"] = "step_reset";
        serializeJson(doc, Serial);
        Serial.println();
    }
}

// ========== 屏幕状态更新 ==========
void updateDisplay() {
    if (currentState != STATE_MONITORING) return;
    if (M5.Display.width() == 0) return;

    M5.Display.fillScreen(TFT_BLACK);

    // 标题
    M5.Display.setTextSize(1);
    M5.Display.setCursor(5, 5);
    M5.Display.setTextColor(TFT_CYAN);
    M5.Display.println("Good Night Monitor");

    // 数据
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(5, 25);
    M5.Display.printf("Steps: %lu", stepCount);

    M5.Display.setCursor(5, 40);
    M5.Display.printf("Activity: %.2f G", lastMagnitude);

    M5.Display.setCursor(5, 55);
    M5.Display.printf("Noise: %.0f%%", 0.0f);  // will be updated

    int32_t bat = M5.Power.getBatteryLevel();
    M5.Display.setCursor(5, 70);
    M5.Display.printf("Battery: %d%%", bat);

    // 提示
    M5.Display.setCursor(5, 90);
    M5.Display.setTextColor(TFT_YELLOW);
    M5.Display.println("[A] Start Good Night");
}
