const API_BASE = '/api';
const API_VERSION = '/v1';
const API_ENDPOINT = `${API_BASE}${API_VERSION}`;

export const API_ENDPOINTS = {
  API_BASE,
  API_VERSION,
  API_ENDPOINT,

  AUTH: {
    BASE: `${API_ENDPOINT}/auth`,
    LOGIN: `${API_ENDPOINT}/auth/login`,
  },
  ACCOUNT: {
    BASE: `${API_ENDPOINT}/account`,
    GET: `${API_ENDPOINT}/account`,
    GET_CURRENT: `${API_ENDPOINT}/account/current`,
    GET_MANY: `${API_ENDPOINT}/account/many`,
    GET_BY_ID: (id: string | number) => `${API_ENDPOINT}/account/${id}`,
    CREATE: `${API_ENDPOINT}/account`,
    CREATE_WITH_CITIZEN_CARD: `${API_ENDPOINT}/account/create-with-citizen-card`,
    UPDATE: (id: string | number) => `${API_ENDPOINT}/account/${id}`,
    DELETE: (id: string | number) => `${API_ENDPOINT}/account/${id}`,
  },
  PRODUCTS: {
    BASE: `${API_ENDPOINT}/product`,
    GET_ALL: `${API_ENDPOINT}/product`,
    GET_BY_ID: (id: string) => `${API_ENDPOINT}/product/${id}`,
    GET_BY_SLUG: (slug: string) => `${API_ENDPOINT}/product/slug/${slug}`,
    GET_REVIEWS: (productId: string) => `${API_ENDPOINT}/product/${productId}/reviews`,
  },
  CATEGORIES: {
    BASE: `${API_ENDPOINT}/categories`,
    GET_ALL: `${API_ENDPOINT}/categories`,
  },
  LENS: {
    BASE: `${API_ENDPOINT}/lens-catalog`,
    CATALOG_FOR_FRAME: (frameVariantId: string) => `${API_ENDPOINT}/lens-catalog/for-frame/${frameVariantId}`,
  },
  PRESCRIPTIONS: {
    BASE: `${API_ENDPOINT}/prescriptions`,
    GET_MY_PRESCRIPTIONS: `${API_ENDPOINT}/prescriptions/me`,
    GET_BY_ID: (id: string) => `${API_ENDPOINT}/prescriptions/${id}`,
    CREATE: `${API_ENDPOINT}/prescriptions`,
    UPDATE: (id: string) => `${API_ENDPOINT}/prescriptions/${id}`,
    DELETE: (id: string) => `${API_ENDPOINT}/prescriptions/${id}`,
  },
  VALIDATION: {
    BASE: `${API_ENDPOINT}/validation`,
    LENS_FRAME: `${API_ENDPOINT}/validation/lens-frame`,
    PRESCRIPTION: `${API_ENDPOINT}/prescriptions/validate`,
  },
  CART: {
    BASE: `${API_ENDPOINT}/cart`,
    CREATE: `${API_ENDPOINT}/cart`,
    GET_ACTIVE: `${API_ENDPOINT}/cart/active`,
    ADD_ITEM: (cartId: string) => `${API_ENDPOINT}/cart/${cartId}/items`,
    UPDATE_ITEM: (cartId: string, itemId: string) => `${API_ENDPOINT}/cart/${cartId}/items/${itemId}`,
    REMOVE_ITEM: (cartId: string, itemId: string) => `${API_ENDPOINT}/cart/${cartId}/items/${itemId}`,
    DELETE: (cartId: string) => `${API_ENDPOINT}/cart/${cartId}`,
  },
  SHOPS: {
    RESUBMIT: `${API_ENDPOINT}/shops/resubmit`,
  },
  ADMIN: {
    SHOPS: {
      REQUESTS: `${API_ENDPOINT}/admin/shops/requests`,
      REVIEW: `${API_ENDPOINT}/admin/shops/review`,
    },
  },
} as const;


export const PAGE_ENDPOINTS = {
  HOME: '/home',
  PERMISSION_DENIED_ENDPOINT: '/denied',
  DASHBOARD: 'admin/dashboard',

  AUTH: {
    LOGIN: `/login`,
    REGISTER: `/register`,
  },

  TRACKING: {
    DELIVERY: `/tracking/delivery`,
    SHIPMENT_DETAIL: `/tracking/delivery/:id`,
    SHOPS: `/tracking/shops`,
    SHOP_DETAIL: `/tracking/shops/:id`,
  },

  SHOP: {
    REGISTER: `/shop/register`,
    PROFILE: `/shop/profile`,
    DASHBOARD: `/shop/dashboard`,
    EDIT_PROFILE: `/shop/edit-profile`,
    BANK_ACCOUNTS: `/shop/bank-accounts`,
  },

  ADMIN: {
    SHOP_APPROVAL: `/admin/shop-approval`,
  },

  ORDER: {
    MY_ORDERS: `/my-orders`,
  },

  WARRANTY: {
    MAIN: `/warranty`,
  },

  USER: {
    PROFILE: `/users/me`,
  },

  CART: {
    MAIN: `/cart`,
  },

} as const;