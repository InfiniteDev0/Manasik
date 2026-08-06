// Workspace types — Step 2
export const WORKSPACE_TYPES = [
  {
    id: 'BUSINESS',
    label: 'My Business',
    description: 'Run clients, operations, sales and finances',
    icon: '/images/business.svg',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-400/10',
  },
  {
    id: 'TEAM',
    label: 'My Team',
    description: 'Projects, tasks, and team collaboration',
    icon: '/images/team.svg',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
  },
  {
    id: 'PERSONAL',
    label: 'Personal',
    description: 'Notes, goals, and life organization',
    icon: '/images/avatar.svg',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-400/10',
  },
] as const;

// Business categories — Step 3 (only for BUSINESS workspaces)
export const BUSINESS_CATEGORIES = [
  { id: 'RETAIL',    label: 'Retail & Commerce',    description: 'Stores, shops, e-commerce',      icon: '/images/business.svg', iconColor: 'text-green-400',  iconBg: 'bg-green-400/10'  },
  { id: 'FOOD',      label: 'Food & Hospitality',   description: 'Restaurants, cafes, catering',   icon: '/images/business.svg', iconColor: 'text-orange-400', iconBg: 'bg-orange-400/10' },
  { id: 'HEALTH',    label: 'Health & Wellness',    description: 'Clinics, gyms, salons',          icon: '/images/business.svg', iconColor: 'text-pink-400',   iconBg: 'bg-pink-400/10'   },
  { id: 'AGENCY',    label: 'Agency & Consulting',  description: 'Marketing, design, law firms',   icon: '/images/business.svg', iconColor: 'text-blue-400',   iconBg: 'bg-blue-400/10'   },
  { id: 'TECH',      label: 'Tech & Software',      description: 'SaaS, apps, development',        icon: '/images/business.svg', iconColor: 'text-cyan-400',   iconBg: 'bg-cyan-400/10'   },
  { id: 'TRADES',    label: 'Trades & Services',    description: 'Contractors, cleaning, repairs', icon: '/images/business.svg', iconColor: 'text-yellow-400', iconBg: 'bg-yellow-400/10' },
  { id: 'EDUCATION', label: 'Education & Coaching', description: 'Tutoring, courses, training',    icon: '/images/business.svg', iconColor: 'text-indigo-400', iconBg: 'bg-indigo-400/10' },
  { id: 'OTHER',     label: 'Other',                description: 'Something else entirely',        icon: '/images/business.svg', iconColor: 'text-zinc-400',   iconBg: 'bg-zinc-400/10'   },
] as const;

