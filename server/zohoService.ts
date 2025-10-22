import fetch from 'node-fetch';

interface ZohoUser {
  id: string;
  name: string;
  email: string;
  profile: string;
  role: string;
  status: string;
  zuid: string;
  zpuid?: string;
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
  private usersAccessToken: string | null = null;
  private usersTokenExpiry: Date = new Date(0);
  private projectsAccessToken: string | null = null;
  private projectsTokenExpiry: Date = new Date(0);
  
  // Zoho API Configuration from your working code
  private readonly PORTAL_ID = "699939546";
  private readonly AUTH_URL = "https://accounts.zoho.com/oauth/v2/token";

  private async getUsersAccessToken(): Promise<string> {
    if (this.usersAccessToken && new Date() < this.usersTokenExpiry) {
      return this.usersAccessToken;
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
        throw new Error(`Users token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as ZohoTokenResponse;
      this.usersAccessToken = data.access_token;
      this.usersTokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000); // Refresh 1 minute early

      return this.usersAccessToken;
    } catch (error) {
      console.error('Error refreshing Zoho users access token:', error);
      throw new Error('Failed to authenticate with Zoho Users API');
    }
  }

  private async getProjectsAccessToken(): Promise<string> {
    if (this.projectsAccessToken && new Date() < this.projectsTokenExpiry) {
      return this.projectsAccessToken;
    }

    // Use the same auth URL as Python code
    const tokenUrl = this.AUTH_URL;
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
        throw new Error(`Projects token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as ZohoTokenResponse;
      this.projectsAccessToken = data.access_token;
      this.projectsTokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000); // Refresh 1 minute early

      return this.projectsAccessToken;
    } catch (error) {
      console.error('Error refreshing Zoho projects access token:', error);
      throw new Error('Failed to authenticate with Zoho Projects API');
    }
  }

  async getUsers(): Promise<ZohoUser[]> {
    try {
      console.log("Fetching users from Zoho Projects API...");
      
      const allUsersData: ZohoUser[] = [];
      let page = 1;
      const perPage = 200; // Max allowed by Zoho Projects API

      while (true) {
        const accessToken = await this.getUsersAccessToken();
        const headers = {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Accept': 'application/json'
        };
        
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: perPage.toString()
        });
        
        // Use the correct Zoho Projects API endpoint from your working code
        const url = `https://projectsapi.zoho.com/restapi/portal/${this.PORTAL_ID}/users/?${params}`;
        console.log(`Fetching users from: ${url} (Page: ${page}, Per Page: ${perPage})`);

        const response = await fetch(url, { headers });

        if (!response.ok) {
          if (response.status === 401) {
            console.log("Authentication failed (401). Access token might be invalid. Forcing refresh...");
            this.accessToken = null;
            this.tokenExpiry = new Date(0);
            continue; // Retry with new token
          }
          throw new Error(`Zoho API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        const users = data.users || [];

        if (!users || users.length === 0) {
          console.log("No more user data found or end of pagination.");
          break;
        }

        allUsersData.push(...users);

        if (users.length < perPage) {
          console.log("Last page reached.");
          break;
        }

        page++;
      }

      console.log(`Successfully retrieved ${allUsersData.length} user records.`);
      return allUsersData;
    } catch (error) {
      console.error('Error fetching users from Zoho:', error);
      // Return empty array instead of throwing to allow graceful fallback
      return [];
    }
  }

  async getProjects(): Promise<ZohoProject[]> {
    try {
      console.log("Fetching ALL projects from Zoho Projects API with complete pagination...");
      
      const allProjects: ZohoProject[]  = [];
      const seenIds = new Set<string>();
      let page = 1;
      const range = 200; // Max allowed by Zoho API
      
      // Continue pagination until no more projects
      while (true) {
        const accessToken = await this.getProjectsAccessToken();
        const headers = {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Accept': 'application/json'
        };
        
        const apiUrl = `https://projectsapi.zoho.com/restapi/portal/maaloomatiia/projects/?page=${page}&range=${range}`;
        console.log(`Fetching projects from page ${page} (${range} per page): ${apiUrl}`);

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
          console.log(`API error on page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json() as any;
        
        if (!data.projects || !Array.isArray(data.projects)) {
          console.log(`Invalid response on page ${page}`);
          break;
        }
        
        const projects = data.projects;
        console.log(`Found ${projects.length} projects on page ${page}`);
        
        // Only add new projects (deduplication)
        const newProjects = projects.filter((p: any) => !seenIds.has(p.id.toString()));
        
        allProjects.push(...newProjects);
        newProjects.forEach((p: any) => seenIds.add(p.id.toString()));
        
        console.log(`Added ${newProjects.length} new projects. Total: ${allProjects.length}`);
        
        if (projects.length > 0) {
          console.log(`First project ID: ${projects[0].id}, Last project ID: ${projects[projects.length - 1].id}`);
        }
        
        // If we got less than range, this is the last page
        if (projects.length < range) {
          console.log(`Got ${projects.length} projects (less than ${range}). This is the last page.`);
          break;
        }
        
        page++;
      }
      
      console.log(`Successfully retrieved ${allProjects.length} unique project records from Zoho API.`);
      return allProjects;
    } catch (error) {
      console.error('Error fetching projects from Zoho:', error);
      return [];
    }
  }
}

export const zohoService = new ZohoService();