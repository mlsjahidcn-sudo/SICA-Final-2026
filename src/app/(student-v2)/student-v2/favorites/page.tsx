"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconSchool,
  IconBook,
  IconMapPin,
  IconTrophy,
  IconRefresh,
  IconStarFilled
} from "@tabler/icons-react"
import { studentApi, type Favorite } from "@/lib/student-api"

export default function FavoritesPage() {
  const [favorites, setFavorites] = React.useState<Favorite[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchFavorites = React.useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await studentApi.getFavorites()
    
    if (error) {
      // Use mock data for development if unauthorized
      if (error === 'Unauthorized') {
        setFavorites([
          { id: "1", user_id: "user1", entity_id: "uni1", entity_type: "university", created_at: new Date().toISOString(), entity: { id: "uni1", name_en: "Tsinghua University", name_cn: "清华大学", city: "Beijing", province: "Beijing", type: "985", ranking_national: 1 } },
          { id: "2", user_id: "user1", entity_id: "uni2", entity_type: "university", created_at: new Date().toISOString(), entity: { id: "uni2", name_en: "Peking University", name_cn: "北京大学", city: "Beijing", province: "Beijing", type: "985", ranking_national: 2 } },
          { id: "3", user_id: "user1", entity_id: "prog1", entity_type: "program", created_at: new Date().toISOString(), entity: { id: "prog1", name_en: "Computer Science", degree_type: "Master", tuition_per_year: 35000, tuition_currency: "CNY", universities: { id: "uni1", name_en: "Tsinghua University", city: "Beijing" } } },
          { id: "4", user_id: "user1", entity_id: "prog2", entity_type: "program", created_at: new Date().toISOString(), entity: { id: "prog2", name_en: "Data Science", degree_type: "Master", tuition_per_year: 30000, tuition_currency: "CNY", universities: { id: "uni2", name_en: "Peking University", city: "Beijing" } } },
          { id: "5", user_id: "user1", entity_id: "uni3", entity_type: "university", created_at: new Date().toISOString(), entity: { id: "uni3", name_en: "Zhejiang University", name_cn: "浙江大学", city: "Hangzhou", province: "Zhejiang", type: "985", ranking_national: 4 } },
        ])
      } else {
        console.error("Error fetching favorites:", error)
      }
    } else if (data) {
      setFavorites(data.favorites || [])
    }
    
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const universities = favorites.filter(f => f.entity_type === "university")
  const programs = favorites.filter(f => f.entity_type === "program")

  const removeFavorite = async (entityId: string, type: 'university' | 'program') => {
    const { error } = await studentApi.removeFavorite(entityId, type)
    if (error) {
      // Fallback to local state update
      setFavorites(prev => prev.filter(f => f.entity_id !== entityId))
    } else {
      setFavorites(prev => prev.filter(f => f.entity_id !== entityId))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Favorites</h1>
          <p className="text-muted-foreground">
            Universities and programs you&apos;ve saved
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchFavorites()}>
          <IconRefresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Universities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{universities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="universities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="universities">
            <IconSchool className="h-4 w-4 mr-2" />
            Universities ({universities.length})
          </TabsTrigger>
          <TabsTrigger value="programs">
            <IconBook className="h-4 w-4 mr-2" />
            Programs ({programs.length})
          </TabsTrigger>
        </TabsList>

        {/* Universities Tab */}
        <TabsContent value="universities">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : universities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <IconSchool className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No saved universities</h3>
                <p className="text-muted-foreground mb-4">Start exploring and save universities you&apos;re interested in</p>
                <Button asChild>
                  <Link href="/student-v2/universities">
                    Browse Universities
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {universities.map((fav) => (
                <Card key={fav.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconSchool className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{fav.entity?.name_en}</CardTitle>
                          {fav.entity?.name_cn && (
                            <p className="text-sm text-muted-foreground">{fav.entity.name_cn}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-yellow-500"
                        onClick={() => removeFavorite(fav.entity_id, 'university')}
                      >
                        <IconStarFilled className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconMapPin className="h-4 w-4" />
                        <span>{fav.entity?.city}, {fav.entity?.province}</span>
                      </div>
                      {fav.entity?.type && (
                        <Badge variant="outline">{fav.entity.type}</Badge>
                      )}
                      {fav.entity?.ranking_national && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconTrophy className="h-4 w-4 text-yellow-500" />
                          <span>Ranked #{fav.entity.ranking_national} in China</span>
                        </div>
                      )}
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <Link href={`/student-v2/universities/${fav.entity_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : programs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <IconBook className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No saved programs</h3>
                <p className="text-muted-foreground mb-4">Start exploring and save programs you&apos;re interested in</p>
                <Button asChild>
                  <Link href="/student-v2/programs">
                    Browse Programs
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((fav) => (
                <Card key={fav.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconBook className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{fav.entity?.name_en}</CardTitle>
                          {fav.entity?.degree_type && (
                            <Badge variant="outline" className="mt-1">{fav.entity.degree_type}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-yellow-500"
                        onClick={() => removeFavorite(fav.entity_id, 'program')}
                      >
                        <IconStarFilled className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {fav.entity?.universities && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconSchool className="h-4 w-4" />
                          <span>{fav.entity.universities.name_en}</span>
                        </div>
                      )}
                      {fav.entity?.universities?.city && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconMapPin className="h-4 w-4" />
                          <span>{fav.entity.universities.city}</span>
                        </div>
                      )}
                      {fav.entity?.tuition_per_year && (
                        <p className="text-sm font-medium">
                          Tuition: {fav.entity.tuition_currency} {fav.entity.tuition_per_year.toLocaleString()}/year
                        </p>
                      )}
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <Link href={`/student-v2/programs/${fav.entity_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
