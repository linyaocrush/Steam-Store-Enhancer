  const STORAGE_KEY_REGION_ID = 'sapx_target_region_id_v1';
  const STORAGE_KEY_SHOW_CODE = 'sapx_show_region_code_v1';

  const REGIONS = [
    { id: 'SASIA_USD', short: 'SASIA', label: 'South Asia - USD', currency: 'USD', ccCandidates: ['PK'] },
    { id: 'CNY', short: 'CN', label: 'Chinese Yuan', currency: 'CNY', ccCandidates: ['CN'] },
    { id: 'INR', short: 'IN', label: 'Indian Rupee', currency: 'INR', ccCandidates: ['IN'] },
    { id: 'UAH', short: 'UA', label: 'Ukrainian Hryvnia', currency: 'UAH', ccCandidates: ['UA'] },
    { id: 'VND', short: 'VN', label: 'Vietnamese Dong', currency: 'VND', ccCandidates: ['VN'] },
    { id: 'IDR', short: 'ID', label: 'Indonesian Rupiah', currency: 'IDR', ccCandidates: ['ID'] },
    { id: 'KZT', short: 'KZ', label: 'Kazakhstani Tenge', currency: 'KZT', ccCandidates: ['KZ'] },
    { id: 'PHP', short: 'PH', label: 'Philippine Peso', currency: 'PHP', ccCandidates: ['PH'] },
    { id: 'KRW', short: 'KR', label: 'South Korea Won', currency: 'KRW', ccCandidates: ['KR'] },
    { id: 'PEN', short: 'PE', label: 'Peruvian Sol', currency: 'PEN', ccCandidates: ['PE'] },
    { id: 'JPY', short: 'JP', label: 'Japanese Yen', currency: 'JPY', ccCandidates: ['JP'] },
    { id: 'CIS_USD', short: 'CIS', label: 'CIS - U.S. Dollar', currency: 'USD', ccCandidates: ['AZ'] },
    { id: 'LATAM_USD', short: 'LATAM', label: 'LATAM - U.S. Dollar', currency: 'USD', ccCandidates: ['AR'] },
    { id: 'MENA_USD', short: 'MENA', label: 'MENA - U.S. Dollar', currency: 'USD', ccCandidates: ['TR'] },
    { id: 'THB', short: 'TH', label: 'Thai Baht', currency: 'THB', ccCandidates: ['TH'] },
    { id: 'MYR', short: 'MY', label: 'Malaysian Ringgit', currency: 'MYR', ccCandidates: ['MY'] },
    { id: 'CLP', short: 'CL', label: 'Chilean Peso', currency: 'CLP', ccCandidates: ['CL'] },
    { id: 'MXN', short: 'MX', label: 'Mexican Peso', currency: 'MXN', ccCandidates: ['MX'] },
    { id: 'UYU', short: 'UY', label: 'Uruguayan Peso', currency: 'UYU', ccCandidates: ['UY'] },
    { id: 'BRL', short: 'BR', label: 'Brazilian Real', currency: 'BRL', ccCandidates: ['BR'] },
    { id: 'TWD', short: 'TW', label: 'Taiwan Dollar', currency: 'TWD', ccCandidates: ['TW'] },
    { id: 'ZAR', short: 'ZA', label: 'South African Rand', currency: 'ZAR', ccCandidates: ['ZA'] },
    { id: 'AED', short: 'AE', label: 'U.A.E. Dirham', currency: 'AED', ccCandidates: ['AE'] },
    { id: 'HKD', short: 'HK', label: 'Hong Kong Dollar', currency: 'HKD', ccCandidates: ['HK'] },
    { id: 'NZD', short: 'NZ', label: 'New Zealand Dollar', currency: 'NZD', ccCandidates: ['NZ'] },
    { id: 'NOK', short: 'NO', label: 'Norwegian Krone', currency: 'NOK', ccCandidates: ['NO'] },
    { id: 'KWD', short: 'KW', label: 'Kuwaiti Dinar', currency: 'KWD', ccCandidates: ['KW'] },
    { id: 'COP', short: 'CO', label: 'Colombian Peso', currency: 'COP', ccCandidates: ['CO'] },
    { id: 'AUD', short: 'AU', label: 'Australian Dollar', currency: 'AUD', ccCandidates: ['AU'] },
    { id: 'USD', short: 'US', label: 'U.S. Dollar', currency: 'USD', ccCandidates: ['US'] },
    { id: 'CAD', short: 'CA', label: 'Canadian Dollar', currency: 'CAD', ccCandidates: ['CA'] },
    { id: 'SGD', short: 'SG', label: 'Singapore Dollar', currency: 'SGD', ccCandidates: ['SG'] },
    { id: 'SAR', short: 'SA', label: 'Saudi Riyal', currency: 'SAR', ccCandidates: ['SA'] },
    { id: 'QAR', short: 'QA', label: 'Qatari Riyal', currency: 'QAR', ccCandidates: ['QA'] },
    { id: 'GBP', short: 'GB', label: 'British Pound', currency: 'GBP', ccCandidates: ['GB'] },
    { id: 'EUR', short: 'EU', label: 'Euro', currency: 'EUR', ccCandidates: ['EU', 'DE'] },
    { id: 'PLN', short: 'PL', label: 'Polish Zloty', currency: 'PLN', ccCandidates: ['PL'] },
    { id: 'CRC', short: 'CR', label: 'Costa Rican Colon', currency: 'CRC', ccCandidates: ['CR'] },
    { id: 'ILS', short: 'IL', label: 'Israeli New Shekel', currency: 'ILS', ccCandidates: ['IL'] },
    { id: 'CHF', short: 'CH', label: 'Swiss Franc', currency: 'CHF', ccCandidates: ['CH'] },
    { id: 'RUB', short: 'RU', label: 'Russian Ruble', currency: 'RUB', ccCandidates: ['RU'] }
  ];

  function getRegionById(id) { return REGIONS.find(r => r.id === id) || null; }
  function getTargetRegion() { const id = GM_getValue(STORAGE_KEY_REGION_ID, 'CNY'); return getRegionById(id) || getRegionById('CNY'); }
  function getShowRegionCode() { return Boolean(GM_getValue(STORAGE_KEY_SHOW_CODE, true)); }
  function isCartPage() { return /^\/cart(?:\/|$)/i.test(location.pathname); }
  function isWishlistPage() { return /^\/wishlist(?:\/|$)/i.test(location.pathname); }

  const STYLE_ID = 'sapx-style';
  const EXTRA_CLASS = 'sapx-extra-price';
  const CART_SUMMARY_ID = 'sapx-cart-summary';
  const MARK_ATTR = 'data-sapx-region';

  const UI_STYLE_ID = 'sapx-ui-style';
  const UI_ROOT_ID = 'sapx-ui-root';
