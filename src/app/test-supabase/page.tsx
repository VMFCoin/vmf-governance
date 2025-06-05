import { SupabaseTest } from '@/components/test/SupabaseTest';

export default function TestSupabasePage() {
  return (
    <div className="min-h-screen bg-backgroundBase">
      <div className="container mx-auto py-8">
        <SupabaseTest />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Supabase Integration Test - VMF Voice',
  description: 'Test page for Supabase integration functionality',
};
