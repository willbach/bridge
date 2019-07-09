import React, { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, Text } from 'indigo-react';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';

import useLifecycle from 'lib/useLifecycle';
import { generateWallet } from 'lib/invite';
import { useLocalRouter } from 'lib/LocalRouter';
import { isDevelopment } from 'lib/flags';

import { ForwardButton } from 'components/Buttons';
import PaperRenderer from 'components/PaperRenderer';
import WarningBox from 'components/WarningBox';
import Blinky from 'components/Blinky';
import useCurrentPointName from 'lib/useCurrentPointName';

export default function ReticketConfirm({ newWallet, setNewWallet }) {
  const { push, names } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const name = useCurrentPointName();

  const [generatedWallet, setGeneratedWallet] = useState(Nothing());

  // generating new wallet on mount, conveniently using it to 'force' users
  // to read the disclaimer text
  //TODO also check we can pay for the transactions?
  useLifecycle(() => {
    (async () => {
      if (Just.hasInstance(newWallet)) {
        // skip if already computed (hitting the back button for example)
        return;
      }

      const wal = await generateWallet(point);
      if (isDevelopment) {
        console.log(`The new ticket for ${name} is ${wal.ticket}`);
      }
      setGeneratedWallet(Just(wal));
    })();
  });

  const goDownload = useCallback(() => push(names.DOWNLOAD), [push, names]);

  const paperRenderer = generatedWallet.matchWith({
    Nothing: () => null,
    Just: ({ value: wallet }) => (
      <PaperRenderer
        point={point}
        wallet={wallet}
        callback={paper => {
          setNewWallet(wallet, paper);
        }}
      />
    ),
  });

  return (
    <Grid gap={4} className="mt4">
      <Grid.Item full as={Text}>
        Reticketing is the process of generating a completely fresh wallet and
        transferring ownership of your point to that wallet.
      </Grid.Item>
      <Grid.Item full as={WarningBox}>
        Beware, this resets your proxy addresses; if you're using smart
        contracts, this might break them! It will also change your networking
        keys!
      </Grid.Item>
      <Grid.Item
        full
        as={ForwardButton}
        solid
        accessory={Nothing.hasInstance(newWallet) ? <Blinky /> : undefined}
        disabled={Nothing.hasInstance(newWallet)}
        onClick={goDownload}>
        I understand, continue
      </Grid.Item>
      {paperRenderer}
    </Grid>
  );
}
