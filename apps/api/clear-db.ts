import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function clearDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    await mongoose.connect(mongoUri, {
      dbName: 'LinguaChat_V2',
    });

    // Drop messages collection completely
    try {
      await mongoose.connection.collection('messages').drop();
      console.log('✅ Dropped messages collection');
    } catch (err: any) {
      if (err.codeName === 'NamespaceNotFound') {
        console.log('✅ Messages collection already empty');
      } else {
        throw err;
      }
    }

    // List collections
    const collections = await mongoose.connection.listCollections();
    console.log('\n📊 Remaining collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    await mongoose.disconnect();
    console.log('\n✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearDatabase();
