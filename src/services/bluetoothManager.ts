// Web Bluetooth ambient type definitions for environments without @types/web-bluetooth
type BluetoothDevice = any;
type BluetoothRemoteGATTServer = any;
type BluetoothRemoteGATTCharacteristic = any;
type BluetoothRemoteGATTService = any;

// Web Bluetooth service and characteristic UUIDs for SMCE ESP32 telemetry
export const SMCE_BLE_CONFIG = {
  // Primary SMCE Telemetry Service
  SERVICE_UUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART / Custom Service
  // Characteristic for receiving sensor telemetry stream from ESP32 (Notify)
  TX_CHARACTERISTIC_UUID: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  // Characteristic for sending control commands to ESP32 (Write without response)
  RX_CHARACTERISTIC_UUID: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  DEVICE_NAME_PREFIX: 'SMCE_LADAKH',
};

export interface ESP32TelemetryPacket {
  eqTemp: number;       // Equipment temp °C
  batTemp: number;      // Battery temp °C
  humidity: number;     // % RH
  pressure: number;     // hPa
  voltage: number;      // V
  current: number;      // A
  heater: 'ON' | 'OFF'; // Physical relay status
  rssi?: number;
}

export type BluetoothConnectionStatus = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR'
  | 'UNSUPPORTED';

