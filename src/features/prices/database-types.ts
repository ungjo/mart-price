// supabase/migrations/20261029000100_create_price_catalog.sql에 맞춘 DB 행 타입이다.
// DB 컬럼은 snake_case, 화면 모델은 camelCase를 사용하며 변환은 row-mappers.ts 한 곳에서 담당한다.
export type BrandRow = { id: string; name: string; color: string; created_at: string };
export type BranchRow = {
  id: string; brand_id: string; name: string; city: string; district: string; area: string;
  is_demo: boolean; created_at: string;
};
export type ProductRow = {
  id: string; name: string; manufacturer: string; category: string; size_label: string;
  pack_count: number; barcode: string | null; emoji: string; keywords: string[];
  image_url: string | null; image_source_url: string | null; image_note: string | null;
  is_demo: boolean; created_at: string;
};
export type PriceObservationRow = {
  id: string; product_id: string; brand_id: string; branch_id: string | null;
  channel: string; kind: string; pay_amount: number | null; currency: string;
  pay_quantity: number; receive_quantity: number; condition: string;
  observed_at: string; starts_at: string | null; ends_at: string | null;
  source_label: string; source_note: string; source_url: string | null;
  stock: string; is_demo: boolean; created_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      brands: Table<BrandRow>;
      branches: Table<BranchRow>;
      products: Table<ProductRow>;
      price_observations: Table<PriceObservationRow>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
