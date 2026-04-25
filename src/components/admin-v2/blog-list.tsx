'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconNews,
  IconLoader2,
  IconTrash,
  IconStar,
  IconStarOff,
  IconArchive,
  IconCheck,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title_en: string;
  title_zh: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  view_count: number;
  blog_categories?: { name_en: string; name_cn: string | null } | null;
}

interface Stats {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Draft' },
  published: { color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Published' },
  archived: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Archived' },
};

const ITEMS_PER_PAGE = 15;

export default function BlogList() {
  const router = useRouter();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, published: 0, archived: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; post: BlogPost | null }>({
    open: false,
    post: null,
  });

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/admin/blog?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalCount(data.total || 0);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load blog posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteClick = (post: BlogPost) => {
    setDeleteDialog({ open: true, post });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.post) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const response = await fetch(`/api/admin/blog/${deleteDialog.post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Blog post deleted successfully');
        fetchPosts(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete blog post');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast.error('Failed to delete blog post');
    } finally {
      setDeleteDialog({ open: false, post: null });
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_featured: !post.is_featured,
        }),
      });

      if (response.ok) {
        toast.success(post.is_featured ? 'Post unfeatured' : 'Post featured');
        fetchPosts();
      } else {
        toast.error('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleToggleStatus = async (post: BlogPost, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        toast.success(`Post status changed to ${newStatus}`);
        fetchPosts();
      } else {
        toast.error('Failed to update post status');
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('Failed to update post status');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <IconNews className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <IconNews className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.published / stats.total) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <IconNews className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Unpublished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <IconNews className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </Badge>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = stats[status as keyof Stats] || 0;
              return (
                <Badge 
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  className={`cursor-pointer ${config.bgColor} ${config.color}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {config.label} ({count})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button asChild>
              <Link href="/admin/v2/blog/new">
                <IconPlus className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No blog posts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{post.title_en}</div>
                          <div className="text-xs text-muted-foreground">{post.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.blog_categories?.name_en || post.blog_categories?.name_cn || 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {post.is_featured && <Badge variant="default">Featured</Badge>}
                      </TableCell>
                      <TableCell>
                        {post.view_count}
                      </TableCell>
                      <TableCell>
                        {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/v2/blog/${post.id}/edit`}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <IconEye className="mr-2 h-4 w-4" />
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleFeatured(post)}>
                              {post.is_featured ? (
                                <>
                                  <IconStarOff className="mr-2 h-4 w-4" />
                                  Remove Featured
                                </>
                              ) : (
                                <>
                                  <IconStar className="mr-2 h-4 w-4" />
                                  Mark as Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            {post.status !== 'published' && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(post, 'published')}>
                                <IconCheck className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {post.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(post, 'draft')}>
                                <IconArchive className="mr-2 h-4 w-4" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            {post.status !== 'archived' && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(post, 'archived')}>
                                <IconArchive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDeleteClick(post)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, post: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.post?.title_en}&quot;? This action cannot be undone.
              The post will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
