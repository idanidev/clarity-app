import { useEffect, useState } from "react";

interface AudioWaveVisualizerProps {
    isActive: boolean;
    darkMode: boolean;
}

const AudioWaveVisualizer = ({ isActive, darkMode }: AudioWaveVisualizerProps) => {
    const [bars, setBars] = useState([0.3, 0.5, 0.8, 0.5, 0.3]);

    useEffect(() => {
        if (!isActive) {
            setBars([0.2, 0.2, 0.2, 0.2, 0.2]);
            return;
        }

        // Animar las barras con alturas aleatorias para simular audio
        const interval = setInterval(() => {
            setBars([
                Math.random() * 0.7 + 0.3,
                Math.random() * 0.9 + 0.1,
                Math.random() * 1.0,
                Math.random() * 0.9 + 0.1,
                Math.random() * 0.7 + 0.3,
            ]);
        }, 150);

        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <div className="flex items-end justify-center gap-1 h-12">
            {bars.map((height, index) => (
                <div
                    key={index}
                    className={`w-1.5 rounded-full transition-all duration-150 ${darkMode ? "bg-purple-400" : "bg-purple-600"
                        }`}
                    style={{
                        height: `${height * 100}%`,
                        opacity: isActive ? 1 : 0.3,
                    }}
                />
            ))}
        </div>
    );
};

export default AudioWaveVisualizer;
