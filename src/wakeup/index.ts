import dgram from 'react-native-udp';
import {Buffer} from '@craftzdog/react-native-buffer';
import {DiscoveryVersions, DiscoveryPort} from '../common';

const DDP_CLIENT_TYPE = 'vr';
const DDP_AUTH_TYPE = 'R';
const DDP_MODEL = 'w';
const DDP_APP_TYPE = 'r';

const BIND_PORT = 16690;
const BIND_TIMEOUT_MS = 5000;
const SEND_TIMEOUT_MS = 2000;

/**
 * Sends a PlayStation DDP wake-up packet.
 *
 * Resolves true once the UDP send callback succeeds, or false if the socket
 * cannot bind/send. The caller may ignore the returned promise as before.
 * iOS UDP wake-up is foreground-only; iOS does not keep this socket alive
 * while the app is suspended.
 */
export const wakeup = (
  host: string,
  credential: string,
  isPS5 = true,
): Promise<boolean> => {
  return new Promise(resolve => {
    if (
      typeof host !== 'string' ||
      host.trim().length === 0 ||
      typeof credential !== 'string' ||
      credential.length === 0 ||
      /[\\r\\n]/.test(credential)
    ) {
      console.warn('Invalid wake-up host or credential');
      resolve(false);
      return;
    }

    const isIpv6 = host.includes(':');
    let socket: ReturnType<typeof dgram.createSocket> | null = null;
    let settled = false;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = (success: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (socket) {
        try {
          socket.close();
        } catch (error) {
          console.warn('Unable to close wake-up socket:', error);
        }
      }
      resolve(success);
    };

    try {
      socket = dgram.createSocket({
        type: isIpv6 ? 'udp6' : 'udp4',
        reusePort: true,
      });

      const activeSocket = socket;
      closeTimer = setTimeout(
        () => finish(false),
        BIND_TIMEOUT_MS + SEND_TIMEOUT_MS,
      );

      activeSocket.on('error', error => {
        console.warn('Wake-up socket error:', error);
        finish(false);
      });

      activeSocket.once('listening', () => {
        const port = isPS5 ? DiscoveryPort.PS5 : DiscoveryPort.PS4;
        const ddpVersion = isPS5
          ? DiscoveryVersions.PS5
          : DiscoveryVersions.PS4;
        const messageText =
          `WAKEUP * HTTP/1.1\\n` +
          `client-type:${DDP_CLIENT_TYPE}\\n` +
          `auth-type:${DDP_AUTH_TYPE}\\n` +
          `model:${DDP_MODEL}\\n` +
          `app-type:${DDP_APP_TYPE}\\n` +
          `user-credential:${credential}\\n` +
          `device-discovery-protocol-version:${ddpVersion}\\n`;
        const message = Buffer.from(messageText, 'utf-8');

        activeSocket.send(
          message,
          0,
          message.length,
          port,
          host,
          error => {
            if (error) {
              console.warn('Wake-up message send failed:', error);
              finish(false);
              return;
            }
            console.log('Wake-up message sent successfully');
            finish(true);
          },
        );
      });

      activeSocket.bind(BIND_PORT, isIpv6 ? '::' : '0.0.0.0');
    } catch (error) {
      console.warn('Unable to start wake-up socket:', error);
      finish(false);
    }
  });
};
