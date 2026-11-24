import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, Alert, BackHandler, Linking, Platform, StyleSheet, View} from 'react-native';
import {Button, IconButton, Text} from 'react-native-paper';
import {WebView, WebViewNavigation} from 'react-native-webview';

const XBOX_CLOUD_URL = 'https://www.xbox.com/play';

export default function XboxCloudScreen() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNavigationChange = useCallback((navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
  }, []);

  const handleBack = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [handleBack]);

  const reload = useCallback(() => {
    setLoadError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }, []);

  const openInBrowser = useCallback(() => {
    Alert.alert(
      'Open in browser',
      'If streaming or controller input is unavailable inside this app, open Xbox Cloud Gaming in Safari. Microsoft may require a supported full browser for gameplay.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Open Safari',
          onPress: () => {
            Linking.openURL(XBOX_CLOUD_URL).catch(() => {
              Alert.alert('Unable to open Safari', 'Open https://www.xbox.com/play in Safari manually.');
            });
          },
        },
      ],
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <IconButton
          icon="arrow-left"
          disabled={!canGoBack}
          onPress={handleBack}
          accessibilityLabel="Go back"
        />
        <View style={styles.heading}>
          <Text variant="titleMedium" style={styles.title}>Xbox Cloud Gaming</Text>
          <Text variant="labelSmall" style={styles.subtitle}>xbox.com/play</Text>
        </View>
        <IconButton icon="refresh" onPress={reload} accessibilityLabel="Reload Xbox Cloud Gaming" />
        <IconButton icon="open-in-new" onPress={openInBrowser} accessibilityLabel="Open in Safari" />
      </View>

      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{uri: XBOX_CLOUD_URL}}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          onLoadStart={() => {
            setLoading(true);
            setLoadError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationChange}
          onError={() => {
            setLoading(false);
            setLoadError(true);
          }}
          onHttpError={event => {
            if (event.nativeEvent.statusCode >= 400) {
              setLoading(false);
              setLoadError(true);
            }
          }}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading Xbox Cloud Gaming…</Text>
            </View>
          )}
          startInLoadingState
          allowsFullscreenVideo
          bounces={false}
        />

        {loading && (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Connecting to Xbox…</Text>
          </View>
        )}

        {loadError && !loading && (
          <View style={styles.errorOverlay}>
            <Text variant="titleMedium" style={styles.errorTitle}>Xbox Cloud Gaming could not load</Text>
            <Text style={styles.errorText}>
              Check your connection and try again. If Microsoft blocks embedded playback or controller input,
              use Safari from the button above. Your Microsoft password is not collected by this app.
            </Text>
            <Button mode="contained" onPress={reload}>Try again</Button>
            <Button mode="text" onPress={openInBrowser}>Open in Safari</Button>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  toolbar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#151515',
  },
  heading: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    color: '#A6A6A6',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#090909',
  },
  webView: {
    flex: 1,
    backgroundColor: '#090909',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090909',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090909',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#090909',
  },
  errorTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#D0D0D0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 21,
  },
});
