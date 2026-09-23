import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  heightClass?: string;
}

export default function Loading({ text = 'Loading...', heightClass = 'h-64' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center ${heightClass}`}>
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
}
