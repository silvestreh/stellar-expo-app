import '../nodelibs/globals';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, SafeAreaView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import * as Random from 'expo-random';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import StellarSDK from 'stellar-sdk';

const App = () => {
  const [keypair, setKeypair] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const init = async () => {
    const pk = await SecureStore.getItemAsync('privateKey');

    if (pk) {
      const pair = StellarSDK.Keypair.fromSecret(pk);
      return setKeypair(pair);
    }

    generateKeypair();
  };

  const generateKeypair = async () => {
    const randomBytes = Random.getRandomBytes(32);
    const pair = StellarSDK.Keypair.fromRawEd25519Seed(Buffer.from(randomBytes));
    setKeypair(pair);
    await SecureStore.setItemAsync('privateKey', pair.secret());
  };

  const handleNewKeypair = () => {
    if (keypair) {
      Alert.alert(
        'Generate Keypair',
        'You already have a keypair. Do you want to generate a new one?',
        [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          { text: 'OK', onPress: generateKeypair },
        ]
      );
    }
  };

  const copyToClipboard = value => async () => {
    await Clipboard.setStringAsync(value);
    alert('Copied to clipboard');
  };

  const createAccount = async () => {
    setIsCreatingAccount(true);

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`);
      const responseJSON = await response.json();

      Alert.alert(
        'Account Creation',
        typeof responseJSON.status === 'number'
          ? responseJSON.detail
          : 'The account was created. You can view it in a block explorer.',
        [
          { text: 'OK', onPress: () => {} },
          { text: 'Block Explorer', onPress: viewBlockExplorer }
        ]
      );

      console.log("SUCCESS! You have a new account :)\n", JSON.stringify(responseJSON, null, 2));
    } catch (e) {
      console.error("ERROR!", e);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const viewBlockExplorer = () => {
    const url = `https://stellar.expert/explorer/testnet/account/${keypair.publicKey()}`;
    console.log(url); // In case you want to click it on your computer
    WebBrowser.openBrowserAsync(url);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 16 }} onPress={handleNewKeypair}>
        <Text style={{ color: '#0CC0AA' }}>+ New Keypair</Text>
      </TouchableOpacity>
      <View style={styles.container}>
        {keypair && (
          <>
            <TouchableOpacity onPress={copyToClipboard(keypair.secret())}>
              <Text style={styles.text}>Secret: {keypair.secret()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={copyToClipboard(keypair.publicKey())}>
              <Text style={styles.text}>Public Key: {keypair.publicKey()}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity disabled={isCreatingAccount} onPress={createAccount} style={styles.button}>
                {isCreatingAccount ? <ActivityIndicator color="white" style={{ marginRight: 8 }} /> : null}
                <Text style={styles.buttonLabel}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={isCreatingAccount} onPress={viewBlockExplorer} style={styles.button}>
                <Text style={styles.buttonLabel}>Block Explorer</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
};

export default registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    padding: 16
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 16,
  },
  actions: {
    width: '100%'
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0CC0AA',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
    padding: 16
  },
  buttonLabel: {
    color: '#fff',
    textTransform: 'uppercase'
  }
});
