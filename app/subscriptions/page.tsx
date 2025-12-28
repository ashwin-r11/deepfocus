"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowLeft, Users, Loader2, Bell, BellOff, ExternalLink,
  Grid3X3, List, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Subscription {
  id: string
  channelId: string
  title: string
  description: string
  thumbnail: string
  subscriberCount?: string
  videoCount?: string
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchSubscriptions()
    }
  }, [session])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredSubscriptions(
        subscriptions.filter(sub => 
          sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredSubscriptions(subscriptions)
    }
  }, [searchQuery, subscriptions])

  const fetchSubscriptions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/subscriptions")
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.items || [])
        setFilteredSubscriptions(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async (subscriptionId: string) => {
    setUnsubscribingId(subscriptionId)
    try {
      const res = await fetch(`/api/subscriptions?subscriptionId=${subscriptionId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId))
      }
    } catch (error) {
      console.error("Error unsubscribing:", error)
    } finally {
      setUnsubscribingId(null)
    }
  }

  const formatCount = (count?: string) => {
    if (!count) return ""
    const num = parseInt(count)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return count
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Users className="w-12 h-12 text-neutral-600" />
        <h1 className="text-xl text-neutral-400">Sign in to view your subscriptions</h1>
        <Link href="/">
          <Button variant="outline" className="border-neutral-800 hover:bg-neutral-900">
            Go Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-400" />
              <h1 className="text-lg font-semibold text-white">Subscriptions</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">
              {subscriptions.length} channels
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="text-neutral-400 hover:text-white"
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Users className="w-12 h-12 text-neutral-700" />
            <p className="text-neutral-500">
              {searchQuery ? "No channels match your search" : "No subscriptions yet"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="group bg-neutral-950 border border-neutral-900 rounded-xl p-4 hover:border-neutral-800 transition-colors"
              >
                <Link href={`https://youtube.com/channel/${sub.channelId}`} target="_blank">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-neutral-800">
                      {sub.thumbnail && (
                        <Image
                          src={sub.thumbnail}
                          alt={sub.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-neutral-200 line-clamp-1 group-hover:text-white">
                        {sub.title}
                      </h3>
                      {sub.subscriberCount && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatCount(sub.subscriberCount)} subscribers
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="mt-3 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnsubscribe(sub.id)}
                    disabled={unsubscribingId === sub.id}
                    className="text-xs text-neutral-500 hover:text-red-400 hover:bg-red-950/50"
                  >
                    {unsubscribingId === sub.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <BellOff className="w-3 h-3 mr-1" />
                        Unsubscribe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="group bg-neutral-950 border border-neutral-900 rounded-xl p-4 hover:border-neutral-800 transition-colors flex items-center gap-4"
              >
                <Link 
                  href={`https://youtube.com/channel/${sub.channelId}`} 
                  target="_blank"
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                    {sub.thumbnail && (
                      <Image
                        src={sub.thumbnail}
                        alt={sub.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-neutral-200 line-clamp-1 group-hover:text-white">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-1">
                      {sub.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {sub.subscriberCount && (
                        <span className="text-xs text-neutral-600">
                          {formatCount(sub.subscriberCount)} subscribers
                        </span>
                      )}
                      {sub.videoCount && (
                        <span className="text-xs text-neutral-600">
                          {formatCount(sub.videoCount)} videos
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnsubscribe(sub.id)}
                  disabled={unsubscribingId === sub.id}
                  className="text-xs text-neutral-500 hover:text-red-400 hover:bg-red-950/50 flex-shrink-0"
                >
                  {unsubscribingId === sub.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <BellOff className="w-3 h-3 mr-1" />
                      Unsubscribe
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
