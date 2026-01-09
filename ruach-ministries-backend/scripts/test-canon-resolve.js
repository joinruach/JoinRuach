const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:1337/api/canon/resolve', {
      citations: [{ osis: 'Acts.17.11', translation: 'YAH' }]
    });

    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.data.results[0].text) {
      console.log('\n✅ SUCCESS! Scripture text retrieved:');
      console.log(response.data.results[0].text);
    } else {
      console.log('\n❌ FAILED: No text returned');
      console.log('Notice:', response.data.results[0].notice);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
