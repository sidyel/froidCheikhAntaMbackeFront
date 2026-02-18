export const environment = {
  production: true,
  apiUrl: 'https://froidcheikhantambacke-production.up.railway.app/api',
  uploadUrl: 'https://froidcheikhantambacke-production.up.railway.app/uploads',
  companyInfo: {
    name: 'Froid Cheikh Anta Mbacké',
    phones: ['77 335 20 00', '76 888 04 42', '33 820 16 33'],
    address: 'Ouest Foire, Cité Aelmas, derrière station Shell',
    ninea: '0151340-2B1',
    email: 'froidcheikhantambacke.dione65@gmail.com'
  },
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
