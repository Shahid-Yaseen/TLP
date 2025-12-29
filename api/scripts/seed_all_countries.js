/**
 * Seed All Countries Table
 * Populates the countries table with ALL countries from the world (ISO 3166-1)
 */

const { getPool } = require('../config/database');

const pool = getPool();

// Complete list of all countries with ISO codes (195 countries)
const allCountries = [
  { name: 'Afghanistan', alpha_2_code: 'AF', alpha_3_code: 'AFG' },
  { name: 'Albania', alpha_2_code: 'AL', alpha_3_code: 'ALB' },
  { name: 'Algeria', alpha_2_code: 'DZ', alpha_3_code: 'DZA' },
  { name: 'Andorra', alpha_2_code: 'AD', alpha_3_code: 'AND' },
  { name: 'Angola', alpha_2_code: 'AO', alpha_3_code: 'AGO' },
  { name: 'Antigua and Barbuda', alpha_2_code: 'AG', alpha_3_code: 'ATG' },
  { name: 'Argentina', alpha_2_code: 'AR', alpha_3_code: 'ARG' },
  { name: 'Armenia', alpha_2_code: 'AM', alpha_3_code: 'ARM' },
  { name: 'Australia', alpha_2_code: 'AU', alpha_3_code: 'AUS' },
  { name: 'Austria', alpha_2_code: 'AT', alpha_3_code: 'AUT' },
  { name: 'Azerbaijan', alpha_2_code: 'AZ', alpha_3_code: 'AZE' },
  { name: 'Bahamas', alpha_2_code: 'BS', alpha_3_code: 'BHS' },
  { name: 'Bahrain', alpha_2_code: 'BH', alpha_3_code: 'BHR' },
  { name: 'Bangladesh', alpha_2_code: 'BD', alpha_3_code: 'BGD' },
  { name: 'Barbados', alpha_2_code: 'BB', alpha_3_code: 'BRB' },
  { name: 'Belarus', alpha_2_code: 'BY', alpha_3_code: 'BLR' },
  { name: 'Belgium', alpha_2_code: 'BE', alpha_3_code: 'BEL' },
  { name: 'Belize', alpha_2_code: 'BZ', alpha_3_code: 'BLZ' },
  { name: 'Benin', alpha_2_code: 'BJ', alpha_3_code: 'BEN' },
  { name: 'Bhutan', alpha_2_code: 'BT', alpha_3_code: 'BTN' },
  { name: 'Bolivia', alpha_2_code: 'BO', alpha_3_code: 'BOL' },
  { name: 'Bosnia and Herzegovina', alpha_2_code: 'BA', alpha_3_code: 'BIH' },
  { name: 'Botswana', alpha_2_code: 'BW', alpha_3_code: 'BWA' },
  { name: 'Brazil', alpha_2_code: 'BR', alpha_3_code: 'BRA' },
  { name: 'Brunei', alpha_2_code: 'BN', alpha_3_code: 'BRN' },
  { name: 'Bulgaria', alpha_2_code: 'BG', alpha_3_code: 'BGR' },
  { name: 'Burkina Faso', alpha_2_code: 'BF', alpha_3_code: 'BFA' },
  { name: 'Burundi', alpha_2_code: 'BI', alpha_3_code: 'BDI' },
  { name: 'Cambodia', alpha_2_code: 'KH', alpha_3_code: 'KHM' },
  { name: 'Cameroon', alpha_2_code: 'CM', alpha_3_code: 'CMR' },
  { name: 'Canada', alpha_2_code: 'CA', alpha_3_code: 'CAN' },
  { name: 'Cape Verde', alpha_2_code: 'CV', alpha_3_code: 'CPV' },
  { name: 'Central African Republic', alpha_2_code: 'CF', alpha_3_code: 'CAF' },
  { name: 'Chad', alpha_2_code: 'TD', alpha_3_code: 'TCD' },
  { name: 'Chile', alpha_2_code: 'CL', alpha_3_code: 'CHL' },
  { name: 'China', alpha_2_code: 'CN', alpha_3_code: 'CHN' },
  { name: 'Colombia', alpha_2_code: 'CO', alpha_3_code: 'COL' },
  { name: 'Comoros', alpha_2_code: 'KM', alpha_3_code: 'COM' },
  { name: 'Congo', alpha_2_code: 'CG', alpha_3_code: 'COG' },
  { name: 'Costa Rica', alpha_2_code: 'CR', alpha_3_code: 'CRI' },
  { name: 'Croatia', alpha_2_code: 'HR', alpha_3_code: 'HRV' },
  { name: 'Cuba', alpha_2_code: 'CU', alpha_3_code: 'CUB' },
  { name: 'Cyprus', alpha_2_code: 'CY', alpha_3_code: 'CYP' },
  { name: 'Czech Republic', alpha_2_code: 'CZ', alpha_3_code: 'CZE' },
  { name: 'Denmark', alpha_2_code: 'DK', alpha_3_code: 'DNK' },
  { name: 'Djibouti', alpha_2_code: 'DJ', alpha_3_code: 'DJI' },
  { name: 'Dominica', alpha_2_code: 'DM', alpha_3_code: 'DMA' },
  { name: 'Dominican Republic', alpha_2_code: 'DO', alpha_3_code: 'DOM' },
  { name: 'Ecuador', alpha_2_code: 'EC', alpha_3_code: 'ECU' },
  { name: 'Egypt', alpha_2_code: 'EG', alpha_3_code: 'EGY' },
  { name: 'El Salvador', alpha_2_code: 'SV', alpha_3_code: 'SLV' },
  { name: 'Equatorial Guinea', alpha_2_code: 'GQ', alpha_3_code: 'GNQ' },
  { name: 'Eritrea', alpha_2_code: 'ER', alpha_3_code: 'ERI' },
  { name: 'Estonia', alpha_2_code: 'EE', alpha_3_code: 'EST' },
  { name: 'Eswatini', alpha_2_code: 'SZ', alpha_3_code: 'SWZ' },
  { name: 'Ethiopia', alpha_2_code: 'ET', alpha_3_code: 'ETH' },
  { name: 'Fiji', alpha_2_code: 'FJ', alpha_3_code: 'FJI' },
  { name: 'Finland', alpha_2_code: 'FI', alpha_3_code: 'FIN' },
  { name: 'France', alpha_2_code: 'FR', alpha_3_code: 'FRA' },
  { name: 'Gabon', alpha_2_code: 'GA', alpha_3_code: 'GAB' },
  { name: 'Gambia', alpha_2_code: 'GM', alpha_3_code: 'GMB' },
  { name: 'Georgia', alpha_2_code: 'GE', alpha_3_code: 'GEO' },
  { name: 'Germany', alpha_2_code: 'DE', alpha_3_code: 'DEU' },
  { name: 'Ghana', alpha_2_code: 'GH', alpha_3_code: 'GHA' },
  { name: 'Greece', alpha_2_code: 'GR', alpha_3_code: 'GRC' },
  { name: 'Grenada', alpha_2_code: 'GD', alpha_3_code: 'GRD' },
  { name: 'Guatemala', alpha_2_code: 'GT', alpha_3_code: 'GTM' },
  { name: 'Guinea', alpha_2_code: 'GN', alpha_3_code: 'GIN' },
  { name: 'Guinea-Bissau', alpha_2_code: 'GW', alpha_3_code: 'GNB' },
  { name: 'Guyana', alpha_2_code: 'GY', alpha_3_code: 'GUY' },
  { name: 'Haiti', alpha_2_code: 'HT', alpha_3_code: 'HTI' },
  { name: 'Honduras', alpha_2_code: 'HN', alpha_3_code: 'HND' },
  { name: 'Hungary', alpha_2_code: 'HU', alpha_3_code: 'HUN' },
  { name: 'Iceland', alpha_2_code: 'IS', alpha_3_code: 'ISL' },
  { name: 'India', alpha_2_code: 'IN', alpha_3_code: 'IND' },
  { name: 'Indonesia', alpha_2_code: 'ID', alpha_3_code: 'IDN' },
  { name: 'Iran', alpha_2_code: 'IR', alpha_3_code: 'IRN' },
  { name: 'Iraq', alpha_2_code: 'IQ', alpha_3_code: 'IRQ' },
  { name: 'Ireland', alpha_2_code: 'IE', alpha_3_code: 'IRL' },
  { name: 'Israel', alpha_2_code: 'IL', alpha_3_code: 'ISR' },
  { name: 'Italy', alpha_2_code: 'IT', alpha_3_code: 'ITA' },
  { name: 'Jamaica', alpha_2_code: 'JM', alpha_3_code: 'JAM' },
  { name: 'Japan', alpha_2_code: 'JP', alpha_3_code: 'JPN' },
  { name: 'Jordan', alpha_2_code: 'JO', alpha_3_code: 'JOR' },
  { name: 'Kazakhstan', alpha_2_code: 'KZ', alpha_3_code: 'KAZ' },
  { name: 'Kenya', alpha_2_code: 'KE', alpha_3_code: 'KEN' },
  { name: 'Kiribati', alpha_2_code: 'KI', alpha_3_code: 'KIR' },
  { name: 'Kuwait', alpha_2_code: 'KW', alpha_3_code: 'KWT' },
  { name: 'Kyrgyzstan', alpha_2_code: 'KG', alpha_3_code: 'KGZ' },
  { name: 'Laos', alpha_2_code: 'LA', alpha_3_code: 'LAO' },
  { name: 'Latvia', alpha_2_code: 'LV', alpha_3_code: 'LVA' },
  { name: 'Lebanon', alpha_2_code: 'LB', alpha_3_code: 'LBN' },
  { name: 'Lesotho', alpha_2_code: 'LS', alpha_3_code: 'LSO' },
  { name: 'Liberia', alpha_2_code: 'LR', alpha_3_code: 'LBR' },
  { name: 'Libya', alpha_2_code: 'LY', alpha_3_code: 'LBY' },
  { name: 'Liechtenstein', alpha_2_code: 'LI', alpha_3_code: 'LIE' },
  { name: 'Lithuania', alpha_2_code: 'LT', alpha_3_code: 'LTU' },
  { name: 'Luxembourg', alpha_2_code: 'LU', alpha_3_code: 'LUX' },
  { name: 'Madagascar', alpha_2_code: 'MG', alpha_3_code: 'MDG' },
  { name: 'Malawi', alpha_2_code: 'MW', alpha_3_code: 'MWI' },
  { name: 'Malaysia', alpha_2_code: 'MY', alpha_3_code: 'MYS' },
  { name: 'Maldives', alpha_2_code: 'MV', alpha_3_code: 'MDV' },
  { name: 'Mali', alpha_2_code: 'ML', alpha_3_code: 'MLI' },
  { name: 'Malta', alpha_2_code: 'MT', alpha_3_code: 'MLT' },
  { name: 'Marshall Islands', alpha_2_code: 'MH', alpha_3_code: 'MHL' },
  { name: 'Mauritania', alpha_2_code: 'MR', alpha_3_code: 'MRT' },
  { name: 'Mauritius', alpha_2_code: 'MU', alpha_3_code: 'MUS' },
  { name: 'Mexico', alpha_2_code: 'MX', alpha_3_code: 'MEX' },
  { name: 'Micronesia', alpha_2_code: 'FM', alpha_3_code: 'FSM' },
  { name: 'Moldova', alpha_2_code: 'MD', alpha_3_code: 'MDA' },
  { name: 'Monaco', alpha_2_code: 'MC', alpha_3_code: 'MCO' },
  { name: 'Mongolia', alpha_2_code: 'MN', alpha_3_code: 'MNG' },
  { name: 'Montenegro', alpha_2_code: 'ME', alpha_3_code: 'MNE' },
  { name: 'Morocco', alpha_2_code: 'MA', alpha_3_code: 'MAR' },
  { name: 'Mozambique', alpha_2_code: 'MZ', alpha_3_code: 'MOZ' },
  { name: 'Myanmar', alpha_2_code: 'MM', alpha_3_code: 'MMR' },
  { name: 'Namibia', alpha_2_code: 'NA', alpha_3_code: 'NAM' },
  { name: 'Nauru', alpha_2_code: 'NR', alpha_3_code: 'NRU' },
  { name: 'Nepal', alpha_2_code: 'NP', alpha_3_code: 'NPL' },
  { name: 'Netherlands', alpha_2_code: 'NL', alpha_3_code: 'NLD' },
  { name: 'New Zealand', alpha_2_code: 'NZ', alpha_3_code: 'NZL' },
  { name: 'Nicaragua', alpha_2_code: 'NI', alpha_3_code: 'NIC' },
  { name: 'Niger', alpha_2_code: 'NE', alpha_3_code: 'NER' },
  { name: 'Nigeria', alpha_2_code: 'NG', alpha_3_code: 'NGA' },
  { name: 'North Korea', alpha_2_code: 'KP', alpha_3_code: 'PRK' },
  { name: 'North Macedonia', alpha_2_code: 'MK', alpha_3_code: 'MKD' },
  { name: 'Norway', alpha_2_code: 'NO', alpha_3_code: 'NOR' },
  { name: 'Oman', alpha_2_code: 'OM', alpha_3_code: 'OMN' },
  { name: 'Pakistan', alpha_2_code: 'PK', alpha_3_code: 'PAK' },
  { name: 'Palau', alpha_2_code: 'PW', alpha_3_code: 'PLW' },
  { name: 'Palestine', alpha_2_code: 'PS', alpha_3_code: 'PSE' },
  { name: 'Panama', alpha_2_code: 'PA', alpha_3_code: 'PAN' },
  { name: 'Papua New Guinea', alpha_2_code: 'PG', alpha_3_code: 'PNG' },
  { name: 'Paraguay', alpha_2_code: 'PY', alpha_3_code: 'PRY' },
  { name: 'Peru', alpha_2_code: 'PE', alpha_3_code: 'PER' },
  { name: 'Philippines', alpha_2_code: 'PH', alpha_3_code: 'PHL' },
  { name: 'Poland', alpha_2_code: 'PL', alpha_3_code: 'POL' },
  { name: 'Portugal', alpha_2_code: 'PT', alpha_3_code: 'PRT' },
  { name: 'Qatar', alpha_2_code: 'QA', alpha_3_code: 'QAT' },
  { name: 'Romania', alpha_2_code: 'RO', alpha_3_code: 'ROU' },
  { name: 'Russia', alpha_2_code: 'RU', alpha_3_code: 'RUS' },
  { name: 'Rwanda', alpha_2_code: 'RW', alpha_3_code: 'RWA' },
  { name: 'Saint Kitts and Nevis', alpha_2_code: 'KN', alpha_3_code: 'KNA' },
  { name: 'Saint Lucia', alpha_2_code: 'LC', alpha_3_code: 'LCA' },
  { name: 'Saint Vincent and the Grenadines', alpha_2_code: 'VC', alpha_3_code: 'VCT' },
  { name: 'Samoa', alpha_2_code: 'WS', alpha_3_code: 'WSM' },
  { name: 'San Marino', alpha_2_code: 'SM', alpha_3_code: 'SMR' },
  { name: 'Sao Tome and Principe', alpha_2_code: 'ST', alpha_3_code: 'STP' },
  { name: 'Saudi Arabia', alpha_2_code: 'SA', alpha_3_code: 'SAU' },
  { name: 'Senegal', alpha_2_code: 'SN', alpha_3_code: 'SEN' },
  { name: 'Serbia', alpha_2_code: 'RS', alpha_3_code: 'SRB' },
  { name: 'Seychelles', alpha_2_code: 'SC', alpha_3_code: 'SYC' },
  { name: 'Sierra Leone', alpha_2_code: 'SL', alpha_3_code: 'SLE' },
  { name: 'Singapore', alpha_2_code: 'SG', alpha_3_code: 'SGP' },
  { name: 'Slovakia', alpha_2_code: 'SK', alpha_3_code: 'SVK' },
  { name: 'Slovenia', alpha_2_code: 'SI', alpha_3_code: 'SVN' },
  { name: 'Solomon Islands', alpha_2_code: 'SB', alpha_3_code: 'SLB' },
  { name: 'Somalia', alpha_2_code: 'SO', alpha_3_code: 'SOM' },
  { name: 'South Africa', alpha_2_code: 'ZA', alpha_3_code: 'ZAF' },
  { name: 'South Korea', alpha_2_code: 'KR', alpha_3_code: 'KOR' },
  { name: 'South Sudan', alpha_2_code: 'SS', alpha_3_code: 'SSD' },
  { name: 'Spain', alpha_2_code: 'ES', alpha_3_code: 'ESP' },
  { name: 'Sri Lanka', alpha_2_code: 'LK', alpha_3_code: 'LKA' },
  { name: 'Sudan', alpha_2_code: 'SD', alpha_3_code: 'SDN' },
  { name: 'Suriname', alpha_2_code: 'SR', alpha_3_code: 'SUR' },
  { name: 'Sweden', alpha_2_code: 'SE', alpha_3_code: 'SWE' },
  { name: 'Switzerland', alpha_2_code: 'CH', alpha_3_code: 'CHE' },
  { name: 'Syria', alpha_2_code: 'SY', alpha_3_code: 'SYR' },
  { name: 'Taiwan', alpha_2_code: 'TW', alpha_3_code: 'TWN' },
  { name: 'Tajikistan', alpha_2_code: 'TJ', alpha_3_code: 'TJK' },
  { name: 'Tanzania', alpha_2_code: 'TZ', alpha_3_code: 'TZA' },
  { name: 'Thailand', alpha_2_code: 'TH', alpha_3_code: 'THA' },
  { name: 'Timor-Leste', alpha_2_code: 'TL', alpha_3_code: 'TLS' },
  { name: 'Togo', alpha_2_code: 'TG', alpha_3_code: 'TGO' },
  { name: 'Tonga', alpha_2_code: 'TO', alpha_3_code: 'TON' },
  { name: 'Trinidad and Tobago', alpha_2_code: 'TT', alpha_3_code: 'TTO' },
  { name: 'Tunisia', alpha_2_code: 'TN', alpha_3_code: 'TUN' },
  { name: 'Turkey', alpha_2_code: 'TR', alpha_3_code: 'TUR' },
  { name: 'Turkmenistan', alpha_2_code: 'TM', alpha_3_code: 'TKM' },
  { name: 'Tuvalu', alpha_2_code: 'TV', alpha_3_code: 'TUV' },
  { name: 'Uganda', alpha_2_code: 'UG', alpha_3_code: 'UGA' },
  { name: 'Ukraine', alpha_2_code: 'UA', alpha_3_code: 'UKR' },
  { name: 'United Arab Emirates', alpha_2_code: 'AE', alpha_3_code: 'ARE' },
  { name: 'United Kingdom', alpha_2_code: 'GB', alpha_3_code: 'GBR' },
  { name: 'United States', alpha_2_code: 'US', alpha_3_code: 'USA' },
  { name: 'Uruguay', alpha_2_code: 'UY', alpha_3_code: 'URY' },
  { name: 'Uzbekistan', alpha_2_code: 'UZ', alpha_3_code: 'UZB' },
  { name: 'Vanuatu', alpha_2_code: 'VU', alpha_3_code: 'VUT' },
  { name: 'Vatican City', alpha_2_code: 'VA', alpha_3_code: 'VAT' },
  { name: 'Venezuela', alpha_2_code: 'VE', alpha_3_code: 'VEN' },
  { name: 'Vietnam', alpha_2_code: 'VN', alpha_3_code: 'VNM' },
  { name: 'Yemen', alpha_2_code: 'YE', alpha_3_code: 'YEM' },
  { name: 'Zambia', alpha_2_code: 'ZM', alpha_3_code: 'ZMB' },
  { name: 'Zimbabwe', alpha_2_code: 'ZW', alpha_3_code: 'ZWE' }
];

async function seedAllCountries() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding all countries table...');

    // Insert all countries
    for (const country of allCountries) {
      await client.query(
        `INSERT INTO countries (name, alpha_2_code, alpha_3_code)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET
           alpha_2_code = COALESCE(EXCLUDED.alpha_2_code, countries.alpha_2_code),
           alpha_3_code = COALESCE(EXCLUDED.alpha_3_code, countries.alpha_3_code)`,
        [country.name, country.alpha_2_code, country.alpha_3_code]
      );
    }

    console.log(`✅ Inserted/Updated ${allCountries.length} countries`);

    await client.query('COMMIT');
    console.log('✅ Countries seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding countries:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedAllCountries()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { seedAllCountries };

