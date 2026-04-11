import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Fetch blog post data
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/blog/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      // Return default image if post not found
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e3a5f',
              color: 'white',
              padding: '40px',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 20 }}>
              Study in China Academy
            </div>
            <div style={{ fontSize: 30, opacity: 0.8 }}>
              Your Gateway to Chinese Universities
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }
    
    const { post } = await res.json();
    
    // Format date
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#1e3a5f',
            color: 'white',
            padding: '60px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 30,
            }}
          >
            <div
              style={{
                backgroundColor: '#f59e0b',
                borderRadius: '50%',
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
                fontSize: 24,
              }}
            >
              📝
            </div>
            <div style={{ fontSize: 24, opacity: 0.9 }}>Study in China Academy Blog</div>
          </div>
          
          {/* Category Badge */}
          {post.category?.name && (
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 18,
                marginBottom: 20,
              }}
            >
              {post.category.name}
            </div>
          )}
          
          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 'bold',
              marginBottom: 20,
              maxWidth: '90%',
              lineHeight: 1.2,
            }}
          >
            {post.title}
          </div>
          
          {/* Excerpt */}
          {post.excerpt && (
            <div
              style={{
                fontSize: 24,
                opacity: 0.8,
                maxWidth: '85%',
                lineHeight: 1.4,
                marginBottom: 20,
              }}
            >
              {post.excerpt.length > 150 ? post.excerpt.slice(0, 150) + '...' : post.excerpt}
            </div>
          )}
          
          {/* Author & Date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginTop: 'auto',
            }}
          >
            {post.author?.name && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 20,
                }}
              >
                By {post.author.name}
              </div>
            )}
            {post.publishedAt && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 20,
                  opacity: 0.8,
                }}
              >
                {formatDate(post.publishedAt)}
              </div>
            )}
            {post.readingTime && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 20,
                  opacity: 0.8,
                }}
              >
                {post.readingTime} min read
              </div>
            )}
          </div>
          
          {/* FAQ Badge */}
          {post.faqs && post.faqs.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 60,
                right: 60,
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 'bold',
              }}
            >
              {post.faqs.length} FAQs
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return default image on error
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e3a5f',
            color: 'white',
            padding: '40px',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 20 }}>
            Study in China Academy
          </div>
          <div style={{ fontSize: 30, opacity: 0.8 }}>
            Your Gateway to Chinese Universities
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
