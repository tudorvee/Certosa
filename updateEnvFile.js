// Script to update the .env file with new email credentials
const fs = require('fs');
const path = require('path');

const emailCredentials = {
  EMAIL_USER: 'ristorantepancrazio@gmail.com',
  EMAIL_PASS: 'xzchhmcbbfxytfxh'
};

// Path to the .env file
const envPath = path.join(__dirname, 'backend', '.env');

try {
  console.log(`Reading .env file from: ${envPath}`);
  
  // Read the current .env file
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (err) {
    console.warn(`Warning: Could not read .env file: ${err.message}`);
    console.log('Creating a new .env file...');
  }
  
  // Split the content into lines
  const envLines = envContent.split('\n');
  
  // Create a map of updated lines
  const updatedLines = [];
  const processedKeys = new Set();
  
  // Process each line in the existing file
  for (const line of envLines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines or comments
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      updatedLines.push(line);
      continue;
    }
    
    // Extract key and value
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (!match) {
      updatedLines.push(line);
      continue;
    }
    
    const key = match[1].trim();
    
    // If it's one of our email credentials, update it
    if (key in emailCredentials) {
      updatedLines.push(`${key}=${emailCredentials[key]}`);
      processedKeys.add(key);
    } else {
      updatedLines.push(line); // Keep the original line
    }
  }
  
  // Add any missing credentials
  for (const [key, value] of Object.entries(emailCredentials)) {
    if (!processedKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }
  
  // Write the updated content back to the file
  const updatedContent = updatedLines.join('\n');
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('✅ Email credentials updated in .env file successfully!');
  console.log('Updated credentials:');
  for (const [key, value] of Object.entries(emailCredentials)) {
    console.log(`${key}=${value}`);
  }
} catch (error) {
  console.error('Error updating .env file:', error);
  process.exit(1);
}
