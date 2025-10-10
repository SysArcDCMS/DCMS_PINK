#!/usr/bin/env node

/**
 * Google Drive Refresh Token Generator
 * 
 * This script helps you obtain a refresh token for Google Drive API
 * without using the OAuth Playground.
 * 
 * Usage:
 *   1. Replace CLIENT_ID and CLIENT_SECRET below with your credentials
 *   2. Add http://localhost:3000/oauth/callback to authorized redirect URIs
 *   3. Run: node scripts/get-google-refresh-token.js
 *   4. Follow the prompts
 */

const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Configuration
let CLIENT_ID = '';
let CLIENT_SECRET = '';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

console.log('='.repeat(70));
console.log('Google Drive Refresh Token Generator');
console.log('='.repeat(70));
console.log();
console.log('This script will help you get a refresh token for Google Drive API.');
console.log();
console.log('Prerequisites:');
console.log('1. You have created OAuth credentials in Google Cloud Console');
console.log('2. You have added this redirect URI to authorized URIs:');
console.log('   → http://localhost:3000/oauth/callback');
console.log();
console.log('='.repeat(70));
console.log();

async function main() {
  // Step 0: Get credentials from user
  console.log('Step 1: Enter your OAuth credentials');
  console.log('-'.repeat(70));
  CLIENT_ID = await question('Client ID: ');
  CLIENT_SECRET = await question('Client Secret: ');
  console.log();

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: Client ID and Client Secret are required!');
    rl.close();
    process.exit(1);
  }

  // Step 1: Generate authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('Step 2: Authorize the application');
  console.log('-'.repeat(70));
  console.log('Opening browser for authorization...');
  console.log();
  console.log('If the browser doesn\'t open, manually visit this URL:');
  console.log(authUrl);
  console.log();

  // Try to open browser
  const platform = process.platform;
  let openCommand;
  if (platform === 'darwin') {
    openCommand = 'open';
  } else if (platform === 'win32') {
    openCommand = 'start';
  } else {
    openCommand = 'xdg-open';
  }

  try {
    exec(`${openCommand} "${authUrl}"`, (error) => {
      if (error) {
        console.log('Could not open browser automatically. Please open the URL manually.');
      }
    });
  } catch (e) {
    console.log('Could not open browser automatically. Please open the URL manually.');
  }

  // Step 2: Start local server to receive callback
  const server = http.createServer(async (req, res) => {
    const queryObject = url.parse(req.url, true).query;
    
    if (queryObject.code) {
      const code = queryObject.code;
      
      console.log('Step 3: Exchanging authorization code for tokens...');
      console.log('-'.repeat(70));
      
      // Exchange code for tokens
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
          throw new Error(tokens.error_description || tokens.error);
        }

        if (tokens.refresh_token) {
          // Success!
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Success!</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 500px;
                  }
                  h1 { color: #10b981; margin: 0 0 20px 0; }
                  p { color: #6b7280; margin: 10px 0; }
                  .checkmark {
                    font-size: 64px;
                    color: #10b981;
                    margin-bottom: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="checkmark">✓</div>
                  <h1>Authorization Successful!</h1>
                  <p>Your refresh token has been generated.</p>
                  <p>You can close this window and return to your terminal.</p>
                </div>
              </body>
            </html>
          `);

          console.log();
          console.log('='.repeat(70));
          console.log('SUCCESS! ✓');
          console.log('='.repeat(70));
          console.log();
          console.log('Your Google Drive Refresh Token:');
          console.log('-'.repeat(70));
          console.log(tokens.refresh_token);
          console.log('-'.repeat(70));
          console.log();
          console.log('Add these to your .env.local file:');
          console.log('='.repeat(70));
          console.log();
          console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
          console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
          console.log('GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/oauth/callback');
          console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
          console.log('GOOGLE_DRIVE_ROOT_FOLDER=your_folder_id_here');
          console.log();
          console.log('='.repeat(70));
          console.log();
          console.log('Next steps:');
          console.log('1. Copy the refresh token to your .env.local file');
          console.log('2. Create a root folder in Google Drive');
          console.log('3. Add the folder ID to GOOGLE_DRIVE_ROOT_FOLDER');
          console.log('4. Run: node scripts/setup-google-drive.js');
          console.log();
          
          rl.close();
          server.close();
          
          setTimeout(() => {
            process.exit(0);
          }, 1000);
        } else {
          throw new Error('No refresh token received. This might be because you\'ve already authorized this app. Try revoking access and running again.');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  text-align: center;
                  max-width: 500px;
                }
                h1 { color: #ef4444; margin: 0 0 20px 0; }
                p { color: #6b7280; margin: 10px 0; }
                code {
                  background: #f3f4f6;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>✗ Error</h1>
                <p><strong>${error.message}</strong></p>
                <p>Check your terminal for more details.</p>
              </div>
            </body>
          </html>
        `);
        
        console.error();
        console.error('='.repeat(70));
        console.error('ERROR:');
        console.error('='.repeat(70));
        console.error(error.message);
        console.error();
        console.error('Possible solutions:');
        console.error('1. Verify your Client ID and Client Secret are correct');
        console.error('2. Make sure the redirect URI is added to Google Cloud Console:');
        console.error('   → http://localhost:3000/oauth/callback');
        console.error('3. Try revoking access at: https://myaccount.google.com/permissions');
        console.error('4. Run the script again');
        console.error();
        
        rl.close();
        server.close();
        process.exit(1);
      }
    } else if (queryObject.error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Denied</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
              }
              h1 { color: #ef4444; margin: 0 0 20px 0; }
              p { color: #6b7280; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✗ Authorization Denied</h1>
              <p>You denied access to the application.</p>
              <p>Error: ${queryObject.error}</p>
              <p>Please run the script again and click "Allow".</p>
            </div>
          </body>
        </html>
      `);
      
      console.error();
      console.error('='.repeat(70));
      console.error('Authorization was denied.');
      console.error('='.repeat(70));
      console.error('Error:', queryObject.error);
      console.error();
      console.error('Please run the script again and click "Allow" when prompted.');
      console.error();
      
      rl.close();
      server.close();
      process.exit(1);
    }
  });

  server.listen(3000, () => {
    console.log('Waiting for authorization...');
    console.log('(Local server running on http://localhost:3000)');
    console.log();
    console.log('Please complete the authorization in your browser.');
    console.log();
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error();
      console.error('='.repeat(70));
      console.error('ERROR: Port 3000 is already in use!');
      console.error('='.repeat(70));
      console.error();
      console.error('Please:');
      console.error('1. Stop any application running on port 3000');
      console.error('2. Run this script again');
      console.error();
    } else {
      console.error('Server error:', error);
    }
    rl.close();
    process.exit(1);
  });
}

main().catch(error => {
  console.error('Unexpected error:', error);
  rl.close();
  process.exit(1);
});
