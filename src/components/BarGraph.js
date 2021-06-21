import React from 'react';
import cn from 'classnames';
import { Nothing } from 'purify-ts/Maybe';

const BarGraph = ({
  className,
  available = Nothing,
  sent = Nothing,
  accepted = Nothing,
}) => {
  const _available = available.orDefault(1);
  const _sent = sent.orDefault(0);
  const _accepted = accepted.orDefault(0);
  const total = _available + _sent;
  return (
    <div className={cn('h7 p1 b1 b-black flex', className)}>
      <div
        className="bg-black"
        style={{ width: `${(_accepted / total) * 100}%` }}></div>
      <div
        className="bg-yellow4"
        style={{ width: `${((_sent - _accepted) / total) * 100}%` }}></div>

      <div className="flex-grow" />
    </div>
  );
};

export default BarGraph;
