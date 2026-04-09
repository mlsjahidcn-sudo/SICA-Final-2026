'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  itemType: 'program' | 'university';
  itemId: string;
  showText?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function FavoriteButton({
  itemType,
  itemId,
  showText = true,
  size = 'default',
  variant = 'outline',
  className = '',
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkFavoriteStatus();
  }, [itemType, itemId]);

  const checkFavoriteStatus = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      if (!token) {
        setIsChecking(false);
        return;
      }

      const response = await fetch(`/api/favorites?type=${itemType}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const favorite = data.favorites?.find(
          (f: { item_id: string }) => f.item_id === itemId
        );
        if (favorite) {
          setIsFavorited(true);
          setFavoriteId(favorite.id);
        }
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleFavorite = async () => {
    const token = localStorage.getItem('sica_auth_token');
    if (!token) {
      toast.error('Please login to add favorites');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited && favoriteId) {
        // Remove favorite
        const response = await fetch(`/api/favorites?id=${favoriteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          setIsFavorited(false);
          setFavoriteId(null);
          toast.success('Removed from favorites');
        } else {
          toast.error('Failed to remove');
        }
      } else {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            item_type: itemType,
            item_id: itemId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorited(true);
          setFavoriteId(data.favorite?.id);
          toast.success('Added to favorites');
        } else {
          const error = await response.json();
          if (error.error === 'Already favorited') {
            toast.info('Already in favorites');
          } else {
            toast.error('Failed to add');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`${className} ${isFavorited ? 'text-red-500 hover:text-red-600' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={`${showText ? 'mr-2' : ''} ${isFavorited ? 'fill-current' : ''}`}
        />
      )}
      {showText && (isFavorited ? 'Saved' : 'Save')}
    </Button>
  );
}
