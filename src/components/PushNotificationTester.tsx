/**
 * Push Notification Testing Component
 * Comprehensive testing interface for verifying push notification functionality
 */

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Volume2, ExternalLink } from 'lucide-react';
import { 
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  testNotification,
  playNotificationSound,
  type PracticeNotificationData
} from '@/lib/push-notifications';
import { LoadingSpinner } from './LoadingSpinner';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
}

export const PushNotificationTester = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());

  useEffect(() => {
    runInitialTests();
  }, []);

  const updateTestResult = (name: string, status: TestResult['status'], message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { name, status, message } : r);
      }
      return [...prev, { name, status, message }];
    });
  };

  const runInitialTests = () => {
    // Test 1: Browser support
    const supported = isPushNotificationSupported();
    updateTestResult(
      'Browser Support',
      supported ? 'success' : 'error',
      supported 
        ? 'Push notifications are supported in this browser'
        : 'Push notifications are NOT supported in this browser'
    );

    // Test 2: Permission status
    const permission = getNotificationPermission();
    updateTestResult(
      'Permission Status',
      permission.granted ? 'success' : permission.denied ? 'error' : 'warning',
      permission.granted 
        ? 'Notification permission granted'
        : permission.denied
        ? 'Notification permission denied - user must enable in browser settings'
        : 'Notification permission not requested yet'
    );

    // Test 3: Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        updateTestResult(
          'Service Worker',
          'success',
          `Service worker registered (scope: ${registration.scope})`
        );
      }).catch(() => {
        updateTestResult(
          'Service Worker',
          'error',
          'Service worker not registered'
        );
      });
    } else {
      updateTestResult(
        'Service Worker',
        'error',
        'Service workers not supported'
      );
    }

    // Test 4: LocalStorage availability
    try {
      localStorage.setItem('_test', 'test');
      localStorage.removeItem('_test');
      updateTestResult(
        'LocalStorage',
        'success',
        'LocalStorage is available'
      );
    } catch (error) {
      updateTestResult(
        'LocalStorage',
        'error',
        'LocalStorage is not available or quota exceeded'
      );
    }
  };

  const handleRequestPermission = async () => {
    setTesting(true);
    try {
      const granted = await requestNotificationPermission();
      setNotificationPermission(getNotificationPermission());
      
      updateTestResult(
        'Permission Request',
        granted ? 'success' : 'error',
        granted ? 'Permission granted successfully' : 'Permission denied by user'
      );
      
      if (granted) {
        toast.success('Notification permission granted!');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error: any) {
      updateTestResult(
        'Permission Request',
        'error',
        `Failed to request permission: ${error.message}`
      );
      toast.error('Failed to request permission');
    } finally {
      setTesting(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      const testData: PracticeNotificationData = {
        currentStreak: 7,
        totalSessions: 42,
        averageAccuracy: 87.5,
        lastPracticeDate: Date.now() - 86400000,
      };

      await testNotification(testData);
      
      updateTestResult(
        'Test Notification',
        'success',
        'Test notification sent successfully - check for notification popup'
      );
      
      toast.success('Test notification sent! Check for popup.');
    } catch (error: any) {
      updateTestResult(
        'Test Notification',
        'error',
        `Failed to send notification: ${error.message}`
      );
      toast.error(error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleTestSound = (soundType: 'default' | 'chime' | 'guitar' | 'none') => {
    playNotificationSound(soundType);
    updateTestResult(
      `Sound Test (${soundType})`,
      'success',
      `Playing ${soundType} notification sound`
    );
    toast.success(`Playing ${soundType} sound`);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-zinc-500" />;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-amber-500" />
        <h2 className="text-xl font-bold">Push Notification Testing</h2>
      </div>

      {/* Test Results */}
      <div className="space-y-3 mb-6">
        {testResults.map((result) => (
          <div
            key={result.name}
            className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-start gap-3"
          >
            {getStatusIcon(result.status)}
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{result.name}</h3>
              <p className="text-xs text-zinc-400">{result.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!notificationPermission.granted && (
          <button
            onClick={handleRequestPermission}
            disabled={testing || notificationPermission.denied}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            {testing ? <LoadingSpinner size="sm" /> : <Bell className="w-5 h-5" />}
            {notificationPermission.denied 
              ? 'Permission Denied - Check Browser Settings'
              : 'Request Notification Permission'
            }
          </button>
        )}

        {notificationPermission.granted && (
          <>
            <button
              onClick={handleTestNotification}
              disabled={testing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              {testing ? <LoadingSpinner size="sm" /> : <Bell className="w-5 h-5" />}
              Send Test Notification
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTestSound('default')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <Volume2 className="w-4 h-4" />
                Default
              </button>
              <button
                onClick={() => handleTestSound('chime')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <Volume2 className="w-4 h-4" />
                Chime
              </button>
              <button
                onClick={() => handleTestSound('guitar')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <Volume2 className="w-4 h-4" />
                Guitar
              </button>
              <button
                onClick={() => handleTestSound('none')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <Volume2 className="w-4 h-4" />
                Silent
              </button>
            </div>
          </>
        )}

        <button
          onClick={runInitialTests}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[44px]"
        >
          Re-run Tests
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Testing Instructions
        </h3>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>1. Check all test results show green ✓</li>
          <li>2. Click "Request Notification Permission" if needed</li>
          <li>3. Click "Send Test Notification" to verify notification appears</li>
          <li>4. Test all sound options to verify audio works</li>
          <li>5. Click the notification to verify it opens practice page</li>
          <li>6. Check browser settings if permission is denied</li>
        </ul>
      </div>
    </div>
  );
};
