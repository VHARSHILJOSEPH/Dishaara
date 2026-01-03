// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Always try to get the latest token from localStorage if not set
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        // If unauthorized, clear token
        if (response.status === 401) {
          this.setToken(null);
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  logout() {
    this.setToken(null);
  }

  // Guides endpoints
  async getGuides(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/guides?${queryString}`);
  }

  async getGuide(id) {
    return this.request(`/guides/${id}`);
  }

  async createGuideProfile(guideData) {
    return this.request('/guides', {
      method: 'POST',
      body: JSON.stringify(guideData),
    });
  }

  async updateGuideProfile(id, guideData) {
    return this.request(`/guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(guideData),
    });
  }

  async searchGuidesByLocation(lat, lng, radius = 50) {
    return this.request(`/guides/search/location?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Events endpoints
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/events?${queryString}`);
  }

  async getEvent(id) {
    return this.request(`/events/${id}`);
  }

  async getFeaturedEvents() {
    return this.request('/events/featured/list');
  }

  async getUpcomingEvents(limit = 10) {
    return this.request(`/events/upcoming/list?limit=${limit}`);
  }

  async searchEventsByLocation(lat, lng, radius = 50) {
    return this.request(`/events/search/location?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Bookings endpoints
  async getMyBookings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/bookings/my-bookings?${queryString}`);
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async cancelBooking(id, reason) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async getBookingStats() {
    return this.request('/bookings/stats/overview');
  }

  // Vehicles endpoints
  async getVehicles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vehicles?${queryString}`);
  }

  async getVehicle(id) {
    return this.request(`/vehicles/${id}`);
  }

  async createVehicle(vehicleData) {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async updateVehicle(id, vehicleData) {
    return this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  }

  async deleteVehicle(id) {
    return this.request(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  async searchVehiclesByLocation(lat, lng, radius = 50) {
    return this.request(`/vehicles/search/location?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async checkVehicleAvailability(id, startDate, endDate) {
    return this.request(`/vehicles/${id}/availability?startDate=${startDate}&endDate=${endDate}`);
  }

  async getMyVehicles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vehicles/my-vehicles/list?${queryString}`);
  }

  // Trip Plans endpoints
  async getMyTripPlans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trip-plans/my-plans?${queryString}`);
  }

  async getPublicTripPlans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trip-plans/public?${queryString}`);
  }

  async getTripPlan(id) {
    return this.request(`/trip-plans/${id}`);
  }

  async createTripPlan(tripPlanData) {
    return this.request('/trip-plans', {
      method: 'POST',
      body: JSON.stringify(tripPlanData),
    });
  }

  async updateTripPlan(id, tripPlanData) {
    return this.request(`/trip-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripPlanData),
    });
  }

  async deleteTripPlan(id) {
    return this.request(`/trip-plans/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateTripPlan(id) {
    return this.request(`/trip-plans/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async getTripPlanStats() {
    return this.request('/trip-plans/stats/overview');
  }

  async searchTripPlans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trip-plans/search/query?${queryString}`);
  }

  // AI Trip Planner endpoint
  async generateTripPlan(tripData) {
    return this.request('/ai/trip-planner', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  // Guides
  async getGuides(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/guides${queryString ? `?${queryString}` : ''}`);
  }

  async getGuide(id) {
    return this.request(`/guides/${id}`);
  }

  // Scam Detection endpoint
  async detectScams(state, city) {
    return this.request('/scams/detect', {
      method: 'POST',
      body: JSON.stringify({ state, city }),
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
