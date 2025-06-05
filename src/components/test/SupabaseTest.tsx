'use client';

import { useState } from 'react';
import { useCharityStore } from '@/stores/useCharityStore';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { Button } from '@/components/ui/Button';

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const {
    charities,
    isLoading: charityLoading,
    error: charityError,
    fetchCharities,
    addCharity,
  } = useCharityStore();

  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    fetchProfile,
    createProfile,
  } = useUserProfileStore();

  const addTestResult = (result: string) => {
    setTestResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testCharityFetch = async () => {
    try {
      addTestResult('Testing charity fetch...');
      await fetchCharities();
      addTestResult(
        `✅ Charity fetch successful. Found ${charities.length} charities.`
      );
    } catch (error) {
      addTestResult(
        `❌ Charity fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testCharityAdd = async () => {
    try {
      addTestResult('Testing charity creation...');
      const testCharity = {
        name: `Test Charity ${Date.now()}`,
        website: 'https://example.com',
        logo: 'https://via.placeholder.com/150',
        mission: 'Supporting veterans through test data',
        description:
          'This is a test charity created by the Supabase integration test.',
      };

      await addCharity(testCharity);
      addTestResult('✅ Charity creation successful.');
    } catch (error) {
      addTestResult(
        `❌ Charity creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testProfileFetch = async () => {
    try {
      addTestResult('Testing profile fetch...');
      // Use a test wallet address
      await fetchProfile('0x1234567890123456789012345678901234567890');
      addTestResult(
        `✅ Profile fetch successful. Profile exists: ${!!profile}`
      );
    } catch (error) {
      addTestResult(
        `❌ Profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testProfileCreate = async () => {
    try {
      addTestResult('Testing profile creation...');
      const testProfile = {
        walletAddress: `0x${Date.now().toString(16).padStart(40, '0')}`,
        name: `Test User ${Date.now()}`,
      };

      await createProfile(testProfile);
      addTestResult('✅ Profile creation successful.');
    } catch (error) {
      addTestResult(
        `❌ Profile creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-backgroundLight rounded-lg p-6">
        <h2 className="text-2xl font-bold text-textBase mb-4">
          Supabase Integration Test
        </h2>
        <p className="text-textMuted mb-6">
          Test the Supabase integration with charity and profile services. Note:
          These tests will fail until you configure your actual Supabase
          credentials.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-textBase">
              Charity Tests
            </h3>
            <Button
              onClick={testCharityFetch}
              disabled={charityLoading}
              className="w-full"
            >
              {charityLoading ? 'Loading...' : 'Test Charity Fetch'}
            </Button>
            <Button
              onClick={testCharityAdd}
              disabled={charityLoading}
              className="w-full"
              variant="outline"
            >
              {charityLoading ? 'Loading...' : 'Test Charity Creation'}
            </Button>
            {charityError && (
              <p className="text-patriotRed text-sm">Error: {charityError}</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-textBase">
              Profile Tests
            </h3>
            <Button
              onClick={testProfileFetch}
              disabled={profileLoading}
              className="w-full"
            >
              {profileLoading ? 'Loading...' : 'Test Profile Fetch'}
            </Button>
            <Button
              onClick={testProfileCreate}
              disabled={profileLoading}
              className="w-full"
              variant="outline"
            >
              {profileLoading ? 'Loading...' : 'Test Profile Creation'}
            </Button>
            {profileError && (
              <p className="text-patriotRed text-sm">Error: {profileError}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-textBase">Test Results</h3>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>

        <div className="bg-backgroundDark rounded-lg p-4 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-textMuted">
              No test results yet. Run some tests above.
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono text-textBase">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-vmfBlue/10 rounded-lg">
          <h4 className="font-semibold text-textBase mb-2">
            Setup Instructions:
          </h4>
          <ol className="text-sm text-textMuted space-y-1 list-decimal list-inside">
            <li>
              Create a Supabase project at{' '}
              <a
                href="https://supabase.com"
                className="text-vmfBlue hover:underline"
              >
                supabase.com
              </a>
            </li>
            <li>
              Create the{' '}
              <code className="bg-backgroundDark px-1 rounded">
                user_profiles
              </code>{' '}
              and{' '}
              <code className="bg-backgroundDark px-1 rounded">charities</code>{' '}
              tables
            </li>
            <li>
              Create{' '}
              <code className="bg-backgroundDark px-1 rounded">avatars</code>{' '}
              and{' '}
              <code className="bg-backgroundDark px-1 rounded">charities</code>{' '}
              storage buckets
            </li>
            <li>
              Update your{' '}
              <code className="bg-backgroundDark px-1 rounded">.env.local</code>{' '}
              file with your Supabase credentials
            </li>
            <li>Run the tests above to verify the integration</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
