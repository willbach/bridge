import React, { useCallback, useEffect, useMemo, useState } from 'react';

import * as need from 'lib/need';
import { useWallet } from 'store/wallet';
import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { RollerTransaction } from '@urbit/roller-api';

import './TransactionHistory.scss';
import { TransactionRow } from './TransactionRow';
import { Box, Row } from '@tlon/indigo-react';
import { PatpRow } from './PatpRow';
import Dropdown from 'components/L2/Dropdowns/Dropdown';
import Sigil from 'components/Sigil';

interface GroupedTransactions {
  [ship: string]: RollerTransaction[];
}

const TransactionHistory = () => {
  const { pop }: any = useLocalRouter();
  const { api } = useRoller();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<RollerTransaction[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [selectedPatp, setSelectedPatp] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    const txns = await api.getHistory(address);
    setTransactions(txns);
    setLoading(false);
  }, [address, api]);

  const selectPatp = useCallback(patp => {
    setSelectedPatp(patp);
    setDropdownOpen(false);
  }, []);

  const txnsByPatp = useMemo(() => {
    return transactions.reduce((memo, tx) => {
      if (Object.keys(memo).includes(tx.ship)) {
        memo[tx.ship].push(tx);
      } else {
        memo[tx.ship] = [tx];
      }
      return memo;
    }, {} as GroupedTransactions);
  }, [transactions]);

  const txPatps = useMemo(() => {
    return Object.keys(txnsByPatp).sort();
  }, [txnsByPatp]);

  const filteredPatps = useMemo(() => {
    if (!selectedPatp) {
      return txPatps;
    }

    return txPatps.filter(p => p === selectedPatp);
  }, [selectedPatp, txPatps]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <View
      pop={pop}
      hideBack
      inset
      className="transaction-history"
      header={<L2BackHeader />}>
      <Window>
        {loading ? (
          <Box className={'loading'}>Loading...</Box>
        ) : (
          <>
            <HeaderPane>
              <Box className="transaction-header">
                <h5>Transactions</h5>
                <Dropdown
                  className="transaction-dropdown"
                  open={dropdownOpen}
                  value={selectedPatp}
                  toggleOpen={() => setDropdownOpen(!dropdownOpen)}>
                  <Box className="divider" />
                  <Box className="points">
                    {txPatps.map(patp => {
                      return (
                        <Row
                          className="entry"
                          onClick={() => selectPatp(patp)}
                          key={patp}>
                          <Box>{patp}</Box>
                          <Row>
                            <Box className="sigil">
                              <Sigil
                                icon
                                patp={patp}
                                size={1}
                                colors={['#000', '#FFF']}
                              />
                            </Box>
                          </Row>
                        </Row>
                      );
                    })}
                  </Box>
                </Dropdown>
              </Box>
            </HeaderPane>
            <BodyPane>
              <Box className="transaction-container">
                {filteredPatps.map(patp => {
                  return (
                    <Box key={patp}>
                      <PatpRow patp={patp} />
                      {txnsByPatp[patp]
                        .sort((a, b) => {
                          return a.time - b.time;
                        })
                        .map(tx => (
                          <TransactionRow key={tx.time} {...tx} />
                        ))}
                    </Box>
                  );
                })}
              </Box>
            </BodyPane>
          </>
        )}
      </Window>
    </View>
  );
};

export default TransactionHistory;
