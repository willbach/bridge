import React, { useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import ob from 'urbit-ob';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { patp2dec } from 'lib/patp2dec';
import { getSpawnCandidate } from 'lib/child';
import { useLocalRouter } from 'lib/LocalRouter';
import useConstant from 'lib/useConstant';
import { validateChild } from 'lib/validators';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import { PointInput, AddressInput } from 'form/Inputs';
import {
  composeValidator,
  buildPointValidator,
  buildAddressValidator,
  hasErrors,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import CopiableAddress from 'components/CopiableAddress';
import { convertToInt } from 'lib/convertToInt';
import L2BackHeader from 'components/L2/L2BackHeader';
import HeaderPane from 'components/L2/Window/HeaderPane';
import Window from 'components/L2/Window/Window';
import BodyPane from 'components/L2/Window/BodyPane';
import { Button, Row, StatelessTextInput } from '@tlon/indigo-react';
import { useRollerStore } from 'store/roller';
import Dropdown from 'components/L2/Dropdown';
import useRoller from 'lib/useRoller';
import FeeDropdown from 'components/L2/FeeDropdown';

function useIssueChild() {
  const { contracts } = useNetwork();
  const { syncDates } = usePointCache();

  const _contracts = need.contracts(contracts);

  const [spawnedPoint, setSpawnedPoint] = useState();

  return useEthereumTransaction(
    useCallback(
      (spawnedPoint, owner) => {
        setSpawnedPoint(spawnedPoint);
        return azimuth.ecliptic.spawn(_contracts, spawnedPoint, owner);
      },
      [_contracts]
    ),
    useCallback(() => syncDates(spawnedPoint), [spawnedPoint, syncDates]),
    GAS_LIMITS.DEFAULT
  );
}

export default function IssueChild() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { nextRoll, currentL2 } = useRollerStore(store => store);
  const { controlledPoints } = usePointCache();
  const { generateInviteCodes } = useRoller();

  const points =
    controlledPoints?.value?.value?.ownedPoints?.map(point => Number(point)) ||
    [];

  const [pointsToSpawn, setPointsToSpawn] = useState(100);
  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);
  const [spawnDestination, setSpawnDestination] = useState(_point);

  const availablePointsPromise = useConstant(() =>
    azimuth.azimuth
      .getUnspawnedChildren(_contracts, _point)
      .then(points => new Set(points))
  );

  const candidates = useMemo(() => {
    const getCandidate = () => ob.patp(getSpawnCandidate(_point));

    return [getCandidate(), getCandidate(), getCandidate(), getCandidate()];
  }, [_point]);

  const {
    isDefaultState,
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useIssueChild();

  const validateFormAsync = useCallback(
    async values => {
      const point = patp2dec(values.point);
      const hasPoint = (await availablePointsPromise).has(point);

      if (!hasPoint) {
        return { point: 'This point cannot be spawned.' };
      }
    },
    [availablePointsPromise]
  );

  const validateForm = useCallback(
    (values, errors) => {
      if (hasErrors(errors)) {
        return errors;
      }

      return validateFormAsync(values, errors);
    },
    [validateFormAsync]
  );

  const validate = useMemo(
    () =>
      composeValidator(
        {
          point: buildPointValidator(4, [validateChild(ob.patp(_point))]),
          owner: buildAddressValidator(),
        },
        validateForm
      ),
    [_point, validateForm]
  );

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct(patp2dec(values.point), values.owner);
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  const selectPoint = point => () => setSpawnDestination(point);
  const dropdownValue = `${ob.patp(spawnDestination)}${spawnDestination === _point ? ' (you)' : ''}`; // eslint-disable-line

  if (currentL2) {
    return (
      <View className="issue-child" hideBack header={<L2BackHeader />}>
        <Window>
          <HeaderPane>
            <h5>Generate Planet Codes</h5>
          </HeaderPane>
          <BodyPane>
            <div className="upper">
              <Row className="points-input">
                I want to generate
                <StatelessTextInput
                  className="input-box"
                  value={pointsToSpawn}
                  maxLength="3"
                  onChange={e =>
                    setPointsToSpawn(Number(e.target.value.replace(/\D/g, '')))
                  }
                />
                planets
              </Row>
              <div>Destination</div>
              <div className="ship-or-address">Ship or ethereum address</div>
              <Dropdown value={dropdownValue}>
                {points.map(point => (
                  <div onClick={selectPoint(point)} className="address">
                    {ob.patp(point)}
                  </div>
                ))}
              </Dropdown>
            </div>
            <div className="lower">
              <Row className="next-roll">
                <span>{currentL2 ? 'Next Roll in' : 'Transaction Fee'}</span>
                {currentL2 ? (
                  <span className="timer">{nextRoll}</span>
                ) : (
                  <FeeDropdown />
                )}
              </Row>
              <Button
                as={'button'}
                className="generate-button"
                center
                solid
                onClick={() => generateInviteCodes(pointsToSpawn)}>
                Generate Planet Codes ({pointsToSpawn})
              </Button>
            </div>
          </BodyPane>
        </Window>
      </View>
    );
  }

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Issue Child Point
        </Grid.Item>

        {isDefaultState && (
          <Grid.Item full as={Text}>
            Perhaps one of {candidates.slice(0, 3).join(', ')}, or{' '}
            {candidates[candidates.length - 1]}?
          </Grid.Item>
        )}

        <BridgeForm validate={validate} onValues={onValues}>
          {({ handleSubmit, values }) => (
            <>
              {completed && (
                <Grid.Item
                  full
                  as={Text}
                  className={cn('f5 wrap', {
                    green3: completed,
                  })}>
                  {values.point} has been spawned and can be claimed by{' '}
                  <CopiableAddress>{values.owner}</CopiableAddress>.
                </Grid.Item>
              )}

              {!completed && (
                <>
                  <Grid.Item
                    full
                    as={PointInput}
                    name="point"
                    disabled={inputsLocked}
                    className="mt4"
                  />
                  <Grid.Item
                    full
                    as={AddressInput}
                    className="mb4"
                    name="owner"
                    label="Ethereum Address"
                    disabled={inputsLocked}
                  />
                </>
              )}

              <Grid.Item full as={FormError} />

              <Grid.Item
                full
                as={InlineEthereumTransaction}
                {...bind}
                onReturn={() => pop()}
              />
            </>
          )}
        </BridgeForm>
      </Grid>
    </View>
  );
}
