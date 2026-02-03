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
  }
} as const;


export const PAGE_ENDPOINTS = {
  HOME: '/home',
  PERMISSION_DENIED_ENDPOINT: '/denied',
  DASHBOARD: '/dashboard',

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
  },

  ADMIN: {
    SHOP_APPROVAL: `/admin/shop-approval`,
  },

} as const;