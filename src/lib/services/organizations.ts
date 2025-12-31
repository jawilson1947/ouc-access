import { executeQuery } from '@/lib/db';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '@/types/database';

export async function getOrganizations(): Promise<Organization[]> {
    const query = 'SELECT * FROM organization ORDER BY department ASC';
    return await executeQuery<Organization[]>(query);
}

export async function createOrganization(data: CreateOrganizationInput): Promise<number> {
    const query = 'INSERT INTO organization (department) VALUES (?)';
    const result = await executeQuery<any>(query, [data.department]);
    return result.insertId;
}

export async function updateOrganization(data: UpdateOrganizationInput): Promise<boolean> {
    const query = 'UPDATE organization SET department = ? WHERE ID = ?';
    const result = await executeQuery<any>(query, [data.department, data.ID]);
    return result.affectedRows > 0;
}

export async function deleteOrganization(id: number): Promise<boolean> {
    const query = 'DELETE FROM organization WHERE ID = ?';
    const result = await executeQuery<any>(query, [id]);
    return result.affectedRows > 0;
}
