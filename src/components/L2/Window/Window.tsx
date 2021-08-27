import React from 'react';

export interface WindowProps {}

const Window = ({ children }: any) => {
  return <div className="window">{children}</div>;
};

export default Window;
