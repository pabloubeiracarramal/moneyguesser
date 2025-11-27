import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
import './PageTransition.css';

export default function PageTransition({ children, skipAnimation = false }) {
  const location = useLocation();
  const isFirstLoad = useRef(true);

  // Skip animation on first load
  if (isFirstLoad.current) {
    isFirstLoad.current = false;
    return <div>{children}</div>;
  }

  // Skip animation if explicitly disabled
  if (skipAnimation) {
    return <div>{children}</div>;
  }

  return (
    <>
      {/* Yellow circle - expands to cover screen on exit, contracts to reveal new page */}
      <motion.div
        key={location.pathname}
        className="page-transition-circle"
        initial={{ scale: 3 }}
        animate={{ scale: 0 }}
        exit={{ scale: 3 }}
        transition={{
          duration: 0.6,
          ease: [0.43, 0.13, 0.23, 0.96]
        }}
      />

      {/* Page content */}
      <motion.div
        key={`${location.pathname}-content`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.3
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
