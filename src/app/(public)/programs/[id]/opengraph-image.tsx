import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch program data
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/programs/${id}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      // Return default image if program not found
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
    
    const { program } = await res.json();
    
    // Format tuition fee
    const formatTuition = (fee: number, currency: string) => {
      if (!fee) return null;
      return `${currency === 'CNY' ? '¥' : '$'}${fee.toLocaleString()}/year`;
    };
    
    // Get degree level badge color
    const getDegreeColor = (level: string) => {
      switch (level?.toLowerCase()) {
        case 'bachelor':
        case 'undergraduate':
          return '#22c55e'; // green
        case 'master':
        case 'graduate':
          return '#3b82f6'; // blue
        case 'phd':
        case 'doctoral':
          return '#8b5cf6'; // purple
        default:
          return '#f59e0b'; // amber
      }
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
              📚
            </div>
            <div style={{ fontSize: 24, opacity: 0.9 }}>Study in China Academy</div>
          </div>
          
          {/* Degree Level Badge */}
          {program.degree_level && (
            <div
              style={{
                backgroundColor: getDegreeColor(program.degree_level),
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 20,
                textTransform: 'uppercase',
              }}
            >
              {program.degree_level}
            </div>
          )}
          
          {/* Program Name */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              marginBottom: 15,
              maxWidth: '90%',
              lineHeight: 1.2,
            }}
          >
            {program.name}
          </div>
          
          {/* University */}
          {program.university_name && (
            <div
              style={{
                fontSize: 28,
                opacity: 0.9,
                marginBottom: 20,
              }}
            >
              🎓 {program.university_name}
            </div>
          )}
          
          {/* Key Details */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 20,
              flexWrap: 'wrap',
            }}
          >
            {program.tuition_fee && (
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
                💰 {formatTuition(program.tuition_fee, program.currency || 'CNY')}
              </div>
            )}
            {program.duration_years && (
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
                ⏱️ {program.duration_years} Years
              </div>
            )}
            {program.language && (
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
                🌐 {program.language}
              </div>
            )}
          </div>
          
          {/* Scholarship Badge */}
          {program.scholarship_available && (
            <div
              style={{
                position: 'absolute',
                top: 60,
                right: 60,
                backgroundColor: '#22c55e',
                color: 'white',
                padding: '15px 25px',
                borderRadius: 12,
                fontSize: 22,
                fontWeight: 'bold',
              }}
            >
              ✅ Scholarship Available
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
