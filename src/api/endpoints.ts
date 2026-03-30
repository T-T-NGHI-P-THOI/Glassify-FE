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
    GET_WITH_FRAME_INFO: (id: string) => `${API_ENDPOINT}/product/${id}/with-frame-info`,
    GET_ACCESSORIES_BY_PARENT_ID: (id: string) => `${API_ENDPOINT}/product/${id}/accessories`,
    GET_BY_SLUG: (slug: string) => `${API_ENDPOINT}/product/slug/${slug}`,
    GET_BY_SHOP_ID: (shopId: string) => `${API_ENDPOINT}/product/shop/${shopId}`,
    GET_REVIEWS: (productId: string) => `${API_ENDPOINT}/product/${productId}/reviews`,
    GET_SHOP_FRAME: (shopId: string) => `${API_ENDPOINT}/product/frame-group/shop/${shopId}`,
    GET_PRODUCT_IMAGES: (productId: string) => `${API_ENDPOINT}/product/product-images/${productId}`,
    GET_MODEL_3D: `${API_ENDPOINT}/product/frame-group/model-3d`,
    CREATE_FRAME_GROUP: `${API_ENDPOINT}/product/frame-group`,
    CREATE_FRAME_VARIANT: `${API_ENDPOINT}/product/frame-variant`,
    ACTIVATE_PRODUCT: (id: string) => `${API_ENDPOINT}/product/${id}/activate`,
    UPDATE_FRAME_GROUP: (id: string) => `${API_ENDPOINT}/product/frame-group/${id}`,
    UPLOAD_3D_MODEL: `${API_ENDPOINT}/product/frame-variant/upload-3d-model`,
    GET_TEXTURE_FILES:  `${API_ENDPOINT}/product/frame-group/texture-files`,
  },
  CATEGORIES: {
    BASE: `${API_ENDPOINT}/categories`,
    GET_ALL: `${API_ENDPOINT}/categories`,
  },
  LENS: {
    BASE: `${API_ENDPOINT}/lens-catalog`,
    CATALOG_FOR_FRAME: (frameVariantId: string) => `${API_ENDPOINT}/lens-catalog/for-frame/${frameVariantId}`,
    CREATE: `${API_ENDPOINT}/lenses`,
    CREATE_FOR_FRAME: (frameVariantId: string) => `${API_ENDPOINT}/lenses/for-frame/${frameVariantId}`,
    CREATE_FOR_FRAME_GROUP: (frameGroupId: string) => `${API_ENDPOINT}/lenses/for-frame-group/${frameGroupId}`,
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
  PLATFORM_SETTINGS: {
    BASE: `${API_ENDPOINT}/platform-settings`,
    PRESCRIPTION_VALUES: {
      ALL: `${API_ENDPOINT}/platform-settings/prescription-values`,
      SPHERE: `${API_ENDPOINT}/platform-settings/prescription-values/sphere`,
      CYLINDER: `${API_ENDPOINT}/platform-settings/prescription-values/cylinder`,
      ADD: `${API_ENDPOINT}/platform-settings/prescription-values/add`,
      PD: `${API_ENDPOINT}/platform-settings/prescription-values/pd`,
      PD_MONOCULAR: `${API_ENDPOINT}/platform-settings/prescription-values/pd-monocular`,
    },
  },
  CART: {
    BASE: `${API_ENDPOINT}/cart`,
    CREATE: `${API_ENDPOINT}/cart`,
    GET_ACTIVE: `${API_ENDPOINT}/cart/active`,
    GET_MY_CART: `${API_ENDPOINT}/cart/me`,
    ADD_ITEM: (cartId: string) => `${API_ENDPOINT}/cart/${cartId}/items`,
    UPDATE_ITEM: (cartId: string, itemId: string) => `${API_ENDPOINT}/cart/${cartId}/items/${itemId}`,
    REMOVE_ITEM: (cartId: string, itemId: string) => `${API_ENDPOINT}/cart/${cartId}/items/${itemId}`,
    DELETE: (cartId: string) => `${API_ENDPOINT}/cart/${cartId}`,
  },
  ORDERS: {
    BASE: `${API_ENDPOINT}/orders`,
    CREATE: `${API_ENDPOINT}/orders`,
    GET_MY_ORDERS: `${API_ENDPOINT}/orders`,
    GET_BY_ID: (orderId: string) => `${API_ENDPOINT}/orders/${orderId}`,
    CANCEL: (orderId: string) => `${API_ENDPOINT}/orders/${orderId}/cancel`,
    RE_ORDER: (orderId: string) => `${API_ENDPOINT}/orders/${orderId}/re-order`,
  },
  PAYMENTS: {
    CREATE_VNPAY: `${API_ENDPOINT}/payments/create-vnpay`,
    VNPAY_RETURN: `${API_ENDPOINT}/payments/vnpay-return`,
    STATUS: (orderId: string) => `${API_ENDPOINT}/payments/status/${orderId}`,
    TOP_UP: `${API_ENDPOINT}/payments/top-up`,
    PAY_FROM_WALLET: `${API_ENDPOINT}/payments/pay-from-wallet`,
  },
  USER_WALLET: {
    BASE: `${API_ENDPOINT}/wallet`,
    TRANSACTIONS: `${API_ENDPOINT}/wallet/transactions`,
  },
  USER_ADDRESSES: {
    BASE: `${API_ENDPOINT}/user-addresses`,
    GET_BY_ID: (id: string) => `${API_ENDPOINT}/user-addresses/${id}`,
    UPDATE: (id: string) => `${API_ENDPOINT}/user-addresses/${id}`,
    DELETE: (id: string) => `${API_ENDPOINT}/user-addresses/${id}`,
    SET_DEFAULT: (id: string) => `${API_ENDPOINT}/user-addresses/${id}/set-default`,
  },
  WARRANTY: {
    CLAIMS: `${API_ENDPOINT}/warranty-claims`,
    CLAIM_BY_ID: (id: string) => `${API_ENDPOINT}/warranty-claims/${id}`,
    PAY_VNPAY: (id: string) => `${API_ENDPOINT}/warranty-claims/${id}/pay/vnpay`,
    PAY_WALLET: (id: string) => `${API_ENDPOINT}/warranty-claims/${id}/pay/wallet`,
  },
  SHOP_WARRANTY: {
    CLAIMS: `${API_ENDPOINT}/shop/warranty-claims`,
    APPROVE: (id: string) => `${API_ENDPOINT}/shop/warranty-claims/${id}/approve`,
    RECEIVE: (id: string) => `${API_ENDPOINT}/shop/warranty-claims/${id}/receive`,
    REJECT: (id: string) => `${API_ENDPOINT}/shop/warranty-claims/${id}/reject`,
    COMPLETE: (id: string) => `${API_ENDPOINT}/shop/warranty-claims/${id}/complete`,
  },
  RETURNS: {
    REQUESTS: `${API_ENDPOINT}/return-requests`,
    REQUEST_BY_ID: (id: string) => `${API_ENDPOINT}/return-requests/${id}`,
    CANCEL: (id: string) => `${API_ENDPOINT}/return-requests/${id}/cancel`,
  },
  SHOP_INVENTORY: {
    GET: (shopId: string) => `${API_ENDPOINT}/shop/inventory/${shopId}`,
    SET_STOCK: (shopId: string, variantId: string) => `${API_ENDPOINT}/shop/inventory/${shopId}/variant/${variantId}`,
  },
  SHOP_WALLET: {
    BASE: `${API_ENDPOINT}/shop/wallet`,
    WITHDRAWALS: `${API_ENDPOINT}/shop/wallet/withdrawals`,
    CANCEL_WITHDRAWAL: (id: string) => `${API_ENDPOINT}/shop/wallet/withdrawals/${id}/cancel`,
    TRANSACTIONS: `${API_ENDPOINT}/shop/wallet/transactions`,
  },
  SHOPS: {
    LIST: `${API_ENDPOINT}/shops`,
    GET_BY_ID: (id: string) => `${API_ENDPOINT}/shops/${id}`,
    MY_SHOPS: `${API_ENDPOINT}/shops/my-shops`,
    MY_SHOP_BY_ID: (id: string) => `${API_ENDPOINT}/shops/my-shops/${id}`,
    MY_SHOP_RESUBMIT: (id: string) => `${API_ENDPOINT}/shops/my-shops/${id}/resubmit`,
    MY_SHOP_REGISTRATION: (id: string) => `${API_ENDPOINT}/shops/my-shops/${id}/registration`,
    MY_SHOP_DEACTIVATION_STATUS: (id: string) => `${API_ENDPOINT}/shops/my-shops/${id}/deactivation-status`,
    MY_SHOP_CLOSURE_STATUS: (id: string) => `${API_ENDPOINT}/shops/my-shops/${id}/closure-status`,
  },
  ADMIN: {
    SHOPS: {
      REQUESTS: `${API_ENDPOINT}/admin/shops/requests`,
      REVIEW: `${API_ENDPOINT}/admin/shops/review`,
      DEACTIVATE: (shopId: string) => `${API_ENDPOINT}/shops/my-shops/${shopId}/deactivate-request`,
      CANCEL_DEACTIVATE: (shopId: string) => `${API_ENDPOINT}/shops/my-shops/${shopId}/deactivate/cancel`,
      REACTIVATE: (shopId: string) => `${API_ENDPOINT}/shops/my-shops/${shopId}/reactivate`,
      CLOSE: (shopId: string) => `${API_ENDPOINT}/shops/my-shops/${shopId}/close`,
      CANCEL_CLOSE: (shopId: string) => `${API_ENDPOINT}/shops/my-shops/${shopId}/close/cancel`,
    },
    USERS: {
      LIST: `${API_ENDPOINT}/admin/users`,
      GET_BY_ID: (id: string) => `${API_ENDPOINT}/admin/users/${id}`,
      SET_ROLES: (id: string) => `${API_ENDPOINT}/admin/users/${id}/roles`,
      SET_STATUS: (id: string) => `${API_ENDPOINT}/admin/users/${id}/status`,
    },
  },
} as const;


