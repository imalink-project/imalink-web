import type {
  AuthTokens,
  LoginCredentials,
  RegisterData,
  User,
  Photo,
  PhotoMetadata,
  PhotoStack,
  SearchParams,
  PaginatedResponse,
  Tag,
  TagSummary,
  TagAutocomplete,
  Collection,
  CollectionCreate,
  CollectionUpdate,
  InputChannel,
  InputChannelUpdate,
  PhotoTextDocument,
  PhotoTextDocumentSummary,
  PhotoTextDocumentCreate,
  PhotoTextDocumentUpdate,
  Author,
  TimelineResponse,
  Event,
  EventWithPhotos,
  EventTreeResponse,
  EventCreate,
  EventUpdate,
  EventPhotosResponse,
} from './types';

const API_BASE_URL = 'https://api.trollfjell.com/api/v1';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private coldPreviewCache: Map<string, string> = new Map(); // hothash -> Object URL

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Try to load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('imalink_token');
    }
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        console.error('API Error:', error);
        
        // Handle different error formats
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
          } else {
            errorMessage = JSON.stringify(error.detail);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('imalink_token', token);
      } else {
        localStorage.removeItem('imalink_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    console.log('Attempting login to:', `${this.baseUrl}/auth/login`);
    console.log('Credentials:', credentials);
    
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Login response status:', response.status);
    
    const tokens = await this.handleResponse<AuthTokens>(response);
    console.log('Received tokens:', { access_token: tokens.access_token?.substring(0, 20) + '...' });
    this.setToken(tokens.access_token);
    console.log('Token set, current token:', this.token?.substring(0, 20) + '...');
    return tokens;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    });

    return this.handleResponse<User>(response);
  }

  async getCurrentUser(): Promise<User> {
    console.log('getCurrentUser called, token:', this.token?.substring(0, 20) + '...');
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  logout() {
    this.setToken(null);
  }

  // Photos
  async getPhotos(params?: SearchParams): Promise<PaginatedResponse<Photo>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/photos/?${queryParams.toString()}`,
      { headers: this.getHeaders() } // Send auth if available
    );

    return this.handleResponse<PaginatedResponse<Photo>>(response);
  }

  async getPhoto(hothash: string): Promise<Photo> {
    const response = await fetch(`${this.baseUrl}/photos/${hothash}/`, {
      headers: this.getHeaders(), // Send auth if available
    });

    return this.handleResponse<Photo>(response);
  }

  async updatePhotoMetadata(hothash: string, metadata: PhotoMetadata): Promise<Photo> {
    const response = await fetch(`${this.baseUrl}/photos/${hothash}/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(metadata),
    });

    return this.handleResponse<Photo>(response);
  }

  async searchPhotos(params: SearchParams): Promise<PaginatedResponse<Photo>> {
    const response = await fetch(`${this.baseUrl}/photos/search/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    return this.handleResponse<PaginatedResponse<Photo>>(response);
  }

  // Photo preview URLs
  getHotPreviewUrl(hothash: string): string {
    return `${this.baseUrl}/photos/${hothash}/hotpreview`;
  }

  getColdPreviewUrl(hothash: string, width?: number, height?: number): string {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    const query = params.toString();
    return `${this.baseUrl}/photos/${hothash}/coldpreview${query ? '?' + query : ''}`;
  }

  /**
   * Fetches and caches coldpreview as Object URL
   * Falls back to hotpreview if coldpreview is not available
   * Returns cached URL if already loaded
   */
  async fetchColdPreview(hothash: string, width?: number, height?: number): Promise<string> {
    // Return cached URL if available
    const cacheKey = `${hothash}-${width || 'auto'}-${height || 'auto'}`;
    const cached = this.coldPreviewCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try coldpreview first
      const coldResponse = await fetch(this.getColdPreviewUrl(hothash, width, height), {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (coldResponse.ok) {
        const blob = await coldResponse.blob();
        const url = URL.createObjectURL(blob);
        this.coldPreviewCache.set(cacheKey, url);
        return url;
      }

      // Fallback to hotpreview if coldpreview fails
      console.warn(`Coldpreview not available for ${hothash}, falling back to hotpreview`);
      const hotResponse = await fetch(this.getHotPreviewUrl(hothash), {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (hotResponse.ok) {
        const blob = await hotResponse.blob();
        const url = URL.createObjectURL(blob);
        this.coldPreviewCache.set(cacheKey, url);
        return url;
      }

      throw new Error('Failed to load both coldpreview and hotpreview');
    } catch (error) {
      console.error('Error loading preview:', error);
      throw error;
    }
  }

  /**
   * Clear coldpreview cache (useful for cleanup)
   */
  clearColdPreviewCache() {
    this.coldPreviewCache.forEach(url => URL.revokeObjectURL(url));
    this.coldPreviewCache.clear();
  }

  // Stacks
  async getStacks(): Promise<PhotoStack[]> {
    const response = await fetch(`${this.baseUrl}/photo-stacks`, {
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<PaginatedResponse<PhotoStack>>(response);
    return data.data;
  }

  async getStack(id: number): Promise<PhotoStack> {
    const response = await fetch(`${this.baseUrl}/photo-stacks/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PhotoStack>(response);
  }

  async createStack(stack_type: string, cover_photo_hothash?: string): Promise<PhotoStack> {
    const response = await fetch(`${this.baseUrl}/photo-stacks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ stack_type, cover_photo_hothash }),
    });

    const result = await this.handleResponse<{ stack: PhotoStack }>(response);
    return result.stack;
  }

  async addPhotoToStack(stackId: number, photoHothash: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/photo-stacks/${stackId}/photo`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ photo_hothash: photoHothash }),
    });

    await this.handleResponse<void>(response);
  }

  // Tags
  async getTags(sort_by?: string, order?: string): Promise<Tag[]> {
    const params = new URLSearchParams();
    if (sort_by) params.append('sort_by', sort_by);
    if (order) params.append('order', order);
    
    const response = await fetch(`${this.baseUrl}/tags?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{ tags: Tag[] }>(response);
    return data.tags;
  }

  async autocompleteTag(query: string, limit: number = 10): Promise<TagAutocomplete[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    
    const response = await fetch(`${this.baseUrl}/tags/autocomplete?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{ suggestions: TagAutocomplete[] }>(response);
    return data.suggestions;
  }

  async addTagsToPhoto(hothash: string, tags: string[]): Promise<Photo> {
    const response = await fetch(`${this.baseUrl}/photos/${hothash}/tags`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ tags }),
    });

    return this.handleResponse<Photo>(response);
  }

  async removeTagFromPhoto(hothash: string, tagName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/photos/${hothash}/tags/${tagName}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    await this.handleResponse<void>(response);
  }

  // Authors (Phase 1: Shared metadata tags)
  async getAuthors(): Promise<{ authors: Author[] }> {
    const response = await fetch(`${this.baseUrl}/authors/`, {
      headers: this.getHeaders(), // Send auth if available, anonymous access supported
    });

    return this.handleResponse<{ authors: Author[] }>(response);
  }

  async getAuthor(id: number): Promise<Author> {
    const response = await fetch(`${this.baseUrl}/authors/${id}/`, {
      headers: this.getHeaders(), // Send auth if available, anonymous access supported
    });

    return this.handleResponse<Author>(response);
  }

  async createAuthor(data: { name: string; bio?: string }): Promise<Author> {
    const response = await fetch(`${this.baseUrl}/authors/`, {
      method: 'POST',
      headers: this.getHeaders(), // Auth required for POST
      body: JSON.stringify(data),
    });

    return this.handleResponse<Author>(response);
  }

  async updateAuthor(id: number, data: { name?: string; bio?: string }): Promise<Author> {
    const response = await fetch(`${this.baseUrl}/authors/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(), // Auth required for PUT
      body: JSON.stringify(data),
    });

    return this.handleResponse<Author>(response);
  }

  async deleteAuthor(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/authors/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(), // Auth required for DELETE
    });

    if (response.status !== 204) {
      await this.handleResponse<void>(response);
    }
  }

  // Collections
  async getCollections(skip: number = 0, limit: number = 100): Promise<{ collections: Collection[]; total: number }> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    const response = await fetch(`${this.baseUrl}/collections?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ collections: Collection[]; total: number }>(response);
  }

  async getCollection(id: number): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Collection>(response);
  }

  async createCollection(data: CollectionCreate): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Collection>(response);
  }

  async updateCollection(id: number, data: CollectionUpdate): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Collection>(response);
  }

  async deleteCollection(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/collections/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.status !== 204) {
      await this.handleResponse<void>(response);
    }
  }

  async addPhotosToCollection(id: number, hothashes: string[]): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections/${id}/photos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ hothashes }),
    });

    const result = await this.handleResponse<{ collection_id: number; photo_count: number; affected_count: number }>(response);
    // Return updated collection
    return this.getCollection(id);
  }

  async removePhotosFromCollection(id: number, hothashes: string[]): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections/${id}/photos`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ hothashes }),
    });

    const result = await this.handleResponse<{ collection_id: number; photo_count: number; affected_count: number }>(response);
    // Return updated collection
    return this.getCollection(id);
  }

  async reorderCollectionPhotos(id: number, hothashes: string[]): Promise<Collection> {
    const response = await fetch(`${this.baseUrl}/collections/${id}/photos/reorder`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ hothashes }),
    });

    const result = await this.handleResponse<{ collection_id: number; photo_count: number }>(response);
    // Return updated collection
    return this.getCollection(id);
  }

  async getCollectionPhotos(id: number, skip: number = 0, limit: number = 100): Promise<Photo[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    const response = await fetch(`${this.baseUrl}/collections/${id}/photos?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Photo[]>(response);
  }

  // Input Channels
  async getInputChannels(offset: number = 0, limit: number = 100): Promise<{ channels: InputChannel[]; total: number }> {
    const params = new URLSearchParams();
    params.append('offset', offset.toString());
    params.append('limit', limit.toString());
    
    const response = await fetch(`${this.baseUrl}/input-channels?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ channels: InputChannel[]; total: number }>(response);
  }

  async getInputChannel(id: number): Promise<InputChannel> {
    const response = await fetch(`${this.baseUrl}/input-channels/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<InputChannel>(response);
  }

  async updateInputChannel(id: number, data: InputChannelUpdate): Promise<InputChannel> {
    const response = await fetch(`${this.baseUrl}/input-channels/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<InputChannel>(response);
  }

  // PhotoText Documents
  async getPhotoTexts(filters?: {
    document_type?: 'general' | 'album' | 'slideshow';
    is_published?: boolean;
    visibility?: string;
    sort_by?: 'created_at' | 'updated_at' | 'title';
    sort_order?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }): Promise<{ documents: PhotoTextDocumentSummary[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.document_type) params.append('document_type', filters.document_type);
    if (filters?.is_published !== undefined) params.append('is_published', filters.is_published.toString());
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
    
    const response = await fetch(`${this.baseUrl}/phototext/?${params.toString()}`, {
      headers: this.getHeaders(), // Send auth if available
    });

    return this.handleResponse<{ documents: PhotoTextDocumentSummary[]; total: number }>(response);
  }

  async getPhotoText(id: number): Promise<PhotoTextDocument> {
    const response = await fetch(`${this.baseUrl}/phototext/${id}/`, {
      headers: this.getHeaders(), // Send auth if available
    });

    return this.handleResponse<PhotoTextDocument>(response);
  }

  async createPhotoText(data: PhotoTextDocumentCreate): Promise<{ id: number; created_at: string }> {
    const response = await fetch(`${this.baseUrl}/phototext/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{ id: number; created_at: string }>(response);
  }

  async updatePhotoText(id: number, data: PhotoTextDocumentUpdate): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/phototext/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{ success: boolean }>(response);
  }

  async deletePhotoText(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/phototext/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.status !== 204) {
      await this.handleResponse<void>(response);
    }
  }

  // Timeline endpoints
  async getTimeline(params?: {
    granularity?: 'year' | 'month' | 'day' | 'hour';
    year?: number | null;
    month?: number | null;
    day?: number | null;
  }): Promise<TimelineResponse> {
    const queryParams = new URLSearchParams();
    if (params?.granularity) queryParams.set('granularity', params.granularity);
    if (params?.year) queryParams.set('year', params.year.toString());
    if (params?.month) queryParams.set('month', params.month.toString());
    if (params?.day) queryParams.set('day', params.day.toString());

    const url = `${this.baseUrl}/timeline/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<TimelineResponse>(response);
  }

  async getTimelinePhotos(year: number, month: number, day: number, hour: number): Promise<PaginatedResponse<Photo>> {
    const response = await fetch(
      `${this.baseUrl}/photos/timeline/year/${year}/month/${month}/day/${day}/hour/${hour}/photos/`,
      {
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse<PaginatedResponse<Photo>>(response);
  }

  // Photo import with imalink-core
  async processImageWithCore(file: File, coldpreviewSize: number = 800): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('coldpreview_size', coldpreviewSize.toString());

    // Send directly to core.trollfjell.com
    const response = await fetch('https://core.trollfjell.com/v1/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Core processing failed: ${error}`);
    }

    return response.json();
  }

  async createPhoto(photoSchema: any, tags: string[] = []): Promise<Photo> {
    const response = await fetch(`${this.baseUrl}/photos/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        photo_create_schema: photoSchema,
        tags: tags,
      }),
    });

    return this.handleResponse<Photo>(response);
  }

  // Events API
  async getEvents(parentId?: number | null): Promise<EventWithPhotos[]> {
    const params = new URLSearchParams();
    if (parentId !== undefined && parentId !== null) {
      params.append('parent_id', parentId.toString());
    }
    
    const response = await fetch(`${this.baseUrl}/events/?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<EventWithPhotos[]>(response);
  }

  async getEventTree(rootId?: number | null): Promise<EventTreeResponse> {
    const params = new URLSearchParams();
    if (rootId !== undefined && rootId !== null) {
      params.append('root_id', rootId.toString());
    }
    
    const response = await fetch(`${this.baseUrl}/events/tree?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<EventTreeResponse>(response);
  }

  async getEvent(id: number): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/events/${id}/`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Event>(response);
  }

  async createEvent(data: EventCreate): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/events/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Event>(response);
  }

  async updateEvent(id: number, data: EventUpdate): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/events/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Event>(response);
  }

  async moveEvent(id: number, newParentId: number | null): Promise<Event> {
    const response = await fetch(`${this.baseUrl}/events/${id}/move`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ new_parent_id: newParentId }),
    });

    return this.handleResponse<Event>(response);
  }

  async deleteEvent(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/events/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.status !== 204) {
      await this.handleResponse<void>(response);
    }
  }

  /**
   * Set event_id for photos (one-to-many architecture)
   * Replaces any existing event association
   * 
   * One-to-many: Each photo can belong to max ONE event
   */
  async setPhotosEvent(eventId: number, hothashes: string[]): Promise<EventPhotosResponse> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/photos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ hothashes }),
    });

    return this.handleResponse<EventPhotosResponse>(response);
  }

  /**
   * Remove photos from event (set event_id to null)
   * 
   * One-to-many: Clear the event_id field for these photos
   */
  async removePhotosFromEvent(hothashes: string[]): Promise<EventPhotosResponse> {
    const response = await fetch(`${this.baseUrl}/events/photos/remove`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ hothashes }),
    });

    return this.handleResponse<EventPhotosResponse>(response);
  }

  async getEventPhotos(eventId: number, includeDescendants: boolean = false): Promise<Photo[]> {
    const params = new URLSearchParams();
    if (includeDescendants) {
      params.append('include_descendants', 'true');
    }
    
    const response = await fetch(`${this.baseUrl}/events/${eventId}/photos?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Photo[]>(response);
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or multiple instances
export default ApiClient;