// Business sub-types per category
export const BUSINESS_TYPES: Record<string, Array<{ id: string; label: string }>> = {
  RETAIL:    [{ id: 'CLOTHING', label: 'Clothing Store' }, { id: 'ELECTRONICS', label: 'Electronics' }, { id: 'GROCERY', label: 'Grocery Store' }, { id: 'FURNITURE', label: 'Furniture Store' }, { id: 'BOOKSTORE', label: 'Bookstore' }, { id: 'PHARMACY_R', label: 'Pharmacy' }, { id: 'OTHER_RETAIL', label: 'Other Retail' }],
  FOOD:      [{ id: 'RESTAURANT', label: 'Restaurant' }, { id: 'CAFE', label: 'Café' }, { id: 'FAST_FOOD', label: 'Fast Food' }, { id: 'BAR', label: 'Bar & Pub' }, { id: 'CATERING', label: 'Catering' }, { id: 'BAKERY', label: 'Bakery' }, { id: 'OTHER_FOOD', label: 'Other Food' }],
  HEALTH:    [{ id: 'GYM', label: 'Gym & Fitness' }, { id: 'SALON', label: 'Hair Salon' }, { id: 'SPA', label: 'Spa & Wellness' }, { id: 'CLINIC', label: 'Clinic' }, { id: 'PHARMACY_H', label: 'Pharmacy' }, { id: 'TRAINER', label: 'Personal Trainer' }, { id: 'OTHER_HEALTH', label: 'Other Health' }],
  AGENCY:    [{ id: 'MARKETING', label: 'Marketing Agency' }, { id: 'DESIGN', label: 'Design Agency' }, { id: 'LAW', label: 'Law Firm' }, { id: 'ACCOUNTING', label: 'Accounting Firm' }, { id: 'CONSULTING', label: 'Consulting' }, { id: 'PR', label: 'PR Agency' }, { id: 'OTHER_AGENCY', label: 'Other Agency' }],
  TECH:      [{ id: 'SAAS', label: 'SaaS Product' }, { id: 'MOBILE', label: 'Mobile App' }, { id: 'WEBDEV', label: 'Web Development' }, { id: 'IT_SUPPORT', label: 'IT Support' }, { id: 'SOFTWARE_AGENCY', label: 'Software Agency' }, { id: 'OTHER_TECH', label: 'Other Tech' }],
  TRADES:    [{ id: 'CLEANING', label: 'Cleaning Services' }, { id: 'CONSTRUCTION', label: 'Construction' }, { id: 'PLUMBING', label: 'Plumbing & Electric' }, { id: 'LANDSCAPING', label: 'Landscaping' }, { id: 'SECURITY', label: 'Security' }, { id: 'OTHER_TRADES', label: 'Other Trades' }],
  EDUCATION: [{ id: 'ONLINE_COURSES', label: 'Online Courses' }, { id: 'TUTORING', label: 'Tutoring' }, { id: 'CORPORATE_TRAINING', label: 'Corporate Training' }, { id: 'COACHING', label: 'Coaching' }, { id: 'OTHER_EDUCATION', label: 'Other Education' }],
  OTHER:     [{ id: 'OTHER', label: 'Something else' }],
};

// Tools list
export const TOOLS = [
  // Business tools
  { id: 'CRM',       label: 'CRM',           description: 'Track clients and deals',    icon: 'Users',         iconColor: 'text-blue-400',   iconBg: 'bg-blue-400/10',   category: 'BUSINESS' as const },
  { id: 'INVOICING', label: 'Invoicing',     description: 'Create and send invoices',   icon: 'FileText',      iconColor: 'text-green-400',  iconBg: 'bg-green-400/10',  category: 'BUSINESS' as const },
  { id: 'POS',       label: 'Point of Sale', description: 'In-person sales terminal',   icon: 'ShoppingCart',  iconColor: 'text-orange-400', iconBg: 'bg-orange-400/10', category: 'BUSINESS' as const },
  { id: 'ORDERS',    label: 'Orders',        description: 'Manage orders and delivery', icon: 'Package',       iconColor: 'text-yellow-400', iconBg: 'bg-yellow-400/10', category: 'BUSINESS' as const },
  { id: 'BOOKING',   label: 'Booking',       description: 'Appointment scheduling',     icon: 'CalendarCheck', iconColor: 'text-pink-400',   iconBg: 'bg-pink-400/10',   category: 'BUSINESS' as const },
  { id: 'INVENTORY', label: 'Inventory',     description: 'Stock management',           icon: 'Boxes',         iconColor: 'text-cyan-400',   iconBg: 'bg-cyan-400/10',   category: 'BUSINESS' as const },
  { id: 'HR',        label: 'HR & Team',     description: 'Employee management',        icon: 'UserCheck',     iconColor: 'text-indigo-400', iconBg: 'bg-indigo-400/10', category: 'BUSINESS' as const },
  // Productivity tools
  { id: 'TASKS',  label: 'Tasks',     description: 'Kanban boards and to-dos', icon: 'CheckSquare',   iconColor: 'text-green-400',  iconBg: 'bg-green-400/10',  category: 'PRODUCTIVITY' as const },
  { id: 'SHEETS', label: 'Sheets',    description: 'Spreadsheets and data',    icon: 'Table2',        iconColor: 'text-blue-400',   iconBg: 'bg-blue-400/10',   category: 'PRODUCTIVITY' as const },
  { id: 'FORMS',  label: 'Forms',     description: 'Collect responses',        icon: 'ClipboardList', iconColor: 'text-purple-400', iconBg: 'bg-purple-400/10', category: 'PRODUCTIVITY' as const },
  { id: 'CHAT',   label: 'Team Chat', description: 'Internal messaging',       icon: 'MessageSquare', iconColor: 'text-zinc-400',   iconBg: 'bg-zinc-400/10',   category: 'PRODUCTIVITY' as const },
] as const;

