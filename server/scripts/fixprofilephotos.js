// scripts/fixProfilePhotos.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function fixProfilePhotos() {
  try {
    // Check if MONGODB_URI is defined
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      console.log('📝 Please check your .env file and make sure MONGODB_URI is set');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log(`📡 URI: ${mongoURI.replace(/\/\/.*@/, '//****:****@')}`); // Hide credentials in log
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');

    // Find users with empty string profilePhoto
    const users = await User.find({ 
      $or: [
        { profilePhoto: '' },
        { profilePhoto: null }
      ]
    });
    
    console.log(`📊 Found ${users.length} users with empty or null profilePhoto`);

    if (users.length === 0) {
      console.log('✅ No users need fixing!');
      process.exit(0);
    }

    // Update them to null
    let updatedCount = 0;
    for (const user of users) {
      try {
        user.profilePhoto = null;
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user: ${user.email} (${user.fullName})`);
      } catch (updateError) {
        console.error(`❌ Failed to update user ${user.email}:`, updateError.message);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} users`);
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'MongoServerError') {
      console.error('📝 MongoDB error details:', error);
    }
    process.exit(1);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the migration
fixProfilePhotos();