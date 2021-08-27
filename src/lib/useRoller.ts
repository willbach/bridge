import { useCallback, useEffect, useMemo, useState } from 'react';
import { Config, RollerRPCAPI, Options } from '@urbit/roller-api';
import { isDevelopment, isRopsten } from './flags';
import { ROLLER_HOSTS } from './constants';
import * as wg from 'lib/walletgen';
import * as need from 'lib/need';
import * as azimuth from 'azimuth-js';
import { useRollerStore } from 'store/roller';
import { getTimeToNextBatch } from './utils/roller';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { convertToInt } from './convertToInt';
import { useNetwork } from 'store/network';
import useConstant from './useConstant';

export default function useRoller() {
  const { wallet, authToken }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();

  const { nextBatchTime, setNextBatchTime, setNextRoll } = useRollerStore();
  const [config, setConfig] = useState<Config | null>(null);

  const _contracts = need.contracts(contracts);

  const _point = Number(pointCursor);
  const _wallet = wallet.getOrElse(null);
  const _authToken = authToken.getOrElse(null);
  const _web3 = web3.getOrElse(null);

  const options: Options = useMemo(() => {
    const type = isRopsten || !isDevelopment ? 'https' : 'http';
    const host = isRopsten
      ? ROLLER_HOSTS.ROPSTEN
      : isDevelopment
      ? ROLLER_HOSTS.LOCAL
      : ROLLER_HOSTS.MAINNET;
    const port = isDevelopment ? 8080 : 80;
    const path = '/v1/roller';

    return {
      transport: {
        type,
        host,
        port,
        path,
      },
    };
  }, []);

  const api = useMemo(() => {
    return new RollerRPCAPI(options);
  }, [options]);

  const fetchConfig = useCallback(async () => {
    api
      .getRollerConfig()
      .then(response => {
        setConfig(response);
        setNextBatchTime(response.nextBatch);
      })
      .catch(err => {
        // TODO: more elegant error handling
        console.warn(
          '[fetchConfig:failed] is roller running on localhost?\n',
          err
        );
      });
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const availablePointsPromise: any = useConstant(() =>
    azimuth.azimuth.getUnspawnedChildren(_contracts, _point)
  );

  const generateInviteCodes = useCallback(
    async (pointsToSpawn: number) => {
      const availablePoints: any = await availablePointsPromise;
      console.log(1, _wallet)
      const starInfo = await api.getPoint(_point);
      console.log(2, starInfo)
      const spawnRequests = [];
      const tickets = [];
      const nonce = starInfo?.ownership?.owner?.nonce!;
      const address = starInfo?.ownership?.owner?.address!;
      console.log(3, nonce, address)

      for (let i = 0; i < pointsToSpawn && availablePoints[i]; i++) {
        const planet = availablePoints[i];

        console.log(4)
        const { ticket, owner } = await wg.generateTemporaryDeterministicWallet(
          planet,
          _authToken
        );
        console.log(5, owner)

        const from = {
          ship: _point, //ship that is spawning the planet
          proxy: 'own', // this should be either "own" or "proxy"
        };

        const data = {
          address: owner.keys.address, // the new owner of the star (invite wallet)
          ship: planet, // ship to spawn
        };

        const txHash = await api.hashTransaction(
          nonce + i,
          from,
          'spawn',
          data
        );
        console.log(6, txHash)
        const { signature } = _web3.eth.accounts.sign(
          txHash,
          _wallet.privateKey.toString('hex')
        );
        console.log(7, signature)

        const spawnRequest = api.spawn(signature, from, address, data);

        spawnRequests.push(spawnRequest);
        tickets.push(ticket);
      }

      console.log(8)

      const hashes = await Promise.all(spawnRequests);

      console.log(9, hashes, tickets)

      return { hashes, tickets }; // these need to be stored somewhere
    },
    [api, availablePointsPromise, _wallet, _authToken, _point, _web3]
  );

  // On load, get initial config
  useEffect(() => {
    if (config) {
      return;
    }

    fetchConfig();
  }, [config, fetchConfig]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextRoll = getTimeToNextBatch(nextBatchTime, new Date().getTime());
      setNextRoll(nextRoll);

      if (nextBatchTime < new Date().getTime()) {
        api.getRollerConfig().then(response => {
          setNextBatchTime(response.nextBatch);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBatchTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    api,
    config,
    generateInviteCodes,
  };
}