export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onTelemetryCallback: ((data: ESP32TelemetryPacket) => void) | null = null;
  private onStatusChangeCallback: ((status: BluetoothConnectionStatus, errorMsg?: string) => void) | null = null;
  private buffer: string = '';
  private simulatedMode: boolean = false;
  private simTimer: any = null;
  private simulatedHeaterState: 'ON' | 'OFF' = 'OFF';

  constructor() {
    this.handleDisconnection = this.handleDisconnection.bind(this);
    this.handleCharacteristicValueChanged = this.handleCharacteristicValueChanged.bind(this);
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isPermissionBlocked(): boolean {
    if (typeof document !== 'undefined') {
      const doc = document as any;
      if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
        try {
          return !doc.permissionsPolicy.allowsFeature('bluetooth');
        } catch {
          return false;
        }
      }
      if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
        try {
          return !doc.featurePolicy.allowsFeature('bluetooth');
        } catch {
          return false;
        }
      }
    }
    return false;
  }

  public setCallbacks(
    onTelemetry: (data: ESP32TelemetryPacket) => void,
    onStatusChange: (status: BluetoothConnectionStatus, errorMsg?: string) => void
  ) {
    this.onTelemetryCallback = onTelemetry;
    this.onStatusChangeCallback = onStatusChange;
  }

  public connectSimulatedHardware(name: string = 'SMCE_LADAKH_ESP32_SIM'): void {
    this.disconnect();
    this.simulatedMode = true;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('CONNECTED');
    }

    let temp = -17.2;
    let bTemp = -13.5;
    let volt = 3.76;
    let curr = 0.42;

    this.simTimer = setInterval(() => {
      if (!this.simulatedMode) return;

      if (this.simulatedHeaterState === 'ON') {
        temp = Math.min(15, temp + 0.4 + (Math.random() - 0.5) * 0.1);
        bTemp = Math.min(10, bTemp + 0.2 + (Math.random() - 0.5) * 0.05);
        curr = 1.68 + (Math.random() - 0.5) * 0.05;
        volt = Math.max(3.1, volt - 0.002);
      } else {
        temp = Math.max(-28, temp - 0.2 + (Math.random() - 0.5) * 0.1);
        bTemp = Math.max(-22, bTemp - 0.1 + (Math.random() - 0.5) * 0.05);
        curr = 0.38 + (Math.random() - 0.5) * 0.03;
        volt = Math.max(3.2, volt - 0.0002);
      }

      const packet: ESP32TelemetryPacket = {
        eqTemp: Number(temp.toFixed(1)),
        batTemp: Number(bTemp.toFixed(1)),
        humidity: Number((32.5 + (Math.random() - 0.5) * 0.6).toFixed(1)),
        pressure: Number((568.4 + (Math.random() - 0.5) * 0.4).toFixed(1)),
        voltage: Number(volt.toFixed(2)),
        current: Number(curr.toFixed(2)),
        heater: this.simulatedHeaterState,
      };

      if (this.onTelemetryCallback) {
        this.onTelemetryCallback(packet);
      }
    }, 1500);
  }

  public async connect(): Promise<boolean> {
    if (this.isPermissionBlocked()) {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(
          'ERROR',
          'Web Bluetooth is blocked by the iframe permissions policy in this preview window. Use "Simulate Hardware Link" below to test full ESP32 telemetry, or open this app in a standalone tab.'
        );
      }
      return false;
    }

    if (!this.isSupported()) {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(
          'UNSUPPORTED',
          'Web Bluetooth is not supported in this browser. Please use Google Chrome, Edge, or an Android Chromium browser with Bluetooth enabled.'
        );
      }
      return false;
    }

    try {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('CONNECTING');
      }

      // Request device with SMCE service or name prefix
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'SMCE' },
          { namePrefix: 'ESP32' },
        ],
        optionalServices: [
          SMCE_BLE_CONFIG.SERVICE_UUID,
          'generic_access',
          'battery_service',
          0xffe0, // common BLE serial modules
        ],
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnection);

      // Connect to GATT Server
      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) {
        throw new Error('Could not connect to GATT Server on ESP32');
      }

      // Retrieve primary service
      let service: BluetoothRemoteGATTService | null = null;
      try {
        service = await this.server.getPrimaryService(SMCE_BLE_CONFIG.SERVICE_UUID);
      } catch (err) {
        // Fallback: search for first available service
        const services = await this.server.getPrimaryServices();
        if (services.length > 0) {
          service = services[0];
        } else {
          throw new Error('No compatible BLE GATT service found on ESP32');
        }
      }

      if (!service) {
        throw new Error('Failed to obtain GATT telemetry service');
      }

      // Retrieve TX Characteristic (Notify from ESP32 -> Web)
      try {
        this.txCharacteristic = await service.getCharacteristic(SMCE_BLE_CONFIG.TX_CHARACTERISTIC_UUID);
      } catch (err) {
        // Fallback: find any notify characteristic
        const chars = await service.getCharacteristics();
        this.txCharacteristic = chars.find((c: any) => c.properties.notify || c.properties.indicate) || null;
      }

      if (this.txCharacteristic) {
        await this.txCharacteristic.startNotifications();
        this.txCharacteristic.addEventListener(
          'characteristicvaluechanged',
          this.handleCharacteristicValueChanged
        );
      }

      // Retrieve RX Characteristic (Web -> ESP32 Write for commands like HEATER_ON/OFF)
      try {
        this.rxCharacteristic = await service.getCharacteristic(SMCE_BLE_CONFIG.RX_CHARACTERISTIC_UUID);
      } catch (err) {
        const chars = await service.getCharacteristics();
        this.rxCharacteristic = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
      }

      this.simulatedMode = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('CONNECTED');
      }

      return true;
    } catch (error: any) {
      const isPolicyDisallowed =
        error?.name === 'SecurityError' ||
        error?.message?.toLowerCase().includes('permissions policy') ||
        error?.message?.toLowerCase().includes('disallowed');
      const isUserCancelled =
        error?.name === 'NotFoundError' ||
        error?.message?.toLowerCase().includes('user cancelled');

      if (isPolicyDisallowed) {
        console.warn('Web Bluetooth not allowed by iframe permissions policy:', error?.message);
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(
            'ERROR',
            'Web Bluetooth is blocked by the iframe permissions policy in this preview window. Use "Simulate Hardware Link" below to test full ESP32 telemetry, or open this app in a standalone tab.'
          );
        }
      } else if (isUserCancelled) {
        console.info('Bluetooth device pairing cancelled by user.');
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback('DISCONNECTED');
        }
      } else {
        console.warn('Bluetooth connection attempt:', error?.message || error);
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback('ERROR', error?.message || 'Connection failed');
        }
      }
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    this.simulatedMode = false;

    try {
      if (this.txCharacteristic) {
        try {
          await this.txCharacteristic.stopNotifications();
        } catch {
          // ignore
        }
      }
      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } catch (e) {
      console.warn('Error during disconnect', e);
    } finally {
      this.handleDisconnection();
    }
  }

  public getConnectedDeviceName(): string {
    if (this.simulatedMode) return 'SMCE_LADAKH_ESP32 (Simulated Link)';
    return this.device?.name || 'ESP32-SMCE';
  }

  public isSimulated(): boolean {
    return this.simulatedMode;
  }

  public async sendCommand(cmd: string): Promise<boolean> {
    if (this.simulatedMode) {
      if (cmd.includes('HEATER_ON')) {
        this.simulatedHeaterState = 'ON';
      } else if (cmd.includes('HEATER_OFF')) {
        this.simulatedHeaterState = 'OFF';
      }
      return true;
    }

    if (!this.rxCharacteristic) {
      console.warn('Cannot send command: BLE RX Characteristic unavailable');
      return false;
    }
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(cmd + '\n');
      if (this.rxCharacteristic.properties.writeWithoutResponse) {
        await this.rxCharacteristic.writeValueWithoutResponse(data);
      } else {
        await this.rxCharacteristic.writeValue(data);
      }
      return true;
    } catch (err) {
      console.warn('Failed to send BLE command:', err);
      return false;
    }
  }

  private handleDisconnection() {
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    this.simulatedMode = false;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('DISCONNECTED');
    }
  }

  private handleCharacteristicValueChanged(event: any) {
    const value: DataView = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const chunk = decoder.decode(value);

    // Append to stream buffer to handle fragmented packets over BLE MTU
    this.buffer += chunk;

    // Process complete newline-terminated JSON strings
    let newlineIdx: number;
    while ((newlineIdx = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, newlineIdx).trim();
      this.buffer = this.buffer.slice(newlineIdx + 1);

      if (!line) continue;

      this.parsePacket(line);
    }
  }

  private parsePacket(rawText: string) {
    try {
      const obj = JSON.parse(rawText);

      const safeNum = (v: any, fallback: number) => {
        const num = Number(v);
        return isNaN(num) || !isFinite(num) ? fallback : num;
      };

      const packet: ESP32TelemetryPacket = {
        eqTemp: safeNum(obj.eqTemp ?? obj.t_eq ?? obj.temp, -16.4),
        batTemp: safeNum(obj.batTemp ?? obj.t_bat ?? obj.btemp ?? obj.eqTemp, -12.0),
        humidity: safeNum(obj.humidity ?? obj.hum ?? obj.h, 32.0),
        pressure: safeNum(obj.pressure ?? obj.press ?? obj.p, 568.5),
        voltage: safeNum(obj.voltage ?? obj.volt ?? obj.v, 3.75),
        current: safeNum(obj.current ?? obj.curr ?? obj.i, 0.42),
        heater: obj.heater === 'ON' || obj.heater === 1 || obj.heat === 1 || obj.heat === 'ON' ? 'ON' : 'OFF',
      };

      if (this.onTelemetryCallback) {
        this.onTelemetryCallback(packet);
      }
    } catch {
      // Non-JSON or incomplete line
    }
  }
}

export const bleManager = new BluetoothManager();
