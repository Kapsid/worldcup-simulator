<template>
  <div class="tournament-news">
    <div class="news-header">
      <div class="header-title">
        <h3>Tournament News</h3>
        <div v-if="unreadCount > 0" class="unread-badge">
          {{ unreadCount }}
        </div>
      </div>
      <div class="news-controls">
        <div class="category-filter">
          <select v-model="selectedCategory" @change="loadNews">
            <option value="">All Categories</option>
            <option value="important">Important</option>
            <option value="results">Results</option>
            <option value="milestones">Milestones</option>
            <option value="statistics">Statistics</option>
            <option value="general">General</option>
          </select>
        </div>
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead" 
          class="btn-mark-all-read"
          :disabled="markingAllRead"
        >
          <i v-if="markingAllRead" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check-double"></i>
          Mark All Read
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading news...
    </div>

    <div v-else-if="news.length === 0" class="no-news">
      <i class="fas fa-newspaper"></i>
      <p>No news available</p>
      <p class="no-news-subtitle">Tournament news will appear here as events unfold</p>
    </div>

    <div v-else class="news-list">
      <div 
        v-for="item in news" 
        :key="item._id"
        class="news-item"
        :class="{ 
          'unread': !item.isRead,
          [`priority-${item.priority}`]: true,
          [`category-${item.category}`]: true
        }"
        @click="markAsRead(item)"
      >
        <div class="news-icon">
          <i :class="getNewsIcon(item.type)"></i>
        </div>
        
        <div class="news-content">
          <div class="news-title">{{ item.title }}</div>
          <div class="news-message">{{ item.message }}</div>
          <div class="news-meta">
            <span class="news-time">{{ formatTime(item.createdAt) }}</span>
            <span class="news-category" :class="`category-${item.category}`">
              {{ formatCategory(item.category) }}
            </span>
            <span v-if="item.priority === 'urgent'" class="priority-urgent">URGENT</span>
          </div>
        </div>

        <div class="news-actions">
          <div v-if="!item.isRead" class="unread-indicator"></div>
          <button 
            v-if="!item.isRead"
            @click.stop="markAsRead(item)" 
            class="btn-mark-read"
            title="Mark as read"
          >
            <i class="fas fa-check"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMore" class="btn-load-more" :disabled="loadingMore">
        <i v-if="loadingMore" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-chevron-down"></i>
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config/api.js'

export default {
  name: 'TournamentNews',
  props: {
    tournament: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      news: [],
      loading: false,
      loadingMore: false,
      markingAllRead: false,
      unreadCount: 0,
      selectedCategory: '',
      offset: 0,
      limit: 20,
      hasMore: true
    }
  },
  mounted() {
    this.loadNews()
    this.loadUnreadCount()
  },
  methods: {
    async loadNews(reset = true) {
      if (reset) {
        this.offset = 0
        this.news = []
        this.hasMore = true
      }
      
      this.loading = reset
      
      try {
        const token = localStorage.getItem('token')
        const params = new URLSearchParams({
          limit: this.limit.toString(),
          offset: this.offset.toString()
        })
        
        if (this.selectedCategory) {
          params.append('category', this.selectedCategory)
        }
        
        const response = await fetch(`${API_URL}/news/${this.tournament._id}?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const newNews = await response.json()
          
          if (reset) {
            this.news = newNews
          } else {
            this.news = [...this.news, ...newNews]
          }
          
          this.hasMore = newNews.length === this.limit
          this.offset += newNews.length
        }
      } catch (error) {
        console.error('Error loading tournament news:', error)
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    
    async loadMore() {
      this.loadingMore = true
      await this.loadNews(false)
    },
    
    async loadUnreadCount() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/news/${this.tournament._id}/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.unreadCount = data.count
        }
      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    },
    
    async markAsRead(newsItem) {
      if (newsItem.isRead) return
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/news/${newsItem._id}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          // Update local data
          newsItem.isRead = true
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (error) {
        console.error('Error marking news as read:', error)
      }
    },
    
    async markAllAsRead() {
      this.markingAllRead = true
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/news/${this.tournament._id}/mark-all-read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          // Update local data
          this.news.forEach(item => {
            item.isRead = true
          })
          this.unreadCount = 0
        }
      } catch (error) {
        console.error('Error marking all as read:', error)
      } finally {
        this.markingAllRead = false
      }
    },
    
    getNewsIcon(type) {
      const icons = {
        'stage_change': 'fas fa-exchange-alt',
        'round_completed': 'fas fa-flag-checkered',
        'surprise_result': 'fas fa-exclamation',
        'high_scoring': 'fas fa-fire',
        'milestone': 'fas fa-trophy',
        'qualification': 'fas fa-ticket-alt',
        'record': 'fas fa-medal',
        'tournament_info': 'fas fa-info-circle'
      }
      return icons[type] || 'fas fa-newspaper'
    },
    
    formatCategory(category) {
      const categories = {
        'important': 'Important',
        'results': 'Results',
        'milestones': 'Milestones',
        'statistics': 'Statistics',
        'general': 'General'
      }
      return categories[category] || category
    },
    
    formatTime(dateString) {
      const now = new Date()
      const date = new Date(dateString)
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.tournament-news {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h3 {
  color: var(--fifa-dark-blue);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.unread-badge {
  background: var(--fifa-red);
  color: var(--white);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
}

.news-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-filter select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.btn-mark-all-read {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
}

.btn-mark-all-read:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
}

.btn-mark-all-read:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.no-news {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.no-news i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-news-subtitle {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-item:hover {
  background: rgba(0, 102, 204, 0.02);
  border-color: rgba(0, 102, 204, 0.2);
}

.news-item.unread {
  background: rgba(0, 102, 204, 0.05);
  border-color: var(--fifa-blue);
  border-left-width: 4px;
}

.news-item.priority-urgent {
  border-color: var(--fifa-red);
  background: rgba(255, 68, 68, 0.05);
}

.news-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.news-item.category-important .news-icon {
  background: rgba(255, 193, 7, 0.2);
  color: #e6a700;
}

.news-item.category-results .news-icon {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.news-item.category-milestones .news-icon {
  background: rgba(255, 193, 7, 0.2);
  color: var(--fifa-gold);
}

.news-content {
  flex: 1;
}

.news-title {
  font-size: 1.1rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  margin-bottom: 4px;
}

.news-message {
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 8px;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.news-time {
  color: var(--gray);
  font-size: 0.85rem;
}

.news-category {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.news-category.category-important {
  background: rgba(255, 193, 7, 0.2);
  color: #e6a700;
}

.news-category.category-results {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.news-category.category-milestones {
  background: rgba(255, 193, 7, 0.2);
  color: var(--fifa-gold);
}

.news-category.category-statistics {
  background: rgba(0, 102, 204, 0.2);
  color: var(--fifa-blue);
}

.news-category.category-general {
  background: rgba(156, 163, 175, 0.2);
  color: #6b7280;
}

.priority-urgent {
  background: var(--fifa-red);
  color: var(--white);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.news-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--fifa-blue);
}

.btn-mark-read {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-mark-read:hover {
  background: var(--fifa-blue);
  color: var(--white);
}

.load-more {
  text-align: center;
  margin-top: 24px;
}

.btn-load-more {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
  border: 1px solid rgba(0, 102, 204, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
  margin: 0 auto;
}

.btn-load-more:hover:not(:disabled) {
  background: var(--fifa-blue);
  color: var(--white);
}

.btn-load-more:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .news-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .news-controls {
    justify-content: space-between;
  }
  
  .news-item {
    padding: 12px;
  }
  
  .news-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>