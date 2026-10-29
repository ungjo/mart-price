import { Redirect } from 'expo-router';

// 초기 템플릿의 기존 주소로 접근해도 새 상품 검색 화면으로 안내한다.
export default function ExploreRedirect() {
  return <Redirect href="/" />;
}
