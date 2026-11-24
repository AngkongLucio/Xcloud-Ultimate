import axios from 'axios';
import {btoa, atob} from 'react-native-quick-base64';
import {Buffer} from '@craftzdog/react-native-buffer';
import 'react-native-url-polyfill/auto';

// Polyfill for axios auth encode
if (!global.btoa) {
  global.btoa = btoa;
}

if (!global.atob) {
  global.atob = atob;
}

const CLIENT_ID = 'ba495a24-818c-472b-b12d-ff231c1b5745';
const CLIENT_SECRET = 'mvaiZkRsAsI1IBkY';
const REDIRECT_URI =
  'https://remoteplay.dl.playstation.net/remoteplay/redirect';

export const getTokenFromRedirectUri = (redirectUri: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    let accessToken = '';
    let refreshToken = '';
    let tokenExpiry = 0;

    let code: string | null;
    try {
      const redirect = new URL(redirectUri);
      if (
        redirect.protocol !== 'https:' ||
        redirect.hostname !== 'remoteplay.dl.playstation.net' ||
        redirect.pathname !== '/remoteplay/redirect'
      ) {
        reject(new Error('PSN redirect URL does not match the official redirect address.'));
        return;
      }
      code = redirect.searchParams.get('code');
    } catch (error) {
      reject(new Error('Invalid PSN redirect URL.'));
      return;
    }

    if (!code) {
      reject(new Error('PSN authorization code is missing from the redirect URL.'));
      return;
    }

    {
      const auth = {
        username: CLIENT_ID,
        password: CLIENT_SECRET,
      };

      const payload = {
        code,
        grant_type: 'authorization_code',
        scope:
          'psn:clientapp referenceDataService:countryConfig.read pushNotification:webSocket.desktop.connect sessionManager:remotePlaySession.system.update',
        redirect_uri: REDIRECT_URI,
      };
      const body = new URLSearchParams(payload).toString();

      axios
        .post(
          'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token',
          body,
          {
            auth,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .then(res => {
          // console.log('[getTokenFromRedirectUri] res:', res.data);
          // {"access_token": "1babdde3-48b7-420a-af97-45afb8", "expires_in": 3599, "refresh_token": "1e82-530e-4506-9453-d4357f89", "scope": "psn:clientapp", "token_type": "bearer"}
          const expiresIn = Number(res.data?.expires_in);
          if (
            !res.data?.access_token ||
            !res.data?.refresh_token ||
            !Number.isFinite(expiresIn) ||
            expiresIn <= 0
          ) {
            reject(new Error('PSN token response is incomplete or invalid.'));
            return;
          }

          accessToken = String(res.data.access_token);
          refreshToken = String(res.data.refresh_token);
          tokenExpiry = Date.now() + expiresIn * 1000;
          resolve({
            accessToken,
            refreshToken,
            tokenExpiry,
          });
        })
        .catch(e => {
          console.log('[getTokenFromRedirectUri] token exchange failed.');
          reject(e);
        });
    }
  });
};

type UserInfo = {
  scopes: string; // eg: "psn:clientapp",
  expiration: string; // eg: "2021-03-21T15:19:42.198Z",
  client_id: string; // as passed in,
  dcim_id: string; // some kind of UUID,
  grant_type: string; // eg: "authorization_code",
  user_id: string; // a number, This is important for streaming auth
  user_uuid: string; // a UUID,
  online_id: string; // aka username,
  country_code: string; // eg: "US",
  language_code: string; // eg: "en",
  community_domain: string; // eg: "a6",
  is_sub_account: boolean;
  account_id?: string; // Final encode user id
};

export function extractAccountId(accountInfo: UserInfo) {
  const asNumber = BigInt(accountInfo.user_id);
  const buffer = Buffer.alloc(8, 'binary');
  // @ts-ignore
  buffer.writeBigUInt64LE(asNumber, 0);
  return buffer.toString('base64');
}

export const getUserInfoFromToken = (
  token: string,
): Promise<UserInfo | null> => {
  return new Promise((resolve, reject) => {
    const auth = {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    };
    axios
      .get(
        `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token/${token}`,
        {
          auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then(res => {
        if (!res.data || typeof res.data.user_id !== 'string' || !/^[0-9]+$/.test(res.data.user_id)) {
          resolve(null);
          return;
        }

        const userInfo = res.data as UserInfo;
        const accountId = extractAccountId(userInfo);
        userInfo.account_id = accountId;
        resolve(userInfo);
      })
      .catch(e => {
        console.log('[getUserInfoFromToken] error:', e);
        reject(e);
      });
  });
};

export const refreshAccessToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const auth = {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    };
    const payload = {
      refresh_token: token,
      grant_type: 'refresh_token',
      scope:
        'psn:clientapp referenceDataService:countryConfig.read pushNotification:webSocket.desktop.connect sessionManager:remotePlaySession.system.update',
      redirect_uri: REDIRECT_URI,
    };
    const body = new URLSearchParams(payload).toString();

    axios
      .post(
        'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token',
        body,
        {
          auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then(res => {
        if (res.data && res.data.access_token) {
          resolve(res.data);
        } else {
          resolve(null);
        }
      })
      .catch(e => {
        console.log('[refreshToken] refresh request failed.');
        reject(e);
      });
  });
};
