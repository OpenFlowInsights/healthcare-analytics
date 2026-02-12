const {
 fetchAvailableYears } = require('./lib/data/aco.ts');

async function test() {
  try {
    console.log('Testing fetchAvailableYears...');
    const years = await fetchAvailableYears();
    console.log('Success! Years:', years);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
  process.exit(0);
}

test();
