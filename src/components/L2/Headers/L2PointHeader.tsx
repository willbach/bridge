import React, { useEffect, useCallback } from 'react';
import { Box, Row } from '@tlon/indigo-react';

import useRoller from 'lib/useRoller';
import { useHistory } from 'store/history';
import { ReactComponent as InviteIcon } from 'assets/invite.svg';
import { ReactComponent as HistoryIcon } from 'assets/history.svg';
import AccountsDropdown from '../Dropdowns/AccountsDropdown';
import { useRollerStore } from 'store/roller';

import './L2PointHeader.scss';
import { isDevelopment } from 'lib/flags';
import { usePointCursor } from 'store/pointCursor';
import { isStar } from 'lib/utils/point';

export interface L2PointHeaderProps {
  numInvites: number;
  hideTimer?: boolean;
  hideInvites?: boolean;
  showMigrate?: boolean;
}

const L2PointHeader = ({
  hideTimer = false,
  hideInvites = false,
  showMigrate = false,
  numInvites = 0,
}: L2PointHeaderProps) => {
  const { config } = useRoller();
  const { nextRoll, currentL2, pendingTransactions } = useRollerStore();
  const { pointCursor }: any = usePointCursor();

  useEffect(() => {
    if (isDevelopment) {
      console.log('loaded config in L2PointHeader:', config);
    }
  }, [config]);

  const { push, names }: any = useHistory();

  const goToInvites = useCallback(() => push(names.INVITE_COHORT), [
    push,
    names.INVITE_COHORT,
  ]);
  const goToHistory = useCallback(
    () => push(names.TRANSACTION_HISTORY, { filterByPoint: pointCursor }),
    [names.TRANSACTION_HISTORY, pointCursor, push]
  );

  const showInvites =
    !hideInvites && Boolean(pointCursor?.value && isStar(pointCursor.value));

  return (
    <Row className="l2-point-header">
      <AccountsDropdown showMigrate={showMigrate} />
      <Row className="info">
        {showInvites && (
          <Row onClick={goToInvites} className="invites">
            <InviteIcon />
            {numInvites}
          </Row>
        )}
        {!hideTimer && currentL2 && !pendingTransactions.length && (
          <Box className="rollup-timer" onClick={goToHistory}>
            {nextRoll}
          </Box>
        )}
        <HistoryIcon className="history" onClick={goToHistory} />
      </Row>
    </Row>
  );
};

export default L2PointHeader;