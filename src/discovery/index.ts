import dgram from 'react-native-udp';
import {Buffer} from '@craftzdog/react-native-buffer';
import {parseMessage, formatDiscoveryMessage} from './message';
import {
  DeviceStatus,
  DeviceType,
  DiscoveryVersions,
  DiscoveryPort,
} from '../common';
import type {DeviceAddress, DiscoveryVersion} from '../types';

const BROADCAST_ADDRESS = '255.255.255.255';
const DISCOVERY_TIMEOUT_MS = 2000;

export interface IDiscoveredDevice {
  address: DeviceAddress;
  hostRequestPort: number;
  discoveryVersion: DiscoveryVersion;
  systemVersion: string;
  id: string;
  name: string;
  status: DeviceStatus;
  type: DeviceType;
}

export const discoverDevices = (
  isPS5: boolean,
): Promise<IDiscoveredDevice[]> => {
  return new Promise((resolve, reject) => {
    const version = isPS5 ? DiscoveryVersions.PS5 : DiscoveryVersions.PS4;
    const port = isPS5 ? DiscoveryPort.PS5 : DiscoveryPort.PS4;
    const socket = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });

    const devices: IDiscoveredDevice[] = [];
    let isFinished = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const closeSocket = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      try {
        socket.close();
      } catch (_) {
        // The socket may already have been closed by the native module.
      }
    };

    const finish = (error?: Error) => {
      if (isFinished) {
        return;
      }
      isFinished = true;
      closeSocket();
      if (error) {
        reject(error);
      } else {
        resolve(devices);
      }
    };

    socket.on('error', (error: Error) => {
      finish(error);
    });

    socket.on('message', (raw: Buffer, rinfo: any) => {
      if (isFinished) {
        return;
      }
      try {
        const parsed: any = parseMessage(raw);
        if (parsed.type !== 'DEVICE' || !parsed['host-id']) {
          return;
        }

        const device: IDiscoveredDevice = {
          address: rinfo,
          hostRequestPort: parseInt(parsed['host-request-port'], 10) || 0,
          discoveryVersion:
            (parsed['device-discovery-protocol-version'] as DiscoveryVersion) ??
            version,
          systemVersion: parsed['system-version'] || '',
          id: parsed['host-id'],
          name: parsed['host-name'] || 'PlayStation',
          status: parsed.status as DeviceStatus,
          type: parsed['host-type'] as DeviceType,
        };

        if (!devices.some(item => item.id === device.id)) {
          devices.push(device);
        }
      } catch (error) {
        // Ignore malformed or unrelated LAN packets; keep discovery running.
        console.warn('Ignoring invalid discovery response:', error);
      }
    });

    try {
      socket.bind(0, () => {
        if (isFinished) {
          return;
        }

        try {
          socket.setBroadcast(true);
          const message = formatDiscoveryMessage({
            type: 'SRCH',
            version,
          });

          socket.send(
            message,
            0,
            message.length,
            port,
            BROADCAST_ADDRESS,
            (error: Error | null) => {
              if (error) {
                finish(error);
              }
            },
          );

          timeout = setTimeout(() => finish(), DISCOVERY_TIMEOUT_MS);
        } catch (error) {
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      });
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  });
};
