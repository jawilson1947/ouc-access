import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
    getOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization
} from '@/lib/services/organizations';

export async function GET(request: Request) {
    try {
        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET
        });

        // Check if user is admin (you might want to enhance this check)
        // For now assuming all authenticated users accessing this route are authorized
        // or rely on the frontend to hide the link, but ideally check a role here.
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizations = await getOrganizations();
        return NextResponse.json(organizations);
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.department) {
            return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
        }

        const id = await createOrganization({ department: data.department });
        return NextResponse.json({ ID: id, department: data.department });

    } catch (error: any) {
        // Check for duplicate entry error (MySQL error 1062)
        if (error.code === 'ER_DUP_ENTRY' || (error.originalError && error.originalError.code === 'ER_DUP_ENTRY')) {
            return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
        }

        console.error('Error creating organization:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.ID || !data.department) {
            return NextResponse.json({ error: 'ID and Department name are required' }, { status: 400 });
        }

        const success = await updateOrganization({ ID: data.ID, department: data.department });

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY' || (error.originalError && error.originalError.code === 'ER_DUP_ENTRY')) {
            return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
        }
        console.error('Error updating organization:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const success = await deleteOrganization(parseInt(id));

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Error deleting organization:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
