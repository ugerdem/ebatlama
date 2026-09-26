import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMalzemeTipleri } from '../utils/api';
import { MALZEME_OPTIONS } from '../utils/helpers';

const MalzemeOptionsContext = createContext({
  malzemeOptions: MALZEME_OPTIONS,
  loading: true,
  refresh: () => {}
});

export function MalzemeOptionsProvider({ children }) {
  const [malzemeOptions, setMalzemeOptions] = useState(MALZEME_OPTIONS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return getMalzemeTipleri()
      .then((res) => {
        if (Array.isArray(res.data?.values) && res.data.values.length > 0) {
          setMalzemeOptions(res.data.values);
        }
      })
      .catch(() => {
        setMalzemeOptions(MALZEME_OPTIONS);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <MalzemeOptionsContext.Provider value={{ malzemeOptions, loading, refresh }}>
      {children}
    </MalzemeOptionsContext.Provider>
  );
}

export const useMalzemeOptions = () => useContext(MalzemeOptionsContext);