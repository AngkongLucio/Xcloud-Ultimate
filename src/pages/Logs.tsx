import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  NativeModules,
  Pressable,
  Platform,
} from 'react-native';
import {HelperText, List, Icon} from 'react-native-paper';
import {useTranslation} from 'react-i18next';

const {LogsModule} = NativeModules;

function LogsScreen({navigation}) {
  const {t} = useTranslation();
  const [logs, setLogs] = React.useState([]);
  const [unavailable, setUnavailable] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'android' || typeof LogsModule?.getLogFiles !== 'function') {
      setUnavailable(true);
      return;
    }
    LogsModule.getLogFiles()
      .then(res => setLogs(Array.isArray(res) ? res : []))
      .catch(() => setUnavailable(true));
  }, [navigation, t]);

  return (
    <ScrollView style={styles.container}>
      <View>
        <HelperText style={styles.title} type="info">
          {t('LogsTips')}
        </HelperText>
      </View>
      {unavailable ? (
        <HelperText type="info">System log export is currently supported on Android only.</HelperText>
      ) : null}
      <View>
        {logs.map((log: any) => {
          return (
            <View key={log.filename} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <List.Item title={log.filename} />
              </View>

              <View style={styles.listItemRight}>
                <Pressable
                  onPress={() => {
                    if (typeof LogsModule?.shareLogFile === 'function') {
                      LogsModule.shareLogFile(log.filename);
                    }
                  }}>
                  <Icon source="share-variant" size={30} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // paddingLeft: 10,
    paddingRight: 10,
  },
  title: {
    padding: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
  },
  listItemRight: {
    width: 30,
  },
});

export default LogsScreen;