export const PAGE_ENDPOINTS = {
  HOME: '/home',
  PERMISSION_DENIED_ENDPOINT: '/denied',
  DASHBOARD: '/admin/dashboard',

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
    RESUBMIT: `/shop/resubmit`,
    PROFILE: `/shop/profile`,
    PRODUCT_FRAME: `/shop/product/frame`,
    CREATE_FRAME: `/shop/product/frame/create`,
    CREATE_LENS: `/shop/product/lens/create`,
    DASHBOARD: `/shop/dashboard`,
    EDIT_PROFILE: `/shop/edit-profile`,
    BANK_ACCOUNTS: `/shop/bank-accounts`,
    WALLET: `/shop/wallet`,
    PRODUCTS: `/shop/products`,
    ORDERS: `/shop/orders`,
    ORDER_DETAIL: `/shop/orders/:id`,
    REFUND_REVIEW: `/shop/refunds/review`,
    STAFF: `/shop/staff`,
    WARRANTY: `/shop/warranty`,
  },

  ADMIN: {
    SHOP_APPROVAL: `/admin/shop-approval`,
    USER_MANAGEMENT: `/admin/users`,
  },

  ORDER: {
    MY_ORDERS: `/my-orders`,
  },

  WARRANTY: {
    MAIN: `/warranty`,
  },

  REFUND: {
    BUYER_LIST: `/user/refunds`,
    BUYER_DETAIL: `/user/refunds/:requestId`,
    BUYER_CREATE: `/user/refunds/create`,
    SELLER_LIST: `/shop/refunds`,
    SELLER_DETAIL: `/shop/refunds/:requestId`,
  },

  USER: {
    PROFILE: `/users/me`,
    WALLET: `/wallet`,
    HELP: `/help`,
  },

  CART: {
    MAIN: `/cart`,
  },

  CHECKOUT: {
    MAIN: `/checkout`,
  },

  PAYMENT: {
    RESULT: `/payment/result`,
  },

} as const;