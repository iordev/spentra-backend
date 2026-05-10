export const DEFAULT_PERMISSIONS = [
  // User Management
  {
    name: 'user:create',
    description:
      'Grants the ability to register and create new user accounts within the system, including assigning initial roles and profile information.',
    group: 'User Management',
  },
  {
    name: 'user:display',
    description:
      'Grants the ability to view user account information, including profile details, assigned roles, and related metadata.',
    group: 'User Management',
  },
  {
    name: 'user:update',
    description:
      'Grants the ability to modify existing user account details such as profile information, roles, credentials, or account settings.',
    group: 'User Management',
  },
  {
    name: 'user:archive',
    description:
      'Grants the ability to archive or deactivate a user account, preventing the user from accessing the system while preserving historical records.',
    group: 'User Management',
  },

  // Role Management
  {
    name: 'role:create',
    description:
      'Grants the ability to create new roles that define a set of permissions for users within the system.',
    group: 'Role Management',
  },
  {
    name: 'role:display',
    description:
      'Grants the ability to view all roles, including their assigned permissions and role details.',
    group: 'Role Management',
  },
  {
    name: 'role:update',
    description:
      'Grants the ability to modify existing roles, including updating role names, descriptions, and associated permissions.',
    group: 'Role Management',
  },
  {
    name: 'role:archive',
    description:
      'Grants the ability to archive or deactivate roles that are no longer required by the system.',
    group: 'Role Management',
  },

  // Permission Management
  {
    name: 'permission:create',
    description:
      'Grants the ability to create new permissions that can be assigned to roles to control access to system features.',
    group: 'Permission Management',
  },
  {
    name: 'permission:display',
    description:
      'Grants the ability to view the complete list of permissions, including their descriptions and assigned groups.',
    group: 'Permission Management',
  },
  {
    name: 'permission:update',
    description:
      'Grants the ability to modify existing permission details such as description or grouping.',
    group: 'Permission Management',
  },
  {
    name: 'permission:archive',
    description:
      'Grants the ability to archive or remove permissions that are no longer used or relevant to the system.',
    group: 'Permission Management',
  },

  // Occupation Management
  {
    name: 'occupation:create',
    description:
      'Grants the ability to create new occupation records used for categorizing user professions or job titles within the system.',
    group: 'Occupation Management',
  },
  {
    name: 'occupation:display',
    description:
      'Grants the ability to view and list all occupation records available in the system.',
    group: 'Occupation Management',
  },
  {
    name: 'occupation:update',
    description:
      'Grants the ability to modify existing occupation records such as occupation name or related metadata.',
    group: 'Occupation Management',
  },
  {
    name: 'occupation:archive',
    description:
      'Grants the ability to archive or deactivate occupation records that are no longer needed while preserving historical references.',
    group: 'Occupation Management',
  },

  // Currency Management
  {
    name: 'currency:create',
    description:
      'Grants the ability to create new currency records used for financial transactions and pricing within the system.',
    group: 'Currency Management',
  },
  {
    name: 'currency:display',
    description:
      'Grants the ability to view and list all supported currencies along with their codes and related details.',
    group: 'Currency Management',
  },
  {
    name: 'currency:update',
    description:
      'Grants the ability to modify existing currency records such as currency name, code, or symbol.',
    group: 'Currency Management',
  },
  {
    name: 'currency:archive',
    description:
      'Grants the ability to archive or deactivate currencies that are no longer supported by the system.',
    group: 'Currency Management',
  },

  // Timezone Management
  {
    name: 'timezone:create',
    description:
      'Grants the ability to create new timezone records used for scheduling, localization, and time-based system operations.',
    group: 'Timezone Management',
  },
  {
    name: 'timezone:display',
    description:
      'Grants the ability to view and list all available timezones supported by the system.',
    group: 'Timezone Management',
  },
  {
    name: 'timezone:update',
    description:
      'Grants the ability to modify existing timezone records including timezone name, offset, or identifier.',
    group: 'Timezone Management',
  },
  {
    name: 'timezone:archive',
    description:
      'Grants the ability to archive or deactivate timezone records that are no longer required.',
    group: 'Timezone Management',
  },

  // Country Management
  {
    name: 'country:create',
    description:
      'Grants the ability to create new country records used for geographic and localization purposes within the system.',
    group: 'Country Management',
  },
  {
    name: 'country:display',
    description:
      'Grants the ability to view and list all country records including country codes and related metadata.',
    group: 'Country Management',
  },
  {
    name: 'country:update',
    description:
      'Grants the ability to modify existing country records such as country name, ISO code, or associated information.',
    group: 'Country Management',
  },
  {
    name: 'country:archive',
    description:
      'Grants the ability to archive or deactivate country records while preserving existing references in the system.',
    group: 'Country Management',
  },

  // REPORT TEMPLATE MANAGEMENT
  {
    name: 'report_template:display',
    description: 'Allows viewing and browsing report templates',
    group: 'Report Template Management',
  },
  {
    name: 'report_template:create',
    description: 'Allows creating new report templates',
    group: 'Report Template Management',
  },
  {
    name: 'report_template:update',
    description: 'Allows editing and updating existing report templates',
    group: 'Report Template Management',
  },
  {
    name: 'report_template:archive',
    description: 'Allows archiving and removing report templates',
    group: 'Report Template Management',
  },

  // EXPENSE CATEGORY MANAGEMENT
  {
    name: 'expense_category:display',
    description: 'Allows viewing and browsing expense categories',
    group: 'Expense Category Management',
  },
  {
    name: 'expense_category:create',
    description: 'Allows creating new expense categories',
    group: 'Expense Category Management',
  },
  {
    name: 'expense_category:update',
    description: 'Allows editing and updating existing expense categories',
    group: 'Expense Category Management',
  },
  {
    name: 'expense_category:archive',
    description: 'Allows archiving and removing expense categories',
    group: 'Expense Category Management',
  },

  // INCOME SOURCE MANAGEMENT
  {
    name: 'income_source:display',
    description: 'Allows viewing and browsing income sources',
    group: 'Income Source Management',
  },
  {
    name: 'income_source:create',
    description: 'Allows creating new income sources',
    group: 'Income Source Management',
  },
  {
    name: 'income_source:update',
    description: 'Allows editing and updating existing income sources',
    group: 'Income Source Management',
  },
  {
    name: 'income_source:archive',
    description: 'Allows archiving and removing income sources',
    group: 'Income Source Management',
  },

  // PAYMENT METHOD MANAGEMENT
  {
    name: 'payment_method:display',
    description: 'Allows viewing and browsing payment methods',
    group: 'Payment Method Management',
  },
  {
    name: 'payment_method:create',
    description: 'Allows creating new payment methods',
    group: 'Payment Method Management',
  },
  {
    name: 'payment_method:update',
    description: 'Allows editing and updating existing payment methods',
    group: 'Payment Method Management',
  },
  {
    name: 'payment_method:archive',
    description: 'Allows archiving and removing payment methods',
    group: 'Payment Method Management',
  },

  // BANK MANAGEMENT
  {
    name: 'bank:display',
    description: 'Allows viewing and browsing banks',
    group: 'Bank Management',
  },
  { name: 'bank:create', description: 'Allows creating new banks', group: 'Bank Management' },
  {
    name: 'bank:update',
    description: 'Allows editing and updating existing banks',
    group: 'Bank Management',
  },
  {
    name: 'bank:archive',
    description: 'Allows archiving and removing banks',
    group: 'Bank Management',
  },

  //DASHBOARD MANAGEMENT
  {
    name: 'dashboard:display',
    description: 'Allows viewing the main dashboard with system overview and analytics',
    group: 'Dashboard Management',
  },

  // REPORT MANAGEMENT
  {
    name: 'report:display',
    description: 'Allows viewing and generating reports based on available report templates',
    group: 'Report Management',
  },
  {
    name: 'report:create',
    description: 'Allows creating and exporting new reports',
    group: 'Report Management',
  },
];
