import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Component to show a helpful message when Firebase is not configured
 * This appears in the UI to guide users on how to set up Firebase
 */
export const FirebaseWarning: React.FC = () => {
  return (
    <Alert className="m-4 border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Firebase Not Configured</AlertTitle>
      <AlertDescription className="text-orange-700 mt-2">
        <p className="mb-2">
          Your app is running, but Firebase Authentication is not set up yet.
        </p>
        <div className="text-sm space-y-1">
          <p><strong>To enable authentication:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Get Firebase credentials from <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-orange-900">Firebase Console</a></li>
            <li>Open <code className="bg-orange-100 px-1 rounded">.env</code> file in the root directory</li>
            <li>Replace placeholder values with your actual Firebase credentials</li>
            <li>Restart the dev server (Ctrl+C, then <code className="bg-orange-100 px-1 rounded">npm run dev</code>)</li>
          </ol>
          <p className="mt-2">
            📖 See <code className="bg-orange-100 px-1 rounded">UPDATE_ENV.md</code> for detailed instructions.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

