import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  NativeModules,
  Pressable,
} from 'react-native';
import {
  TextInput,
  Button,
  RadioButton,
  Text,
  Divider,
} from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import {useTranslation} from 'react-i18next';
import uuid from 'react-native-uuid';
import {KeyboardFocusView} from 'react-native-a11y';
import {discoverDevices, type IDiscoveredDevice} from '../discovery';
import {TokenStore} from '../store/tokenStore';
import {getConsoles, saveConsoles} from '../store/consolesStore';
import {DiscoveryVersions} from '../common';
import {debugFactory} from '../utils/debug';
import type {RegistedInfo, UserInfo, PsnUsrtInfo} from '../types';

const log = debugFactory('xCloud/index.js');

const {RegistryManager} = NativeModules;

type Console = {
  host: string;
  id: string;
  name: string;
  type: string;
};

function RegistryScreen({navigation}) {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const [host, setHost] = useState('');
  const [pin, setPin] = useState('');
  const [consoles, setConsoles] = useState<Console[]>([]);

  const hostRef = React.useRef(null);
  const pinRef = React.useRef(null);

  const [currentConsoleId, setCurrentConsoleId] = useState('');

  const [dicoverVersion, setDicoverVersion] = useState(DiscoveryVersions.PS5);

  React.useEffect(() => {
    setLoading(true);
    setLoadingText(t('LookConsole'));

    discoverDevices(true).then((results: IDiscoveredDevice[]) => {
      // console.log('consoles:', results);
      let _consoles: Console[] = [];
      const idRecord: string[] = [];

      results.forEach((res: IDiscoveredDevice) => {
        if (idRecord.indexOf(res.id) === -1) {
          _consoles.push({
            host: res.address.address,
            id: res.id,
            name: res.name,
            type: res.type,
          });
          idRecord.push(res.id);
        }
      });

      setConsoles(_consoles);

      if (_consoles.length) {
        setCurrentConsoleId(_consoles[0].id);
        setHost(_consoles[0].host);
      }

      setLoading(false);
    }).catch((error: any) => {
      setLoading(false);
      Alert.alert(
        t('Warning'),
        'Console discovery failed. Check Local Network access and make sure your console and iPad are on the same network.',
      );
      log.error('Console discovery failed:', error);
    });
  }, [navigation, t]);

  const handleConfirm = () => {
    if (typeof RegistryManager?.registry !== 'function') {
      Alert.alert('Unavailable on iOS', 'Console registration requires the native streaming bridge, which has not been ported to iOS yet.');
      return;
    }
    if (!host.trim()) {
      Alert.alert('', String(t('HostError')));
      return;
    }
    if (!pin.trim()) {
      Alert.alert('', String(t('PINError')));
      return;
    }
    if (pin.trim().length < 8) {
      Alert.alert('', String(t('PINLenError')));
      return;
    }
    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    if (tokens.length === 0) {
      Alert.alert('', String(t('TokenisEmpty')));
      return;
    }

    let currentUser: UserInfo | PsnUsrtInfo | undefined;
    tokens.forEach(item => {
      if (item.is_default) {
        currentUser = item;
      }
    });

    if (!currentUser) {
      Alert.alert('', String(t('TokenisEmpty')));
      return;
    }

    RegistryManager.registry(
      dicoverVersion === DiscoveryVersions.PS5 ? 1000100 : 1000, // (PS5-1000100, PS4(10)-1000)
      host, // host,eg. 192.168.1.1
      false, // broadcast - false
      currentUser.account_id, // psnId -> token.account_id
      parseInt(pin, 10), // PIN
    ).then((result: RegistedInfo) => {
      log.info('registry result:', result);
      if (!result.rpKey) {
        Alert.alert(t('Warning'), t('RegistFailed'), [
          {
            text: t('Confirm'),
            style: 'default',
          },
        ]);
        return;
      }

      // Save regist infos
      const registedConsole = {
        ...result,
        nickName: result.serverNickname || '',
        consoleId: currentConsoleId || uuid.v4(),
        host,
        remoteHost: '',
        registedTime: new Date().getTime(),
      };
      log.info('registedConsole:', registedConsole);
      const _consoles = getConsoles();
      _consoles.push(registedConsole);

      saveConsoles(_consoles);
      Alert.alert('', String(t('RegistrySuccess')));
      navigation.navigate({
        name: 'Home',
      });
    }).catch((error: any) => {
      log.error('Console registration failed:', error);
      Alert.alert(
        t('Warning'),
        'Console registration failed. Verify the console host, PIN, PSN account, and network connection, then try again.',
      );
    });
  };

  const handleChangeConsoleType = value => {
    setDicoverVersion(value);

    setLoading(true);
    setLoadingText(t('LookConsole'));
    const isPS5 = value === DiscoveryVersions.PS5;
    discoverDevices(isPS5).then((results: IDiscoveredDevice[]) => {
      let _consoles: Console[] = [];
      const idRecord: string[] = [];

      results.forEach((res: IDiscoveredDevice) => {
        if (idRecord.indexOf(res.id) === -1) {
          _consoles.push({
            host: res.address.address,
            id: res.id,
            name: res.name,
            type: res.type,
          });
          idRecord.push(res.id);
        }
      });

      setConsoles(_consoles);

      if (_consoles.length) {
        setCurrentConsoleId(_consoles[0].id);
        setHost(_consoles[0].host);
      }

      setLoading(false);
    }).catch((error: any) => {
      setLoading(false);
      Alert.alert(
        t('Warning'),
        'Console discovery failed. Check Local Network access and make sure your console and iPad are on the same network.',
      );
      log.error('Console discovery failed:', error);
    });
  };

  const handleSelectConsole = value => {
    setCurrentConsoleId(value);
    consoles.forEach(console => {
      if (console.id === value) {
        setHost(console.host);
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Spinner
        visible={loading}
        color={'#DF6069'}
        textContent={loadingText}
        textStyle={styles.spinnerTextStyle}
        cancelable
      />

      <Text style={styles.tips} variant="titleMedium">
        {t('RegistTips')}
      </Text>

      <View>
        <Text variant="titleMedium">{t('SelectConsoleType')}</Text>
        <RadioButton.Group
          onValueChange={handleChangeConsoleType}
          value={dicoverVersion}>
          <RadioButton.Item label={'PS5'} value={DiscoveryVersions.PS5} />
          <RadioButton.Item label={'PS4'} value={DiscoveryVersions.PS4} />
        </RadioButton.Group>
      </View>

      <Divider />

      {!loading && (
        <View style={styles.wrap}>
          {consoles.length ? (
            <View>
              <Text variant="titleMedium">{t('SelectConsole')}</Text>
              <RadioButton.Group
                onValueChange={handleSelectConsole}
                value={currentConsoleId}>
                {consoles.map(console => {
                  return (
                    <RadioButton.Item
                      label={console.name}
                      value={console.id}
                      key={console.id}
                    />
                  );
                })}
              </RadioButton.Group>
            </View>
          ) : (
            <View>
              <Text variant="titleMedium">{t('NoConsole')}</Text>
            </View>
          )}
        </View>
      )}

      <Divider />

      <View style={styles.wrap}>
        <Pressable
          style={{padding: 5}}
          onPress={() => {
            if (hostRef && typeof hostRef !== 'function' && hostRef.current) {
              // @ts-ignore
              hostRef.current.focus();
            }
          }}>
          <TextInput
            label={t('Host')}
            ref={hostRef}
            value={host}
            onChangeText={text => setHost(text)}
          />
        </Pressable>

        <Pressable
          style={{padding: 5}}
          onPress={() => {
            if (pinRef && typeof pinRef !== 'function' && pinRef.current) {
              // @ts-ignore
              pinRef.current.focus();
            }
          }}>
          <TextInput
            label="PIN"
            ref={pinRef}
            value={pin}
            onChangeText={text => setPin(text)}
          />
        </Pressable>
      </View>

      <View style={[styles.wrap, {paddingBottom: 50}]}>
        <Button mode="contained" style={styles.button} onPress={handleConfirm}>
          {t('Confirm')}
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={() => navigation.goBack()}>
          {t('Back')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  tips: {
    marginBottom: 10,
  },
  wrap: {
    paddingTop: 30,
  },
  button: {
    marginBottom: 10,
  },
  spinnerTextStyle: {
    color: '#DF6069',
    textAlign: 'center',
  },
});

export default RegistryScreen;
