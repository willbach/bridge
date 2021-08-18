import useRoller from 'lib/useRoller';
import { useEffect } from 'react';

const L2Header = () => {
  const { config } = useRoller();

  useEffect(() => {
    console.log('loaded config in L2Header:', config);
  }, [config]);

  return (
    config && (
      <>
        <span>Config Loaded</span>
      </>
    )
  );
};

export default L2Header;
