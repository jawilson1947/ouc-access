// Native fetch is available in Node.js 18+

async function testEmailAttachment() {
    const url = 'http://localhost:3000/api/send-email';

    // A small 1x1 red dot pixel Base64 encoded JPEG
    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAABABAAAAAAAAAAAAAAAAAAAAAP/EABQAORAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AQ//Z';

    const payload = {
        lastname: 'Verification',
        firstname: 'Test',
        email: 'ouc-it@oucsda.org', // Sending to IT email for verification
        phone: '(555) 000-0000',
        DeviceID: 'TEST-DEVICE-ID',
        PictureUrl: base64Image
    };

    try {
        console.log('Sending test email to:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (data.success) {
            console.log('✅ Test passed: Email sent successfully.');
        } else {
            console.error('❌ Test failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error running test:', error.message);
        console.log('Ensure the Next.js dev server is running on http://localhost:3000');
    }
}

testEmailAttachment();
