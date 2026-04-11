import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch university data
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000'}/api/universities/${id}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      // Return default image if university not found
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
              fontFamily: 'sans-serif',
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
    
    const { university } = await res.json();
    
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
            fontFamily: 'sans-serif',
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
              🎓
            </div>
            <div style={{ fontSize: 24, opacity: 0.9 }}>Study in China Academy</div>
          </div>
          
          {/* University Name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              marginBottom: 15,
              maxWidth: '90%',
              lineHeight: 1.2,
            }}
          >
            {university.name_en || university.name}
          </div>
          
          {/* Chinese Name */}
          {university.name_cn && (
            <div
              style={{
                fontSize: 32,
                opacity: 0.9,
                marginBottom: 20,
              }}
            >
              {university.name_cn}
            </div>
          )}
          
          {/* Location & Type */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 20,
            }}
          >
            {university.city && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 22,
                }}
              >
                📍 {university.city}, {university.province}
              </div>
            )}
            {university.type && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 22,
                }}
              >
                🏛️ {university.type}
              </div>
            )}
          </div>
          
          {/* Ranking Badge */}
          {university.ranking_national && (
            <div
              style={{
                position: 'absolute',
                top: 60,
                right: 60,
                backgroundColor: '#f59e0b',
                color: '#1e3a5f',
                padding: '15px 25px',
                borderRadius: 12,
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              #{university.ranking_national} in China
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
            fontFamily: 'sans-serif',
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
