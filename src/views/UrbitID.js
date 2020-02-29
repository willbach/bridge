import React from 'react';
import { Grid } from 'indigo-react';

import { useHistory } from 'store/history';

import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import View from 'components/View';
import Crumbs from 'components/Crumbs';

import UrbitIDHome from './UrbitID/Home';
import SigilGenerator from './UrbitID/SigilGenerator';
import DownloadKeys from './UrbitID/DownloadKeys';
import SetProxy from './UrbitID/SetProxy';

const NAMES = {
  HOME: 'HOME',
  SIGIL_GENERATOR: 'SIGIL_GENERATOR',
  DOWNLOAD_KEYS: 'DOWNLOAD_KEYS',
  SET_PROXY: 'SET_PROXY',
};

const VIEWS = {
  [NAMES.HOME]: UrbitIDHome,
  [NAMES.SIGIL_GENERATOR]: SigilGenerator,
  [NAMES.DOWNLOAD_KEYS]: DownloadKeys,
  [NAMES.SET_PROXY]: SetProxy,
};

const humanizeName = name => {
  switch (name) {
    case NAMES.SIGIL_GENERATOR:
      return 'Sigil';
    case NAMES.DOWNLOAD_KEYS:
      return 'Download Keys';
    case NAMES.SET_PROXY:
      return 'Set Key';
    default:
      return undefined;
  }
};

export default function UrbitOS() {
  const history = useHistory();
  const name = useCurrentPointName();

  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.HOME }],
  });

  const last = router.peek().key;
  const homeAction = last === NAMES.HOME ? undefined : () => history.pop();
  const lastCrumb = homeAction ? [{ text: humanizeName(last) }] : [];

  return (
    <View pop={router.pop} inset>
      <LocalRouterProvider value={router}>
        <Grid className="mb4">
          <Grid.Item
            full
            as={Crumbs}
            routes={[
              { text: name, action: () => history.pop() },
              { text: 'Urbit ID', action: homeAction },
              ...lastCrumb,
            ]}
          />
        </Grid>
        <Route />
      </LocalRouterProvider>
    </View>
  );
}