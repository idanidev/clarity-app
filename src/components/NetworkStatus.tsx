import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatus: React.FC = () => {
    const { connected } = useNetworkStatus();

    return (
        <AnimatePresence>
            {!connected && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 z-[9999] relative w-full"
                >
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs font-medium">Sin conexión a Internet</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NetworkStatus;
