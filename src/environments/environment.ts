export const environment = {
  production: true,
  // apiUrl: 'https://api.froidcheikhantambacke.com/api',
  // uploadUrl: 'https://api.froidcheikhantambacke.com/uploads',
  apiUrl: 'http://localhost:8080/api',
  uploadUrl: 'http://localhost:8080/uploads',
  pagination: {
    defaultPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48]
  },
  cart: {
    maxQuantity: 99,
    persistInLocalStorage: true
  },
  features: {
    wishlist: true,
    guestCheckout: true,
    multiplePaymentMethods: true,
    productReviews: false,
    liveChatSupport: false
  }
};
