import dgram from 'react-native-udp';
import NetInfo from '@react-native-community/netinfo';
import {Buffer} from '@craftzdog/react-native-buffer';

const DISCOVERY_PORT = 8888;
const MESSAGE_PORT = 8889;
const BROADCAST_ADDR = '255.255.255.255';
const DEVICE_TTL_MS = 30000;
const DISCOVERY_INTERVAL_MS = 5000;

class Udp {
  constructor(isReceiver = false) {
    this.isReceiver = isReceiver;
    this.deviceId = Math.random().toString(36).substring(2, 12);
    this.discoverySocket = null;
    this.messageSocket = null;
    this.discoveredDevices = new Map();
    this.onMessageReceived = null;
    this.onDeviceDiscovered = null;
    this.timer = null;
    this.isInitializing = false;
    this.isInitialized = false;
    this.isClosed = false;
  }

  async getLocalIpAddress() {
    try {
      const networkInfo = await NetInfo.fetch();
      return networkInfo?.details?.ipAddress || null;
    } catch (error) {
      console.warn('Unable to read local IP address:', error);
      return null;
    }
  }

  createSocket(label) {
    const socket = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });

    socket.on('error', error => {
      console.warn(`${label} socket error:`, error);
      // A socket error can leave the native socket unusable. Close both
      // sockets so callers cannot continue using a half-initialized session.
      this.cleanup();
    });

    return socket;
  }

  bindSocket(socket, port) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const onError = error => {
        if (settled) {
          return;
        }
        settled = true;
        socket.removeListener?.('error', onError);
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      socket.once('error', onError);

      try {
        socket.bind(port, () => {
          if (settled) {
            return;
          }
          settled = true;
          socket.removeListener?.('error', onError);
          resolve();
        });
      } catch (error) {
        onError(error);
      }
    });
  }

  async init() {
    if (this.isInitialized) {
      return;
    }
    if (this.isInitializing) {
      throw new Error('UDP helper initialization is already in progress');
    }
    if (this.isClosed) {
      throw new Error('UDP helper has been closed');
    }

    this.isInitializing = true;

    try {
      this.discoverySocket = this.createSocket('Discovery');
      this.messageSocket = this.createSocket('Message');

      this.discoverySocket.on('message', (message, remoteInfo) => {
        this.handleDiscoveryMessage(message, remoteInfo);
      });

      this.messageSocket.on('message', (message, remoteInfo) => {
        this.handleIncomingMessage(message, remoteInfo);
      });

      await this.bindSocket(this.discoverySocket, DISCOVERY_PORT);
      if (this.isClosed) {
        throw new Error('UDP helper was closed during initialization');
      }

      await this.bindSocket(
        this.messageSocket,
        this.isReceiver ? MESSAGE_PORT : 0,
      );
      if (this.isReceiver) {
        this.discoverySocket.setBroadcast(true);
      }
      if (this.isClosed) {
        throw new Error('UDP helper was closed during initialization');
      }

      this.isInitialized = true;
      if (this.isReceiver) {
        this.startDiscoveryBroadcast();
      }
    } catch (error) {
      this.cleanup();
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  handleDiscoveryMessage(message, remoteInfo) {
    if (this.isClosed) {
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      if (
        data.type === 'DISCOVERY_REQUEST' &&
        !this.isReceiver &&
        typeof data.deviceId === 'string' &&
        data.deviceId.length > 0
      ) {
        this.discoveredDevices.set(data.deviceId, {
          ip: remoteInfo.address,
          lastSeen: Date.now(),
        });

        this.sendDiscoveryResponse(remoteInfo.address);
        this.notifyDiscoveredDevices();
      } else if (
        data.type === 'DISCOVERY_RESPONSE' &&
        this.isReceiver &&
        typeof data.deviceId === 'string'
      ) {
        console.log('Received response from sender:', data.deviceId);
      }
    } catch (error) {
      console.warn('Ignoring invalid UDP discovery message:', error);
    }
  }

  handleIncomingMessage(message) {
    if (this.isClosed) {
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      if (
        data.type === 'MESSAGE' &&
        data.targetId === this.deviceId &&
        typeof this.onMessageReceived === 'function'
      ) {
        this.onMessageReceived(data.content, data.fromId);
      }
    } catch (error) {
      console.warn('Ignoring invalid UDP message:', error);
    }
  }

  notifyDiscoveredDevices() {
    if (typeof this.onDeviceDiscovered !== 'function') {
      return;
    }

    const devices = Array.from(this.discoveredDevices.entries()).map(
      ([deviceId, deviceInfo]) => ({
        deviceId,
        ...deviceInfo,
      }),
    );
    this.onDeviceDiscovered(devices);
  }

  sendUdpMessage(socket, message, port, host) {
    if (this.isClosed || !socket) {
      return false;
    }

    const payload = Buffer.from(
      typeof message === 'string' ? message : JSON.stringify(message),
      'utf-8',
    );

    try {
      socket.send(payload, 0, payload.length, port, host, error => {
        if (error) {
          console.warn('UDP send failed:', error);
        }
      });
      return true;
    } catch (error) {
      console.warn('UDP send threw an error:', error);
      return false;
    }
  }

  startDiscoveryBroadcast() {
    if (
      this.isClosed ||
      !this.isInitialized ||
      !this.isReceiver ||
      this.timer
    ) {
      return;
    }

    const broadcast = () => {
      if (this.isClosed || !this.discoverySocket) {
        return;
      }

      this.sendUdpMessage(
        this.discoverySocket,
        {
          type: 'DISCOVERY_REQUEST',
          deviceId: this.deviceId,
        },
        DISCOVERY_PORT,
        BROADCAST_ADDR,
      );

      const now = Date.now();
      let changed = false;
      for (const [deviceId, device] of this.discoveredDevices.entries()) {
        if (now - device.lastSeen > DEVICE_TTL_MS) {
          this.discoveredDevices.delete(deviceId);
          changed = true;
        }
      }
      if (changed) {
        this.notifyDiscoveredDevices();
      }
    };

    broadcast();
    this.timer = setInterval(broadcast, DISCOVERY_INTERVAL_MS);
  }

  sendDiscoveryResponse(targetIp) {
    if (typeof targetIp !== 'string' || targetIp.length === 0) {
      return false;
    }

    return this.sendUdpMessage(
      this.discoverySocket,
      {
        type: 'DISCOVERY_RESPONSE',
        deviceId: this.deviceId,
      },
      DISCOVERY_PORT,
      targetIp,
    );
  }

  sendMessage(targetDeviceId, content) {
    if (!this.isInitialized || this.isClosed || !this.messageSocket) {
      return false;
    }

    const targetDevice = this.discoveredDevices.get(targetDeviceId);
    if (!targetDevice?.ip) {
      console.warn('UDP target device not found:', targetDeviceId);
      return false;
    }

    return this.sendUdpMessage(
      this.messageSocket,
      {
        type: 'MESSAGE',
        fromId: this.deviceId,
        targetId: targetDeviceId,
        content,
      },
      MESSAGE_PORT,
      targetDevice.ip,
    );
  }

  setMessageCallback(callback) {
    this.onMessageReceived =
      typeof callback === 'function' ? callback : null;
  }

  setDeviceDiscoveryCallback(callback) {
    this.onDeviceDiscovered =
      typeof callback === 'function' ? callback : null;
  }

  cleanup() {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;
    this.isInitialized = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const sockets = [this.discoverySocket, this.messageSocket];
    this.discoverySocket = null;
    this.messageSocket = null;

    sockets.forEach(socket => {
      if (socket) {
        try {
          socket.close();
        } catch (error) {
          console.warn('Unable to close UDP socket:', error);
        }
      }
    });

    this.discoveredDevices.clear();
  }
}

export default Udp;