// Default tools pre-selected by workspace type
export const DEFAULT_TOOLS_BY_WORKSPACE_TYPE: Record<string, string[]> = {
  PERSONAL: ['TASKS'],
  TEAM:     ['TASKS', 'CHAT', 'FORMS'],
};

// Default tools pre-selected by business category
export const DEFAULT_TOOLS_BY_CATEGORY: Record<string, string[]> = {
  RETAIL:    ['POS', 'INVENTORY', 'ORDERS', 'TASKS'],
  FOOD:      ['POS', 'ORDERS', 'BOOKING', 'TASKS'],
  HEALTH:    ['BOOKING', 'CRM', 'INVOICING', 'TASKS'],
  AGENCY:    ['CRM', 'INVOICING', 'TASKS', 'FORMS'],
  TECH:      ['TASKS', 'CRM', 'INVOICING', 'CHAT'],
  TRADES:    ['INVOICING', 'BOOKING', 'CRM', 'TASKS'],
  EDUCATION: ['BOOKING', 'FORMS', 'TASKS', 'CRM'],
  OTHER:     ['TASKS', 'CRM'],
};

// Team sizes — Step 5
export const TEAM_SIZES = [
  { id: 'SOLO',   label: 'Just me',      description: 'Solo founder or freelancer', icon: 'User',      iconColor: 'text-green-400',  iconBg: 'bg-green-400/10'  },
  { id: 'SMALL',  label: '2–10 people',  description: 'Small team',                 icon: 'Users',     iconColor: 'text-blue-400',   iconBg: 'bg-blue-400/10'   },
  { id: 'MEDIUM', label: '10–50 people', description: 'Growing business',           icon: 'Building',  iconColor: 'text-purple-400', iconBg: 'bg-purple-400/10' },
  { id: 'LARGE',  label: '50+ people',   description: 'Large organization',         icon: 'Building2', iconColor: 'text-orange-400', iconBg: 'bg-orange-400/10' },
] as const;

// Plans shown in onboarding — Step 7
export const ONBOARDING_PLANS = [
  {
    id: 'FREE',
    dbPlan: 'FREE',
    label: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try Lenzro with no commitment',
    features: ['1 workspace', '3 members', '5 tools', '50 pages', 'All system pages'],
    highlight: false,
  },
  {
    id: 'GROWTH',
    dbPlan: 'PRO',
    label: 'Growth',
    price: '$19',
    period: 'per month',
    description: 'For small teams and growing businesses',
    features: ['3 workspaces', '10 members', 'All tools', 'Unlimited pages', 'Real email inbox', 'Basic AI'],
    highlight: true,
  },
  {
    id: 'TEAM',
    dbPlan: 'TEAM',
    label: 'Team',
    price: '$49',
    period: 'per month',
    description: 'For larger teams and serious operations',
    features: ['Unlimited workspaces', 'Unlimited members', 'All tools', 'Unlimited pages', 'Custom domain email', 'Advanced AI', 'Priority support'],
    highlight: false,
  },
  {
    id: 'ENTERPRISE',
    dbPlan: 'ENTERPRISE',
    label: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    description: 'For organizations with custom needs',
    features: ['Everything in Team', 'SSO & SAML', 'SLA & dedicated support', 'Custom integrations', 'On-premise option', 'Security review'],
    highlight: false,
  },
] as const;
