
import { PageLoading } from '@/components/layout/PageLoading';
import { VenuesPage } from '@/components/venues/VenuesPage';
import { Layout } from '@/components/layout/Layout';
import { Suspense } from 'react';

export default function VenuesPageRoute() {
  return (
    <Layout>
      <Suspense fallback={<PageLoading />}>
        <VenuesPage />
      </Suspense>
    </Layout>
  );
}
