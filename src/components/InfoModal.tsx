import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

export type InfoModalType = 'success' | 'error' | 'warning' | 'info';

export interface InfoModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: InfoModalType;
  buttonText?: string;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  onClose
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
      case 'info':
        return <Info className="h-16 w-16 text-blue-500" />;
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{getIcon()}</div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          
          <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>

          <button
            onClick={onClose}
            className={`w-full px-6 py-2.5 text-white rounded-lg transition-colors ${getButtonStyle()}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
