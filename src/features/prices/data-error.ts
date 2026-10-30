/** 화면에 그대로 표시해도 되는 안내 문구만 담는다. SDK·번들러의 원시 오류와 구분한다. */
export class PriceDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PriceDataError';
  }
}
