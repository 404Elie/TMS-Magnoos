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
      console.log("Fetching ALL projects (including archived) from Zoho Projects API...");
      
      const allProjects: ZohoProject[] = [];
      const seenIds = new Set<string>();
      let index = 1; // Start index for Zoho Search API (1-based)
      const range = 200; // Page size - Zoho's standard maximum
      
      // Continue pagination until no more projects
      while (true) {
        const accessToken = await this.getProjectsAccessToken();
        const headers = {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Accept': 'application/json'
        };
        
        // Use Search API with module_status=all to get both active and archived projects
        const apiUrl = `https://projectsapi.zoho.com/restapi/portal/maaloomatiia/search/?module=projects&module_status=all&index=${index}&range=${range}`;
        console.log(`Fetching projects from index ${index} (${range} per page, including archived)`);

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
          console.log(`API error at index ${index}: ${response.status}`);
          break;
        }

        const data = await response.json() as any;
        
        // Check response structure
        if (!data.projects || !Array.isArray(data.projects)) {
          console.log(`Invalid response structure at index ${index}:`, data);
          break;
        }
        
        const projects = data.projects;
        console.log(`Found ${projects.length} projects at index ${index}`);
        
        // Stop if no more projects
        if (projects.length === 0) {
          console.log(`No more projects found at index ${index}. Stopping pagination.`);
          break;
        }
        
        // Only add new projects that we haven't seen before (deduplication)
        const newProjects = projects.filter((p: any) => !seenIds.has(p.id.toString()));
        
        if (newProjects.length === 0) {
          console.log(`No new projects found at index ${index}. All were duplicates. Stopping.`);
          break;
        }
        
        // Add new projects and track IDs
        allProjects.push(...newProjects);
        newProjects.forEach((p: any) => seenIds.add(p.id.toString()));
        
        console.log(`Added ${newProjects.length} new projects. Total: ${allProjects.length}`);
        
        // Log first and last project IDs for debugging
        if (projects.length > 0) {
          console.log(`First project ID: ${projects[0].id}, Last project ID: ${projects[projects.length - 1].id}`);
        }
        
        // If we got less than the range, this is the last batch
        if (projects.length < range) {
          console.log(`Got ${projects.length} projects (less than ${range}). This is the last page.`);
          break;
        }
        
        index += range; // Move to next batch
      }
      
      console.log(`Successfully retrieved ${allProjects.length} unique project records (active + archived) from Zoho API.`);
      
      return allProjects;
    } catch (error) {
      console.error('Error fetching projects from Zoho:', error);
      return [];
    }
  }
}

export const zohoService = new ZohoService();