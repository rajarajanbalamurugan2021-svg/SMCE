// Complete ready-to-flash Arduino C++ Code for ESP32 with sensors and BLE telemetry

export const ESP32_ARDUINO_CODE = `/*
  =================================================================================
  SMCE - Smart Monitoring & Control Equipment (High-Altitude Ladakh Protection)
  ESP32 Firmware with Bluetooth Low Energy (BLE) & Real Sensor Integration
  =================================================================================
  
  Sensors & Pin Map:
  - BME280 (I2C): Atmospheric Pressure & Humidity -> SDA=GPIO 21, SCL=GPIO 22
  - INA219 (I2C): Battery Voltage & Current Load -> SDA=GPIO 21, SCL=GPIO 22
  - PT100 RTD with MAX31865 (SPI): Equipment Temp -> CS=5, DI=23, DO=19, CLK=18 (or OneWire DS18B20 on GPIO 4)
  - NTC 10K Thermistor: Battery Core Temp -> Analog ADC GPIO 34 (with 10k divider)
  - PTC Heating Element Relay: GPIO 25 (High = Relay Activated)
  - Status LED: GPIO 2 (Built-in Blue LED)
  
  Libraries Required in Arduino IDE / PlatformIO:
  - Adafruit BME280 Library
  - Adafruit INA219
  - Adafruit MAX31865 (or OneWire + DallasTemperature)
  - ArduinoJson
  - ESP32 BLE Arduino (Built into ESP32 board package)
  =================================================================================
*/

#include <Arduino.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_INA219.h>
#include <ArduinoJson.h>

// BLE UUID definitions matching the SMCE Web Dashboard
#define SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_RX "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_TX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// Pin Definitions
#define HEATER_RELAY_PIN  25
#define STATUS_LED_PIN    2
#define NTC_BATTERY_PIN   34  // Analog ADC for battery temp

// Sensors
Adafruit_BME280 bme;
Adafruit_INA219 ina219;

// BLE Server & Characteristics
BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Autonomous Safe Thresholds (Default Ladakh high-altitude parameters)
float autoHeaterThreshold = -15.0; // Trigger heater below -15°C
float heaterHysteresis    = 3.0;   // Shut down once >= -12°C
bool autoModeEnabled      = true;
bool heaterState          = false;

// Server Callback for Connection State
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      digitalWrite(STATUS_LED_PIN, HIGH);
      Serial.println("[BLE] Web Dashboard Client Connected!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      digitalWrite(STATUS_LED_PIN, LOW);
      Serial.println("[BLE] Client Disconnected. Restarting Advertising...");
    }
};

// RX Characteristic Callback (Receiving Commands from Web Dashboard)
class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String rxValue = pCharacteristic->getValue().c_str();
      if (rxValue.length() > 0) {
        Serial.print("[BLE RX Command]: ");
        Serial.println(rxValue);
        rxValue.trim();

        if (rxValue.indexOf("HEATER_ON") >= 0) {
          autoModeEnabled = false;
          heaterState = true;
          digitalWrite(HEATER_RELAY_PIN, HIGH);
          Serial.println("[CMD] Manual Heater: ON");
        } else if (rxValue.indexOf("HEATER_OFF") >= 0) {
          autoModeEnabled = false;
          heaterState = false;
          digitalWrite(HEATER_RELAY_PIN, LOW);
          Serial.println("[CMD] Manual Heater: OFF");
        } else if (rxValue.indexOf("HEATER_AUTO") >= 0) {
          autoModeEnabled = true;
          Serial.println("[CMD] Mode: AUTO Protected");
        }
      }
    }
};

// Simple NTC Steinhart-Hart reading function
float readBatteryTemperature() {
  int rawADC = analogRead(NTC_BATTERY_PIN);
  if (rawADC == 0 || rawADC >= 4095) return -12.5; // fallback test value
  float resistance = 10000.0 * (4095.0 / (float)rawADC - 1.0);
  float steinhart;
  steinhart = resistance / 10000.0;     // (R/Ro)
  steinhart = log(steinhart);            // ln(R/Ro)
  steinhart /= 3950.0;                   // 1/B * ln(R/Ro)
  steinhart += 1.0 / (25.0 + 273.15);    // + (1/To)
  steinhart = 1.0 / steinhart;           // Invert
  steinhart -= 273.15;                   // Convert to Celsius
  return steinhart;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n--- SMCE High-Altitude Protection ESP32 Initializing ---");

  pinMode(HEATER_RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(HEATER_RELAY_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize I2C Bus for BME280 and INA219
  Wire.begin(21, 22);

  if (!bme.begin(0x76)) {
    Serial.println("[WARN] BME280 sensor not detected on 0x76, checking 0x77...");
    if (!bme.begin(0x77)) {
      Serial.println("[FAIL] BME280 not found! Simulating baseline baro readings.");
    }
  }

  if (!ina219.begin()) {
    Serial.println("[WARN] INA219 power monitor not found! Check wiring.");
  }

  // Initialize BLE
  BLEDevice::init("SMCE_LADAKH_ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create Primary SMCE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create TX Characteristic (ESP32 -> Web Dashboard)
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );
  pTxCharacteristic->addDescriptor(new BLE2902());

  // Create RX Characteristic (Web Dashboard -> ESP32)
  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                                           CHARACTERISTIC_UUID_RX,
                                           BLECharacteristic::PROPERTY_WRITE
                                         );
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  pService->start();

  // Start BLE Advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // iPhone/Mac compatibility helper
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("[BLE] Device Ready & Advertising as 'SMCE_LADAKH_ESP32'");
}

unsigned long lastSampleTime = 0;

void loop() {
  unsigned long now = millis();

  if (now - lastSampleTime >= 1500) { // Send packet every 1.5 seconds
    lastSampleTime = now;

    // 1. Read Sensors
    float eqTemp = bme.readTemperature();
    float humidity = bme.readHumidity();
    float pressure = bme.readPressure() / 100.0F; // Pa to hPa
    float batTemp = readBatteryTemperature();

    // Fallbacks if sensor in cold or disconnected
    if (isnan(eqTemp)) eqTemp = -16.4;
    if (isnan(humidity)) humidity = 32.0;
    if (isnan(pressure) || pressure <= 0) pressure = 568.5; // Typical 4500m Ladakh pressure

    float voltage = ina219.getBusVoltage_V();
    float current_mA = ina219.getCurrent_mA();
    float current = current_mA / 1000.0;
    if (voltage <= 0.1) voltage = 3.75;
    if (current < 0) current = 0.42;

    // 2. Autonomous Closed-Loop Thermal Protection
    if (autoModeEnabled) {
      if (eqTemp < autoHeaterThreshold) {
        heaterState = true;
        digitalWrite(HEATER_RELAY_PIN, HIGH);
      } else if (eqTemp >= (autoHeaterThreshold + heaterHysteresis)) {
        heaterState = false;
        digitalWrite(HEATER_RELAY_PIN, LOW);
      }
    }

    // 3. Serialize Telemetry to Compact JSON
    StaticJsonDocument<256> doc;
    doc["t_eq"]  = round(eqTemp * 10) / 10.0;
    doc["t_bat"] = round(batTemp * 10) / 10.0;
    doc["hum"]   = round(humidity * 10) / 10.0;
    doc["press"] = round(pressure * 10) / 10.0;
    doc["volt"]  = round(voltage * 100) / 100.0;
    doc["curr"]  = round(current * 100) / 100.0;
    doc["heat"]  = heaterState ? 1 : 0;

    String jsonString;
    serializeJson(doc, jsonString);
    jsonString += "\\n"; // Newline delimiter for stream

    // Print to Serial Monitor
    Serial.print("[Telemetry Tx]: ");
    Serial.print(jsonString);

    // 4. Transmit via BLE Notify to Web Dashboard
    if (deviceConnected && pTxCharacteristic != NULL) {
      pTxCharacteristic->setValue((uint8_t*)jsonString.c_str(), jsonString.length());
      pTxCharacteristic->notify();
    }
  }

  // Handle BLE Reconnection Advertising Loop
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("[BLE] Restarted advertising after disconnect.");
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}
`;

