export const environment = {
  production: true,
  // apiUrl: 'https://api.froidcheikhantambacke.com/api',
  // uploadUrl: 'https://api.froidcheikhantambacke.com/uploads',
  apiUrl: 'http://localhost:8181/api',
  // En SSR côté serveur Node.js, utiliser une URL absolue (lue depuis API_URL env ou défaut local)
  apiUrlServeur: (typeof process !== 'undefined' && process.env?.['API_URL']) ? `${process.env['API_URL']}/api` : 'http://localhost:8181/api',
  uploadUrl: 'http://localhost:8181/uploads',
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
