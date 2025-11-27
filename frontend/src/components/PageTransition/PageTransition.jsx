import { motion } from 'framer-motion';
import './PageTransition.css';

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}