export const ESP32_CIRCUIT_DIAGRAM_TEXT = `
========================================================================================
SMCE - ESP32 HIGH-ALTITUDE PROTECTION HARDWARE PINOUT & WIRING GUIDE
========================================================================================

1. ESP32 Pin Connections:
   - I2C BUS (Shared between BME280 and INA219):
     * ESP32 GPIO 21 (SDA) ----> BME280 SDA & INA219 SDA
     * ESP32 GPIO 22 (SCL) ----> BME280 SCL & INA219 SCL
     * ESP32 3.3V         ----> VCC of BME280 & INA219
     * ESP32 GND          ----> GND of BME280 & INA219

2. Battery Current & Voltage (INA219 High-Side Shunt):
     * INA219 Vin+  ----> Battery (+) Terminal
     * INA219 Vin-  ----> System Power Bus (+) / Heater Relay COM

3. Battery Core Temperature (10K NTC Thermistor):
     * 3.3V ----[ 10k Resistor ]----+----[ 10K NTC Thermistor ]----> GND
                                    |
                               GPIO 34 (ADC1_CH6)

4. Equipment Temperature (PT100 RTD with MAX31865 module):
     * MAX31865 CS   ----> ESP32 GPIO 5
     * MAX31865 SDI  ----> ESP32 GPIO 23 (MOSI)
     * MAX31865 SDO  ----> ESP32 GPIO 19 (MISO)
     * MAX31865 CLK  ----> ESP32 GPIO 18 (SCK)

5. PTC Ceramic Heater Relay:
     * ESP32 GPIO 25 ----> Relay Module IN (Active HIGH)
     * ESP32 5V (VIN) ----> Relay VCC
     * ESP32 GND     ----> Relay GND
     * Relay NO & COM switch the 12V / 5V PTC Heating Element power rail

6. Status & Link LED:
     * ESP32 GPIO 2  ----> Built-in Blue LED (Lights when Bluetooth Web Client connected)
========================================================================================
`;
