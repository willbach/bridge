import * as need from 'lib/need';
import saveAs from 'file-saver';
import ob from 'urbit-ob';
import { Just, Nothing } from 'folktale/maybe';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';
import { deriveNetworkKeys } from 'urbit-key-generation';
import { convertToInt } from './convertToInt';
import {
  attemptNetworkSeedDerivation,
  compileMultiKey,
  keysMatchChain,
} from './keys';
import { generateCode } from './networkCode';
import { L1Point } from './types/L1Point';
import useCurrentPermissions from './useCurrentPermissions';
import { stripSigPrefix } from 'form/formatters';

interface useMultikeyFileGeneratorArgs {
  seed?: string;
  point?: number;
  seedWallet?: any;
}

/**
 * defaults:
 * - seed: derived from wallet, mnemonic, or token (if posisble)
 * - point: the current pointCursor
 */
export default function useMultikeyFileGenerator({
  seed,
  point,
  seedWallet,
}: useMultikeyFileGeneratorArgs) {
  const { urbitWallet, wallet, authMnemonic, authToken }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const { syncDetails, getDetails }: any = usePointCache();
  const { isOwner, isManagementProxy } = useCurrentPermissions();

  const [notice, setNotice] = useState('Deriving networking keys...');
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState<boolean | string>(false);
  const [code, setCode] = useState(false);

  const _point = useMemo(() => point || need.point(pointCursor), [
    point,
    pointCursor,
  ]);
  const details = getDetails(_point);
  const _details: L1Point | null = useMemo(
    () =>
      details.matchWith({
        Just: d => need.details(d),
        Nothing: () => null,
      }),
    [details]
  );

  const currentRevision: number = useMemo(
    () =>
      details.matchWith({
        Just: ({ value }) => convertToInt(value.keyRevisionNumber, 10),
        Nothing: () => 0,
      }),
    [details]
  );
  const nextRevision = useMemo(() => currentRevision + 1, [currentRevision]);

  const pairFromRevision = useCallback(
    async (revision: number) => {
      if (!_details) {
        return;
      }

      const networkSeed = seed
        ? Just(seed)
        : await attemptNetworkSeedDerivation({
            urbitWallet: seedWallet || urbitWallet,
            wallet,
            authMnemonic,
            details: _details,
            authToken,
            point: _point,
            revision: revision,
          });

      if (Nothing.hasInstance(networkSeed)) {
        setGenerating(false);
        setNotice(
          'Custom or nondeterministic networking keys cannot be re-downloaded.'
        );
        console.log(`seed is nondeterminable for revision ${revision}`);
        return;
      }

      const _networkSeed = networkSeed.value;

      return deriveNetworkKeys(_networkSeed);
    },
    [
      _details,
      _point,
      authMnemonic,
      authToken,
      seed,
      urbitWallet,
      wallet,
      seedWallet,
    ]
  );

  const hasNetworkKeys = currentRevision > 0;
  const available =
    (isOwner || isManagementProxy) && hasNetworkKeys && !!keyfile;

  const generate = useCallback(async () => {
    if (!hasNetworkKeys) {
      setGenerating(false);
      setNotice('Network keys not yet set.');
      console.log(
        `no networking keys available for revision ${currentRevision}`
      );
      return;
    }

    const currentPair = await pairFromRevision(currentRevision);

    if (!currentPair || !keysMatchChain(currentPair, _details || {})) {
      setGenerating(false);
      setNotice('Derived networking keys do not match on-chain details.');
      console.log(`keys do not match details for revision ${currentRevision}`);
      return;
    }

    const nextPair = await pairFromRevision(nextRevision);

    setNotice('');
    setCode(generateCode(currentPair));
    setKeyfile(
      compileMultiKey(_point, [
        {
          revision: currentRevision,
          pair: currentPair,
        },
        {
          revision: nextRevision,
          pair: nextPair,
        },
      ])
    );
    setGenerating(false);
  }, [
    _details,
    _point,
    currentRevision,
    hasNetworkKeys,
    nextRevision,
    pairFromRevision,
  ]);

  const filename = useMemo(() => {
    return `${stripSigPrefix(ob.patp(_point))}-${currentRevision}.key`;
  }, [_point, currentRevision]);

  const download = useCallback(() => {
    if (typeof keyfile !== 'string') {
      return;
    }

    saveAs(
      new Blob([keyfile], {
        type: 'text/plain;charset=utf-8',
      }),
      filename
    );
    setDownloaded(true);
  }, [filename, keyfile]);

  useEffect(() => {
    syncDetails(_point);
  }, [_point, syncDetails]);

  useEffect(() => {
    generate();
  }, [generate]);

  const output = {
    generating,
    available,
    downloaded,
    download,
    filename,
    notice,
    keyfile,
    code,
  };

  return { ...output, bind: output };
}