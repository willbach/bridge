import React from 'react';

export interface HeaderPaneProps {}

const HeaderPane = ({ children }: any) => {
  return <div className="header-pane">{children}</div>;
};

export default HeaderPane;
