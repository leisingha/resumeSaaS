import { BetaAnalyticsDataClient } from '@google-analytics/data';

const CLIENT_EMAIL = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

// Handle private key with better error handling and fallback
function getPrivateKey() {
  const privateKeyEnv = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;

  if (!privateKeyEnv) {
    throw new Error('GOOGLE_ANALYTICS_PRIVATE_KEY environment variable is not set');
  }

  try {
    // Try to decode from base64 first
    return Buffer.from(privateKeyEnv, 'base64').toString('utf-8');
  } catch (error) {
    // If base64 decoding fails, try using the key directly
    console.warn('Base64 decoding failed, using private key directly');
    return privateKeyEnv.replace(/\\n/g, '\n');
  }
}

// Check if required environment variables are set
function validateEnvironmentVariables() {
  if (!CLIENT_EMAIL) {
    throw new Error('GOOGLE_ANALYTICS_CLIENT_EMAIL environment variable is not set');
  }
  if (!PROPERTY_ID) {
    throw new Error('GOOGLE_ANALYTICS_PROPERTY_ID environment variable is not set');
  }
}

// Initialize the client with error handling
function createAnalyticsClient() {
  try {
    validateEnvironmentVariables();
    const privateKey = getPrivateKey();

    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: privateKey,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Google Analytics client:', error);
    return null;
  }
}

const analyticsDataClient = createAnalyticsClient();

export async function getSources() {
  if (!analyticsDataClient) {
    console.warn('Google Analytics client not initialized, returning empty sources');
    return [];
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '2020-01-01',
          endDate: 'today',
        },
      ],
      // for a list of dimensions and metrics see https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
      dimensions: [
        {
          name: 'source',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    });

    let activeUsersPerReferrer: any[] = [];
    if (response?.rows && response.rows.length > 0) {
      activeUsersPerReferrer = response.rows
        .map((row) => {
          if (row.dimensionValues && row.metricValues) {
            return {
              source: row.dimensionValues[0].value,
              visitors: row.metricValues[0].value,
            };
          }
          return null;
        })
        .filter(item => item !== null);
    } else {
      console.warn('No data from Google Analytics sources - this is normal for new properties or periods with no traffic');
      return [];
    }

    return activeUsersPerReferrer;
  } catch (error) {
    console.error('Error fetching sources from Google Analytics:', error);
    return [];
  }
}

export async function getDailyPageViews() {
  const totalViews = await getTotalPageViews();
  const prevDayViewsChangePercent = await getPrevDayViewsChangePercent();

  return {
    totalViews,
    prevDayViewsChangePercent,
  };
}

async function getTotalPageViews() {
  if (!analyticsDataClient) {
    console.warn('Google Analytics client not initialized, returning 0 total views');
    return 0;
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '2020-01-01', // go back to earliest date of your app
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
      ],
    });
    let totalViews = 0;
    if (response?.rows && response.rows.length > 0 && response.rows[0]?.metricValues) {
      // @ts-ignore
      totalViews = parseInt(response.rows[0].metricValues[0].value);
    } else {
      console.warn('No data from Google Analytics for total page views - this is normal for new properties or date ranges with no traffic');
      return 0;
    }
    return totalViews;
  } catch (error) {
    console.error('Error fetching total page views from Google Analytics:', error);
    return 0;
  }
}

async function getPrevDayViewsChangePercent() {
  if (!analyticsDataClient) {
    console.warn('Google Analytics client not initialized, returning 0 for view change percent');
    return '0';
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,

      dateRanges: [
        {
          startDate: '2daysAgo',
          endDate: 'yesterday',
        },
      ],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: true,
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        {
          name: 'screenPageViews',
        },
      ],
    });

    let viewsFromYesterday;
    let viewsFromDayBeforeYesterday;

    if (response?.rows && response.rows.length === 2 &&
        response.rows[0]?.metricValues && response.rows[1]?.metricValues) {
      // @ts-ignore
      viewsFromYesterday = response.rows[0].metricValues[0].value;
      // @ts-ignore
      viewsFromDayBeforeYesterday = response.rows[1].metricValues[0].value;

      if (viewsFromYesterday && viewsFromDayBeforeYesterday) {
        viewsFromYesterday = parseInt(viewsFromYesterday);
        viewsFromDayBeforeYesterday = parseInt(viewsFromDayBeforeYesterday);
        if (viewsFromYesterday === 0 || viewsFromDayBeforeYesterday === 0) {
          return '0';
        }
        console.table({ viewsFromYesterday, viewsFromDayBeforeYesterday });

        const change = ((viewsFromYesterday - viewsFromDayBeforeYesterday) / viewsFromDayBeforeYesterday) * 100;
        return change.toFixed(0);
      }
    } else {
      console.warn('No sufficient data from Google Analytics for view change calculation - this is normal for new properties or periods with no traffic');
      return '0';
    }
  } catch (error) {
    console.error('Error fetching previous day views change from Google Analytics:', error);
    return '0';
  }
}
