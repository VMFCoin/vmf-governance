'use client';

import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { CommunityPost } from '@/types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    post: Omit<
      CommunityPost,
      'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'userVote'
    >
  ) => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'idea' as CommunityPost['category'],
    tags: [] as string[],
    currentTag: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    {
      value: 'idea',
      label: 'Idea',
      description: 'Suggest new features or improvements',
    },
    {
      value: 'discussion',
      label: 'Discussion',
      description: 'Start a conversation about VMF topics',
    },
    {
      value: 'feedback',
      label: 'Feedback',
      description: 'Share your thoughts on existing features',
    },
    {
      value: 'announcement',
      label: 'Announcement',
      description: 'Share important community news',
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    } else if (formData.content.length > 1000) {
      newErrors.content = 'Content must be less than 1000 characters';
    }

    if (formData.tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    const tag = formData.currentTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        currentTag: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const newPost: Omit<
      CommunityPost,
      'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'userVote'
    > = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category,
      tags: formData.tags,
      author: 'You', // This would come from wallet connection
      authorAddress: '0x1234...5678', // This would come from wallet connection
      isPromoted: false,
    };

    onSubmit(newPost);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      category: 'idea',
      tags: [],
      currentTag: '',
    });
    setErrors({});
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'idea':
        return 'border-patriotBlue bg-patriotBlue/10';
      case 'discussion':
        return 'border-patriotRed bg-patriotRed/10';
      case 'feedback':
        return 'border-starGold bg-starGold/10';
      case 'announcement':
        return 'border-backgroundAccent bg-backgroundAccent/10';
      default:
        return 'border-backgroundLight bg-backgroundLight/10';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-patriotWhite">
            Create Community Post
          </h2>
          <button
            onClick={handleClose}
            className="text-textSecondary hover:text-patriotWhite transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-patriotWhite mb-2">
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter a descriptive title for your post..."
              error={errors.title}
              maxLength={100}
            />
            <div className="flex justify-between text-xs text-textSecondary mt-1">
              <span>{errors.title || 'Make it clear and engaging'}</span>
              <span>{formData.title.length}/100</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-patriotWhite mb-3">
              Category *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map(category => (
                <label
                  key={category.value}
                  className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.category === category.value
                      ? getCategoryColor(category.value)
                      : 'border-backgroundLight bg-backgroundLight/5 hover:border-backgroundAccent'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.value}
                    checked={formData.category === category.value}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        category: e.target.value as CommunityPost['category'],
                      }))
                    }
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-patriotWhite">
                      {category.label}
                    </div>
                    <div className="text-xs text-textSecondary mt-1">
                      {category.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-patriotWhite mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={e =>
                setFormData(prev => ({ ...prev, content: e.target.value }))
              }
              placeholder="Share your thoughts, ideas, or feedback with the community..."
              rows={6}
              maxLength={1000}
              className="w-full bg-backgroundLight border border-patriotBlue text-textBase rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent resize-none"
            />
            <div className="flex justify-between text-xs text-textSecondary mt-1">
              <span>{errors.content || 'Be clear and constructive'}</span>
              <span>{formData.content.length}/1000</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-patriotWhite mb-2">
              Tags (Optional)
            </label>
            <div className="flex space-x-2 mb-3">
              <Input
                value={formData.currentTag}
                onChange={e =>
                  setFormData(prev => ({ ...prev, currentTag: e.target.value }))
                }
                placeholder="Add a tag..."
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                maxLength={20}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="secondary"
                size="sm"
                disabled={
                  !formData.currentTag.trim() || formData.tags.length >= 5
                }
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-backgroundAccent text-textBase text-xs rounded-md"
                  >
                    <Tag className="w-3 h-3 mr-1" />#{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-textSecondary hover:text-patriotRed"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="text-xs text-textSecondary">
              {errors.tags ||
                `${formData.tags.length}/5 tags used. Tags help others find your post.`}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-patriotBlue/30">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Post</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
