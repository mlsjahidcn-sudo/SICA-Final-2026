'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import {
  Heart,
  Loader2,
  ArrowLeft,
  Trash2,
  GraduationCap,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface Program {
  id: string;
  name_en: string;
  name_zh?: string;
  degree_type: string;
  tuition_fee?: number;
  duration?: string;
  universities: {
    id: string;
    name_en: string;
    name_zh?: string;
    logo_url?: string;
  };
}

interface University {
  id: string;
  name_en: string;
  name_zh?: string;
  logo_url?: string;
  city?: string;
  province?: string;
}

interface Favorite {
  id: string;
  item_type: 'program' | 'university';
  item_id: string;
  created_at: string;
  item: Program | University;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'program' | 'university'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        toast.error('Failed to load favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const handleRemove = async (favoriteId: string) => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch(`/api/favorites?id=${favoriteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Removed from favorites');
        setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      } else {
        toast.error('Failed to remove');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove');
    }
  };

  const filteredFavorites = favorites.filter(f => {
    if (activeTab === 'all') return true;
    return f.item_type === activeTab;
  });

  const programCount = favorites.filter(f => f.item_type === 'program').length;
  const universityCount = favorites.filter(f => f.item_type === 'university').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTuition = (fee?: number) => {
    if (!fee) return 'N/A';
    return `¥${(fee / 10000).toFixed(1)}万/year`;
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2 -ml-4">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Favorites</h1>
              <p className="text-muted-foreground mt-1">
                Programs and universities you&apos;ve saved
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                {favorites.length} total
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="program">
              <GraduationCap className="h-4 w-4 mr-1" />
              Programs ({programCount})
            </TabsTrigger>
            <TabsTrigger value="university">
              <Building2 className="h-4 w-4 mr-1" />
              Universities ({universityCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Favorites Grid */}
        {filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">
                {activeTab === 'all' 
                  ? 'No favorites yet' 
                  : `No ${activeTab} favorites`}
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Start exploring and save the programs and universities you like
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/programs">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Browse Programs
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/universities">
                    <Building2 className="h-4 w-4 mr-2" />
                    Browse Universities
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFavorites.map((favorite) => {
              const isProgram = favorite.item_type === 'program';
              const item = favorite.item;
              
              return (
                <Card key={favorite.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {/* Logo/Icon */}
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {'logo_url' in item && item.logo_url ? (
                          <img
                            src={item.logo_url}
                            alt={item.name_en}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          isProgram ? (
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={isProgram ? `/programs/${item.id}` : `/universities/${item.id}`}
                              className="font-semibold hover:text-primary truncate block"
                            >
                              {item.name_en}
                            </Link>
                            {item.name_zh && (
                              <p className="text-sm text-muted-foreground">{item.name_zh}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            {isProgram ? 'Program' : 'University'}
                          </Badge>
                        </div>
                        
                        {/* Program specific info */}
                        {isProgram && 'degree_type' in item && (
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {item.degree_type}
                            </span>
                            {item.duration && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.duration}
                              </span>
                            )}
                            {item.tuition_fee && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatTuition(item.tuition_fee)}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* University specific info */}
                        {!isProgram && 'city' in item && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {[item.city, item.province].filter(Boolean).join(', ') || 'Location not specified'}
                            </span>
                          </div>
                        )}
                        
                        {/* University name for programs */}
                        {isProgram && 'universities' in item && item.universities && (
                          <div className="mt-2">
                            <Link
                              href={`/universities/${item.universities.id}`}
                              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              <Building2 className="h-3 w-3" />
                              {item.universities.name_en}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            Saved {formatDate(favorite.created_at)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemove(favorite.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={isProgram ? `/programs/${item.id}` : `/universities/${item.id}`}>
                                View
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        {favorites.length > 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Explore More</h3>
                  <p className="text-sm text-muted-foreground">
                    Find more programs and universities to add to your favorites
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/programs">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Programs
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/universities">
                      <Building2 className="h-4 w-4 mr-2" />
                      Universities
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
