import { router } from 'expo-router';

import { EmptyState, Page } from '@/components/prices/ui';

export default function NotFoundScreen() {
  return (
    <Page title="페이지를 찾을 수 없어요" backTo="/">
      <EmptyState title="없는 주소예요" description="상품 검색에서 다시 시작해 주세요."
        buttonLabel="상품 검색으로" onReset={() => router.replace('/')} />
    </Page>
  );
}
