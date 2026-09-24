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

  constructor() {
    this.handleDisconnection = this.handleDisconnection.bind(this);
    this.handleCharacteristicValueChanged = this.handleCharacteristicValueChanged.bind(this);
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public setCallbacks(
    onTelemetry: (data: ESP32TelemetryPacket) => void,
    onStatusChange: (status: BluetoothConnectionStatus, errorMsg?: string) => void
  ) {
    this.onTelemetryCallback = onTelemetry;
    this.onStatusChangeCallback = onStatusChange;
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(
          'UNSUPPORTED',
          'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or an Android Chromium browser with Bluetooth enabled.'
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

      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('CONNECTED');
      }

      return true;
    } catch (error: any) {
      console.error('Bluetooth connection failed:', error);
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback('ERROR', error.message || 'Connection cancelled or failed');
      }
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.txCharacteristic) {
        try {
          await this.txCharacteristic.stopNotifications();
        } catch (e) {
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
    return this.device?.name || 'ESP32-SMCE';
  }

  public async sendCommand(cmd: string): Promise<boolean> {
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
      console.error('Failed to send BLE command:', err);
      return false;
    }
  }

  private handleDisconnection() {
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
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
      // Expected JSON format from ESP32:
      // {"t_eq":-16.2,"t_bat":-12.8,"hum":34.5,"press":568.2,"volt":3.74,"curr":0.45,"heat":1}
      // OR standard key names:
      // {"eqTemp":-16.2,"batTemp":-12.8,"humidity":34.5,"pressure":568.2,"voltage":3.74,"current":0.45,"heater":"ON"}
      const obj = JSON.parse(rawText);

      const packet: ESP32TelemetryPacket = {
        eqTemp: obj.eqTemp !== undefined ? Number(obj.eqTemp) : Number(obj.t_eq ?? obj.temp ?? 0),
        batTemp: obj.batTemp !== undefined ? Number(obj.batTemp) : Number(obj.t_bat ?? obj.btemp ?? obj.eqTemp ?? 0),
        humidity: obj.humidity !== undefined ? Number(obj.humidity) : Number(obj.hum ?? obj.h ?? 0),
        pressure: obj.pressure !== undefined ? Number(obj.pressure) : Number(obj.press ?? obj.p ?? 0),
        voltage: obj.voltage !== undefined ? Number(obj.voltage) : Number(obj.volt ?? obj.v ?? 0),
        current: obj.current !== undefined ? Number(obj.current) : Number(obj.curr ?? obj.i ?? 0),
        heater: obj.heater === 'ON' || obj.heater === 1 || obj.heat === 1 || obj.heat === 'ON' ? 'ON' : 'OFF',
      };

      if (this.onTelemetryCallback) {
        this.onTelemetryCallback(packet);
      }
    } catch (e) {
      // Non-JSON or incomplete line
      console.debug('Raw non-JSON BLE packet:', rawText);
    }
  }
}

export const bleManager = new BluetoothManager();
