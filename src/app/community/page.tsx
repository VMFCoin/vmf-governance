'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {
  Header,
  Footer,
  Button,
  Input,
  Dropdown,
  CommunityPostCard,
  CalendarSidebar,
  CreatePostModal,
} from '@/components';
import {
  mockCommunityPosts,
  mockCalendarEvents,
  mockNotifications,
} from '@/data/mockData';
import { getUpcomingHolidayEvents } from '@/data/holidays';
import { CommunityPost, CalendarEvent } from '@/types';

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Combine holiday events with community events
  const holidayEvents = getUpcomingHolidayEvents();
  const allEvents = [...holidayEvents, ...mockCalendarEvents].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'all' || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'most_upvoted':
          return b.upvotes - a.upvotes;
        case 'most_discussed':
          return b.upvotes + b.downvotes - (a.upvotes + a.downvotes);
        default:
          return 0;
      }
    });

  const handleCreatePost = (
    newPost: Omit<
      CommunityPost,
      'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'userVote'
    >
  ) => {
    const post: CommunityPost = {
      ...newPost,
      id: `post-${Date.now()}`,
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    };

    setPosts(prev => [post, ...prev]);
  };

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          // This would be handled by the CommunityPostCard component
          // Just logging for now
          console.log(`Voted ${voteType} on post ${postId}`);
        }
        return post;
      })
    );
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // In a real app, this might open an event detail modal or navigate to event page
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'idea', label: 'Ideas' },
    { value: 'discussion', label: 'Discussions' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'announcement', label: 'Announcements' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_upvoted', label: 'Most Upvoted' },
    { value: 'most_discussed', label: 'Most Discussed' },
  ];

  const getCategoryStats = () => {
    const stats = {
      all: posts.length,
      idea: posts.filter(p => p.category === 'idea').length,
      discussion: posts.filter(p => p.category === 'discussion').length,
      feedback: posts.filter(p => p.category === 'feedback').length,
      announcement: posts.filter(p => p.category === 'announcement').length,
    };
    return stats;
  };

  const stats = getCategoryStats();

  return (
    <main className="min-h-screen landing-page-flag">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-display font-bold text-patriotWhite mb-4">
            Community Hub
          </h1>
          <p className="text-xl text-textSecondary leading-relaxed">
            Connect with fellow veterans and VMF community members
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(stats).map(([category, count]) => (
            <div
              key={category}
              className="bg-backgroundAccent/30 border border-patriotBlue/30 rounded-lg p-4 text-center"
            >
              <div className="text-2xl font-bold text-patriotWhite">
                {count}
              </div>
              <div className="text-sm text-textSecondary capitalize">
                {category === 'all' ? 'Total Posts' : category}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search posts, authors, or tags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-4">
            <Dropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Category"
            />
            <Dropdown
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
            />
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-patriotWhite">
                Community Posts
              </h2>
              <div className="flex items-center text-textSecondary">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {filteredPosts.length} posts found
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                  />
                ))
              ) : (
                <div className="card text-center py-12">
                  <MessageSquare className="w-16 h-16 text-textSecondary mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-patriotWhite mb-2">
                    No posts found
                  </h3>
                  <p className="text-textSecondary mb-6">
                    {searchTerm || selectedCategory !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to start a conversation!'}
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                </div>
              )}
            </div>

            {/* Load More (placeholder for pagination) */}
            {filteredPosts.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="secondary">Load More Posts</Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CalendarSidebar
              events={allEvents}
              onEventClick={handleEventClick}
            />
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      <Footer />
    </main>
  );
}
