import React from 'react';
import {NativeModules, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {WebView} from 'react-native-webview';
import Spinner from 'react-native-loading-spinner-overlay';
import {useTranslation} from 'react-i18next';
import {debugFactory} from '../utils/debug';

const log = debugFactory('LoginScreen');

const CLIENT_ID = 'ba495a24-818c-472b-b12d-ff231c1b5745';

const REDIRECT_URI =
  'https://remoteplay.dl.playstation.net/remoteplay/redirect';

const isPsnRedirectUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'remoteplay.dl.playstation.net' &&
      url.pathname === '/remoteplay/redirect'
    );
  } catch {
    return false;
  }
};

const LOGIN_URL = `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize?service_entity=urn:service-entity:psn&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=psn:clientapp referenceDataService:countryConfig.read pushNotification:webSocket.desktop.connect sessionManager:remotePlaySession.system.update&request_locale=en_US&ui=pr&service_logo=ps&layout_type=popup&smcid=remoteplay&prompt=always&PlatformPrivacyWs1=minimal&`;

const {HolepunchManager} = NativeModules;

function LoginScreen({navigation}) {
  const {t} = useTranslation();
  const [loginUrl, setLoginUrl] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  React.useEffect(() => {
    try {
      if (typeof HolepunchManager?.getDeviceUid !== 'function') {
        setLoginError(
          'PSN sign-in is not available on iOS yet because the native device identity bridge has not been ported.',
        );
      } else {
        const duid = HolepunchManager.getDeviceUid();
        if (!duid) {
          throw new Error('Device identity is unavailable.');
        }
        setLoginUrl(`${LOGIN_URL}duid=${encodeURIComponent(String(duid))}&`);
      }
    } catch (error) {
      log.error('Unable to prepare PSN login:', error);
      setLoginError('Unable to prepare PSN sign-in on this device.');
    }

    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Button
          mode="text"
          onPress={() => {
            navigation.navigate({
              name: 'ManualLogin',
            });
          }}>
          {t('Login_issue')}
        </Button>
      ),
    });
  }, [navigation, t]);

  log.info('PSN login URL ready:', Boolean(loginUrl));

  return (
    <>
      {loginError ? (
        <View style={{flex: 1, justifyContent: 'center', padding: 24}}>
          <Text>{loginError}</Text>
        </View>
      ) : null}
      {loginUrl && (
        <WebView
          source={{uri: loginUrl}}
          originWhitelist={['*']}
          startInLoadingState={true}
          renderLoading={() => (
            <Spinner
              visible={true}
              cancelable={true}
              color={'#DF6069'}
              overlayColor={'rgba(0, 0, 0, 0)'}
            />
          )}
          setSupportMultipleWindows={false}
          cacheMode={'LOAD_NO_CACHE'}
          cacheEnabled={false}
          incognito={true}
          onShouldStartLoadWithRequest={request => {
            // log.info('onShouldStartLoadWithRequest:', request);
            if (isPsnRedirectUrl(request.url)) {
              return false;
            }
            return true;
          }}
          onNavigationStateChange={navState => {
            // Keep track of going back navigation within component
            // log.info('onNavigationStateChange:', navState);
            const {url} = navState;
            if (isPsnRedirectUrl(url)) {
              // Save url，return to home
              navigation.navigate({
                name: 'Home',
                params: {xalUrl: url},
                merge: true,
              });
            }
          }}
        />
      )}
    </>
  );
}

export default LoginScreen;
