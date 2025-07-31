import fetch from 'node-fetch';

interface ZohoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  role?: string;
  department?: string;
}

interface ZohoProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  currency?: string;
}

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
}

class ZohoService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Extract domain from ZOHO_API_DOMAIN if it's a full URL
    let apiDomain = process.env.ZOHO_API_DOMAIN!;
    if (apiDomain.includes('://')) {
      const url = new URL(apiDomain);
      apiDomain = url.hostname.split('.').slice(-2).join('.'); // Get zoho.com part
    }

    const tokenUrl = `https://accounts.${apiDomain}/oauth/v2/token`;
    const params = new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as ZohoTokenResponse;
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing Zoho access token:', error);
      throw new Error('Failed to authenticate with Zoho API');
    }
  }

  async getUsers(): Promise<ZohoUser[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Extract domain from ZOHO_API_DOMAIN if it's a full URL
      let apiDomain = process.env.ZOHO_API_DOMAIN!;
      if (apiDomain.includes('://')) {
        const url = new URL(apiDomain);
        apiDomain = url.hostname.split('.').slice(-2).join('.'); // Get zoho.com part
      }

      const apiUrl = `https://people.${apiDomain}/people/api/forms/employee/getRecords`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Zoho API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Transform Zoho user data to our format
      const users: ZohoUser[] = [];
      if (data.response && data.response.result) {
        for (const record of data.response.result) {
          const user: ZohoUser = {
            id: record.EmployeeID || record.Employeeid || record.employeeId || record.id,
            firstName: record.FirstName || record.firstName || record.first_name || '',
            lastName: record.LastName || record.lastName || record.last_name || '',
            email: record.EmailID || record.email || record.Email || '',
            status: record.EmployeeStatus || record.status || 'Active',
            role: record.Designation || record.designation || record.role,
            department: record.Department || record.department
          };
          
          if (user.id && user.email) {
            users.push(user);
          }
        }
      }

      return users;
    } catch (error) {
      console.error('Error fetching users from Zoho:', error);
      // Return empty array instead of throwing to allow graceful fallback
      return [];
    }
  }

  async getProjects(): Promise<ZohoProject[]> {
    try {
      const accessToken = await this.getAccessToken();
      const apiUrl = `https://projects.${process.env.ZOHO_API_DOMAIN}/restapi/portal/[PORTAL_ID]/projects/`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Zoho Projects API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Transform Zoho project data to our format
      const projects: ZohoProject[] = [];
      if (data.projects) {
        for (const project of data.projects) {
          const proj: ZohoProject = {
            id: project.id || project.project_id,
            name: project.name || project.project_name,
            description: project.description,
            status: project.status || 'active',
            budget: project.budget ? parseFloat(project.budget) : undefined,
            currency: project.currency_code
          };
          
          if (proj.id && proj.name) {
            projects.push(proj);
          }
        }
      }

      return projects;
    } catch (error) {
      console.error('Error fetching projects from Zoho:', error);
      // Return empty array instead of throwing to allow graceful fallback
      return [];
    }
  }
}

export const zohoService = new ZohoService();