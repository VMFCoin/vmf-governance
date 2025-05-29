'use client';

import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Share2,
  Flag,
} from 'lucide-react';
import { CommunityPost } from '@/types';
import { Card } from '@/components/ui';

interface CommunityPostCardProps {
  post: CommunityPost;
  onVote?: (postId: string, voteType: 'up' | 'down') => void;
}

export function CommunityPostCard({ post, onVote }: CommunityPostCardProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(
    post.userVote || null
  );
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);

  const handleVote = (voteType: 'up' | 'down') => {
    if (userVote === voteType) {
      // Remove vote
      setUserVote(null);
      if (voteType === 'up') {
        setUpvotes(prev => prev - 1);
      } else {
        setDownvotes(prev => prev - 1);
      }
    } else {
      // Change or add vote
      if (userVote) {
        // Changing vote
        if (userVote === 'up') {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev - 1);
          setUpvotes(prev => prev + 1);
        }
      } else {
        // Adding new vote
        if (voteType === 'up') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
      }
      setUserVote(voteType);
    }

    onVote?.(post.id, voteType);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'idea':
        return 'bg-patriotBlue text-patriotWhite';
      case 'discussion':
        return 'bg-patriotRed text-patriotWhite';
      case 'feedback':
        return 'bg-starGold text-backgroundDark';
      case 'announcement':
        return 'bg-backgroundAccent text-patriotWhite';
      default:
        return 'bg-backgroundLight text-textBase';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-lg ${post.isPromoted ? 'ring-2 ring-starGold/30' : ''}`}
    >
      {post.isPromoted && (
        <div className="flex items-center mb-3">
          <Flag className="w-4 h-4 text-starGold mr-2" />
          <span className="text-sm text-starGold font-medium">
            Promoted Post
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-patriotBlue rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-patriotWhite">
              {post.author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-patriotWhite">{post.author}</h4>
            <p className="text-sm text-textSecondary">
              {formatTimeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}
        >
          {post.category}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-patriotWhite mb-2">
        {post.title}
      </h3>
      <p className="text-textSecondary mb-4 leading-relaxed">{post.content}</p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-backgroundAccent text-textBase text-xs rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-patriotBlue/30">
        <div className="flex items-center space-x-4">
          {/* Voting */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVote('up')}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                userVote === 'up'
                  ? 'bg-patriotBlue text-patriotWhite'
                  : 'text-textSecondary hover:text-patriotWhite hover:bg-backgroundAccent'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm">{upvotes}</span>
            </button>

            <button
              onClick={() => handleVote('down')}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                userVote === 'down'
                  ? 'bg-patriotRed text-patriotWhite'
                  : 'text-textSecondary hover:text-patriotWhite hover:bg-backgroundAccent'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
              <span className="text-sm">{downvotes}</span>
            </button>
          </div>

          {/* Comments */}
          <button className="flex items-center space-x-1 text-textSecondary hover:text-patriotWhite transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Reply</span>
          </button>

          {/* Share */}
          <button className="flex items-center space-x-1 text-textSecondary hover:text-patriotWhite transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>

        <div className="text-xs text-textSecondary">
          {Math.round((upvotes / (upvotes + downvotes)) * 100) || 0}% upvoted
        </div>
      </div>
    </Card>
  );
}
