import React from 'react';
import { Crown, Check } from 'lucide-react';
import { SUBSCRIPTION_COST } from '../constants';

interface SubscriptionModalProps {
  isOpen: boolean;
  onSubscribe: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onSubscribe }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full p-8 border border-brand-500/30 shadow-2xl shadow-brand-500/20">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-brand-500/20 rounded-full">
            <Crown className="w-12 h-12 text-brand-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Upgrade to Pro</h2>
        <p className="text-slate-400 text-center mb-8">
          You've reached your free daily limit. Unlock unlimited styling and premium features.
        </p>

        <ul className="space-y-4 mb-8">
          <li className="flex items-center gap-3 text-slate-200">
            <Check className="w-5 h-5 text-green-400" />
            Unlimited AI Generations
          </li>
          <li className="flex items-center gap-3 text-slate-200">
            <Check className="w-5 h-5 text-green-400" />
            High-Resolution Downloads
          </li>
          <li className="flex items-center gap-3 text-slate-200">
            <Check className="w-5 h-5 text-green-400" />
            Priority Processing
          </li>
        </ul>

        <button
          onClick={onSubscribe}
          className="w-full py-3 px-6 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02]"
        >
          Subscribe for ₹{SUBSCRIPTION_COST}/month
        </button>
        
        <p className="mt-4 text-center text-xs text-slate-500">
          Cancel anytime. Secure payment processing.
        </p>
      </div>
    </div>
  );
};