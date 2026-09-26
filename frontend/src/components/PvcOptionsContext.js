import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getPvcTipleri } from '../utils/api';
import { PVC_OPTIONS } from '../utils/helpers';

const PvcOptionsContext = createContext({
  pvcOptions: PVC_OPTIONS,
  loading: true,
  refresh: () => {}
});

export function PvcOptionsProvider({ children }) {
  const [pvcOptions, setPvcOptions] = useState(PVC_OPTIONS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return getPvcTipleri()
      .then((res) => {
        if (Array.isArray(res.data?.values) && res.data.values.length > 0) {
          setPvcOptions(res.data.values);
        }
      })
      .catch(() => {
        // DB'ye ulaşılamazsa varsayılan listeyle devam et
        setPvcOptions(PVC_OPTIONS);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PvcOptionsContext.Provider value={{ pvcOptions, loading, refresh }}>
      {children}
    </PvcOptionsContext.Provider>
  );
}

export const usePvcOptions = () => useContext(PvcOptionsContext);