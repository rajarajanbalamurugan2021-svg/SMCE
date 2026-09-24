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
  | 'RECONNECTING'
  | 'CONNECTED'
  | 'ERROR'
  | 'UNSUPPORTED';

export interface ReconnectState {
  isReconnecting: boolean;
  attempt: number;
  maxAttempts: number;
  deviceName: string;
}

export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private lastDevice: BluetoothDevice | null = null;
  private lastDeviceName: string = '';
  private server: BluetoothRemoteGATTServer | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onTelemetryCallback: ((data: ESP32TelemetryPacket) => void) | null = null;
  private onStatusChangeCallback: ((status: BluetoothConnectionStatus, errorMsg?: string) => void) | null = null;
  private buffer: string = '';
  private simulatedMode: boolean = false;
  private simTimer: any = null;
  private simulatedHeaterState: 'ON' | 'OFF' = 'OFF';

  // Auto-reconnect state
  private autoReconnect: boolean = true;
  private maxReconnectAttempts: number = 5;
  private currentReconnectAttempt: number = 0;
  private reconnectTimeoutId: any = null;
  private isReconnecting: boolean = false;
  private userRequestedDisconnect: boolean = false;
  private reconnectDelayBaseMs: number = 2500;

  constructor() {
    this.handleDisconnection = this.handleDisconnection.bind(this);
    this.handleCharacteristicValueChanged = this.handleCharacteristicValueChanged.bind(this);

    // Restore last device name from storage if available
    if (typeof localStorage !== 'undefined') {
      const savedName = localStorage.getItem('smce_last_ble_device_name');
      if (savedName) {
        this.lastDeviceName = savedName;
      }
      const savedAutoReconnect = localStorage.getItem('smce_ble_auto_reconnect');
      if (savedAutoReconnect !== null) {
        this.autoReconnect = savedAutoReconnect === 'true';
      }
    }
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

  public setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('smce_ble_auto_reconnect', String(enabled));
    }
    if (!enabled && this.isReconnecting) {
      this.cancelReconnect();
    }
  }

  public isAutoReconnectEnabled(): boolean {
    return this.autoReconnect;
  }

  public getReconnectState(): ReconnectState {
    return {
      isReconnecting: this.isReconnecting,
      attempt: this.currentReconnectAttempt,
      maxAttempts: this.maxReconnectAttempts,
      deviceName: this.lastDeviceName || 'ESP32 Device',
    };
  }

  public cancelReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.isReconnecting = false;
    this.currentReconnectAttempt = 0;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('DISCONNECTED', 'Auto-reconnect cancelled.');
    }
  }

  public connectSimulatedHardware(name: string = 'SMCE_LADAKH_ESP32_SIM'): void {
    this.cancelReconnect();
    this.disconnect();
    this.simulatedMode = true;
    this.lastDeviceName = name;
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
    this.userRequestedDisconnect = false;
    this.cancelReconnect();

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

      // Store device reference for auto-reconnect
      this.lastDevice = this.device;
      this.lastDeviceName = this.device.name || 'SMCE_LADAKH_ESP32';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('smce_last_ble_device_name', this.lastDeviceName);
      }

      return await this.setupGattConnection(this.device);
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

  /**
   * Sets up GATT services and notification listeners on a BluetoothDevice
   */
  private async setupGattConnection(targetDevice: BluetoothDevice): Promise<boolean> {
    try {
      this.device = targetDevice;
      this.lastDevice = targetDevice;
      this.lastDeviceName = targetDevice.name || this.lastDeviceName || 'SMCE_ESP32';

      targetDevice.removeEventListener('gattserverdisconnected', this.handleDisconnection);
      targetDevice.addEventListener('gattserverdisconnected', this.handleDisconnection);

      // Connect to GATT Server
      this.server = await targetDevice.gatt?.connect();
      if (!this.server) {
        throw new Error('Could not connect to GATT Server on ESP32');
      }

      // Retrieve primary service
      let service: BluetoothRemoteGATTService | null = null;
      try {
        service = await this.server.getPrimaryService(SMCE_BLE_CONFIG.SERVICE_UUID);
      } catch {
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
      } catch {
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
      } catch {
        const chars = await service.getCharacteristics();
        this.rxCharacteristic = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
      }

      this.simulatedMode = false;
      this.isReconnecting = false;
      this.currentReconnectAttempt = 0;

      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('CONNECTED');
      }

      return true;
    } catch (err: any) {
      console.warn('GATT setup failed:', err?.message || err);
      throw err;
    }
  }

  /**
   * Schedules and executes an auto-reconnect attempt to the last known ESP32 device
   */
  private startAutoReconnect(): void {
    if (this.userRequestedDisconnect || !this.autoReconnect) {
      this.isReconnecting = false;
      this.currentReconnectAttempt = 0;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('DISCONNECTED');
      }
      return;
    }

    if (this.currentReconnectAttempt >= this.maxReconnectAttempts) {
      this.isReconnecting = false;
      this.currentReconnectAttempt = 0;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(
          'DISCONNECTED',
          `Auto-reconnect failed after ${this.maxReconnectAttempts} attempts. ESP32 may be powered off or out of range.`
        );
      }
      return;
    }

    this.currentReconnectAttempt++;
    this.isReconnecting = true;

    const deviceLabel = this.lastDevice?.name || this.lastDeviceName || 'ESP32 device';
    // Backoff delay: 2.5s, 4s, 5.5s, 7s...
    const delay = Math.min(8000, this.reconnectDelayBaseMs + (this.currentReconnectAttempt - 1) * 1500);

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(
        'RECONNECTING',
        `Signal lost. Reconnecting to ${deviceLabel} (attempt ${this.currentReconnectAttempt}/${this.maxReconnectAttempts}) in ${(delay / 1000).toFixed(1)}s...`
      );
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectTimeoutId = setTimeout(async () => {
      await this.executeReconnectAttempt();
    }, delay);
  }

  /**
   * Attempts to re-establish the connection to the last known ESP32 device
   */
  private async executeReconnectAttempt(): Promise<boolean> {
    if (this.userRequestedDisconnect || !this.autoReconnect) {
      this.isReconnecting = false;
      return false;
    }

    let target = this.lastDevice || this.device;

    // If target device object is missing, try modern navigator.bluetooth.getDevices()
    if (!target && typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        const bt = navigator.bluetooth as any;
        if (typeof bt.getDevices === 'function') {
          const permitted = await bt.getDevices();
          if (permitted && permitted.length > 0) {
            target = permitted.find((d: any) =>
              d.name?.startsWith('SMCE') || d.name?.startsWith('ESP32')
            ) || permitted[0];
          }
        }
      } catch {
        // Ignored if getDevices is not permitted
      }
    }

    if (!target) {
      console.warn('Cannot auto-reconnect: No prior Bluetooth device reference found.');
      this.isReconnecting = false;
      this.currentReconnectAttempt = 0;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('DISCONNECTED', 'No prior ESP32 device remembered. Please click Pair Real ESP32.');
      }
      return false;
    }

    try {
      console.info(`Attempting auto-reconnect to ${target.name || 'ESP32'} (${this.currentReconnectAttempt}/${this.maxReconnectAttempts})...`);
      const success = await this.setupGattConnection(target);
      if (success) {
        console.info('Auto-reconnect successful!');
        return true;
      }
    } catch (err: any) {
      console.warn(`Auto-reconnect attempt ${this.currentReconnectAttempt} failed:`, err?.message || err);
      // Try next attempt
      this.startAutoReconnect();
      return false;
    }

    return false;
  }

  public async retryReconnectNow(): Promise<boolean> {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    return await this.executeReconnectAttempt();
  }

  public async disconnect(): Promise<void> {
    this.userRequestedDisconnect = true;
    this.cancelReconnect();

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
    return this.device?.name || this.lastDeviceName || 'ESP32-SMCE';
  }

  public getLastDeviceName(): string {
    return this.lastDeviceName;
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

    // Check if auto-reconnect should trigger
    if (!this.userRequestedDisconnect && this.autoReconnect && (this.lastDevice || this.device)) {
      console.info('GATT connection disconnected unexpectedly. Starting auto-reconnect...');
      this.startAutoReconnect();
    } else {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('DISCONNECTED');
      }
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
