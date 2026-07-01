import React from 'react';

export default function Toast({ type = 'info', message, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(() => onClose?.(), 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return <div className={`toast ${type}`}>{message}</div>;
}