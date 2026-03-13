// Role-based access control for Admin Portal

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  admin: {
    // Full access to everything
    canManageUsers: true,
    canManageProducts: true,
    canManageCategories: true,
    canManagePacks: true,
    canManageOrders: true,
    canManageCustomers: true,
    canManageAddresses: true,
    canManagePayments: true,
    canManageDeliveries: true,
    canManageReports: true,
    canManageRewardSettings: true,
    canManageDeactivatedProducts: true,
    canViewDashboard: true,
  },
  manager: {
    // Can manage most things but not users
    canManageUsers: false,
    canManageProducts: true,
    canManageCategories: true,
    canManagePacks: true,
    canManageOrders: true,
    canManageCustomers: true,
    canManageAddresses: true,
    canManagePayments: true,
    canManageDeliveries: true,
    canManageReports: true,
    canManageRewardSettings: true,
    canManageDeactivatedProducts: true,
    canViewDashboard: true,
  },
  staff: {
    // Limited access - can manage products, orders, customers
    canManageUsers: false,
    canManageProducts: true,
    canManageCategories: false,
    canManagePacks: true,
    canManageOrders: true,
    canManageCustomers: true,
    canManageAddresses: false,
    canManagePayments: false,
    canManageDeliveries: false,
    canManageReports: false,
    canManageRewardSettings: false,
    canManageDeactivatedProducts: false,
    canViewDashboard: true,
  },
  delivery: {
    // Only delivery-related access
    canManageUsers: false,
    canManageProducts: false,
    canManageCategories: false,
    canManagePacks: false,
    canManageOrders: true,
    canManageCustomers: false,
    canManageAddresses: false,
    canManagePayments: false,
    canManageDeliveries: true,
    canManageReports: false,
    canManageRewardSettings: false,
    canManageDeactivatedProducts: false,
    canViewDashboard: true,
  },
};

// Get current user role
export const getCurrentUserRole = () => {
  const userStr = localStorage.getItem('adminUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role || 'staff';
    } catch (error) {
      console.error('Error parsing user:', error);
      return 'staff';
    }
  }
  return 'staff';
};

// Check if current user has a specific permission
export const hasPermission = (permission) => {
  const role = getCurrentUserRole();
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

// Check if current user can access a specific route
export const canAccessRoute = (path) => {
  const role = getCurrentUserRole();
  
  // Define route to permission mapping
  const routePermissions = {
    '/': 'canViewDashboard',
    '/categories': 'canManageCategories',
    '/products': 'canManageProducts',
    '/packs': 'canManagePacks',
    '/pack-types': 'canManagePacks',
    '/unit-types': 'canManageProducts',
    '/customers': 'canManageCustomers',
    '/customer-addresses': 'canManageAddresses',
    '/orders': 'canManageOrders',
    '/payments': 'canManagePayments',
    '/deliveries': 'canManageDeliveries',
    '/reports': 'canManageReports',
    '/reward-settings': 'canManageRewardSettings',
    '/deactivated-products': 'canManageDeactivatedProducts',
    '/users': 'canManageUsers',
  };

  const permission = routePermissions[path];
  if (!permission) return true; // Allow unknown routes
  
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

// Get allowed menu items based on role
export const getAllowedMenuItems = () => {
  const role = getCurrentUserRole();
  
  const allMenuItems = [
    { path: '/', label: 'Dashboard', icon: 'fa-tachometer-alt', permission: 'canViewDashboard' },
    { path: '/categories', label: 'Categories', icon: 'fa-th', permission: 'canManageCategories' },
    { path: '/products', label: 'Products', icon: 'fa-box', permission: 'canManageProducts' },
    { path: '/packs', label: 'Packs', icon: 'fa-cubes', permission: 'canManagePacks' },
    { path: '/pack-types', label: 'Pack Types', icon: 'fa-tags', permission: 'canManagePacks' },
    { path: '/unit-types', label: 'Unit Types', icon: 'fa-balance-scale', permission: 'canManageProducts' },
    { path: '/customers', label: 'Customers', icon: 'fa-users', permission: 'canManageCustomers' },
    { path: '/customer-addresses', label: 'Customer Addresses', icon: 'fa-address-book', permission: 'canManageAddresses' },
    { path: '/orders', label: 'Orders', icon: 'fa-shopping-cart', permission: 'canManageOrders' },
    { path: '/payments', label: 'Payments', icon: 'fa-credit-card', permission: 'canManagePayments' },
    { path: '/deliveries', label: 'Deliveries', icon: 'fa-truck', permission: 'canManageDeliveries' },
    { path: '/reports', label: 'Reports', icon: 'fa-chart-bar', permission: 'canManageReports' },
    { path: '/reward-settings', label: 'Reward Settings', icon: 'fa-gift', permission: 'canManageRewardSettings' },
    { path: '/deactivated-products', label: 'Deactivated Products', icon: 'fa-ban', permission: 'canManageDeactivatedProducts' },
    { path: '/users', label: 'User Management', icon: 'fa-user-cog', permission: 'canManageUsers' },
  ];

  return allMenuItems.filter(item => ROLE_PERMISSIONS[role]?.[item.permission]);
};

export default {
  ROLE_PERMISSIONS,
  getCurrentUserRole,
  hasPermission,
  canAccessRoute,
  getAllowedMenuItems,
};
