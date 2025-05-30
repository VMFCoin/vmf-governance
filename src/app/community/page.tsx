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
import { CommunityPost, CalendarEvent } from '@/types';

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-display font-bold text-patriotWhite mb-2">
                Community Hub
              </h1>
              <p className="text-xl text-textSecondary">
                Share ideas, discuss proposals, and engage with the VMF
                community
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 lg:mt-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-patriotBlue mb-1">
                {stats.all}
              </div>
              <div className="text-sm text-textSecondary">Total Posts</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-patriotRed mb-1">
                {stats.idea}
              </div>
              <div className="text-sm text-textSecondary">Ideas</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-starGold mb-1">
                {stats.discussion}
              </div>
              <div className="text-sm text-textSecondary">Discussions</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-patriotBlue mb-1">
                {stats.feedback}
              </div>
              <div className="text-sm text-textSecondary">Feedback</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="card mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textSecondary" />
                    <Input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search posts, authors, or tags..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="md:w-48">
                  <Dropdown
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categoryOptions}
                    placeholder="Category"
                  />
                </div>

                {/* Sort */}
                <div className="md:w-48">
                  <Dropdown
                    value={sortBy}
                    onChange={setSortBy}
                    options={sortOptions}
                    placeholder="Sort by"
                  />
                </div>
              </div>
            </div>

            {/* Posts List */}
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
              events={mockCalendarEvents}
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
