import { useState, useEffect } from 'react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { getHasPin, savePinVerification, verifyPin } from '../utils/storage';

export default function LockScreen({ onUnlock }) {
    const [hasPin, setHasPin] = useState(null);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(1); // 1: Enter PIN / Create PIN, 2: Confirm PIN
    const [error, setError] = useState('');

    useEffect(() => {
        const checkPin = async () => {
            const exists = await getHasPin();
            setHasPin(exists);
            setStep(exists ? 1 : 1); // Step 1 for both login and creation
        };
        checkPin();
    }, []);

    const handleKeyPress = (num) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleSubmit = async () => {
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        if (hasPin) {
            // Login
            const isValid = await verifyPin(pin);
            if (isValid) {
                onUnlock(pin);
            } else {
                setError('Incorrect PIN');
                setPin('');
            }
        } else {
            // Create PIN
            if (step === 1) {
                setConfirmPin(pin);
                setPin('');
                setStep(2);
                setError('');
            } else {
                if (pin === confirmPin) {
                    await savePinVerification(pin);
                    onUnlock(pin);
                } else {
                    setError('PINs do not match');
                    setPin('');
                    setConfirmPin('');
                    setStep(1);
                }
            }
        }
    };

    if (hasPin === null) return <div className="min-h-screen bg-surface-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-800 border border-surface-700 shadow-xl mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-500/10 blur-xl group-hover:bg-brand-500/20 transition-colors"></div>
                        {hasPin && pin.length > 0 ? (
                            <Unlock size={32} className="text-brand-400 relative z-10" />
                        ) : (
                            <Lock size={32} className="text-brand-500 relative z-10" />
                        )}
                    </div>
                    
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {hasPin ? 'Welcome Back' : (step === 1 ? 'Create Master PIN' : 'Confirm Master PIN')}
                    </h1>
                    <p className="text-surface-400 text-sm">
                        {hasPin 
                            ? 'Enter your Master PIN to access the vault.' 
                            : 'This PIN will be used to encrypt your wallets offline.'}
                    </p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div 
                            key={idx}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                idx < pin.length 
                                    ? 'bg-brand-500 shadow-[0_0_10px_rgba(23,205,255,0.5)]' 
                                    : 'bg-surface-700 border border-surface-600'
                            }`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-6 bg-red-400/10 py-2 px-4 rounded-lg">
                        <AlertTriangle size={16} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeyPress(num.toString())}
                            className="w-16 h-16 mx-auto rounded-full bg-surface-800 border border-surface-700 text-xl font-semibold text-white hover:bg-brand-500/20 hover:border-brand-500/50 hover:text-brand-400 transition-all active:scale-95 flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleDelete}
                        className="w-16 h-16 mx-auto rounded-full bg-surface-800 border border-surface-700 text-sm font-medium text-surface-400 hover:bg-surface-700 transition-all active:scale-95 flex items-center justify-center"
                    >
                        DEL
                    </button>
                    <button
                        onClick={() => handleKeyPress('0')}
                        className="w-16 h-16 mx-auto rounded-full bg-surface-800 border border-surface-700 text-xl font-semibold text-white hover:bg-brand-500/20 hover:border-brand-500/50 hover:text-brand-400 transition-all active:scale-95 flex items-center justify-center"
                    >
                        0
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={pin.length < 4}
                        className="w-16 h-16 mx-auto rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 font-semibold text-sm hover:bg-brand-500 hover:text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
