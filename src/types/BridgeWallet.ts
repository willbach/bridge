import { BIP32Interface } from 'bitcoinjs-lib';

export interface BridgeWallet extends BIP32Interface {
  address?: string;
  passphrase?: string;
}
