'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconFileText,
  IconClock,
  IconLetterCase,
  IconAlignLeft,
  IconTarget,
  IconBook,
  IconList,
  IconTag,
} from '@tabler/icons-react';
import {
  calculateReadability,
  calculateKeywordDensity,
  getContentStats,
  calculateSEOScore,
  getContentRecommendation,
  type ReadabilityResult,
  type KeywordDensity,
  type ContentStats,
  type SEOScore,
} from '@/lib/content-analysis';

interface ContentAnalysisPanelProps {
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  excerpt?: string;
}

export function ContentAnalysisPanel({
  title,
  content,
  seoTitle,
  seoDescription,
  seoKeywords,
  excerpt,
}: ContentAnalysisPanelProps) {
  // Calculate all metrics
  const stats = useMemo<ContentStats>(() => getContentStats(content), [content]);
  const readability = useMemo<ReadabilityResult>(() => calculateReadability(content), [content]);
  const keywordDensities = useMemo<KeywordDensity[]>(() => {
    const keywords = seoKeywords?.split(',').map(k => k.trim()).filter(Boolean) || [];
    return calculateKeywordDensity(content, keywords);
  }, [content, seoKeywords]);
  const seoScore = useMemo<SEOScore>(() => calculateSEOScore({
    title,
    content,
    seoTitle,
    seoDescription,
    seoKeywords,
    excerpt,
  }), [title, content, seoTitle, seoDescription, seoKeywords, excerpt]);
  const contentRec = useMemo(() => getContentRecommendation(stats.wordCount), [stats.wordCount]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: 'good' | 'low' | 'high' | 'excellent' | 'fair' | 'poor') => {
    if (status === 'good' || status === 'excellent') {
      return <IconCheck className="h-4 w-4 text-green-500" />;
    }
    if (status === 'low' || status === 'fair') {
      return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <IconX className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Overall SEO Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconTarget className="h-4 w-4" />
            Overall SEO Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(seoScore.overall)}`}>
              {seoScore.overall}
            </div>
            <div className="flex-1">
              <Progress 
                value={seoScore.overall} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {seoScore.overall >= 70 ? 'Great! Your content is well optimized.' :
                 seoScore.overall >= 40 ? 'Good, but there\'s room for improvement.' :
                 'Needs improvement. Check the suggestions below.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Statistics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconFileText className="h-4 w-4" />
            Content Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <IconLetterCase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{stats.wordCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{stats.readingTime} min</p>
                <p className="text-xs text-muted-foreground">Read time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconAlignLeft className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{stats.paragraphCount}</p>
                <p className="text-xs text-muted-foreground">Paragraphs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{stats.sentenceCount}</p>
                <p className="text-xs text-muted-foreground">Sentences</p>
              </div>
            </div>
          </div>
          
          {/* Content Length Recommendation */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(contentRec.status)}
              <span className="text-sm font-medium">
                {stats.wordCount} / {contentRec.minWords} words
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{contentRec.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Readability */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconBook className="h-4 w-4" />
            Readability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <div className={`text-3xl font-bold ${
              readability.color === 'green' ? 'text-green-600' :
              readability.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {readability.score}
            </div>
            <div>
              <Badge variant={
                readability.color === 'green' ? 'default' :
                readability.color === 'yellow' ? 'secondary' : 'destructive'
              }>
                {readability.grade}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {readability.description}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Avg. sentence: {stats.averageSentenceLength} words • 
            Avg. word: {stats.averageWordLength} chars
          </div>
        </CardContent>
      </Card>

      {/* Keyword Density */}
      {keywordDensities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconTag className="h-4 w-4" />
              Keyword Density
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keywordDensities.map((kd, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(kd.status)}
                    <span className="text-sm">{kd.keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {kd.count} times
                    </span>
                    <Badge variant={
                      kd.status === 'good' ? 'default' :
                      kd.status === 'low' ? 'secondary' : 'destructive'
                    }>
                      {kd.density}%
                    </Badge>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Optimal density: 1-2% • Under 0.5% = too low • Over 3% = keyword stuffing
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Scores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detailed Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Title', ...seoScore.title },
              { label: 'Content', ...seoScore.content },
              { label: 'Keywords', ...seoScore.keywords },
              { label: 'Readability', ...seoScore.readability },
              { label: 'Structure', ...seoScore.structure },
              { label: 'Meta Data', ...seoScore.meta },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{item.label}</span>
                  <span className={`text-sm font-medium ${getScoreColor((item.score / item.maxScore) * 100)}`}>
                    {item.score}/{item.maxScore}
                  </span>
                </div>
                <Progress 
                  value={(item.score / item.maxScore) * 100}
                  className="h-2"
                />
                {item.issues.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-yellow-600 flex items-start gap-1">
                        <IconAlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>SEO Tips:</strong> Use your main keyword in the first paragraph, 
            include internal links, add alt text to images, and break up long paragraphs 
            for better readability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
