
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createChurchMember, deleteChurchMember } from '@/lib/services/churchMembers';

async function verifyFix() {
    console.log('🚀 Starting verification of createChurchMember fix...');

    const dummyMember = {
        lastname: 'TestUser',
        firstname: 'Verification',
        phone: '555-0199',
        email: 'test.verification@example.com',
        department: 'Other',
        DeviceID: 'TEST',
        PictureUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAA...', // Shortened for test
        EmailValidationDate: new Date(),
        RequestDate: new Date()
    };

    try {
        console.log('📝 Attempting to create church member...');
        const newId = await createChurchMember(dummyMember);

        if (newId && newId > 0) {
            console.log(`✅ SUCCESS: Church member created with ID: ${newId}`);

            console.log('🗑️ Cleaning up (deleting test record)...');
            const deleted = await deleteChurchMember(newId);
            if (deleted) {
                console.log('✅ Cleanup successful');
            } else {
                console.warn('⚠️ Cleanup failed - record might remain in DB');
            }
        } else {
            console.error('❌ FAILURE: Create returned invalid ID');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ FAILURE: Exception during creation:', error);
        process.exit(1);
    }
}

verifyFix();
