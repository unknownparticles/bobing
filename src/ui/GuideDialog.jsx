import React, { useEffect, useRef } from 'react';
import '../styles/encounter-guide.css';

/** 共用原生模态层；Escape 关闭并由浏览器恢复入口焦点，打开期间锁住背景滚动。 */
export default function GuideDialog({ label, className = '', onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    return () => {
      if (modal.open) modal.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <dialog ref={dialog} className={`guide-dialog ${className}`} aria-label={label} onCancel={onClose} onClose={onClose}>
    {children}
  </dialog>;
}
