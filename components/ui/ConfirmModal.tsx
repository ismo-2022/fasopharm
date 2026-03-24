
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-red-600" size={24} />,
          button: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
          bg: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-amber-600" size={24} />,
          button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
          bg: 'bg-amber-50'
        };
      default:
        return {
          icon: <AlertTriangle className="text-blue-600" size={24} />,
          button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
          bg: 'bg-blue-50'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${styles.bg}`}>
                {styles.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{message}</p>
              </div>
              <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition transform active:scale-95 ${styles.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
