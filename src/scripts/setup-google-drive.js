#!/usr/bin/env node

/**
 * Google Drive Setup Script for Go-Goyagoy DCMS
 * 
 * This script helps configure Google Drive integration by:
 * 1. Validating credentials
 * 2. Testing API access
 * 3. Creating root folder structure
 * 4. Verifying permissions
 */

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

async function getAccessToken(clientId, clientSecret, refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createFolder(accessToken, folderName, parentId = null) {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create folder: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data;
}

async function listFiles(accessToken, folderId = null) {
  let query = 'trashed=false';
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to list files');
  }

  const data = await response.json();
  return data.files || [];
}

async function main() {
  console.log('='.repeat(60));
  console.log('Go-Goyagoy DCMS - Google Drive Setup');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Collect credentials
  console.log('Step 1: Enter Google Drive API Credentials');
  console.log('-'.repeat(60));
  
  const clientId = await question('Client ID: ');
  const clientSecret = await question('Client Secret: ');
  const refreshToken = await question('Refresh Token: ');
  console.log();

  // Step 2: Test credentials
  console.log('Step 2: Testing Credentials...');
  console.log('-'.repeat(60));
  
  let accessToken;
  try {
    accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
    console.log('✓ Credentials valid! Access token obtained.');
  } catch (error) {
    console.error('✗ Failed to validate credentials:', error.message);
    console.log('\nPlease check your credentials and try again.');
    console.log('Refer to /docs/google-drive-integration.md for setup instructions.');
    rl.close();
    process.exit(1);
  }
  console.log();

  // Step 3: Create or select root folder
  console.log('Step 3: Root Folder Setup');
  console.log('-'.repeat(60));
  
  const createNew = await question('Create new root folder? (y/n): ');
  
  let rootFolderId;
  
  if (createNew.toLowerCase() === 'y') {
    const folderName = await question('Folder name (default: DCMS Medical Records): ') || 'DCMS Medical Records';
    
    try {
      const folder = await createFolder(accessToken, folderName);
      rootFolderId = folder.id;
      console.log(`✓ Created folder: ${folderName}`);
      console.log(`  Folder ID: ${rootFolderId}`);
      console.log(`  URL: https://drive.google.com/drive/folders/${rootFolderId}`);
    } catch (error) {
      console.error('✗ Failed to create folder:', error.message);
      rl.close();
      process.exit(1);
    }
  } else {
    rootFolderId = await question('Enter existing folder ID: ');
    
    // Verify folder exists
    try {
      await listFiles(accessToken, rootFolderId);
      console.log('✓ Folder verified!');
    } catch (error) {
      console.error('✗ Cannot access folder. Please check the folder ID and permissions.');
      rl.close();
      process.exit(1);
    }
  }
  console.log();

  // Step 4: Create folder structure
  console.log('Step 4: Creating Folder Structure...');
  console.log('-'.repeat(60));
  
  const createStructure = await question('Create sample folder structure? (y/n): ');
  
  if (createStructure.toLowerCase() === 'y') {
    const sampleFolders = [
      'Test Patient',
      'Medical Records Templates',
      'Archived Records',
    ];

    for (const folderName of sampleFolders) {
      try {
        const folder = await createFolder(accessToken, folderName, rootFolderId);
        console.log(`✓ Created: ${folderName} (${folder.id})`);
      } catch (error) {
        console.log(`✗ Failed to create: ${folderName}`);
      }
    }
  }
  console.log();

  // Step 5: Generate environment variables
  console.log('Step 5: Environment Configuration');
  console.log('-'.repeat(60));
  console.log('Add these variables to your .env.local file:');
  console.log();
  console.log('# Google Drive Configuration');
  console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`);
  console.log('GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback');
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
  console.log(`GOOGLE_DRIVE_ROOT_FOLDER=${rootFolderId}`);
  console.log();

  // Step 6: Generate .env file
  const generateEnv = await question('Generate .env.local file? (y/n): ');
  
  if (generateEnv.toLowerCase() === 'y') {
    const fs = require('fs');
    const path = require('path');
    
    const envContent = `# Google Drive Configuration
GOOGLE_DRIVE_CLIENT_ID=${clientId}
GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}
GOOGLE_DRIVE_ROOT_FOLDER=${rootFolderId}
`;

    const envPath = path.join(process.cwd(), '.env.local');
    
    try {
      // Check if .env.local exists
      let existingContent = '';
      if (fs.existsSync(envPath)) {
        existingContent = fs.readFileSync(envPath, 'utf8');
        // Backup existing file
        fs.writeFileSync(envPath + '.backup', existingContent);
        console.log('✓ Backed up existing .env.local to .env.local.backup');
      }
      
      // Append or create new content
      if (existingContent) {
        // Remove old Google Drive config if exists
        const lines = existingContent.split('\n');
        const filteredLines = lines.filter(line => 
          !line.startsWith('GOOGLE_DRIVE_')
        );
        fs.writeFileSync(envPath, filteredLines.join('\n') + '\n\n' + envContent);
      } else {
        fs.writeFileSync(envPath, envContent);
      }
      
      console.log('✓ Updated .env.local file');
    } catch (error) {
      console.error('✗ Failed to write .env.local:', error.message);
    }
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('Setup Complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test file upload functionality');
  console.log('3. Refer to /docs/google-drive-integration.md for more details');
  console.log();
  console.log('Root Folder URL:');
  console.log(`https://drive.google.com/drive/folders/${rootFolderId}`);
  console.log();

  rl.close();
}

main().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
