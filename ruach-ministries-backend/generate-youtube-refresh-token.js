const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'http://localhost:1337/api/youtube/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

console.log('\n🎥 Visit this URL to authorize access:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nPaste the code you got from Google here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Your refresh token:');
    console.log(tokens.refresh_token);
  } catch (err) {
    console.error('❌ Error retrieving refresh token:', err.message);
  }
  rl.close();
});
