import React, { useState } from 'react';
import { size } from 'lodash';
import * as need from 'lib/need';
import ob from 'urbit-ob';
import { Just, Nothing } from 'folktale/maybe';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import MiniBackButton from 'components/MiniBackButton';
import { LocalRouterProvider } from 'lib/LocalRouter';
import Crumbs from 'components/Crumbs';

import useRouter from 'lib/useRouter';

import { useHistory } from 'store/history';

import Confirm from './Reticket/Confirm';
import Download from './Reticket/Download';
import Verify from './Reticket/Verify';
import DoReticket from './Reticket/DoReticket';

const NAMES = {
  CONFIRM: 'CONFIRM',
  DOWNLOAD: 'DOWNLOAD',
  VERIFY: 'VERIFY',
  RETICKET: 'RETICKET',
};

const VIEWS = {
  CONFIRM: Confirm,
  DOWNLOAD: Download,
  VERIFY: Verify,
  RETICKET: DoReticket,
};

const STEP_MAX = size(NAMES);

export default function Reticket() {
  const history = useHistory();
  const { Route, ...innerRouter } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.CONFIRM }],
  });
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const name = ob.patp(point);

  const [newWallet, setNewWallet] = useState(Nothing());

  //TODO step # from Route?
  const stepNumber = 1;

  const storeNewWallet = (wallet, paper) => {
    setNewWallet(
      Just({
        wallet,
        paper,
      })
    );
  };

  const completed = () => {
    history.pop();
  };

  return (
    <LocalRouterProvider value={innerRouter}>
      <View>
        <Crumbs
          routes={[
            {
              text: name,
              action: () => {
                return history.pop(2);
              },
            },
            {
              text: 'Admin',
              action: () => history.pop(),
            },
          ]}
        />
        <MiniBackButton onClick={innerRouter.pop} />
        Step {stepNumber} of {STEP_MAX}
        <Route
          newWallet={newWallet}
          //
          storeNewWallet={storeNewWallet}
          //
          completed={completed}
        />
      </View>
    </LocalRouterProvider>
  );
}